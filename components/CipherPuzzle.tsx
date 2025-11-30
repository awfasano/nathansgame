import React, { useState, useCallback, useEffect } from 'react';
import { CipherPuzzleData } from '../types';
import { playBeep } from '../utils/sound';
import { Key, Lock, Unlock, AlertTriangle, Info } from 'lucide-react';

interface CipherPuzzleProps {
  data: CipherPuzzleData;
  onSolve: () => void;
  onFail: () => void;
  isActive: boolean;
}

const CipherPuzzle: React.FC<CipherPuzzleProps> = ({ data, onSolve, onFail, isActive }) => {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'neutral' | 'success' | 'error' | 'checking'>('neutral');
  const [attempts, setAttempts] = useState(0);
  const [showReference, setShowReference] = useState(false);
  const maxAttempts = 3;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isActive || status !== 'neutral') return;
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setInput(value);
    playBeep(500);
  };

  const handleSubmit = useCallback(() => {
    if (!isActive || status !== 'neutral' || input.length === 0) return;
    
    setStatus('checking');
    playBeep(600);
    
    setTimeout(() => {
      if (input === data.decodedAnswer.toUpperCase()) {
        setStatus('success');
        playBeep(1000);
        setTimeout(() => playBeep(1200), 100);
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
    }, 800);
  }, [isActive, status, input, data.decodedAnswer, attempts, onSolve, onFail]);

  // Keyboard submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isActive && status === 'neutral') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, isActive, status]);

  const getCipherTypeLabel = () => {
    switch (data.cipherType) {
      case 'caesar': return 'Caesar Cipher';
      case 'morse': return 'Morse Code';
      case 'binary': return 'Binary Encoding';
      case 'substitution': return 'Substitution Cipher';
      case 'pigpen': return 'Pigpen Cipher';
      default: return 'Encrypted Message';
    }
  };

  const getCipherReference = () => {
    switch (data.cipherType) {
      case 'caesar':
        return (
          <div className="grid grid-cols-13 gap-1 text-[10px] font-mono">
            <div className="col-span-13 text-center text-slate-400 mb-1">Shift: {data.cipherKey}</div>
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter, i) => {
              const shift = parseInt(data.cipherKey || '0');
              const shifted = String.fromCharCode(((i + shift) % 26) + 65);
              return (
                <div key={letter} className="flex flex-col items-center">
                  <span className="text-slate-500">{letter}</span>
                  <span className="text-cyan-400">↓</span>
                  <span className="text-cyan-300">{shifted}</span>
                </div>
              );
            }).slice(0, 13)}
          </div>
        );
      case 'morse':
        const morseRef: { [key: string]: string } = {
          'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 
          'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
          'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---'
        };
        return (
          <div className="grid grid-cols-5 gap-2 text-xs font-mono">
            {Object.entries(morseRef).map(([letter, code]) => (
              <div key={letter} className="flex items-center gap-1">
                <span className="text-cyan-400 w-4">{letter}</span>
                <span className="text-slate-400">{code}</span>
              </div>
            ))}
          </div>
        );
      case 'binary':
        return (
          <div className="text-xs font-mono text-slate-400">
            <p className="mb-2">8-bit ASCII encoding. Each group of 8 digits = 1 character.</p>
            <div className="grid grid-cols-4 gap-2">
              {['A=01000001', 'B=01000010', 'C=01000011', 'Z=01011010'].map(ex => (
                <span key={ex} className="text-cyan-400">{ex}</span>
              ))}
            </div>
          </div>
        );
      default:
        return <p className="text-slate-400 text-sm">Decode the message above.</p>;
    }
  };

  return (
    <div className="flex flex-col h-full w-full items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 rounded-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Key className="text-emerald-400" size={28} />
        <div>
          <h2 className="text-lg font-bold text-white">{getCipherTypeLabel()}</h2>
          <p className="text-sm text-slate-400 font-mono">Decrypt the encoded message</p>
        </div>
      </div>

      {/* Attempts indicator */}
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: maxAttempts }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i < attempts ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-slate-700'
            }`}
          />
        ))}
        <span className="text-slate-500 text-sm font-mono ml-2">
          {maxAttempts - attempts} attempts remaining
        </span>
      </div>

      {/* Encrypted message display */}
      <div className="w-full max-w-lg mb-6">
        <div className="bg-black/60 border-2 border-emerald-900/50 rounded-lg p-6 font-mono shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
          <div className="text-emerald-500/50 text-xs uppercase tracking-widest mb-2">Encrypted Message</div>
          <div className="text-emerald-400 text-xl md:text-2xl break-all leading-relaxed tracking-wider">
            {data.encryptedMessage}
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="w-full max-w-lg mb-4">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            disabled={!isActive || status !== 'neutral'}
            placeholder="Enter decoded answer..."
            className={`
              w-full px-6 py-4 rounded-lg font-mono text-xl tracking-widest uppercase
              bg-slate-800/80 border-2 transition-all duration-300
              ${status === 'success' ? 'border-emerald-500 text-emerald-400' :
                status === 'error' ? 'border-red-500 text-red-400' :
                status === 'checking' ? 'border-yellow-500 text-yellow-400' :
                'border-slate-600 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'}
              placeholder:text-slate-600
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />
          
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {status === 'success' && <Unlock className="text-emerald-400" size={24} />}
            {status === 'error' && <AlertTriangle className="text-red-400" size={24} />}
            {status === 'checking' && <Lock className="text-yellow-400 animate-spin" size={24} />}
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!isActive || status !== 'neutral' || input.length === 0}
          className={`
            w-full mt-3 py-3 rounded-lg font-bold uppercase tracking-wider transition-all duration-200
            ${input.length > 0 && isActive && status === 'neutral'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_4px_0_#065f46] active:translate-y-1 active:shadow-none cursor-pointer'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          {status === 'checking' ? 'Verifying...' : 'Submit Answer'}
        </button>
      </div>

      {/* Status feedback */}
      {status === 'success' && (
        <div className="flex items-center gap-2 text-emerald-400 font-mono animate-pulse mb-4">
          <Unlock size={20} />
          DECRYPTION SUCCESSFUL
        </div>
      )}
      
      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-400 font-mono animate-pulse mb-4">
          <AlertTriangle size={20} />
          INCORRECT DECRYPTION
        </div>
      )}

      {/* Reference toggle */}
      <button
        onClick={() => setShowReference(!showReference)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors mb-4"
      >
        <Info size={16} />
        <span className="text-sm">{showReference ? 'Hide' : 'Show'} Cipher Reference</span>
      </button>

      {showReference && (
        <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-lg p-4 mb-4">
          {getCipherReference()}
        </div>
      )}

      {/* Hint Panel */}
      <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest">Intel</span>
        </div>
        <p className="text-emerald-300 font-mono text-sm leading-relaxed">{data.hint}</p>
      </div>
    </div>
  );
};

export default CipherPuzzle;
