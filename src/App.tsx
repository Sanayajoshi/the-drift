import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Ship, ExpeditionStats, GameSettings, Particle, WeaponType, PlayerProfile, loadPlayerProfile, savePlayerProfile } from './types/game';
import { generateSector, MapData } from './game/generator';
import { updatePhysics, calculateFinalScoreAndRating } from './game/physics';
import { renderGame, Camera } from './game/renderer';
import { soundManager } from './audio/soundManager';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { PauseModal } from './components/PauseModal';
import { ResultsModal } from './components/ResultsModal';
import { DebugOverlay } from './components/DebugOverlay';
import { PrologueIntro } from './components/PrologueIntro';
import { HomeBase } from './components/HomeBase';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Persistent Player Progression Profile
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() => loadPlayerProfile());
  const profileRef = useRef<PlayerProfile>(playerProfile);
  useEffect(() => {
    profileRef.current = playerProfile;
  }, [playerProfile]);

  // Game state
  const [gameState, setGameState] = useState<GameState>(() => {
    const p = loadPlayerProfile();
    return p.prologueSeen ? 'MENU' : 'PROLOGUE';
  });
  const [currentSeed, setCurrentSeed] = useState<number>(() => Math.floor(Math.random() * 899999 + 100000));
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('the_drift_best_score') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [bestTime, setBestTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('the_drift_best_time');
      return saved ? parseFloat(saved) : null;
    } catch {
      return null;
    }
  });

  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [fps, setFps] = useState<number>(60);
  const fpsRef = useRef<number>(60);
  const [currentDt, setCurrentDt] = useState<number>(0.016);
  const [userZoom, setUserZoom] = useState<number>(1.0);
  const userZoomRef = useRef<number>(1.0);

  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicEnabled: true,
    debugMode: false,
    showGravityRings: true,
    showTrajectory: true,
    showMiniMap: true,
    miniMapMode: 'SECTOR',
    touchControls: false,
  });

  // HUD stats state updated at ~15Hz to avoid full React re-renders on every animation frame
  const [hudStats, setHudStats] = useState<{
    ship: Ship;
    stats: ExpeditionStats;
    distanceToGate: number;
    speed: number;
    initialDistanceToGate: number;
  } | null>(null);

  // Mutable Game References for 60fps Loop
  const mapDataRef = useRef<MapData | null>(null);
  const shipRef = useRef<Ship | null>(null);
  const statsRef = useRef<ExpeditionStats | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const cameraRef = useRef<Camera>({
    x: 1000,
    y: 1000,
    targetX: 1000,
    targetY: 1000,
    zoom: 0.92,
    shake: 0,
  });
  const activeAssistsRef = useRef<Map<string, { entrySpeed: number; minDistance: number; angleEntered: number }>>(new Map());
  const initialGateDistRef = useRef<number>(5000);

  // Touch & Key States
  const keysDownRef = useRef<Set<string>>(new Set());
  const isMouseDownRef = useRef<boolean>(false);
  const touchInputsRef = useRef<{
    isThrusting: boolean;
    isBraking: boolean;
    isRotatingLeft: boolean;
    isRotatingRight: boolean;
    isFiringWeapon: boolean;
  }>({
    isThrusting: false,
    isBraking: false,
    isRotatingLeft: false,
    isRotatingRight: false,
    isFiringWeapon: false,
  });
  const lastTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastHudUpdateRef = useRef<number>(0);

  // Initialize a new game sector
  const initGame = useCallback((seed: number) => {
    soundManager.init();
    const map = generateSector(seed);
    mapDataRef.current = map;

    const prof = profileRef.current;
    const maxHull = 100 + prof.upgrades.hullLevel * 25;
    const maxShield = 100 + prof.upgrades.shieldCapLevel * 20;

    const ship: Ship = {
      position: { x: map.playerStart.x, y: map.playerStart.y },
      velocity: { x: 0, y: 0 },
      rotation: Math.PI / 4,
      angularVelocity: 0,
      energy: 100,
      maxEnergy: 100,
      hull: maxHull,
      maxHull: maxHull,
      shield: maxShield,
      maxShield: maxShield,
      shieldRechargeDelay: 0,
      shieldImpactPulse: 0,
      selectedWeapon: prof.equippedWeapon || 'PULSE_LASER',
      weaponCooldowns: {
        PULSE_LASER: 0,
        HEAT_SEEKER: 0,
        AREA_MISSILE: 0,
        SNIPER: 0,
        TACHYON_BEAM: 0,
        VORTEX_CANNON: 0,
      },
      isFiring: false,
      isThrusting: false,
      isBraking: false,
      isRotatingLeft: false,
      isRotatingRight: false,
      isSolarCharging: false,
      radius: 14,
      trail: [],
      inVoidPocket: false,
      nearGravityNodeId: null,
      scanningSignalId: null,
      scanProgress: 0,
    };

    const artifactCount = map.massNodes.filter(n => !!n.artifact).length;

    const stats: ExpeditionStats = {
      seed,
      timeElapsed: 0,
      energySpent: 0,
      energyCollected: 0,
      standardShardsCollected: 0,
      richShardsCollected: 0,
      gravityAssists: 0,
      signalScanned: false,
      artifactsCollected: 0,
      totalArtifacts: artifactCount,
      hostilesDestroyed: 0,
      shotsFired: 0,
      damageDealt: 0,
      shieldDamageAbsorbed: 0,
      damageTaken: 0,
      distanceTraveled: 0,
      maxSpeed: 0,
      flowMultiplier: 1.0,
      maxFlowMultiplier: 1.0,
      finalScore: 0,
      rating: '—',
      efficiencyPercent: 0,
    };

    shipRef.current = ship;
    statsRef.current = stats;
    particlesRef.current = [];
    activeAssistsRef.current.clear();

    cameraRef.current = {
      x: ship.position.x,
      y: ship.position.y,
      targetX: ship.position.x,
      targetY: ship.position.y,
      zoom: 0.92,
      shake: 0,
    };

    const initDist = Math.hypot(
      map.extractionGate.position.x - map.playerStart.x,
      map.extractionGate.position.y - map.playerStart.y
    );
    initialGateDistRef.current = initDist;

    setCurrentSeed(seed);
    setTutorialStep(0);
    setGameState('PLAYING');

    setHudStats({
      ship: { ...ship },
      stats: { ...stats },
      distanceToGate: initDist,
      speed: 0,
      initialDistanceToGate: initDist,
    });
  }, []);

  // Initialize initial sector for background cosmos visual rendering immediately on load
  useEffect(() => {
    if (!mapDataRef.current) {
      const map = generateSector(currentSeed);
      mapDataRef.current = map;

      const prof = profileRef.current;
      const maxHull = 100 + (prof?.upgrades?.hullLevel || 0) * 25;
      const maxShield = 100 + (prof?.upgrades?.shieldCapLevel || 0) * 20;

      const ship: Ship = {
        position: { x: map.playerStart.x, y: map.playerStart.y },
        velocity: { x: 0, y: 0 },
        rotation: Math.PI / 4,
        angularVelocity: 0,
        energy: 100,
        maxEnergy: 100,
        hull: maxHull,
        maxHull: maxHull,
        shield: maxShield,
        maxShield: maxShield,
        shieldRechargeDelay: 0,
        shieldImpactPulse: 0,
        selectedWeapon: prof?.equippedWeapon || 'PULSE_LASER',
        weaponCooldowns: {
          PULSE_LASER: 0,
          HEAT_SEEKER: 0,
          AREA_MISSILE: 0,
          SNIPER: 0,
          TACHYON_BEAM: 0,
          VORTEX_CANNON: 0,
        },
        isFiring: false,
        isThrusting: false,
        isBraking: false,
        isRotatingLeft: false,
        isRotatingRight: false,
        isSolarCharging: false,
        radius: 14,
        trail: [],
        inVoidPocket: false,
        nearGravityNodeId: null,
        scanningSignalId: null,
        scanProgress: 0,
      };

      const artifactCount = map.massNodes.filter(n => !!n.artifact).length;
      const stats: ExpeditionStats = {
        seed: currentSeed,
        timeElapsed: 0,
        energySpent: 0,
        energyCollected: 0,
        standardShardsCollected: 0,
        richShardsCollected: 0,
        gravityAssists: 0,
        signalScanned: false,
        artifactsCollected: 0,
        totalArtifacts: artifactCount,
        hostilesDestroyed: 0,
        shotsFired: 0,
        damageDealt: 0,
        shieldDamageAbsorbed: 0,
        damageTaken: 0,
        distanceTraveled: 0,
        maxSpeed: 0,
        flowMultiplier: 1.0,
        maxFlowMultiplier: 1.0,
        finalScore: 0,
        rating: '—',
        efficiencyPercent: 0,
      };

      shipRef.current = ship;
      statsRef.current = stats;
      particlesRef.current = [];
      cameraRef.current = {
        x: ship.position.x,
        y: ship.position.y,
        targetX: ship.position.x,
        targetY: ship.position.y,
        zoom: 0.88,
        shake: 0,
      };
    }
  }, [currentSeed]);

  // Keep references fresh for listeners without causing effect churn
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;
  const initGameRef = useRef(initGame);
  initGameRef.current = initGame;

  // Window Focus State (critical for iframes/embedded preview)
  const [isWindowFocused, setIsWindowFocused] = useState<boolean>(() => {
    return typeof document !== 'undefined' ? document.hasFocus() : true;
  });

  const handleFocusWindow = useCallback(() => {
    try {
      window.focus();
      canvasRef.current?.focus();
    } catch {
      // safe
    }
    setIsWindowFocused(true);
  }, []);

  // Keyboard & Window Focus Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrows, space, tab, and zoom keys
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code) ||
        ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key?.toLowerCase() || '')
      ) {
        e.preventDefault();
      }

      if (e.code) keysDownRef.current.add(e.code);
      if (e.key) {
        keysDownRef.current.add(e.key);
        keysDownRef.current.add(e.key.toLowerCase());
        keysDownRef.current.add(e.key.toUpperCase());
      }

      // Weapon Switching Hotkeys [1, 2, 3, 4, 5, 6]
      if (shipRef.current) {
        if (e.code === 'Digit1' || e.key === '1') {
          shipRef.current.selectedWeapon = 'PULSE_LASER';
        } else if (e.code === 'Digit2' || e.key === '2') {
          shipRef.current.selectedWeapon = 'HEAT_SEEKER';
        } else if (e.code === 'Digit3' || e.key === '3') {
          shipRef.current.selectedWeapon = 'AREA_MISSILE';
        } else if (e.code === 'Digit4' || e.key === '4') {
          shipRef.current.selectedWeapon = 'SNIPER';
        } else if (e.code === 'Digit5' || e.key === '5') {
          shipRef.current.selectedWeapon = 'TACHYON_BEAM';
        } else if (e.code === 'Digit6' || e.key === '6') {
          shipRef.current.selectedWeapon = 'VORTEX_CANNON';
        }
      }

      // Tab Hotkey: Expand / Minimize Full Tactical Radar
      if (e.code === 'Tab') {
        e.preventDefault();
        setSettings(s => ({
          ...s,
          showMiniMap: true,
          miniMapMode: s.miniMapMode === 'EXPANDED' ? 'SECTOR' : 'EXPANDED',
        }));
      }

      // ESC for pause toggle (or minimize expanded radar)
      if (e.code === 'Escape') {
        setSettings(s => {
          if (s.miniMapMode === 'EXPANDED') {
            return { ...s, miniMapMode: 'SECTOR' };
          }
          if (gameStateRef.current === 'PLAYING') {
            setGameState('PAUSED');
            soundManager.stopAll();
          } else if (gameStateRef.current === 'PAUSED') {
            setGameState('PLAYING');
          }
          return s;
        });
      }

      // Zoom Hotkeys (Q / [ / - for zoom out, E / ] / + / = for zoom in, 0 / R to reset)
      if (e.code === 'KeyQ' || e.key === '[' || e.key === '-') {
        setUserZoom(z => {
          const next = Math.max(0.45, Math.round((z - 0.15) * 100) / 100);
          userZoomRef.current = next;
          return next;
        });
      }
      if (e.code === 'KeyE' || e.key === ']' || e.key === '+' || e.key === '=') {
        setUserZoom(z => {
          const next = Math.min(1.75, Math.round((z + 0.15) * 100) / 100);
          userZoomRef.current = next;
          return next;
        });
      }
      if (e.code === 'Digit0' || (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey)) {
        setUserZoom(1.0);
        userZoomRef.current = 1.0;
      }

      // Toggle Trajectory Predictor [T]
      if (e.code === 'KeyT') {
        setSettings(s => ({ ...s, showTrajectory: !s.showTrajectory }));
      }

      // Mini-Map Toggle & Mode Switch [M] (Cycles SECTOR -> LOCAL -> EXPANDED)
      if (e.code === 'KeyM') {
        setSettings(s => {
          if (!s.showMiniMap) return { ...s, showMiniMap: true, miniMapMode: 'SECTOR' };
          if (s.miniMapMode === 'SECTOR') return { ...s, miniMapMode: 'LOCAL' };
          if (s.miniMapMode === 'LOCAL') return { ...s, miniMapMode: 'EXPANDED' };
          return { ...s, miniMapMode: 'SECTOR' };
        });
      }

      // Developer shortcuts
      if (e.code === 'F3') {
        e.preventDefault();
        setSettings(s => ({ ...s, debugMode: !s.debugMode }));
      }
      if (e.code === 'F4') {
        e.preventDefault();
        setSettings(s => ({ ...s, showGravityRings: !s.showGravityRings }));
      }
      if (e.code === 'F5') {
        e.preventDefault();
        const nextSeed = Math.floor(Math.random() * 899999 + 100000);
        initGameRef.current(nextSeed);
      }
      if (e.code === 'F6') {
        e.preventDefault();
        if (shipRef.current) shipRef.current.energy = 100;
      }
      if (e.code === 'F7') {
        e.preventDefault();
        if (shipRef.current) {
          shipRef.current.hull = 100;
          shipRef.current.shield = 100;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code) keysDownRef.current.delete(e.code);
      if (e.key) {
        keysDownRef.current.delete(e.key);
        keysDownRef.current.delete(e.key.toLowerCase());
        keysDownRef.current.delete(e.key.toUpperCase());
      }
    };

    const handleFocus = () => {
      setIsWindowFocused(true);
    };

    const handleBlur = () => {
      setIsWindowFocused(false);
      keysDownRef.current.clear();
      isMouseDownRef.current = false;
      touchInputsRef.current.isThrusting = false;
      touchInputsRef.current.isBraking = false;
      touchInputsRef.current.isRotatingLeft = false;
      touchInputsRef.current.isRotatingRight = false;
      touchInputsRef.current.isFiringWeapon = false;
    };

    const handlePointerDown = () => {
      handleFocusWindow();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('pointerdown', handlePointerDown);

    // Initial focus call
    handleFocusWindow();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [handleFocusWindow]);

  // Canvas Mouse Wheel, Touch Pinch & Mouse Click to Fire
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDownRef.current = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDownRef.current = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
      setUserZoom(z => {
        const next = Math.min(1.75, Math.max(0.45, Math.round((z + zoomDelta) * 100) / 100));
        userZoomRef.current = next;
        return next;
      });
    };

    let initialPinchDist = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDist > 0) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const scaleChange = (dist - initialPinchDist) * 0.005;
        setUserZoom(z => {
          const next = Math.min(1.75, Math.max(0.45, Math.round((z + scaleChange) * 100) / 100));
          userZoomRef.current = next;
          return next;
        });
        initialPinchDist = dist;
      }
    };

    const handleTouchEnd = () => {
      initialPinchDist = 0;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Main 60FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Auto resize canvas to container viewport with devicePixelRatio support
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let frameCount = 0;
    let fpsTimer = performance.now();

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      let dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Clamp max dt to prevent physics tunneling during tab switches
      dt = Math.min(dt, 0.05);
      setCurrentDt(dt);

      // FPS measurement
      frameCount++;
      if (timestamp - fpsTimer >= 1000) {
        fpsRef.current = frameCount;
        setFps(frameCount);
        frameCount = 0;
        fpsTimer = timestamp;
      }

      const map = mapDataRef.current;
      const ship = shipRef.current;
      const stats = statsRef.current;
      const camera = cameraRef.current;

      if (map && ship && stats) {
        if (gameState === 'PLAYING') {
          // Poll inputs (WASD, Arrows, AZERTY ZQSD, Space, Enter)
          const keys = keysDownRef.current;
          const touch = touchInputsRef.current;

          ship.isThrusting = Boolean(
            keys.has('KeyW') || keys.has('ArrowUp') || keys.has('w') || keys.has('W') ||
            keys.has('KeyZ') || keys.has('z') || keys.has('Z') || // AZERTY Z
            keys.has('Up') || touch.isThrusting
          );
          ship.isBraking = Boolean(
            keys.has('KeyS') || keys.has('ArrowDown') || keys.has('s') || keys.has('S') ||
            keys.has('Down') || touch.isBraking
          );
          ship.isRotatingLeft = Boolean(
            keys.has('KeyA') || keys.has('ArrowLeft') || keys.has('a') || keys.has('A') ||
            keys.has('KeyQ') || keys.has('q') || keys.has('Q') || // AZERTY Q
            keys.has('Left') || touch.isRotatingLeft
          );
          ship.isRotatingRight = Boolean(
            keys.has('KeyD') || keys.has('ArrowRight') || keys.has('d') || keys.has('D') ||
            keys.has('Right') || touch.isRotatingRight
          );
          ship.isFiring = Boolean(
            keys.has('Space') || keys.has(' ') || keys.has('Enter') ||
            isMouseDownRef.current || touch.isFiringWeapon
          );

          // Sound triggers for continuous actions
          if (ship.isThrusting && ship.energy > 0) {
            soundManager.startThrust();
          } else {
            soundManager.stopThrust();
          }

          if (ship.isBraking && ship.energy > 0) {
            soundManager.startBrake();
          } else {
            soundManager.stopBrake();
          }

          // Tutorial progression
          const speed = Math.hypot(ship.velocity.x, ship.velocity.y);
          if (tutorialStep === 0 && ship.isThrusting) {
            setTutorialStep(1);
          } else if (tutorialStep === 1 && !ship.isThrusting && speed > 60) {
            setTutorialStep(2);
          } else if (tutorialStep === 2 && ship.isBraking) {
            setTutorialStep(3);
          }

          // Step physics
          stats.timeElapsed += dt;
          const result = updatePhysics(
            ship,
            map.massNodes,
            map.voidPockets,
            map.shards,
            map.ancientSignal,
            map.extractionGate,
            map.hostileShips,
            map.projectiles,
            stats,
            dt,
            particlesRef.current,
            activeAssistsRef.current,
            map.worldSize,
            map.derelicts,
            map.asteroids
          );

          // Update particles life
          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.life += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.life >= p.maxLife) {
              particlesRef.current.splice(i, 1);
            }
          }

          // Camera shake decay
          if (result.screenShake > 0) {
            camera.shake = result.screenShake;
          }
          if (camera.shake > 0) {
            camera.shake = Math.max(0, camera.shake - dt * 25);
          }

          // Smooth Camera Follow with lookahead in velocity direction
          const targetCamX = ship.position.x + ship.velocity.x * 0.35;
          const targetCamY = ship.position.y + ship.velocity.y * 0.35;

          camera.x += (targetCamX - camera.x) * (1 - Math.exp(-9 * dt));
          camera.y += (targetCamY - camera.y) * (1 - Math.exp(-9 * dt));

          // User-Controlled Camera Zoom with subtle speed expansion
          const speedFraction = Math.min(1, speed / 500);
          const targetZoom = userZoomRef.current * (0.95 - speedFraction * 0.16);
          camera.zoom += (targetZoom - camera.zoom) * (1 - Math.exp(-6 * dt));

          // Artifact Completed: Decrypt relic lore and unlock weapon systems
          if (result.artifactCompleted) {
            const art = result.artifactCompleted;
            setPlayerProfile(prev => {
              const alreadyFound = prev.relicsFound.includes(art.name);
              const nextRelics = alreadyFound ? prev.relicsFound : [...prev.relicsFound, art.name];
              const nextLore = prev.relicsLoreUnlocked.includes(art.name) ? prev.relicsLoreUnlocked : [...prev.relicsLoreUnlocked, art.name];
              let nextWeapons = [...prev.unlockedWeapons];
              if (art.weaponUnlock && !nextWeapons.includes(art.weaponUnlock)) {
                nextWeapons.push(art.weaponUnlock);
              }
              const updated: PlayerProfile = {
                ...prev,
                shards: prev.shards + (alreadyFound ? 40 : 150),
                relicsFound: nextRelics,
                relicsLoreUnlocked: nextLore,
                unlockedWeapons: nextWeapons,
              };
              savePlayerProfile(updated);
              return updated;
            });
          }

          // Hostile Ship / Apex Chimera Destroyed: Award Shards and Boss Badge
          if (result.hostileShipDestroyed) {
            const enemy = result.hostileShipDestroyed;
            const isBoss = !!enemy.isBoss;
            setPlayerProfile(prev => {
              const updated: PlayerProfile = {
                ...prev,
                shards: prev.shards + (isBoss ? 350 : 25),
                bossDefeated: prev.bossDefeated || isBoss,
              };
              savePlayerProfile(updated);
              return updated;
            });
          }

          // Check End Conditions
          if (result.gateReached) {
            calculateFinalScoreAndRating(stats, true);
            setGameState('COMPLETE');
            soundManager.stopAll();

            // Reward persistent shards from expedition harvest + extraction bonus
            setPlayerProfile(prev => {
              const harvested = Math.floor(stats.standardShardsCollected * 2 + stats.richShardsCollected * 5);
              const updated: PlayerProfile = {
                ...prev,
                shards: prev.shards + harvested + 120,
                expeditionsCount: prev.expeditionsCount + 1,
              };
              savePlayerProfile(updated);
              return updated;
            });

            // Update personal bests
            if (stats.finalScore > bestScore) {
              setBestScore(stats.finalScore);
              try {
                localStorage.setItem('the_drift_best_score', stats.finalScore.toString());
              } catch {}
            }
            if (bestTime === null || stats.timeElapsed < bestTime) {
              setBestTime(stats.timeElapsed);
              try {
                localStorage.setItem('the_drift_best_time', stats.timeElapsed.toString());
              } catch {}
            }
          } else if (result.shipDestroyed) {
            calculateFinalScoreAndRating(stats, false);
            setGameState('FAILED');
            soundManager.stopAll();
          }

          // Update HUD at throttled interval (~20Hz)
          if (timestamp - lastHudUpdateRef.current > 50) {
            const distGate = Math.hypot(
              map.extractionGate.position.x - ship.position.x,
              map.extractionGate.position.y - ship.position.y
            );
            setHudStats({
              ship: { ...ship },
              stats: { ...stats },
              distanceToGate: distGate,
              speed,
              initialDistanceToGate: initialGateDistRef.current,
            });
            lastHudUpdateRef.current = timestamp;
          }
        } else {
          // Ambient cosmic camera drift for menu / prologue background
          camera.x += Math.cos(timestamp * 0.0003) * 0.35;
          camera.y += Math.sin(timestamp * 0.0002) * 0.35;
        }

        // Render Frame
        if (ctx) {
          renderGame(
            ctx,
            canvas.width,
            canvas.height,
            ship,
            map.massNodes,
            map.voidPockets,
            map.shards,
            map.ancientSignal,
            map.extractionGate,
            map.hostileShips,
            map.projectiles,
            map.stars,
            map.nebulaClouds,
            particlesRef.current,
            camera,
            settings,
            map.worldSize,
            fpsRef.current,
            map.derelicts,
            map.asteroids
          );
        }
      } else if (ctx) {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [gameState, tutorialStep, settings, userZoom]);

  const handleToggleSound = () => {
    const nextVal = !settings.soundEnabled;
    setSettings(s => ({ ...s, soundEnabled: nextVal }));
    soundManager.setEnabled(nextVal);
  };

  const handleToggleGravityRings = () => {
    setSettings(s => ({ ...s, showGravityRings: !s.showGravityRings }));
  };

  const handleToggleTrajectory = () => {
    setSettings(s => ({ ...s, showTrajectory: !s.showTrajectory }));
  };

  const handleToggleMiniMap = () => {
    setSettings(s => ({ ...s, showMiniMap: !s.showMiniMap }));
  };

  const handleToggleMiniMapMode = () => {
    setSettings(s => ({
      ...s,
      miniMapMode: s.miniMapMode === 'SECTOR' ? 'LOCAL' : s.miniMapMode === 'LOCAL' ? 'EXPANDED' : 'SECTOR',
    }));
  };

  const handleToggleExpandMap = () => {
    setSettings(s => ({
      ...s,
      showMiniMap: true,
      miniMapMode: s.miniMapMode === 'EXPANDED' ? 'SECTOR' : 'EXPANDED',
    }));
  };

  const handleToggleTouchControls = () => {
    setSettings(s => ({ ...s, touchControls: !s.touchControls }));
  };

  const handleZoomIn = () => {
    setUserZoom(z => {
      const next = Math.min(1.75, Math.round((z + 0.15) * 100) / 100);
      userZoomRef.current = next;
      return next;
    });
  };

  const handleZoomOut = () => {
    setUserZoom(z => {
      const next = Math.max(0.45, Math.round((z - 0.15) * 100) / 100);
      userZoomRef.current = next;
      return next;
    });
  };

  const handleResetZoom = () => {
    setUserZoom(1.0);
    userZoomRef.current = 1.0;
  };

  const handleRestart = () => {
    initGame(currentSeed);
  };

  const handleMainMenu = () => {
    soundManager.stopAll();
    setGameState('MENU');
  };

  const handleThrustTouch = (active: boolean) => {
    touchInputsRef.current.isThrusting = active;
  };
  const handleBrakeTouch = (active: boolean) => {
    touchInputsRef.current.isBraking = active;
  };
  const handleRotateLeftTouch = (active: boolean) => {
    touchInputsRef.current.isRotatingLeft = active;
  };
  const handleRotateRightTouch = (active: boolean) => {
    touchInputsRef.current.isRotatingRight = active;
  };
  const handleFireWeaponTouch = (active: boolean) => {
    touchInputsRef.current.isFiringWeapon = active;
  };
  const handleSelectWeapon = (type: WeaponType) => {
    if (shipRef.current) {
      shipRef.current.selectedWeapon = type;
    }
  };

  const distanceCoveredPercent = hudStats
    ? Math.min(100, Math.max(0, Math.round((1 - hudStats.distanceToGate / hudStats.initialDistanceToGate) * 100)))
    : 0;

  return (
    <div
      id="drift-app-container"
      tabIndex={-1}
      onClick={handleFocusWindow}
      className="relative w-screen h-screen overflow-hidden bg-[#020617] select-none font-sans outline-none"
    >
      {/* 2D Canvas Viewport */}
      <canvas
        id="game-canvas"
        ref={canvasRef}
        tabIndex={0}
        onClick={handleFocusWindow}
        className="block w-full h-full cursor-crosshair outline-none"
      />

      {/* Prologue Lore Cinematic */}
      {gameState === 'PROLOGUE' && (
        <PrologueIntro
          onComplete={() => {
            setPlayerProfile(prev => {
              const next = { ...prev, prologueSeen: true };
              savePlayerProfile(next);
              return next;
            });
            setGameState('HOME_BASE');
          }}
        />
      )}

      {/* Home Base Hub & Upgrades System */}
      {gameState === 'HOME_BASE' && (
        <HomeBase
          profile={playerProfile}
          onUpdateProfile={(updated) => setPlayerProfile(updated)}
          onWarpJump={(seed) => {
            initGame(seed);
          }}
          onReturnToMenu={() => setGameState('MENU')}
          soundEnabled={settings.soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* Main Title Menu */}
      {gameState === 'MENU' && (
        <MainMenu
          onStartGame={initGame}
          bestScore={bestScore}
          bestTime={bestTime}
          currentSeed={currentSeed}
          soundEnabled={settings.soundEnabled}
          onToggleSound={handleToggleSound}
          onEnterHomeBase={() => setGameState('HOME_BASE')}
          onStartPrologue={() => setGameState('PROLOGUE')}
        />
      )}

      {/* In-Game HUD */}
      {gameState === 'PLAYING' && hudStats && (
        <HUD
          ship={hudStats.ship}
          stats={hudStats.stats}
          distanceToGate={hudStats.distanceToGate}
          speed={hudStats.speed}
          tutorialStep={tutorialStep}
          onPause={() => {
            setGameState('PAUSED');
            soundManager.stopAll();
          }}
          soundEnabled={settings.soundEnabled}
          onToggleSound={handleToggleSound}
          touchControls={settings.touchControls}
          onThrustTouch={handleThrustTouch}
          onBrakeTouch={handleBrakeTouch}
          onRotateLeftTouch={handleRotateLeftTouch}
          onRotateRightTouch={handleRotateRightTouch}
          onFireWeaponTouch={handleFireWeaponTouch}
          onSelectWeapon={handleSelectWeapon}
          userZoom={userZoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          showTrajectory={settings.showTrajectory}
          onToggleTrajectory={handleToggleTrajectory}
          showMiniMap={settings.showMiniMap}
          onToggleMiniMap={handleToggleMiniMap}
          miniMapMode={settings.miniMapMode}
          onToggleMiniMapMode={handleToggleMiniMapMode}
          onToggleExpandMap={handleToggleExpandMap}
          isWindowFocused={isWindowFocused}
          onFocusWindow={handleFocusWindow}
        />
      )}

      {/* Pause Dialog */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={() => setGameState('PLAYING')}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
          settings={settings}
          onToggleSound={handleToggleSound}
          onToggleGravityRings={handleToggleGravityRings}
          onToggleTrajectory={handleToggleTrajectory}
          onToggleMiniMap={handleToggleMiniMap}
          onToggleMiniMapMode={handleToggleMiniMapMode}
          onToggleTouchControls={handleToggleTouchControls}
          onResetZoom={handleResetZoom}
          userZoom={userZoom}
        />
      )}

      {/* Results / Game Over Report */}
      {(gameState === 'COMPLETE' || gameState === 'FAILED') && statsRef.current && (
        <ResultsModal
          stats={statsRef.current}
          isVictory={gameState === 'COMPLETE'}
          distanceCoveredPercent={distanceCoveredPercent}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
          onHomeBase={() => setGameState('HOME_BASE')}
        />
      )}

      {/* Developer Debug Overlay */}
      {settings.debugMode && shipRef.current && statsRef.current && mapDataRef.current && (
        <DebugOverlay
          ship={shipRef.current}
          stats={statsRef.current}
          fps={fps}
          dt={currentDt}
          massNodes={mapDataRef.current.massNodes}
          gatePosition={mapDataRef.current.extractionGate.position}
          onRefillEnergy={() => {
            if (shipRef.current) shipRef.current.energy = 100;
          }}
          onResetHull={() => {
            if (shipRef.current) {
              shipRef.current.hull = 100;
              shipRef.current.shield = 100;
            }
          }}
          onRegenerateSector={() => {
            const nextSeed = Math.floor(Math.random() * 899999 + 100000);
            initGame(nextSeed);
          }}
        />
      )}
    </div>
  );
}
