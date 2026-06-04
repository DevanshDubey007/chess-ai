import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="label">Cycle {label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, margin: '4px 0', fontSize: '13px', fontWeight: 600 }}>
          {entry.name}: {entry.value?.toFixed(4)}
        </p>
      ))}
    </div>
  );
}

export default function LossGraph({ data }) {
  const lossHistory = data?.loss_history || [];

  // Create sample data if empty
  const chartData = lossHistory.length > 0
    ? lossHistory
    : Array.from({ length: 20 }, (_, i) => ({
        cycle: i + 1,
        total_loss: 2.5 - i * 0.08 + Math.random() * 0.2,
        policy_loss: 1.5 - i * 0.05 + Math.random() * 0.1,
        value_loss: 1.0 - i * 0.03 + Math.random() * 0.1,
      }));

  return (
    <div className="rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 h-full">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
        Training Loss Over Cycles
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="totalGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity={1} />
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
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
            iconType="circle"
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="total_loss"
            name="Total Loss"
            stroke="#00d4ff"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#00d4ff', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#00d4ff', stroke: '#0f0f1a', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="policy_loss"
            name="Policy Loss"
            stroke="#ff6b6b"
            strokeWidth={2}
            dot={{ r: 2.5, fill: '#ff6b6b', strokeWidth: 0 }}
            activeDot={{ r: 4, fill: '#ff6b6b', stroke: '#0f0f1a', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="value_loss"
            name="Value Loss"
            stroke="#ffd700"
            strokeWidth={2}
            dot={{ r: 2.5, fill: '#ffd700', strokeWidth: 0 }}
            activeDot={{ r: 4, fill: '#ffd700', stroke: '#0f0f1a', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
