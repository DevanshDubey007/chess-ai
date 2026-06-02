import { useEffect, useRef, useState, useCallback } from 'react';
import useGameStore from '../store/gameStore';
import { getAIMove } from '../services/api';

export const useAI = () => {
  const fen = useGameStore((s) => s.fen);
  const isPlayerTurn = useGameStore((s) => s.isPlayerTurn);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const makeMove = useGameStore((s) => s.makeMove);

  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);
  const thinkingRef = useRef(false);

  const fetchAIMove = useCallback(async () => {
    // Guard: only fire when it's AI's turn, game is active, and we aren't already thinking
    if (isPlayerTurn || isGameOver || thinkingRef.current) return;

    thinkingRef.current = true;
    setIsThinking(true);
    setError(null);

    try {
      const response = await getAIMove(fen);
      if (response && response.move) {
        // Small delay so the user can see the spinner
        await new Promise((r) => setTimeout(r, 350));
        makeMove(response.move);
      } else {
        setError('AI returned no move.');
      }
    } catch (err) {
      console.error('AI move error:', err);
      setError('Could not reach the AI backend. Is the server running?');
    } finally {
      thinkingRef.current = false;
      setIsThinking(false);
    }
  }, [fen, isPlayerTurn, isGameOver, makeMove]);

  useEffect(() => {
    fetchAIMove();
  }, [fetchAIMove]);

  return { isThinking, error };
};
