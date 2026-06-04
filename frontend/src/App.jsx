import React from 'react';
import { Link } from 'react-router-dom';
import ChessBoardComponent from './components/ChessBoard';
import MoveHistory from './components/MoveHistory';
import AIStats from './components/AIStats';
import ControlPanel from './components/ControlPanel';
import useGameStore from './store/gameStore';

function App() {
  const gameResult = useGameStore(s => s.gameResult);
  const isGameOver = useGameStore(s => s.isGameOver);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b0f19 0%, #131a2b 50%, #0b0f19 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 16px',
    }}>
      {/* Header */}
      <header style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(to right, #60a5fa, #93c5fd)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
        }}>
          AlphaZero Chess
        </h1>
        <p style={{ color: '#9ca3af', marginTop: 8, fontSize: 14, maxWidth: 420 }}>
          Play against a neural network trained entirely through self-play using Monte Carlo Tree Search.
        </p>
        <div style={{ marginTop: 16 }}>
          <Link to="/monitor" className="btn btn-secondary">
            📊 View Monitor Dashboard
          </Link>
        </div>
      </header>

      {/* Main layout */}
      <div style={{
        width: '100%',
        maxWidth: 1100,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 28,
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}>
        {/* Left — Stats & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: 280, minWidth: 240 }}>
          <AIStats />
          <MoveHistory />
        </div>

        {/* Center — Board */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="glass-panel" style={{ padding: 8 }}>
            <ChessBoardComponent />
          </div>

          {isGameOver && (
            <div className="glass-panel" style={{
              padding: '14px 28px',
              textAlign: 'center',
              border: '2px solid #3b82f6',
              boxShadow: '0 0 30px rgba(59,130,246,.35)',
            }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>{gameResult}</h2>
            </div>
          )}
        </div>

        {/* Right — Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: 280, minWidth: 240 }}>
          <ControlPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
