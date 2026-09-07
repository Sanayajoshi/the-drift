import React, { useEffect } from 'react';
import { ExpeditionStats } from '../types/game';
import { RotateCcw, Home, Trophy, Zap, Shield, Compass, Sparkles, Orbit, Clock, Radio, Award } from 'lucide-react';

interface ResultsModalProps {
  stats: ExpeditionStats;
  isVictory: boolean;
  distanceCoveredPercent: number;
  onRestart: () => void;
  onMainMenu: () => void;
  onHomeBase?: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  stats,
  isVictory,
  distanceCoveredPercent,
  onRestart,
  onMainMenu,
  onHomeBase,
}) => {
  // Listen for Space / Enter to quickly restart, Esc/M for Menu, H for Home Base
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onRestart();
      } else if (e.code === 'Escape' || e.code === 'KeyM' || e.key.toLowerCase() === 'm') {
        e.preventDefault();
        onMainMenu();
      } else if ((e.code === 'KeyH' || e.key.toLowerCase() === 'h') && onHomeBase) {
        e.preventDefault();
        onHomeBase();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart, onMainMenu, onHomeBase]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'S':
        return 'text-amber-300 border-amber-400 bg-amber-500/10 shadow-[0_0_25px_rgba(251,191,36,0.3)]';
      case 'A+':
      case 'A':
        return 'text-sky-400 border-sky-400 bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.25)]';
      case 'B':
        return 'text-emerald-400 border-emerald-400 bg-emerald-500/10';
      default:
        return 'text-slate-300 border-slate-600 bg-slate-800/40';
    }
  };

  return (
    <div
      id="results-modal-container"
      className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-4 sm:p-6 font-mono select-none"
    >
      <div className="w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        {/* Header Status */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
              isVictory
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'bg-red-500/15 text-red-400 border border-red-500/30'
            }`}
          >
            {isVictory ? <Trophy className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-widest text-slate-100">
            {isVictory ? 'EXPEDITION COMPLETE' : 'HULL INTEGRITY COMPROMISED'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isVictory ? 'Extraction portal reached successfully' : 'Vessel destroyed by gravitational impact'} · SEED {stats.seed}
          </p>
        </div>

        {/* Primary Grade & Score Card */}
        <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between mb-5">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 tracking-wider">FINAL EXPEDITION SCORE</span>
            <span className="text-3xl sm:text-4xl font-extrabold text-sky-400 tracking-tight">
              {stats.finalScore.toLocaleString()} <span className="text-xs text-slate-400 font-normal">PTS</span>
            </span>
          </div>

          {isVictory && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 tracking-wider mb-0.5">RATING</span>
              <div
                className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black ${getRatingColor(
                  stats.rating
                )}`}
              >
                {stats.rating}
              </div>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="w-full grid grid-cols-2 gap-2.5 text-xs mb-6">
          <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3 flex flex-col">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              ELAPSED TIME
            </span>
            <span className="text-base font-bold text-slate-100 mt-1">{formatTime(stats.timeElapsed)}</span>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3 flex flex-col">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              SOLAR & SHARD GAIN
            </span>
            <span className="text-base font-bold text-slate-100 mt-1">
              +{Math.round(stats.energyCollected)} / -{Math.round(stats.energySpent)}
            </span>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3 flex flex-col">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Orbit className="w-3.5 h-3.5 text-emerald-400" />
              GRAVITY ASSISTS
            </span>
            <span className="text-base font-bold text-slate-100 mt-1">{stats.gravityAssists}</span>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3 flex flex-col">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              SHARDS HARVESTED
            </span>
            <span className="text-base font-bold text-slate-100 mt-1">
              {stats.standardShardsCollected} std / {stats.richShardsCollected} rich
            </span>
          </div>

          {stats.totalArtifacts > 0 && (
            <div className="col-span-2 bg-amber-950/20 border border-amber-800/40 rounded-xl p-2.5 flex items-center justify-between text-amber-200">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                3-ORBIT PLANETARY ARTIFACTS
              </span>
              <span className="font-bold text-amber-300">
                {stats.artifactsCollected} / {stats.totalArtifacts} SYNCHRONIZED (+{stats.artifactsCollected * 800} PTS)
              </span>
            </div>
          )}

          {stats.signalScanned && (
            <div className="col-span-2 bg-purple-950/30 border border-purple-800/40 rounded-xl p-2.5 flex items-center justify-between text-purple-200">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                ANCIENT SIGNAL DISCOVERED & DECODED
              </span>
              <span className="font-bold text-purple-300">+500 PTS</span>
            </div>
          )}

          {!isVictory && (
            <div className="col-span-2 bg-slate-950/40 border border-slate-800/50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                SECTOR DISTANCE TRAVERSED
              </span>
              <span className="text-base font-bold text-amber-300">{distanceCoveredPercent}%</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          {onHomeBase && (
            <button
              id="btn-results-home-base"
              onClick={onHomeBase}
              className="flex-1 py-3.5 px-4 bg-purple-600 hover:bg-purple-500 text-slate-100 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-purple-600/25 active:scale-[0.99]"
            >
              <Orbit className="w-4 h-4" />
              HOME BASE & UPGRADES
            </button>
          )}

          <button
            id="btn-results-fly-again"
            onClick={onRestart}
            className="flex-1 py-3.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-sky-500/20 active:scale-[0.99]"
          >
            <RotateCcw className="w-4 h-4" />
            {isVictory ? 'FLY AGAIN' : 'RETRY SECTOR'}
          </button>

          <button
            id="btn-results-main-menu"
            onClick={onMainMenu}
            className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition border border-slate-700 active:scale-[0.99]"
          >
            <Home className="w-4 h-4" />
            MENU
          </button>
        </div>
      </div>
    </div>
  );
};
