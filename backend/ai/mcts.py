import math
import numpy as np
import torch
import torch.nn.functional as F
from collections import defaultdict
from backend.chess_engine.board import ChessBoard
from backend.chess_engine.rules import encode_board
from backend.chess_engine.zobrist import compute_zobrist_hash

class MCTSNode:
    def __init__(self, prior_prob, parent=None):
        self.parent = parent
        self.children = {} # action (UCI move) -> MCTSNode
        self.visit_count = 0
        self.value_sum = 0
        self.prior_prob = prior_prob
        
    @property
    def q_value(self):
        if self.visit_count == 0:
            return 0
        return self.value_sum / self.visit_count

class MCTS:
    def __init__(self, neural_net, num_simulations=800, c_puct=1.0, dirichlet_alpha=0.3, dirichlet_epsilon=0.25):
        self.net = neural_net
        self.num_simulations = num_simulations
        self.c_puct = c_puct
        self.dirichlet_alpha = dirichlet_alpha
        self.dirichlet_epsilon = dirichlet_epsilon
        self.transposition_table = {} # hash -> (value, policy_probs)

    def search(self, initial_state: ChessBoard, add_noise=True):
        root = MCTSNode(0)
        
        # Initial expansion of the root
        policy, value = self.evaluate(initial_state)
        legal_moves = initial_state.get_legal_moves_uci()
        
        # Add Dirichlet noise to root for exploration
        if add_noise and len(legal_moves) > 0:
            noise = np.random.dirichlet([self.dirichlet_alpha] * len(legal_moves))
            for i, move in enumerate(legal_moves):
                p = (1 - self.dirichlet_epsilon) * policy.get(move, 0) + self.dirichlet_epsilon * noise[i]
                root.children[move] = MCTSNode(p, root)
        else:
            for move in legal_moves:
                root.children[move] = MCTSNode(policy.get(move, 0), root)
                
        for _ in range(self.num_simulations):
            node = root
            state = initial_state.copy()
            
            # Selection
            while len(node.children) > 0:
                action, node = self.select_child(node)
                state.push_uci(action)
                
            # Expansion and Evaluation
            if not state.is_game_over():
                policy, value = self.evaluate(state)
                legal_moves = state.get_legal_moves_uci()
                for move in legal_moves:
                    node.children[move] = MCTSNode(policy.get(move, 0), node)
            else:
                # Terminal state value
                result = state.result()
                if result == '1-0':
                    value = 1 if state.board.turn == chess.BLACK else -1
                elif result == '0-1':
                    value = -1 if state.board.turn == chess.BLACK else 1
                else:
                    value = 0 # Draw
                    
            # Backpropagation
            self.backpropagate(node, value)
            
        # Return action probabilities based on visit counts
        action_probs = {}
        for action, child in root.children.items():
            action_probs[action] = child.visit_count / (root.visit_count - 1 + 1e-8)
            
        return action_probs

    def select_child(self, node):
        best_score = -float('inf')
        best_action = None
        best_child = None
        
        for action, child in node.children.items():
            # PUCT formula
            u = self.c_puct * child.prior_prob * math.sqrt(node.visit_count) / (1 + child.visit_count)
            # We negate child Q because it's the value for the *other* player
            q = -child.q_value
            score = q + u
            
            if score > best_score:
                best_score = score
                best_action = action
                best_child = child
                
        return best_action, best_child

    def evaluate(self, state: ChessBoard):
        """Returns policy (dict of move -> prob) and value (-1 to 1)"""
        z_hash = compute_zobrist_hash(state.board)
        if z_hash in self.transposition_table:
            return self.transposition_table[z_hash]
            
        board_tensor = encode_board(state.board)
        # Convert to torch tensor, add batch dimension
        x = torch.from_numpy(board_tensor).unsqueeze(0)
        
        # Move to same device as net
        device = next(self.net.parameters()).device
        x = x.to(device)
        
        self.net.eval()
        with torch.no_grad():
            pi_logits, v = self.net(x)
            
        pi_probs = F.softmax(pi_logits, dim=1).squeeze(0).cpu().numpy()
        value = v.item()
        
        # Mask illegal moves (simplified matching index, requires mapping UCI to AlphaZero action space)
        # For full implementation, we need a function to map 4672 AlphaZero action index to UCI move
        # Here we do a mocked policy dictionary for demonstration
        policy = {}
        legal_moves = state.get_legal_moves_uci()
        
        # Fake mapping: uniform probability over legal moves, mixed with network output if we had full mapping
        for move in legal_moves:
            # In reality we extract the exact index for 'move' from pi_probs
            policy[move] = 1.0 / len(legal_moves)
            
        self.transposition_table[z_hash] = (policy, value)
        return policy, value

    def backpropagate(self, node, value):
        while node is not None:
            node.visit_count += 1
            node.value_sum += value
            node = node.parent
            # Flip value for the opponent
            value = -value
