import React, { useEffect, useRef, useState } from 'react';
import { Plane, Ship, Car, Anchor, Navigation } from 'lucide-react';
import { LocationRecord } from '../types';
import { playBeep } from '../utils/sound';

interface WorldMapProps {
  from: LocationRecord;
  to: LocationRecord;
  history: LocationRecord[];
  mode: 'plane' | 'boat' | 'car' | 'submarine' | 'helicopter';
  chapter: number;
  totalChapters: number;
  onArrive: () => void;
}

// Simplified continent paths for SVG rendering (normalized 0-100 coordinate system)
const CONTINENT_PATHS = {
  northAmerica: `
    M 5,15 
    C 8,12 15,8 22,12 
    L 28,15 L 30,20 L 28,25 
    L 25,30 L 22,35 L 18,38 
    L 15,40 L 12,38 L 10,35 
    L 8,30 L 5,25 
    Z
  `,
  centralAmerica: `
    M 15,40 L 18,42 L 20,45 L 22,48 L 20,50 L 17,48 L 15,45 Z
  `,
  southAmerica: `
    M 22,50 
    L 28,52 L 32,58 L 35,65 
    L 33,72 L 30,78 L 27,82 
    L 24,78 L 22,70 L 20,60 
    L 21,55 
    Z
  `,
  europe: `
    M 45,18 
    L 48,16 L 52,15 L 56,16 
    L 60,18 L 58,22 L 55,24 
    L 52,26 L 48,28 L 45,26 
    L 44,22 
    Z
  `,
  africa: `
    M 45,35 
    L 50,32 L 55,34 L 60,38 
    L 62,45 L 60,55 L 58,62 
    L 55,68 L 52,72 L 48,68 
    L 45,60 L 43,50 L 44,42 
    Z
  `,
  asia: `
    M 58,10 
    L 65,8 L 75,10 L 85,15 
    L 90,20 L 88,28 L 85,32 
    L 80,35 L 75,38 L 70,40 
    L 65,38 L 62,34 L 60,28 
    L 58,20 
    Z
  `,
  india: `
    M 68,35 L 72,38 L 75,45 L 72,50 L 68,48 L 66,42 Z
  `,
  southeastAsia: `
    M 75,40 L 80,42 L 85,48 L 82,52 L 78,50 L 75,46 Z
  `,
  australia: `
    M 82,60 
    L 88,58 L 94,62 L 96,68 
    L 94,75 L 88,78 L 82,75 
    L 80,68 L 81,64 
    Z
  `,
  japan: `
    M 86,25 L 88,22 L 90,24 L 89,28 L 87,30 L 85,28 Z
  `,
  uk: `
    M 46,20 L 48,18 L 50,20 L 49,24 L 47,24 Z
  `,
  newZealand: `
    M 96,75 L 98,73 L 99,76 L 98,79 L 96,78 Z
  `,
  greenland: `
    M 32,5 L 38,3 L 42,6 L 40,12 L 35,14 L 32,10 Z
  `,
  madagascar: `
    M 62,62 L 64,60 L 66,63 L 65,68 L 62,67 Z
  `
};

const WorldMap: React.FC<WorldMapProps> = ({ from, to, history, mode, chapter, totalChapters, onArrive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [currentCoords, setCurrentCoords] = useState({ x: from.x, y: from.y });

  useEffect(() => {
    const duration = 5000;
    const startTime = Date.now();
    let animationFrameId: number;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const p = Math.min(elapsed / duration, 1);
      
      // Easing function for smoother movement
      const eased = p < 0.5 
        ? 2 * p * p 
        : 1 - Math.pow(-2 * p + 2, 2) / 2;
      
      setProgress(eased);
      
      // Calculate current position with great circle approximation
      const lat1 = from.y * Math.PI / 180;
      const lat2 = to.y * Math.PI / 180;
      const deltaLng = (to.x - from.x) * Math.PI / 180;
      
      // Simple interpolation with slight curve
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2 - Math.abs(to.x - from.x) * 0.1; // Arc upward
      
      // Quadratic bezier interpolation
      const t = eased;
      const curX = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * midX + t * t * to.x;
      const curY = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * midY + t * t * to.y;
      
      setCurrentCoords({ x: curX, y: curY });

      if (p < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setTimeout(onArrive, 500);
      }
    };

    playBeep(200);
    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [from, to, onArrive]);

  const getIcon = () => {
    const iconClass = "drop-shadow-[0_0_8px_currentColor]";
    switch (mode) {
      case 'plane': return <Plane className={`text-cyan-400 ${iconClass}`} size={28} style={{ transform: `rotate(${Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI + 90}deg)` }} />;
      case 'boat': return <Ship className={`text-blue-400 ${iconClass}`} size={28} />;
      case 'car': return <Car className={`text-yellow-400 ${iconClass}`} size={28} />;
      case 'submarine': return <Anchor className={`text-emerald-400 ${iconClass}`} size={28} />;
      case 'helicopter': return <Navigation className={`text-orange-400 ${iconClass}`} size={28} style={{ transform: `rotate(${Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI + 90}deg)` }} />;
      default: return <Plane className={`text-white ${iconClass}`} size={28} />;
    }
  };

  const eta = Math.max(0, Math.ceil((1 - progress) * 5));

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 relative overflow-hidden">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black" />
      
      {/* Stars */}
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 40}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: Math.random() * 0.5 + 0.2
            }}
          />
        ))}
      </div>

      {/* SVG Map */}
      <div className="relative flex-grow w-full overflow-hidden">
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            {/* Gradient for water */}
            <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0c1929" />
              <stop offset="50%" stopColor="#0f2744" />
              <stop offset="100%" stopColor="#0a1628" />
            </linearGradient>
            
            {/* Gradient for land */}
            <linearGradient id="landGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e3a2f" />
              <stop offset="100%" stopColor="#132821" />
            </linearGradient>
            
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Stronger glow for active elements */}
            <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Grid pattern */}
            <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#1e3a5f" strokeWidth="0.1" opacity="0.3"/>
            </pattern>
          </defs>
          
          {/* Ocean background */}
          <rect x="0" y="0" width="100" height="100" fill="url(#oceanGradient)" />
          
          {/* Grid overlay */}
          <rect x="0" y="0" width="100" height="100" fill="url(#grid)" />
          
          {/* Latitude/Longitude lines */}
          {[20, 40, 60, 80].map(y => (
            <line key={`lat-${y}`} x1="0" y1={y} x2="100" y2={y} stroke="#1e3a5f" strokeWidth="0.15" opacity="0.4" />
          ))}
          {[20, 40, 60, 80].map(x => (
            <line key={`lng-${x}`} x1={x} y1="0" x2={x} y2="100" stroke="#1e3a5f" strokeWidth="0.15" opacity="0.4" />
          ))}
          
          {/* Continents */}
          <g filter="url(#glow)">
            {Object.entries(CONTINENT_PATHS).map(([name, path]) => (
              <path
                key={name}
                d={path}
                fill="url(#landGradient)"
                stroke="#2d5a4a"
                strokeWidth="0.3"
                opacity="0.9"
              />
            ))}
          </g>
          
          {/* History trail */}
          {history.length > 1 && (
            <g opacity="0.5">
              {history.slice(0, -1).map((loc, i) => {
                const next = history[i + 1];
                return (
                  <line
                    key={`history-${i}`}
                    x1={loc.x}
                    y1={loc.y}
                    x2={next.x}
                    y2={next.y}
                    stroke="#64748b"
                    strokeWidth="0.3"
                    strokeDasharray="1,1"
                  />
                );
              })}
              {history.map((loc, i) => (
                <circle
                  key={`history-dot-${i}`}
                  cx={loc.x}
                  cy={loc.y}
                  r="0.8"
                  fill="#475569"
                  stroke="#64748b"
                  strokeWidth="0.2"
                />
              ))}
            </g>
          )}
          
          {/* Current travel path - curved */}
          <path
            d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - Math.abs(to.x - from.x) * 0.1} ${to.x} ${to.y}`}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="0.4"
            strokeDasharray="2,1"
            opacity="0.6"
          />
          
          {/* Traveled portion of path */}
          <path
            d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - Math.abs(to.x - from.x) * 0.1} ${currentCoords.x} ${currentCoords.y}`}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="0.5"
            filter="url(#strongGlow)"
          />
          
          {/* Origin point */}
          <g filter="url(#glow)">
            <circle cx={from.x} cy={from.y} r="1.5" fill="#22c55e" opacity="0.8" />
            <circle cx={from.x} cy={from.y} r="1" fill="#4ade80" />
            <circle cx={from.x} cy={from.y} r="0.4" fill="white" />
          </g>
          
          {/* Destination point - pulsing */}
          <g filter="url(#strongGlow)">
            <circle cx={to.x} cy={to.y} r="2.5" fill="#ef4444" opacity="0.3">
              <animate attributeName="r" values="2;3;2" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx={to.x} cy={to.y} r="1.5" fill="#dc2626" opacity="0.6" />
            <circle cx={to.x} cy={to.y} r="0.8" fill="#f87171" />
            
            {/* Crosshair */}
            <line x1={to.x - 3} y1={to.y} x2={to.x - 1.5} y2={to.y} stroke="#ef4444" strokeWidth="0.3" />
            <line x1={to.x + 1.5} y1={to.y} x2={to.x + 3} y2={to.y} stroke="#ef4444" strokeWidth="0.3" />
            <line x1={to.x} y1={to.y - 3} x2={to.x} y2={to.y - 1.5} stroke="#ef4444" strokeWidth="0.3" />
            <line x1={to.x} y1={to.y + 1.5} x2={to.x} y2={to.y + 3} stroke="#ef4444" strokeWidth="0.3" />
          </g>
        </svg>
        
        {/* Moving vehicle icon overlay */}
        <div 
          className="absolute z-20 transition-all duration-75 ease-linear"
          style={{ 
            left: `${currentCoords.x}%`, 
            top: `${currentCoords.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/30 blur-xl rounded-full w-12 h-12 -translate-x-1/2 -translate-y-1/2" />
            {getIcon()}
          </div>
        </div>

        {/* Location labels */}
        <div 
          className="absolute z-10 bg-slate-900/90 px-2 py-1 rounded text-xs font-mono border border-slate-700 backdrop-blur-sm"
          style={{ left: `${from.x}%`, top: `${from.y + 4}%`, transform: 'translateX(-50%)' }}
        >
          <div className="text-slate-500 text-[10px]">ORIGIN</div>
          <div className="text-emerald-400">{from.name}</div>
        </div>

        <div 
          className="absolute z-10 bg-slate-900/90 px-2 py-1 rounded text-xs font-mono border border-red-900/50 backdrop-blur-sm"
          style={{ left: `${to.x}%`, top: `${to.y + 4}%`, transform: 'translateX(-50%)' }}
        >
          <div className="text-slate-500 text-[10px]">TARGET</div>
          <div className="text-red-400 font-bold">{to.name}</div>
        </div>
      </div>

      {/* Bottom HUD Panel */}
      <div className="bg-gradient-to-t from-black via-slate-900/95 to-transparent border-t border-slate-800/50 p-4 h-28 flex items-center justify-between z-30 backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <span className="text-slate-600 text-[10px] font-mono tracking-[0.2em] uppercase">Mission</span>
          <span className="text-white text-2xl font-black tracking-tight">
            Chapter {chapter}
            <span className="text-slate-600 font-normal text-lg ml-1">/ {totalChapters}</span>
          </span>
        </div>
        
        <div className="flex flex-col items-center gap-2 flex-1 max-w-md mx-8">
          <div className="flex justify-between text-[10px] font-mono text-slate-500 w-full uppercase tracking-widest">
            <span>Transit Progress</span>
            <span className="text-cyan-400">{Math.floor(progress * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50">
            <div 
              className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300 transition-all duration-75 relative"
              style={{ width: `${progress * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-slate-600 text-[10px] font-mono tracking-[0.2em] uppercase">ETA</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-mono font-bold ${eta <= 1 ? 'text-emerald-400' : 'text-white'}`}>
              {eta}
            </span>
            <span className="text-slate-500 text-sm">SEC</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
