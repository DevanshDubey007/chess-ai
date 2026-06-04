import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMonitorStats } from './hooks/useMonitorStats';
import { fetchArchitecture } from './services/api';
import StatCards from './components/StatCards';
import LossGraph from './components/LossGraph';
import EloGraph from './components/EloGraph';
import MoveHeatmap from './components/MoveHeatmap';
import WinLossPie from './components/WinLossPie';
import RecentGames from './components/RecentGames';
import LiveLog from './components/LiveLog';
import NeuralNetDiagram from './components/NeuralNetDiagram';
import ExperienceBar from './components/ExperienceBar';

function getStatusInfo(data) {
  if (!data) return { label: 'Offline', color: 'bg-gray-500', pulse: false };
  const status = data.status || data.phase || '';
  if (status.toLowerCase().includes('train')) return { label: 'Training', color: 'bg-yellow-400', pulse: true };
  if (status.toLowerCase().includes('play') || status.toLowerCase().includes('self')) return { label: 'Self-Playing', color: 'bg-[var(--color-accent-green)]', pulse: true };
  if (status.toLowerCase().includes('idle')) return { label: 'Idle', color: 'bg-gray-500', pulse: false };
  return { label: status || 'Active', color: 'bg-[var(--color-accent-green)]', pulse: true };
}

function formatTime(timestamp) {
  if (!timestamp) return 'Never';
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString();
  } catch {
    return String(timestamp);
  }
}

export default function MonitorApp() {
  const { data, isLoading, isError } = useMonitorStats();
  const { data: archData } = useQuery({
    queryKey: ['architecture'],
    queryFn: fetchArchitecture,
    staleTime: 60000,
    retry: 1,
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  const statusInfo = getStatusInfo(data);
  const cycle = data?.current_cycle ?? data?.cycle ?? '—';
  const lastCheckpoint = data?.last_checkpoint ?? data?.last_save ?? null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Offline Banner */}
      {isError && (
        <div className="sticky top-0 z-50 bg-[var(--color-accent-red)]/90 text-white text-center py-2 text-sm font-semibold backdrop-blur-sm">
          ⚠️ AI Offline — Cannot reach backend at 127.0.0.1:5000
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-[var(--color-border-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
                <Link to="/" className="text-sm font-normal text-[var(--color-text-secondary)] hover:text-white transition-colors">
                  ← Back
                </Link>
                <span><span className="text-[var(--color-accent-cyan)]">♛</span> AlphaZero Chess</span>
                <span className="text-[var(--color-text-secondary)] font-normal text-sm ml-2 hidden sm:inline">
                  AI Training Monitor
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-bg-primary)]/50 border border-[var(--color-border-card)]">
                <div
                  className={`w-2 h-2 rounded-full ${statusInfo.color} ${statusInfo.pulse ? 'animate-pulse-glow' : ''}`}
                  style={{ color: statusInfo.pulse ? 'var(--color-accent-green)' : 'gray' }}
                />
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {statusInfo.label}
                </span>
              </div>

              {/* Cycle Badge */}
              <div className="px-3 py-1.5 rounded-full bg-[var(--color-accent-cyan)]/10 border border-[var(--color-accent-cyan)]/30">
                <span className="text-xs font-mono font-semibold text-[var(--color-accent-cyan)]">
                  Cycle: {cycle}
                </span>
              </div>

              {/* Last Checkpoint */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                <span>💾</span>
                <span>Last save: {formatTime(lastCheckpoint)}</span>
              </div>

              {/* Auto-refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer ${
                  autoRefresh
                    ? 'bg-[var(--color-accent-cyan)]/10 border-[var(--color-accent-cyan)]/30 text-[var(--color-accent-cyan)]'
                    : 'bg-transparent border-[var(--color-border-card)] text-[var(--color-text-secondary)]'
                }`}
              >
                {autoRefresh ? '⟳ Auto' : '⏸ Paused'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Loading State */}
        {isLoading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-3 border-[var(--color-accent-cyan)] border-t-transparent rounded-full animate-spin" />
              <span className="text-[var(--color-text-secondary)] text-sm">Connecting to training backend...</span>
            </div>
          </div>
        )}

        {/* Row 1: Stat Cards */}
        <StatCards data={data} />

        {/* Row 2: Loss Graph + ELO Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LossGraph data={data} />
          <EloGraph data={data} />
        </div>

        {/* Row 3: Heatmap + Pie + Recent Games */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-2">
            <MoveHeatmap data={data} />
          </div>
          <div className="md:col-span-1">
            <WinLossPie data={data} />
          </div>
          <div className="md:col-span-2">
            <RecentGames data={data} />
          </div>
        </div>

        {/* Row 4: Live Log */}
        <LiveLog />

        {/* Collapsible: Neural Net Diagram */}
        <NeuralNetDiagram data={archData} />

        {/* Bottom: Experience Bar */}
        <ExperienceBar data={data} />
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border-card)] mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
          <span>AlphaZero Chess Training Monitor</span>
          <span>Refreshing every 5s</span>
        </div>
      </footer>
    </div>
  );
}
