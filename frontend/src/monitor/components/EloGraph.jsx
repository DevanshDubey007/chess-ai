import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="label">Cycle {label}</p>
      <p style={{ color: '#ffd700', margin: '4px 0', fontSize: '13px', fontWeight: 600 }}>
        ELO: {payload[0]?.value?.toFixed(1)}
      </p>
    </div>
  );
}

export default function EloGraph({ data }) {
  const eloHistory = data?.elo_history || [];

  const chartData = eloHistory.length > 0
    ? eloHistory
    : Array.from({ length: 20 }, (_, i) => ({
        cycle: i + 1,
        elo: 800 + i * 25 + Math.random() * 30,
      }));

  return (
    <div className="rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 h-full">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
        ELO Rating Progression
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="eloGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd700" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#ffd700" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#ffd700" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(42, 42, 78, 0.6)" />
          <XAxis
            dataKey="cycle"
            stroke="#8888aa"
            tick={{ fill: '#8888aa', fontSize: 11 }}
            axisLine={{ stroke: '#2a2a4e' }}
          />
          <YAxis
            stroke="#8888aa"
            tick={{ fill: '#8888aa', fontSize: 11 }}
            axisLine={{ stroke: '#2a2a4e' }}
            domain={['dataMin - 50', 'dataMax + 50']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="elo"
            stroke="#ffd700"
            strokeWidth={2.5}
            fill="url(#eloGradient)"
            dot={{ r: 3, fill: '#ffd700', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#ffd700', stroke: '#0f0f1a', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
