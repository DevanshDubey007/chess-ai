import chess

class ChessBoard:
    def __init__(self, fen=None):
        self.board = chess.Board(fen) if fen else chess.Board()

    def get_legal_moves(self):
        """Returns a list of legal moves in standard algebraic notation."""
        return [self.board.san(move) for move in self.board.legal_moves]

    def get_legal_moves_uci(self):
        """Returns a list of legal moves in UCI notation."""
        return [move.uci() for move in self.board.legal_moves]

    def push_uci(self, uci_move):
        """Make a move using UCI format."""
        move = chess.Move.from_uci(uci_move)
        if move in self.board.legal_moves:
            self.board.push(move)
            return True
        return False

    def push_san(self, san_move):
        """Make a move using standard algebraic notation."""
        try:
            self.board.push_san(san_move)
            return True
        except ValueError:
            return False

    def pop(self):
        """Undo the last move."""
        try:
            return self.board.pop()
        except IndexError:
            return None

    def get_fen(self):
        """Get the current FEN of the board."""
        return self.board.fen()

    def is_game_over(self):
        return self.board.is_game_over()

    def result(self):
        """Returns '1-0', '0-1', '1/2-1/2', or '*'"""
        return self.board.result()
    
    def copy(self):
        """Returns a copy of the board."""
        new_board = ChessBoard()
        new_board.board = self.board.copy()
        return new_board
