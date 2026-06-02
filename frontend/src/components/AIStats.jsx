import React, { useEffect, useState } from 'react';
import { getAIStats } from '../services/api';

const AIStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const d = await getAIStats();
        if (alive) setStats(d);
      } catch { /* backend offline */ }
    };
    load();
    const id = setInterval(load, 10000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <div className="glass-panel" style={{ padding: 16, width: '100%', maxWidth: 340 }}>
      <h3 style={{ margin: 0, marginBottom: 12, fontSize: 15, fontWeight: 600, color: '#60a5fa', borderBottom: '1px solid rgba(255,255,255,.08)', paddingBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>AlphaZero AI</span>
        {stats && <span style={{ fontSize: 10, background: '#2563eb', padding: '2px 8px', borderRadius: 99, color: '#fff' }}>v{stats.checkpoint_version}</span>}
      </h3>
      {stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>ELO</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.elo}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Win Rate</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{(stats.win_rate * 100).toFixed(1)}%</div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Games Played</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#d1d5db' }}>{stats.games_played.toLocaleString()}</div>
          </div>
        </div>
      ) : (
        <p style={{ color: '#6b7280', fontSize: 13 }}>Backend offline — stats unavailable</p>
      )}
    </div>
  );
};

export default AIStats;
