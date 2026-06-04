import React from 'react';

const defaultCards = [
  { label: 'Total Games', key: 'total_games', icon: '🎮', format: (v) => v?.toLocaleString() ?? '0' },
  { label: 'Buffer Size', key: 'buffer_size', icon: '📦', format: (v) => v?.toLocaleString() ?? '0' },
  { label: 'Current ELO', key: 'current_elo', icon: '📈', format: (v) => v?.toFixed(0) ?? '—' },
  { label: 'Latest Loss', key: 'latest_loss', icon: '📉', format: (v) => v?.toFixed(4) ?? '—' },
];

function TrendIndicator({ value, prevValue, invert = false }) {
  if (value == null || prevValue == null || value === prevValue) {
    return <span className="text-[var(--color-text-secondary)] text-sm ml-2">—</span>;
  }
  const isUp = value > prevValue;
  const isGood = invert ? !isUp : isUp;
  return (
    <span className={`text-sm ml-2 font-semibold ${isGood ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>
      {isUp ? '↑' : '↓'}
    </span>
  );
}

export default function StatCards({ data }) {
  const stats = data || {};
  const prevStats = stats.previous || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {defaultCards.map((card, i) => {
        const value = stats[card.key];
        const prevValue = prevStats[card.key];
        return (
          <div
            key={card.key}
            className="animate-fade-in relative overflow-hidden rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 transition-all duration-300 hover:border-[var(--color-accent-cyan)]/50 hover:shadow-lg hover:shadow-[var(--color-accent-cyan)]/5"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 animate-shimmer opacity-30 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[var(--color-text-secondary)] text-sm font-medium uppercase tracking-wider">
                  {card.label}
                </span>
                <span className="text-xl">{card.icon}</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-[var(--color-accent-cyan)] num-transition tabular-nums">
                  {card.format(value)}
                </span>
                <TrendIndicator
                  value={value}
                  prevValue={prevValue}
                  invert={card.key === 'latest_loss'}
                />
              </div>
            </div>

            {/* Bottom accent bar */}
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{
                background: `linear-gradient(90deg, var(--color-accent-cyan), transparent)`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
