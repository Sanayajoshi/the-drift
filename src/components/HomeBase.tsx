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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleClaimResearchGrant = () => {
    const next: PlayerProfile = {
      ...profile,
      shards: profile.shards + 250,
    };
    soundManager.playUpgrade();
    savePlayerProfile(next);
    onUpdateProfile(next);
    showToast('💎 CITADEL RESEARCH GRANT: +250 SHARDS DEPOSITED!');
  };

  const handleOpenModal = (modal: ActiveModal) => {
    soundManager.playClick();
    setActiveModal(modal);
  };

  const handleCloseModal = () => {
    soundManager.playClick();
    setActiveModal('NONE');
  };

  // Keyboard navigation for Home Base
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Escape') {
        e.preventDefault();
        if (activeModal !== 'NONE') {
          handleCloseModal();
        } else {
          onReturnToMenu();
        }
      } else if (e.code === 'Space' || e.code === 'Enter') {
        if (activeModal === 'WARP_CONFIRM') {
          e.preventDefault();
          handleInitiateJump();
        } else if (activeModal === 'NONE') {
          e.preventDefault();
          handleOpenModal('WARP_CONFIRM');
        }
      } else if (e.code === 'Digit1' || e.key === '1') {
        e.preventDefault();
        handleOpenModal('SHIPYARD');
      } else if (e.code === 'Digit2' || e.key === '2') {
        e.preventDefault();
        handleOpenModal('FOUNDRY');
      } else if (e.code === 'Digit3' || e.key === '3') {
        e.preventDefault();
        handleOpenModal('TECH_LAB');
      } else if (e.code === 'Digit4' || e.key === '4') {
        e.preventDefault();
        handleOpenModal('ARCHIVE');
      } else if (e.code === 'KeyM' || e.key.toLowerCase() === 'm') {
        e.preventDefault();
        onToggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, selectedSectorSeed, onReturnToMenu, onToggleSound]);

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
    showToast(`🛡️ HULL REINFORCED TO LEVEL ${lvl + 1}! (+25 MAX HP)`);
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
    showToast(`🛡️ DEFLECTOR SHIELD UPGRADED TO LEVEL ${lvl + 1}! (+20 SHIELD CAPACITY)`);
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
    showToast(`⚡ ION THRUSTERS UPGRADED TO LEVEL ${lvl + 1}! (+15% ACCELERATION)`);
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
    showToast(`⚡ SOLAR ABSORBERS UPGRADED TO LEVEL ${lvl + 1}! (+35% RECHARGE RATE)`);
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
    showToast(`🎯 WEAPON OVERCLOCK UPGRADED TO LEVEL ${lvl + 1}! (+20% DAMAGE)`);
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
    showToast(`🚀 WEAPON UNLOCKED: ${WEAPON_DEFINITIONS[type].name.toUpperCase()} EQUIPPED!`);
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
    showToast(`🎯 EQUIPPED: ${WEAPON_DEFINITIONS[type].name.toUpperCase()}`);
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
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 bg-sky-950/40 border border-sky-500/30 rounded-xl px-3.5 py-1.5 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
            <span className="text-xs text-slate-400 hidden sm:inline">SHARDS:</span>
            <span className="text-sm font-bold text-sky-300">{profile.shards.toLocaleString()}</span>
          </div>

          <button
            id="btn-claim-grant-header"
            onClick={handleClaimResearchGrant}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 rounded-xl px-3 py-1.5 transition cursor-pointer shadow-md hover:shadow-amber-500/20 active:scale-95"
            title="Claim Citadel Research Grant (+250 Shards) to afford instant upgrades"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>+250 GRANT</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5">
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs text-slate-400">RELICS:</span>
            <span className="text-xs font-bold text-purple-300">{profile.relicsFound.length} / 3</span>
          </div>

          {profile.bossDefeated && (
            <div className="hidden md:flex items-center gap-1.5 bg-red-950/40 border border-red-500/40 rounded-xl px-2.5 py-1 text-[11px] font-bold text-red-400">
              <span>CHIMERA-0 DEFEATED</span>
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

      {/* Top Station Dock Quick Access Bar */}
      <nav aria-label="Station Facilities" className="relative z-20 w-full bg-slate-950/90 border-b border-slate-800 px-4 py-2 flex items-center justify-center gap-2 sm:gap-3 flex-wrap backdrop-blur-md">
        <span className="text-[11px] font-bold text-slate-400 mr-1 hidden lg:inline">UPGRADE MODULES:</span>
        <button
          id="dock-btn-shipyard"
          onClick={() => handleOpenModal('SHIPYARD')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/80 border border-sky-500/40 text-sky-200 hover:text-white text-xs font-bold transition cursor-pointer shadow-sm hover:scale-105"
        >
          <Shield className="w-3.5 h-3.5 text-sky-400" />
          <span>[1] SHIPYARD (Hull/Shield)</span>
        </button>
        <button
          id="dock-btn-foundry"
          onClick={() => handleOpenModal('FOUNDRY')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-200 hover:text-white text-xs font-bold transition cursor-pointer shadow-sm hover:scale-105"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>[2] FOUNDRY (Thrusters/Solar)</span>
        </button>
        <button
          id="dock-btn-techlab"
          onClick={() => handleOpenModal('TECH_LAB')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 hover:text-white text-xs font-bold transition cursor-pointer shadow-sm hover:scale-105"
        >
          <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
          <span>[3] TECH LAB (Weapons)</span>
        </button>
        <button
          id="dock-btn-archive"
          onClick={() => handleOpenModal('ARCHIVE')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold transition cursor-pointer shadow-sm hover:scale-105"
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span>[4] CODEX (Relics)</span>
        </button>
        <button
          id="dock-btn-warp"
          onClick={() => handleOpenModal('WARP_CONFIRM')}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold transition cursor-pointer shadow-md shadow-sky-500/20 hover:scale-105 ml-1"
        >
          <Orbit className="w-3.5 h-3.5" />
          <span>WARP JUMP [Space]</span>
        </button>
      </nav>

      {/* Real-time Action Feedback Toast */}
      {toastMessage && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-slate-900/95 border border-sky-400/80 rounded-xl text-sky-200 text-xs font-bold shadow-2xl shadow-sky-500/25 flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Orbital Space Viewport with Floating Station Modules */}
      <main className="relative z-10 w-full h-[calc(100%-116px)] flex flex-col items-center justify-center p-4 sm:p-6">
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

        {/* Quick Launch Bottom Bar & Guide */}
        <div className="relative z-20 mt-3 flex flex-col sm:flex-row items-center gap-3">
          <button
            id="btn-stargate-warp"
            onClick={() => handleOpenModal('WARP_CONFIRM')}
            className="py-2.5 px-6 bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-mono font-extrabold text-xs sm:text-sm tracking-widest rounded-xl shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all duration-150 transform active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Orbit className="w-4 h-4" />
            <span>[ ENGAGE STARGATE JUMP — SPACE ]</span>
          </button>
        </div>

        <div className="relative z-20 mt-2 text-center max-w-xl text-[11px] text-slate-400 bg-slate-950/80 border border-slate-800/80 px-4 py-1.5 rounded-xl backdrop-blur-sm">
          💡 <span className="text-slate-200 font-bold">UPGRADE GUIDE:</span> Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-sky-300">1</kbd> for Shipyard, <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-300">2</kbd> for Foundry, <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-emerald-300">3</kbd> for Weapons, or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-purple-300">4</kbd> for Codex. Spend Shards, or tap <span className="text-amber-300 font-bold">[+250 GRANT]</span> anytime!
        </div>
      </main>

      {/* ================= MODALS ================= */}

      {/* 1. Shipyard Modal */}
      {activeModal === 'SHIPYARD' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-sky-500/40 rounded-2xl p-6 shadow-2xl">
            {/* Facility Sub-Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-4 text-xs font-bold">
              <button onClick={() => setActiveModal('SHIPYARD')} className="py-1.5 px-1 rounded-lg bg-sky-500 text-slate-950 flex items-center justify-center gap-1 shadow">
                <Shield className="w-3 h-3" />
                <span className="truncate">SHIPYARD</span>
              </button>
              <button onClick={() => setActiveModal('FOUNDRY')} className="py-1.5 px-1 rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" />
                <span className="truncate">FOUNDRY</span>
              </button>
              <button onClick={() => setActiveModal('TECH_LAB')} className="py-1.5 px-1 rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-1">
                <Crosshair className="w-3 h-3" />
                <span className="truncate">TECH LAB</span>
              </button>
              <button onClick={() => setActiveModal('ARCHIVE')} className="py-1.5 px-1 rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span className="truncate">CODEX</span>
              </button>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-100">AEGIS SHIPYARD</h3>
                  <p className="text-[11px] text-slate-400">Upgrade Hull Integrity and Deflector Shield Capacity</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded">✕ CLOSE</button>
            </div>

            {/* Shard Balance & Grant Bar */}
            <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 mt-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                <span className="text-xs text-slate-400">RESERVE SHARDS:</span>
                <span className="text-sm font-bold text-sky-300">{profile.shards.toLocaleString()}</span>
              </div>
              <button
                onClick={handleClaimResearchGrant}
                className="px-2.5 py-1 text-xs font-bold text-amber-300 bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 rounded-lg transition cursor-pointer flex items-center gap-1"
                title="Add +250 Shards immediately"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>+250 GRANT</span>
              </button>
            </div>

            <div className="my-4 space-y-4">
              {/* Hull Upgrade */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">REINFORCED HULL MATRIX</span>
                  <span className="text-xs text-sky-400">LVL {profile.upgrades.hullLevel} / 5</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Current: {100 + profile.upgrades.hullLevel * 25} HP → Next: {100 + (profile.upgrades.hullLevel + 1) * 25} HP (+25 HP)
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    COST: <strong className="text-sky-300">{profile.upgrades.hullLevel < 5 ? `${UPGRADE_COSTS.hull[profile.upgrades.hullLevel]} SHARDS` : 'MAX LEVEL'}</strong>
                  </span>
                  <button
                    disabled={profile.upgrades.hullLevel >= 5 || profile.shards < UPGRADE_COSTS.hull[profile.upgrades.hullLevel]}
                    onClick={handleUpgradeHull}
                    className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-lg transition"
                  >
                    {profile.upgrades.hullLevel >= 5 ? 'MAXED' : profile.shards < UPGRADE_COSTS.hull[profile.upgrades.hullLevel] ? `NEED ${UPGRADE_COSTS.hull[profile.upgrades.hullLevel]} SHARDS` : `UPGRADE (${UPGRADE_COSTS.hull[profile.upgrades.hullLevel]})`}
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
                  Current: {100 + profile.upgrades.shieldCapLevel * 20} Capacity • Faster delay & regen
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    COST: <strong className="text-sky-300">{profile.upgrades.shieldCapLevel < 5 ? `${UPGRADE_COSTS.shield[profile.upgrades.shieldCapLevel]} SHARDS` : 'MAX LEVEL'}</strong>
                  </span>
                  <button
                    disabled={profile.upgrades.shieldCapLevel >= 5 || profile.shards < UPGRADE_COSTS.shield[profile.upgrades.shieldCapLevel]}
                    onClick={handleUpgradeShield}
                    className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-lg transition"
                  >
                    {profile.upgrades.shieldCapLevel >= 5 ? 'MAXED' : profile.shards < UPGRADE_COSTS.shield[profile.upgrades.shieldCapLevel] ? `NEED ${UPGRADE_COSTS.shield[profile.upgrades.shieldCapLevel]} SHARDS` : `UPGRADE (${UPGRADE_COSTS.shield[profile.upgrades.shieldCapLevel]})`}
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
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl">
            {/* Facility Sub-Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-4 text-xs font-bold">
              <button onClick={() => setActiveModal('SHIPYARD')} className="py-1.5 px-1 rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                <span className="truncate">SHIPYARD</span>
              </button>
              <button onClick={() => setActiveModal('FOUNDRY')} className="py-1.5 px-1 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center gap-1 shadow">
                <Zap className="w-3 h-3" />
                <span className="truncate">FOUNDRY</span>
              </button>
              <button onClick={() => setActiveModal('TECH_LAB')} className="py-1.5 px-1 rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-1">
                <Crosshair className="w-3 h-3" />
                <span className="truncate">TECH LAB</span>
              </button>
              <button onClick={() => setActiveModal('ARCHIVE')} className="py-1.5 px-1 rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span className="truncate">CODEX</span>
              </button>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-100">HYPER-DRIVE FOUNDRY</h3>
                  <p className="text-[11px] text-slate-400">Upgrade Thruster Acceleration and Solar Energy Harvesters</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded">✕ CLOSE</button>
            </div>

            {/* Shard Balance & Grant Bar */}
            <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 mt-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs text-slate-400">RESERVE SHARDS:</span>
                <span className="text-sm font-bold text-amber-300">{profile.shards.toLocaleString()}</span>
              </div>
              <button
                onClick={handleClaimResearchGrant}
                className="px-2.5 py-1 text-xs font-bold text-amber-300 bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 rounded-lg transition cursor-pointer flex items-center gap-1"
                title="Add +250 Shards immediately"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>+250 GRANT</span>
              </button>
            </div>

            <div className="my-4 space-y-4">
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
                    COST: <strong className="text-amber-300">{profile.upgrades.thrusterLevel < 5 ? `${UPGRADE_COSTS.thruster[profile.upgrades.thrusterLevel]} SHARDS` : 'MAX LEVEL'}</strong>
                  </span>
                  <button
                    disabled={profile.upgrades.thrusterLevel >= 5 || profile.shards < UPGRADE_COSTS.thruster[profile.upgrades.thrusterLevel]}
                    onClick={handleUpgradeThrusters}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-lg transition"
                  >
                    {profile.upgrades.thrusterLevel >= 5 ? 'MAXED' : profile.shards < UPGRADE_COSTS.thruster[profile.upgrades.thrusterLevel] ? `NEED ${UPGRADE_COSTS.thruster[profile.upgrades.thrusterLevel]} SHARDS` : `UPGRADE (${UPGRADE_COSTS.thruster[profile.upgrades.thrusterLevel]})`}
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
                    COST: <strong className="text-amber-300">{profile.upgrades.solarLevel < 5 ? `${UPGRADE_COSTS.solar[profile.upgrades.solarLevel]} SHARDS` : 'MAX LEVEL'}</strong>
                  </span>
                  <button
                    disabled={profile.upgrades.solarLevel >= 5 || profile.shards < UPGRADE_COSTS.solar[profile.upgrades.solarLevel]}
                    onClick={handleUpgradeSolar}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-lg transition"
                  >
                    {profile.upgrades.solarLevel >= 5 ? 'MAXED' : profile.shards < UPGRADE_COSTS.solar[profile.upgrades.solarLevel] ? `NEED ${UPGRADE_COSTS.solar[profile.upgrades.solarLevel]} SHARDS` : `UPGRADE (${UPGRADE_COSTS.solar[profile.upgrades.solarLevel]})`}
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
            {/* Facility Sub-Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-4 text-xs font-bold">
              <button onClick={() => setActiveModal('SHIPYARD')} className="py-1.5 px-1 rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                <span className="truncate">SHIPYARD</span>
              </button>
              <button onClick={() => setActiveModal('FOUNDRY')} className="py-1.5 px-1 rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" />
                <span className="truncate">FOUNDRY</span>
              </button>
              <button onClick={() => setActiveModal('TECH_LAB')} className="py-1.5 px-1 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center gap-1 shadow">
                <Crosshair className="w-3 h-3" />
                <span className="truncate">TECH LAB</span>
              </button>
              <button onClick={() => setActiveModal('ARCHIVE')} className="py-1.5 px-1 rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span className="truncate">CODEX</span>
              </button>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Crosshair className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-100">PRECURSOR TECH LAB & ARMORY</h3>
                  <p className="text-[11px] text-slate-400">Synthesize, Overclock, and Equip Advanced Weapon Systems</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded">✕ CLOSE</button>
            </div>

            {/* Shard Balance & Grant Bar */}
            <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 mt-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-400">RESERVE SHARDS:</span>
                <span className="text-sm font-bold text-emerald-300">{profile.shards.toLocaleString()}</span>
              </div>
              <button
                onClick={handleClaimResearchGrant}
                className="px-2.5 py-1 text-xs font-bold text-amber-300 bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 rounded-lg transition cursor-pointer flex items-center gap-1"
                title="Add +250 Shards immediately"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>+250 GRANT</span>
              </button>
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
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-lg transition"
              >
                {profile.upgrades.weaponOverclockLevel >= 5 ? 'MAXED' : profile.shards < UPGRADE_COSTS.overclock[profile.upgrades.weaponOverclockLevel] ? `NEED ${UPGRADE_COSTS.overclock[profile.upgrades.weaponOverclockLevel]} SHARDS` : `UPGRADE (${UPGRADE_COSTS.overclock[profile.upgrades.weaponOverclockLevel]})`}
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
                    className={`p-3.5 rounded-xl border transition ${
                      isEquipped
                        ? 'bg-sky-950/40 border-sky-400 shadow-md shadow-sky-500/10'
                        : isUnlocked
                        ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/40 border-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: def.color }} />
                        <span className="text-xs font-bold text-slate-200">{def.name}</span>
                      </div>
                      {isEquipped && (
                        <span className="text-[10px] font-bold text-sky-300 bg-sky-950 border border-sky-500/40 px-2 py-0.5 rounded">
                          EQUIPPED
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                      {def.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>DMG: <strong className="text-slate-200">{def.damage}</strong> | NRG: <strong className="text-slate-200">{def.energyCost}</strong></span>
                      {isUnlocked ? (
                        <button
                          onClick={() => handleEquipWeapon(type)}
                          disabled={isEquipped}
                          className="px-3 py-1 text-xs font-bold rounded bg-sky-500 hover:bg-sky-400 text-slate-950 disabled:bg-slate-800 disabled:text-sky-400/60 disabled:cursor-default transition cursor-pointer"
                        >
                          {isEquipped ? 'ACTIVE' : 'EQUIP WEAPON'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnlockWeapon(type)}
                          disabled={profile.shards < cost}
                          className="px-3 py-1 text-xs font-bold rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition"
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
            {/* Facility Sub-Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-4 text-xs font-bold">
              <button onClick={() => setActiveModal('SHIPYARD')} className="py-1.5 px-1 rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                <span className="truncate">SHIPYARD</span>
              </button>
              <button onClick={() => setActiveModal('FOUNDRY')} className="py-1.5 px-1 rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" />
                <span className="truncate">FOUNDRY</span>
              </button>
              <button onClick={() => setActiveModal('TECH_LAB')} className="py-1.5 px-1 rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-1">
                <Crosshair className="w-3 h-3" />
                <span className="truncate">TECH LAB</span>
              </button>
              <button onClick={() => setActiveModal('ARCHIVE')} className="py-1.5 px-1 rounded-lg bg-purple-500 text-slate-950 flex items-center justify-center gap-1 shadow">
                <BookOpen className="w-3 h-3" />
                <span className="truncate">CODEX</span>
              </button>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-100">QUANTUM CODEX & PRECURSOR LORE</h3>
                  <p className="text-[11px] text-slate-400">Recovered Precursor Relics and Apex Threat Recon</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded">✕ CLOSE</button>
            </div>

            {/* Shard Balance & Grant Bar */}
            <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 mt-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-xs text-slate-400">RESERVE SHARDS:</span>
                <span className="text-sm font-bold text-purple-300">{profile.shards.toLocaleString()}</span>
              </div>
              <button
                onClick={handleClaimResearchGrant}
                className="px-2.5 py-1 text-xs font-bold text-amber-300 bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 rounded-lg transition cursor-pointer flex items-center gap-1"
                title="Add +250 Shards immediately"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>+250 GRANT</span>
              </button>
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
