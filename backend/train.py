import os
import torch
from ai.neural_net import ChessAlphaZeroNet
from ai.trainer import AlphaZeroTrainer
from ai.replay_buffer import ReplayBuffer
from ai.self_play import execute_episode
from db.database import SessionLocal
from db.models import AIStats

def train():
    print("Initializing AlphaZero Training Pipeline...")
    
    # Initialize components
    net = ChessAlphaZeroNet()
    trainer = AlphaZeroTrainer(net)
    buffer = ReplayBuffer(capacity=50000) # Reduced capacity for local training memory constraints
    
    # Load existing checkpoint if available
    checkpoint_path = "D:/chess-ai/backend/models/checkpoint.pt"
    if os.path.exists(checkpoint_path):
        print("Loading existing model checkpoint...")
        trainer.load_checkpoint(filepath=checkpoint_path)
    else:
        print("No checkpoint found. Starting with random weights.")
        trainer.save_checkpoint(filepath=checkpoint_path)
        
    num_iterations = 1000
    episodes_per_iteration = 10
    batch_size = 256
    
    db = SessionLocal()
    stats = db.query(AIStats).first()
    if not stats:
        stats = AIStats(elo=1200, games_played=0, win_rate=0.0)
        db.add(stats)
        db.commit()

    print(f"Starting training on device: {trainer.device}")
    
    for iteration in range(num_iterations):
        print(f"\n--- Iteration {iteration + 1}/{num_iterations} ---")
        
        # 1. Self-Play Phase
        print(f"Starting Self-Play ({episodes_per_iteration} games)...")
        for episode in range(episodes_per_iteration):
            # We use 100 simulations for speed during local testing (AlphaZero used 800)
            game_history = execute_episode(net, num_mcts_sims=50) 
            buffer.save_game(game_history)
            
            stats.games_played += 1
            if (episode + 1) % 2 == 0:
                print(f"  Completed {episode + 1}/{episodes_per_iteration} games. Buffer size: {len(buffer)}")
                
        db.commit()

        # 2. Training Phase
        if len(buffer) >= batch_size:
            print("Starting Network Training...")
            # Train for a few epochs on the newly gathered data
            for epoch in range(5): 
                states, policies, values = buffer.sample_batch(batch_size=batch_size)
                total_loss, pi_loss, v_loss = trainer.train_step(states, policies, values)
                
            print(f"  Training Loss: Total={total_loss:.4f}, Policy={pi_loss:.4f}, Value={v_loss:.4f}")
            
            # Save checkpoint
            print("Saving new model checkpoint...")
            trainer.save_checkpoint(filepath=checkpoint_path)
            stats.checkpoint_version += 1
            db.commit()
        else:
            print(f"Not enough data to train yet. Need {batch_size}, have {len(buffer)}.")
            
if __name__ == "__main__":
    train()
