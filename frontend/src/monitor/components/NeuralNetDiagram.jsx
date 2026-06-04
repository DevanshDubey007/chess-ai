import React, { useState } from 'react';

export default function NeuralNetDiagram({ data }) {
  const [isOpen, setIsOpen] = useState(false);
  const arch = data || {};
  const totalParams = arch.total_params?.toLocaleString() ?? '~2.1M';

  return (
    <div className="rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[var(--color-bg-primary)]/30 transition-colors duration-200 cursor-pointer"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          🧠 Neural Network Architecture
        </h3>
        <span className={`text-[var(--color-text-secondary)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: isOpen ? '800px' : '0px' }}
      >
        <div className="px-5 pb-5">
          <div className="flex justify-center">
            <svg viewBox="0 0 500 580" className="w-full max-w-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
              {/* Background glow */}
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="inputGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="resGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4488ff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#4488ff" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="policyGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00ff88" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="valueGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff4444" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ff4444" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Input Layer */}
              <rect x="150" y="20" width="200" height="50" rx="8" fill="url(#inputGrad)" stroke="#00d4ff" strokeWidth="1.5" filter="url(#glow)" />
              <text x="250" y="40" textAnchor="middle" fill="#00d4ff" fontSize="11" fontWeight="600">INPUT LAYER</text>
              <text x="250" y="57" textAnchor="middle" fill="#e0e0e0" fontSize="13" fontWeight="700">19 × 8 × 8</text>

              {/* Arrow down */}
              <line x1="250" y1="70" x2="250" y2="100" stroke="#4488ff" strokeWidth="1.5" strokeDasharray="4 2" />
              <polygon points="244,96 250,106 256,96" fill="#4488ff" />

              {/* Residual Blocks */}
              <rect x="120" y="110" width="260" height="180" rx="10" fill="url(#resGrad)" stroke="#4488ff" strokeWidth="1.5" />
              <text x="250" y="133" textAnchor="middle" fill="#4488ff" fontSize="12" fontWeight="600">6 RESIDUAL BLOCKS</text>

              {/* Res block detail */}
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <rect x="145" y={148 + i * 45} width="210" height="35" rx="5" fill="rgba(68, 136, 255, 0.1)" stroke="#4488ff" strokeWidth="0.5" strokeOpacity="0.5" />
                  <text x="250" y={163 + i * 45} textAnchor="middle" fill="#8888aa" fontSize="9">
                    Conv3×3 → BN → ReLU → Conv3×3 → BN
                  </text>
                  <text x="250" y={175 + i * 45} textAnchor="middle" fill="#4488ff" fontSize="8" fontWeight="500">
                    + Skip Connection
                  </text>
                </g>
              ))}

              {/* Split arrows */}
              <line x1="250" y1="290" x2="250" y2="310" stroke="#8888aa" strokeWidth="1.5" strokeDasharray="4 2" />
              <line x1="250" y1="310" x2="145" y2="340" stroke="#00ff88" strokeWidth="1.5" />
              <polygon points="139,336 145,346 151,336" fill="#00ff88" />
              <line x1="250" y1="310" x2="355" y2="340" stroke="#ff4444" strokeWidth="1.5" />
              <polygon points="349,336 355,346 361,336" fill="#ff4444" />

              {/* Policy Head */}
              <rect x="60" y="350" width="170" height="55" rx="8" fill="url(#policyGrad)" stroke="#00ff88" strokeWidth="1.5" filter="url(#glow)" />
              <text x="145" y="370" textAnchor="middle" fill="#00ff88" fontSize="11" fontWeight="600">POLICY HEAD</text>
              <text x="145" y="390" textAnchor="middle" fill="#e0e0e0" fontSize="10">Conv1×1 → FC</text>

              <line x1="145" y1="405" x2="145" y2="430" stroke="#00ff88" strokeWidth="1" strokeDasharray="3 2" />
              <polygon points="140,426 145,434 150,426" fill="#00ff88" />

              <rect x="60" y="438" width="170" height="35" rx="6" fill="rgba(0,255,136,0.05)" stroke="#00ff88" strokeWidth="0.8" strokeOpacity="0.5" />
              <text x="145" y="460" textAnchor="middle" fill="#00ff88" fontSize="10" fontWeight="500">20,160 move probabilities</text>

              {/* Value Head */}
              <rect x="270" y="350" width="170" height="55" rx="8" fill="url(#valueGrad)" stroke="#ff4444" strokeWidth="1.5" filter="url(#glow)" />
              <text x="355" y="370" textAnchor="middle" fill="#ff4444" fontSize="11" fontWeight="600">VALUE HEAD</text>
              <text x="355" y="390" textAnchor="middle" fill="#e0e0e0" fontSize="10">Conv1×1 → FC → tanh</text>

              <line x1="355" y1="405" x2="355" y2="430" stroke="#ff4444" strokeWidth="1" strokeDasharray="3 2" />
              <polygon points="350,426 355,434 360,426" fill="#ff4444" />

              <rect x="270" y="438" width="170" height="35" rx="6" fill="rgba(255,68,68,0.05)" stroke="#ff4444" strokeWidth="0.8" strokeOpacity="0.5" />
              <text x="355" y="460" textAnchor="middle" fill="#ff4444" fontSize="10" fontWeight="500">-1 to +1 win probability</text>

              {/* Total params */}
              <rect x="155" y="500" width="190" height="35" rx="8" fill="rgba(255,215,0,0.08)" stroke="#ffd700" strokeWidth="1" strokeOpacity="0.5" />
              <text x="250" y="515" textAnchor="middle" fill="#ffd700" fontSize="9" fontWeight="500">TOTAL PARAMETERS</text>
              <text x="250" y="528" textAnchor="middle" fill="#ffd700" fontSize="14" fontWeight="700">{totalParams}</text>

              {/* Decorative dots */}
              {[0, 1, 2].map(i => (
                <circle key={i} cx={250} cy={295 + i * 5} r="1" fill="#8888aa" opacity="0.5" />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
