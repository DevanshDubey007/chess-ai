import React from 'react';

const sampleGames = [
  { id: 1, moves: 45, result: '1-0', time: '2m 30s', cycle: 12 },
  { id: 2, moves: 78, result: '½-½', time: '4m 12s', cycle: 12 },
  { id: 3, moves: 32, result: '0-1', time: '1m 45s', cycle: 11 },
  { id: 4, moves: 56, result: '1-0', time: '3m 08s', cycle: 11 },
  { id: 5, moves: 91, result: '½-½', time: '5m 22s', cycle: 10 },
];

function getResultStyle(result) {
  if (result === '1-0') return { border: 'border-l-[var(--color-accent-green)]', text: 'text-[var(--color-accent-green)]', label: 'White wins' };
  if (result === '0-1') return { border: 'border-l-[var(--color-accent-red)]', text: 'text-[var(--color-accent-red)]', label: 'Black wins' };
  return { border: 'border-l-[var(--color-text-secondary)]', text: 'text-[var(--color-text-secondary)]', label: 'Draw' };
}

export default function RecentGames({ data }) {
  const games = data?.recent_games?.length > 0 ? data.recent_games.slice(0, 10) : sampleGames;

  return (
    <div className="rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
        Recent Self-Play Games
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: '260px' }}>
        {games.map((game, i) => {
          const style = getResultStyle(game.result);
          return (
            <div
              key={game.id || i}
              className={`flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-primary)]/50 border-l-2 ${style.border} transition-all duration-200 hover:bg-[var(--color-bg-primary)]`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[var(--color-text-secondary)] w-8">
                  #{game.id || i + 1}
                </span>
                <div>
                  <span className={`text-sm font-semibold ${style.text}`}>
                    {game.result}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)] ml-2">
                    {style.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                <span className="font-mono">{game.moves} moves</span>
                <span className="font-mono">{game.time}</span>
                <span className="px-1.5 py-0.5 rounded bg-[var(--color-border-card)] text-[10px]">
                  C{game.cycle}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
