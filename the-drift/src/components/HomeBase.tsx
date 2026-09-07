import React, { useState } from 'react';
import { 
  PlayerProfile, 
  savePlayerProfile, 
  WeaponType, 
  WEAPON_DEFINITIONS 
} from '../types/game';
import { soundManager } from '../audio/soundManager';
import { 
  Shield, 
  Zap, 
  Crosshair, 
  BookOpen, 
  Orbit, 
  Sparkles, 
  ChevronRight, 
  Check, 
  Lock, 
  Radio, 
  Flame, 
  RotateCw, 
  ArrowLeft,
  Volume2,
  VolumeX,
  Target
} from 'lucide-react';

interface HomeBaseProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  onWarpJump: (seed: number) => void;
  onReturnToMenu: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type ActiveModal = 'NONE' | 'SHIPYARD' | 'FOUNDRY' | 'TECH_LAB' | 'ARCHIVE' | 'WARP_CONFIRM';

const UPGRADE_COSTS = {
  hull: [60, 120, 200, 320, 480],
  shield: [75, 140, 230, 350, 520],
  thruster: [70, 130, 210, 330, 500],
  solar: [50, 100, 170, 260, 400],
  overclock: [90, 170, 270, 400, 600],
};

const WEAPON_UNLOCK_COSTS: Record<WeaponType, number> = {
  PULSE_LASER: 0,
  HEAT_SEEKER: 80,
  AREA_MISSILE: 150,
  SNIPER: 220,
  TACHYON_BEAM: 350,
  VORTEX_CANNON: 500,
};

export const HomeBase: React.FC<HomeBaseProps> = ({
  profile,
  onUpdateProfile,
  onWarpJump,
  onReturnToMenu,
  soundEnabled,
  onToggleSound,
}) => {
  const [activeModal, setActiveModal] = useState<ActiveModal>('NONE');
  const [selectedSectorSeed, setSelectedSectorSeed] = useState<number>(() => Math.floor(Math.random() * 899999 + 100000));
  const [isWarping, setIsWarping] = useState<boolean>(false);

  const handleOpenModal = (modal: ActiveModal) => {
    soundManager.playClick();
    setActiveModal(modal);
  };

  const handleCloseModal = () => {
    soundManager.playClick();
    setActiveModal('NONE');
  };

  // Buy Upgrades
  const handleUpgradeHull = () => {
    const lvl = profile.upgrades.hullLevel;
    if (lvl >= 5) return;
    const cost = UPGRADE_COSTS.hull[lvl];
    if (profile.shards < cost) return;

    const next: PlayerProfile = {
      ...profile,
      shards: profile.shards - cost,
      upgrades: {
        ...profile.upgrades,
        hullLevel: lvl + 1,
      },
    };
    soundManager.playUpgrade();
    savePlayerProfile(next);
    onUpdateProfile(next);
  };

  const handleUpgradeShield = () => {
    const lvl = profile.upgrades.shieldCapLevel;
    if (lvl >= 5) return;
    const cost = UPGRADE_COSTS.shield[lvl];
    if (profile.shards < cost) return;

    const next: PlayerProfile = {
      ...profile,
      shards: profile.shards - cost,
      upgrades: {
        ...profile.upgrades,
        shieldCapLevel: lvl + 1,
        shieldRegenLevel: lvl + 1,
      },
    };
    soundManager.playUpgrade();
    savePlayerProfile(next);
    onUpdateProfile(next);
  };

  const handleUpgradeThrusters = () => {
    const lvl = profile.upgrades.thrusterLevel;
    if (lvl >= 5) return;
    const cost = UPGRADE_COSTS.thruster[lvl];
    if (profile.shards < cost) return;

    const next: PlayerProfile = {
      ...profile,
      shards: profile.shards - cost,
      upgrades: {
        ...profile.upgrades,
        thrusterLevel: lvl + 1,
      },
    };
    soundManager.playUpgrade();
    savePlayerProfile(next);
    onUpdateProfile(next);
  };

  const handleUpgradeSolar = () => {
    const lvl = profile.upgrades.solarLevel;
    if (lvl >= 5) return;
    const cost = UPGRADE_COSTS.solar[lvl];
    if (profile.shards < cost) return;

    const next: PlayerProfile = {
      ...profile,
      shards: profile.shards - cost,
      upgrades: {
        ...profile.upgrades,
        solarLevel: lvl + 1,
      },
    };
    soundManager.playUpgrade();
    savePlayerProfile(next);
    onUpdateProfile(next);
  };

  const handleUpgradeOverclock = () => {
    const lvl = profile.upgrades.weaponOverclockLevel;
    if (lvl >= 5) return;
    const cost = UPGRADE_COSTS.overclock[lvl];
    if (profile.shards < cost) return;

    const next: PlayerProfile = {
      ...profile,
      shards: profile.shards - cost,
      upgrades: {
        ...profile.upgrades,
        weaponOverclockLevel: lvl + 1,
      },
    };
    soundManager.playUpgrade();
    savePlayerProfile(next);
    onUpdateProfile(next);
  };

  // Unlock / Equip Weapon
  const handleUnlockWeapon = (type: WeaponType) => {
    const cost = WEAPON_UNLOCK_COSTS[type];
    if (profile.shards < cost) return;
    if (profile.unlockedWeapons.includes(type)) return;

    const next: PlayerProfile = {
      ...profile,
      shards: profile.shards - cost,
      unlockedWeapons: [...profile.unlockedWeapons, type],
      equippedWeapon: type,
    };
    soundManager.playWeaponUnlocked();
    savePlayerProfile(next);
    onUpdateProfile(next);
  };

  const handleEquipWeapon = (type: WeaponType) => {
    if (!profile.unlockedWeapons.includes(type)) return;
    const next: PlayerProfile = {
      ...profile,
      equippedWeapon: type,
    };
    soundManager.playClick();
    savePlayerProfile(next);
    onUpdateProfile(next);
  };

  // Initiate Warp Jump
  const handleInitiateJump = () => {
    soundManager.playWarpJump();
    setIsWarping(true);
    setTimeout(() => {
      onWarpJump(selectedSectorSeed);
    }, 1200);
  };

  return (
    <div id="home-base-viewport" className="relative w-full h-full bg-[#020617] text-slate-100 select-none overflow-hidden font-mono">
      {/* Dynamic Starfield & Nebula Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.12)_0%,rgba(2,6,23,0.95)_70%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px]" />

      {/* Warp Jump Hyper-Space Tunnel Overlay Animation */}
      {isWarping && (
        <div className="absolute inset-0 z-50 bg-white flex items-center justify-center animate-ping [animation-duration:1.2s] pointer-events-none">
          <div className="text-slate-950 font-mono font-black text-3xl tracking-widest">
            WARP VECTOR ENGAGED...
          </div>
        </div>
      )}

      {/* Top Command Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            id="btn-return-menu"
            onClick={onReturnToMenu}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>MAIN MENU</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-sm font-bold tracking-wider text-slate-100">HAVEN CITADEL // HOME STATION</h1>
            </div>
            <p className="text-[11px] text-slate-400">ORBITAL SECTOR 00-PRIME • DEEP EXPEDITION HQ</p>
          </div>
        </div>

        {/* Resources & Status Badges */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 bg-sky-950/40 border border-sky-500/30 rounded-xl px-3.5 py-1.5 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
            <span className="text-xs text-slate-400">SHARD RESERVES:</span>
            <span className="text-sm font-bold text-sky-300">{profile.shards.toLocaleString()}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5">
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs text-slate-400">RELICS FOUND:</span>
            <span className="text-xs font-bold text-purple-300">{profile.relicsFound.length} / 3</span>
          </div>

          {profile.bossDefeated && (
            <div className="hidden md:flex items-center gap-1.5 bg-red-950/40 border border-red-500/40 rounded-xl px-2.5 py-1 text-[11px] font-bold text-red-400">
              <span>CHIMERA-0 DESTROYED</span>
            </div>
          )}

          <button
            onClick={onToggleSound}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition cursor-pointer"
            title="Toggle Audio"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* Main Orbital Space Viewport with Floating Station Modules */}
      <main className="relative z-10 w-full h-[calc(100%-72px)] flex flex-col items-center justify-center p-4 sm:p-8">
        {/* Central Haven Prime Planet Silhouette (Background) */}
        <div className="absolute w-[440px] h-[440px] sm:w-[580px] sm:h-[580px] rounded-full bg-gradient-to-b from-sky-950/40 via-slate-950/80 to-transparent border border-sky-500/10 pointer-events-none flex items-center justify-center">
          {/* Orbital Atmospheric Rim */}
          <div className="absolute inset-0 rounded-full border border-sky-400/20 shadow-[0_0_80px_rgba(56,189,248,0.15)] animate-pulse [animation-duration:8s]" />
          
          {/* Central Stargate Portal */}
          <div 
            id="stargate-jump-core"
            onClick={() => handleOpenModal('WARP_CONFIRM')}
            className="group relative w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-slate-950/90 border-2 border-sky-400/50 hover:border-sky-400 flex flex-col items-center justify-center p-4 shadow-[0_0_50px_rgba(56,189,248,0.25)] hover:shadow-[0_0_80px_rgba(56,189,248,0.45)] transition-all duration-300 cursor-pointer pointer-events-auto transform hover:scale-105"
          >
            {/* Spinning Stargate Rings */}
            <div className="absolute inset-2 rounded-full border border-dashed border-sky-400/40 animate-spin [animation-duration:24s]" />
            <div className="absolute inset-6 rounded-full border border-sky-500/30 animate-spin [animation-duration:14s] [animation-direction:reverse]" />
            <div className="absolute inset-10 rounded-full bg-sky-500/10 animate-pulse [animation-duration:3s]" />

            <Orbit className="w-10 h-10 text-sky-400 mb-2 group-hover:rotate-45 transition duration-300" />
            <span className="text-xs font-bold tracking-widest text-sky-200 text-center">
              STARGATE
            </span>
            <span className="text-[10px] text-sky-400/80 tracking-wider mt-1 group-hover:text-white transition">
              [ WARP JUMP ]
            </span>
          </div>
        </div>

        {/* 4 Interactive Orbital Station Buildings */}
        <div className="relative w-full max-w-5xl h-full flex items-center justify-between pointer-events-none">
          {/* Left Column: Shipyard & Foundry */}
          <div className="flex flex-col gap-6 sm:gap-10 pointer-events-auto">
            {/* 1. Aegis Shipyard */}
            <div
              id="building-shipyard"
              onClick={() => handleOpenModal('SHIPYARD')}
              className="group w-64 sm:w-72 bg-slate-950/85 hover:bg-slate-900/90 border border-slate-800/90 hover:border-sky-400/60 rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1 hover:shadow-sky-500/15"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-sky-950/60 border border-sky-500/30 text-sky-300 px-2 py-0.5 rounded-full">
                  LVL {profile.upgrades.hullLevel + profile.upgrades.shieldCapLevel}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition">
                AEGIS SHIPYARD
              </h2>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Nanocomposite hull reinforcement & deflector shield matrix upgrades.
              </p>
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-2">
                <span>HULL & SHIELD</span>
                <span className="text-sky-400 flex items-center gap-0.5">OPEN <ChevronRight className="w-3 h-3" /></span>
              </div>
            </div>

            {/* 2. Hyper-Drive Foundry */}
            <div
              id="building-foundry"
              onClick={() => handleOpenModal('FOUNDRY')}
              className="group w-64 sm:w-72 bg-slate-950/85 hover:bg-slate-900/90 border border-slate-800/90 hover:border-amber-400/60 rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1 hover:shadow-amber-500/15"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-950/60 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full">
                  LVL {profile.upgrades.thrusterLevel + profile.upgrades.solarLevel}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition">
                HYPER-DRIVE FOUNDRY
              </h2>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Sub-light ion thrust tuning & high-yield solar energy collectors.
              </p>
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-2">
                <span>PROPULSION & POWER</span>
                <span className="text-amber-400 flex items-center gap-0.5">OPEN <ChevronRight className="w-3 h-3" /></span>
              </div>
            </div>
          </div>

          {/* Right Column: Precursor Lab & Lore Archives */}
          <div className="flex flex-col gap-6 sm:gap-10 pointer-events-auto">
            {/* 3. Precursor Tech Lab */}
            <div
              id="building-tech-lab"
              onClick={() => handleOpenModal('TECH_LAB')}
              className="group w-64 sm:w-72 bg-slate-950/85 hover:bg-slate-900/90 border border-slate-800/90 hover:border-emerald-400/60 rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1 hover:shadow-emerald-500/15"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                  <Crosshair className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full">
                  {profile.unlockedWeapons.length} / 6 WEAPONS
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition">
                PRECURSOR TECH LAB
              </h2>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Weapon synthesizer: Railgun, Tachyon Arc-Lance & Singularity Cannon.
              </p>
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-2">
                <span>WEAPONS & OVERCLOCK</span>
                <span className="text-emerald-400 flex items-center gap-0.5">OPEN <ChevronRight className="w-3 h-3" /></span>
              </div>
            </div>

            {/* 4. Quantum Lore Archives */}
            <div
              id="building-archives"
              onClick={() => handleOpenModal('ARCHIVE')}
              className="group w-64 sm:w-72 bg-slate-950/85 hover:bg-slate-900/90 border border-slate-800/90 hover:border-purple-400/60 rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1 hover:shadow-purple-500/15"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-purple-950/60 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">
                  {profile.relicsFound.length} RELICS
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition">
                QUANTUM CODEX ARCHIVE
              </h2>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Decrypted Precursor relic transmissions & Chimera-0 threat dossiers.
              </p>
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-2">
                <span>PRECURSOR LORE</span>
                <span className="text-purple-400 flex items-center gap-0.5">OPEN <ChevronRight className="w-3 h-3" /></span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Launch Bottom Bar */}
        <div className="relative z-20 mt-4 flex items-center gap-4">
          <button
            id="btn-stargate-warp"
            onClick={() => handleOpenModal('WARP_CONFIRM')}
            className="py-3 px-8 bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-mono font-extrabold text-xs sm:text-sm tracking-widest rounded-xl shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all duration-150 transform active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Orbit className="w-4 h-4" />
            <span>[ ENGAGE STARGATE JUMP ]</span>
          </button>
        </div>
      </main>

      {/* ================= MODALS ================= */}

      {/* 1. Shipyard Modal */}
      {activeModal === 'SHIPYARD' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-sky-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-slate-100">AEGIS SHIPYARD</h3>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white text-xs">✕ CLOSE</button>
            </div>

            <div className="my-5 space-y-4">
              {/* Hull Upgrade */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">REINFORCED HULL MATRIX</span>
                  <span className="text-xs text-sky-400">LVL {profile.upgrades.hullLevel} / 5</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Current: {100 + profile.upgrades.hullLevel * 25} HP → Next: {100 + (profile.upgrades.hullLevel + 1) * 25} HP
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    COST: <strong className="text-sky-300">{profile.upgrades.hullLevel < 5 ? `${UPGRADE_COSTS.hull[profile.upgrades.hullLevel]} SHARDS` : 'MAXED'}</strong>
                  </span>
                  <button
                    disabled={profile.upgrades.hullLevel >= 5 || profile.shards < UPGRADE_COSTS.hull[profile.upgrades.hullLevel]}
                    onClick={handleUpgradeHull}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-lg transition"
                  >
                    UPGRADE
                  </button>
                </div>
              </div>

              {/* Shield Upgrade */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">DEFLECTOR SHIELD MATRIX</span>
                  <span className="text-xs text-sky-400">LVL {profile.upgrades.shieldCapLevel} / 5</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Current: {100 + profile.upgrades.shieldCapLevel * 20} Capacity • Recharge delay reduced
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    COST: <strong className="text-sky-300">{profile.upgrades.shieldCapLevel < 5 ? `${UPGRADE_COSTS.shield[profile.upgrades.shieldCapLevel]} SHARDS` : 'MAXED'}</strong>
                  </span>
                  <button
                    disabled={profile.upgrades.shieldCapLevel >= 5 || profile.shards < UPGRADE_COSTS.shield[profile.upgrades.shieldCapLevel]}
                    onClick={handleUpgradeShield}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-lg transition"
                  >
                    UPGRADE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Foundry Modal */}
      {activeModal === 'FOUNDRY' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">HYPER-DRIVE FOUNDRY</h3>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white text-xs">✕ CLOSE</button>
            </div>

            <div className="my-5 space-y-4">
              {/* Thruster Upgrade */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">ION THRUSTER NOZZLES</span>
                  <span className="text-xs text-amber-400">LVL {profile.upgrades.thrusterLevel} / 5</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  +{profile.upgrades.thrusterLevel * 15}% Acceleration • +{profile.upgrades.thrusterLevel * 12}% Max Velocity
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    COST: <strong className="text-amber-300">{profile.upgrades.thrusterLevel < 5 ? `${UPGRADE_COSTS.thruster[profile.upgrades.thrusterLevel]} SHARDS` : 'MAXED'}</strong>
                  </span>
                  <button
                    disabled={profile.upgrades.thrusterLevel >= 5 || profile.shards < UPGRADE_COSTS.thruster[profile.upgrades.thrusterLevel]}
                    onClick={handleUpgradeThrusters}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-lg transition"
                  >
                    UPGRADE
                  </button>
                </div>
              </div>

              {/* Solar Collector Upgrade */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">HIGH-YIELD SOLAR ABSORBERS</span>
                  <span className="text-xs text-amber-400">LVL {profile.upgrades.solarLevel} / 5</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  +{profile.upgrades.solarLevel * 35}% Solar charging speed near stars and ambient trickle
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    COST: <strong className="text-amber-300">{profile.upgrades.solarLevel < 5 ? `${UPGRADE_COSTS.solar[profile.upgrades.solarLevel]} SHARDS` : 'MAXED'}</strong>
                  </span>
                  <button
                    disabled={profile.upgrades.solarLevel >= 5 || profile.shards < UPGRADE_COSTS.solar[profile.upgrades.solarLevel]}
                    onClick={handleUpgradeSolar}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-lg transition"
                  >
                    UPGRADE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tech Lab & Armory Modal */}
      {activeModal === 'TECH_LAB' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Crosshair className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">PRECURSOR TECH LAB & ARMORY</h3>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white text-xs">✕ CLOSE</button>
            </div>

            {/* Weapon Overclock Module */}
            <div className="my-4 bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200">WEAPON OVERCLOCK MOD</span>
                <span className="text-xs text-emerald-400 ml-2">LVL {profile.upgrades.weaponOverclockLevel} / 5</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  +{profile.upgrades.weaponOverclockLevel * 20}% Damage to all projectiles • -{profile.upgrades.weaponOverclockLevel * 10}% Energy Drain
                </p>
              </div>
              <button
                disabled={profile.upgrades.weaponOverclockLevel >= 5 || profile.shards < UPGRADE_COSTS.overclock[profile.upgrades.weaponOverclockLevel]}
                onClick={handleUpgradeOverclock}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-lg transition"
              >
                {profile.upgrades.weaponOverclockLevel < 5 ? `${UPGRADE_COSTS.overclock[profile.upgrades.weaponOverclockLevel]} SHARDS` : 'MAXED'}
              </button>
            </div>

            {/* Weapon Arsenal Grid */}
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">SYNTHESIZED WEAPON SYSTEMS</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(WEAPON_DEFINITIONS) as WeaponType[]).map(type => {
                const def = WEAPON_DEFINITIONS[type];
                const isUnlocked = profile.unlockedWeapons.includes(type);
                const isEquipped = profile.equippedWeapon === type;
                const cost = WEAPON_UNLOCK_COSTS[type];

                return (
                  <div
                    key={type}
                    className={`p-3 rounded-xl border transition ${
                      isEquipped
                        ? 'bg-sky-950/30 border-sky-500'
                        : isUnlocked
                        ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/30 border-slate-900 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: def.color }} />
                        <span className="text-xs font-bold text-slate-200">{def.name}</span>
                      </div>
                      {isEquipped && (
                        <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-500/40 px-1.5 py-0.5 rounded">
                          EQUIPPED
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                      {def.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                      <span>DMG: {def.damage} | NRG: {def.energyCost}</span>
                      {isUnlocked ? (
                        <button
                          onClick={() => handleEquipWeapon(type)}
                          disabled={isEquipped}
                          className="px-2.5 py-1 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-sky-300 disabled:opacity-40 cursor-pointer"
                        >
                          {isEquipped ? 'ACTIVE' : 'EQUIP'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnlockWeapon(type)}
                          disabled={profile.shards < cost}
                          className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" />
                          <span>UNLOCK ({cost})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Precursor Codex Archive Modal */}
      {activeModal === 'ARCHIVE' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/40 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-slate-100">QUANTUM CODEX & PRECURSOR LORE</h3>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white text-xs">✕ CLOSE</button>
            </div>

            <div className="my-5 space-y-4">
              {/* Relic 1 */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-purple-300">RELIC I: THE CHRONO-PRISM OF XYLAR</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${profile.relicsFound.includes('Chrono-Prism of Xylar') ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
                    {profile.relicsFound.includes('Chrono-Prism of Xylar') ? 'DECRYPTED' : 'UNRECOVERED'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "The First Builders discovered that gravity is merely memory — a footprint left by mass across hyperspace. By polarizing tachyon lenses, inertia can be decoupled from matter."
                </p>
                <div className="mt-2 text-[10px] text-sky-400">
                  REWARD: Unlocks Tachyon Arc-Lance synthesis in the Precursor Tech Lab.
                </div>
              </div>

              {/* Relic 2 */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-purple-300">RELIC II: GRAVITON SPIRE OF NYX</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${profile.relicsFound.includes('Graviton Spire of Nyx') ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
                    {profile.relicsFound.includes('Graviton Spire of Nyx') ? 'DECRYPTED' : 'UNRECOVERED'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "The celestial sphere is not empty void; it is a tense membrane woven from cosmic strings. When mass nodes orbit, they sing in harmonics that grant boundless kinetic momentum to attuned vessels."
                </p>
                <div className="mt-2 text-[10px] text-amber-400">
                  REWARD: +50% Shard harvest bonus on all subsequent sector expeditions.
                </div>
              </div>

              {/* Relic 3 */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-purple-300">RELIC III: SINGULARITY SEED OF OMEGA</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${profile.relicsFound.includes('Singularity Seed of Omega') ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
                    {profile.relicsFound.includes('Singularity Seed of Omega') ? 'DECRYPTED' : 'UNRECOVERED'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "Beware the Apex Chimera. It was engineered not as a destroyer, but as a sentinel lock to seal the Void Rift. When its hull collapses, it pulls reality into a singular point."
                </p>
                <div className="mt-2 text-[10px] text-red-400">
                  REWARD: Singularity Vortex Cannon unlocked for synthesis!
                </div>
              </div>

              {/* Dossier: Chimera-0 */}
              <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4">
                <h4 className="text-xs font-bold text-red-400 mb-1">TACTICAL RECON: CHIMERA-0 APEX SENTINEL</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  • <strong className="text-sky-300">Phase I:</strong> Protected by 3 revolving Barrier Drones. Must destroy drones or pierce with Tachyon lances.<br />
                  • <strong className="text-amber-300">Phase II (&lt;500 HP):</strong> Releases EMP shockwaves and unleashes high-velocity tachyon sweeps.<br />
                  • <strong className="text-red-400">Phase III (&lt;240 HP):</strong> Core singularity activates, gravitationally dragging your ship into ramming collision range while firing vortex implosions!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Warp Confirmation Modal */}
      {activeModal === 'WARP_CONFIRM' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-sky-500/50 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto mb-4 text-sky-400">
              <Orbit className="w-6 h-6 animate-spin [animation-duration:8s]" />
            </div>

            <h3 className="text-lg font-bold text-slate-100 tracking-wider">
              ENGAGE STARGATE JUMP
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              Ready to jump into the uncharted sector? Your upgraded ship chassis and equipped weapon will be deployed.
            </p>

            <div className="my-5 bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-left">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>SECTOR COORDINATES:</span>
                <button
                  onClick={() => setSelectedSectorSeed(Math.floor(Math.random() * 899999 + 100000))}
                  className="text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" /> RANDOMIZE
                </button>
              </div>
              <div className="text-sm font-bold text-sky-300 tracking-widest font-mono">
                SEED: #{selectedSectorSeed}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleInitiateJump}
                className="flex-1 py-3 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition cursor-pointer"
              >
                WARP NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
