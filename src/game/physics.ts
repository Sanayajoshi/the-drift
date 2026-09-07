import {
  Ship,
  MassNode,
  VoidPocket,
  EnergyShard,
  AncientSignal,
  ExtractionGate,
  Particle,
  ExpeditionStats,
  HostileShip,
  Projectile,
  WEAPON_DEFINITIONS,
  WeaponType,
  DerelictStation,
  Asteroid,
  ArtifactOrbitalState,
} from '../types/game';
import { soundManager } from '../audio/soundManager';

export const PHYSICS_CONFIG = {
  G: 0.85,
  MIN_GRAV_DISTANCE_SQ: 2800, // r_min squared to prevent infinite singularity force
  MAX_GRAV_ACCEL: 300,
  MAX_VELOCITY: 550,
  FORWARD_ACCEL: 270,
  REVERSE_ACCEL: 260, // Robust retrograde braking
  ROTATION_SPEED: 2.6, // radians/sec (~150 deg/sec) - balanced, deliberate spacecraft turn rate
  LINEAR_DRAG: 0.008, // subtle cosmic drift
  ANGULAR_DRAG: 0.12,
  BASE_ENERGY_DRAIN_THRUST: 7.5, // per sec (~13.3s of active burn)
  BASE_ENERGY_DRAIN_BRAKE: 6.0, // per sec
  SCAN_ENERGY_DRAIN: 5.0, // per sec
  COLLISION_DAMAGE_CORE: 24,
  BOUNCE_RESTITUTION: 0.75,
  SHIELD_RECHARGE_RATE: 0.35, // Barely perceptible emergency nanite trickle (takes ~5 minutes to restore 100 shield)
  SHIELD_RECHARGE_DELAY: 8.0, // 8.0s post-hit delay: shields do not regenerate during combat/hazards
};

export interface PhysicsStepResult {
  shipDestroyed: boolean;
  gateReached: boolean;
  shardsCollected: EnergyShard[];
  gravityAssistTriggered: boolean;
  signalCompleted: boolean;
  damageInflicted: number;
  screenShake: number;
  hostileKilled?: HostileShip;
  hostileShipDestroyed?: HostileShip;
  boundaryBreached?: boolean;
  derelictSalvaged?: DerelictStation;
  artifactCompleted?: ArtifactOrbitalState;
  bossDefeated?: boolean;
  bossStageChange?: { stage: number; name: string };
}

export function updatePhysics(
  ship: Ship,
  massNodes: MassNode[],
  voidPockets: VoidPocket[],
  shards: EnergyShard[],
  ancientSignal: AncientSignal,
  extractionGate: ExtractionGate,
  hostileShips: HostileShip[],
  projectiles: Projectile[],
  stats: ExpeditionStats,
  dt: number, // clamped delta time
  particles: Particle[],
  activeGravityAssists: Map<string, { entrySpeed: number; minDistance: number; angleEntered: number }>,
  worldSize?: { width: number; height: number },
  derelicts?: DerelictStation[],
  asteroids?: Asteroid[]
): PhysicsStepResult {
  const result: PhysicsStepResult = {
    shipDestroyed: false,
    gateReached: false,
    shardsCollected: [],
    gravityAssistTriggered: false,
    signalCompleted: false,
    damageInflicted: 0,
    screenShake: 0,
  };

  // 1. Angular motion (Refined spacecraft turn rate & RCS torque damping)
  let targetAngularVel = 0;
  if (ship.isRotatingLeft) targetAngularVel -= PHYSICS_CONFIG.ROTATION_SPEED;
  if (ship.isRotatingRight) targetAngularVel += PHYSICS_CONFIG.ROTATION_SPEED;

  const angularResponse = targetAngularVel === 0 ? 22 : 14;
  ship.angularVelocity += (targetAngularVel - ship.angularVelocity) * (1 - Math.exp(-angularResponse * dt));
  ship.rotation += ship.angularVelocity * dt;

  // Keep rotation within [-PI, PI]
  while (ship.rotation > Math.PI) ship.rotation -= Math.PI * 2;
  while (ship.rotation < -Math.PI) ship.rotation += Math.PI * 2;

  const facingX = Math.cos(ship.rotation);
  const facingY = Math.sin(ship.rotation);

  // Rotational RCS thruster particle bursts
  if (ship.isRotatingLeft && Math.random() < 0.45) {
    const rTipX = ship.position.x - facingX * (ship.radius * 0.7) - facingY * (ship.radius * 0.8);
    const rTipY = ship.position.y - facingY * (ship.radius * 0.7) + facingX * (ship.radius * 0.8);
    particles.push({
      x: rTipX,
      y: rTipY,
      vx: facingY * 65 + (Math.random() - 0.5) * 20,
      vy: -facingX * 65 + (Math.random() - 0.5) * 20,
      color: '#38bdf8',
      size: 1.5,
      life: 0,
      maxLife: 0.16,
      alpha: 0.7,
    });
  }
  if (ship.isRotatingRight && Math.random() < 0.45) {
    const lTipX = ship.position.x - facingX * (ship.radius * 0.7) + facingY * (ship.radius * 0.8);
    const lTipY = ship.position.y - facingY * (ship.radius * 0.7) - facingX * (ship.radius * 0.8);
    particles.push({
      x: lTipX,
      y: lTipY,
      vx: -facingY * 65 + (Math.random() - 0.5) * 20,
      vy: facingX * 65 + (Math.random() - 0.5) * 20,
      color: '#38bdf8',
      size: 1.5,
      life: 0,
      maxLife: 0.16,
      alpha: 0.7,
    });
  }

  // 2. Check if inside Void Pocket
  let inVoid = false;
  let voidThrustModifier = 1.0;
  let voidEnergyModifier = 1.0;

  for (const vp of voidPockets) {
    const dist = Math.hypot(ship.position.x - vp.position.x, ship.position.y - vp.position.y);
    if (dist < vp.radius) {
      inVoid = true;
      voidThrustModifier = 0.65;
      voidEnergyModifier = 1.5;

      const angle = Math.atan2(ship.position.y - vp.position.y, ship.position.x - vp.position.x);
      const perpAngle = angle + Math.PI / 2;
      ship.velocity.x += Math.cos(perpAngle) * 12 * dt;
      ship.velocity.y += Math.sin(perpAngle) * 12 * dt;
      break;
    }
  }
  ship.inVoidPocket = inVoid;

  // 3. Thrust & Braking Acceleration
  let forwardAx = 0;
  let forwardAy = 0;
  const currentSpeed = Math.hypot(ship.velocity.x, ship.velocity.y);

  if (ship.isThrusting && ship.energy > 0) {
    const thrustPower = PHYSICS_CONFIG.FORWARD_ACCEL * voidThrustModifier;
    forwardAx += facingX * thrustPower;
    forwardAy += facingY * thrustPower;

    if (currentSpeed > 15) {
      const dot = ship.velocity.x * facingX + ship.velocity.y * facingY;
      const perpVx = ship.velocity.x - facingX * dot;
      const perpVy = ship.velocity.y - facingY * dot;
      ship.velocity.x -= perpVx * (1 - Math.exp(-0.85 * dt));
      ship.velocity.y -= perpVy * (1 - Math.exp(-0.85 * dt));
    }

    const drain = PHYSICS_CONFIG.BASE_ENERGY_DRAIN_THRUST * voidEnergyModifier * dt;
    ship.energy = Math.max(0, ship.energy - drain);
    stats.energySpent += drain;

    // Dynamic High-Performance Thruster Particle Emission (Scales with Acceleration and Velocity)
    const speedRatio = Math.min(2.4, 1.0 + currentSpeed / 160);
    const particleCount = currentSpeed > 180 ? 3 : (Math.random() < 0.9 ? 2 : 1);

    for (let p = 0; p < particleCount; p++) {
      const spread = (Math.random() - 0.5) * (0.28 / speedRatio);
      const exhaustSpeed = (160 + Math.random() * 120) * (0.8 + speedRatio * 0.4);
      const isCoreSpark = p === 0 && Math.random() < 0.6;

      particles.push({
        x: ship.position.x - facingX * (ship.radius + 2) + (Math.random() - 0.5) * 3,
        y: ship.position.y - facingY * (ship.radius + 2) + (Math.random() - 0.5) * 3,
        vx: -facingX * exhaustSpeed + Math.sin(ship.rotation) * spread * 75 + ship.velocity.x * 0.25,
        vy: -facingY * exhaustSpeed - Math.cos(ship.rotation) * spread * 75 + ship.velocity.y * 0.25,
        color: inVoid
          ? (isCoreSpark ? '#f3e8ff' : '#c084fc')
          : (isCoreSpark ? '#ffffff' : (Math.random() > 0.35 ? '#38bdf8' : '#67e8f9')),
        size: isCoreSpark ? 3.0 + Math.random() * 2.0 : 1.8 + Math.random() * 2.2,
        life: 0,
        maxLife: (0.22 + Math.random() * 0.2) * (0.7 + speedRatio * 0.3),
        alpha: isCoreSpark ? 1.0 : 0.85,
        shape: isCoreSpark ? 'spark' : 'circle',
      });
    }

    // Twin auxiliary maneuvering nacelle vector flares
    if (Math.random() < 0.6) {
      const perpX = -Math.sin(ship.rotation);
      const perpY = Math.cos(ship.rotation);
      const side = Math.random() > 0.5 ? 1 : -1;
      const nacelleX = ship.position.x - facingX * (ship.radius * 0.5) + perpX * (ship.radius * 0.6 * side);
      const nacelleY = ship.position.y - facingY * (ship.radius * 0.5) + perpY * (ship.radius * 0.6 * side);

      particles.push({
        x: nacelleX,
        y: nacelleY,
        vx: -facingX * (110 + Math.random() * 60) + perpX * side * 20 + ship.velocity.x * 0.2,
        vy: -facingY * (110 + Math.random() * 60) + perpY * side * 20 + ship.velocity.y * 0.2,
        color: inVoid ? '#e9d5ff' : '#bae6fd',
        size: 1.5 + Math.random() * 1.5,
        life: 0,
        maxLife: 0.18 + Math.random() * 0.12,
        alpha: 0.75,
      });
    }
  }

  if (ship.isBraking && ship.energy > 0) {
    const brakePower = PHYSICS_CONFIG.REVERSE_ACCEL * voidThrustModifier;

    if (currentSpeed > 8) {
      const retroNormX = -ship.velocity.x / currentSpeed;
      const retroNormY = -ship.velocity.y / currentSpeed;
      forwardAx += retroNormX * brakePower;
      forwardAy += retroNormY * brakePower;

      if (Math.random() < 0.55) {
        particles.push({
          x: ship.position.x - retroNormX * (ship.radius * 0.7),
          y: ship.position.y - retroNormY * (ship.radius * 0.7),
          vx: -retroNormX * 60 + (Math.random() - 0.5) * 35,
          vy: -retroNormY * 60 + (Math.random() - 0.5) * 35,
          color: '#f87171',
          size: 1.8 + Math.random() * 1.5,
          life: 0,
          maxLife: 0.16,
          alpha: 0.8,
        });
      }
    } else {
      forwardAx -= facingX * (brakePower * 0.5);
      forwardAy -= facingY * (brakePower * 0.5);
    }

    const drain = PHYSICS_CONFIG.BASE_ENERGY_DRAIN_BRAKE * voidEnergyModifier * dt;
    ship.energy = Math.max(0, ship.energy - drain);
    stats.energySpent += drain;
  }

  // Passive Solar-Kinetic Fuel Recovery (Rebalanced for meaningful energy conservation)
  let passiveRegenRate = inVoid ? 0.15 : 0.85; // Lowered from 2.4/0.6: prevents instant free recharge
  if (ship.nearGravityNodeId) passiveRegenRate += 0.75; // Proximity slingshot solar collection bonus (total ~1.6/s)

  if (!ship.isThrusting && !ship.isBraking) {
    ship.isSolarCharging = ship.energy < ship.maxEnergy;
    if (ship.energy < ship.maxEnergy) {
      const solarRegen = passiveRegenRate * dt;
      const oldEnergy = ship.energy;
      ship.energy = Math.min(ship.maxEnergy, ship.energy + solarRegen);
      stats.energyCollected += ship.energy - oldEnergy;
    }
  } else {
    ship.isSolarCharging = false;
  }

  // 4. Shield Recharge & Impact Decay (Player)
  if (ship.shieldImpactPulse && ship.shieldImpactPulse > 0) {
    ship.shieldImpactPulse = Math.max(0, ship.shieldImpactPulse - dt * 3.5);
  }
  if (ship.shieldRechargeDelay > 0) {
    ship.shieldRechargeDelay = Math.max(0, ship.shieldRechargeDelay - dt);
  } else if (ship.shield < ship.maxShield) {
    const prevShield = ship.shield;
    ship.shield = Math.min(ship.maxShield, ship.shield + PHYSICS_CONFIG.SHIELD_RECHARGE_RATE * dt);
    if (prevShield < ship.maxShield && ship.shield >= ship.maxShield) {
      soundManager.playShieldRecharged();
    }
  }

  // 5. Player Weapon Cooldowns & Firing System
  const weaponKeys: WeaponType[] = ['PULSE_LASER', 'HEAT_SEEKER', 'AREA_MISSILE', 'SNIPER'];
  for (const w of weaponKeys) {
    if (ship.weaponCooldowns[w] > 0) {
      ship.weaponCooldowns[w] = Math.max(0, ship.weaponCooldowns[w] - dt);
    }
  }

  if (ship.isFiring) {
    const selectedDef = WEAPON_DEFINITIONS[ship.selectedWeapon];
    if (ship.weaponCooldowns[ship.selectedWeapon] <= 0 && ship.energy >= selectedDef.energyCost) {
      // Consume energy
      ship.energy -= selectedDef.energyCost;
      stats.energySpent += selectedDef.energyCost;
      stats.shotsFired++;
      ship.weaponCooldowns[ship.selectedWeapon] = selectedDef.cooldown;

      // Determine firing aim angle (aimAngle if provided or ship rotation)
      const fireAngle = ship.aimAngle !== undefined ? ship.aimAngle : ship.rotation;
      const pFacingX = Math.cos(fireAngle);
      const pFacingY = Math.sin(fireAngle);

      // Play sound
      soundManager[selectedDef.soundMethod]();

      if (ship.selectedWeapon === 'PULSE_LASER') {
        // Dual laser bolts
        const perpX = -Math.sin(fireAngle) * 7;
        const perpY = Math.cos(fireAngle) * 7;
        const pSpeed = selectedDef.projectileSpeed;

        [-1, 1].forEach((side, i) => {
          projectiles.push({
            id: `proj-${Date.now()}-${Math.random()}`,
            position: {
              x: ship.position.x + pFacingX * (ship.radius + 6) + perpX * side,
              y: ship.position.y + pFacingY * (ship.radius + 6) + perpY * side,
            },
            velocity: {
              x: pFacingX * pSpeed + ship.velocity.x * 0.4,
              y: pFacingY * pSpeed + ship.velocity.y * 0.4,
            },
            rotation: fireAngle,
            type: 'PULSE_LASER',
            damage: selectedDef.damage,
            splashRadius: 0,
            homing: false,
            targetId: null,
            isPlayer: true,
            life: 0,
            maxLife: 1.1,
            color: selectedDef.color,
            radius: 3.5,
            trail: [],
          });
        });
      } else if (ship.selectedWeapon === 'HEAT_SEEKER') {
        // Find nearest hostile ship within lock radius (1400)
        let nearestEnemyId: string | null = null;
        let minDist = 1400;
        for (const enemy of hostileShips) {
          if (enemy.state === 'DEAD') continue;
          const d = Math.hypot(enemy.position.x - ship.position.x, enemy.position.y - ship.position.y);
          if (d < minDist) {
            minDist = d;
            nearestEnemyId = enemy.id;
          }
        }

        const pSpeed = selectedDef.projectileSpeed;
        projectiles.push({
          id: `proj-${Date.now()}-${Math.random()}`,
          position: {
            x: ship.position.x + pFacingX * (ship.radius + 8),
            y: ship.position.y + pFacingY * (ship.radius + 8),
          },
          velocity: {
            x: pFacingX * pSpeed + ship.velocity.x * 0.3,
            y: pFacingY * pSpeed + ship.velocity.y * 0.3,
          },
          rotation: fireAngle,
          type: 'HEAT_SEEKER',
          damage: selectedDef.damage,
          splashRadius: selectedDef.splashRadius,
          homing: true,
          targetId: nearestEnemyId,
          isPlayer: true,
          life: 0,
          maxLife: 2.8,
          color: selectedDef.color,
          radius: 5,
          trail: [],
        });
      } else if (ship.selectedWeapon === 'AREA_MISSILE') {
        const pSpeed = selectedDef.projectileSpeed;
        projectiles.push({
          id: `proj-${Date.now()}-${Math.random()}`,
          position: {
            x: ship.position.x + pFacingX * (ship.radius + 8),
            y: ship.position.y + pFacingY * (ship.radius + 8),
          },
          velocity: {
            x: pFacingX * pSpeed + ship.velocity.x * 0.2,
            y: pFacingY * pSpeed + ship.velocity.y * 0.2,
          },
          rotation: fireAngle,
          type: 'AREA_MISSILE',
          damage: selectedDef.damage,
          splashRadius: selectedDef.splashRadius,
          homing: false,
          targetId: null,
          isPlayer: true,
          life: 0,
          maxLife: 2.2,
          color: selectedDef.color,
          radius: 8,
          trail: [],
        });
      } else if (ship.selectedWeapon === 'SNIPER') {
        const pSpeed = selectedDef.projectileSpeed;
        result.screenShake = 6;
        // Recoil pushback
        ship.velocity.x -= pFacingX * 45;
        ship.velocity.y -= pFacingY * 45;

        projectiles.push({
          id: `proj-${Date.now()}-${Math.random()}`,
          position: {
            x: ship.position.x + pFacingX * (ship.radius + 12),
            y: ship.position.y + pFacingY * (ship.radius + 12),
          },
          velocity: {
            x: pFacingX * pSpeed,
            y: pFacingY * pSpeed,
          },
          rotation: fireAngle,
          type: 'SNIPER',
          damage: selectedDef.damage,
          splashRadius: 0,
          homing: false,
          targetId: null,
          isPlayer: true,
          life: 0,
          maxLife: 1.2,
          color: selectedDef.color,
          radius: 4,
          trail: [],
          piercedTargets: [],
        });

        // Flash muzzle beam particles
        for (let p = 0; p < 12; p++) {
          particles.push({
            x: ship.position.x + pFacingX * (ship.radius + 10),
            y: ship.position.y + pFacingY * (ship.radius + 10),
            vx: pFacingX * 300 + (Math.random() - 0.5) * 80,
            vy: pFacingY * 300 + (Math.random() - 0.5) * 80,
            color: '#34d399',
            size: 2.5,
            life: 0,
            maxLife: 0.2,
            alpha: 1.0,
          });
        }
      } else if (ship.selectedWeapon === 'TACHYON_BEAM') {
        const pSpeed = selectedDef.projectileSpeed;
        result.screenShake = 4;
        soundManager.playTachyonBeam();

        projectiles.push({
          id: `proj-${Date.now()}-${Math.random()}`,
          position: {
            x: ship.position.x + pFacingX * (ship.radius + 14),
            y: ship.position.y + pFacingY * (ship.radius + 14),
          },
          velocity: {
            x: pFacingX * pSpeed,
            y: pFacingY * pSpeed,
          },
          rotation: fireAngle,
          type: 'TACHYON_BEAM',
          damage: selectedDef.damage,
          splashRadius: 0,
          homing: false,
          targetId: null,
          isPlayer: true,
          life: 0,
          maxLife: 0.85,
          color: selectedDef.color,
          radius: 4.5,
          trail: [],
          piercedTargets: [],
        });

        // Ionized beam streak particles
        for (let p = 0; p < 14; p++) {
          particles.push({
            x: ship.position.x + pFacingX * (ship.radius + 10),
            y: ship.position.y + pFacingY * (ship.radius + 10),
            vx: pFacingX * 400 + (Math.random() - 0.5) * 60,
            vy: pFacingY * 400 + (Math.random() - 0.5) * 60,
            color: '#e879f9',
            size: 3,
            life: 0,
            maxLife: 0.22,
            alpha: 1.0,
          });
        }
      } else if (ship.selectedWeapon === 'VORTEX_CANNON') {
        const pSpeed = selectedDef.projectileSpeed;
        result.screenShake = 8;
        soundManager.playVortexCannon();

        // Heavy recoil pushback
        ship.velocity.x -= pFacingX * 65;
        ship.velocity.y -= pFacingY * 65;

        projectiles.push({
          id: `proj-${Date.now()}-${Math.random()}`,
          position: {
            x: ship.position.x + pFacingX * (ship.radius + 16),
            y: ship.position.y + pFacingY * (ship.radius + 16),
          },
          velocity: {
            x: pFacingX * pSpeed + ship.velocity.x * 0.25,
            y: pFacingY * pSpeed + ship.velocity.y * 0.25,
          },
          rotation: fireAngle,
          type: 'VORTEX_CANNON',
          damage: selectedDef.damage,
          splashRadius: selectedDef.splashRadius,
          homing: false,
          targetId: null,
          isPlayer: true,
          life: 0,
          maxLife: 1.8,
          color: selectedDef.color,
          radius: 8.5,
          trail: [],
          vortexPull: true,
        });

        // Gravity vortex discharge particles
        for (let p = 0; p < 18; p++) {
          const pa = Math.random() * Math.PI * 2;
          particles.push({
            x: ship.position.x + pFacingX * (ship.radius + 12),
            y: ship.position.y + pFacingY * (ship.radius + 12),
            vx: Math.cos(pa) * 120,
            vy: Math.sin(pa) * 120,
            color: '#818cf8',
            size: 3.5,
            life: 0,
            maxLife: 0.35,
            alpha: 1.0,
          });
        }
      }
    }
  }

  // 6. Gravity Calculation & Planetary Artifact Resonance
  let gravAx = 0;
  let gravAy = 0;
  let maxGravIntensity = 0;
  let nearestNodeId: string | null = null;

  for (const node of massNodes) {
    node.rotationAngle += node.rotationSpeed * dt;

    const dx = node.position.x - ship.position.x;
    const dy = node.position.y - ship.position.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);

    if (dist < node.gravityRadius) {
      const effDistSq = Math.max(distSq, PHYSICS_CONFIG.MIN_GRAV_DISTANCE_SQ);
      let force = (PHYSICS_CONFIG.G * node.mass) / effDistSq;

      const falloff = 1 - Math.pow(dist / node.gravityRadius, 2);
      force *= Math.max(0, falloff);
      force = Math.min(force, PHYSICS_CONFIG.MAX_GRAV_ACCEL);

      const normX = dx / (dist || 1);
      const normY = dy / (dist || 1);

      gravAx += normX * force;
      gravAy += normY * force;

      const intensity = 1 - dist / node.gravityRadius;
      if (intensity > maxGravIntensity) {
        maxGravIntensity = intensity;
        nearestNodeId = node.id;
      }

      // Planetary Artifact 3-Orbit Survey Tracking
      if (node.artifact && !node.artifact.isCollected) {
        const currentShipAngle = Math.atan2(ship.position.y - node.position.y, ship.position.x - node.position.x);

        if (node.artifact.lastShipAngle !== undefined) {
          let dAngle = currentShipAngle - node.artifact.lastShipAngle;
          while (dAngle > Math.PI) dAngle -= Math.PI * 2;
          while (dAngle < -Math.PI) dAngle += Math.PI * 2;

          if (dist > node.radius + ship.radius + 8 && Math.abs(dAngle) < 0.8) {
            node.artifact.accumulatedAngle += Math.abs(dAngle);
            const prevOrbits = node.artifact.completedOrbits;
            node.artifact.completedOrbits = Math.min(3, Math.floor(node.artifact.accumulatedAngle / (2 * Math.PI)));
            node.artifact.resonancePercent = Math.min(1.0, node.artifact.accumulatedAngle / (3 * 2 * Math.PI));

            if (node.artifact.completedOrbits > prevOrbits && node.artifact.completedOrbits < 3) {
              soundManager.playArtifactOrbitAdvance(node.artifact.completedOrbits);
              for (let p = 0; p < 24; p++) {
                const pa = (p / 24) * Math.PI * 2;
                particles.push({
                  x: node.position.x + Math.cos(pa) * (node.radius + 40),
                  y: node.position.y + Math.sin(pa) * (node.radius + 40),
                  vx: Math.cos(pa) * 80,
                  vy: Math.sin(pa) * 80,
                  color: '#fbbf24',
                  size: 2.2,
                  life: 0,
                  maxLife: 0.45,
                  alpha: 1.0,
                });
              }
            }

            if (node.artifact.completedOrbits >= 3 && !node.artifact.isCollected) {
              node.artifact.isCollected = true;
              node.artifact.dissolveProgress = 0;
              node.artifact.unlockedAt = stats.timeElapsed;
              stats.artifactsCollected += 1;
              stats.finalScore += 500;
              stats.flowMultiplier = Math.min(4.0, stats.flowMultiplier + 1.2);

              const prevEnergy = ship.energy;
              ship.energy = ship.maxEnergy;
              stats.energyCollected += ship.maxEnergy - prevEnergy;
              // Immediate shield restoration reward
              ship.shield = Math.min(ship.maxShield, ship.shield + 35);

              soundManager.playArtifactUnlocked();
              soundManager.playLoreTransmission();
              result.artifactCompleted = node.artifact;

              // If all relics have now been collected, awaken Chimera-0!
              if (stats.artifactsCollected >= stats.totalArtifacts && stats.totalArtifacts > 0) {
                const boss = hostileShips.find(e => e.isBoss);
                if (boss && boss.dormantUntilRelicsCollected) {
                  boss.dormantUntilRelicsCollected = false;
                  boss.state = 'COMBAT';
                  boss.warpInTimer = 2.5;
                  // Position near the extraction gate to seal the escape route!
                  boss.position.x = extractionGate.position.x + 360;
                  boss.position.y = extractionGate.position.y + 240;
                  boss.spawnOrigin = { ...boss.position };
                  boss.velocity = { x: 0, y: 0 };
                  boss.shootCooldown = 4.0;
                  boss.phaseTransitionTimer = 0;
                  soundManager.playBossAlert();
                  result.bossStageChange = {
                    stage: 1,
                    name: '⚠️ ALL RELICS SECURED: APEX CHIMERA-0 WARPING IN AT EXTRACTION GATE!',
                  };
                  result.screenShake = 22;
                }
              }

              // Supernova transcendence spark nova
              for (let p = 0; p < 50; p++) {
                const pa = Math.random() * Math.PI * 2;
                const ps = 80 + Math.random() * 240;
                particles.push({
                  x: ship.position.x,
                  y: ship.position.y,
                  vx: Math.cos(pa) * ps,
                  vy: Math.sin(pa) * ps,
                  color: p % 2 === 0 ? '#fde047' : '#4ade80',
                  size: 3.2 + Math.random() * 2.8,
                  life: 0,
                  maxLife: 0.85,
                  alpha: 1.0,
                  shape: 'spark',
                });
              }
            }
          }
        }
        node.artifact.lastShipAngle = currentShipAngle;
      }

      // Track Gravity Assist event
      if (!activeGravityAssists.has(node.id)) {
        const currentSpeed = Math.hypot(ship.velocity.x, ship.velocity.y);
        const currentAngle = Math.atan2(ship.velocity.y, ship.velocity.x);
        activeGravityAssists.set(node.id, {
          entrySpeed: currentSpeed,
          minDistance: dist,
          angleEntered: currentAngle,
        });
      } else {
        const assistData = activeGravityAssists.get(node.id)!;
        if (dist < assistData.minDistance) {
          assistData.minDistance = dist;
        }
      }
    } else {
      if (node.artifact) {
        node.artifact.lastShipAngle = undefined;
      }

      if (activeGravityAssists.has(node.id)) {
        const assistData = activeGravityAssists.get(node.id)!;
        const exitSpeed = Math.hypot(ship.velocity.x, ship.velocity.y);
        const exitAngle = Math.atan2(ship.velocity.y, ship.velocity.x);

        let angleDiff = Math.abs(exitAngle - assistData.angleEntered);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

        if (
          assistData.minDistance < node.gravityRadius * 0.65 &&
          angleDiff > 0.6 &&
          exitSpeed >= assistData.entrySpeed * 0.85
        ) {
          result.gravityAssistTriggered = true;
          stats.gravityAssists += 1;
          stats.flowMultiplier = Math.min(4.0, stats.flowMultiplier + 0.5);
          stats.finalScore += Math.round(75 * stats.flowMultiplier);
          soundManager.playGravityAssist();

          for (let p = 0; p < 24; p++) {
            const pa = Math.random() * Math.PI * 2;
            const ps = 80 + Math.random() * 120;
            particles.push({
              x: ship.position.x,
              y: ship.position.y,
              vx: Math.cos(pa) * ps + ship.velocity.x * 0.5,
              vy: Math.sin(pa) * ps + ship.velocity.y * 0.5,
              color: node.color,
              size: 2.5 + Math.random() * 2.5,
              life: 0,
              maxLife: 0.5,
              alpha: 1.0,
            });
          }
        }
        activeGravityAssists.delete(node.id);
      }
    }

    // 7. Mass Node Core Collision (Shield absorbs crash impact first!)
    if (dist < node.radius + ship.radius) {
      const normalX = (ship.position.x - node.position.x) / (dist || 1);
      const normalY = (ship.position.y - node.position.y) / (dist || 1);

      ship.position.x = node.position.x + normalX * (node.radius + ship.radius + 2);
      ship.position.y = node.position.y + normalY * (node.radius + ship.radius + 2);

      const dot = ship.velocity.x * normalX + ship.velocity.y * normalY;
      if (dot < 0) {
        ship.velocity.x = (ship.velocity.x - (1 + PHYSICS_CONFIG.BOUNCE_RESTITUTION) * dot * normalX) + normalX * 60;
        ship.velocity.y = (ship.velocity.y - (1 + PHYSICS_CONFIG.BOUNCE_RESTITUTION) * dot * normalY) + normalY * 60;
      }

      const rawDmg = PHYSICS_CONFIG.COLLISION_DAMAGE_CORE;
      let hullDmg = 0;
      ship.shieldImpactPulse = 1.0;
      ship.shieldRechargeDelay = PHYSICS_CONFIG.SHIELD_RECHARGE_DELAY;

      if (ship.shield > 0) {
        if (ship.shield >= rawDmg) {
          ship.shield -= rawDmg;
          stats.shieldDamageAbsorbed += rawDmg;
          soundManager.playShieldHit();
        } else {
          const absorbed = ship.shield;
          hullDmg = rawDmg - absorbed;
          ship.shield = 0;
          stats.shieldDamageAbsorbed += absorbed;
          soundManager.playShieldBreak();
        }
      } else {
        hullDmg = rawDmg;
        soundManager.playDamage();
      }

      if (hullDmg > 0) {
        ship.hull = Math.max(0, ship.hull - hullDmg);
        stats.damageTaken += hullDmg;
      }

      stats.flowMultiplier = 1.0;
      result.damageInflicted += rawDmg;
      result.screenShake = 14;

      for (let p = 0; p < 30; p++) {
        const pa = Math.random() * Math.PI * 2;
        const ps = 60 + Math.random() * 160;
        particles.push({
          x: ship.position.x,
          y: ship.position.y,
          vx: Math.cos(pa) * ps,
          vy: Math.sin(pa) * ps,
          color: '#f87171',
          size: 2.2 + Math.random() * 3,
          life: 0,
          maxLife: 0.4,
          alpha: 1.0,
        });
      }

      if (ship.hull <= 0) {
        result.shipDestroyed = true;
      }
    }
  }

  ship.nearGravityNodeId = nearestNodeId;
  soundManager.updateGravityField(maxGravIntensity);

  // 8. Integrate Ship Velocity & Position
  ship.velocity.x += (forwardAx + gravAx) * dt;
  ship.velocity.y += (forwardAy + gravAy) * dt;

  const speedPostIntegration = Math.hypot(ship.velocity.x, ship.velocity.y);
  if (speedPostIntegration > 0) {
    const drag = Math.min(1, PHYSICS_CONFIG.LINEAR_DRAG * dt);
    ship.velocity.x *= 1 - drag;
    ship.velocity.y *= 1 - drag;
  }

  if (speedPostIntegration > PHYSICS_CONFIG.MAX_VELOCITY) {
    const scale = PHYSICS_CONFIG.MAX_VELOCITY / speedPostIntegration;
    ship.velocity.x *= scale;
    ship.velocity.y *= scale;
  }

  const speedNow = Math.hypot(ship.velocity.x, ship.velocity.y);
  if (speedNow > stats.maxSpeed) {
    stats.maxSpeed = speedNow;
  }

  const oldX = ship.position.x;
  const oldY = ship.position.y;
  ship.position.x += ship.velocity.x * dt;
  ship.position.y += ship.velocity.y * dt;

  const frameDist = Math.hypot(ship.position.x - oldX, ship.position.y - oldY);
  stats.distanceTraveled += frameDist;

  // 8.1 Sector Containment Boundary & Out-of-Bounds Integrity Decay
  const wWidth = worldSize?.width || 6800;
  const wHeight = worldSize?.height || 6800;
  const isOut =
    ship.position.x < 0 ||
    ship.position.x > wWidth ||
    ship.position.y < 0 ||
    ship.position.y > wHeight;
  ship.isOutOfBounds = isOut;

  if (isOut) {
    result.boundaryBreached = true;
    const dxOut = Math.max(0, -ship.position.x, ship.position.x - wWidth);
    const dyOut = Math.max(0, -ship.position.y, ship.position.y - wHeight);
    const breachDist = Math.hypot(dxOut, dyOut);
    ship.outOfBoundsDistance = breachDist;

    // Cosmic Grid Breakdown: progressive continuous shield then hull decay
    const decayRate = 18.0 + breachDist * 0.04;
    const decayDamage = decayRate * dt;
    if (ship.shield > 0) {
      ship.shield = Math.max(0, ship.shield - decayDamage * 1.5);
      ship.shieldImpactPulse = 1.0;
    } else {
      ship.hull = Math.max(0, ship.hull - decayDamage);
    }
    stats.damageTaken += decayDamage;

    // Boundary containment friction particles
    if (Math.random() < 0.75) {
      particles.push({
        x: ship.position.x + (Math.random() - 0.5) * ship.radius * 2,
        y: ship.position.y + (Math.random() - 0.5) * ship.radius * 2,
        vx: (Math.random() - 0.5) * 90,
        vy: (Math.random() - 0.5) * 90,
        color: Math.random() > 0.4 ? '#ef4444' : '#f97316',
        size: 2.2 + Math.random() * 2.2,
        life: 0,
        maxLife: 0.28,
        alpha: 1.0,
        shape: 'spark',
      });
    }

    if (ship.hull <= 0) {
      result.shipDestroyed = true;
      soundManager.playExplosion(1.8);
    }
  } else {
    ship.outOfBoundsDistance = 0;
  }

  // 8.2 Precursor Derelict Megastructures (Orbital ruins salvage)
  if (derelicts) {
    for (const d of derelicts) {
      d.rotation += d.rotationSpeed * dt;
      if (d.salvaged) continue;

      const dist = Math.hypot(ship.position.x - d.position.x, ship.position.y - d.position.y);
      if (dist < d.radius + ship.radius + 35) {
        d.salvaged = true;
        result.derelictSalvaged = d;
        stats.finalScore += 650;
        stats.flowMultiplier = Math.min(4.0, stats.flowMultiplier + 0.8);
        ship.shield = Math.min(ship.maxShield, ship.shield + 45);
        ship.energy = Math.min(ship.maxEnergy, ship.energy + 50);
        soundManager.playShieldRecharged();

        // Salvage burst
        for (let p = 0; p < 40; p++) {
          const pa = Math.random() * Math.PI * 2;
          const ps = 40 + Math.random() * 180;
          particles.push({
            x: d.position.x,
            y: d.position.y,
            vx: Math.cos(pa) * ps,
            vy: Math.sin(pa) * ps,
            color: '#38bdf8',
            size: 2.5 + Math.random() * 2,
            life: 0,
            maxLife: 0.6,
            alpha: 1.0,
            shape: 'spark',
          });
        }
      }
    }
  }

  // 8.3 Drifting Crystalline Asteroid Belt Simulation
  if (asteroids) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const ast = asteroids[i];
      ast.position.x += ast.velocity.x * dt;
      ast.position.y += ast.velocity.y * dt;
      ast.rotation += ast.rotationSpeed * dt;

      // Wrap asteroids within sector
      if (ast.position.x < 0) ast.position.x = wWidth;
      else if (ast.position.x > wWidth) ast.position.x = 0;
      if (ast.position.y < 0) ast.position.y = wHeight;
      else if (ast.position.y > wHeight) ast.position.y = 0;

      // Check collision with player ship
      const distShip = Math.hypot(ship.position.x - ast.position.x, ship.position.y - ast.position.y);
      if (distShip < ast.radius + ship.radius) {
        const nx = (ship.position.x - ast.position.x) / (distShip || 1);
        const ny = (ship.position.y - ast.position.y) / (distShip || 1);
        ship.position.x = ast.position.x + nx * (ast.radius + ship.radius + 2);
        ship.position.y = ast.position.y + ny * (ast.radius + ship.radius + 2);

        const relVx = ship.velocity.x - ast.velocity.x;
        const relVy = ship.velocity.y - ast.velocity.y;
        const impactSpeed = Math.hypot(relVx, relVy);

        ship.velocity.x = nx * Math.max(70, impactSpeed * 0.7);
        ship.velocity.y = ny * Math.max(70, impactSpeed * 0.7);

        const dmg = Math.round(Math.min(30, impactSpeed * 0.12));
        if (dmg > 4) {
          if (ship.shield > 0) {
            ship.shield = Math.max(0, ship.shield - dmg);
            ship.shieldImpactPulse = 1.0;
          } else {
            ship.hull = Math.max(0, ship.hull - dmg);
          }
          result.screenShake = Math.min(16, dmg * 0.5);
          soundManager.playDamage();
        }
      }

      // Check projectile hits on asteroid
      for (let pIdx = projectiles.length - 1; pIdx >= 0; pIdx--) {
        const proj = projectiles[pIdx];
        if (!proj.isPlayer) continue;
        const pDist = Math.hypot(proj.position.x - ast.position.x, proj.position.y - ast.position.y);
        if (pDist < ast.radius + proj.radius) {
          projectiles.splice(pIdx, 1);
          ast.health -= proj.damage;

          for (let k = 0; k < 6; k++) {
            particles.push({
              x: proj.position.x,
              y: proj.position.y,
              vx: (Math.random() - 0.5) * 100,
              vy: (Math.random() - 0.5) * 100,
              color: ast.color,
              size: 2.2,
              life: 0,
              maxLife: 0.25,
              alpha: 0.9,
              shape: 'spark',
            });
          }

          if (ast.health <= 0) {
            asteroids.splice(i, 1);
            stats.finalScore += 60;
            shards.push({
              id: `shard-ast-${Date.now()}-${i}`,
              position: { ...ast.position },
              basePosition: { ...ast.position },
              type: 'STANDARD',
              energyValue: 20,
              scoreValue: 60,
              radius: 6,
              collected: false,
              pulsePhase: Math.random() * Math.PI * 2,
            });
            break;
          }
        }
      }
    }
  }

  // 8.4 Artifact Transcendence Dissolution Progression & Particle Streams
  for (const node of massNodes) {
    if (node.artifact && node.artifact.isCollected && !node.artifact.isDissolved) {
      node.artifact.dissolveProgress = (node.artifact.dissolveProgress || 0) + dt * 0.75;

      const orbitRadius = node.radius + (node.gravityRadius - node.radius) * 0.45;
      const relicAngle = stats.timeElapsed * 0.4;
      const relicX = node.position.x + Math.cos(relicAngle) * orbitRadius;
      const relicY = node.position.y + Math.sin(relicAngle) * orbitRadius;

      // Stream radiant starlight crystals from relic into player ship
      const toShipX = ship.position.x - relicX;
      const toShipY = ship.position.y - relicY;
      const distShip = Math.hypot(toShipX, toShipY) || 1;
      const streamSpeed = 240 + Math.random() * 180;
      const normX = toShipX / distShip;
      const normY = toShipY / distShip;

      particles.push({
        x: relicX + (Math.random() - 0.5) * 16,
        y: relicY + (Math.random() - 0.5) * 16,
        vx: normX * streamSpeed + (Math.random() - 0.5) * 60,
        vy: normY * streamSpeed + (Math.random() - 0.5) * 60,
        color: Math.random() > 0.3 ? '#fde047' : '#4ade80',
        size: 2.6 + Math.random() * 2.0,
        life: 0,
        maxLife: Math.min(0.7, distShip / streamSpeed + 0.1),
        alpha: 1.0,
        shape: 'spark',
      });

      if (node.artifact.dissolveProgress >= 1.0) {
        node.artifact.isDissolved = true;
      }
    }
  }

  // 9. Hostile Ships AI & Combat Loop (With 60-second respawn timer)
  for (const enemy of hostileShips) {
    // If boss is waiting for all relics, remain completely dormant
    if (enemy.dormantUntilRelicsCollected) {
      continue;
    }

    // A. Dead & Respawning state
    if (enemy.state === 'DEAD') {
      enemy.respawnTimer = Math.max(0, enemy.respawnTimer - dt);

      // Once 60s timer expires -> Respawn with warp flash!
      if (enemy.respawnTimer <= 0) {
        enemy.state = 'PATROL';
        enemy.hull = enemy.maxHull;
        enemy.shield = enemy.maxShield;
        enemy.position = { ...enemy.spawnOrigin };
        enemy.velocity = { x: 0, y: 0 };
        enemy.warpInTimer = 1.0;
        enemy.shootCooldown = 1.5;
        soundManager.playEnemyWarpIn();

        // Warp flash particles
        for (let p = 0; p < 35; p++) {
          const pa = Math.random() * Math.PI * 2;
          const ps = 40 + Math.random() * 140;
          particles.push({
            x: enemy.position.x,
            y: enemy.position.y,
            vx: Math.cos(pa) * ps,
            vy: Math.sin(pa) * ps,
            color: enemy.color,
            size: 3.0,
            life: 0,
            maxLife: 0.65,
            alpha: 1.0,
          });
        }
      }
      continue;
    }

    // B. Shield recharge, warp animation & boss phase windup grace period
    if (enemy.phaseTransitionTimer && enemy.phaseTransitionTimer > 0) {
      enemy.phaseTransitionTimer = Math.max(0, enemy.phaseTransitionTimer - dt);
      enemy.velocity.x *= 0.85;
      enemy.velocity.y *= 0.85;
      enemy.shootCooldown = Math.max(enemy.shootCooldown, enemy.phaseTransitionTimer);
    }
    if (enemy.shieldImpactPulse && enemy.shieldImpactPulse > 0) {
      enemy.shieldImpactPulse = Math.max(0, enemy.shieldImpactPulse - dt * 3.5);
    }
    if (enemy.warpInTimer > 0) {
      enemy.warpInTimer = Math.max(0, enemy.warpInTimer - dt * 2.0);
    }
    if (enemy.shieldRechargeDelay > 0) {
      enemy.shieldRechargeDelay = Math.max(0, enemy.shieldRechargeDelay - dt);
    } else if (enemy.shield < enemy.maxShield) {
      enemy.shield = Math.min(enemy.maxShield, enemy.shield + 10 * dt);
    }

    const distToPlayer = Math.hypot(ship.position.x - enemy.position.x, ship.position.y - enemy.position.y);

    // C. AI State Machine
    if (enemy.state === 'PATROL') {
      if (distToPlayer < enemy.detectionRadius) {
        enemy.state = 'COMBAT';
      } else {
        // Patrol orbit around spawn or guard center
        enemy.patrolAngle += enemy.patrolSpeed * dt;
        let targetX = enemy.spawnOrigin.x + Math.cos(enemy.patrolAngle) * enemy.patrolRadius;
        let targetY = enemy.spawnOrigin.y + Math.sin(enemy.patrolAngle) * enemy.patrolRadius;

        const toTargetX = targetX - enemy.position.x;
        const toTargetY = targetY - enemy.position.y;
        const targetDist = Math.hypot(toTargetX, toTargetY);

        if (targetDist > 10) {
          enemy.velocity.x += (toTargetX / targetDist) * 120 * dt;
          enemy.velocity.y += (toTargetY / targetDist) * 120 * dt;
        }

        const targetRot = Math.atan2(enemy.velocity.y, enemy.velocity.x);
        let rotDiff = targetRot - enemy.rotation;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        enemy.rotation += rotDiff * Math.min(1, 4 * dt);
      }
    } else if (enemy.state === 'COMBAT') {
      if (distToPlayer > enemy.detectionRadius * 1.6) {
        enemy.state = 'PATROL';
      } else {
        // Aim at player
        const toPlayerX = ship.position.x - enemy.position.x;
        const toPlayerY = ship.position.y - enemy.position.y;
        const targetRot = Math.atan2(toPlayerY, toPlayerX);

        let rotDiff = targetRot - enemy.rotation;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        enemy.rotation += rotDiff * Math.min(1, 5 * dt);

        // Positioning: Approach or strafe
        const desiredRange = enemy.type === 'SNIPER_CORVETTE' ? 620 : enemy.type === 'HEAVY_CRUISER' ? 380 : 260;
        const eFacingX = Math.cos(enemy.rotation);
        const eFacingY = Math.sin(enemy.rotation);

        if (distToPlayer > desiredRange + 60) {
          // Accelerate toward player
          enemy.velocity.x += eFacingX * 160 * dt;
          enemy.velocity.y += eFacingY * 160 * dt;
        } else if (distToPlayer < desiredRange - 60) {
          // Back off
          enemy.velocity.x -= eFacingX * 140 * dt;
          enemy.velocity.y -= eFacingY * 140 * dt;
        } else {
          // Strafe tangentially
          const perpX = -eFacingY;
          const perpY = eFacingX;
          enemy.velocity.x += perpX * 90 * dt;
          enemy.velocity.y += perpY * 90 * dt;
        }

        // Hostile Weapon Firing
        enemy.shootCooldown -= dt;
        if (enemy.shootCooldown <= 0 && distToPlayer <= enemy.attackRange) {
          enemy.shootCooldown = enemy.maxShootCooldown + (Math.random() - 0.5) * 0.4;
          const eFacing = Math.atan2(toPlayerY, toPlayerX);

          // Spawn Hostile Projectile
          const eWeaponDef = WEAPON_DEFINITIONS[enemy.weaponType];
          if (enemy.weaponType === 'PULSE_LASER') {
            soundManager.playLaserShot();
            projectiles.push({
              id: `proj-e-${Date.now()}-${Math.random()}`,
              position: {
                x: enemy.position.x + Math.cos(eFacing) * (enemy.radius + 6),
                y: enemy.position.y + Math.sin(eFacing) * (enemy.radius + 6),
              },
              velocity: {
                x: Math.cos(eFacing) * (eWeaponDef.projectileSpeed * 0.8),
                y: Math.sin(eFacing) * (eWeaponDef.projectileSpeed * 0.8),
              },
              rotation: eFacing,
              type: 'PULSE_LASER',
              damage: 16,
              splashRadius: 0,
              homing: false,
              targetId: null,
              isPlayer: false,
              life: 0,
              maxLife: 1.2,
              color: '#f87171',
              radius: 4,
              trail: [],
            });
          } else if (enemy.weaponType === 'HEAT_SEEKER') {
            soundManager.playMissileLaunch();
            projectiles.push({
              id: `proj-e-${Date.now()}-${Math.random()}`,
              position: {
                x: enemy.position.x + Math.cos(eFacing) * (enemy.radius + 6),
                y: enemy.position.y + Math.sin(eFacing) * (enemy.radius + 6),
              },
              velocity: {
                x: Math.cos(eFacing) * 420,
                y: Math.sin(eFacing) * 420,
              },
              rotation: eFacing,
              type: 'HEAT_SEEKER',
              damage: 28,
              splashRadius: 24,
              homing: true,
              targetId: 'player',
              isPlayer: false,
              life: 0,
              maxLife: 2.6,
              color: '#fb923c',
              radius: 5,
              trail: [],
            });
          } else if (enemy.weaponType === 'AREA_MISSILE') {
            soundManager.playAreaMissileFire();
            projectiles.push({
              id: `proj-e-${Date.now()}-${Math.random()}`,
              position: {
                x: enemy.position.x + Math.cos(eFacing) * (enemy.radius + 8),
                y: enemy.position.y + Math.sin(eFacing) * (enemy.radius + 8),
              },
              velocity: {
                x: Math.cos(eFacing) * 380,
                y: Math.sin(eFacing) * 380,
              },
              rotation: eFacing,
              type: 'AREA_MISSILE',
              damage: 24,
              splashRadius: 100,
              homing: false,
              targetId: null,
              isPlayer: false,
              life: 0,
              maxLife: 2.2,
              color: '#f43f5e',
              radius: 7,
              trail: [],
            });
          } else if (enemy.weaponType === 'SNIPER') {
            soundManager.playRailgunFire();
            projectiles.push({
              id: `proj-e-${Date.now()}-${Math.random()}`,
              position: {
                x: enemy.position.x + Math.cos(eFacing) * (enemy.radius + 10),
                y: enemy.position.y + Math.sin(eFacing) * (enemy.radius + 10),
              },
              velocity: {
                x: Math.cos(eFacing) * 1600,
                y: Math.sin(eFacing) * 1600,
              },
              rotation: eFacing,
              type: 'SNIPER',
              damage: 42,
              splashRadius: 0,
              homing: false,
              targetId: null,
              isPlayer: false,
              life: 0,
              maxLife: 1.0,
              color: '#34d399',
              radius: 4,
              trail: [],
            });
          } else if (enemy.weaponType === 'TACHYON_BEAM') {
            soundManager.playTachyonBeam();
            [-0.14, 0, 0.14].forEach(spread => {
              const bAngle = eFacing + spread;
              projectiles.push({
                id: `proj-e-${Date.now()}-${Math.random()}`,
                position: {
                  x: enemy.position.x + Math.cos(bAngle) * (enemy.radius + 12),
                  y: enemy.position.y + Math.sin(bAngle) * (enemy.radius + 12),
                },
                velocity: {
                  x: Math.cos(bAngle) * 1900,
                  y: Math.sin(bAngle) * 1900,
                },
                rotation: bAngle,
                type: 'TACHYON_BEAM',
                damage: 16,
                splashRadius: 0,
                homing: false,
                targetId: null,
                isPlayer: false,
                life: 0,
                maxLife: 0.8,
                color: '#f97316',
                radius: 4.5,
                trail: [],
              });
            });
          } else if (enemy.weaponType === 'VORTEX_CANNON') {
            soundManager.playVortexCannon();
            projectiles.push({
              id: `proj-e-${Date.now()}-${Math.random()}`,
              position: {
                x: enemy.position.x + Math.cos(eFacing) * (enemy.radius + 14),
                y: enemy.position.y + Math.sin(eFacing) * (enemy.radius + 14),
              },
              velocity: {
                x: Math.cos(eFacing) * 440,
                y: Math.sin(eFacing) * 440,
              },
              rotation: eFacing,
              type: 'VORTEX_CANNON',
              damage: 36,
              splashRadius: 150,
              homing: false,
              targetId: null,
              isPlayer: false,
              life: 0,
              maxLife: 2.0,
              color: '#ef4444',
              radius: 9,
              trail: [],
              vortexPull: true,
            });
          }

          // Boss secondary attack burst
          if (enemy.isBoss && enemy.bossStage && enemy.bossStage >= 2 && (!enemy.phaseTransitionTimer || enemy.phaseTransitionTimer <= 0)) {
            // Secondary Seeker Swarm
            soundManager.playMissileLaunch();
            [-1, 1].forEach(side => {
              const wingX = enemy.position.x - Math.sin(eFacing) * (enemy.radius * 0.7 * side);
              const wingY = enemy.position.y + Math.cos(eFacing) * (enemy.radius * 0.7 * side);
              projectiles.push({
                id: `proj-e-boss-msl-${Date.now()}-${side}`,
                position: { x: wingX, y: wingY },
                velocity: { x: Math.cos(eFacing) * 360, y: Math.sin(eFacing) * 360 },
                rotation: eFacing,
                type: 'HEAT_SEEKER',
                damage: 14,
                splashRadius: 20,
                homing: true,
                targetId: 'player',
                isPlayer: false,
                life: 0,
                maxLife: 2.5,
                color: '#fb923c',
                radius: 5,
                trail: [],
              });
            });
          }
        }
      }
    }

    // Boss Barrier Drones & Gravitational Singularity Mechanics
    if (enemy.isBoss) {
      if (enemy.barrierDrones) {
        for (const drone of enemy.barrierDrones) {
          if (drone.alive) {
            drone.angle += (enemy.bossStage === 1 ? 1.6 : enemy.bossStage === 2 ? 2.4 : 3.2) * dt;
          }
        }
      }

      if (enemy.singularityActive && enemy.state === 'COMBAT') {
        const pullDx = enemy.position.x - ship.position.x;
        const pullDy = enemy.position.y - ship.position.y;
        const pDist = Math.hypot(pullDx, pullDy);
        if (pDist < 1300 && pDist > 70) {
          const pullSpeed = (1 - pDist / 1300) * 150 * dt;
          ship.velocity.x += (pullDx / pDist) * pullSpeed;
          ship.velocity.y += (pullDy / pDist) * pullSpeed;

          if (Math.random() < 0.35) {
            particles.push({
              x: ship.position.x + (Math.random() - 0.5) * 50,
              y: ship.position.y + (Math.random() - 0.5) * 50,
              vx: (pullDx / pDist) * 140,
              vy: (pullDy / pDist) * 140,
              color: '#c084fc',
              size: 2.5,
              life: 0,
              maxLife: 0.3,
              alpha: 0.75,
            });
          }
        }
      }
    }

    // Drag and enemy integration
    enemy.velocity.x *= 1 - Math.min(1, 0.04 * dt * 60);
    enemy.velocity.y *= 1 - Math.min(1, 0.04 * dt * 60);
    enemy.position.x += enemy.velocity.x * dt;
    enemy.position.y += enemy.velocity.y * dt;

    // Enemy trail
    if (Math.hypot(enemy.velocity.x, enemy.velocity.y) > 20 && Math.random() < 0.3) {
      particles.push({
        x: enemy.position.x - Math.cos(enemy.rotation) * (enemy.radius + 2),
        y: enemy.position.y - Math.sin(enemy.rotation) * (enemy.radius + 2),
        vx: -Math.cos(enemy.rotation) * 60 + (Math.random() - 0.5) * 20,
        vy: -Math.sin(enemy.rotation) * 60 + (Math.random() - 0.5) * 20,
        color: enemy.color,
        size: 1.8,
        life: 0,
        maxLife: 0.25,
        alpha: 0.7,
      });
    }

    // Ramming collision between player and enemy
    if (distToPlayer < ship.radius + enemy.radius) {
      const normX = (ship.position.x - enemy.position.x) / (distToPlayer || 1);
      const normY = (ship.position.y - enemy.position.y) / (distToPlayer || 1);

      ship.velocity.x += normX * 120;
      ship.velocity.y += normY * 120;
      enemy.velocity.x -= normX * 120;
      enemy.velocity.y -= normY * 120;

      // Ramming damage to both
      const ramDmg = 20;
      if (ship.shield > 0) {
        ship.shield = Math.max(0, ship.shield - ramDmg);
      } else {
        ship.hull = Math.max(0, ship.hull - ramDmg);
      }
      enemy.hull = Math.max(0, enemy.hull - ramDmg);

      soundManager.playExplosion(1.0);
      result.screenShake = 10;
    }
  }

  // 10. Projectiles Update & Combat Hit Detection
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.life += dt;

    // Homing Steering Logic
    if (proj.homing) {
      let targetPos: { x: number; y: number } | null = null;
      if (proj.isPlayer) {
        const targetEnemy = hostileShips.find(e => e.id === proj.targetId && e.state !== 'DEAD' && !e.dormantUntilRelicsCollected);
        if (targetEnemy) {
          targetPos = targetEnemy.position;
        } else {
          // Re-acquire nearest alive active enemy
          let minDist = 1200;
          for (const e of hostileShips) {
            if (e.state === 'DEAD' || e.dormantUntilRelicsCollected) continue;
            const d = Math.hypot(e.position.x - proj.position.x, e.position.y - proj.position.y);
            if (d < minDist) {
              minDist = d;
              targetPos = e.position;
              proj.targetId = e.id;
            }
          }
        }
      } else {
        targetPos = ship.position;
      }

      if (targetPos) {
        const targetAngle = Math.atan2(targetPos.y - proj.position.y, targetPos.x - proj.position.x);
        let angleDiff = targetAngle - proj.rotation;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const turnSpeed = 5.5 * dt;
        proj.rotation += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed);

        const currentSpd = Math.hypot(proj.velocity.x, proj.velocity.y);
        proj.velocity.x = Math.cos(proj.rotation) * currentSpd;
        proj.velocity.y = Math.sin(proj.rotation) * currentSpd;
      }
    }

    // Move projectile
    proj.position.x += proj.velocity.x * dt;
    proj.position.y += proj.velocity.y * dt;

    // Add trail particle
    if (proj.type === 'HEAT_SEEKER' || proj.type === 'AREA_MISSILE') {
      if (Math.random() < 0.6) {
        particles.push({
          x: proj.position.x,
          y: proj.position.y,
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() - 0.5) * 30,
          color: proj.color,
          size: proj.radius * 0.75,
          life: 0,
          maxLife: 0.22,
          alpha: 0.8,
        });
      }
    }

    // Check collision with planet cores
    let hitPlanet = false;
    for (const node of massNodes) {
      const d = Math.hypot(node.position.x - proj.position.x, node.position.y - proj.position.y);
      if (d < node.radius + proj.radius) {
        hitPlanet = true;
        // Impact sparks
        for (let p = 0; p < 8; p++) {
          particles.push({
            x: proj.position.x,
            y: proj.position.y,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            color: proj.color,
            size: 2,
            life: 0,
            maxLife: 0.25,
            alpha: 1.0,
          });
        }
        break;
      }
    }

    if (hitPlanet || proj.life >= proj.maxLife) {
      projectiles.splice(i, 1);
      continue;
    }

    // HIT DETECTION: Player Projectile -> Hostile Ships
    if (proj.isPlayer) {
      let projectileConsumed = false;

      for (const enemy of hostileShips) {
        if (enemy.state === 'DEAD' || enemy.dormantUntilRelicsCollected) continue;
        if (proj.piercedTargets && proj.piercedTargets.includes(enemy.id)) continue;

        // Check Barrier Drone Interception for Boss
        let droneBlocked = false;
        if (enemy.isBoss && enemy.barrierDrones) {
          for (const drone of enemy.barrierDrones) {
            if (!drone.alive) continue;
            const drX = enemy.position.x + Math.cos(drone.angle) * drone.distance;
            const drY = enemy.position.y + Math.sin(drone.angle) * drone.distance;
            const distDr = Math.hypot(drX - proj.position.x, drY - proj.position.y);
            if (distDr < 18 + proj.radius) {
              droneBlocked = true;
              drone.hp -= proj.damage;
              soundManager.playShieldHit();

              for (let k = 0; k < 8; k++) {
                particles.push({
                  x: drX,
                  y: drY,
                  vx: (Math.random() - 0.5) * 90,
                  vy: (Math.random() - 0.5) * 90,
                  color: '#38bdf8',
                  size: 2.5,
                  life: 0,
                  maxLife: 0.3,
                  alpha: 1.0,
                });
              }

              if (drone.hp <= 0) {
                drone.alive = false;
                soundManager.playShieldBreak();
                soundManager.playExplosion(1.6);
                result.screenShake = 12;
              }
              break;
            }
          }
        }

        if (droneBlocked) {
          if (proj.type !== 'TACHYON_BEAM' && proj.type !== 'SNIPER') {
            projectileConsumed = true;
            break;
          }
        }

        const d = Math.hypot(enemy.position.x - proj.position.x, enemy.position.y - proj.position.y);

        // Check Direct Hit or Area Blast
        if (d < enemy.radius + proj.radius) {
          if (proj.type === 'AREA_MISSILE') {
            // Area blast damages all enemies in splashRadius
            soundManager.playExplosion(1.4);
            result.screenShake = 9;

            for (const otherEnemy of hostileShips) {
              if (otherEnemy.state === 'DEAD') continue;
              const blastDist = Math.hypot(otherEnemy.position.x - proj.position.x, otherEnemy.position.y - proj.position.y);
              if (blastDist < proj.splashRadius) {
                const falloff = 1 - blastDist / proj.splashRadius;
                const splashDmg = Math.round(proj.damage * Math.max(0.4, falloff));

                applyDamageToEnemy(otherEnemy, splashDmg, stats, particles, result, ship, projectiles);
              }
            }

            // Expanding Shockwave ring particles
            for (let p = 0; p < 28; p++) {
              const pa = (p / 28) * Math.PI * 2;
              particles.push({
                x: proj.position.x,
                y: proj.position.y,
                vx: Math.cos(pa) * 160,
                vy: Math.sin(pa) * 160,
                color: proj.color,
                size: 3.5,
                life: 0,
                maxLife: 0.45,
                alpha: 1.0,
              });
            }

            projectileConsumed = true;
            break;
          } else if (proj.type === 'VORTEX_CANNON') {
            // Singularity Implosion: pulls enemies and debris inward then crushes them
            soundManager.playSingularityVortex();
            soundManager.playExplosion(1.8);
            result.screenShake = 14;

            for (const otherEnemy of hostileShips) {
              if (otherEnemy.state === 'DEAD') continue;
              const vDist = Math.hypot(otherEnemy.position.x - proj.position.x, otherEnemy.position.y - proj.position.y);
              if (vDist < proj.splashRadius) {
                // Gravitational pull toward vortex center
                const pullFactor = (1 - vDist / proj.splashRadius) * 220;
                otherEnemy.velocity.x -= ((otherEnemy.position.x - proj.position.x) / (vDist || 1)) * pullFactor;
                otherEnemy.velocity.y -= ((otherEnemy.position.y - proj.position.y) / (vDist || 1)) * pullFactor;

                const splashDmg = Math.round(proj.damage * Math.max(0.5, 1 - vDist / proj.splashRadius));
                applyDamageToEnemy(otherEnemy, splashDmg, stats, particles, result, ship, projectiles);
              }
            }

            // Inward spiral black-hole particles
            for (let p = 0; p < 36; p++) {
              const pa = (p / 36) * Math.PI * 2;
              const distP = 60 + Math.random() * 80;
              particles.push({
                x: proj.position.x + Math.cos(pa) * distP,
                y: proj.position.y + Math.sin(pa) * distP,
                vx: -Math.cos(pa) * 180,
                vy: -Math.sin(pa) * 180,
                color: p % 2 === 0 ? '#818cf8' : '#c084fc',
                size: 3.5,
                life: 0,
                maxLife: 0.55,
                alpha: 1.0,
              });
            }

            projectileConsumed = true;
            break;
          } else if (proj.type === 'TACHYON_BEAM') {
            // Tachyon Arc-Lance pierces with high damage
            applyDamageToEnemy(enemy, proj.damage, stats, particles, result, ship, projectiles);
            if (!proj.piercedTargets) proj.piercedTargets = [];
            proj.piercedTargets.push(enemy.id);
            result.screenShake = 6;

            for (let p = 0; p < 10; p++) {
              particles.push({
                x: proj.position.x,
                y: proj.position.y,
                vx: (Math.random() - 0.5) * 120,
                vy: (Math.random() - 0.5) * 120,
                color: '#e879f9',
                size: 3.0,
                life: 0,
                maxLife: 0.3,
                alpha: 1.0,
                shape: 'spark',
              });
            }
          } else {
            // Direct Hit
            applyDamageToEnemy(enemy, proj.damage, stats, particles, result, ship, projectiles);

            if (proj.type === 'SNIPER') {
              if (!proj.piercedTargets) proj.piercedTargets = [];
              proj.piercedTargets.push(enemy.id);
              proj.damage *= 0.8; // Reduced damage on pierce
              result.screenShake = 5;
            } else {
              projectileConsumed = true;
              break;
            }
          }
        }
      }

      if (projectileConsumed) {
        projectiles.splice(i, 1);
        continue;
      }
    } else {
      // HIT DETECTION: Hostile Projectile -> Player Ship
      const dToPlayer = Math.hypot(ship.position.x - proj.position.x, ship.position.y - proj.position.y);
      if (dToPlayer < ship.radius + proj.radius) {
        let hitDmg = proj.damage;
        ship.shieldImpactPulse = 1.0;
        ship.shieldRechargeDelay = PHYSICS_CONFIG.SHIELD_RECHARGE_DELAY;

        if (ship.shield > 0) {
          if (ship.shield >= hitDmg) {
            ship.shield -= hitDmg;
            stats.shieldDamageAbsorbed += hitDmg;
            soundManager.playShieldHit();
          } else {
            const absorbed = ship.shield;
            const remaining = hitDmg - absorbed;
            ship.shield = 0;
            stats.shieldDamageAbsorbed += absorbed;
            ship.hull = Math.max(0, ship.hull - remaining);
            stats.damageTaken += remaining;
            soundManager.playShieldBreak();
          }
        } else {
          ship.hull = Math.max(0, ship.hull - hitDmg);
          stats.damageTaken += hitDmg;
          soundManager.playDamage();
        }

        stats.flowMultiplier = Math.max(1.0, stats.flowMultiplier - 0.4);
        result.screenShake = 12;
        result.damageInflicted += hitDmg;

        // Spark impact particles
        for (let p = 0; p < 16; p++) {
          const pa = Math.random() * Math.PI * 2;
          const ps = 50 + Math.random() * 120;
          particles.push({
            x: ship.position.x,
            y: ship.position.y,
            vx: Math.cos(pa) * ps,
            vy: Math.sin(pa) * ps,
            color: proj.color,
            size: 2.5,
            life: 0,
            maxLife: 0.35,
            alpha: 1.0,
          });
        }

        if (ship.hull <= 0) {
          result.shipDestroyed = true;
        }

        projectiles.splice(i, 1);
        continue;
      }
    }
  }

  // 11. Update Shard Orbits & Collisions
  for (const shard of shards) {
    if (shard.collected) continue;

    if (shard.orbitCenter && shard.orbitRadius && shard.orbitSpeed !== undefined && shard.orbitAngle !== undefined) {
      shard.orbitAngle += shard.orbitSpeed * dt;
      shard.position.x = shard.orbitCenter.x + Math.cos(shard.orbitAngle) * shard.orbitRadius;
      shard.position.y = shard.orbitCenter.y + Math.sin(shard.orbitAngle) * shard.orbitRadius;
    } else {
      shard.pulsePhase += dt * 2.0;
      shard.position.x = shard.basePosition.x + Math.sin(shard.pulsePhase) * 6;
      shard.position.y = shard.basePosition.y + Math.cos(shard.pulsePhase * 0.7) * 6;
    }

    const distToShard = Math.hypot(ship.position.x - shard.position.x, ship.position.y - shard.position.y);
    if (distToShard < ship.radius + shard.radius + 6) {
      shard.collected = true;
      result.shardsCollected.push(shard);

      const prevEnergy = ship.energy;
      ship.energy = Math.min(ship.maxEnergy, ship.energy + shard.energyValue);
      stats.energyCollected += ship.energy - prevEnergy;
      // Active shield recharge via shard collection (tactical shield maintenance)
      const shieldGain = shard.type === 'RICH' ? 24 : 14;
      ship.shield = Math.min(ship.maxShield, ship.shield + shieldGain);

      if (shard.type === 'STANDARD') {
        stats.standardShardsCollected++;
      } else {
        stats.richShardsCollected++;
      }

      stats.flowMultiplier = Math.min(4.0, stats.flowMultiplier + (shard.type === 'RICH' ? 0.4 : 0.2));
      stats.finalScore += Math.round(shard.scoreValue * stats.flowMultiplier);

      soundManager.playShardCollect(shard.type === 'RICH');

      const sparkColor = shard.type === 'RICH' ? '#fbbf24' : '#38bdf8';
      for (let p = 0; p < (shard.type === 'RICH' ? 22 : 14); p++) {
        const pa = Math.random() * Math.PI * 2;
        const ps = 40 + Math.random() * 110;
        particles.push({
          x: shard.position.x,
          y: shard.position.y,
          vx: Math.cos(pa) * ps,
          vy: Math.sin(pa) * ps,
          color: sparkColor,
          size: 2.0 + Math.random() * 2.5,
          life: 0,
          maxLife: 0.35,
          alpha: 1.0,
        });
      }
    }
  }

  // 12. Ancient Signal Scanning
  if (!ancientSignal.scanned) {
    ancientSignal.pulsePhase += dt * 2.5;
    const distToSignal = Math.hypot(ship.position.x - ancientSignal.position.x, ship.position.y - ancientSignal.position.y);

    if (distToSignal < ancientSignal.scanRadius) {
      ship.scanningSignalId = ancientSignal.id;
      ship.scanProgress = Math.min(1.0, ship.scanProgress + dt / ancientSignal.scanDuration);

      const scanDrain = PHYSICS_CONFIG.SCAN_ENERGY_DRAIN * dt;
      ship.energy = Math.max(0, ship.energy - scanDrain);
      stats.energySpent += scanDrain;

      if (Math.random() < 0.15) {
        soundManager.playSignalPing();
      }

      if (ship.scanProgress >= 1.0) {
        ancientSignal.scanned = true;
        result.signalCompleted = true;
        stats.signalScanned = true;
        stats.finalScore += 500;
        stats.flowMultiplier = Math.min(4.0, stats.flowMultiplier + 1.0);
        soundManager.playGravityAssist();

        for (let p = 0; p < 36; p++) {
          const pa = Math.random() * Math.PI * 2;
          const ps = 50 + Math.random() * 180;
          particles.push({
            x: ancientSignal.position.x,
            y: ancientSignal.position.y,
            vx: Math.cos(pa) * ps,
            vy: Math.sin(pa) * ps,
            color: '#a78bfa',
            size: 3.0,
            life: 0,
            maxLife: 0.6,
            alpha: 1.0,
          });
        }
      }
    } else {
      ship.scanningSignalId = null;
      ship.scanProgress = Math.max(0, ship.scanProgress - dt * 0.8);
    }
  }

  // 13. Extraction Gate Collision
  const distToGate = Math.hypot(ship.position.x - extractionGate.position.x, ship.position.y - extractionGate.position.y);
  if (distToGate < extractionGate.radius + ship.radius) {
    result.gateReached = true;
    soundManager.playExtractionComplete();
  }

  // 14. Update Velocity Trail Breadcrumbs
  ship.trail.unshift({
    x: ship.position.x,
    y: ship.position.y,
    alpha: 1.0,
    speed: speedNow,
  });

  const maxTrailLen = Math.max(12, Math.min(32, Math.floor(speedNow * 0.08)));
  if (ship.trail.length > maxTrailLen) {
    ship.trail.pop();
  }

  for (let i = 0; i < ship.trail.length; i++) {
    ship.trail[i].alpha = 1.0 - i / ship.trail.length;
  }

  // 15. Flow multiplier decay
  if (stats.flowMultiplier > 1.0) {
    stats.flowMultiplier = Math.max(1.0, stats.flowMultiplier - dt * 0.12);
  }
  if (stats.flowMultiplier > stats.maxFlowMultiplier) {
    stats.maxFlowMultiplier = stats.flowMultiplier;
  }

  return result;
}

// Helper: Apply damage to hostile enemy ship
function applyDamageToEnemy(
  enemy: HostileShip,
  damage: number,
  stats: ExpeditionStats,
  particles: Particle[],
  result: PhysicsStepResult,
  ship?: Ship,
  projectiles?: Projectile[]
) {
  enemy.shieldImpactPulse = 1.0;
  enemy.shieldRechargeDelay = 3.5;
  stats.damageDealt += damage;

  let hullDamage = 0;
  if (enemy.shield > 0) {
    if (enemy.shield >= damage) {
      enemy.shield -= damage;
      soundManager.playShieldHit();
    } else {
      const absorbed = enemy.shield;
      hullDamage = damage - absorbed;
      enemy.shield = 0;
      soundManager.playShieldBreak();
    }
  } else {
    hullDamage = damage;
    soundManager.playDamage();
  }

  if (hullDamage > 0) {
    enemy.hull = Math.max(0, enemy.hull - hullDamage);
  }

  // Multi-Stage Boss Phase Transitions
  if (enemy.isBoss && enemy.state !== 'DEAD') {
    if (enemy.bossStage === 1 && enemy.hull <= 500) {
      enemy.bossStage = 2;
      enemy.color = '#f97316'; // Antimatter Orange
      enemy.secondaryColor = '#c2410c';
      enemy.weaponType = 'TACHYON_BEAM';
      enemy.maxShootCooldown = 1.8;
      // Critical Grace Period: 4.5 seconds to fall back and reposition!
      enemy.phaseTransitionTimer = 4.5;
      enemy.shootCooldown = 4.5;
      result.bossStageChange = { stage: 2, name: '⚠️ PHASE II: TACHYON CORE EXPOSED — FALL BACK! (4.5s RECHARGE)' };
      soundManager.playBossPhaseAdvance();
      soundManager.playBossAlert();
      result.screenShake = 22;

      // Defensive Repulsion Blast: pushes player safely backwards away from boss
      if (ship) {
        const pushDx = ship.position.x - enemy.position.x;
        const pushDy = ship.position.y - enemy.position.y;
        const pushDist = Math.hypot(pushDx, pushDy) || 1;
        const repulsePower = 380;
        ship.velocity.x += (pushDx / pushDist) * repulsePower;
        ship.velocity.y += (pushDy / pushDist) * repulsePower;

        // Temporary shield fortification so player survives retreat
        ship.shield = Math.min(ship.maxShield, ship.shield + 40);
      }

      // Vaporize any immediate hostile projectiles within 650px radius
      if (projectiles) {
        for (let pIdx = projectiles.length - 1; pIdx >= 0; pIdx--) {
          const pr = projectiles[pIdx];
          if (!pr.isPlayer) {
            const pDist = Math.hypot(pr.position.x - enemy.position.x, pr.position.y - enemy.position.y);
            if (pDist < 650) {
              projectiles.splice(pIdx, 1);
            }
          }
        }
      }

      // EMP Shockwave burst pushing surrounding entities
      for (let p = 0; p < 55; p++) {
        const pa = (p / 55) * Math.PI * 2;
        particles.push({
          x: enemy.position.x,
          y: enemy.position.y,
          vx: Math.cos(pa) * 280,
          vy: Math.sin(pa) * 280,
          color: '#f97316',
          size: 4.5,
          life: 0,
          maxLife: 0.75,
          alpha: 1.0,
          shape: 'spark',
        });
      }
    } else if (enemy.bossStage === 2 && enemy.hull <= 240) {
      enemy.bossStage = 3;
      enemy.color = '#ef4444'; // Crimson Singularity Overdrive
      enemy.secondaryColor = '#991b1b';
      enemy.weaponType = 'VORTEX_CANNON';
      enemy.singularityActive = true;
      enemy.maxShootCooldown = 1.6;
      // Grace Period: 4.5 seconds to evade singularity collapse
      enemy.phaseTransitionTimer = 4.5;
      enemy.shootCooldown = 4.5;
      result.bossStageChange = { stage: 3, name: '⚠️ PHASE III: SINGULARITY COLLAPSE — RETREAT TO SAFE DISTANCE! (4.5s)' };
      soundManager.playBossPhaseAdvance();
      soundManager.playSingularityVortex();
      result.screenShake = 26;

      // Repulsion burst
      if (ship) {
        const pushDx = ship.position.x - enemy.position.x;
        const pushDy = ship.position.y - enemy.position.y;
        const pushDist = Math.hypot(pushDx, pushDy) || 1;
        const repulsePower = 400;
        ship.velocity.x += (pushDx / pushDist) * repulsePower;
        ship.velocity.y += (pushDy / pushDist) * repulsePower;
        ship.shield = Math.min(ship.maxShield, ship.shield + 40);
      }

      if (projectiles) {
        for (let pIdx = projectiles.length - 1; pIdx >= 0; pIdx--) {
          const pr = projectiles[pIdx];
          if (!pr.isPlayer) {
            const pDist = Math.hypot(pr.position.x - enemy.position.x, pr.position.y - enemy.position.y);
            if (pDist < 650) {
              projectiles.splice(pIdx, 1);
            }
          }
        }
      }

      for (let p = 0; p < 70; p++) {
        const pa = (p / 70) * Math.PI * 2;
        particles.push({
          x: enemy.position.x,
          y: enemy.position.y,
          vx: Math.cos(pa) * 340,
          vy: Math.sin(pa) * 340,
          color: p % 2 === 0 ? '#ef4444' : '#a855f7',
          size: 5,
          life: 0,
          maxLife: 0.85,
          alpha: 1.0,
        });
      }
    }
  }

  // Impact sparks
  for (let p = 0; p < 12; p++) {
    const pa = Math.random() * Math.PI * 2;
    const ps = 40 + Math.random() * 100;
    particles.push({
      x: enemy.position.x,
      y: enemy.position.y,
      vx: Math.cos(pa) * ps,
      vy: Math.sin(pa) * ps,
      color: '#f87171',
      size: 2.2,
      life: 0,
      maxLife: 0.3,
      alpha: 1.0,
    });
  }

  // Check Death & trigger respawn
  if (enemy.hull <= 0 && enemy.state !== 'DEAD') {
    enemy.state = 'DEAD';
    enemy.respawnTimer = enemy.isBoss ? 999999 : 60.0;
    stats.hostilesDestroyed++;
    stats.finalScore += enemy.scoreValue;
    stats.flowMultiplier = Math.min(4.0, stats.flowMultiplier + (enemy.isBoss ? 1.5 : 0.6));
    result.hostileKilled = enemy;
    result.hostileShipDestroyed = enemy;

    if (enemy.isBoss) {
      result.bossDefeated = true;
      result.screenShake = 32;
      soundManager.playExplosion(3.2);
      soundManager.playBossPhaseAdvance();
    } else {
      soundManager.playExplosion(2.2);
    }

    // Huge fireworks explosion for ship kill
    const count = enemy.isBoss ? 90 : 45;
    for (let p = 0; p < count; p++) {
      const pa = Math.random() * Math.PI * 2;
      const ps = 60 + Math.random() * (enemy.isBoss ? 350 : 220);
      particles.push({
        x: enemy.position.x,
        y: enemy.position.y,
        vx: Math.cos(pa) * ps,
        vy: Math.sin(pa) * ps,
        color: Math.random() < 0.5 ? enemy.color : '#fde047',
        size: 3.5 + Math.random() * 4,
        life: 0,
        maxLife: enemy.isBoss ? 1.3 : 0.75,
        alpha: 1.0,
      });
    }
  }
}

export function calculateFinalScoreAndRating(stats: ExpeditionStats, survived: boolean) {
  if (!survived) {
    stats.rating = 'LOST';
    return;
  }

  let score = 1000;
  score += Math.round(stats.energyCollected * 8);
  score += stats.standardShardsCollected * 50;
  score += stats.richShardsCollected * 150;
  score += stats.gravityAssists * 100;
  if (stats.signalScanned) score += 500;
  score += stats.artifactsCollected * 450;
  score += stats.hostilesDestroyed * 250; // Combat rewards
  score += Math.round(stats.shieldDamageAbsorbed * 2);

  score -= Math.round(stats.damageTaken * 18);

  if (stats.timeElapsed < 240) {
    score += Math.round((240 - stats.timeElapsed) * 5);
  }

  stats.finalScore = Math.max(0, score);

  const energyRatio = stats.energySpent > 0 ? Math.min(1.5, stats.energyCollected / stats.energySpent) : 1;
  const damageFactor = Math.max(0, 1 - stats.damageTaken / 100);
  const timeFactor = Math.max(0.4, 1 - stats.timeElapsed / 600);
  const efficiency = Math.round((energyRatio * 0.35 + damageFactor * 0.45 + timeFactor * 0.2) * 100);
  stats.efficiencyPercent = Math.min(100, Math.max(10, efficiency));

  if (stats.damageTaken === 0 && stats.gravityAssists >= 2 && stats.efficiencyPercent >= 88) {
    stats.rating = 'S';
  } else if (stats.efficiencyPercent >= 80) {
    stats.rating = 'A+';
  } else if (stats.efficiencyPercent >= 68) {
    stats.rating = 'A';
  } else if (stats.efficiencyPercent >= 50) {
    stats.rating = 'B';
  } else {
    stats.rating = 'C';
  }
}
