import React, { useState, useEffect } from 'react';
import { MissionData } from '../types';
import WirePuzzle from './WirePuzzle';
import KeypadPuzzle from './KeypadPuzzle';
import SequencePuzzle from './SequencePuzzle';
import CipherPuzzle from './CipherPuzzle';
import MazePuzzle from './MazePuzzle';
import { Timer, Zap, Skull, MapPin, Target } from 'lucide-react';
import { playBeep } from '../utils/sound';

interface BombDefusalProps {
  mission: MissionData;
  onSuccess: () => void;
  onFail: () => void;
}

const BombDefusal: React.FC<BombDefusalProps> = ({ mission, onSuccess, onFail }) => {
  const [timeLeft, setTimeLeft] = useState(mission.timeLimitSeconds);
  const [isActive, setIsActive] = useState(true);
  const [strikes, setStrikes] = useState(0);
  const maxStrikes = 2;
  const [lastTick, setLastTick] = useState(mission.timeLimitSeconds);

  // Timer with audio feedback
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 0.1;
        
        // Beep on each second
        const currentSecond = Math.floor(newTime);
        if (currentSecond < Math.floor(prev) && currentSecond >= 0) {
          if (currentSecond <= 10) {
            playBeep(300 + (10 - currentSecond) * 50); // Rising pitch as time runs out
          }
        }
        
        if (newTime <= 0) {
          clearInterval(timer);
          setIsActive(false);
          onFail();
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isActive, onFail]);

  const handlePuzzleSolve = () => {
    setIsActive(false);
    onSuccess();
  };

  const handlePuzzleFail = () => {
    // Different puzzles handle failure differently
    if (mission.puzzleType === 'wires' && mission.wireData?.solutionType === 'single') {
      // Single wire - instant fail
      setIsActive(false);
      onFail();
    } else if (mission.puzzleType === 'maze' || mission.puzzleType === 'sequence') {
      // These handle their own strike system
      setIsActive(false);
      onFail();
    } else {
      // Strike system for keypad, cipher, and some wire puzzles
      const newStrikes = strikes + 1;
      setStrikes(newStrikes);
      playBeep(150);
      
      if (newStrikes >= maxStrikes) {
        setIsActive(false);
        onFail();
      } else {
        // Time penalty
        setTimeLeft(prev => Math.max(0, prev - 15));
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return { minutes: m, seconds: s, tenths: ms };
  };

  const time = formatTime(timeLeft);
  const timePercentage = (timeLeft / mission.timeLimitSeconds) * 100;
  const isLowTime = timeLeft < 15;
  const isCriticalTime = timeLeft < 5;

  const getPuzzleTypeLabel = () => {
    switch (mission.puzzleType) {
      case 'wires': return 'WIRE DEFUSAL';
      case 'keypad': return 'CODE BREACH';
      case 'sequence': return 'PATTERN LOCK';
      case 'cipher': return 'DECRYPT MESSAGE';
      case 'maze': return 'SECURE ROUTE';
      default: return 'UNKNOWN MODULE';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-950 relative overflow-hidden">
      {/* Dynamic background based on time */}
      <div className={`absolute inset-0 transition-colors duration-500 ${
        isCriticalTime ? 'bg-red-950/30' : 
        isLowTime ? 'bg-amber-950/20' : 
        'bg-gradient-to-b from-slate-900 via-slate-950 to-black'
      }`} />
      
      {/* Animated danger overlay */}
      {isCriticalTime && (
        <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />
      )}

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Location */}
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin size={16} />
            <span className="font-mono text-sm">{mission.locationName}</span>
          </div>
          
          {/* Timer */}
          <div className={`flex items-center gap-3 px-6 py-2 rounded-lg border ${
            isCriticalTime ? 'bg-red-950/80 border-red-600' :
            isLowTime ? 'bg-amber-950/80 border-amber-600' :
            'bg-slate-900/80 border-slate-700'
          }`}>
            <Timer size={20} className={isCriticalTime ? 'text-red-500 animate-pulse' : isLowTime ? 'text-amber-500' : 'text-slate-400'} />
            <div className={`font-mono text-3xl tracking-wider ${
              isCriticalTime ? 'text-red-500' : isLowTime ? 'text-amber-400' : 'text-white'
            }`}>
              <span>{time.minutes.toString().padStart(2, '0')}</span>
              <span className={isCriticalTime ? 'animate-pulse' : ''}>:</span>
              <span>{time.seconds.toString().padStart(2, '0')}</span>
              <span className="text-lg opacity-70">.{time.tenths}</span>
            </div>
          </div>
          
          {/* Strikes */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono text-xs">STRIKES:</span>
            <div className="flex gap-1">
              {Array.from({ length: maxStrikes }).map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    i < strikes 
                      ? 'bg-red-500 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.6)]' 
                      : 'bg-slate-800 border-slate-600'
                  }`}
                >
                  <Skull size={14} className={i < strikes ? 'text-white' : 'text-slate-600'} />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Time progress bar */}
        <div className="max-w-4xl mx-auto mt-3">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-100 ${
                isCriticalTime ? 'bg-red-500' : isLowTime ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${timePercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main puzzle area */}
      <div className="z-10 w-full max-w-4xl h-full pt-28 pb-20 px-4">
        <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-700 shadow-2xl h-full overflow-hidden relative">
          {/* Puzzle type header */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 py-2 px-4 border-b border-zinc-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-yellow-500" />
              <span className="font-mono text-sm text-yellow-500 tracking-widest">{getPuzzleTypeLabel()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target size={14} className="text-slate-500" />
              <span className="font-mono text-xs text-slate-500">{mission.missionObjective}</span>
            </div>
          </div>

          {/* Hazard stripes */}
          <div className="absolute top-10 left-0 right-0 h-2 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#000000_10px,#000000_20px)] opacity-40" />

          {/* Puzzle content */}
          <div className="pt-16 h-full">
            {mission.puzzleType === 'wires' && mission.wireData && (
              <WirePuzzle 
                data={mission.wireData} 
                onSolve={handlePuzzleSolve} 
                onFail={handlePuzzleFail}
                isActive={isActive}
              />
            )}
            
            {mission.puzzleType === 'keypad' && mission.keypadData && (
              <KeypadPuzzle 
                data={mission.keypadData} 
                onSolve={handlePuzzleSolve} 
                onFail={handlePuzzleFail}
                isActive={isActive}
              />
            )}
            
            {mission.puzzleType === 'sequence' && mission.sequenceData && (
              <SequencePuzzle
                data={mission.sequenceData}
                onSolve={handlePuzzleSolve}
                onFail={handlePuzzleFail}
                isActive={isActive}
              />
            )}
            
            {mission.puzzleType === 'cipher' && mission.cipherData && (
              <CipherPuzzle
                data={mission.cipherData}
                onSolve={handlePuzzleSolve}
                onFail={handlePuzzleFail}
                isActive={isActive}
              />
            )}
            
            {mission.puzzleType === 'maze' && mission.mazeData && (
              <MazePuzzle
                data={mission.mazeData}
                onSolve={handlePuzzleSolve}
                onFail={handlePuzzleFail}
                isActive={isActive}
              />
            )}
          </div>

          {/* Bottom serial plate */}
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-800 py-2 px-4 border-t border-zinc-600 flex justify-between items-center text-[10px] font-mono text-zinc-500">
            <span>DEVICE: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE
              </span>
              <span>PWR: 98%</span>
              <span>FREQ: 2.4GHz</span>
            </div>
          </div>
        </div>
      </div>

      {/* Villain taunt (if present) */}
      {mission.villainTaunt && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-md bg-red-950/80 backdrop-blur-sm border border-red-800/50 rounded-lg p-3 z-20">
          <p className="text-red-300 font-mono text-sm italic text-center">
            "{mission.villainTaunt}"
          </p>
        </div>
      )}
    </div>
  );
};

export default BombDefusal;
