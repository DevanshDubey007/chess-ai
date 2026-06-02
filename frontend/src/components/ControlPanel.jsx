import React from 'react';
import useGameStore from '../store/gameStore';
import { RefreshCw, ArrowLeftRight } from 'lucide-react';

const ControlPanel = () => {
  const { resetGame, playerColor, setPlayerColor } = useGameStore();

  return (
    <div className="glass-panel p-4 w-full max-w-sm flex gap-3">
      <button 
        onClick={resetGame}
        className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors font-medium text-sm"
      >
        <RefreshCw size={16} /> New Game
      </button>
      <button 
        onClick={() => setPlayerColor(playerColor === 'w' ? 'b' : 'w')}
        className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg transition-colors font-medium text-sm shadow-lg shadow-primary-500/20"
      >
        <ArrowLeftRight size={16} /> Play as {playerColor === 'w' ? 'Black' : 'White'}
      </button>
    </div>
  );
};

export default ControlPanel;
