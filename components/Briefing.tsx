import React, { useState, useEffect } from 'react';
import { MissionData } from '../types';
import { ShieldAlert, ArrowRight, Bookmark, MapPin, Clock, Target, AlertTriangle, Fingerprint } from 'lucide-react';

interface BriefingProps {
  mission: MissionData;
  chapter: number;
  totalChapters: number;
  onAccept: () => void;
}

const Briefing: React.FC<BriefingProps> = ({ mission, chapter, totalChapters, onAccept }) => {
  const [isRevealing, setIsRevealing] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Declassification animation
    const timer1 = setTimeout(() => setIsRevealing(false), 1500);
    const timer2 = setTimeout(() => setShowContent(true), 1800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const getStoryBeatLabel = () => {
    switch (mission.storyBeat) {
      case 'setup': return 'PROLOGUE';
      case 'rising': return 'RISING ACTION';
      case 'twist': return 'REVELATION';
      case 'climax': return 'CLIMAX';
      case 'resolution': return 'FINALE';
      default: return 'CLASSIFIED';
    }
  };

  const getStoryBeatColor = () => {
    switch (mission.storyBeat) {
      case 'setup': return 'text-blue-400 border-blue-500/30 bg-blue-950/20';
      case 'rising': return 'text-amber-400 border-amber-500/30 bg-amber-950/20';
      case 'twist': return 'text-purple-400 border-purple-500/30 bg-purple-950/20';
      case 'climax': return 'text-red-400 border-red-500/30 bg-red-950/20';
      case 'resolution': return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
      default: return 'text-slate-400 border-slate-500/30 bg-slate-950/20';
    }
  };

  const getPuzzleIcon = () => {
    switch (mission.puzzleType) {
      case 'wires': return '🔌';
      case 'keypad': return '🔢';
      case 'sequence': return '🎯';
      case 'cipher': return '🔐';
      case 'maze': return '🗺️';
      default: return '❓';
    }
  };

  const getPuzzleLabel = () => {
    switch (mission.puzzleType) {
      case 'wires': return 'Wire Defusal';
      case 'keypad': return 'Code Breach';
      case 'sequence': return 'Pattern Lock';
      case 'cipher': return 'Decryption';
      case 'maze': return 'Route Navigation';
      default: return 'Unknown Protocol';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full bg-slate-950 p-4 md:p-6 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      {/* Declassification overlay */}
      {isRevealing && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center animate-pulse">
          <Fingerprint size={80} className="text-red-500 mb-4" />
          <div className="text-red-500 font-mono text-xl tracking-widest">DECLASSIFYING...</div>
          <div className="text-slate-500 font-mono text-sm mt-2">CLEARANCE LEVEL: OMEGA</div>
        </div>
      )}

      {/* Main document */}
      <div className={`max-w-3xl w-full bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700 rounded-lg shadow-2xl overflow-hidden relative transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* TOP SECRET watermark */}
        <div className="absolute top-20 right-8 border-4 border-red-900/30 text-red-900/30 font-black text-3xl px-6 py-3 -rotate-12 uppercase pointer-events-none select-none tracking-widest">
          TOP SECRET
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-red-900/30 via-red-800/20 to-red-900/30 border-b border-red-900/40 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/50 border border-red-800/50">
              <ShieldAlert className="text-red-500" size={24} />
            </div>
            <div>
              <h1 className="text-red-500 font-mono tracking-widest uppercase font-bold text-lg">
                Mission Briefing
              </h1>
              <p className="text-red-400/60 font-mono text-xs">PROTOCOL OMEGA - EYES ONLY</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full border font-mono text-xs ${getStoryBeatColor()}`}>
              {getStoryBeatLabel()}
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-mono text-sm bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
              <Bookmark size={14} />
              <span className="font-bold text-white">{chapter}</span>
              <span className="text-slate-600">/</span>
              <span>{totalChapters}</span>
            </div>
          </div>
        </div>

        {/* Chapter title */}
        {mission.chapterTitle && (
          <div className="px-8 py-4 border-b border-slate-800 bg-slate-900/50">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {mission.chapterTitle}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Operation details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
              <span className="block text-slate-600 text-xs font-mono uppercase tracking-widest mb-1">Operation</span>
              <span className="text-cyan-400 text-xl font-bold font-mono">{mission.briefingTitle}</span>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
              <span className="block text-slate-600 text-xs font-mono uppercase tracking-widest mb-1 flex items-center gap-1">
                <MapPin size={12} /> Target Location
              </span>
              <span className="text-white text-xl font-bold">{mission.locationName}</span>
            </div>
          </div>

          {/* Intel report */}
          <div className="relative">
            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-cyan-400 to-transparent rounded-full" />
            <div className="pl-4">
              <span className="block text-slate-600 text-xs font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle size={12} className="text-yellow-500" />
                Intelligence Report
              </span>
              <p className="text-slate-200 leading-relaxed text-lg font-light">
                {mission.briefingBody}
              </p>
            </div>
          </div>

          {/* Mission objective */}
          {mission.missionObjective && (
            <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-emerald-500" />
                <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest">Primary Objective</span>
              </div>
              <p className="text-emerald-200 font-medium">{mission.missionObjective}</p>
            </div>
          )}

          {/* Protocol details */}
          <div className="bg-slate-900/80 rounded-lg border border-slate-700 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-700">
              <div className="p-4 flex items-center gap-3">
                <div className="text-3xl">{getPuzzleIcon()}</div>
                <div>
                  <span className="block text-slate-500 text-xs font-mono uppercase">Protocol</span>
                  <span className="text-white font-bold">{getPuzzleLabel()}</span>
                </div>
              </div>
              <div className="p-4 flex items-center gap-3">
                <Clock size={28} className="text-red-500" />
                <div>
                  <span className="block text-slate-500 text-xs font-mono uppercase">Time Window</span>
                  <span className="text-red-400 font-bold font-mono text-xl">{mission.timeLimitSeconds}s</span>
                </div>
              </div>
              <div className="p-4 flex items-center gap-3">
                <div className="text-2xl">
                  {mission.transportMode === 'plane' && '✈️'}
                  {mission.transportMode === 'boat' && '🚢'}
                  {mission.transportMode === 'car' && '🚗'}
                  {mission.transportMode === 'helicopter' && '🚁'}
                  {mission.transportMode === 'submarine' && '🚀'}
                </div>
                <div>
                  <span className="block text-slate-500 text-xs font-mono uppercase">Transport</span>
                  <span className="text-white font-bold capitalize">{mission.transportMode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-slate-900 to-transparent border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-500 text-xs font-mono">
            Document ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}-OMEGA
          </div>
          <button 
            onClick={onAccept}
            className="flex items-center gap-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white px-8 py-4 rounded-lg font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-red-900/30 hover:scale-105 active:scale-100"
          >
            Accept Mission <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Briefing;
