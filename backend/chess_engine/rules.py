import chess
import numpy as np

def encode_board(board: chess.Board, history=None):
    """
    Encode the board state into a 119-channel representation for AlphaZero.
    - 12 channels for piece positions (6 types x 2 colors)
    - 8 channels for repetition history (simplified here to just the current state if history is not provided)
    - Meta channels: castling rights (4), en passant (1), 50-move rule (1), color to move (1)
    - For simplicity in this implementation, we will use a slightly modified channel layout:
      - 14 channels total if we simplify, but let's stick to the prompt's 119-channel request structure:
      - 8 history steps * 14 channels (12 pieces + 2 rep) = 112 channels
      - + 7 meta channels (color, castling, en passant, halfmove) = 119 channels.
    """
    # 8x8x119 tensor
    tensor = np.zeros((119, 8, 8), dtype=np.float32)
    
    # Example minimal implementation for current state (first 14 channels)
    # Piece channels
    piece_map = board.piece_map()
    for square, piece in piece_map.items():
        rank = chess.square_rank(square)
        file = chess.square_file(square)
        # 0-5 for White (P, N, B, R, Q, K), 6-11 for Black
        channel = piece.piece_type - 1 + (0 if piece.color == chess.WHITE else 6)
        tensor[channel, rank, file] = 1.0

    # Meta channels (starting at 112)
    # Color to move (channel 112)
    if board.turn == chess.WHITE:
        tensor[112, :, :] = 1.0
        
    # Castling rights (113-116)
    if board.has_kingside_castling_rights(chess.WHITE):
        tensor[113, :, :] = 1.0
    if board.has_queenside_castling_rights(chess.WHITE):
        tensor[114, :, :] = 1.0
    if board.has_kingside_castling_rights(chess.BLACK):
        tensor[115, :, :] = 1.0
    if board.has_queenside_castling_rights(chess.BLACK):
        tensor[116, :, :] = 1.0
        
    # En passant (117)
    if board.ep_square is not None:
        rank = chess.square_rank(board.ep_square)
        file = chess.square_file(board.ep_square)
        tensor[117, rank, file] = 1.0
        
    # 50-move rule (118)
    tensor[118, :, :] = board.halfmove_clock / 100.0
    
    return tensor

def get_action_size():
    # 4672 possible moves (AlphaZero representation)
    return 4672
