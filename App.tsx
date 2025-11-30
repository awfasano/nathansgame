import React, { useState, useCallback } from 'react';
import { GameState, GamePhase, LocationRecord, AgentProfile, VillainProfile, AGENT_SPECIALTIES, AGENT_GADGETS, VILLAIN_ORGANIZATIONS } from './types';
import { generateMission } from './services/geminiService';
import Briefing from './components/Briefing';
import WorldMap from './components/WorldMap';
import BombDefusal from './components/BombDefusal';
import Explosion from './components/Explosion';
import { Loader2, Fingerprint, RefreshCcw, Trophy, Globe, Volume2, Shield, Skull, Star, Zap } from 'lucide-react';
import { playExplosion, playSuccess, playBeep } from './utils/sound';

// Generate random agent profile
const generateAgent = (): AgentProfile => {
  const codenames = ['SHADOW', 'PHOENIX', 'SPECTER', 'VIPER', 'GHOST', 'RAVEN', 'FALCON', 'WOLF', 'HAWK', 'COBRA'];
  const randomCodename = codenames[Math.floor(Math.random() * codenames.length)] + '-' + Math.floor(Math.random() * 99).toString().padStart(2, '0');
  const randomSpecialty = AGENT_SPECIALTIES[Math.floor(Math.random() * AGENT_SPECIALTIES.length)];
  const randomGadgets = AGENT_GADGETS.sort(() => Math.random() - 0.5).slice(0, 3);
  
  return {
    codename: randomCodename,
    specialty: randomSpecialty,
    gadgets: randomGadgets
  };
};

// Generate random villain profile
const generateVillain = (): VillainProfile => {
  const names = ['Viktor Kross', 'Dr. Helena Vex', 'Magnus Thorne', 'The Architect', 'Cipher', 'Madame Zero', 'Colonel Stryker', 'The Puppeteer'];
  const aliases = ['The Alchemist', 'The Phantom', 'The Mastermind', 'The Shadow', 'The Oracle', 'The Serpent', 'The Raven'];
  const plans = [
    'Launch a satellite capable of disrupting global communications',
    'Release a nanobots swarm that can infiltrate any electronic device',
    'Detonate an EMP device over major world capitals',
    'Hijack the world\'s nuclear arsenal through a backdoor virus',
    'Create artificial earthquakes using subterranean resonance devices',
    'Deploy mind-control signals through cellular networks',
    'Crash the global economy through coordinated cyber attacks'
  ];
  
  const org = VILLAIN_ORGANIZATIONS[Math.floor(Math.random() * VILLAIN_ORGANIZATIONS.length)];
  
  return {
    name: names[Math.floor(Math.random() * names.length)],
    alias: aliases[Math.floor(Math.random() * aliases.length)],
    motivation: org.specialty,
    organization: org.name,
    masterPlan: plans[Math.floor(Math.random() * plans.length)]
  };
};

const initialAgent = generateAgent();
const initialVillain = generateVillain();

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'start',
    currentChapter: 1,
    totalChapters: 10,
    currentMission: null,
    storySoFar: [],
    visitedLocations: [],
    lives: 3,
    score: 0,
    agent: initialAgent,
    villain: initialVillain,
    discoveredClues: [],
    difficultyMultiplier: 1.0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAgentDetails, setShowAgentDetails] = useState(false);

  const startGame = useCallback(() => {
    playBeep(600);
    const chapters = Math.floor(Math.random() * (12 - 8 + 1)) + 8;
    const newAgent = generateAgent();
    const newVillain = generateVillain();
    
    setGameState(prev => ({ 
      ...prev, 
      totalChapters: chapters,
      agent: newAgent,
      villain: newVillain,
      visitedLocations: [{ name: "Agency HQ, Washington D.C.", x: 23, y: 32, country: "USA" }]
    }));
    
    loadMission(1, [], chapters, newVillain.alias, []);
  }, []);

  const loadMission = async (
    chapter: number, 
    context: string[], 
    totalChapters: number, 
    villainName: string,
    previousLocations: string[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      const mission = await generateMission(chapter, totalChapters, context, villainName, previousLocations);
      
      setGameState(prev => ({
        ...prev,
        currentMission: mission,
        currentChapter: chapter,
        phase: 'briefing'
      }));
    } catch (e) {
      console.error(e);
      setError("Secure link to HQ failed. Unable to download mission parameters.");
    } finally {
      setLoading(false);
    }
  };

  const handleMissionAccept = () => {
    playBeep(500);
    setGameState(prev => ({ ...prev, phase: 'travel' }));
  };

  const handleArrive = () => {
    if (gameState.currentMission) {
      const newLoc: LocationRecord = {
        name: gameState.currentMission.locationName,
        x: gameState.currentMission.coordinates.x,
        y: gameState.currentMission.coordinates.y
      };
      
      setGameState(prev => ({ 
        ...prev, 
        phase: 'defuse',
        visitedLocations: [...prev.visitedLocations, newLoc]
      }));
    }
  };

  const handleDefuseSuccess = () => {
    playSuccess();
    
    const missionSummary = gameState.currentMission?.briefingBody || "Target neutralized.";
    const bonusPoints = Math.floor(100 * gameState.currentChapter * gameState.difficultyMultiplier);
    
    setTimeout(() => {
      setGameState(prev => {
        const updatedStory = [...prev.storySoFar, missionSummary];
        
        if (prev.currentChapter >= prev.totalChapters) {
          return {
            ...prev,
            phase: 'victory',
            score: prev.score + (bonusPoints * 5),
            storySoFar: updatedStory
          };
        }

        return { 
          ...prev, 
          phase: 'success',
          score: prev.score + bonusPoints,
          storySoFar: updatedStory
        };
      });
    }, 1500);
  };

  const handleNextMission = () => {
    playBeep(500);
    const nextChapter = gameState.currentChapter + 1;
    const visitedNames = gameState.visitedLocations.map(l => l.name);
    loadMission(
      nextChapter, 
      gameState.storySoFar, 
      gameState.totalChapters, 
      gameState.villain.alias,
      visitedNames
    );
  };

  const handleDefuseFail = () => {
    playExplosion();
    setGameState(prev => ({ ...prev, phase: 'gameover' }));
  };

  const restartGame = () => {
    playBeep(400);
    const newAgent = generateAgent();
    const newVillain = generateVillain();
    
    setGameState({
      phase: 'start',
      currentChapter: 1,
      totalChapters: 10,
      currentMission: null,
      storySoFar: [],
      visitedLocations: [],
      lives: 3,
      score: 0,
      agent: newAgent,
      villain: newVillain,
      discoveredClues: [],
      difficultyMultiplier: 1.0
    });
  };

  // Start Screen
  if (gameState.phase === 'start') {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#1e3a5f 1px, transparent 1px), linear-gradient(90deg, #1e3a5f 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            animation: 'pulse 4s ease-in-out infinite'
          }} />
        </div>
        
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-emerald-500/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}

        <div className="z-10 flex flex-col items-center">
          <div className="mb-8 p-8 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-slate-700 shadow-[0_0_60px_rgba(16,185,129,0.2)]">
            <Fingerprint size={100} className="text-emerald-500 animate-pulse" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-2">
            SPY SCHOOL
          </h1>
          <h2 className="text-3xl md:text-5xl font-black text-red-600 tracking-tight mb-4">
            PROTOCOL OMEGA
          </h2>
          
          <p className="text-slate-400 max-w-lg mb-8 text-lg font-light leading-relaxed">
            Welcome, Agent. Your training begins now. 
            Travel the globe, solve puzzles, crack codes, and stop a global conspiracy.
          </p>
          
          {/* Agent preview */}
          <button 
            onClick={() => setShowAgentDetails(!showAgentDetails)}
            className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Shield size={16} />
            <span className="text-sm font-mono">Preview Agent Profile</span>
          </button>
          
          {showAgentDetails && (
            <div className="mb-8 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-4 max-w-sm w-full text-left animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center">
                  <Shield className="text-emerald-400" size={20} />
                </div>
                <div>
                  <div className="text-emerald-400 font-mono font-bold">{gameState.agent.codename}</div>
                  <div className="text-slate-500 text-xs">{gameState.agent.specialty}</div>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                <span className="text-slate-500">Gadgets:</span> {gameState.agent.gadgets.join(', ')}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Skull className="text-red-400" size={16} />
                  <span className="text-red-400 font-mono text-sm">{gameState.villain.alias}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Organization: {gameState.villain.organization}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col items-center gap-4">
            <span className="text-slate-600 text-xs flex items-center gap-2">
              <Volume2 size={12}/> Audio Enabled
            </span>
            
            {loading ? (
              <div className="flex items-center gap-2 text-emerald-500 font-mono">
                <Loader2 className="animate-spin" /> ESTABLISHING SECURE CONNECTION...
              </div>
            ) : (
              <button 
                onClick={startGame}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-4 px-12 rounded-lg text-xl tracking-widest transition-all hover:scale-105 shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-100"
              >
                START CAMPAIGN
              </button>
            )}
          </div>
          
          {error && <p className="text-red-500 mt-4 font-mono">{error}</p>}
        </div>
      </div>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 size={60} className="text-emerald-500 animate-spin mb-6" />
        <p className="text-emerald-500 font-mono text-lg animate-pulse tracking-widest">DECRYPTING INTEL...</p>
        <p className="text-slate-600 font-mono text-sm mt-2">Chapter {gameState.currentChapter} of {gameState.totalChapters}</p>
      </div>
    );
  }

  const lastLocation = gameState.visitedLocations.length > 0 
    ? gameState.visitedLocations[gameState.visitedLocations.length - 1]
    : { name: "HQ", x: 23, y: 32 };

  return (
    <div className="h-screen w-full font-sans bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Score HUD (persistent) */}
      {gameState.phase !== 'start' && gameState.phase !== 'gameover' && gameState.phase !== 'victory' && (
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700">
          <Star className="text-yellow-500" size={16} />
          <span className="font-mono text-yellow-400 font-bold">{gameState.score.toLocaleString()}</span>
        </div>
      )}

      {gameState.phase === 'briefing' && gameState.currentMission && (
        <Briefing 
          mission={gameState.currentMission} 
          chapter={gameState.currentChapter}
          totalChapters={gameState.totalChapters}
          onAccept={handleMissionAccept} 
        />
      )}

      {gameState.phase === 'travel' && gameState.currentMission && (
        <WorldMap 
          from={lastLocation} 
          to={{ 
            name: gameState.currentMission.locationName, 
            x: gameState.currentMission.coordinates.x, 
            y: gameState.currentMission.coordinates.y 
          }}
          history={gameState.visitedLocations}
          chapter={gameState.currentChapter}
          totalChapters={gameState.totalChapters}
          mode={gameState.currentMission.transportMode}
          onArrive={handleArrive}
        />
      )}

      {gameState.phase === 'defuse' && gameState.currentMission && (
        <BombDefusal 
          mission={gameState.currentMission} 
          onSuccess={handleDefuseSuccess}
          onFail={handleDefuseFail}
        />
      )}

      {gameState.phase === 'success' && (
        <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-emerald-950/40 to-slate-950 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
          
          <div className="z-10 text-center px-6">
            <div className="mb-6">
              <Zap size={60} className="text-emerald-500 mx-auto mb-4 animate-pulse" />
            </div>
            
            <div className="text-5xl md:text-7xl font-black text-emerald-400 mb-4 tracking-tighter">
              CHAPTER {gameState.currentChapter} COMPLETE
            </div>
            
            <p className="text-emerald-300/80 font-mono mb-6 max-w-lg mx-auto">
              Target secured. Intel extracted. {gameState.villain.alias} is one step closer to defeat.
            </p>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="bg-slate-900/80 rounded-lg p-4 border border-slate-700">
                <div className="text-slate-500 text-xs font-mono uppercase mb-1">Score</div>
                <div className="text-2xl font-mono text-yellow-400 font-bold">{gameState.score.toLocaleString()}</div>
              </div>
              <div className="bg-slate-900/80 rounded-lg p-4 border border-slate-700">
                <div className="text-slate-500 text-xs font-mono uppercase mb-1">Progress</div>
                <div className="text-2xl font-mono text-white">{gameState.currentChapter}/{gameState.totalChapters}</div>
              </div>
            </div>
            
            <button 
              onClick={handleNextMission}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-10 rounded-lg flex items-center gap-3 mx-auto shadow-lg hover:shadow-emerald-900/30 transition-all hover:scale-105"
            >
              Continue to Chapter {gameState.currentChapter + 1} <RefreshCcw size={20} />
            </button>
          </div>
        </div>
      )}

      {gameState.phase === 'victory' && (
        <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-yellow-950/30 to-slate-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-900/30 via-transparent to-transparent" />
          
          {/* Celebratory particles */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-500/60 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
          
          <div className="z-10 text-center px-6">
            <Trophy size={100} className="text-yellow-500 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(234,179,8,0.6)]" />
            
            <div className="text-6xl md:text-8xl font-black text-yellow-500 mb-4 tracking-tighter">
              MISSION COMPLETE
            </div>
            
            <p className="text-yellow-200/80 font-mono mb-8 max-w-2xl mx-auto text-lg">
              Congratulations, Agent <span className="text-yellow-400">{gameState.agent.codename}</span>. 
              You have dismantled {gameState.villain.organization}, captured {gameState.villain.alias}, 
              and saved the world from {gameState.villain.motivation.toLowerCase()}.
            </p>
            
            <div className="bg-slate-900/80 rounded-xl p-6 border border-yellow-800/50 mb-8 max-w-md mx-auto">
              <div className="text-slate-500 text-xs font-mono uppercase mb-2">Final Score</div>
              <div className="text-5xl font-mono text-yellow-400 font-bold">{gameState.score.toLocaleString()}</div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-500">Chapters</div>
                  <div className="text-white font-bold">{gameState.totalChapters}</div>
                </div>
                <div>
                  <div className="text-slate-500">Locations</div>
                  <div className="text-white font-bold">{gameState.visitedLocations.length}</div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={restartGame}
              className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-4 px-10 rounded-lg shadow-xl transition-all hover:scale-105 flex items-center gap-3 mx-auto"
            >
              <Globe size={20} /> New Assignment
            </button>
          </div>
        </div>
      )}

      {gameState.phase === 'gameover' && (
        <div className="h-full flex flex-col items-center justify-center bg-black relative overflow-hidden">
          <Explosion />
          
          <div className="z-10 text-center px-6 bg-black/80 p-12 rounded-2xl border-4 border-red-600 backdrop-blur-md animate-in fade-in zoom-in duration-1000 fill-mode-forwards opacity-0" style={{ animationDelay: '1s' }}>
            <div className="text-8xl md:text-9xl font-black text-red-500 mb-4 tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(220,38,38,1)]">
              KIA
            </div>
            <p className="text-red-300 font-mono mb-2 text-xl uppercase tracking-widest">Signal Lost</p>
            <p className="text-slate-400 mb-6">Agent {gameState.agent.codename} - Mission Failed</p>
            
            <div className="text-2xl font-mono text-white mb-8">
              Final Score: <span className="text-yellow-400">{gameState.score.toLocaleString()}</span>
            </div>
            
            <button 
              onClick={restartGame}
              className="bg-white text-red-900 hover:bg-red-100 font-bold py-4 px-10 rounded-lg shadow-xl transition-all hover:scale-105"
            >
              RESTART SIMULATION
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
