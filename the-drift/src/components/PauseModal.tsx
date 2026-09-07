import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Eye, Navigation, ZoomIn, Map as MapIcon } from 'lucide-react';
import { GameSettings } from '../types/game';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  settings: GameSettings;
  onToggleSound: () => void;
  onToggleGravityRings: () => void;
  onToggleTrajectory: () => void;
  onToggleMiniMap: () => void;
  onToggleMiniMapMode: () => void;
  onToggleTouchControls: () => void;
  onResetZoom: () => void;
  userZoom: number;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMainMenu,
  settings,
  onToggleSound,
  onToggleGravityRings,
  onToggleTrajectory,
  onToggleMiniMap,
  onToggleMiniMapMode,
  onToggleTouchControls,
  onResetZoom,
  userZoom,
}) => {
  return (
    <div
      id="pause-modal-container"
      className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 font-mono select-none"
    >
      <div className="w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold tracking-widest text-slate-100 mb-6">
          EXPEDITION PAUSED
        </h2>

        <div className="w-full flex flex-col gap-3">
          <button
            id="btn-pause-resume"
            onClick={onResume}
            className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-md shadow-sky-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            RESUME (ESC)
          </button>

          <button
            id="btn-pause-restart"
            onClick={onRestart}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART EXPEDITION
          </button>

          <button
            id="btn-pause-menu"
            onClick={onMainMenu}
            className="w-full py-3 px-4 bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition border border-slate-800"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </button>
        </div>

        {/* Quick Settings within Pause Menu */}
        <div className="w-full mt-6 pt-6 border-t border-slate-800 flex flex-col gap-2 text-xs text-left">
          <button
            onClick={onToggleMiniMap}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 text-slate-300 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-emerald-400" />
              Tactical Mini-Map [M]
            </span>
            <span className="font-bold text-emerald-400">{settings.showMiniMap ? 'ACTIVE' : 'OFF'}</span>
          </button>

          {settings.showMiniMap && (
            <button
              onClick={onToggleMiniMapMode}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 text-slate-300 cursor-pointer"
            >
              <span className="flex items-center gap-2 text-slate-400">
                └ Radar Range Mode
              </span>
              <span className="font-bold text-sky-400">{settings.miniMapMode}</span>
            </button>
          )}

          <button
            onClick={onToggleTrajectory}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 text-slate-300 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-sky-400" />
              Trajectory Predictor [T]
            </span>
            <span className="font-bold text-sky-400">{settings.showTrajectory ? 'ACTIVE' : 'OFF'}</span>
          </button>

          <button
            onClick={onToggleGravityRings}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 text-slate-300 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              Gravity Field Rings
            </span>
            <span className="font-bold text-emerald-400">{settings.showGravityRings ? 'SHOWN' : 'HIDDEN'}</span>
          </button>

          <button
            onClick={onToggleSound}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 text-slate-300 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              Audio Synthesis
            </span>
            <span className="font-bold text-sky-400">{settings.soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onResetZoom}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 text-slate-300 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-amber-400" />
              Camera Zoom (Scroll / Q / E)
            </span>
            <span className="font-bold text-amber-400">{Math.round(userZoom * 100)}% (RESET)</span>
          </button>

          <button
            onClick={onToggleTouchControls}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 text-slate-300 cursor-pointer"
          >
            <span>On-Screen Touch Buttons</span>
            <span className="font-bold text-slate-400">{settings.touchControls ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
