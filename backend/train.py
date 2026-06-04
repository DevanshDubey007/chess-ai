import os
import time
import torch
from ai.neural_net import get_model, MOVE_TO_IDX
from ai.self_play import self_play_game, load_replay_buffer, save_replay_buffer, train_model, CHECKPOINT_PATH
from ai.monitor_state import log_message, set_status, set_cycle
from db.database import SessionLocal, Base, engine, init_all_models
from db.monitor_models import TrainingCycle, SelfPlayGame, MoveHeatmapData


def _update_heatmap(db, move_squares):
    """Increment visit counts for destination squares in the heatmap table."""
    for sq in move_squares:
        row = db.query(MoveHeatmapData).filter_by(square_index=sq).first()
        if row:
            row.visit_count += 1
        else:
            row = MoveHeatmapData(square_index=sq, visit_count=1)
            db.add(row)
    db.commit()


def train():
    # Ensure all monitor tables exist
    init_all_models()
    Base.metadata.create_all(bind=engine)

    log_message("=" * 60)
    log_message("  AlphaZero Self-Play Training Pipeline")
    log_message("=" * 60)

    # Load or create model
    model = get_model(CHECKPOINT_PATH)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)

    # Load optimizer state if checkpoint exists
    if os.path.exists(CHECKPOINT_PATH):
        try:
            ckpt = torch.load(CHECKPOINT_PATH, map_location='cpu', weights_only=False)
            if 'optimizer_state_dict' in ckpt:
                optimizer.load_state_dict(ckpt['optimizer_state_dict'])
                log_message("[Init] Loaded optimizer from checkpoint")
        except Exception as e:
            log_message(f"[Init] Starting fresh optimizer: {e}")

    buffer = load_replay_buffer()
    log_message(f"[Init] Replay buffer size: {len(buffer)}")
    log_message(f"[Init] Policy output size: {len(MOVE_TO_IDX)} moves")
    log_message(f"[Init] Device: CPU")
    log_message("")

    games_per_iteration = 3    # Self-play games per cycle
    train_steps = 50           # Gradient steps per cycle
    batch_size = 64            # Smaller batch for faster start
    mcts_sims = 10             # Low sims = fast games (~2-3 min each)
    iteration = 0
    prev_loss = None
    elo = 800

    log_message("[Mode] CONTINUOUS training — runs forever until you close this window")
    log_message("[Tip]  Press Ctrl+C anytime to stop safely\n")

    while True:
        iteration += 1
        set_cycle(iteration)

        log_message(f"\n{'='*60}")
        log_message(f"  CYCLE {iteration} (running forever...)")
        log_message(f"{'='*60}")

        # ---- Phase 1: Self-Play ----
        set_status("self-play")
        log_message(f"\n[Phase 1] Self-Play: generating {games_per_iteration} games...")

        cycle_wins = 0
        cycle_draws = 0
        cycle_losses = 0

        db = SessionLocal()

        for game_num in range(1, games_per_iteration + 1):
            t0 = time.time()
            game_data, game_meta = self_play_game(model, simulations=mcts_sims)
            elapsed = time.time() - t0
            buffer.extend(game_data)

            result = game_meta["result"]
            move_count = game_meta["moves"]
            move_squares = game_meta["move_squares"]

            # Track win/draw/loss
            if result == "1-0":
                cycle_wins += 1
            elif result == "0-1":
                cycle_losses += 1
            else:
                cycle_draws += 1

            # Insert SelfPlayGame row
            sp_game = SelfPlayGame(
                cycle_number=iteration,
                game_number=game_num,
                moves=move_count,
                result=result,
                time_seconds=round(elapsed, 2),
            )
            db.add(sp_game)
            db.commit()

            # Update heatmap
            _update_heatmap(db, move_squares)

            log_message(
                f"  Game {game_num}/{games_per_iteration} | "
                f"Moves: {move_count} | Result: {result} | "
                f"Time: {elapsed:.1f}s | Buffer: {len(buffer)}"
            )

        save_replay_buffer(buffer)
        log_message(f"\n[Phase 1] Done. Buffer saved ({len(buffer)} positions)")

        # ---- Phase 2: Training ----
        total_loss_val = 0.0
        policy_loss_val = 0.0
        value_loss_val = 0.0
        trained = False

        if len(buffer) >= batch_size:
            set_status("training")
            log_message(f"\n[Phase 2] Training neural network ({train_steps} steps)...")

            # We need the loss breakdown — call train_model which returns model
            # but also capture losses via a patched approach
            import numpy as np
            import torch.nn.functional as F

            model.train()
            step_total = 0.0
            step_policy = 0.0
            step_value = 0.0

            for step in range(train_steps):
                indices = np.random.choice(len(buffer), batch_size, replace=False)
                batch = [buffer[i] for i in indices]

                tensors = torch.cat([b[0] for b in batch])
                policies = torch.FloatTensor(np.array([b[1] for b in batch]))
                values = torch.FloatTensor(np.array([b[2] for b in batch])).unsqueeze(1)

                policy_logits, value_preds = model(tensors)

                p_loss = F.cross_entropy(policy_logits, policies)
                v_loss = F.mse_loss(value_preds, values)
                loss = p_loss + v_loss

                optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()

                step_total += loss.item()
                step_policy += p_loss.item()
                step_value += v_loss.item()

            model.eval()

            total_loss_val = step_total / train_steps
            policy_loss_val = step_policy / train_steps
            value_loss_val = step_value / train_steps
            trained = True

            log_message(
                f"[Phase 2] Steps: {train_steps} | "
                f"Total Loss: {total_loss_val:.4f} | "
                f"Policy: {policy_loss_val:.4f} | Value: {value_loss_val:.4f}"
            )

            # Save checkpoint
            os.makedirs(os.path.dirname(CHECKPOINT_PATH), exist_ok=True)
            torch.save({
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'buffer_size': len(buffer),
                'iteration': iteration,
            }, CHECKPOINT_PATH)
            log_message(f"[Phase 2] Checkpoint saved (cycle {iteration})")

            # ELO estimation: +5 if loss decreased
            if prev_loss is not None and total_loss_val < prev_loss:
                elo += 5
            prev_loss = total_loss_val
        else:
            log_message(f"\n[Phase 2] Skipped — need {batch_size} positions, have {len(buffer)}")

        # ---- Insert TrainingCycle row ----
        cycle_row = TrainingCycle(
            cycle_number=iteration,
            total_loss=total_loss_val,
            policy_loss=policy_loss_val,
            value_loss=value_loss_val,
            elo=elo,
            buffer_size=len(buffer),
            games_in_cycle=games_per_iteration,
            wins=cycle_wins,
            draws=cycle_draws,
            losses=cycle_losses,
            status="completed",
        )
        db.add(cycle_row)
        db.commit()
        db.close()

        set_status("idle")

        log_message(
            f"\n  Summary: Buffer={len(buffer)} | Cycles={iteration} | "
            f"ELO={elo} | W/D/L={cycle_wins}/{cycle_draws}/{cycle_losses}"
        )

    log_message("\n" + "=" * 60)
    log_message("  Training complete!")
    log_message("=" * 60)

if __name__ == '__main__':
    train()
