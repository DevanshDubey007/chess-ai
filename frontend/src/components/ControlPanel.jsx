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
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={undoMove}
          disabled={history.length < 2}
          className="btn btn-secondary"
          style={{ flex: 1, opacity: history.length < 2 ? 0.4 : 1 }}
        >
          <Undo2 size={15} /> Undo Move
        </button>
        <button
          onClick={async () => {
            try {
              const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
              const res = await fetch(`${apiUrl}/api/train`, { method: 'POST' });
              const data = await res.json();
              alert(data.status);
            } catch (e) {
              alert('Failed to start training. Is backend online?');
            }
          }}
          className="btn btn-primary"
          style={{ flex: 1, background: '#10b981' }}
        >
          Train AI
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
