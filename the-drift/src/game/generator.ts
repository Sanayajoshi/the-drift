import {
  MassNode,
  EnergyShard,
  VoidPocket,
  AncientSignal,
  ExtractionGate,
  Star,
  NebulaCloud,
  Vector2D,
  PlanetType,
  ArtifactOrbitalState,
  HostileShip,
  Projectile,
  EnemyType,
  DerelictStation,
  Asteroid,
  WeaponType,
} from '../types/game';

// Deterministic Mulberry32 PRNG
export function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MapData {
  worldSize: { width: number; height: number };
  playerStart: Vector2D;
  extractionGate: ExtractionGate;
  massNodes: MassNode[];
  shards: EnergyShard[];
  voidPockets: VoidPocket[];
  ancientSignal: AncientSignal;
  stars: Star[];
  nebulaClouds: NebulaCloud[];
  hostileShips: HostileShip[];
  projectiles: Projectile[];
  derelicts: DerelictStation[];
  asteroids: Asteroid[];
}

const PLANET_NAMES = [
  'Aethelgard Prime',
  'Verdant V',
  'Chronos IX',
  'Tartarus Depths',
  'Solaris Veil',
  'Hyperion Zenith',
  'Neptunia Beta',
  'Glacies VIII',
];

const ARTIFACT_PRESETS: {
  name: string;
  type: string;
  lore: string;
  upgradeReward: {
    type: 'WEAPON' | 'PERK' | 'STAT';
    key: string;
    label: string;
    description: string;
    weaponType?: WeaponType;
  };
}[] = [
  {
    name: 'Chrono-Resonance Coil',
    type: 'TEMPORAL_CORE',
    lore: 'Precursor chronological synchronizer. Slingshot gravitational acceleration dilates local spacetime.',
    upgradeReward: {
      type: 'WEAPON',
      key: 'TACHYON_BEAM',
      label: 'Tachyon Arc-Lance',
      description: 'Unlocked high-frequency beam weapon that pierces multiple enemy hulls.',
      weaponType: 'TACHYON_BEAM',
    },
  },
  {
    name: 'Singularity Resonance Lattice',
    type: 'SINGULARITY_CORE',
    lore: 'Micro-singularity stabilized within a magnetic stasis scaffold. Harnesses black hole tidal forces.',
    upgradeReward: {
      type: 'WEAPON',
      key: 'VORTEX_CANNON',
      label: 'Singularity Vortex Cannon',
      description: 'Unlocked graviton implosion cannon that crushes targets and draws in space debris.',
      weaponType: 'VORTEX_CANNON',
    },
  },
  {
    name: 'Astral Warp Compass',
    type: 'NAVIGATION_RELIC',
    lore: 'Harmonic subspace lodestone. Reveals ancient hyperlanes and long-forgotten derelict stations.',
    upgradeReward: {
      type: 'PERK',
      key: 'DEEP_RADAR',
      label: 'Subspace Radar Clairvoyance',
      description: 'Mini-map radar detection radius permanently doubled across all sectors.',
    },
  },
  {
    name: 'Hyper-Dense Aether Prism',
    type: 'ENERGY_CATALYST',
    lore: 'Metamaterial crystal that synthesizes solar radiation directly into high-yield ship energy.',
    upgradeReward: {
      type: 'STAT',
      key: 'SOLAR_OVERCHARGE',
      label: 'Stellar Fusion Converter',
      description: 'Passive energy regeneration increased by +40% when operating near stellar bodies.',
    },
  },
  {
    name: 'Aegis Harmonic Keystone',
    type: 'SHIELD_RESONATOR',
    lore: 'Precursor forcefield matrix that reflects kinetic shockwaves away from critical avionics.',
    upgradeReward: {
      type: 'STAT',
      key: 'AEGIS_CAPACITOR',
      label: 'Aegis Overcharge Grid',
      description: 'Maximum Shield capacity increased by +45 with instant recovery after 3 orbits.',
    },
  },
  {
    name: 'Graviton Catalyst Matrix',
    type: 'GRAV_ENGINE',
    lore: 'Condensation of gravity wave potential. Amplifies momentum transfer during planetary flybys.',
    upgradeReward: {
      type: 'PERK',
      key: 'SLINGSHOT_MASTERY',
      label: 'Gravity Well Supercharger',
      description: 'Planetary gravity assists grant +35% bonus velocity and +250 energy recharge.',
    },
  },
];

export function generateSector(seed: number): MapData {
  const rand = createPRNG(seed);

  const width = 6800;
  const height = 6800;
  const worldSize = { width, height };

  const startMargin = 900;
  const playerStart: Vector2D = {
    x: startMargin,
    y: startMargin,
  };

  const extractionGate: ExtractionGate = {
    position: {
      x: width - startMargin,
      y: height - startMargin,
    },
    radius: 70,
    ringAngle: 0,
    pulsePhase: 0,
  };

  // 1. Generate Deep Space Cosmic Nebulae (6-9 vast cosmic dust clouds)
  const nebulaClouds: NebulaCloud[] = [];
  const nebulaCount = 7 + Math.floor(rand() * 3);
  const nebulaPalettes = [
    { primary: 'rgba(56, 189, 248, 0.12)', secondary: 'rgba(147, 51, 234, 0.08)' }, // Cyan / Purple
    { primary: 'rgba(236, 72, 153, 0.10)', secondary: 'rgba(59, 130, 246, 0.08)' }, // Magenta / Blue
    { primary: 'rgba(139, 92, 246, 0.12)', secondary: 'rgba(16, 185, 129, 0.06)' }, // Violet / Emerald
    { primary: 'rgba(245, 158, 11, 0.09)', secondary: 'rgba(239, 68, 68, 0.07)' },  // Amber / Solar Flare
    { primary: 'rgba(6, 182, 212, 0.11)', secondary: 'rgba(99, 102, 241, 0.08)' },  // Teal / Indigo
  ];

  for (let i = 0; i < nebulaCount; i++) {
    const palette = nebulaPalettes[i % nebulaPalettes.length];
    nebulaClouds.push({
      x: 600 + rand() * (width - 1200),
      y: 600 + rand() * (height - 1200),
      radius: 900 + rand() * 1100,
      color: palette.primary,
      secondaryColor: palette.secondary,
      alpha: 0.7 + rand() * 0.3,
      scaleX: 1.0 + rand() * 0.8,
      scaleY: 0.6 + rand() * 0.6,
      rotation: rand() * Math.PI * 2,
    });
  }

  // 2. Generate Mass Nodes / Celestial Bodies (4 to 6)
  const nodeCount = 4 + Math.floor(rand() * 3); // 4, 5, or 6
  const massNodes: MassNode[] = [];

  const planetArchetypes: {
    type: PlanetType;
    color: string;
    secondaryColor: string;
    atmosphereColor: string;
    hasRings: boolean;
  }[] = [
    {
      type: 'GAS_GIANT',
      color: '#38bdf8',
      secondaryColor: '#1e3a8a',
      atmosphereColor: 'rgba(56, 189, 248, 0.35)',
      hasRings: true,
    },
    {
      type: 'TERRESTRIAL',
      color: '#4ade80',
      secondaryColor: '#065f46',
      atmosphereColor: 'rgba(74, 222, 128, 0.35)',
      hasRings: false,
    },
    {
      type: 'LAVA_CORE',
      color: '#fb923c',
      secondaryColor: '#991b1b',
      atmosphereColor: 'rgba(249, 115, 22, 0.4)',
      hasRings: false,
    },
    {
      type: 'ICE_WORLD',
      color: '#a5f3fc',
      secondaryColor: '#0e7490',
      atmosphereColor: 'rgba(165, 243, 252, 0.38)',
      hasRings: true,
    },
    {
      type: 'PULSAR',
      color: '#c084fc',
      secondaryColor: '#581c87',
      atmosphereColor: 'rgba(192, 132, 252, 0.45)',
      hasRings: true,
    },
  ];

  let attempts = 0;
  let artifactIndex = 0;

  while (massNodes.length < nodeCount && attempts < 200) {
    attempts++;
    const x = 1200 + rand() * (width - 2400);
    const y = 1200 + rand() * (height - 2400);

    // Check distance to player start
    const distToStart = Math.hypot(x - playerStart.x, y - playerStart.y);
    if (distToStart < 1100) continue;

    // Check distance to extraction
    const distToGate = Math.hypot(x - extractionGate.position.x, y - extractionGate.position.y);
    if (distToGate < 900) continue;

    // Check distance to other nodes
    const tooClose = massNodes.some(n => Math.hypot(n.position.x - x, n.position.y - y) < 1400);
    if (tooClose) continue;

    const archetype = planetArchetypes[massNodes.length % planetArchetypes.length];
    // Mass range: 1,400,000 to 2,800,000
    const mass = 1400000 + rand() * 1400000;
    const coreRadius = 42 + (mass / 2800000) * 26; // 42 to 68
    const gravityRadius = 700 + (mass / 2800000) * 350; // 700 to 1050

    // Assign ancient artifact to mass nodes (3 full orbits to synchronize!)
    let artifact: ArtifactOrbitalState | undefined = undefined;
    if (artifactIndex < ARTIFACT_PRESETS.length && archetype.type !== 'PULSAR') {
      const preset = ARTIFACT_PRESETS[artifactIndex++];
      artifact = {
        id: `artifact-${massNodes.length + 1}`,
        name: preset.name,
        type: preset.type,
        lore: preset.lore,
        totalOrbitsRequired: 3,
        accumulatedAngle: 0,
        completedOrbits: 0,
        isCollected: false,
        resonancePercent: 0,
        upgradeReward: preset.upgradeReward,
      };
    }

    const nodeName = PLANET_NAMES[massNodes.length % PLANET_NAMES.length];

    massNodes.push({
      id: `node-${massNodes.length + 1}`,
      name: nodeName,
      position: { x, y },
      mass,
      radius: coreRadius,
      gravityRadius,
      color: archetype.color,
      secondaryColor: archetype.secondaryColor,
      atmosphereColor: archetype.atmosphereColor,
      pulsePhase: rand() * Math.PI * 2,
      planetType: archetype.type,
      hasRings: archetype.hasRings,
      ringRadius: archetype.hasRings ? coreRadius * (1.9 + rand() * 0.5) : undefined,
      ringTilt: archetype.hasRings ? -0.4 + rand() * 0.8 : undefined,
      rotationSpeed: (0.05 + rand() * 0.08) * (rand() > 0.5 ? 1 : -1),
      rotationAngle: rand() * Math.PI * 2,
      featuresSeed: Math.floor(rand() * 10000),
      artifact,
    });
  }

  // 3. Generate Void Pockets (3 to 5)
  const voidCount = 3 + Math.floor(rand() * 3);
  const voidPockets: VoidPocket[] = [];
  attempts = 0;

  while (voidPockets.length < voidCount && attempts < 200) {
    attempts++;
    const x = 1000 + rand() * (width - 2000);
    const y = 1000 + rand() * (height - 2000);

    if (Math.hypot(x - playerStart.x, y - playerStart.y) < 1200) continue;
    if (Math.hypot(x - extractionGate.position.x, y - extractionGate.position.y) < 900) continue;
    
    const overlapNode = massNodes.some(n => Math.hypot(n.position.x - x, n.position.y - y) < n.radius + 150);
    if (overlapNode) continue;

    const radius = 260 + rand() * 160;

    voidPockets.push({
      id: `void-${voidPockets.length + 1}`,
      position: { x, y },
      radius,
      distortionStrength: 0.65 + rand() * 0.1,
      phase: rand() * Math.PI * 2,
    });
  }

  // 4. Generate Energy Shards (18-26 Standard, 5-8 Rich)
  const shards: EnergyShard[] = [];
  let shardIdCounter = 1;

  // Orbiting shards around mass nodes
  massNodes.forEach(node => {
    const orbitCount = 2 + Math.floor(rand() * 2);
    for (let i = 0; i < orbitCount; i++) {
      const orbitRadius = node.radius + 120 + rand() * (node.gravityRadius * 0.5 - 120);
      const angle = rand() * Math.PI * 2;
      const speed = (0.2 + rand() * 0.3) * (rand() > 0.5 ? 1 : -1);
      
      shards.push({
        id: `shard-${shardIdCounter++}`,
        position: {
          x: node.position.x + Math.cos(angle) * orbitRadius,
          y: node.position.y + Math.sin(angle) * orbitRadius,
        },
        basePosition: { ...node.position },
        type: 'STANDARD',
        energyValue: 10,
        scoreValue: 50,
        radius: 9,
        orbitCenter: { ...node.position },
        orbitRadius,
        orbitSpeed: speed,
        orbitAngle: angle,
        collected: false,
        pulsePhase: rand() * Math.PI * 2,
      });
    }

    // 1 Rich shard in tight high-gravity orbit
    const richOrbitRadius = node.radius + 55 + rand() * 65;
    const richAngle = rand() * Math.PI * 2;
    shards.push({
      id: `shard-${shardIdCounter++}`,
      position: {
        x: node.position.x + Math.cos(richAngle) * richOrbitRadius,
        y: node.position.y + Math.sin(richAngle) * richOrbitRadius,
      },
      basePosition: { ...node.position },
      type: 'RICH',
      energyValue: 30,
      scoreValue: 150,
      radius: 14,
      orbitCenter: { ...node.position },
      orbitRadius: richOrbitRadius,
      orbitSpeed: 0.45 * (rand() > 0.5 ? 1 : -1),
      orbitAngle: richAngle,
      collected: false,
      pulsePhase: rand() * Math.PI * 2,
    });
  });

  // Free drifting Standard shards
  const freeStandardCount = 14 + Math.floor(rand() * 8);
  for (let i = 0; i < freeStandardCount; i++) {
    const x = 800 + rand() * (width - 1600);
    const y = 800 + rand() * (height - 1600);

    shards.push({
      id: `shard-${shardIdCounter++}`,
      position: { x, y },
      basePosition: { x, y },
      type: 'STANDARD',
      energyValue: 10,
      scoreValue: 50,
      radius: 9,
      collected: false,
      pulsePhase: rand() * Math.PI * 2,
    });
  }

  // Free Rich shards in void pocket proximity
  voidPockets.forEach(vp => {
    const offsetDist = vp.radius * (0.3 + rand() * 0.5);
    const angle = rand() * Math.PI * 2;
    shards.push({
      id: `shard-${shardIdCounter++}`,
      position: {
        x: vp.position.x + Math.cos(angle) * offsetDist,
        y: vp.position.y + Math.sin(angle) * offsetDist,
      },
      basePosition: {
        x: vp.position.x + Math.cos(angle) * offsetDist,
        y: vp.position.y + Math.sin(angle) * offsetDist,
      },
      type: 'RICH',
      energyValue: 30,
      scoreValue: 150,
      radius: 14,
      collected: false,
      pulsePhase: rand() * Math.PI * 2,
    });
  });

  // 5. Generate Ancient Signal
  let signalX = width * 0.75 + (rand() - 0.5) * 800;
  let signalY = height * 0.28 + (rand() - 0.5) * 800;
  if (rand() > 0.5) {
    signalX = width * 0.28 + (rand() - 0.5) * 800;
    signalY = height * 0.75 + (rand() - 0.5) * 800;
  }

  const ancientSignal: AncientSignal = {
    id: 'ancient-signal-1',
    position: { x: signalX, y: signalY },
    scanRadius: 95,
    scanned: false,
    scanDuration: 2.0,
    pulsePhase: 0,
  };

  // 6. Generate Multi-Spectral Parallax Stars (420 stars)
  const starColors = [
    '#ffffff', // White
    '#e0e7ff', // Blue-white hot giant
    '#93c5fd', // Cyan star
    '#fef08a', // Yellow-white star
    '#fed7aa', // Orange star
    '#fbcfe8', // Magenta/pink dwarf
  ];

  const stars: Star[] = [];
  const starCount = 420;
  for (let i = 0; i < starCount; i++) {
    const layer = 1 + Math.floor(rand() * 3);
    const hasSpikes = rand() < 0.06; // 6% bright stars have diffraction spikes
    stars.push({
      x: rand() * width,
      y: rand() * height,
      size: (0.8 + rand() * 1.8) * (hasSpikes ? 1.6 : 1),
      brightness: 0.25 + rand() * 0.75,
      layer,
      color: starColors[Math.floor(rand() * starColors.length)],
      twinkleSpeed: 0.8 + rand() * 2.5,
      twinklePhase: rand() * Math.PI * 2,
      hasSpikes,
    });
  }

  // 7. Generate Hostile Ships (Guarding extraction ship / gate, artifacts, and sector patrol)
  const hostileShips: HostileShip[] = [];
  let enemyCounter = 1;

  // A. Extraction Gate Guardians (2-3 ships protecting extraction gate)
  const gateGuardAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
  gateGuardAngles.forEach((angle, idx) => {
    const dist = 280 + (idx % 2) * 120;
    const gx = extractionGate.position.x + Math.cos(angle) * dist;
    const gy = extractionGate.position.y + Math.sin(angle) * dist;
    const isHeavy = idx === 0;

    hostileShips.push({
      id: `enemy-gate-${enemyCounter++}`,
      name: isHeavy ? 'Gate Heavy Dreadnought' : `Gate Sentry Aegis-${idx + 1}`,
      type: isHeavy ? 'GATE_GUARDIAN' : 'DRONE_SENTRY',
      position: { x: gx, y: gy },
      velocity: { x: 0, y: 0 },
      rotation: angle + Math.PI / 2,
      angularVelocity: 0,
      spawnOrigin: { x: gx, y: gy },
      guardTargetType: 'GATE',
      patrolRadius: dist,
      patrolAngle: angle,
      patrolSpeed: 0.35 * (idx % 2 === 0 ? 1 : -1),
      hull: isHeavy ? 180 : 85,
      maxHull: isHeavy ? 180 : 85,
      shield: isHeavy ? 100 : 50,
      maxShield: isHeavy ? 100 : 50,
      shieldRechargeDelay: 0,
      radius: isHeavy ? 26 : 16,
      state: 'PATROL',
      respawnTimer: 0,
      respawnMaxTime: 60, // 1 minute respawn timer once killed
      warpInTimer: 0,
      weaponType: isHeavy ? 'AREA_MISSILE' : 'PULSE_LASER',
      shootCooldown: 1.0 + rand() * 1.5,
      maxShootCooldown: isHeavy ? 2.2 : 1.2,
      detectionRadius: isHeavy ? 750 : 600,
      attackRange: isHeavy ? 650 : 500,
      color: isHeavy ? '#f87171' : '#fb923c',
      secondaryColor: isHeavy ? '#991b1b' : '#c2410c',
      trail: [],
      scoreValue: isHeavy ? 450 : 250,
    });
  });

  // Ensure weaponType is properly set
  hostileShips[0].weaponType = 'AREA_MISSILE';
  if (hostileShips[1]) hostileShips[1].weaponType = 'HEAT_SEEKER';
  if (hostileShips[2]) hostileShips[2].weaponType = 'PULSE_LASER';

  // B. Artifact Guardians (Planets with ancient relics)
  massNodes.forEach((node, nodeIdx) => {
    if (node.artifact) {
      const artAngle = rand() * Math.PI * 2;
      const artDist = node.radius + 180 + rand() * 90;
      const ax = node.position.x + Math.cos(artAngle) * artDist;
      const ay = node.position.y + Math.sin(artAngle) * artDist;
      const isSniper = nodeIdx % 2 === 1;

      hostileShips.push({
        id: `enemy-artifact-${enemyCounter++}`,
        name: isSniper ? `Sentinel Lance of ${node.name}` : `Relic Guardian Drone`,
        type: isSniper ? 'SNIPER_CORVETTE' : 'DRONE_SENTRY',
        position: { x: ax, y: ay },
        velocity: { x: 0, y: 0 },
        rotation: artAngle,
        angularVelocity: 0,
        spawnOrigin: { x: ax, y: ay },
        guardTargetType: 'ARTIFACT',
        guardTargetId: node.id,
        patrolRadius: artDist,
        patrolAngle: artAngle,
        patrolSpeed: 0.45 * (rand() > 0.5 ? 1 : -1),
        hull: isSniper ? 95 : 75,
        maxHull: isSniper ? 95 : 75,
        shield: isSniper ? 60 : 40,
        maxShield: isSniper ? 60 : 40,
        shieldRechargeDelay: 0,
        radius: isSniper ? 18 : 15,
        state: 'PATROL',
        respawnTimer: 0,
        respawnMaxTime: 60, // 1 minute respawn timer
        warpInTimer: 0,
        weaponType: isSniper ? 'SNIPER' : 'HEAT_SEEKER',
        shootCooldown: 1.5 + rand() * 1.5,
        maxShootCooldown: isSniper ? 2.8 : 1.6,
        detectionRadius: isSniper ? 850 : 650,
        attackRange: isSniper ? 750 : 500,
        color: isSniper ? '#34d399' : '#e879f9',
        secondaryColor: isSniper ? '#065f46' : '#86198f',
        trail: [],
        scoreValue: isSniper ? 350 : 200,
      });
    }
  });

  // C. Sector Roaming Interceptors (2-3 mid-sector patrol ships)
  const patrolCount = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < patrolCount; i++) {
    const px = 1500 + rand() * (width - 3000);
    const py = 1500 + rand() * (height - 3000);
    const pAngle = rand() * Math.PI * 2;
    const pType: EnemyType = i % 2 === 0 ? 'DRONE_SENTRY' : 'HEAVY_CRUISER';
    const isHeavy = pType === 'HEAVY_CRUISER';

    hostileShips.push({
      id: `enemy-patrol-${enemyCounter++}`,
      name: isHeavy ? `Void Marauder Vanguard` : `Corsair Scout Stalker`,
      type: pType,
      position: { x: px, y: py },
      velocity: { x: 0, y: 0 },
      rotation: pAngle,
      angularVelocity: 0,
      spawnOrigin: { x: px, y: py },
      guardTargetType: 'SECTOR_PATROL',
      patrolRadius: 350 + rand() * 250,
      patrolAngle: pAngle,
      patrolSpeed: 0.3 * (rand() > 0.5 ? 1 : -1),
      hull: isHeavy ? 150 : 70,
      maxHull: isHeavy ? 150 : 70,
      shield: isHeavy ? 80 : 40,
      maxShield: isHeavy ? 80 : 40,
      shieldRechargeDelay: 0,
      radius: isHeavy ? 24 : 15,
      state: 'PATROL',
      respawnTimer: 0,
      respawnMaxTime: 60, // 60s respawn timer
      warpInTimer: 0,
      weaponType: isHeavy ? 'AREA_MISSILE' : 'PULSE_LASER',
      shootCooldown: 1.2 + rand() * 1.5,
      maxShootCooldown: isHeavy ? 2.4 : 1.0,
      detectionRadius: 650,
      attackRange: 550,
      color: isHeavy ? '#f43f5e' : '#38bdf8',
      secondaryColor: isHeavy ? '#881337' : '#0369a1',
      trail: [],
      scoreValue: isHeavy ? 400 : 180,
    });
  }

  // D. Multi-Stage Boss Flagship: Apex Dreadnought Chimera-0
  const bossX = width * 0.62 + (rand() - 0.5) * 600;
  const bossY = height * 0.62 + (rand() - 0.5) * 600;
  hostileShips.push({
    id: 'boss-chimera-0',
    name: 'Apex Dreadnought: Chimera-0',
    type: 'DREADNOUGHT_BOSS',
    position: { x: bossX, y: bossY },
    velocity: { x: 0, y: 0 },
    rotation: -Math.PI / 4,
    angularVelocity: 0,
    spawnOrigin: { x: bossX, y: bossY },
    guardTargetType: 'BOSS_ARENA',
    patrolRadius: 360,
    patrolAngle: 0,
    patrolSpeed: 0.16,
    hull: 750,
    maxHull: 750,
    shield: 450,
    maxShield: 450,
    shieldRechargeDelay: 0,
    radius: 48,
    state: 'PATROL',
    respawnTimer: 0,
    respawnMaxTime: 999999, // Boss does not respawn once downed
    warpInTimer: 0,
    weaponType: 'PULSE_LASER',
    shootCooldown: 0.8,
    maxShootCooldown: 0.8,
    detectionRadius: 1350,
    attackRange: 1100,
    color: '#38bdf8',
    secondaryColor: '#0284c7',
    trail: [],
    scoreValue: 5000,
    isBoss: true,
    bossStage: 1,
    maxBossStages: 3,
    bossName: 'APEX DREADNOUGHT: CHIMERA-0',
    barrierDrones: [
      { angle: 0, distance: 82, alive: true, hp: 120, maxHp: 120 },
      { angle: (Math.PI * 2) / 3, distance: 82, alive: true, hp: 120, maxHp: 120 },
      { angle: (Math.PI * 4) / 3, distance: 82, alive: true, hp: 120, maxHp: 120 },
    ],
    tachyonBeamActive: false,
    tachyonBeamAngle: 0,
    tachyonBeamCharge: 0,
    singularityActive: false,
    singularityStrength: 0,
    rammingSpeed: false,
    phaseTransitionTimer: 0,
  });

  // Generate Precursor Derelict Megastructures (Orbital ruins with salvage and lore)
  const derelicts: DerelictStation[] = [
    {
      id: 'derelict-1',
      name: 'Aethelgard Deep Observatory',
      type: 'OBSERVATORY',
      position: { x: 2200 + rand() * 600, y: 1600 + rand() * 600 },
      radius: 48,
      rotation: rand() * Math.PI * 2,
      rotationSpeed: 0.08,
      salvaged: false,
      pulsePhase: rand() * Math.PI * 2,
      lore: 'Ancient sub-space astronomy complex. Contains precursor navigational cartography.',
    },
    {
      id: 'derelict-2',
      name: 'Hyperion Solar Induction Array',
      type: 'SOLAR_ARRAY',
      position: { x: 4400 + rand() * 800, y: 2800 + rand() * 800 },
      radius: 54,
      rotation: rand() * Math.PI * 2,
      rotationSpeed: -0.06,
      salvaged: false,
      pulsePhase: rand() * Math.PI * 2,
      lore: 'Photonic harvesting array that gathered stellar radiation for interstellar transit.',
    },
    {
      id: 'derelict-3',
      name: 'Valence Precursor Habitat Ring',
      type: 'HABITAT_RING',
      position: { x: 2600 + rand() * 1200, y: 4600 + rand() * 800 },
      radius: 64,
      rotation: rand() * Math.PI * 2,
      rotationSpeed: 0.04,
      salvaged: false,
      pulsePhase: rand() * Math.PI * 2,
      lore: 'Shattered centrifugal biosystem ring. Salvaging restores full shield and weapon charges.',
    },
  ];

  // Generate Drifting Crystalline Asteroid Belt
  const asteroids: Asteroid[] = [];
  const asteroidCount = 22;
  for (let a = 0; a < asteroidCount; a++) {
    const ax = 1200 + rand() * (width - 2400);
    const ay = 1200 + rand() * (height - 2400);
    const aRadius = 14 + rand() * 22;

    // Generate irregular polygon vertices
    const vertexCount = 7 + Math.floor(rand() * 4);
    const vertices: { x: number; y: number }[] = [];
    for (let v = 0; v < vertexCount; v++) {
      const vAngle = (v / vertexCount) * Math.PI * 2;
      const vDist = aRadius * (0.75 + rand() * 0.45);
      vertices.push({
        x: Math.cos(vAngle) * vDist,
        y: Math.sin(vAngle) * vDist,
      });
    }

    asteroids.push({
      id: `asteroid-${a + 1}`,
      position: { x: ax, y: ay },
      velocity: {
        x: (rand() - 0.5) * 18,
        y: (rand() - 0.5) * 18,
      },
      radius: aRadius,
      rotation: rand() * Math.PI * 2,
      rotationSpeed: (rand() - 0.5) * 0.4,
      vertices,
      color: rand() > 0.4 ? '#64748b' : '#0284c7', // Slate rock or crystalline cobalt
      health: Math.round(aRadius * 2.5),
      maxHealth: Math.round(aRadius * 2.5),
    });
  }

  return {
    worldSize,
    playerStart,
    extractionGate,
    massNodes,
    shards,
    voidPockets,
    ancientSignal,
    stars,
    nebulaClouds,
    hostileShips,
    projectiles: [],
    derelicts,
    asteroids,
  };
}
