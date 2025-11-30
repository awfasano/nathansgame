import React, { useState, useEffect, useCallback } from 'react';
import { KeypadPuzzleData } from '../types';
import { playBeep } from '../utils/sound';
import { Lock, Unlock, AlertTriangle, Lightbulb, Hash } from 'lucide-react';

interface KeypadPuzzleProps {
  data: KeypadPuzzleData;
  onSolve: () => void;
  onFail: () => void;
  isActive: boolean;
}

const KeypadPuzzle: React.FC<KeypadPuzzleProps> = ({ data, onSolve, onFail, isActive }) => {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'neutral' | 'error' | 'success' | 'checking'>('neutral');
  const [attempts, setAttempts] = useState(0);
  const [showHintExpanded, setShowHintExpanded] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const maxAttempts = 3;
  
  const codeLength = data.code.length;

  const handlePress = useCallback((digit: string) => {
    if (!isActive || status !== 'neutral' || input.length >= codeLength) return;
    
    playBeep(600 + parseInt(digit) * 80);
    setPressedKey(digit);
    setTimeout(() => setPressedKey(null), 100);
    
    setInput(prev => prev + digit);
  }, [isActive, status, input.length, codeLength]);

  const handleClear = useCallback(() => {
    if (!isActive || status !== 'neutral') return;
    playBeep(300);
    setInput('');
  }, [isActive, status]);

  const handleBackspace = useCallback(() => {
    if (!isActive || status !== 'neutral' || input.length === 0) return;
    playBeep(350);
    setInput(prev => prev.slice(0, -1));
  }, [isActive, status, input.length]);

  const handleSubmit = useCallback(() => {
    if (!isActive || status !== 'neutral' || input.length !== codeLength) return;
    
    setStatus('checking');
    playBeep(500);
    
    setTimeout(() => {
      if (input === data.code) {
        setStatus('success');
        playBeep(1000);
        setTimeout(() => playBeep(1200), 100);
        setTimeout(() => playBeep(1400), 200);
        setTimeout(onSolve, 1000);
      } else {
        setStatus('error');
        playBeep(150);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        setTimeout(() => {
          if (newAttempts >= maxAttempts) {
            onFail();
          } else {
            setInput('');
            setStatus('neutral');
          }
        }, 1500);
      }
    }, 500);
  }, [isActive, status, input, codeLength, data.code, attempts, onSolve, onFail]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive || status !== 'neutral') return;
      
      if (e.key >= '0' && e.key <= '9') {
        handlePress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, status, handlePress, handleBackspace, handleSubmit, handleClear]);

  const getDisplayColor = () => {
    switch (status) {
      case 'success': return 'text-emerald-400 bg-emerald-950/50';
      case 'error': return 'text-red-500 bg-red-950/50';
      case 'checking': return 'text-yellow-400 bg-yellow-950/50';
      default: return 'text-cyan-400 bg-cyan-950/20';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <Unlock className="text-emerald-400 animate-pulse" size={24} />;
      case 'error': return <AlertTriangle className="text-red-500 animate-pulse" size={24} />;
      case 'checking': return <Lock className="text-yellow-400 animate-spin" size={24} />;
      default: return <Lock className="text-cyan-500" size={24} />;
    }
  };

  const getHintTypeIcon = () => {
    switch (data.hintType) {
      case 'math': return '∑';
      case 'cipher': return '🔐';
      case 'logic': return '🧠';
      case 'pattern': return '◆◇◆';
      case 'riddle': return '❓';
      default: return '💡';
    }
  };

  return (
    <div className="flex flex-col h-full w-full items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-900 rounded-xl">
      {/* Keypad Device */}
      <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 p-6 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-zinc-700/50 max-w-sm w-full relative overflow-hidden">
        {/* Device frame details */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-zinc-600 to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-30" />
        
        {/* Status indicator row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`text-xs font-mono uppercase tracking-wider ${
              status === 'success' ? 'text-emerald-400' :
              status === 'error' ? 'text-red-400' :
              status === 'checking' ? 'text-yellow-400' :
              'text-slate-500'
            }`}>
              {status === 'success' ? 'ACCESS GRANTED' :
               status === 'error' ? 'ACCESS DENIED' :
               status === 'checking' ? 'VERIFYING...' :
               'ENTER CODE'}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: maxAttempts }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  i < attempts ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Display */}
        <div className={`mb-6 rounded-lg border-4 border-zinc-700 overflow-hidden shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)] ${getDisplayColor()}`}>
          <div className="h-20 flex items-center justify-center font-mono text-4xl tracking-[0.3em] relative">
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute inset-0 opacity-10" style={{ 
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)' 
            }} />
            
            {/* Display content */}
            <span className="relative z-10">
              {status === 'error' ? 'ERROR' : 
               status === 'success' ? 'OPEN' :
               status === 'checking' ? '••••' :
               input.split('').map((d, i) => (
                 <span key={i} className="inline-block animate-in fade-in duration-100">{d}</span>
               )).concat(
                 Array.from({ length: codeLength - input.length }).map((_, i) => (
                   <span key={`empty-${i}`} className="opacity-30">_</span>
                 ))
               )}
            </span>
          </div>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handlePress(digit.toString())}
              disabled={!isActive || status !== 'neutral'}
              className={`
                relative h-14 rounded-lg font-bold text-xl transition-all duration-100
                ${pressedKey === digit.toString() 
                  ? 'bg-cyan-600 translate-y-1 shadow-none' 
                  : 'bg-gradient-to-b from-zinc-600 to-zinc-700 shadow-[0_4px_0_#27272a,0_6px_10px_rgba(0,0,0,0.4)] hover:from-zinc-500 hover:to-zinc-600 active:translate-y-1 active:shadow-none'
                }
                ${!isActive || status !== 'neutral' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                text-white
              `}
            >
              <span className="relative z-10">{digit}</span>
              {/* Key shine */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            </button>
          ))}
          
          {/* Bottom row: Clear, 0, Enter */}
          <button
            onClick={handleClear}
            disabled={!isActive || status !== 'neutral'}
            className={`
              h-14 rounded-lg font-bold text-sm transition-all duration-100
              bg-gradient-to-b from-red-800 to-red-900 shadow-[0_4px_0_#450a0a,0_6px_10px_rgba(0,0,0,0.4)]
              hover:from-red-700 hover:to-red-800 active:translate-y-1 active:shadow-none
              ${!isActive || status !== 'neutral' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              text-red-200
            `}
          >
            CLR
          </button>
          
          <button
            onClick={() => handlePress('0')}
            disabled={!isActive || status !== 'neutral'}
            className={`
              relative h-14 rounded-lg font-bold text-xl transition-all duration-100
              ${pressedKey === '0'
                ? 'bg-cyan-600 translate-y-1 shadow-none'
                : 'bg-gradient-to-b from-zinc-600 to-zinc-700 shadow-[0_4px_0_#27272a,0_6px_10px_rgba(0,0,0,0.4)] hover:from-zinc-500 hover:to-zinc-600 active:translate-y-1 active:shadow-none'
              }
              ${!isActive || status !== 'neutral' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              text-white
            `}
          >
            0
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!isActive || status !== 'neutral' || input.length !== codeLength}
            className={`
              h-14 rounded-lg font-bold text-sm transition-all duration-100
              ${input.length === codeLength
                ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 shadow-[0_4px_0_#064e3b,0_6px_10px_rgba(0,0,0,0.4)] hover:from-emerald-500 hover:to-emerald-600 text-emerald-100'
                : 'bg-gradient-to-b from-zinc-700 to-zinc-800 shadow-[0_4px_0_#18181b,0_6px_10px_rgba(0,0,0,0.4)] text-zinc-500'
              }
              active:translate-y-1 active:shadow-none
              ${!isActive || status !== 'neutral' || input.length !== codeLength ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            ENT
          </button>
        </div>

        {/* Backspace */}
        <button
          onClick={handleBackspace}
          disabled={!isActive || status !== 'neutral' || input.length === 0}
          className={`
            w-full h-10 rounded-lg font-mono text-sm transition-all duration-100
            bg-gradient-to-b from-zinc-700 to-zinc-800 shadow-[0_3px_0_#27272a]
            hover:from-zinc-600 hover:to-zinc-700 active:translate-y-[3px] active:shadow-none
            ${!isActive || status !== 'neutral' || input.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            text-zinc-400
          `}
        >
          ← BACKSPACE
        </button>

        {/* Serial plate */}
        <div className="mt-4 pt-3 border-t border-zinc-700 flex justify-between items-center text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
          <span>CIPHER LOCK v2.7</span>
          <span>SN: {Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
        </div>
      </div>

      {/* Hint Panel */}
      <div className="mt-6 w-full max-w-lg">
        <button
          onClick={() => setShowHintExpanded(!showHintExpanded)}
          className="w-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 text-left transition-all hover:border-cyan-500/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-900/50 flex items-center justify-center text-lg">
                {getHintTypeIcon()}
              </div>
              <div>
                <div className="text-cyan-400 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                  <Lightbulb size={12} />
                  {data.hintType} Puzzle
                </div>
                <div className="text-slate-400 text-sm mt-0.5">
                  {showHintExpanded ? 'Click to collapse' : 'Click to view hint'}
                </div>
              </div>
            </div>
            <Hash size={20} className={`text-cyan-500 transition-transform duration-300 ${showHintExpanded ? 'rotate-45' : ''}`} />
          </div>
          
          {showHintExpanded && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-cyan-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {data.hint}
              </p>
              <div className="mt-3 text-slate-500 text-xs font-mono">
                Code length: {codeLength} digits · Attempts remaining: {maxAttempts - attempts}
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default KeypadPuzzle;
