import chess
import numpy as np
import torch
import torch.nn.functional as F
from .mcts import MCTS
from .neural_net import board_to_tensor, MOVE_TO_IDX, get_model
import os
import pickle
import time
import threading

REPLAY_BUFFER_PATH = "D:/chess-ai/backend/models/replay_buffer.pkl"
CHECKPOINT_PATH    = "D:/chess-ai/backend/models/checkpoint.pt"
MAX_BUFFER_SIZE    = 100_000

# Global lock to prevent simultaneous training and file corruption
training_lock = threading.Lock()
is_training_active = False

def self_play_game(model, simulations=150, verbose=True):
    """Play one full game, return (training_data, game_metadata).
    
    training_data: list of (tensor, policy, value) tuples
    game_metadata: dict with 'moves', 'result', 'move_squares' (to-square indices)
    """
    board    = chess.Board()
    mcts     = MCTS(model, simulations=simulations, temperature=1.0)
    history  = []  # (board_tensor, move_probs)
    move_count = 0
    move_squares = []  # destination square indices for heatmap

    while not board.is_game_over() and move_count < 200:
        tensor    = board_to_tensor(board)
        
        # Build policy vector from visit counts
        policy = np.zeros(len(MOVE_TO_IDX), dtype=np.float32)
        children = mcts._get_root_children(board)
        
        for uci, node in children:
            idx = MOVE_TO_IDX.get(uci, 0)
            policy[idx] = node.visits
        
        if policy.sum() > 0:
            policy /= policy.sum()
            
        # Get the actual move MCTS chose
        visits = {uci: node.visits for uci, node in children}
        if mcts.temperature == 0 or not visits:
            move_uci = max(visits, key=visits.get)
        else:
            visit_arr = np.array(list(visits.values()), dtype=np.float64)
            visit_arr = visit_arr ** (1.0 / mcts.temperature)
            total_visits = visit_arr.sum()
            if total_visits > 0:
                probs = visit_arr / total_visits
                probs = probs / np.sum(probs)
                move_uci = np.random.choice(list(visits.keys()), p=probs)
            else:
                move_uci = np.random.choice(list(visits.keys()))

        history.append((tensor, policy))
        move_obj = chess.Move.from_uci(move_uci)
        move_squares.append(move_obj.to_square)  # track destination square (0-63)
        board.push(move_obj)
        move_count += 1

        # Print each move so user can watch
        if verbose:
            side = "White" if not board.turn else "Black"  # flipped because we already pushed
            print(f"    Move {move_count}: {side} plays {move_uci}", end="\r")

        # Cool down temperature after move 30 for stronger endgame
        if move_count == 30:
            mcts.temperature = 0.1

    if verbose:
        result = board.result()
        print(f"    Game finished in {move_count} moves — Result: {result}          ")

    # Assign outcomes
    result   = board.result()
    outcome  = 0.0
    if result == "1-0":   outcome = 1.0
    elif result == "0-1": outcome = -1.0

    training_data = []
    for i, (tensor, policy) in enumerate(history):
        # Alternate value sign for each player
        value = outcome * (1 if i % 2 == 0 else -1)
        training_data.append((tensor, policy, value))

    game_metadata = {
        "moves": move_count,
        "result": result,
        "move_squares": move_squares,
    }

    return training_data, game_metadata

def load_replay_buffer():
    if os.path.exists(REPLAY_BUFFER_PATH):
        with open(REPLAY_BUFFER_PATH, 'rb') as f:
            return pickle.load(f)
    return []

def save_replay_buffer(buffer):
    os.makedirs(os.path.dirname(REPLAY_BUFFER_PATH), exist_ok=True)
    with open(REPLAY_BUFFER_PATH, 'wb') as f:
        pickle.dump(buffer[-MAX_BUFFER_SIZE:], f)

def train_model(model, optimizer, replay_buffer, batch_size=256, steps=100):
    """Train on replay buffer."""
    if len(replay_buffer) < batch_size:
        print(f"[Train] Not enough data yet: {len(replay_buffer)}/{batch_size}")
        return model

    model.train()
    total_loss = 0.0

    for step in range(steps):
        indices = np.random.choice(len(replay_buffer), batch_size, replace=False)
        batch   = [replay_buffer[i] for i in indices]

        tensors  = torch.cat([b[0] for b in batch])           # (B, 19, 8, 8)
        policies = torch.FloatTensor(np.array([b[1] for b in batch]))   # (B, 4672)
        values   = torch.FloatTensor(np.array([b[2] for b in batch])).unsqueeze(1)  # (B, 1)

        policy_logits, value_preds = model(tensors)

        policy_loss = F.cross_entropy(policy_logits, policies)
        value_loss  = F.mse_loss(value_preds, values)
        loss        = policy_loss + value_loss

        optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()

        total_loss += loss.item()

    model.eval()
    avg_loss = total_loss / steps
    print(f"[Train] Steps: {steps} | Avg Loss: {avg_loss:.4f}")
    return model

def run_self_play_cycle(games_per_cycle=3, train_steps=100):
    """
    Full cycle: generate games → add to buffer → train → save checkpoint.
    """
    global is_training_active
    
    if not training_lock.acquire(blocking=False):
        print("[SelfPlay] Training is already running. Skipping trigger.")
        return
        
    is_training_active = True
    try:
        model = get_model(CHECKPOINT_PATH)
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)

        if os.path.exists(CHECKPOINT_PATH):
            try:
                ckpt = torch.load(CHECKPOINT_PATH, map_location='cpu', weights_only=False)
                if 'optimizer_state_dict' in ckpt:
                    optimizer.load_state_dict(ckpt['optimizer_state_dict'])
            except Exception as e:
                pass

        buffer = load_replay_buffer()
        print(f"[SelfPlay] Buffer size: {len(buffer)} | Generating {games_per_cycle} games...")

        for game_num in range(games_per_cycle):
            t0   = time.time()
            data, _meta = self_play_game(model, simulations=100) # Fast sim for local PC
            buffer.extend(data)
            print(f"[SelfPlay] Game {game_num+1} done in {time.time()-t0:.1f}s | "
                  f"Positions: {len(data)} | Buffer: {len(buffer)}")

        save_replay_buffer(buffer)
        model = train_model(model, optimizer, buffer, batch_size=256, steps=train_steps)

        os.makedirs(os.path.dirname(CHECKPOINT_PATH), exist_ok=True)
        torch.save({
            'model_state_dict':     model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'buffer_size':          len(buffer),
        }, CHECKPOINT_PATH)
        
        # Update DB stats
        try:
            from db.database import SessionLocal
            from db.models import AIStats
            db = SessionLocal()
            stats = db.query(AIStats).first()
            if stats:
                stats.checkpoint_version += 1
                stats.games_played += games_per_cycle
                db.commit()
            db.close()
        except:
            pass
            
        print(f"[SelfPlay] Checkpoint saved. Cycle complete.")
    finally:
        is_training_active = False
        training_lock.release()

def start_training_thread():
    """Starts a background thread for training without blocking the API"""
    if not is_training_active:
        thread = threading.Thread(target=run_self_play_cycle, args=(3, 100))
        thread.daemon = True
        thread.start()
        return True
    return False
