import chess
import random

# We can actually use python-chess's built in polyglot zobrist hashing
# But to be explicit and control our transposition table:
import chess.polyglot

def compute_zobrist_hash(board: chess.Board):
    """
    Computes a Zobrist hash of the current board position.
    Uses python-chess's polyglot hasher.
    """
    return chess.polyglot.zobrist_hash(board)
