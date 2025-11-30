import React, { useState, useEffect, useCallback } from 'react';
import { MazePuzzleData } from '../types';
import { playBeep } from '../utils/sound';
import { Navigation, Flag, Skull, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface MazePuzzleProps {
  data: MazePuzzleData;
  onSolve: () => void;
  onFail: () => void;
  isActive: boolean;
}

const MazePuzzle: React.FC<MazePuzzleProps> = ({ data, onSolve, onFail, isActive }) => {
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set(['1,1']));
  const [status, setStatus] = useState<'neutral' | 'success' | 'error'>('neutral');
  const [trapHits, setTrapHits] = useState(0);
  const maxTraps = 2;

  // Find start and end positions
  useEffect(() => {
    for (let y = 0; y < data.size; y++) {
      for (let x = 0; x < data.size; x++) {
        if (data.grid[y]?.[x] === 2) {
          setPlayerPos({ x, y });
          setVisitedCells(new Set([`${x},${y}`]));
        }
      }
    }
  }, [data.grid, data.size]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (!isActive || status !== 'neutral') return;

    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    // Check bounds
    if (newX < 0 || newX >= data.size || newY < 0 || newY >= data.size) {
      playBeep(200);
      return;
    }

    const cellValue = data.grid[newY]?.[newX];

    // Check for wall
    if (cellValue === 1) {
      playBeep(200);
      return;
    }

    playBeep(600);
    
    // Move player
    setPlayerPos({ x: newX, y: newY });
    setVisitedCells(prev => new Set([...prev, `${newX},${newY}`]));

    // Check for trap
    if (cellValue === 4) {
      playBeep(150);
      const newTrapHits = trapHits + 1;
      setTrapHits(newTrapHits);
      
      if (newTrapHits >= maxTraps) {
        setStatus('error');
        setTimeout(onFail, 800);
        return;
      }
    }

    // Check for end
    if (cellValue === 3) {
      setStatus('success');
      playBeep(1000);
      setTimeout(() => playBeep(1200), 100);
      setTimeout(onSolve, 800);
    }
  }, [isActive, status, playerPos, data.grid, data.size, trapHits, onFail, onSolve]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive || status !== 'neutral') return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          movePlayer(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePlayer(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePlayer(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePlayer(1, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, isActive, status]);

  const getCellStyle = (x: number, y: number) => {
    const value = data.grid[y]?.[x];
    const isPlayer = playerPos.x === x && playerPos.y === y;
    const isVisited = visitedCells.has(`${x},${y}`);

    if (isPlayer) {
      return 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]';
    }
    
    switch (value) {
      case 0: // Path
        return isVisited 
          ? 'bg-cyan-900/30 border-cyan-800/50' 
          : 'bg-slate-800/80 border-slate-700/50 hover:bg-slate-700/80';
      case 1: // Wall
        return 'bg-slate-950 border-slate-800';
      case 2: // Start
        return isVisited 
          ? 'bg-emerald-900/50 border-emerald-700/50' 
          : 'bg-emerald-800/50 border-emerald-600/50';
      case 3: // End
        return 'bg-yellow-800/50 border-yellow-600/50 animate-pulse';
      case 4: // Trap
        return isVisited 
          ? 'bg-red-900/30 border-red-800/50' 
          : 'bg-red-900/50 border-red-700/50';
      default:
        return 'bg-slate-900';
    }
  };

  const getCellContent = (x: number, y: number) => {
    const value = data.grid[y]?.[x];
    const isPlayer = playerPos.x === x && playerPos.y === y;

    if (isPlayer) {
      return <Navigation className="text-white drop-shadow-lg" size={16} />;
    }

    switch (value) {
      case 2: return <div className="w-2 h-2 rounded-full bg-emerald-400" />;
      case 3: return <Flag className="text-yellow-400" size={14} />;
      case 4: return <Skull className="text-red-400/70" size={12} />;
      default: return null;
    }
  };

  const cellSize = data.size <= 9 ? 'w-8 h-8' : data.size <= 11 ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <div className="flex flex-col h-full w-full items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg mb-4">
        <div className="flex items-center gap-3">
          <Navigation className="text-cyan-400" size={24} />
          <div>
            <h2 className="text-lg font-bold text-white">Secure Route</h2>
            <p className="text-sm text-slate-400 font-mono">Navigate to the extraction point</p>
          </div>
        </div>
        
        {/* Trap counter */}
        <div className="flex items-center gap-2">
          <Skull className="text-red-400" size={16} />
          <div className="flex gap-1">
            {Array.from({ length: maxTraps }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i < trapHits ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Maze Grid */}
      <div 
        className="grid gap-[2px] p-3 bg-slate-950 rounded-lg border border-slate-700 shadow-2xl"
        style={{ gridTemplateColumns: `repeat(${data.size}, 1fr)` }}
      >
        {data.grid.map((row, y) =>
          row.map((_, x) => (
            <div
              key={`${x}-${y}`}
              className={`
                ${cellSize} rounded-sm border flex items-center justify-center
                transition-all duration-150
                ${getCellStyle(x, y)}
              `}
            >
              {getCellContent(x, y)}
            </div>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <button
          onClick={() => movePlayer(0, -1)}
          disabled={!isActive || status !== 'neutral'}
          className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center hover:bg-slate-700 active:bg-slate-600 transition-colors disabled:opacity-50"
        >
          <ArrowUp className="text-slate-300" size={20} />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => movePlayer(-1, 0)}
            disabled={!isActive || status !== 'neutral'}
            className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center hover:bg-slate-700 active:bg-slate-600 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="text-slate-300" size={20} />
          </button>
          <button
            onClick={() => movePlayer(0, 1)}
            disabled={!isActive || status !== 'neutral'}
            className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center hover:bg-slate-700 active:bg-slate-600 transition-colors disabled:opacity-50"
          >
            <ArrowDown className="text-slate-300" size={20} />
          </button>
          <button
            onClick={() => movePlayer(1, 0)}
            disabled={!isActive || status !== 'neutral'}
            className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center hover:bg-slate-700 active:bg-slate-600 transition-colors disabled:opacity-50"
          >
            <ArrowRight className="text-slate-300" size={20} />
          </button>
        </div>
        <p className="text-slate-500 text-xs font-mono mt-2">Use arrow keys or WASD</p>
      </div>

      {/* Status */}
      {status === 'success' && (
        <div className="mt-4 flex items-center gap-2 text-emerald-400 font-mono animate-pulse">
          <Flag size={20} />
          EXTRACTION SUCCESSFUL
        </div>
      )}
      
      {status === 'error' && (
        <div className="mt-4 flex items-center gap-2 text-red-400 font-mono animate-pulse">
          <Skull size={20} />
          ROUTE COMPROMISED
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-800/50 border border-emerald-600/50" />
          <span className="text-slate-400">Start</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-800/50 border border-yellow-600/50" />
          <span className="text-slate-400">Exit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-900/50 border border-red-700/50" />
          <span className="text-slate-400">Danger</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-cyan-900/30 border border-cyan-800/50" />
          <span className="text-slate-400">Visited</span>
        </div>
      </div>

      {/* Hint */}
      <div className="mt-4 w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-blue-500/30 rounded-lg p-3">
        <p className="text-blue-300 font-mono text-sm text-center">{data.hint}</p>
      </div>
    </div>
  );
};

export default MazePuzzle;
