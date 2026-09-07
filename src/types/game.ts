export interface Vector2D {
  x: number;
  y: number;
}

export type GameState = 'MENU' | 'PROLOGUE' | 'HOME_BASE' | 'PLAYING' | 'PAUSED' | 'COMPLETE' | 'FAILED';

export type WeaponType = 'PULSE_LASER' | 'HEAT_SEEKER' | 'AREA_MISSILE' | 'SNIPER' | 'TACHYON_BEAM' | 'VORTEX_CANNON';

export interface WeaponDef {
  type: WeaponType;
  name: string;
  shortName: string;
  description: string;
  energyCost: number;
  cooldown: number; // seconds
  damage: number;
  projectileSpeed: number;
  splashRadius: number; // for AREA_MISSILE or VORTEX_CANNON
  homingStrength: number; // for HEAT_SEEKER
  color: string;
  secondaryColor: string;
  soundMethod: 'playLaserShot' | 'playMissileLaunch' | 'playAreaMissileFire' | 'playRailgunFire' | 'playTachyonBeam' | 'playVortexCannon';
}

export interface Projectile {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  rotation: number;
  type: WeaponType;
  damage: number;
  splashRadius: number;
  homing: boolean;
  targetId: string | null;
  isPlayer: boolean;
  life: number;
  maxLife: number;
  color: string;
  radius: number;
  trail: { x: number; y: number; alpha: number }[];
  piercedTargets?: string[];
  vortexPull?: boolean;
}

export type EnemyType = 'DRONE_SENTRY' | 'GATE_GUARDIAN' | 'SNIPER_CORVETTE' | 'HEAVY_CRUISER' | 'DREADNOUGHT_BOSS';

export interface HostileShip {
  id: string;
  name: string;
  type: EnemyType;
  position: Vector2D;
  velocity: Vector2D;
  rotation: number;
  angularVelocity: number;
  spawnOrigin: Vector2D;
  guardTargetType: 'GATE' | 'ARTIFACT' | 'SECTOR_PATROL' | 'BOSS_ARENA';
  guardTargetId?: string;
  patrolRadius: number;
  patrolAngle: number;
  patrolSpeed: number;
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  shieldRechargeDelay: number;
  radius: number;
  state: 'PATROL' | 'AGGRO' | 'COMBAT' | 'DEAD';
  respawnTimer: number; // 60 seconds respawn timer
  respawnMaxTime: number; // 60
  warpInTimer: number; // 0 to 1
  weaponType: WeaponType;
  shootCooldown: number;
  maxShootCooldown: number;
  detectionRadius: number;
  attackRange: number;
  color: string;
  secondaryColor: string;
  trail: { x: number; y: number; alpha: number; speed: number }[];
  scoreValue: number;
  shieldImpactPulse?: number;
  // Multi-Stage Boss Specifications
  isBoss?: boolean;
  bossStage?: 1 | 2 | 3;
  maxBossStages?: number;
  bossName?: string;
  barrierDrones?: { angle: number; distance: number; alive: boolean; hp: number; maxHp: number }[];
  tachyonBeamAngle?: number;
  tachyonBeamActive?: boolean;
  tachyonBeamCharge?: number;
  singularityActive?: boolean;
  singularityStrength?: number;
  rammingSpeed?: boolean;
  phaseTransitionTimer?: number;
  dormantUntilRelicsCollected?: boolean;
}

export interface Ship {
  position: Vector2D;
  velocity: Vector2D;
  rotation: number; // in radians, 0 pointing right/forward
  angularVelocity: number;
  energy: number;
  maxEnergy: number;
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  shieldRechargeDelay: number;
  shieldImpactPulse?: number;
  selectedWeapon: WeaponType;
  weaponCooldowns: Record<WeaponType, number>;
  isFiring: boolean;
  aimAngle?: number;
  isThrusting: boolean;
  isBraking: boolean;
  isRotatingLeft: boolean;
  isRotatingRight: boolean;
  radius: number;
  trail: { x: number; y: number; alpha: number; speed: number }[];
  inVoidPocket: boolean;
  nearGravityNodeId: string | null;
  scanningSignalId: string | null;
  scanProgress: number; // 0 to 1
  isSolarCharging?: boolean;
  isOutOfBounds?: boolean;
  outOfBoundsDistance?: number;
}

export type PlanetType = 'TERRESTRIAL' | 'GAS_GIANT' | 'ICE_WORLD' | 'LAVA_CORE' | 'PULSAR';

export interface ArtifactOrbitalState {
  id: string;
  name: string;
  type: string;
  lore: string;
  totalOrbitsRequired: number; // 3
  accumulatedAngle: number; // in radians (3 * 2PI = 18.849 rads)
  completedOrbits: number; // 0, 1, 2, 3
  isCollected: boolean;
  resonancePercent: number; // 0 to 1
  lastShipAngle?: number;
  unlockedAt?: number;
  dissolveProgress?: number; // 0 to 1 for transcendence / absorption into ship
  isDissolved?: boolean; // true once absorbed, leaving orbital path clear
  weaponUnlock?: WeaponType;
  upgradeReward?: {
    type: 'WEAPON' | 'PERK' | 'STAT';
    key: string;
    label: string;
    description: string;
    weaponType?: WeaponType;
  };
}

export interface DerelictStation {
  id: string;
  name: string;
  position: Vector2D;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  salvaged: boolean;
  pulsePhase: number;
  type: 'OBSERVATORY' | 'SOLAR_ARRAY' | 'HABITAT_RING';
  lore: string;
}

export interface Asteroid {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  vertices: { x: number; y: number }[];
  color: string;
  health: number;
  maxHealth: number;
}

export interface MassNode {
  id: string;
  name: string;
  position: Vector2D;
  mass: number;
  radius: number;
  gravityRadius: number;
  color: string;
  secondaryColor: string;
  atmosphereColor: string;
  pulsePhase: number;
  planetType: PlanetType;
  hasRings: boolean;
  ringRadius?: number;
  ringTilt?: number;
  rotationSpeed: number;
  rotationAngle: number;
  featuresSeed: number;
  artifact?: ArtifactOrbitalState;
}

export type ShardType = 'STANDARD' | 'RICH';

export interface EnergyShard {
  id: string;
  position: Vector2D;
  basePosition: Vector2D;
  type: ShardType;
  energyValue: number;
  scoreValue: number;
  radius: number;
  orbitCenter?: Vector2D;
  orbitRadius?: number;
  orbitSpeed?: number;
  orbitAngle?: number;
  collected: boolean;
  pulsePhase: number;
}

export interface VoidPocket {
  id: string;
  position: Vector2D;
  radius: number;
  distortionStrength: number;
  phase: number;
}

export interface AncientSignal {
  id: string;
  position: Vector2D;
  scanRadius: number;
  scanned: boolean;
  scanDuration: number; // in seconds, e.g. 2.0
  pulsePhase: number;
}

export interface ExtractionGate {
  position: Vector2D;
  radius: number;
  ringAngle: number;
  pulsePhase: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  layer: number; // 1 (far) to 3 (near)
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
  hasSpikes?: boolean;
}

export interface NebulaCloud {
  x: number;
  y: number;
  radius: number;
  color: string;
  secondaryColor: string;
  alpha: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  shape?: 'circle' | 'spark' | 'ring';
}

export interface GravityAssistEvent {
  nodeId: string;
  entrySpeed: number;
  minDistance: number;
  entryTime: number;
  active: boolean;
}

export interface ExpeditionStats {
  seed: number;
  timeElapsed: number; // in seconds
  energySpent: number;
  energyCollected: number;
  standardShardsCollected: number;
  richShardsCollected: number;
  gravityAssists: number;
  signalScanned: boolean;
  artifactsCollected: number;
  totalArtifacts: number;
  hostilesDestroyed: number;
  shotsFired: number;
  damageDealt: number;
  shieldDamageAbsorbed: number;
  damageTaken: number;
  distanceTraveled: number;
  maxSpeed: number;
  flowMultiplier: number;
  maxFlowMultiplier: number;
  finalScore: number;
  rating: string;
  efficiencyPercent: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  debugMode: boolean;
  showGravityRings: boolean;
  showTrajectory: boolean;
  showMiniMap: boolean;
  miniMapMode: 'SECTOR' | 'LOCAL' | 'EXPANDED';
  touchControls: boolean;
}

export const WEAPON_DEFINITIONS: Record<WeaponType, WeaponDef> = {
  PULSE_LASER: {
    type: 'PULSE_LASER',
    name: 'Plasma Repeater',
    shortName: 'PULSE',
    description: 'High-cadence energy bolts for direct dogfighting.',
    energyCost: 2.2,
    cooldown: 0.14,
    damage: 22,
    projectileSpeed: 950,
    splashRadius: 0,
    homingStrength: 0,
    color: '#38bdf8', // Sky 400
    secondaryColor: '#0284c7',
    soundMethod: 'playLaserShot',
  },
  HEAT_SEEKER: {
    type: 'HEAT_SEEKER',
    name: 'Swarm Seeker Missile',
    shortName: 'SEEKER',
    description: 'Smart micro-missile that locks and steers into nearest hostiles.',
    energyCost: 8.5,
    cooldown: 0.55,
    damage: 48,
    projectileSpeed: 620,
    splashRadius: 28,
    homingStrength: 6.5,
    color: '#fbbf24', // Amber 400
    secondaryColor: '#f97316',
    soundMethod: 'playMissileLaunch',
  },
  AREA_MISSILE: {
    type: 'AREA_MISSILE',
    name: 'EMP Flak Warhead',
    shortName: 'FLAK AoE',
    description: 'Heavy explosive shell with expanding EMP shockwave for clearing clusters.',
    energyCost: 12.0,
    cooldown: 0.90,
    damage: 32, // Direct/splash damage
    projectileSpeed: 480,
    splashRadius: 125, // Large AoE
    homingStrength: 0,
    color: '#c084fc', // Purple 400
    secondaryColor: '#a855f7',
    soundMethod: 'playAreaMissileFire',
  },
  SNIPER: {
    type: 'SNIPER',
    name: 'Kinetic Railgun Lance',
    shortName: 'SNIPER',
    description: 'Supersonic armor-piercing slug with pinpoint accuracy & extreme range.',
    energyCost: 18.0,
    cooldown: 1.35,
    damage: 115,
    projectileSpeed: 2100,
    splashRadius: 0,
    homingStrength: 0,
    color: '#34d399', // Emerald 400
    secondaryColor: '#059669',
    soundMethod: 'playRailgunFire',
  },
  TACHYON_BEAM: {
    type: 'TACHYON_BEAM',
    name: 'Tachyon Arc-Lance',
    shortName: 'TACHYON',
    description: 'Hyper-velocity continuous energy beam that pierces through multiple shields and hull structures.',
    energyCost: 14.0,
    cooldown: 0.45,
    damage: 64,
    projectileSpeed: 2600,
    splashRadius: 0,
    homingStrength: 0,
    color: '#e879f9', // Fuchsia 400
    secondaryColor: '#c026d3',
    soundMethod: 'playTachyonBeam',
  },
  VORTEX_CANNON: {
    type: 'VORTEX_CANNON',
    name: 'Singularity Vortex Cannon',
    shortName: 'VORTEX',
    description: 'Unleashes a micro-gravitational singularity warhead that pulls surrounding debris and hostiles inward before imploding.',
    energyCost: 24.0,
    cooldown: 1.8,
    damage: 95,
    projectileSpeed: 420,
    splashRadius: 180,
    homingStrength: 0,
    color: '#818cf8', // Indigo 400
    secondaryColor: '#4f46e5',
    soundMethod: 'playVortexCannon',
  },
};

export interface UpgradeBuildingItem {
  id: string;
  name: string;
  description: string;
  currentLevel: number;
  maxLevel: number;
  cost: number;
  statBonusText: string;
}

export interface PlayerProfile {
  shards: number;
  relicsFound: string[];
  relicsLoreUnlocked: string[];
  upgrades: {
    hullLevel: number; // 0 to 5 (+15 HP per level)
    thrusterLevel: number; // 0 to 5 (+12% acceleration & max speed per level)
    solarLevel: number; // 0 to 5 (+25% solar energy regen & ambient trickle)
    shieldCapLevel: number; // 0 to 5 (+15 Shield capacity per level)
    shieldRegenLevel: number; // 0 to 5 (-1s recharge delay & faster regen)
    weaponOverclockLevel: number; // 0 to 5 (+15% weapon damage & -10% energy cost)
  };
  unlockedWeapons: WeaponType[];
  equippedWeapon: WeaponType;
  unlockedPerks: string[];
  bossDefeated: boolean;
  prologueSeen: boolean;
  expeditionsCount: number;
}

const STORAGE_KEY_PROFILE = 'THE_DRIFT_PLAYER_PROFILE_V2';

export function getDefaultPlayerProfile(): PlayerProfile {
  return {
    shards: 350, // Starting shard reserves for immediate station upgrades
    relicsFound: [],
    relicsLoreUnlocked: [],
    upgrades: {
      hullLevel: 0,
      thrusterLevel: 0,
      solarLevel: 0,
      shieldCapLevel: 0,
      shieldRegenLevel: 0,
      weaponOverclockLevel: 0,
    },
    unlockedWeapons: ['PULSE_LASER', 'HEAT_SEEKER'],
    equippedWeapon: 'PULSE_LASER',
    unlockedPerks: [],
    bossDefeated: false,
    prologueSeen: false,
    expeditionsCount: 0,
  };
}

export function loadPlayerProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) return getDefaultPlayerProfile();
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultPlayerProfile(),
      ...parsed,
      upgrades: {
        ...getDefaultPlayerProfile().upgrades,
        ...(parsed.upgrades || {}),
      },
    };
  } catch {
    return getDefaultPlayerProfile();
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch {
    // ignore
  }
}
