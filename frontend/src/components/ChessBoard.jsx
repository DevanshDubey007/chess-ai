import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import useGameStore from '../store/gameStore';
import { useAI } from '../hooks/useAI';

const ChessBoardComponent = () => {
  const fen = useGameStore((s) => s.fen);
  const makeMove = useGameStore((s) => s.makeMove);
  const isPlayerTurn = useGameStore((s) => s.isPlayerTurn);
  const playerColor = useGameStore((s) => s.playerColor);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const { isThinking, error } = useAI();
  const [boardWidth, setBoardWidth] = useState(480);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setBoardWidth(Math.min(width - 32, 400));
      else if (width < 1024) setBoardWidth(480);
      else setBoardWidth(560);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onDrop = (sourceSquare, targetSquare, piece) => {
    if (!isPlayerTurn || isGameOver || isThinking) return false;

    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // always promote to queen
    };

    return makeMove(move);
  };

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <div
        className="relative rounded-xl overflow-hidden transition-all duration-300"
        style={{
          boxShadow: '0 0 60px rgba(59,130,246,0.15), 0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <Chessboard
          id="main-board"
          position={fen}
          onPieceDrop={onDrop}
          boardWidth={boardWidth}
          boardOrientation={playerColor === 'w' ? 'white' : 'black'}
          customDarkSquareStyle={{ backgroundColor: '#334155' }}
          customLightSquareStyle={{ backgroundColor: '#cbd5e1' }}
          animationDuration={250}
        />
        {isThinking && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-transparent border-t-blue-400 border-r-blue-400"></div>
              <span className="text-sm text-blue-200 font-medium">AI is thinking...</span>
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-3 text-red-400 text-sm text-center bg-red-900/20 rounded-lg px-4 py-2 border border-red-800/30">
          {error}
        </div>
      )}
    </div>
  );
};

export default ChessBoardComponent;
