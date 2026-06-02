import React from 'react';
import useGameStore from '../store/gameStore';
import { RefreshCw, ArrowLeftRight, Undo2 } from 'lucide-react';

const ControlPanel = () => {
  const resetGame    = useGameStore(s => s.resetGame);
  const undoMove     = useGameStore(s => s.undoMove);
  const playerColor  = useGameStore(s => s.playerColor);
  const setPlayerColor = useGameStore(s => s.setPlayerColor);
  const history      = useGameStore(s => s.history);

  return (
    <div className="glass-panel" style={{ padding: 16, width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={resetGame} className="btn btn-secondary" style={{ flex: 1 }}>
          <RefreshCw size={15} /> New Game
        </button>
        <button
          onClick={() => setPlayerColor(playerColor === 'w' ? 'b' : 'w')}
          className="btn btn-primary"
          style={{ flex: 1 }}
        >
          <ArrowLeftRight size={15} /> Play as {playerColor === 'w' ? 'Black' : 'White'}
        </button>
      </div>
      <button
        onClick={undoMove}
        disabled={history.length < 2}
        className="btn btn-secondary"
        style={{ opacity: history.length < 2 ? 0.4 : 1 }}
      >
        <Undo2 size={15} /> Undo Move
      </button>
    </div>
  );
};

export default ControlPanel;
