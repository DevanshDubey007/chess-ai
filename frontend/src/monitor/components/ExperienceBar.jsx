import React, { useMemo } from 'react';

const MILESTONES = [
  { at: 1000, label: 'Random', emoji: '🎲' },
  { at: 5000, label: 'Beginner', emoji: '🌱' },
  { at: 10000, label: 'Intermediate', emoji: '♟️' },
  { at: 50000, label: 'Advanced', emoji: '⚔️' },
  { at: 100000, label: 'Expert', emoji: '👑' },
];

const MAX_BUFFER = 100000;

export default function ExperienceBar({ data }) {
  const bufferSize = data?.buffer_size ?? 0;
  const percentage = Math.min((bufferSize / MAX_BUFFER) * 100, 100);

  const currentLevel = useMemo(() => {
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (bufferSize >= MILESTONES[i].at) return MILESTONES[i];
    }
    return { label: 'Initializing', emoji: '⏳' };
  }, [bufferSize]);

  return (
    <div className="rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          AI Experience Level
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentLevel.emoji}</span>
          <span className="text-sm font-semibold text-[var(--color-accent-gold)]">
            {currentLevel.label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-4 rounded-full bg-[var(--color-bg-primary)] overflow-hidden border border-[var(--color-border-card)]">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out relative"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, #00d4ff 0%, #00ff88 40%, #ffd700 70%, #ff6b6b 100%)',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.2)',
            }}
          >
            {/* Glowing tip */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full animate-pulse-glow"
              style={{
                backgroundColor: '#00d4ff',
                color: '#00d4ff',
                boxShadow: '0 0 12px #00d4ff',
              }}
            />
          </div>
        </div>

        {/* Milestone markers */}
        <div className="relative mt-1" style={{ height: '40px' }}>
          {MILESTONES.map((m) => {
            const pos = (m.at / MAX_BUFFER) * 100;
            const isPassed = bufferSize >= m.at;
            return (
              <div
                key={m.at}
                className="absolute flex flex-col items-center -translate-x-1/2"
                style={{ left: `${pos}%` }}
              >
                <div
                  className={`w-0.5 h-3 ${isPassed ? 'bg-[var(--color-accent-cyan)]' : 'bg-[var(--color-border-card)]'}`}
                />
                <span
                  className={`text-[9px] mt-0.5 whitespace-nowrap font-medium ${
                    isPassed ? 'text-[var(--color-accent-cyan)]' : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {m.emoji} {m.label}
                </span>
                <span className="text-[8px] text-[var(--color-text-secondary)] font-mono">
                  {m.at >= 1000 ? `${m.at / 1000}k` : m.at}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Buffer count */}
      <div className="text-center mt-2">
        <span className="text-xs text-[var(--color-text-secondary)]">
          {bufferSize.toLocaleString()} / {MAX_BUFFER.toLocaleString()} experiences
        </span>
      </div>
    </div>
  );
}
