import os
import time
import torch
from ai.neural_net import get_model, MOVE_TO_IDX
from ai.self_play import self_play_game, load_replay_buffer, save_replay_buffer, train_model, CHECKPOINT_PATH

def train():
    print("=" * 60)
    print("  AlphaZero Self-Play Training Pipeline")
    print("=" * 60)
    
    # Load or create model
    model = get_model(CHECKPOINT_PATH)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)
    
    # Load optimizer state if checkpoint exists
    if os.path.exists(CHECKPOINT_PATH):
        try:
            ckpt = torch.load(CHECKPOINT_PATH, map_location='cpu', weights_only=False)
            if 'optimizer_state_dict' in ckpt:
                optimizer.load_state_dict(ckpt['optimizer_state_dict'])
                print("[Init] Loaded optimizer from checkpoint")
        except Exception as e:
            print(f"[Init] Starting fresh optimizer: {e}")
    
    buffer = load_replay_buffer()
    print(f"[Init] Replay buffer size: {len(buffer)}")
    print(f"[Init] Policy output size: {len(MOVE_TO_IDX)} moves")
    print(f"[Init] Device: CPU")
    print()

    games_per_iteration = 3    # Self-play games per cycle
    train_steps = 50           # Gradient steps per cycle
    batch_size = 64            # Smaller batch for faster start
    mcts_sims = 10             # Low sims = fast games (~2-3 min each)
    iteration = 0

    print("[Mode] CONTINUOUS training — runs forever until you close this window")
    print("[Tip]  Press Ctrl+C anytime to stop safely\n")

    while True:
        iteration += 1
        print(f"\n{'='*60}")
        print(f"  CYCLE {iteration} (running forever...)")
        print(f"{'='*60}")
        
        # ---- Phase 1: Self-Play ----
        print(f"\n[Phase 1] Self-Play: generating {games_per_iteration} games...")
        for game_num in range(1, games_per_iteration + 1):
            t0 = time.time()
            game_data = self_play_game(model, simulations=mcts_sims)
            elapsed = time.time() - t0
            buffer.extend(game_data)
            print(f"  Game {game_num}/{games_per_iteration} | "
                  f"Moves: {len(game_data)} | "
                  f"Time: {elapsed:.1f}s | "
                  f"Buffer: {len(buffer)}")

        save_replay_buffer(buffer)
        print(f"\n[Phase 1] Done. Buffer saved ({len(buffer)} positions)")

        # ---- Phase 2: Training ----
        if len(buffer) >= batch_size:
            print(f"\n[Phase 2] Training neural network ({train_steps} steps)...")
            model = train_model(model, optimizer, buffer, 
                              batch_size=batch_size, steps=train_steps)
            
            # Save checkpoint
            os.makedirs(os.path.dirname(CHECKPOINT_PATH), exist_ok=True)
            torch.save({
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'buffer_size': len(buffer),
                'iteration': iteration,
            }, CHECKPOINT_PATH)
            print(f"[Phase 2] Checkpoint saved (cycle {iteration})")
        else:
            print(f"\n[Phase 2] Skipped — need {batch_size} positions, have {len(buffer)}")

        print(f"\n  Summary: Buffer={len(buffer)} | Cycles completed={iteration}")

    print("\n" + "=" * 60)
    print("  Training complete!")
    print("=" * 60)

if __name__ == '__main__':
    train()
