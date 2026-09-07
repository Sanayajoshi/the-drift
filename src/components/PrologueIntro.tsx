import React, { useState, useEffect } from 'react';
import { Sparkles, Terminal, ChevronRight, SkipForward, ShieldAlert, Orbit, Radio } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface PrologueIntroProps {
  onComplete: () => void;
}

const LORE_SLIDES = [
  {
    tag: 'ANOMALY TRANSMISSION // 2842.10.14',
    title: 'THE DORMANT PROTOCOLS AWAKEN',
    lead: 'In the uncharted depths of Sector 842, gravitational sensors spiked across three dimensional axes.',
    body: 'Precursor monoliths, silent for ten thousand solar cycles, have begun broadcasting coherent tachyon harmonics. The harmonic frequencies are warping local orbital mechanics and destabilizing planetary mass nodes.',
    icon: Radio,
    accent: '#38bdf8',
  },
  {
    tag: 'THREAT VECTOR CONFIRMED // QUARANTINE PROTOCOL',
    title: 'APEX DREADNOUGHT: CHIMERA-0',
    lead: 'From the event horizon of a dormant wormhole, an alien warship of impossible scale has established orbit.',
    body: 'Chimera-0 enforces an impenetrable quarantine over the sector. Protected by revolving kinetic barrier drones, tachyon lance sweeps, and an antimatter core that collapses into an artificial singularity when threatened.',
    icon: ShieldAlert,
    accent: '#f97316',
  },
  {
    tag: 'HAVEN CITADEL // COMMAND DIRECTIVE',
    title: 'THE HAVEN RECOVERY MISSION',
    lead: 'You pilot the vanguard slipstream scout from Haven Citadel, the last orbital refuge.',
    body: 'Exploit gravitational slingshots to out-maneuver hostile patrol corvettes. Collect energetic tachyon shards to upgrade your vessel at Haven’s orbital facilities. Recover the Precursor artifacts to unlock their ancient lore and weapon technologies.',
    icon: Orbit,
    accent: '#a855f7',
  },
];

export const PrologueIntro: React.FC<PrologueIntroProps> = ({ onComplete }) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [displayText, setDisplayText] = useState(() => LORE_SLIDES[0].body);
  const [isTyping, setIsTyping] = useState(false);

  const currentSlide = LORE_SLIDES[slideIndex];

  useEffect(() => {
    try {
      soundManager.playLoreTransmission();
    } catch {
      // safe
    }
    setDisplayText('');
    setIsTyping(true);

    const fullText = currentSlide.body;
    let charIndex = 0;

    const timer = setInterval(() => {
      if (charIndex < fullText.length) {
        setDisplayText(fullText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 18);

    return () => clearInterval(timer);
  }, [slideIndex, currentSlide.body]);

  const handleNext = () => {
    try {
      soundManager.playClick();
    } catch {
      // safe
    }
    if (slideIndex < LORE_SLIDES.length - 1) {
      setSlideIndex(prev => prev + 1);
    } else {
      try {
        soundManager.playWarpJump();
      } catch {
        // safe
      }
      onComplete();
    }
  };

  const handleSkip = () => {
    try {
      soundManager.playClick();
      soundManager.playWarpJump();
    } catch {
      // safe
    }
    onComplete();
  };

  // Keyboard navigation for prologue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['Space', 'Enter', 'ArrowRight', 'ArrowDown', 'KeyD', 'KeyW'].includes(e.code) ||
        [' ', 'enter', 'arrowright', 'd', 'w'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        handleNext();
      } else if (
        ['Escape', 'Backspace', 'KeyS'].includes(e.code) ||
        ['escape', 'backspace', 's'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slideIndex]);

  const IconComp = currentSlide.icon;

  return (
    <div id="prologue-overlay" className="absolute inset-0 z-30 flex items-center justify-center bg-[#020617] text-slate-100 select-none overflow-hidden p-4 sm:p-8">
      {/* Dynamic Starfield & Nebula Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.1)_0%,rgba(2,6,23,0.98)_70%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative w-full max-w-2xl bg-slate-950/90 border border-slate-800/90 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl flex flex-col justify-between min-h-[460px]">
        {/* Top Header / Progress Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 font-mono text-xs text-sky-400">
            <Terminal className="w-4 h-4 animate-pulse" />
            <span>TERMINUS ARCHIVE // PROLOGUE</span>
          </div>

          <div className="flex items-center gap-1.5">
            {LORE_SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === slideIndex
                    ? 'w-6 bg-sky-400'
                    : i < slideIndex
                    ? 'w-2 bg-sky-600'
                    : 'w-2 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Narrative Content */}
        <div className="my-6 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: `${currentSlide.accent}15`,
                borderColor: `${currentSlide.accent}50`,
                color: currentSlide.accent,
              }}
            >
              <IconComp className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span
                className="text-[11px] font-mono tracking-widest block uppercase font-bold"
                style={{ color: currentSlide.accent }}
              >
                {currentSlide.tag}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-wide text-slate-100 mt-0.5">
                {currentSlide.title}
              </h2>
            </div>
          </div>

          <p className="text-slate-300 text-sm sm:text-base font-mono leading-relaxed border-l-2 border-sky-500/40 pl-3">
            {currentSlide.lead}
          </p>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 min-h-[110px]">
            <p className="text-slate-400 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {displayText}
              {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-sky-400 animate-pulse" />}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            id="btn-prologue-skip"
            onClick={handleSkip}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
            <span>SKIP PROLOGUE</span>
            <kbd className="hidden sm:inline px-1 py-0.5 text-[10px] bg-slate-800/90 text-slate-400 border border-slate-700 rounded">ESC</kbd>
          </button>

          <button
            id="btn-prologue-next"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs sm:text-sm tracking-wider rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 transition active:scale-95 cursor-pointer"
          >
            <span>{slideIndex === LORE_SLIDES.length - 1 ? 'ENTER HAVEN CITADEL' : 'CONTINUE'}</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-950/20 text-slate-950 border border-slate-950/30 rounded font-mono">SPACE ↵</kbd>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
