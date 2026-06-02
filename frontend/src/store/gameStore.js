import { create } from 'zustand';
import { Chess } from 'chess.js';

const initialGame = new Chess();

const useGameStore = create((set, get) => ({
  game: initialGame,
  fen: initialGame.fen(),
  history: [],
  isPlayerTurn: true,
  playerColor: 'w',
  isGameOver: false,
  gameResult: null,

  makeMove: (move) => {
    const { game } = get();
    try {
      const result = game.move(move);
      if (result) {
        const isOver = game.isGameOver();
        let gameResult = null;
        if (isOver) {
          if (game.isCheckmate()) {
            gameResult = game.turn() === 'w' ? 'Black Wins!' : 'White Wins!';
          } else if (game.isDraw()) {
            gameResult = 'Draw';
          } else if (game.isStalemate()) {
            gameResult = 'Stalemate';
          } else {
            gameResult = 'Game Over';
          }
        }
        set({
          fen: game.fen(),
          history: game.history({ verbose: true }),
          isGameOver: isOver,
          gameResult,
          isPlayerTurn: game.turn() === get().playerColor
        });
        return true;
      }
    } catch (e) {
      console.warn('Invalid move:', move, e);
    }
    return false;
  },

  undoMove: () => {
    const { game } = get();
    game.undo();
    game.undo(); // Undo both player and AI move
    set({
      fen: game.fen(),
      history: game.history({ verbose: true }),
      isGameOver: false,
      gameResult: null,
      isPlayerTurn: true
    });
  },

  resetGame: () => {
    const newGame = new Chess();
    set({
      game: newGame,
      fen: newGame.fen(),
      history: [],
      isPlayerTurn: true,
      isGameOver: false,
      gameResult: null
    });
  },

  setPlayerColor: (color) => {
    const { game } = get();
    set({
      playerColor: color,
      isPlayerTurn: color === game.turn()
    });
  }
}));

export default useGameStore;
