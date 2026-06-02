import { create } from 'zustand';
import { Chess } from 'chess.js';

const useGameStore = create((set, get) => ({
  game: new Chess(),
  fen: 'start',
  history: [],
  isPlayerTurn: true,
  playerColor: 'w',
  isGameOver: false,
  gameResult: null,

  makeMove: (move) => {
    const { game } = get();
    try {
      const moveResult = game.move(move);
      if (moveResult) {
        set({ 
          fen: game.fen(), 
          history: game.history({ verbose: true }),
          isGameOver: game.isGameOver(),
          gameResult: game.isGameOver() ? (game.isCheckmate() ? (game.turn() === 'w' ? 'Black wins' : 'White wins') : 'Draw') : null,
          isPlayerTurn: game.turn() === get().playerColor
        });
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
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
    set({ playerColor: color, isPlayerTurn: color === get().game.turn() });
  }
}));

export default useGameStore;
