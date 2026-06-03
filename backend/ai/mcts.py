import math
import chess
import numpy as np
import torch
from .neural_net import board_to_tensor, MOVE_TO_IDX, IDX_TO_MOVE

C_PUCT      = 1.4   # exploration constant
DIRICHLET_A = 0.3   # noise alpha (0.3 = chess standard)
DIRICHLET_E = 0.25  # noise weight

class MCTSNode:
    __slots__ = ['board', 'parent', 'move', 'children',
                 'visits', 'value_sum', 'prior', 'is_expanded']

    def __init__(self, board, parent=None, move=None, prior=0.0):
        self.board      = board
        self.parent     = parent
        self.move       = move          # move that led to this node
        self.children   = {}
        self.visits     = 0
        self.value_sum  = 0.0
        self.prior      = prior
        self.is_expanded = False

    @property
    def Q(self):
        if self.visits == 0:
            return 0.0
        return self.value_sum / self.visits

    def UCB(self, parent_visits):
        return self.Q + C_PUCT * self.prior * math.sqrt(parent_visits) / (1 + self.visits)

class MCTS:
    def __init__(self, model, simulations=150, temperature=1.0):
        self.model       = model
        self.simulations = simulations
        self.temperature = temperature  # > 0 = varied play, 0 = deterministic

    def get_move(self, board: chess.Board) -> str:
        root = MCTSNode(board.copy())
        self._expand(root)
        self._add_dirichlet_noise(root)  # KEY: adds variation at root

        for _ in range(self.simulations):
            node = self._select(root)
            value = self._evaluate(node)
            self._backprop(node, value)

        return self._pick_move(root)
        
    def _get_root_children(self, board: chess.Board):
        # Helper to get the root's evaluated children for training probabilities
        root = MCTSNode(board.copy())
        self._expand(root)
        self._add_dirichlet_noise(root)
        for _ in range(self.simulations):
            node = self._select(root)
            value = self._evaluate(node)
            self._backprop(node, value)
        return root.children.items()

    def _select(self, node):
        while node.is_expanded and node.children:
            node = max(
                node.children.values(),
                key=lambda n: n.UCB(node.visits)
            )
        if not node.board.is_game_over():
            self._expand(node)
        return node

    def _expand(self, node):
        if node.is_expanded:
            return
        board  = node.board
        tensor = board_to_tensor(board)

        with torch.no_grad():
            policy_logits, _ = self.model(tensor)

        policy = torch.softmax(policy_logits[0], dim=0).numpy()

        legal_moves = list(board.legal_moves)
        legal_ucis  = {m.uci(): m for m in legal_moves}

        total_prior = 0.0
        priors = {}
        for uci, move in legal_ucis.items():
            idx   = MOVE_TO_IDX.get(uci, 0)
            p     = float(policy[idx])
            priors[uci] = p
            total_prior += p

        # Normalize
        if total_prior > 0:
            priors = {k: v / total_prior for k, v in priors.items()}
        else:
            priors = {k: 1.0 / len(legal_ucis) for k in legal_ucis}

        for uci, move in legal_ucis.items():
            child_board = board.copy()
            child_board.push(move)
            node.children[uci] = MCTSNode(
                child_board, parent=node, move=uci, prior=priors[uci]
            )

        node.is_expanded = True

    def _evaluate(self, node):
        if node.board.is_game_over():
            result = node.board.result()
            if result == "1-0":
                return 1.0 if node.board.turn == chess.BLACK else -1.0
            elif result == "0-1":
                return -1.0 if node.board.turn == chess.BLACK else 1.0
            return 0.0  # draw

        tensor = board_to_tensor(node.board)
        with torch.no_grad():
            _, value = self.model(tensor)
        return float(value[0][0])

    def _backprop(self, node, value):
        while node is not None:
            node.visits    += 1
            node.value_sum += value
            value           = -value   # flip for opponent
            node            = node.parent

    def _add_dirichlet_noise(self, root):
        """This is what gives the AI VARIATION — different moves each game."""
        if not root.children:
            return
        n      = len(root.children)
        noise  = np.random.dirichlet([DIRICHLET_A] * n)
        for child, eta in zip(root.children.values(), noise):
            child.prior = (1 - DIRICHLET_E) * child.prior + DIRICHLET_E * eta

    def _pick_move(self, root) -> str:
        """
        Temperature controls variation:
        - temperature=1.0  → proportional to visit counts (varied, creative)
        - temperature=0.1  → near-deterministic (strong endgame play)
        - temperature=0.0  → always best move (tournament mode)
        """
        visits = {uci: node.visits for uci, node in root.children.items()}

        if self.temperature == 0 or not visits:
            return max(visits, key=visits.get)

        visit_arr = np.array(list(visits.values()), dtype=np.float64)
        visit_arr = visit_arr ** (1.0 / self.temperature)
        
        # Prevent sum to zero if all visits are zero
        total_visits = visit_arr.sum()
        if total_visits > 0:
            probs = visit_arr / total_visits
            probs = probs / np.sum(probs) # Strict normalization for numpy
            return np.random.choice(list(visits.keys()), p=probs)
        else:
            return np.random.choice(list(visits.keys()))
