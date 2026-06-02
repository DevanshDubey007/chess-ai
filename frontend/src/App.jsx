import React from 'react';
import ChessBoardComponent from './components/ChessBoard';
import MoveHistory from './components/MoveHistory';
import AIStats from './components/AIStats';
import ControlPanel from './components/ControlPanel';
import useGameStore from './store/gameStore';

function App() {
  const gameResult = useGameStore((s) => s.gameResult);
  const isGameOver = useGameStore((s) => s.isGameOver);

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4"
         style={{ background: 'linear-gradient(135deg, #0b0f19 0%, #131a2b 50%, #0b0f19 100%)' }}>

      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight"
            style={{ background: 'linear-gradient(to right, #60a5fa, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AlphaZero Chess
        </h1>
        <p className="text-gray-400 mt-2 text-sm max-w-md mx-auto">
          Play against a neural network trained entirely through self-play using Monte Carlo Tree Search.
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 justify-center items-start">

        {/* Left Column */}
        <div className="flex flex-col gap-6 w-full lg:w-72 order-2 lg:order-1 items-center lg:items-end">
          <AIStats />
          <MoveHistory />
        </div>

        {/* Center - Board */}
        <div className="flex flex-col items-center order-1 lg:order-2">
          <div className="glass-panel p-2">
            <ChessBoardComponent />
          </div>

          {isGameOver && (
            <div className="mt-6 glass-panel p-4 w-full text-center"
                 style={{ border: '2px solid #3b82f6', boxShadow: '0 0 30px rgba(59,130,246,0.3)' }}>
              <h2 className="text-2xl font-bold text-white">{gameResult}</h2>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6 w-full lg:w-72 order-3 items-center lg:items-start">
          <ControlPanel />
        </div>

      </div>
    </div>
  );
}

export default App;
