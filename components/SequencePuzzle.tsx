import React, { useState, useCallback } from 'react';
import { SequencePuzzleData } from '../types';
import { playBeep } from '../utils/sound';
import { Grid3X3, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface SequencePuzzleProps {
  data: SequencePuzzleData;
  onSolve: () => void;
  onFail: () => void;
  isActive: boolean;
}

const SequencePuzzle: React.FC<SequencePuzzleProps> = ({ data, onSolve, onFail, isActive }) => {
  const [pressedSequence, setPressedSequence] = useState<number[]>([]);
  const [status, setStatus] = useState<'neutral' | 'success' | 'error'>('neutral');
  const [lastPressed, setLastPressed] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const maxMistakes = 2;

  const handleCellPress = useCallback((index: number) => {
    if (!isActive || status !== 'neutral') return;

    const expectedIndex = data.correctSequence[pressedSequence.length];
    
    if (index === expectedIndex) {
      // Correct!
      playBeep(800 + pressedSequence.length * 100);
      setLastPressed(index);
      
      const newSequence = [...pressedSequence, index];
      setPressedSequence(newSequence);
      
      if (newSequence.length === data.correctSequence.length) {
        // Complete!
        setStatus('success');
        setTimeout(onSolve, 800);
      }
    } else {
      // Wrong!
      playBeep(200);
      setLastPressed(null);
      
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      
      if (newMistakes >= maxMistakes) {
        setStatus('error');
        setTimeout(onFail, 800);
      } else {
        // Reset sequence
        setPressedSequence([]);
      }
    }
  }, [isActive, status, pressedSequence, data.correctSequence, mistakes, onSolve, onFail]);

  const handleReset = useCallback(() => {
    if (!isActive || status !== 'neutral') return;
    playBeep(300);
    setPressedSequence([]);
    setLastPressed(null);
  }, [isActive, status]);

  const getCellStyle = (index: number) => {
    const isPressed = pressedSequence.includes(index);
    const isLastPressed = lastPressed === index;
    const pressOrder = pressedSequence.indexOf(index);
    
    if (status === 'success' && isPressed) {
      return 'bg-emerald-600 border-emerald-400 text-white scale-110 shadow-[0_0_20px_rgba(16,185,129,0.6)]';
    }
    if (status === 'error') {
      return 'bg-red-900/50 border-red-700 text-red-300';
    }
    if (isLastPressed) {
      return 'bg-cyan-600 border-cyan-400 text-white scale-105 shadow-[0_0_15px_rgba(6,182,212,0.6)]';
    }
    if (isPressed) {
      return 'bg-cyan-900/80 border-cyan-600 text-cyan-200';
    }
    return 'bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500';
  };

  const cellSize = data.gridSize <= 3 ? 'w-20 h-20 text-3xl' : data.gridSize <= 4 ? 'w-16 h-16 text-2xl' : 'w-14 h-14 text-xl';

  return (
    <div className="flex flex-col h-full w-full items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 rounded-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Grid3X3 className="text-cyan-400" size={28} />
        <div>
          <h2 className="text-lg font-bold text-white">Symbol Sequence</h2>
          <p className="text-sm text-slate-400 font-mono">
            Progress: {pressedSequence.length}/{data.correctSequence.length}
          </p>
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-1">
          {Array.from({ length: maxMistakes }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < mistakes ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
        <span className="text-slate-500 text-sm font-mono">Attempts: {maxMistakes - mistakes}</span>
        
        <button
          onClick={handleReset}
          disabled={!isActive || status !== 'neutral' || pressedSequence.length === 0}
          className="flex items-center gap-1 px-3 py-1 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {/* Grid */}
      <div 
        className="grid gap-2 p-4 bg-slate-900/50 rounded-xl border border-slate-700"
        style={{ gridTemplateColumns: `repeat(${data.gridSize}, 1fr)` }}
      >
        {data.symbols.map((symbol, index) => {
          const pressOrder = pressedSequence.indexOf(index);
          
          return (
            <button
              key={index}
              onClick={() => handleCellPress(index)}
              disabled={!isActive || status !== 'neutral'}
              className={`
                ${cellSize} rounded-lg border-2 font-bold
                transition-all duration-200 ease-out
                ${getCellStyle(index)}
                ${!isActive || status !== 'neutral' ? 'cursor-not-allowed' : 'cursor-pointer'}
                relative overflow-hidden
              `}
            >
              <span className="relative z-10">{symbol}</span>
              
              {/* Press order indicator */}
              {pressOrder >= 0 && status !== 'error' && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center text-xs font-mono text-white">
                  {pressOrder + 1}
                </div>
              )}
              
              {/* Hover/active glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/5 to-white/10 pointer-events-none" />
            </button>
          );
        })}
      </div>

      {/* Status feedback */}
      {status === 'success' && (
        <div className="mt-6 flex items-center gap-2 text-emerald-400 font-mono animate-pulse">
          <CheckCircle2 size={20} />
          SEQUENCE COMPLETE
        </div>
      )}
      
      {status === 'error' && (
        <div className="mt-6 flex items-center gap-2 text-red-400 font-mono animate-pulse">
          <XCircle size={20} />
          SEQUENCE FAILED
        </div>
      )}

      {/* Hint Panel */}
      <div className="mt-6 w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-purple-400 font-mono text-xs uppercase tracking-widest">Pattern Hint</span>
        </div>
        <p className="text-purple-300 font-mono text-sm leading-relaxed">{data.hint}</p>
      </div>
    </div>
  );
};

export default SequencePuzzle;
