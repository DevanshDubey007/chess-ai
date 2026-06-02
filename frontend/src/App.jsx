import React from 'react';
import ChessBoardComponent from './components/ChessBoard';
import MoveHistory from './components/MoveHistory';
import AIStats from './components/AIStats';
import ControlPanel from './components/ControlPanel';
import useGameStore from './store/gameStore';

function App() {
  const { gameResult, isGameOver } = useGameStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex flex-col items-center py-10 px-4">
      
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-200 tracking-tight">
          AlphaZero Chess
        </h1>
        <p className="text-gray-400 mt-2 text-sm max-w-md mx-auto">
          Play against a neural network trained entirely through self-play using Monte Carlo Tree Search.
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 justify-center items-start">
        
        {/* Left Column - Stats & History */}
        <div className="flex flex-col gap-6 w-full lg:w-auto order-2 lg:order-1 items-center lg:items-end">
          <AIStats />
          <MoveHistory />
        </div>

        {/* Center - Chess Board */}
        <div className="flex flex-col items-center order-1 lg:order-2">
          <div className="glass-panel p-2">
            <ChessBoardComponent />
          </div>
          
          {isGameOver && (
             <div className="mt-6 glass-panel p-4 border-primary-500 border-2 w-full text-center shadow-primary-500/30 shadow-xl animate-pulse">
                <h2 className="text-2xl font-bold text-white">{gameResult}</h2>
             </div>
          )}
        </div>

        {/* Right Column - Controls */}
        <div className="flex flex-col gap-6 w-full lg:w-auto order-3 items-center lg:items-start">
           <ControlPanel />
        </div>

      </div>

    </div>
  );
}

export default App;
