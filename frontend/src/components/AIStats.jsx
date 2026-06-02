import React, { useEffect, useState } from 'react';
import { getAIStats } from '../services/api';

const AIStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const data = await getAIStats();
        if (mounted) setStats(data);
      } catch (err) {
        console.error("Failed to load stats", err);
      }
    };
    fetchStats();
    // Refresh stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!stats) return <div className="glass-panel p-4 animate-pulse h-32 w-full max-w-sm"></div>;

  return (
    <div className="glass-panel p-4 w-full max-w-sm">
      <h3 className="text-lg font-semibold mb-3 text-primary-500 border-b border-gray-700 pb-2 flex items-center justify-between">
        <span>AlphaZero AI</span>
        <span className="text-xs bg-primary-600 px-2 py-1 rounded-full text-white">v{stats.checkpoint_version}</span>
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Estimated ELO</span>
          <span className="text-2xl font-bold text-white">{stats.elo}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Win Rate</span>
          <span className="text-2xl font-bold text-white">{(stats.win_rate * 100).toFixed(1)}%</span>
        </div>
        <div className="flex flex-col col-span-2">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Games Played (Self-Play)</span>
          <span className="text-xl font-medium text-gray-200">{stats.games_played.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default AIStats;
