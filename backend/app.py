from flask import Flask, jsonify, request
from flask_cors import CORS
from db.database import engine, Base, SessionLocal
from db.models import AIStats
from ai.neural_net import get_model
from ai.mcts import MCTS
import chess
import os
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

# Initialize DB
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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
