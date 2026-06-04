import React, { useRef, useEffect } from 'react';
import { useLiveLog } from '../hooks/useLiveLog';

export default function LiveLog() {
  const { logs, isConnected } = useLiveLog();
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          Live Training Output
        </h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              isConnected
                ? 'bg-[var(--color-accent-green)] animate-pulse-glow'
                : 'bg-[var(--color-accent-red)]'
            }`}
            style={{ color: isConnected ? 'var(--color-accent-green)' : 'var(--color-accent-red)' }}
          />
          <span className="text-xs text-[var(--color-text-secondary)]">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="rounded-lg p-4 overflow-y-auto font-mono text-sm leading-relaxed"
        style={{
          backgroundColor: 'var(--color-terminal-bg)',
          height: '240px',
          maxHeight: '240px',
        }}
      >
        {logs.length === 0 ? (
          <div className="text-[var(--color-text-secondary)] italic flex items-center gap-2">
            <span className="inline-block w-2 h-4 bg-[var(--color-accent-green)] animate-pulse" />
            Waiting for training output...
          </div>
        ) : (
          logs.map((log, i) => (
            <div
              key={log.timestamp + '-' + i}
              className="hover:bg-white/5 px-1 rounded transition-colors duration-150"
            >
              <span className="text-[var(--color-accent-green)]">{log.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
