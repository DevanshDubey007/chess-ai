import { useEffect, useState } from 'react';
import useGameStore from '../store/gameStore';
import { getAIMove } from '../services/api';

export const useAI = () => {
  const { fen, isPlayerTurn, isGameOver, makeMove } = useGameStore();
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchAIMove = async () => {
      if (!isPlayerTurn && !isGameOver && !isThinking) {
        setIsThinking(true);
        setError(null);
        try {
          const response = await getAIMove(fen);
          if (mounted && response.move) {
             // Simulate slight delay for realism
             setTimeout(() => {
                 if (mounted) {
                    makeMove(response.move);
                    setIsThinking(false);
                 }
             }, 300);
          }
        } catch (err) {
          console.error("Failed to get AI move", err);
          if (mounted) {
            setError("AI failed to compute move.");
            setIsThinking(false);
          }
        }
      }
    };

    fetchAIMove();

    return () => {
      mounted = false;
    };
  }, [fen, isPlayerTurn, isGameOver, makeMove, isThinking]);

  return { isThinking, error };
};
