from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
from db.database import engine, Base, SessionLocal
from db.models import AIStats
from ai.neural_net import ChessAlphaZeroNet
from ai.mcts import MCTS
from chess_engine.board import ChessBoard
from ai.trainer import AlphaZeroTrainer

import os
import torch
import random
import numpy as np

# Initialize Flask
app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    response.headers['Access-Control-Allow-Private-Network'] = 'true'
    return response


# Initialize DB
Base.metadata.create_all(bind=engine)

# Load AI
net = ChessAlphaZeroNet()
trainer = AlphaZeroTrainer(net)
if os.path.exists("D:/chess-ai/backend/models/checkpoint.pt"):
    trainer.load_checkpoint()
else:
    # Save initial untrained model
    trainer.save_checkpoint()

mcts = MCTS(net, num_simulations=400) # Reduced for API response time

@app.route('/api/stats', methods=['GET'])
def get_stats():
    db = SessionLocal()
    stats = db.query(AIStats).first()
    if not stats:
        stats = AIStats(elo=1200, games_played=0, win_rate=0.0)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    db.close()
    return jsonify({
        "elo": stats.elo,
        "games_played": stats.games_played,
        "win_rate": stats.win_rate,
        "checkpoint_version": stats.checkpoint_version
    })

@app.route('/api/move', methods=['POST'])
def get_ai_move():
    data = request.json
    fen = data.get('fen')
    if not fen:
        return jsonify({"error": "FEN is required"}), 400
        
    board = ChessBoard(fen)
    if board.is_game_over():
        return jsonify({"error": "Game is over"}), 400
        
    # Get MCTS action
    # We turn off exploration noise for competitive play against the user
    action_probs = mcts.search(board, add_noise=False)
    
    if not action_probs:
         # Fallback to random if MCTS fails
         moves = board.get_legal_moves_uci()
         best_move = random.choice(moves) if moves else None
    else:
        # Choose the move with the highest visit count
        best_move = max(action_probs, key=action_probs.get)
        
    return jsonify({"move": best_move})

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)
