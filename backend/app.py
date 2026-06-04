from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from db.database import engine, Base, SessionLocal, init_all_models
from db.models import AIStats
from db.monitor_models import TrainingCycle, SelfPlayGame, MoveHeatmapData
from ai.neural_net import get_model, MOVE_TO_IDX
from ai.mcts import MCTS
from ai.monitor_state import get_status, get_cycle, get_logs
import chess
import os
import json
import time as _time
import torch

# Initialize Flask
app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    response.headers['Access-Control-Allow-Private-Network'] = 'true'
    return response

# Initialize DB (including monitor tables)
init_all_models()
Base.metadata.create_all(bind=engine)

# Checkpoint path (works both locally and on cloud)
CHECKPOINT_PATH = os.path.join(os.path.dirname(__file__), 'models', 'checkpoint.pt')

# Load AI model
net = get_model(CHECKPOINT_PATH)

@app.route('/api/stats', methods=['GET'])
def get_stats():
    db = SessionLocal()
    stats = db.query(AIStats).first()
    if not stats:
        stats = AIStats(elo=1200, games_played=0, win_rate=0.0)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    
    buffer_size = 0
    if os.path.exists(CHECKPOINT_PATH):
        try:
            ckpt = torch.load(CHECKPOINT_PATH, map_location='cpu', weights_only=False)
            buffer_size = ckpt.get('buffer_size', 0)
        except:
            pass
        
    db.close()
    return jsonify({
        "elo": stats.elo,
        "games_played": stats.games_played,
        "win_rate": stats.win_rate,
        "checkpoint_version": stats.checkpoint_version,
        "buffer_size": buffer_size
    })

@app.route('/api/move', methods=['POST', 'OPTIONS'])
def get_ai_move():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    data = request.json
    fen = data.get('fen')
    if not fen:
        return jsonify({"error": "FEN is required"}), 400
        
    board = chess.Board(fen)
    if board.is_game_over():
        return jsonify({"error": "Game is over"}), 400
        
    move_number = board.fullmove_number
    temperature = 0.5 if move_number < 15 else 0.1
    simulations = 30
    
    mcts = MCTS(net, simulations=simulations, temperature=temperature)
    best_move = mcts.get_move(board)
        
    return jsonify({"move": best_move})

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})


# ---- Monitor Dashboard Endpoints ----

@app.route('/api/monitor/stats', methods=['GET'])
def monitor_stats():
    """Full dashboard stats payload."""
    db = SessionLocal()
    try:
        # Loss / ELO history from TrainingCycle
        cycles = db.query(TrainingCycle).order_by(TrainingCycle.cycle_number.asc()).all()
        loss_history = []
        elo_history = []
        for c in cycles:
            loss_history.append({
                "cycle": c.cycle_number,
                "total_loss": c.total_loss,
                "policy_loss": c.policy_loss,
                "value_loss": c.value_loss,
            })
            elo_history.append({
                "cycle": c.cycle_number,
                "elo": c.elo,
            })

        # Latest cycle info
        latest = cycles[-1] if cycles else None

        # Recent self-play games
        recent_games = (
            db.query(SelfPlayGame)
            .order_by(SelfPlayGame.id.desc())
            .limit(50)
            .all()
        )
        games_list = [{
            "id": g.id,
            "cycle": g.cycle_number,
            "game": g.game_number,
            "moves": g.moves,
            "result": g.result,
            "time": g.time_seconds,
        } for g in recent_games]

        # Win / Draw / Loss totals
        total_wins = sum(c.wins for c in cycles)
        total_draws = sum(c.draws for c in cycles)
        total_losses = sum(c.losses for c in cycles)

        # Heatmap (8x8 matrix)
        heatmap_rows = db.query(MoveHeatmapData).all()
        heatmap = [[0] * 8 for _ in range(8)]
        for h in heatmap_rows:
            row = h.square_index // 8
            col = h.square_index % 8
            heatmap[row][col] = h.visit_count

        return jsonify({
            "status": get_status(),
            "current_cycle": get_cycle(),
            "elo": latest.elo if latest else 800,
            "buffer_size": latest.buffer_size if latest else 0,
            "total_cycles": len(cycles),
            "total_games": total_wins + total_draws + total_losses,
            "wins": total_wins,
            "draws": total_draws,
            "losses": total_losses,
            "loss_history": loss_history,
            "elo_history": elo_history,
            "recent_games": games_list,
            "heatmap": heatmap,
            "latest_loss": latest.total_loss if latest else 0.0,
            "latest_policy_loss": latest.policy_loss if latest else 0.0,
            "latest_value_loss": latest.value_loss if latest else 0.0,
        })
    finally:
        db.close()


@app.route('/api/monitor/live', methods=['GET'])
def monitor_live():
    """SSE endpoint for live log streaming."""
    def generate():
        last_id = 0
        while True:
            logs = get_logs()
            for log in logs:
                if log['id'] > last_id:
                    last_id = log['id']
                    yield f"data: {json.dumps(log)}\n\n"
            _time.sleep(1)
    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'},
    )


@app.route('/api/monitor/architecture', methods=['GET'])
def monitor_architecture():
    """Return neural net architecture info."""
    return jsonify({
        "input_channels": 19,
        "board_size": "8x8",
        "res_blocks": 6,
        "channels": 128,
        "policy_output": len(MOVE_TO_IDX),
        "value_output": 1,
        "total_params": sum(p.numel() for p in net.parameters()),
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
