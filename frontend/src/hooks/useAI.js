import { useEffect, useRef, useState, useCallback } from 'react';
import useGameStore from '../store/gameStore';
import { getAIMove } from '../services/api';

export const useAI = () => {
  const fen          = useGameStore(s => s.fen);
  const isPlayerTurn = useGameStore(s => s.isPlayerTurn);
  const isGameOver   = useGameStore(s => s.isGameOver);
  const makeMove     = useGameStore(s => s.makeMove);

  const [isThinking, setIsThinking] = useState(false);
  const [error, setError]           = useState(null);
  const busy = useRef(false);

  const doAIMove = useCallback(async () => {
    if (isPlayerTurn || isGameOver || busy.current) return;

    busy.current = true;
    setIsThinking(true);
    setError(null);

    try {
      const res = await getAIMove(fen);
      if (res?.move) {
        await new Promise(r => setTimeout(r, 300));   // visual delay

        const m = res.move;
        // backend returns UCI strings like "e2e4" or "e7e8q"
        if (m.length >= 4) {
          const from = m.substring(0, 2);
          const to   = m.substring(2, 4);
          const prom = m.length > 4 ? m[4] : 'q';
          makeMove({ from, to, promotion: prom });
        } else {
          makeMove(m);     // fallback: try as SAN
        }
      } else {
        setError('AI returned no move.');
      }
    } catch (err) {
      console.error('AI error', err);
      setError('Could not reach the AI backend. Is the server running?');
    } finally {
      busy.current = false;
      setIsThinking(false);
    }
  }, [fen, isPlayerTurn, isGameOver, makeMove]);

  useEffect(() => { doAIMove(); }, [doAIMove]);

  return { isThinking, error };
};
