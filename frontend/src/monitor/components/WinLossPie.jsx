import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label
} from 'recharts';

const COLORS = {
  win: '#00ff88',
  draw: '#888888',
  loss: '#ff4444',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="custom-tooltip">
      <p style={{ color: d.payload.fill, margin: 0, fontSize: '13px', fontWeight: 600 }}>
        {d.name}: {d.value} ({((d.value / d.payload.total) * 100).toFixed(1)}%)
      </p>
    </div>
  );
}

function CenterLabel({ viewBox, total }) {
  const { cx = 0, cy = 0 } = viewBox || {};
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#e0e0e0" fontSize="24" fontWeight="700" fontFamily="Inter">
        {total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#8888aa" fontSize="11" fontFamily="Inter">
        Total Games
      </text>
    </g>
  );
}

export default function WinLossPie({ data }) {
  const wins = data?.wins ?? 0;
  const draws = data?.draws ?? 0;
  const losses = data?.losses ?? 0;
  const total = wins + draws + losses;

  const chartData = total > 0
    ? [
        { name: 'Wins', value: wins, fill: COLORS.win, total },
        { name: 'Draws', value: draws, fill: COLORS.draw, total },
        { name: 'Losses', value: losses, fill: COLORS.loss, total },
      ]
    : [
        { name: 'Wins', value: 45, fill: COLORS.win, total: 100 },
        { name: 'Draws', value: 30, fill: COLORS.draw, total: 100 },
        { name: 'Losses', value: 25, fill: COLORS.loss, total: 100 },
      ];

  const displayTotal = total > 0 ? total : 100;

  return (
    <div className="rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 h-full">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
        Self-Play Results
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' }}
              />
            ))}
            <Label content={<CenterLabel total={displayTotal} />} position="center" />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            formatter={(value) => <span style={{ color: '#e0e0e0' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
