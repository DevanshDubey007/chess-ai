import torch
import torch.nn as nn
import torch.nn.functional as F
import chess
import numpy as np

PIECE_TO_INDEX = {
    (chess.PAWN,   chess.WHITE): 0,
    (chess.KNIGHT, chess.WHITE): 1,
    (chess.BISHOP, chess.WHITE): 2,
    (chess.ROOK,   chess.WHITE): 3,
    (chess.QUEEN,  chess.WHITE): 4,
    (chess.KING,   chess.WHITE): 5,
    (chess.PAWN,   chess.BLACK): 6,
    (chess.KNIGHT, chess.BLACK): 7,
    (chess.BISHOP, chess.BLACK): 8,
    (chess.ROOK,   chess.BLACK): 9,
    (chess.QUEEN,  chess.BLACK): 10,
    (chess.KING,   chess.BLACK): 11,
}

def board_to_tensor(board: chess.Board) -> torch.Tensor:
    """
    Returns shape (1, 19, 8, 8):
    Channels 0-11 : piece positions
    Channel 12    : side to move (1=white, 0=black)
    Channel 13    : castling kingside white
    Channel 14    : castling queenside white
    Channel 15    : castling kingside black
    Channel 16    : castling queenside black
    Channel 17    : en passant file (normalized)
    Channel 18    : halfmove clock (normalized)
    """
    planes = np.zeros((19, 8, 8), dtype=np.float32)

    for sq in chess.SQUARES:
        piece = board.piece_at(sq)
        if piece:
            rank = sq // 8
            file = sq % 8
            idx  = PIECE_TO_INDEX[(piece.piece_type, piece.color)]
            planes[idx][rank][file] = 1.0

    planes[12] = 1.0 if board.turn == chess.WHITE else 0.0
    planes[13] = 1.0 if board.has_kingside_castling_rights(chess.WHITE)  else 0.0
    planes[14] = 1.0 if board.has_queenside_castling_rights(chess.WHITE) else 0.0
    planes[15] = 1.0 if board.has_kingside_castling_rights(chess.BLACK)  else 0.0
    planes[16] = 1.0 if board.has_queenside_castling_rights(chess.BLACK) else 0.0

    if board.ep_square is not None:
        planes[17] = (board.ep_square % 8) / 7.0

    planes[18] = min(board.halfmove_clock / 100.0, 1.0)

    return torch.FloatTensor(planes).unsqueeze(0)  # (1, 19, 8, 8)

def build_move_index():
    """Builds a full mapping of all 4672 possible chess moves → index."""
    moves = {}
    idx = 0
    for from_sq in chess.SQUARES:
        for to_sq in chess.SQUARES:
            if from_sq == to_sq:
                continue
            moves[chess.Move(from_sq, to_sq).uci()] = idx
            idx += 1
            # Promotions
            for promo in [chess.QUEEN, chess.ROOK, chess.BISHOP, chess.KNIGHT]:
                moves[chess.Move(from_sq, to_sq, promotion=promo).uci()] = idx
                idx += 1
    return moves

MOVE_TO_IDX = build_move_index()
IDX_TO_MOVE = {v: k for k, v in MOVE_TO_IDX.items()}

class ResBlock(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, 3, padding=1, bias=False)
        self.bn1   = nn.BatchNorm2d(channels)
        self.conv2 = nn.Conv2d(channels, channels, 3, padding=1, bias=False)
        self.bn2   = nn.BatchNorm2d(channels)

    def forward(self, x):
        residual = x
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.bn2(self.conv2(x))
        return F.relu(x + residual)

class ChessAlphaZeroNet(nn.Module):
    """
    CPU-friendly: 6 res blocks, 128 channels (vs AlphaZero's 20 blocks, 256).
    Still strong enough to learn real chess patterns.
    """
    def __init__(self, num_res_blocks=6, channels=128):
        super().__init__()
        # Input: 19-channel board (12 piece planes + 7 meta)
        self.input_conv = nn.Conv2d(19, channels, 3, padding=1, bias=False)
        self.input_bn   = nn.BatchNorm2d(channels)

        self.res_blocks = nn.ModuleList(
            [ResBlock(channels) for _ in range(num_res_blocks)]
        )

        # Policy head → probability over all possible UCI moves
        self.num_moves = len(MOVE_TO_IDX)
        self.policy_conv = nn.Conv2d(channels, 32, 1, bias=False)
        self.policy_bn   = nn.BatchNorm2d(32)
        self.policy_fc   = nn.Linear(32 * 8 * 8, self.num_moves)

        # Value head → win probability scalar
        self.value_conv = nn.Conv2d(channels, 4, 1, bias=False)
        self.value_bn   = nn.BatchNorm2d(4)
        self.value_fc1  = nn.Linear(4 * 8 * 8, 64)
        self.value_fc2  = nn.Linear(64, 1)

    def forward(self, x):
        x = F.relu(self.input_bn(self.input_conv(x)))
        for block in self.res_blocks:
            x = block(x)

        # Policy
        p = F.relu(self.policy_bn(self.policy_conv(x)))
        p = self.policy_fc(p.view(p.size(0), -1))

        # Value
        v = F.relu(self.value_bn(self.value_conv(x)))
        v = F.relu(self.value_fc1(v.view(v.size(0), -1)))
        v = torch.tanh(self.value_fc2(v))

        return p, v

def get_model(checkpoint_path=None):
    model = ChessAlphaZeroNet()
    model.eval()
    if checkpoint_path:
        import os
        if os.path.exists(checkpoint_path):
            try:
                ckpt = torch.load(checkpoint_path, map_location='cpu', weights_only=False)
                if 'model_state_dict' in ckpt:
                    model.load_state_dict(ckpt['model_state_dict'])
                else:
                    model.load_state_dict(ckpt)
                print(f"[AI] Loaded checkpoint: {checkpoint_path}")
            except Exception as e:
                print(f"[AI] Error loading checkpoint {checkpoint_path}, using fresh model: {e}")
    # Optimize for CPU inference
    torch.set_num_threads(4)
    return model
