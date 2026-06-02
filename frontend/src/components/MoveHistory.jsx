import React from 'react';
import useGameStore from '../store/gameStore';

const MoveHistory = () => {
  const history = useGameStore(s => s.history);

  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: history[i]?.san ?? '',
      black: history[i + 1]?.san ?? '',
    });
  }

  return (
    <div className="glass-panel" style={{ padding: 16, width: '100%', maxWidth: 340, maxHeight: 260, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: 0, marginBottom: 10, fontSize: 15, fontWeight: 600, color: '#60a5fa', borderBottom: '1px solid rgba(255,255,255,.08)', paddingBottom: 8 }}>
        Move History
      </h3>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {pairs.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 13, fontStyle: 'italic' }}>No moves yet…</p>
        ) : (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              {pairs.map(p => (
                <tr key={p.num} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding: '3px 0', color: '#6b7280', width: 30 }}>{p.num}.</td>
                  <td style={{ padding: '3px 0', fontWeight: 500 }}>{p.white}</td>
                  <td style={{ padding: '3px 0', fontWeight: 500, color: '#d1d5db' }}>{p.black}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MoveHistory;
