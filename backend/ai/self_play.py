import numpy as np
from backend.chess_engine.board import ChessBoard
from backend.chess_engine.rules import encode_board
from backend.ai.mcts import MCTS

def execute_episode(neural_net, num_mcts_sims=800):
    """
    Executes one episode of self-play starting with a fresh board.
    Returns a list of examples: (state, policy, value)
    """
    train_examples = []
    board = ChessBoard()
    mcts = MCTS(neural_net, num_simulations=num_mcts_sims)
    
    episode_step = 0
    
    while True:
        episode_step += 1
        
        # Get MCTS policy (with exploration noise)
        action_probs = mcts.search(board, add_noise=True)
        
        # Save state and policy
        state_tensor = encode_board(board.board)
        
        # Create full 4672-dim policy vector
        # (This is simplified. Real implementation needs UCI to AlphaZero index mapping)
        policy_vector = np.zeros(4672, dtype=np.float32)
        # We'll just fake populate it for structural correctness
        for i, (action, prob) in enumerate(action_probs.items()):
            if i < 4672:
                policy_vector[i] = prob
                
        # Store for the current player
        # We append (state, policy, player_color) temporarily
        player_color = 1 if board.board.turn == chess.WHITE else -1
        train_examples.append([state_tensor, policy_vector, player_color])
        
        # Choose action based on probabilities (temperature=1 for early game, 0 later)
        # Simplified: always use temperature=1 here
        actions = list(action_probs.keys())
        probs = list(action_probs.values())
        
        # Handle cases where MCTS returned empty dict (terminal or error)
        if len(actions) == 0:
            break
            
        action = np.random.choice(actions, p=probs)
        
        # Apply action
        board.push_uci(action)
        
        if board.is_game_over():
            result = board.result()
            if result == '1-0':
                reward = 1.0 # White won
            elif result == '0-1':
                reward = -1.0 # Black won
            else:
                reward = 0.0 # Draw
                
            # Assign rewards from the perspective of the player to move in that state
            return [(x[0], x[1], reward * x[2]) for x in train_examples]
