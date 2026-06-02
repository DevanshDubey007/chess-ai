import { create } from 'zustand';
import { Chess } from 'chess.js';

const useGameStore = create((set, get) => {
  const chess = new Chess();

  return {
    game: chess,
    fen: chess.fen(),
    history: [],
    lastMove: null,
    isPlayerTurn: true,
    playerColor: 'w',
    isGameOver: false,
    gameResult: null,

    /* accepts { from, to, promotion } object  OR  a SAN string like "e4" */
    makeMove: (move) => {
      const { game, playerColor } = get();
      try {
        const result = game.move(move);
        if (result) {
          const over = game.isGameOver();
          let gameResult = null;
          if (over) {
            if (game.isCheckmate())       gameResult = game.turn() === 'w' ? 'Black wins!' : 'White wins!';
            else if (game.isStalemate())  gameResult = 'Stalemate';
            else if (game.isDraw())       gameResult = 'Draw';
            else                          gameResult = 'Game over';
          }
          set({
            fen: game.fen(),
            history: game.history({ verbose: true }),
            lastMove: { from: result.from, to: result.to },
            isGameOver: over,
            gameResult,
            isPlayerTurn: game.turn() === playerColor,
          });
          return true;
        }
      } catch (e) {
        console.warn('Invalid move', move, e.message);
      }
      return false;
    },

    undoMove: () => {
      const { game, playerColor } = get();
      game.undo(); // undo AI
      game.undo(); // undo player
      set({
        fen: game.fen(),
        history: game.history({ verbose: true }),
        lastMove: null,
        isGameOver: false,
        gameResult: null,
        isPlayerTurn: game.turn() === playerColor,
      });
    },

    resetGame: () => {
      const { game, playerColor } = get();
      game.reset();
      set({
        fen: game.fen(),
        history: [],
        lastMove: null,
        isPlayerTurn: playerColor === 'w',
        isGameOver: false,
        gameResult: null,
      });
    },

    setPlayerColor: (color) => {
      const { game } = get();
      game.reset();
      set({
        playerColor: color,
        fen: game.fen(),
        history: [],
        lastMove: null,
        isPlayerTurn: color === 'w',
        isGameOver: false,
        gameResult: null,
      });
    },
  };
});

export default useGameStore;
