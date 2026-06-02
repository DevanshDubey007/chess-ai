import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import useGameStore from '../store/gameStore';
import { useAI } from '../hooks/useAI';

const ChessBoardComponent = () => {
  const { fen, makeMove, isPlayerTurn, playerColor, isGameOver } = useGameStore();
  const { isThinking } = useAI();
  const [boardWidth, setBoardWidth] = useState(400);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setBoardWidth(width - 40);
      else if (width < 1024) setBoardWidth(480);
      else setBoardWidth(560);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onDrop = (sourceSquare, targetSquare, piece) => {
    if (!isPlayerTurn || isGameOver) return false;

    // See if the move is legal
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1].toLowerCase() ?? 'q', // default to queen for simplicity
    };

    const success = makeMove(move);
    return success;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`relative rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${isThinking ? 'opacity-80' : 'opacity-100'}`}>
        <Chessboard 
          position={fen} 
          onPieceDrop={onDrop} 
          boardWidth={boardWidth}
          boardOrientation={playerColor === 'w' ? 'white' : 'black'}
          customDarkSquareStyle={{ backgroundColor: '#4b5563' }}
          customLightSquareStyle={{ backgroundColor: '#e5e7eb' }}
          animationDuration={300}
        />
        {isThinking && (
           <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10 backdrop-blur-sm">
             <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
           </div>
        )}
      </div>
    </div>
  );
};

export default ChessBoardComponent;
