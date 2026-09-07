import React, { useState } from 'react';
import { Ship, ExpeditionStats, WeaponType, WEAPON_DEFINITIONS } from '../types/game';
import {
  Volume2,
  VolumeX,
  Pause,
  Compass,
  Zap,
  ShieldAlert,
  Flame,
  ZoomIn,
  ZoomOut,
  Map as MapIcon,
  Sun,
  Award,
  Crosshair,
  Sparkles,
  Target,
  Skull,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Orbit,
  Keyboard,
} from 'lucide-react';

interface HUDProps {
  ship: Ship;
  stats: ExpeditionStats;
  distanceToGate: number;
  speed: number;
  tutorialStep: number;
  onPause: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  touchControls: boolean;
  onThrustTouch: (active: boolean) => void;
  onBrakeTouch: (active: boolean) => void;
  onRotateLeftTouch: (active: boolean) => void;
  onRotateRightTouch: (active: boolean) => void;
  onFireWeaponTouch?: (active: boolean) => void;
  onSelectWeapon?: (type: WeaponType) => void;
  userZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  showTrajectory: boolean;
  onToggleTrajectory: () => void;
  showMiniMap: boolean;
  onToggleMiniMap: () => void;
  miniMapMode: 'SECTOR' | 'LOCAL' | 'EXPANDED';
  onToggleMiniMapMode?: () => void;
  onToggleExpandMap?: () => void;
  isWindowFocused?: boolean;
  onFocusWindow?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  ship,
  stats,
  distanceToGate,
  speed,
  onPause,
  soundEnabled,
  onToggleSound,
  touchControls,
  onThrustTouch,
  onBrakeTouch,
  onRotateLeftTouch,
  onRotateRightTouch,
  onFireWeaponTouch,
  onSelectWeapon,
  userZoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  showMiniMap,
  onToggleMiniMap,
  miniMapMode,
  onToggleMiniMapMode,
  onToggleExpandMap,
  isWindowFocused = true,
  onFocusWindow,
}) => {
  const [showControlsHint, setShowControlsHint] = useState<boolean>(true);
  const [cleanRecordingMode, setCleanRecordingMode] = useState<boolean>(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const distKm = (distanceToGate / 1000).toFixed(1);
  const hullPercent = Math.max(0, Math.min(100, Math.round((ship.hull / ship.maxHull) * 100)));
  const shieldPercent = ship.maxShield > 0 ? Math.max(0, Math.min(100, Math.round((ship.shield / ship.maxShield) * 100))) : 0;
  const energyPercent = Math.max(0, Math.min(100, Math.round((ship.energy / ship.maxEnergy) * 100)));

  // Calculate drift angle between facing and velocity
  let driftDeg = 0;
  if (speed > 10) {
    const velAngle = Math.atan2(ship.velocity.y, ship.velocity.x);
    let angleDiff = velAngle - ship.rotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    driftDeg = Math.round(Math.abs(angleDiff) * (180 / Math.PI));
  }

  const zoomPercent = Math.round(userZoom * 100);
  const weaponTypes: WeaponType[] = ['PULSE_LASER', 'HEAT_SEEKER', 'AREA_MISSILE', 'SNIPER', 'TACHYON_BEAM', 'VORTEX_CANNON'];

  return (
    <div
      id="game-hud-overlay"
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-5 font-sans select-none z-10"
    >
      {/* Top Header Bar */}
      <div className="w-full flex items-start justify-between">
        {/* Top Left: Hull, Shield, Energy & Solar Recovery */}
        <div
          id="hud-vitals"
          className="flex flex-col gap-2 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-xl min-w-[200px] sm:min-w-[230px]"
        >
          {/* Shield Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono tracking-wider">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
                SHIELD
              </span>
              <div className="flex items-center gap-1">
                {ship.shieldRechargeDelay <= 0 && shieldPercent < 100 && (
                  <span className="text-[9px] text-sky-300 font-mono animate-pulse font-semibold">RECHARGING</span>
                )}
                <span className={shieldPercent < 25 ? 'text-amber-400 font-bold' : 'text-sky-300'}>
                  {shieldPercent}%
                </span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  shieldPercent > 35
                    ? 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]'
                    : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                }`}
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          </div>

          {/* Hull Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono tracking-wider">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                HULL
              </span>
              <span
                className={`font-mono ${
                  hullPercent < 25
                    ? 'text-red-400 font-bold animate-pulse'
                    : hullPercent < 50
                    ? 'text-amber-400'
                    : 'text-slate-200'
                }`}
              >
                {hullPercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  hullPercent > 50
                    ? 'bg-emerald-400'
                    : hullPercent > 25
                    ? 'bg-amber-400'
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                }`}
                style={{ width: `${hullPercent}%` }}
              />
            </div>
          </div>

          {/* Energy Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono tracking-wider">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                ENERGY
              </span>
              <div className="flex items-center gap-1.5">
                {ship.isSolarCharging && energyPercent < 100 && (
                  <span className="text-[9px] text-sky-300 flex items-center gap-0.5 font-mono animate-pulse">
                    <Sun className="w-3 h-3 text-amber-300" />
                    +SOLAR
                  </span>
                )}
                <span className={energyPercent < 20 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                  {energyPercent}%
                </span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  ship.inVoidPocket
                    ? 'bg-purple-400'
                    : energyPercent > 30
                    ? 'bg-amber-400'
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                }`}
                style={{ width: `${energyPercent}%` }}
              />
            </div>
          </div>

          {/* State warning indicators */}
          {ship.inVoidPocket && (
            <div className="text-[10px] font-mono tracking-wider text-purple-300 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              VOID DISTORTION (THRUST -35%)
            </div>
          )}

          {stats.totalArtifacts > 0 && (
            <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 border-t border-slate-800/80 pt-1">
              <span className="flex items-center gap-1 text-slate-400">
                <Award className="w-3 h-3 text-amber-400" />
                ARTIFACTS
              </span>
              <span className="font-bold">
                {stats.artifactsCollected}/{stats.totalArtifacts} (3-Orbit Synced)
              </span>
            </div>
          )}
        </div>

        {/* Top Center: Flight Avionics, Velocity & Gate Distance */}
        <div className="flex flex-col items-center gap-1.5">
          {!isWindowFocused && (
            <button
              onClick={onFocusWindow}
              className="pointer-events-auto cursor-pointer animate-pulse bg-sky-500/30 hover:bg-sky-500/40 border border-sky-400 rounded-full px-4 py-1 backdrop-blur-md shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center gap-2 text-xs font-mono text-sky-200 transition active:scale-95"
              title="Click to focus keyboard controls"
            >
              <Keyboard className="w-4 h-4 text-sky-400 animate-bounce" />
              <span>CLICK SCREEN TO ACTIVATE KEYBOARD</span>
            </button>
          )}

          {!cleanRecordingMode && (
            <div
              id="hud-nav-center"
              className="hidden sm:flex flex-col items-center bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl px-4 py-1.5 shadow-xl"
            >
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tracking-wider">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  PORTAL: <strong className="text-slate-100 font-mono text-xs ml-1">{distKm} KM</strong>
                </span>
              </div>

              <div className="flex items-center gap-3 mt-0.5 text-xs font-mono">
                <div className="text-slate-400">
                  SPD: <span className="text-sky-300 font-bold">{Math.round(speed)}</span>
                </div>

                {speed > 10 && (
                  <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
                    <span className="text-slate-400">DRIFT:</span>
                    <span className={`font-bold ${driftDeg > 35 ? 'text-amber-400' : 'text-sky-300'}`}>
                      {driftDeg}°
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Top Right: Score, Hostiles, Zoom & Quick Controls */}
        <div id="hud-stats-right" className="flex items-start gap-2">
          {/* Score Card */}
          <div className="flex flex-col items-end bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-2.5 shadow-xl min-w-[100px]">
            <div className="text-[11px] font-mono text-slate-400 tracking-wider">
              <span className="text-slate-200 font-semibold">{formatTime(stats.timeElapsed)}</span>
            </div>

            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-sky-400">
                {stats.finalScore}
              </span>
              <span className="text-[9px] font-mono text-slate-400">PTS</span>
            </div>

            {/* Hostiles Eliminated */}
            {stats.hostilesDestroyed > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-red-400 mt-0.5">
                <Skull className="w-2.5 h-2.5" />
                <span>KILLS: {stats.hostilesDestroyed}</span>
              </div>
            )}
          </div>

          {/* Quick Action Buttons Column */}
          <div className="flex flex-col gap-1 pointer-events-auto">
            {/* Clean Recording Mode Toggle */}
            <button
              id="hud-record-mode-toggle"
              onClick={() => setCleanRecordingMode(v => !v)}
              className={`p-2 bg-slate-950/80 hover:bg-slate-800/80 border rounded-lg transition cursor-pointer ${
                cleanRecordingMode ? 'border-amber-500/60 text-amber-400' : 'border-slate-800 text-slate-400'
              }`}
              title={cleanRecordingMode ? "Full HUD Mode" : "Clean Screen Mode for Recording"}
            >
              {cleanRecordingMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            {/* Audio Toggle */}
            <button
              id="hud-sound-toggle"
              onClick={onToggleSound}
              className="p-2 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              title="Toggle Audio"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {/* Mini-Map Radar & Expand Controls */}
            <div className="flex items-center gap-1">
              <button
                id="hud-minimap-toggle"
                onClick={onToggleMiniMap}
                className={`p-2 bg-slate-950/80 hover:bg-slate-800/80 border rounded-lg transition cursor-pointer ${
                  showMiniMap ? 'border-sky-500/50 text-sky-400' : 'border-slate-800 text-slate-500'
                }`}
                title="Toggle Mini-Map Radar [M]"
              >
                <MapIcon className="w-3.5 h-3.5" />
              </button>

              {showMiniMap && (
                <button
                  id="hud-minimap-expand-btn"
                  onClick={onToggleExpandMap || onToggleMiniMapMode}
                  className={`px-2 py-1.5 text-[9px] font-mono font-bold bg-slate-950/80 hover:bg-slate-800/80 border rounded-lg transition cursor-pointer flex items-center justify-center ${
                    miniMapMode === 'EXPANDED' ? 'border-amber-400 text-amber-300 bg-amber-950/40' : 'border-slate-800 text-slate-300'
                  }`}
                  title="Toggle Fullscreen Tactical Radar [TAB]"
                >
                  {miniMapMode === 'EXPANDED' ? 'MIN' : 'EXPAND'}
                </button>
              )}
            </div>

            {/* Pause Button */}
            <button
              id="hud-pause-button"
              onClick={onPause}
              className="p-2 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              title="Pause (Esc)"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle View: 100% Unobstructed Screen */}
      <div className="flex-1" />

      {/* Tactical Weapon Arsenal Selector (Center Bottom Dock) */}
      {!cleanRecordingMode && (
        <div
          id="hud-weapon-dock"
          className="self-center pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-1.5 shadow-2xl mb-1"
        >
          {weaponTypes.map((type, idx) => {
            const def = WEAPON_DEFINITIONS[type];
            const isSelected = ship.selectedWeapon === type;
            const keyNum = idx + 1;

            return (
              <button
                key={type}
                id={`weapon-btn-${type.toLowerCase()}`}
                onClick={() => onSelectWeapon?.(type)}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border text-xs font-mono font-bold ${
                  isSelected
                    ? 'bg-slate-900 border-sky-400 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                    : 'bg-slate-950/50 border-slate-800/70 hover:bg-slate-900/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`text-[9px] px-1 py-0.2 rounded border ${
                  isSelected ? 'bg-sky-500 text-slate-950 font-bold border-sky-300' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {keyNum}
                </span>

                {type === 'PULSE_LASER' && <Zap className="w-3 h-3 text-sky-400" />}
                {type === 'HEAT_SEEKER' && <Target className="w-3 h-3 text-amber-400" />}
                {type === 'AREA_MISSILE' && <Sparkles className="w-3 h-3 text-red-400" />}
                {type === 'SNIPER' && <Crosshair className="w-3 h-3 text-emerald-400" />}
                {type === 'TACHYON_BEAM' && <Zap className="w-3 h-3 text-orange-400" />}
                {type === 'VORTEX_CANNON' && <Orbit className="w-3 h-3 text-purple-400" />}
                <span>{def.shortName}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Zoom Controls (Bottom Right) */}
      <div
        id="hud-zoom-controls"
        className="absolute bottom-4 right-4 pointer-events-auto flex items-center gap-1 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-lg p-1 shadow-xl"
      >
        <button
          id="btn-zoom-out"
          onClick={onZoomOut}
          className="p-1.5 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
          title="Zoom Out [- or Q]"
        >
          <ZoomOut className="w-3 h-3" />
        </button>

        <button
          id="btn-zoom-reset"
          onClick={onResetZoom}
          className="px-2 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 text-[10px] font-mono text-sky-300 hover:text-sky-200 transition cursor-pointer"
          title="Reset Zoom to 100% [0 or R]"
        >
          {zoomPercent}%
        </button>

        <button
          id="btn-zoom-in"
          onClick={onZoomIn}
          className="p-1.5 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
          title="Zoom In [+ or E]"
        >
          <ZoomIn className="w-3 h-3" />
        </button>
      </div>

      {/* Bottom Left: Short, Minimal Control Help Card (Collapsible) */}
      {!touchControls && (
        <div
          id="hud-bottom-left-controls"
          className="absolute bottom-4 left-4 pointer-events-auto flex flex-col items-start gap-1"
        >
          {showControlsHint ? (
            <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl px-3 py-1.5 shadow-xl flex items-center gap-3 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-sky-300 rounded border border-slate-700 font-bold">WASD / ↑↓←→</kbd> Fly</span>
                <span className="text-slate-600">·</span>
                <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-red-300 rounded border border-slate-700 font-bold">Space / Click</kbd> Fire</span>
                <span className="text-slate-600">·</span>
                <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700">1-6</kbd> Weapons</span>
                <span className="text-slate-600">·</span>
                <span><kbd className="px-1 py-0.5 bg-slate-800 text-slate-300 rounded">M</kbd> Map</span>
                <span className="text-slate-600">·</span>
                <span><kbd className="px-1 py-0.5 bg-slate-800 text-slate-300 rounded">Esc</kbd> Pause</span>
              </div>
              <button
                onClick={() => setShowControlsHint(false)}
                className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition cursor-pointer"
                title="Hide Controls Hint"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowControlsHint(true)}
              className="bg-slate-950/70 hover:bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition cursor-pointer flex items-center gap-1 shadow-lg"
              title="Show Controls"
            >
              <span>Controls</span>
              <ChevronUp className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Touch Controls (Mobile View) */}
      {touchControls && (
        <div
          id="hud-touch-controls"
          className="w-full flex items-end justify-between pointer-events-auto pb-1 pr-32"
        >
          <div className="flex gap-2">
            <button
              id="touch-btn-left"
              onTouchStart={() => onRotateLeftTouch(true)}
              onTouchEnd={() => onRotateLeftTouch(false)}
              onMouseDown={() => onRotateLeftTouch(true)}
              onMouseUp={() => onRotateLeftTouch(false)}
              className="w-14 h-14 rounded-xl bg-slate-900/80 active:bg-sky-600/60 border border-slate-700 text-slate-200 text-base font-mono flex items-center justify-center select-none cursor-pointer backdrop-blur-md"
            >
              ◀ A
            </button>
            <button
              id="touch-btn-right"
              onTouchStart={() => onRotateRightTouch(true)}
              onTouchEnd={() => onRotateRightTouch(false)}
              onMouseDown={() => onRotateRightTouch(true)}
              onMouseUp={() => onRotateRightTouch(false)}
              className="w-14 h-14 rounded-xl bg-slate-900/80 active:bg-sky-600/60 border border-slate-700 text-slate-200 text-base font-mono flex items-center justify-center select-none cursor-pointer backdrop-blur-md"
            >
              D ▶
            </button>
          </div>

          <div className="flex gap-2">
            <button
              id="touch-btn-fire"
              onTouchStart={() => onFireWeaponTouch?.(true)}
              onTouchEnd={() => onFireWeaponTouch?.(false)}
              onMouseDown={() => onFireWeaponTouch?.(true)}
              onMouseUp={() => onFireWeaponTouch?.(false)}
              className="w-14 h-14 rounded-xl bg-red-950/80 active:bg-red-600/60 border border-red-500/50 text-red-300 text-xs font-mono font-bold flex flex-col items-center justify-center select-none cursor-pointer backdrop-blur-md"
            >
              <Crosshair className="w-4 h-4 mb-0.5" />
              FIRE
            </button>
            <button
              id="touch-btn-brake"
              onTouchStart={() => onBrakeTouch(true)}
              onTouchEnd={() => onBrakeTouch(false)}
              onMouseDown={() => onBrakeTouch(true)}
              onMouseUp={() => onBrakeTouch(false)}
              className="w-14 h-14 rounded-xl bg-slate-900/80 active:bg-amber-600/60 border border-slate-700 text-amber-400 text-xs font-mono flex items-center justify-center select-none cursor-pointer backdrop-blur-md"
            >
              BRAKE
            </button>
            <button
              id="touch-btn-thrust"
              onTouchStart={() => onThrustTouch(true)}
              onTouchEnd={() => onThrustTouch(false)}
              onMouseDown={() => onThrustTouch(true)}
              onMouseUp={() => onThrustTouch(false)}
              className="w-14 h-14 rounded-xl bg-sky-600/70 active:bg-sky-500 border border-sky-400 text-white text-xs font-bold font-mono flex flex-col items-center justify-center select-none cursor-pointer shadow-lg shadow-sky-500/20"
            >
              <Flame className="w-4 h-4 mb-0.5" />
              THRUST
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
