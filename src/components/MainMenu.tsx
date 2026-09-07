import React, { useState } from 'react';
import { Play, Volume2, VolumeX, Sparkles, RefreshCw, Compass, ShieldAlert, Orbit, BookOpen, Warehouse } from 'lucide-react';

interface MainMenuProps {
  onStartGame: (seed: number) => void;
  bestScore: number;
  bestTime: number | null;
  currentSeed: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onEnterHomeBase?: () => void;
  onStartPrologue?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  bestScore,
  bestTime,
  currentSeed,
  soundEnabled,
  onToggleSound,
  onEnterHomeBase,
  onStartPrologue,
}) => {
  const [seedInput, setSeedInput] = useState(currentSeed.toString());

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseInt(seedInput, 10);
    const seed = isNaN(parsed) ? Math.floor(Math.random() * 899999 + 100000) : parsed;
    onStartGame(seed);
  };

  const handleRandomSeed = () => {
    const newSeed = Math.floor(Math.random() * 899999 + 100000);
    setSeedInput(newSeed.toString());
  };

  // Keyboard navigation for main menu
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyL' || e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleStart();
      } else if (e.code === 'KeyH' || e.key.toLowerCase() === 'h') {
        e.preventDefault();
        if (onEnterHomeBase) onEnterHomeBase();
      } else if (e.code === 'KeyP' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (onStartPrologue) onStartPrologue();
      } else if (e.code === 'KeyM' || e.key.toLowerCase() === 'm') {
        e.preventDefault();
        onToggleSound();
      } else if (e.code === 'KeyR' || e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRandomSeed();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [seedInput, onEnterHomeBase, onStartPrologue, onToggleSound]);

  return (
    <div id="main-menu-container" className="absolute inset-0 z-20 flex items-center justify-center bg-[#04060a]/90 backdrop-blur-xl p-4 sm:p-8">
      {/* Background Decorative Cosmic Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative w-full max-w-lg bg-slate-950/80 border border-slate-800/90 rounded-2xl p-6 sm:p-10 shadow-2xl flex flex-col items-center text-center">
        {/* Title Header */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mb-4 text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.15)]">
            <Orbit className="w-6 h-6 animate-spin [animation-duration:12s]" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-widest text-slate-100 font-mono">
            THE DRIFT
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-mono mt-2 max-w-sm tracking-wide">
            Gravity, momentum, and Precursor relics in the deep void.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full space-y-2.5">
          {onEnterHomeBase && (
            <button
              id="btn-enter-home-base"
              onClick={onEnterHomeBase}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-mono font-bold text-sm sm:text-base tracking-wider rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 transition-all duration-150 transform active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer"
            >
              <Orbit className="w-5 h-5" />
              <span>[ ENTER HOME SYSTEM & UPGRADES ]</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] bg-slate-950/20 text-slate-950 border border-slate-950/30 rounded font-mono">H</kbd>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {onStartPrologue && (
              <button
                id="btn-start-prologue"
                onClick={onStartPrologue}
                className="py-3 px-3 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-700/50 text-purple-300 font-mono font-semibold text-xs tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>PROLOGUE</span>
                <kbd className="hidden sm:inline px-1 py-0.5 text-[9px] bg-purple-900/60 text-purple-300 border border-purple-700/60 rounded">P</kbd>
              </button>
            )}

            <button
              id="btn-begin-expedition"
              onClick={() => handleStart()}
              className="py-3 px-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-500/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>LAUNCH SECTOR</span>
              <kbd className="hidden sm:inline px-1 py-0.5 text-[9px] bg-slate-950/20 text-slate-950 border border-slate-950/30 rounded">SPACE ↵</kbd>
            </button>
          </div>
        </div>

        {/* Seed & Sector Settings */}
        <form onSubmit={handleStart} className="w-full mt-6 flex items-center gap-2">
          <div className="flex-1 flex items-center bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300">
            <span className="text-slate-500 mr-2">SEED:</span>
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Random seed"
              className="bg-transparent text-sky-300 font-mono outline-none w-full"
              maxLength={7}
            />
          </div>
          <button
            type="button"
            onClick={handleRandomSeed}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-sky-300 transition cursor-pointer"
            title="Randomize Sector Seed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </form>

        {/* Personal Best Records */}
        <div className="w-full grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-left font-mono">
          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/50">
            <div className="text-[11px] text-slate-400">BEST EXPEDITION</div>
            <div className="text-xl font-bold text-sky-400 mt-0.5">
              {bestScore > 0 ? `${bestScore.toLocaleString()} PTS` : '—'}
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/50">
            <div className="text-[11px] text-slate-400">FASTEST TIME</div>
            <div className="text-xl font-bold text-slate-200 mt-0.5">
              {bestTime !== null ? formatTime(bestTime) : '—'}
            </div>
          </div>
        </div>

        {/* Control Quick Reference */}
        <div className="w-full mt-6 text-slate-400 text-xs font-mono flex flex-wrap justify-center gap-x-4 gap-y-1.5 opacity-80">
          <span><strong className="text-slate-200">W / ↑</strong> Thrust</span>
          <span><strong className="text-slate-200">A / D</strong> Rotate</span>
          <span><strong className="text-slate-200">S / Space</strong> SAS Brake</span>
          <span><strong className="text-sky-300">Scroll / Q / E</strong> Zoom</span>
          <span><strong className="text-sky-300">T</strong> Trajectory</span>
          <span><strong className="text-slate-200">ESC</strong> Pause</span>
        </div>

        {/* Audio Toggle in bottom corner */}
        <div className="mt-6 flex items-center justify-between w-full text-xs font-mono text-slate-400">
          <button
            onClick={onToggleSound}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            <span>AUDIO {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>
          <span className="text-[10px] text-slate-400">VERSION 0.1 POC</span>
        </div>
      </div>
    </div>
  );
};
