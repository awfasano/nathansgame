import React, { useState, useRef, useCallback } from 'react';
import { WirePuzzleData } from '../types';
import { Zap, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { playBeep } from '../utils/sound';

interface WirePuzzleProps {
  data: WirePuzzleData;
  onSolve: () => void;
  onFail: () => void;
  isActive: boolean;
}

const WirePuzzle: React.FC<WirePuzzleProps> = ({ data, onSolve, onFail, isActive }) => {
  const [cuts, setCuts] = useState<boolean[]>(new Array(data.colors.length).fill(false));
  const [connections, setConnections] = useState<Map<number, number>>(new Map());
  const [selectedLeftIndex, setSelectedLeftIndex] = useState<number | null>(null);
  const [cutSequence, setCutSequence] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning' | null; message: string }>({ type: null, message: '' });
  const [hoveredWire, setHoveredWire] = useState<number | null>(null);

  const showFeedback = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: '' }), 2000);
  }, []);

  const handleWireCut = (index: number) => {
    if (!isActive || cuts[index]) return;

    playBeep(400 + index * 100);
    
    const newCuts = [...cuts];
    newCuts[index] = true;
    setCuts(newCuts);
    
    const newSequence = [...cutSequence, index];
    setCutSequence(newSequence);

    // Clear any existing connection for this wire
    const newConns = new Map(connections);
    newConns.delete(index);
    setConnections(newConns);

    // Evaluate based on solution type
    if (data.solutionType === 'single') {
      if (index === data.correctIndex) {
        showFeedback('success', 'CORRECT WIRE - DEVICE NEUTRALIZED');
        setTimeout(onSolve, 500);
      } else {
        showFeedback('error', 'WRONG WIRE - DETONATION TRIGGERED');
        setTimeout(onFail, 500);
      }
    } else if (data.solutionType === 'sequence') {
      const correctIndices = data.correctIndices || [];
      const expectedIndex = correctIndices[newSequence.length - 1];
      
      if (index !== expectedIndex) {
        showFeedback('error', 'INCORRECT SEQUENCE - FAILSAFE TRIGGERED');
        setTimeout(onFail, 500);
      } else if (newSequence.length === correctIndices.length) {
        showFeedback('success', 'SEQUENCE COMPLETE - DEVICE NEUTRALIZED');
        setTimeout(onSolve, 500);
      } else {
        showFeedback('warning', `Wire ${newSequence.length}/${correctIndices.length} correct`);
      }
    } else if (data.solutionType === 'pattern') {
      // Pattern-based: check if all correct wires are cut
      showFeedback('warning', 'Wire severed. Continue as needed.');
    }
    // For 'connect' type, cutting is just preparation
  };

  const handleLeftStubClick = (index: number) => {
    if (!isActive || !cuts[index] || data.solutionType !== 'connect') return;
    
    playBeep(600);
    setSelectedLeftIndex(index === selectedLeftIndex ? null : index);
  };

  const handleRightStubClick = (targetIndex: number) => {
    if (!isActive || selectedLeftIndex === null || data.solutionType !== 'connect') return;

    playBeep(800);
    
    const newConns = new Map(connections);
    
    // Remove any existing connection TO this target
    for (const [from, to] of newConns.entries()) {
      if (to === targetIndex && from !== selectedLeftIndex) {
        newConns.delete(from);
      }
    }
    
    newConns.set(selectedLeftIndex, targetIndex);
    setConnections(newConns);
    setSelectedLeftIndex(null);
    
    // Check if puzzle is solved
    validateConnections(newConns);
  };

  const validateConnections = (currentConns: Map<number, number>) => {
    if (!data.correctConnections) return;

    // Build complete topology (intact + rewired)
    const topology = new Map<number, number>();
    
    for (let i = 0; i < data.colors.length; i++) {
      if (!cuts[i]) {
        // Intact wire - connects to itself
        topology.set(i, i);
      } else if (currentConns.has(i)) {
        topology.set(i, currentConns.get(i)!);
      }
    }

    // Check if all wires are connected
    if (topology.size !== data.colors.length) {
      return; // Not all wires connected yet
    }

    // Check against required connections
    let isCorrect = true;
    for (const req of data.correctConnections) {
      if (topology.get(req.fromIndex) !== req.toIndex) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      showFeedback('success', 'REWIRING COMPLETE - SYSTEM BYPASSED');
      setTimeout(onSolve, 500);
    } else {
      showFeedback('error', 'INCORRECT CONFIGURATION - SYSTEM LOCKOUT');
      setTimeout(onFail, 800);
    }
  };

  // Enhanced color palette with gradients
  const getWireColors = (color: string) => {
    const colorMap: { [key: string]: { main: string; light: string; glow: string } } = {
      red: { main: '#ef4444', light: '#fca5a5', glow: 'rgba(239,68,68,0.6)' },
      blue: { main: '#3b82f6', light: '#93c5fd', glow: 'rgba(59,130,246,0.6)' },
      green: { main: '#22c55e', light: '#86efac', glow: 'rgba(34,197,94,0.6)' },
      yellow: { main: '#eab308', light: '#fde047', glow: 'rgba(234,179,8,0.6)' },
      white: { main: '#e5e7eb', light: '#ffffff', glow: 'rgba(255,255,255,0.4)' },
      black: { main: '#4b5563', light: '#9ca3af', glow: 'rgba(75,85,99,0.4)' },
      purple: { main: '#a855f7', light: '#d8b4fe', glow: 'rgba(168,85,247,0.6)' },
      orange: { main: '#f97316', light: '#fdba74', glow: 'rgba(249,115,22,0.6)' },
      cyan: { main: '#06b6d4', light: '#67e8f9', glow: 'rgba(6,182,212,0.6)' },
      pink: { main: '#ec4899', light: '#f9a8d4', glow: 'rgba(236,72,153,0.6)' },
    };
    return colorMap[color] || colorMap.white;
  };

  const width = 450;
  const height = 50 + data.colors.length * 50;
  const wireSpacing = 50;
  const startY = 40;
  const leftTerminal = 50;
  const rightTerminal = width - 50;
  const cutGap = 80;
  const centerX = width / 2;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-xl p-4">
      {/* Feedback Toast */}
      {feedback.type && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg font-mono text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
          feedback.type === 'success' ? 'bg-emerald-900/90 text-emerald-300 border border-emerald-500' :
          feedback.type === 'error' ? 'bg-red-900/90 text-red-300 border border-red-500' :
          'bg-amber-900/90 text-amber-300 border border-amber-500'
        }`}>
          {feedback.type === 'success' && <CheckCircle2 size={18} />}
          {feedback.type === 'error' && <XCircle size={18} />}
          {feedback.type === 'warning' && <AlertTriangle size={18} />}
          {feedback.message}
        </div>
      )}

      {/* Mode indicator */}
      <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded font-mono text-xs text-slate-400 uppercase tracking-widest border border-slate-700">
        {data.solutionType === 'single' && 'CUT ONE WIRE'}
        {data.solutionType === 'sequence' && `SEQUENCE: ${cutSequence.length}/${data.correctIndices?.length || 0}`}
        {data.solutionType === 'connect' && 'REWIRE SYSTEM'}
        {data.solutionType === 'pattern' && 'PATTERN MATCH'}
      </div>

      {/* Main SVG */}
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        className="max-w-lg drop-shadow-2xl"
        style={{ maxHeight: '60vh' }}
      >
        <defs>
          {/* Gradients for each wire color */}
          {data.colors.map((color, i) => {
            const colors = getWireColors(color);
            return (
              <linearGradient key={`grad-${i}`} id={`wire-grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={colors.light} />
                <stop offset="50%" stopColor={colors.main} />
                <stop offset="100%" stopColor={colors.light} />
              </linearGradient>
            );
          })}
          
          {/* Glow filter */}
          <filter id="wireGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Cut effect */}
          <filter id="spark" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        {/* Terminal blocks */}
        <rect x={leftTerminal - 40} y={startY - 20} width={45} height={data.colors.length * wireSpacing + 30} rx={6} fill="#18181b" stroke="#3f3f46" strokeWidth={2} />
        <rect x={rightTerminal - 5} y={startY - 20} width={45} height={data.colors.length * wireSpacing + 30} rx={6} fill="#18181b" stroke="#3f3f46" strokeWidth={2} />
        
        {/* Terminal labels */}
        <text x={leftTerminal - 20} y={startY - 30} fill="#71717a" fontSize="10" fontFamily="monospace" textAnchor="middle">INPUT</text>
        <text x={rightTerminal + 20} y={startY - 30} fill="#71717a" fontSize="10" fontFamily="monospace" textAnchor="middle">OUTPUT</text>

        {/* Wires */}
        {data.colors.map((color, i) => {
          const y = startY + i * wireSpacing;
          const colors = getWireColors(color);
          const isCut = cuts[i];
          const isSelected = selectedLeftIndex === i;
          const isHovered = hoveredWire === i;

          return (
            <g key={i}>
              {/* Wire label on left terminal */}
              <text x={leftTerminal - 25} y={y + 4} fill={colors.main} fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                {color.substring(0, 3).toUpperCase()}
              </text>
              
              {/* Wire label on right terminal */}
              <text x={rightTerminal + 25} y={y + 4} fill={colors.main} fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                {color.substring(0, 3).toUpperCase()}
              </text>

              {/* Wire shadow */}
              <line
                x1={leftTerminal}
                y1={y}
                x2={isCut ? centerX - cutGap / 2 : rightTerminal}
                y2={y}
                stroke="black"
                strokeWidth={12}
                strokeLinecap="round"
                opacity={0.4}
              />

              {/* Main wire segment (left side or full) */}
              <line
                x1={leftTerminal}
                y1={y}
                x2={isCut ? centerX - cutGap / 2 : rightTerminal}
                y2={y}
                stroke={`url(#wire-grad-${i})`}
                strokeWidth={8}
                strokeLinecap="round"
                filter={isHovered && !isCut ? 'url(#wireGlow)' : undefined}
                className={`transition-all duration-200 ${!isCut && isActive ? 'cursor-pointer' : ''}`}
                style={{ 
                  filter: isHovered && !isCut ? `drop-shadow(0 0 8px ${colors.glow})` : undefined 
                }}
              />

              {/* Right wire segment (if cut) */}
              {isCut && (
                <>
                  <line
                    x1={centerX + cutGap / 2}
                    y1={y}
                    x2={rightTerminal}
                    y2={y}
                    stroke="black"
                    strokeWidth={12}
                    strokeLinecap="round"
                    opacity={0.4}
                  />
                  <line
                    x1={centerX + cutGap / 2}
                    y1={y}
                    x2={rightTerminal}
                    y2={y}
                    stroke={`url(#wire-grad-${i})`}
                    strokeWidth={8}
                    strokeLinecap="round"
                    opacity={0.4}
                  />
                </>
              )}

              {/* Clickable zone for cutting */}
              {!isCut && isActive && (
                <rect
                  x={leftTerminal + 20}
                  y={y - 15}
                  width={rightTerminal - leftTerminal - 40}
                  height={30}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => handleWireCut(i)}
                  onMouseEnter={() => setHoveredWire(i)}
                  onMouseLeave={() => setHoveredWire(null)}
                />
              )}

              {/* Cut indicators / connection points */}
              {isCut && data.solutionType === 'connect' && (
                <>
                  {/* Left stub (clickable) */}
                  <circle
                    cx={centerX - cutGap / 2}
                    cy={y}
                    r={isSelected ? 12 : 10}
                    fill={isSelected ? colors.light : '#27272a'}
                    stroke={colors.main}
                    strokeWidth={isSelected ? 3 : 2}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => handleLeftStubClick(i)}
                    filter={isSelected ? 'url(#wireGlow)' : undefined}
                  />
                  {isSelected && (
                    <circle
                      cx={centerX - cutGap / 2}
                      cy={y}
                      r={16}
                      fill="none"
                      stroke={colors.main}
                      strokeWidth={2}
                      opacity={0.5}
                    >
                      <animate attributeName="r" values="14;18;14" dur="1s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1s" repeatCount="indefinite" />
                    </circle>
                  )}
                  
                  {/* Right stub (clickable target) */}
                  <circle
                    cx={centerX + cutGap / 2}
                    cy={y}
                    r={10}
                    fill="#27272a"
                    stroke={colors.main}
                    strokeWidth={2}
                    opacity={0.6}
                    className="cursor-pointer hover:opacity-100 transition-opacity duration-200"
                    onClick={() => handleRightStubClick(i)}
                  />
                </>
              )}

              {/* Spark effect at cut points */}
              {isCut && (
                <>
                  <circle cx={centerX - cutGap / 2} cy={y} r={3} fill={colors.light} filter="url(#spark)">
                    <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={centerX + cutGap / 2} cy={y} r={3} fill={colors.light} filter="url(#spark)">
                    <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
            </g>
          );
        })}

        {/* Draw custom connections */}
        {Array.from(connections.entries()).map(([fromIdx, toIdx]) => {
          const startY_conn = startY + fromIdx * wireSpacing;
          const endY_conn = startY + toIdx * wireSpacing;
          const colors = getWireColors(data.colors[fromIdx]);

          return (
            <g key={`conn-${fromIdx}-${toIdx}`}>
              {/* Connection line shadow */}
              <path
                d={`M ${centerX - cutGap / 2} ${startY_conn} 
                    C ${centerX} ${startY_conn}, ${centerX} ${endY_conn}, ${centerX + cutGap / 2} ${endY_conn}`}
                fill="none"
                stroke="black"
                strokeWidth={10}
                opacity={0.3}
              />
              {/* Connection line */}
              <path
                d={`M ${centerX - cutGap / 2} ${startY_conn} 
                    C ${centerX} ${startY_conn}, ${centerX} ${endY_conn}, ${centerX + cutGap / 2} ${endY_conn}`}
                fill="none"
                stroke={colors.main}
                strokeWidth={6}
                strokeDasharray="12,6"
                filter="url(#wireGlow)"
              >
                <animate attributeName="stroke-dashoffset" from="18" to="0" dur="0.8s" repeatCount="indefinite" />
              </path>
            </g>
          );
        })}

        {/* Connection preview line */}
        {selectedLeftIndex !== null && (
          <line
            x1={centerX - cutGap / 2}
            y1={startY + selectedLeftIndex * wireSpacing}
            x2={centerX}
            y2={startY + selectedLeftIndex * wireSpacing}
            stroke={getWireColors(data.colors[selectedLeftIndex]).main}
            strokeWidth={4}
            strokeDasharray="8,4"
            opacity={0.6}
          >
            <animate attributeName="stroke-dashoffset" from="12" to="0" dur="0.5s" repeatCount="indefinite" />
          </line>
        )}
      </svg>

      {/* Hint Panel */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md rounded-lg border border-cyan-500/30 p-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={16} className="text-yellow-500" />
          <span className="text-yellow-500 font-mono text-xs uppercase tracking-widest">Mission Intel</span>
        </div>
        <p className="text-cyan-300 font-mono text-sm leading-relaxed">{data.hint}</p>
        
        {data.solutionType === 'connect' && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-slate-400 text-xs font-mono">
              INSTRUCTIONS: 1. Click wire to cut · 2. Click LEFT stub to select · 3. Click RIGHT stub to connect
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WirePuzzle;
