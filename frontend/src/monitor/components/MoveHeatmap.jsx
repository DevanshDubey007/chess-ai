import React, { useMemo } from 'react';

const COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ROWS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function getHeatColor(value, max) {
  if (max === 0 || value === 0) return 'rgba(42, 42, 78, 0.3)';
  const ratio = Math.min(value / max, 1);
  // From cool blue/purple → warm yellow → hot red
  if (ratio < 0.25) {
    const t = ratio / 0.25;
    return `rgba(42, 42, ${Math.round(78 + t * 100)}, ${0.3 + t * 0.3})`;
  } else if (ratio < 0.5) {
    const t = (ratio - 0.25) / 0.25;
    const r = Math.round(t * 255);
    const g = Math.round(180 + t * 75);
    return `rgba(${r}, ${g}, 0, ${0.5 + t * 0.2})`;
  } else if (ratio < 0.75) {
    const t = (ratio - 0.5) / 0.25;
    return `rgba(255, ${Math.round(200 - t * 120)}, 0, ${0.7 + t * 0.15})`;
  } else {
    const t = (ratio - 0.75) / 0.25;
    return `rgba(255, ${Math.round(80 - t * 40)}, ${Math.round(t * 30)}, ${0.85 + t * 0.15})`;
  }
}

export default function MoveHeatmap({ data }) {
  const heatmapData = data?.move_heatmap || null;

  const { grid, maxVal } = useMemo(() => {
    const grid = Array.from({ length: 8 }, () => Array(8).fill(0));
    let maxVal = 0;

    if (heatmapData && typeof heatmapData === 'object') {
      // heatmapData can be { "e4": 150, "d4": 120, ... } or a 2D array
      if (Array.isArray(heatmapData)) {
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const val = heatmapData[r]?.[c] || 0;
            grid[r][c] = val;
            maxVal = Math.max(maxVal, val);
          }
        }
      } else {
        for (const [sq, count] of Object.entries(heatmapData)) {
          const col = sq.charCodeAt(0) - 97; // 'a' = 0
          const row = 8 - parseInt(sq[1]); // '8' = 0
          if (col >= 0 && col < 8 && row >= 0 && row < 8) {
            grid[row][col] = count;
            maxVal = Math.max(maxVal, count);
          }
        }
      }
    } else {
      // Sample data for demo
      const centers = [[3, 3], [3, 4], [4, 3], [4, 4], [2, 4], [5, 3]];
      centers.forEach(([r, c]) => {
        grid[r][c] = 80 + Math.floor(Math.random() * 60);
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && (dr !== 0 || dc !== 0)) {
              grid[nr][nc] = Math.max(grid[nr][nc], 20 + Math.floor(Math.random() * 40));
            }
          }
        }
      });
      for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++)
          maxVal = Math.max(maxVal, grid[r][c]);
    }

    return { grid, maxVal };
  }, [heatmapData]);

  return (
    <div className="rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 h-full">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
        Most Explored Squares
      </h3>
      <div className="flex justify-center">
        <div>
          {/* Column labels */}
          <div className="flex ml-6">
            {COLS.map(c => (
              <div key={c} className="w-9 h-5 flex items-center justify-center text-xs text-[var(--color-text-secondary)] font-mono">
                {c}
              </div>
            ))}
          </div>
          {/* Grid */}
          {ROWS.map((rowLabel, ri) => (
            <div key={ri} className="flex items-center">
              <div className="w-6 h-9 flex items-center justify-center text-xs text-[var(--color-text-secondary)] font-mono">
                {rowLabel}
              </div>
              {COLS.map((_, ci) => {
                const val = grid[ri][ci];
                return (
                  <div
                    key={ci}
                    className="w-9 h-9 border border-[var(--color-border-card)]/30 flex items-center justify-center text-[10px] font-mono transition-all duration-300 hover:scale-110 hover:z-10 cursor-default rounded-sm"
                    style={{ backgroundColor: getHeatColor(val, maxVal) }}
                    title={`${COLS[ci]}${ROWS[ri]}: ${val} visits`}
                  >
                    {val > 0 && (
                      <span className="text-white/80 font-medium drop-shadow-sm">
                        {val}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center justify-center mt-3 gap-2">
            <span className="text-[10px] text-[var(--color-text-secondary)]">Low</span>
            <div className="flex h-2 rounded-full overflow-hidden">
              {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0].map((r, i) => (
                <div key={i} className="w-6 h-2" style={{ backgroundColor: getHeatColor(r * 100, 100) }} />
              ))}
            </div>
            <span className="text-[10px] text-[var(--color-text-secondary)]">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
