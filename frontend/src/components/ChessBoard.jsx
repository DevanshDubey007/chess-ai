import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import useGameStore from '../store/gameStore';
import { useAI } from '../hooks/useAI';

/* ── piece symbols ── */
const PIECE_SYMBOLS = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['8','7','6','5','4','3','2','1'];

/* ── colors ── */
const LIGHT_SQ   = '#eae0c8';
const DARK_SQ    = '#a98360';
const SEL_LIGHT  = '#f5f682';
const SEL_DARK   = '#baca44';
const LAST_LIGHT = '#ced26b88';
const LAST_DARK  = '#a9a438aa';

const ChessBoardComponent = () => {
  /* ── store ── */
  const game        = useGameStore(s => s.game);
  const fen         = useGameStore(s => s.fen);
  const playerColor = useGameStore(s => s.playerColor);
  const isPlayerTurn= useGameStore(s => s.isPlayerTurn);
  const isGameOver  = useGameStore(s => s.isGameOver);
  const makeMove    = useGameStore(s => s.makeMove);
  const lastMove    = useGameStore(s => s.lastMove);

  const { isThinking, error } = useAI();

  /* ── local state ── */
  const [selected, setSelected]     = useState(null);   // algebraic id e.g. "e2"
  const [legalTargets, setLegal]    = useState([]);      // ["e3","e4"]
  const [boardSize, setBoardSize]   = useState(480);
  const [dragState, setDragState]   = useState(null);    // { sq, piece, isDragging }

  const boardRef        = useRef(null);
  const floatingRef     = useRef(null);
  const pointerStart    = useRef(null);
  const DRAG_THRESHOLD  = 5;

  /* ── responsive size ── */
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setBoardSize(Math.max(280, Math.min(vw - 48, vh - 220, 600)));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const squareSize = boardSize / 8;

  /* ── derive board array from fen ── */
  const boardArray = useMemo(() => game.board(), [fen]);

  /* ── helpers ── */
  const canInteract = isPlayerTurn && !isGameOver && !isThinking;

  const selectPiece = useCallback((sq) => {
    setSelected(sq);
    const moves = game.moves({ square: sq, verbose: true });
    setLegal(moves.map(m => m.to));
  }, [game]);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setLegal([]);
  }, []);

  const attemptMove = useCallback((from, to) => {
    const ok = makeMove({ from, to, promotion: 'q' });
    clearSelection();
    return ok;
  }, [makeMove, clearSelection]);

  /* ── pointer handlers ── */
  const handlePointerDown = useCallback((e, sq) => {
    if (!canInteract) return;

    const piece = game.get(sq);

    // If clicking target while something is selected → try to move
    if (selected && selected !== sq) {
      if (attemptMove(selected, sq)) return;
      // fall through to re-select / clear
    }

    // Select own piece
    if (piece && piece.color === game.turn()) {
      selectPiece(sq);
      pointerStart.current = { x: e.clientX, y: e.clientY, sq, piece };
      setDragState({ sq, piece, isDragging: false });
      // capture pointer on the board so we get move/up even outside
      boardRef.current?.setPointerCapture(e.pointerId);
    } else {
      clearSelection();
    }
  }, [canInteract, game, selected, attemptMove, selectPiece, clearSelection]);

  const handlePointerMove = useCallback((e) => {
    if (!pointerStart.current || !dragState) return;

    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist > DRAG_THRESHOLD) {
      if (!dragState.isDragging) {
        setDragState(d => d ? { ...d, isDragging: true } : null);
      }
      if (floatingRef.current) {
        floatingRef.current.style.display = 'flex';
        floatingRef.current.style.left = e.clientX + 'px';
        floatingRef.current.style.top  = e.clientY + 'px';
      }
    }
  }, [dragState]);

  const handlePointerUp = useCallback((e) => {
    if (dragState?.isDragging && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      let col = Math.floor((e.clientX - rect.left) / (rect.width  / 8));
      let row = Math.floor((e.clientY - rect.top)  / (rect.height / 8));
      col = Math.max(0, Math.min(7, col));
      row = Math.max(0, Math.min(7, row));

      // correct for orientation
      const bCol = playerColor === 'w' ? col : 7 - col;
      const bRow = playerColor === 'w' ? row : 7 - row;
      const targetSq = FILES[bCol] + RANKS[bRow];

      attemptMove(dragState.sq, targetSq);
    }

    // cleanup
    if (floatingRef.current) floatingRef.current.style.display = 'none';
    setDragState(null);
    pointerStart.current = null;
  }, [dragState, playerColor, attemptMove]);

  /* ── render squares ── */
  const squares = [];
  for (let renderRow = 0; renderRow < 8; renderRow++) {
    for (let renderCol = 0; renderCol < 8; renderCol++) {
      const bRow = playerColor === 'w' ? renderRow : 7 - renderRow;
      const bCol = playerColor === 'w' ? renderCol : 7 - renderCol;
      const sq   = FILES[bCol] + RANKS[bRow];

      const cell   = boardArray[bRow][bCol];     // null or { type, color }
      const isLight = (bRow + bCol) % 2 === 0;
      const isSel   = selected === sq;
      const isLegalTarget = legalTargets.includes(sq);
      const isLast  = lastMove && (lastMove.from === sq || lastMove.to === sq);
      const isDragSource = dragState?.isDragging && dragState.sq === sq;

      // square colour
      let bg = isLight ? LIGHT_SQ : DARK_SQ;
      if (isSel)   bg = isLight ? SEL_LIGHT : SEL_DARK;
      else if (isLast) bg = isLight ? LAST_LIGHT : LAST_DARK;

      const pieceKey = cell ? cell.color + cell.type : null;

      squares.push(
        <div
          key={sq}
          data-square={sq}
          onPointerDown={(e) => handlePointerDown(e, sq)}
          style={{
            position: 'relative',
            width:  '100%',
            height: '100%',
            backgroundColor: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (cell && canInteract && cell.color === game.turn()) ? 'grab' : 'default',
            touchAction: 'none',               // avoid scroll on touch
            userSelect: 'none',
          }}
        >
          {/* piece */}
          {pieceKey && (
            <span
              style={{
                fontSize: squareSize * 0.82,
                lineHeight: 1,
                pointerEvents: 'none',          // clicks pass to square
                userSelect: 'none',
                opacity: isDragSource ? 0.25 : 1,
                transition: 'opacity 0.1s',
                color: cell.color === 'w' ? '#fff' : '#1a1a2e',
                textShadow: cell.color === 'w'
                  ? '0 1px 3px rgba(0,0,0,.55), 0 0 1px #000'
                  : '0 1px 2px rgba(255,255,255,.25)',
                filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.3))',
              }}
            >
              {PIECE_SYMBOLS[pieceKey]}
            </span>
          )}

          {/* legal-move dot (empty square) */}
          {isLegalTarget && !cell && (
            <div style={{
              position: 'absolute',
              width: '28%', height: '28%',
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,.18)',
              pointerEvents: 'none',
            }} />
          )}

          {/* legal-move ring (capture square) */}
          {isLegalTarget && cell && (
            <div style={{
              position: 'absolute', inset: 3,
              borderRadius: '50%',
              border: '3px solid rgba(0,0,0,.25)',
              pointerEvents: 'none',
            }} />
          )}

          {/* coordinate labels on edge squares */}
          {renderCol === 0 && (
            <span style={{
              position: 'absolute', top: 2, left: 3,
              fontSize: 10, fontWeight: 700, lineHeight: 1,
              color: isLight ? DARK_SQ : LIGHT_SQ,
              opacity: 0.8, pointerEvents: 'none',
            }}>{RANKS[bRow]}</span>
          )}
          {renderRow === 7 && (
            <span style={{
              position: 'absolute', bottom: 1, right: 3,
              fontSize: 10, fontWeight: 700, lineHeight: 1,
              color: isLight ? DARK_SQ : LIGHT_SQ,
              opacity: 0.8, pointerEvents: 'none',
            }}>{FILES[bCol]}</span>
          )}
        </div>
      );
    }
  }

  /* ── floating drag piece ── */
  const floatingPiece = dragState?.piece ? (
    <div
      ref={floatingRef}
      style={{
        display: 'none',
        position: 'fixed',
        transform: 'translate(-50%, -50%)',
        fontSize: squareSize * 0.95,
        lineHeight: 1,
        pointerEvents: 'none',
        zIndex: 9999,
        color: dragState.piece.color === 'w' ? '#fff' : '#1a1a2e',
        textShadow: dragState.piece.color === 'w'
          ? '0 2px 6px rgba(0,0,0,.6), 0 0 2px #000'
          : '0 2px 4px rgba(255,255,255,.3)',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.45))',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {PIECE_SYMBOLS[dragState.piece.color + dragState.piece.type]}
    </div>
  ) : null;

  return (
    <div className="board-outer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* board */}
      <div
        ref={boardRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(8, 1fr)',
          width: boardSize,
          height: boardSize,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(59,130,246,.12), 0 8px 40px rgba(0,0,0,.55)',
          position: 'relative',
          touchAction: 'none',
        }}
      >
        {squares}
      </div>

      {/* thinking indicator */}
      {isThinking && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          color: '#93c5fd', fontSize: 14, fontWeight: 500,
        }}>
          <span className="spinner" />
          AI is thinking…
        </div>
      )}

      {/* error */}
      {error && (
        <div style={{
          color: '#fca5a5', fontSize: 13, textAlign: 'center',
          background: 'rgba(127,29,29,.2)', borderRadius: 8,
          padding: '6px 16px', border: '1px solid rgba(239,68,68,.25)',
        }}>
          {error}
        </div>
      )}

      {/* floating drag piece */}
      {floatingPiece}
    </div>
  );
};

export default ChessBoardComponent;
