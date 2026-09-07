import {
  Ship,
  MassNode,
  VoidPocket,
  EnergyShard,
  AncientSignal,
  ExtractionGate,
  Star,
  NebulaCloud,
  Particle,
  GameSettings,
  HostileShip,
  Projectile,
  DerelictStation,
  Asteroid,
} from '../types/game';

export interface Camera {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  zoom: number;
  shake: number;
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  ship: Ship,
  massNodes: MassNode[],
  voidPockets: VoidPocket[],
  shards: EnergyShard[],
  ancientSignal: AncientSignal,
  extractionGate: ExtractionGate,
  hostileShips: HostileShip[],
  projectiles: Projectile[],
  stars: Star[],
  nebulaClouds: NebulaCloud[],
  particles: Particle[],
  camera: Camera,
  settings: GameSettings,
  worldSize: { width: number; height: number },
  fps: number,
  derelicts?: DerelictStation[],
  asteroids?: Asteroid[]
) {
  // Clear canvas with deep void backdrop
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, width, height);

  ctx.save();

  // Apply Camera Transform
  const centerX = width / 2;
  const centerY = height / 2;

  // Shake offset
  const shakeX = (Math.random() - 0.5) * camera.shake;
  const shakeY = (Math.random() - 0.5) * camera.shake;

  ctx.translate(centerX + shakeX, centerY + shakeY);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // 1. Draw Deep Space Cosmic Nebulae
  renderNebulae(ctx, nebulaClouds, camera, width, height, worldSize);

  // 2. Draw Multi-Spectral Parallax Stars
  renderStars(ctx, stars, camera, width, height, worldSize);

  // 3. Draw World Boundary
  renderWorldBoundary(ctx, worldSize, ship);

  // 4. Draw Void Pockets
  renderVoidPockets(ctx, voidPockets);

  // 5. Draw Precursor Derelict Megastructures
  if (derelicts) {
    renderDerelicts(ctx, derelicts, ship);
  }

  // 6. Draw Drifting Crystalline Asteroids
  if (asteroids) {
    renderAsteroids(ctx, asteroids);
  }

  // 7. Draw Celestial Planets & Gravity Fields & Artifacts
  renderMassNodes(ctx, massNodes, settings.showGravityRings, ship);

  // 8. Draw Ancient Signal Relic
  renderAncientSignal(ctx, ancientSignal, ship);

  // 9. Draw Energy Shards
  renderShards(ctx, shards);

  // 10. Draw Extraction Gate
  renderExtractionGate(ctx, extractionGate);

  // 11. Draw Hostile Ships & Guardian Corvettes
  renderHostileShips(ctx, hostileShips, ship);

  // 12. Draw Projectiles & Weapon Munitions
  renderProjectiles(ctx, projectiles);

  // 13. Draw Velocity Trail & Trajectory Predictions & Particles
  renderVelocityTrail(ctx, ship);
  renderParticles(ctx, particles);

  if (settings.showTrajectory) {
    renderTrajectoryPrediction(ctx, ship, massNodes);
  }

  renderFlightAvionics(ctx, ship);
  renderShip(ctx, ship);

  // 14. Debug Vectors & Radii
  if (settings.debugMode) {
    renderDebugVisuals(ctx, ship, massNodes, voidPockets, ancientSignal, extractionGate, fps);
  }

  ctx.restore();

  // 15. Screen-Space Directional Extraction Gate Chevrons
  renderExtractionIndicator(ctx, width, height, camera, extractionGate.position, ship.position);

  // 16. Out-of-Bounds Emergency Containment Breach Warning & Strobe
  if (ship.isOutOfBounds) {
    renderOutOfBoundsWarning(ctx, width, height, ship, worldSize);
  }

  // 17. Tactical Mini-Map Radar (Supports Local, Sector, and Expanded Hologram)
  if (settings.showMiniMap) {
    renderMiniMap(
      ctx,
      width,
      height,
      ship,
      massNodes,
      voidPockets,
      shards,
      ancientSignal,
      extractionGate,
      hostileShips,
      projectiles,
      worldSize,
      settings.miniMapMode,
      derelicts,
      asteroids
    );
  }
}

/**
 * Deep Space Cosmic Nebulae: Ethereal interstellar gas filaments
 */
function renderNebulae(
  ctx: CanvasRenderingContext2D,
  nebulae: NebulaCloud[],
  camera: Camera,
  viewW: number,
  viewH: number,
  worldSize: { width: number; height: number }
) {
  if (!nebulae || nebulae.length === 0) return;

  ctx.save();
  for (const cloud of nebulae) {
    const parallax = 0.22;
    const nx = cloud.x + (camera.x - worldSize.width / 2) * (1 - parallax);
    const ny = cloud.y + (camera.y - worldSize.height / 2) * (1 - parallax);

    const r = cloud.radius;
    const viewHalfW = viewW / (2 * camera.zoom);
    const viewHalfH = viewH / (2 * camera.zoom);
    if (
      nx < camera.x - viewHalfW - r ||
      nx > camera.x + viewHalfW + r ||
      ny < camera.y - viewHalfH - r ||
      ny > camera.y + viewHalfH + r
    ) {
      continue;
    }

    ctx.save();
    ctx.translate(nx, ny);
    ctx.rotate(cloud.rotation);
    ctx.scale(cloud.scaleX, cloud.scaleY);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, cloud.radius);
    grad.addColorStop(0, cloud.color);
    grad.addColorStop(0.5, cloud.secondaryColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, cloud.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
  ctx.restore();
}

/**
 * Multi-Spectral Twinkling Parallax Starfield
 */
function renderStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  camera: Camera,
  viewW: number,
  viewH: number,
  worldSize: { width: number; height: number }
) {
  const time = performance.now() * 0.001;

  for (const star of stars) {
    const parallax = star.layer * 0.25;
    const sx = star.x + (camera.x - worldSize.width / 2) * (1 - parallax);
    const sy = star.y + (camera.y - worldSize.height / 2) * (1 - parallax);

    if (
      sx < camera.x - viewW / (2 * camera.zoom) - 50 ||
      sx > camera.x + viewW / (2 * camera.zoom) + 50 ||
      sy < camera.y - viewH / (2 * camera.zoom) - 50 ||
      sy > camera.y + viewH / (2 * camera.zoom) + 50
    ) {
      continue;
    }

    const twinkle = 0.75 + Math.sin(time * (star.twinkleSpeed || 1.5) + (star.twinklePhase || 0)) * 0.25;
    const alpha = Math.min(1.0, star.brightness * twinkle * (0.5 + star.layer * 0.25));

    ctx.fillStyle = star.color || '#ffffff';
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
    ctx.fill();

    // Diffraction spikes for hot bright stars
    if (star.hasSpikes && star.size > 1.8) {
      ctx.strokeStyle = star.color || '#93c5fd';
      ctx.lineWidth = 0.8;
      const spikeLen = star.size * 3.2;
      ctx.beginPath();
      ctx.moveTo(sx - spikeLen, sy);
      ctx.lineTo(sx + spikeLen, sy);
      ctx.moveTo(sx, sy - spikeLen);
      ctx.lineTo(sx, sy + spikeLen);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1.0;
}

function renderWorldBoundary(
  ctx: CanvasRenderingContext2D,
  worldSize: { width: number; height: number },
  ship?: Ship
) {
  ctx.save();
  const time = performance.now() * 0.001;
  const isBreached = ship?.isOutOfBounds;

  // Perimeter Grid Barrier
  ctx.strokeStyle = isBreached
    ? `rgba(239, 68, 68, ${0.4 + Math.sin(time * 8) * 0.3})`
    : 'rgba(56, 189, 248, 0.2)';
  ctx.lineWidth = isBreached ? 3.5 : 2;
  ctx.setLineDash(isBreached ? [8, 8] : [16, 16]);
  ctx.strokeRect(0, 0, worldSize.width, worldSize.height);

  // Corner warning beacon brackets
  const bracketLen = 60;
  ctx.strokeStyle = isBreached ? '#ef4444' : 'rgba(56, 189, 248, 0.6)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([]);

  // Top-left
  ctx.beginPath();
  ctx.moveTo(0, bracketLen);
  ctx.lineTo(0, 0);
  ctx.lineTo(bracketLen, 0);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(worldSize.width - bracketLen, 0);
  ctx.lineTo(worldSize.width, 0);
  ctx.lineTo(worldSize.width, bracketLen);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(0, worldSize.height - bracketLen);
  ctx.lineTo(0, worldSize.height);
  ctx.lineTo(bracketLen, worldSize.height);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(worldSize.width - bracketLen, worldSize.height);
  ctx.lineTo(worldSize.width, worldSize.height);
  ctx.lineTo(worldSize.width, worldSize.height - bracketLen);
  ctx.stroke();

  ctx.fillStyle = isBreached ? '#ef4444' : 'rgba(148, 163, 184, 0.45)';
  ctx.font = 'bold 11px "Space Mono", monospace';
  ctx.fillText('SECTOR CONTAINMENT GRID [ORIGIN 0:0]', 32, 42);
  ctx.fillText(
    `SECTOR CONTAINMENT BOUNDARY [${Math.round(worldSize.width)}:${Math.round(worldSize.height)}]`,
    worldSize.width - 340,
    worldSize.height - 30
  );
  ctx.restore();
}

function renderVoidPockets(ctx: CanvasRenderingContext2D, voidPockets: VoidPocket[]) {
  for (const vp of voidPockets) {
    vp.phase += 0.015;
    ctx.save();

    const grad = ctx.createRadialGradient(
      vp.position.x,
      vp.position.y,
      0,
      vp.position.x,
      vp.position.y,
      vp.radius
    );
    grad.addColorStop(0, 'rgba(15, 6, 28, 0.92)');
    grad.addColorStop(0.65, 'rgba(88, 28, 135, 0.28)');
    grad.addColorStop(1, 'rgba(147, 51, 234, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(vp.position.x, vp.position.y, vp.radius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle warping distortion perimeter
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.arc(vp.position.x, vp.position.y, vp.radius * (0.96 + Math.sin(vp.phase) * 0.04), 0, Math.PI * 2);
    ctx.stroke();

    // Inner cosmic eddy
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.15)';
    ctx.setLineDash([4, 16]);
    ctx.beginPath();
    ctx.arc(vp.position.x, vp.position.y, vp.radius * 0.5, vp.phase, vp.phase + Math.PI * 1.5);
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Enhanced Celestial Bodies with Archetype Rendering & 3-Orbit Artifact Rings
 */
function renderMassNodes(
  ctx: CanvasRenderingContext2D,
  massNodes: MassNode[],
  showRings: boolean,
  ship: Ship
) {
  const time = performance.now() * 0.001;

  for (const node of massNodes) {
    node.pulsePhase += 0.02;
    ctx.save();

    // 1. Concentric Gravitational Wave Field
    if (showRings) {
      const ringCount = 4;
      for (let i = 1; i <= ringCount; i++) {
        const ringFraction = i / ringCount;
        const ringR = node.radius + (node.gravityRadius - node.radius) * ringFraction;
        const waveOffset = Math.sin(node.pulsePhase - i * 0.6) * 4;

        ctx.strokeStyle = `rgba(56, 189, 248, ${0.03 + (1 - ringFraction) * 0.08})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.arc(node.position.x, node.position.y, ringR + waveOffset, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Atmospheric Glow Haze
    const fieldGrad = ctx.createRadialGradient(
      node.position.x,
      node.position.y,
      node.radius * 0.8,
      node.position.x,
      node.position.y,
      node.gravityRadius
    );
    fieldGrad.addColorStop(0, node.atmosphereColor || 'rgba(56, 189, 248, 0.2)');
    fieldGrad.addColorStop(0.4, 'rgba(30, 58, 138, 0.06)');
    fieldGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = fieldGrad;
    ctx.beginPath();
    ctx.arc(node.position.x, node.position.y, node.gravityRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Planet Rings (Back Side)
    if (node.hasRings && node.ringRadius) {
      renderPlanetRings(ctx, node, true);
    }

    // 3. Planet Core Rendering by Archetype
    renderPlanetCore(ctx, node, time);

    // 4. Planet Rings (Front Side)
    if (node.hasRings && node.ringRadius) {
      renderPlanetRings(ctx, node, false);
    }

    // 5. Planetary Ancient Artifact 3-Orbit Resonance Gauge
    if (node.artifact) {
      renderArtifactOrbitalResonance(ctx, node, ship, time);
    }

    ctx.restore();
  }
}

/**
 * Render detailed celestial surfaces based on archetype
 */
function renderPlanetCore(ctx: CanvasRenderingContext2D, node: MassNode, time: number) {
  const { x, y } = node.position;
  const r = node.radius;

  ctx.save();
  ctx.translate(x, y);

  // Atmospheric outer Rayleigh scattering limb
  const limbGrad = ctx.createRadialGradient(0, 0, r * 0.85, 0, 0, r * 1.35);
  limbGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  limbGrad.addColorStop(0.6, node.color);
  limbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = limbGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
  ctx.fill();

  // Clip to spherical disc
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  // Base spherical gradient
  const baseGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
  baseGrad.addColorStop(0, node.color);
  baseGrad.addColorStop(0.7, node.secondaryColor || '#0f172a');
  baseGrad.addColorStop(1, '#030712');

  ctx.fillStyle = baseGrad;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  // Archetype Surface Details
  ctx.rotate(node.rotationAngle);

  if (node.planetType === 'GAS_GIANT') {
    // Dynamic swirling storm bands
    const bandCount = 7;
    for (let b = -bandCount; b <= bandCount; b++) {
      const by = (b / bandCount) * r * 0.85;
      const bandHeight = (r / bandCount) * 0.7;
      const bandOffset = Math.sin(b * 1.2 + time * 0.4) * 6;

      ctx.fillStyle = b % 2 === 0 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.rect(-r, by + bandOffset, r * 2, bandHeight);
      ctx.fill();
    }

    // Great atmospheric storm spot
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.beginPath();
    ctx.ellipse(r * 0.3, r * 0.2, r * 0.28, r * 0.14, 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (node.planetType === 'TERRESTRIAL') {
    // Continental landmasses and swirling cloud belts
    ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.2, -r * 0.1, r * 0.4, r * 0.3, 0.3, 0, Math.PI * 2);
    ctx.ellipse(r * 0.3, r * 0.25, r * 0.35, r * 0.25, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // White cloud swirls
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(-r * 0.1, -r * 0.2, r * 0.5, 0, Math.PI * 0.8);
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (node.planetType === 'LAVA_CORE') {
    // Glowing magma fissures
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.2);
    ctx.lineTo(-r * 0.1, 0);
    ctx.lineTo(r * 0.4, -r * 0.3);
    ctx.moveTo(-r * 0.3, r * 0.4);
    ctx.lineTo(r * 0.2, r * 0.2);
    ctx.lineTo(r * 0.6, r * 0.5);
    ctx.stroke();
  } else if (node.planetType === 'ICE_WORLD') {
    // Crystalline glacier trenches
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.3);
    ctx.lineTo(0, -r * 0.5);
    ctx.lineTo(r * 0.6, -r * 0.2);
    ctx.moveTo(-r * 0.5, r * 0.3);
    ctx.lineTo(0, r * 0.5);
    ctx.lineTo(r * 0.5, r * 0.2);
    ctx.stroke();
  } else if (node.planetType === 'PULSAR') {
    // Blazing energy core
    const corePulse = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    corePulse.addColorStop(0, '#ffffff');
    corePulse.addColorStop(0.5, '#c084fc');
    corePulse.addColorStop(1, '#581c87');
    ctx.fillStyle = corePulse;
    ctx.fillRect(-r, -r, r * 2, r * 2);
  }

  // 3D Volumetric Terminator Shadow (Limb illumination)
  const shadowGrad = ctx.createRadialGradient(r * 0.35, -r * 0.35, r * 0.4, 0, 0, r);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shadowGrad.addColorStop(0.55, 'rgba(3, 7, 18, 0.45)');
  shadowGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');

  ctx.fillStyle = shadowGrad;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  ctx.restore();

  // Core crisp outline
  ctx.save();
  ctx.strokeStyle = node.color;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  // Planet Name Tag
  ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
  ctx.font = '10px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(node.name.toUpperCase(), x, y + r + 20);

  ctx.restore();
}

/**
 * 3D Planetary Ring system with tilt and planet occlusion
 */
function renderPlanetRings(
  ctx: CanvasRenderingContext2D,
  node: MassNode,
  renderBack: boolean
) {
  const { x, y } = node.position;
  const outerR = node.ringRadius || node.radius * 2.2;
  const innerR = node.radius * 1.35;
  const tilt = node.ringTilt || 0.3;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(1.0, 0.32);

  ctx.beginPath();
  if (renderBack) {
    ctx.rect(-outerR * 1.2, -outerR * 1.2, outerR * 2.4, outerR * 1.2);
  } else {
    ctx.rect(-outerR * 1.2, 0, outerR * 2.4, outerR * 1.2);
  }
  ctx.clip();

  const ringGrad = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
  ringGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  ringGrad.addColorStop(0.2, `${node.color}55`);
  ringGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
  ringGrad.addColorStop(0.8, `${node.color}44`);
  ringGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(0, 0, outerR, 0, Math.PI * 2);
  ctx.arc(0, 0, innerR, 0, Math.PI * 2, true);
  ctx.fill();

  ctx.restore();
}

/**
 * Planetary Artifact 3-Orbit Resonance Gauge Ring & Tether
 */
function renderArtifactOrbitalResonance(
  ctx: CanvasRenderingContext2D,
  node: MassNode,
  ship: Ship,
  time: number
) {
  const artifact = node.artifact;
  if (!artifact) return;

  // Once fully dissolved into the ship, the relic has transcended - clean orbital path
  if (artifact.isDissolved) {
    // Render a faint, sublime stardust remnant on the planet's orbit
    const { x, y } = node.position;
    const orbitRadius = node.radius + (node.gravityRadius - node.radius) * 0.45;
    ctx.save();
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 12]);
    ctx.beginPath();
    ctx.arc(x, y, orbitRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const { x, y } = node.position;
  const orbitRadius = node.radius + (node.gravityRadius - node.radius) * 0.45;
  const isCollected = artifact.isCollected;
  const dissolveProg = artifact.dissolveProgress || 0;
  const dissolveAlpha = isCollected ? Math.max(0, 1 - dissolveProg) : 1.0;

  ctx.save();

  // 1. Orbital Ring Track
  ctx.strokeStyle = isCollected
    ? `rgba(74, 222, 128, ${0.35 * dissolveAlpha})`
    : 'rgba(251, 191, 36, 0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(x, y, orbitRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 2. 3-Orbit Progress Arc Segments (Only visible while synchronizing)
  if (!isCollected) {
    const totalOrbits = 3;
    for (let o = 0; o < totalOrbits; o++) {
      const startA = (o / totalOrbits) * Math.PI * 2 - Math.PI / 2;
      const endA = ((o + 1) / totalOrbits) * Math.PI * 2 - Math.PI / 2 - 0.08;

      const isDone = artifact.completedOrbits > o;
      const isCurrent = artifact.completedOrbits === o;

      ctx.save();
      ctx.setLineDash([]);
      ctx.lineWidth = isCurrent ? 4.5 : 3.0;

      if (isDone) {
        ctx.strokeStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(x, y, orbitRadius, startA, endA);
        ctx.stroke();
      } else if (isCurrent) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, orbitRadius, startA, endA);
        ctx.stroke();

        const currentOrbitProg = (artifact.accumulatedAngle % (Math.PI * 2)) / (Math.PI * 2);
        const curEndA = startA + (endA - startA) * currentOrbitProg;

        ctx.strokeStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(x, y, orbitRadius, startA, curEndA);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 3. Artifact Relic Beacon Geometry floating on the orbital path
  const relicAngle = time * 0.35;
  const relicX = x + Math.cos(relicAngle) * orbitRadius;
  const relicY = y + Math.sin(relicAngle) * orbitRadius;

  ctx.save();
  ctx.translate(relicX, relicY);

  if (isCollected) {
    // TRANSCENDENCE DISSOLUTION SEQUENCE: Expands into blinding starlight nova and dissolves
    const expScale = 1.0 + dissolveProg * 2.8;
    ctx.scale(expScale, expScale);
    ctx.globalAlpha = dissolveAlpha;

    // A. Expanding Golden Supernova Shockwave
    const shockR = 12 + dissolveProg * 65;
    ctx.strokeStyle = `rgba(253, 224, 71, ${dissolveAlpha * 0.8})`;
    ctx.lineWidth = 2.5 * (1 - dissolveProg);
    ctx.beginPath();
    ctx.arc(0, 0, shockR, 0, Math.PI * 2);
    ctx.stroke();

    // B. Radiant Starlight Spikes (12 Prismatic Beams)
    const spikeCount = 12;
    for (let s = 0; s < spikeCount; s++) {
      const sa = (s / spikeCount) * Math.PI * 2 + time * 3;
      const sLen = (20 + Math.sin(time * 6 + s) * 8) * (1 + dissolveProg * 1.5);
      ctx.strokeStyle = s % 2 === 0 ? `rgba(254, 240, 138, ${dissolveAlpha})` : `rgba(74, 222, 128, ${dissolveAlpha})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sa) * sLen, Math.sin(sa) * sLen);
      ctx.stroke();
    }

    // C. Dissolving sacred cage fragmenting
    ctx.rotate(-time * 2.5);
    ctx.strokeStyle = `rgba(250, 204, 21, ${dissolveAlpha})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(-12, -12, 24, 24);

    // D. White-hot transcendent core
    ctx.fillStyle = `rgba(255, 255, 255, ${dissolveAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, 8 * (1 - dissolveProg * 0.5), 0, Math.PI * 2);
    ctx.fill();

  } else {
    // STANDARD ACTIVE ORBIT BEACON
    // Volumetric Pulsing Energy Core & Harmonic Distortion Rings
    const auraSize = 22 + Math.sin(time * 3) * 4;
    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, auraSize);
    aura.addColorStop(0, 'rgba(251, 191, 36, 0.75)');
    aura.addColorStop(0.5, 'rgba(245, 158, 11, 0.3)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
    ctx.fill();

    // Expanding harmonic resonance wave
    const waveR = 8 + (time * 18) % 24;
    const waveAlpha = Math.max(0, 1 - waveR / 32);
    ctx.strokeStyle = `rgba(251, 191, 36, ${waveAlpha * 0.7})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, waveR, 0, Math.PI * 2);
    ctx.stroke();

    // A. Outer Sacred Precursor Cage (Counter-Clockwise Rotation)
    ctx.save();
    ctx.rotate(-time * 1.2);
    ctx.strokeStyle = '#fef08a';
    ctx.fillStyle = 'rgba(120, 53, 15, 0.65)';
    ctx.lineWidth = 1.8;
    const cagePoints = 8;
    ctx.beginPath();
    for (let s = 0; s < cagePoints; s++) {
      const a = (s / cagePoints) * Math.PI * 2;
      const rad = s % 2 === 0 ? 14 : 9;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // B. Inner Crystalline Octahedron Prism (Clockwise Rotation)
    ctx.save();
    ctx.rotate(time * 2.0);
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6.5, 0);
    ctx.lineTo(0, 9);
    ctx.lineTo(-6.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Brilliant crystal nucleus facet
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1.5, -1.5, 3, 3);
    ctx.restore();

    // C. Orbiting Quantum Micro-Motes (3 particulate satellites)
    for (let m = 0; m < 3; m++) {
      const moteA = time * 2.4 + (m * Math.PI * 2) / 3;
      const moteDist = 17 + Math.sin(time * 3 + m) * 2;
      const mx = Math.cos(moteA) * moteDist;
      const my = Math.sin(moteA) * moteDist;

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(mx, my, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  // 4. Status HUD Label
  const distToShip = Math.hypot(ship.position.x - x, ship.position.y - y);
  if (distToShip < node.gravityRadius * 1.1) {
    ctx.save();
    ctx.textAlign = 'center';

    if (isCollected) {
      ctx.fillStyle = `rgba(74, 222, 128, ${dissolveAlpha})`;
      ctx.font = 'bold 11px "Space Mono", monospace';
      ctx.fillText(`✓ ${artifact.name} SYNCHRONIZED & TRANSCENDING`, x, y - orbitRadius - 14);

      // Energy stream tether to ship during transcendence
      ctx.strokeStyle = `rgba(250, 204, 21, ${dissolveAlpha * 0.7})`;
      ctx.lineWidth = 2.0;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(relicX, relicY);
      ctx.lineTo(ship.position.x, ship.position.y);
      ctx.stroke();
    } else {
      const pct = Math.round(artifact.resonancePercent * 100);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 11px "Space Mono", monospace';
      ctx.fillText(
        `◈ ${artifact.name.toUpperCase()} [ORBIT ${artifact.completedOrbits}/3 - ${pct}%]`,
        x,
        y - orbitRadius - 14
      );

      // Active resonance tether to ship
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(relicX, relicY);
      ctx.lineTo(ship.position.x, ship.position.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

function renderAncientSignal(ctx: CanvasRenderingContext2D, signal: AncientSignal, ship: Ship) {
  ctx.save();
  const { x, y } = signal.position;
  const time = performance.now() * 0.001;

  // 1. Scan Proximity Range Zone
  ctx.strokeStyle = signal.scanned ? 'rgba(74, 222, 128, 0.25)' : 'rgba(192, 132, 252, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(x, y, signal.scanRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Harmonic Signal Broadcast Waves
  const wave = (signal.pulsePhase % Math.PI) / Math.PI;
  ctx.strokeStyle = signal.scanned
    ? `rgba(74, 222, 128, ${0.3 * (1 - wave)})`
    : `rgba(192, 132, 252, ${0.45 * (1 - wave)})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, signal.scanRadius * wave, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Central Transponder Relic Housing
  ctx.save();
  ctx.translate(x, y);

  // Outer Rotating Antenna Diamond
  ctx.rotate(signal.pulsePhase * 0.35);
  ctx.strokeStyle = signal.scanned ? '#4ade80' : '#c084fc';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.rect(-16, -16, 32, 32);
  ctx.stroke();

  // Inner Counter-Rotating Prismatic Frame
  ctx.rotate(-signal.pulsePhase * 0.7);
  ctx.strokeStyle = signal.scanned ? '#86efac' : '#e9d5ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(12, 0);
  ctx.lineTo(0, 12);
  ctx.lineTo(-12, 0);
  ctx.closePath();
  ctx.stroke();

  // Luminous Core Crystal
  ctx.fillStyle = signal.scanned ? '#4ade80' : '#a855f7';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 4. Holographic Beacon Identifier Label
  const distToShip = Math.hypot(ship.position.x - x, ship.position.y - y);
  if (distToShip < signal.scanRadius * 2.2) {
    ctx.save();
    ctx.textAlign = 'center';

    if (signal.scanned) {
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 10px "Space Mono", monospace';
      ctx.fillText('✓ ANCIENT TELEMETRY DECODED [+750 PTS]', x, y - 28);
    } else {
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 11px "Space Mono", monospace';
      ctx.fillText('◈ ANCIENT SIGNAL BEACON', x, y - 32);
      ctx.fillStyle = '#e9d5ff';
      ctx.font = '9px "Space Mono", monospace';
      ctx.fillText('HOLD WITHIN 160m TO DECODE DEEP-SPACE TELEMETRY', x, y - 18);
    }
    ctx.restore();
  }

  // 5. Active Signal Scan Progress Ring on Ship
  if (!signal.scanned && ship.scanningSignalId === signal.id && ship.scanProgress > 0) {
    ctx.save();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(
      ship.position.x,
      ship.position.y,
      ship.radius + 15,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * ship.scanProgress
    );
    ctx.stroke();

    ctx.fillStyle = '#e9d5ff';
    ctx.font = 'bold 11px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`DECODING TELEMETRY ${Math.round(ship.scanProgress * 100)}%`, ship.position.x, ship.position.y - ship.radius - 22);
    ctx.restore();
  }
  ctx.restore();
}

function renderShards(ctx: CanvasRenderingContext2D, shards: EnergyShard[]) {
  for (const shard of shards) {
    if (shard.collected) continue;

    ctx.save();
    const { x, y } = shard.position;
    const isRich = shard.type === 'RICH';

    const grad = ctx.createRadialGradient(x, y, 0, x, y, shard.radius * 2.5);
    grad.addColorStop(0, isRich ? 'rgba(251, 191, 36, 0.45)' : 'rgba(56, 189, 248, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, shard.radius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y);
    ctx.rotate(shard.pulsePhase * 0.8);

    ctx.fillStyle = isRich ? '#fef08a' : '#e0f2fe';
    ctx.strokeStyle = isRich ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = isRich ? 2.0 : 1.5;

    ctx.beginPath();
    if (isRich) {
      const s = shard.radius;
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.35, -s * 0.35);
      ctx.lineTo(s, 0);
      ctx.lineTo(s * 0.35, s * 0.35);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.35, s * 0.35);
      ctx.lineTo(-s, 0);
      ctx.lineTo(-s * 0.35, -s * 0.35);
      ctx.closePath();
    } else {
      const s = shard.radius;
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.7, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.7, 0);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

function renderExtractionGate(ctx: CanvasRenderingContext2D, gate: ExtractionGate) {
  gate.ringAngle += 0.02;
  gate.pulsePhase += 0.03;

  ctx.save();
  const { x, y } = gate.position;

  const auraGrad = ctx.createRadialGradient(x, y, gate.radius * 0.4, x, y, gate.radius * 2.2);
  auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
  auraGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.15)');
  auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(x, y, gate.radius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(gate.ringAngle);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.setLineDash([24, 14]);
  ctx.beginPath();
  ctx.arc(0, 0, gate.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-gate.ringAngle * 1.4);
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([16, 10]);
  ctx.beginPath();
  ctx.arc(0, 0, gate.radius * 0.68, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, gate.radius * 0.45);
  coreGrad.addColorStop(0, '#f0f9ff');
  coreGrad.addColorStop(0.4, '#38bdf8');
  coreGrad.addColorStop(1, '#0369a1');

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(x, y, gate.radius * 0.45 + Math.sin(gate.pulsePhase) * 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderHostileShips(ctx: CanvasRenderingContext2D, hostileShips: HostileShip[], playerShip: Ship) {
  for (const enemy of hostileShips) {
    // If boss is waiting for all relics, remain completely hidden
    if (enemy.dormantUntilRelicsCollected) {
      continue;
    }

    // 1. If Dead: Render Respawn Beacon & 60s Countdown Marker
    if (enemy.state === 'DEAD') {
      ctx.save();
      const { x, y } = enemy.spawnOrigin;
      const progress = 1 - enemy.respawnTimer / enemy.respawnMaxTime; // 0 to 1

      // Ethereal quantum respawn hologram
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(x, y, enemy.radius * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // Progress Arc
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(x, y, enemy.radius * 1.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();

      // Countdown Text
      ctx.fillStyle = 'rgba(254, 202, 202, 0.85)';
      ctx.font = '10px "Space Mono", monospace';
      ctx.textAlign = 'center';
      const secLeft = Math.ceil(enemy.respawnTimer);
      ctx.fillText(`RESPAWN ${secLeft}s`, x, y + enemy.radius * 1.5 + 14);

      ctx.restore();
      continue;
    }

    // 2. Alive Hostile Ship
    ctx.save();
    ctx.translate(enemy.position.x, enemy.position.y);
    ctx.rotate(enemy.rotation);

    const r = enemy.radius;
    const isAggro = enemy.state === 'COMBAT';

    // Warp-in Arrival Effect
    if (enemy.warpInTimer > 0) {
      const warpAlpha = enemy.warpInTimer;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${warpAlpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r * (1 + warpAlpha * 1.5), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Hostile Shield Bubble
    if (enemy.shield > 0) {
      ctx.save();
      const shieldRatio = enemy.shield / enemy.maxShield;
      const pulse = enemy.shieldImpactPulse ? enemy.shieldImpactPulse * 0.4 : 0;

      ctx.strokeStyle = enemy.shieldImpactPulse && enemy.shieldImpactPulse > 0.1
        ? `rgba(248, 113, 113, ${0.7 + pulse})`
        : `rgba(56, 189, 248, ${0.35 * shieldRatio})`;
      ctx.lineWidth = enemy.shieldImpactPulse && enemy.shieldImpactPulse > 0.1 ? 2.5 : 1.5;

      ctx.fillStyle = enemy.shieldImpactPulse && enemy.shieldImpactPulse > 0.1
        ? 'rgba(239, 68, 68, 0.15)'
        : 'rgba(56, 189, 248, 0.08)';

      ctx.beginPath();
      ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Engine Thruster Glow
    ctx.save();
    const thrustGrad = ctx.createRadialGradient(-r * 1.2, 0, 0, -r * 1.2, 0, r * 1.3);
    thrustGrad.addColorStop(0, enemy.color);
    thrustGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = thrustGrad;
    ctx.beginPath();
    ctx.arc(-r * 1.1, 0, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Unique Ship Hull Archetype Geometry
    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';

    if (enemy.isBoss) {
      // APEX DREADNOUGHT: CHIMERA-0
      // Heavy Citadel Battleship with forward prow, flank sponsons & phase core
      ctx.beginPath();
      ctx.moveTo(r * 1.5, 0); // Forward dreadnought ram
      ctx.lineTo(r * 0.9, r * 0.4);
      ctx.lineTo(r * 0.4, r * 1.1); // Heavy left wing sponson
      ctx.lineTo(-r * 0.4, r * 1.2);
      ctx.lineTo(-r * 1.2, r * 0.7); // Rear engine block
      ctx.lineTo(-r * 0.9, 0);
      ctx.lineTo(-r * 1.2, -r * 0.7);
      ctx.lineTo(-r * 0.4, -r * 1.2);
      ctx.lineTo(r * 0.4, -r * 1.1); // Heavy right wing sponson
      ctx.lineTo(r * 0.9, -r * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Armor plating lines & panel grooves
      ctx.strokeStyle = enemy.secondaryColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(r * 0.8, 0);
      ctx.lineTo(0, r * 0.7);
      ctx.lineTo(-r * 0.7, r * 0.4);
      ctx.moveTo(r * 0.8, 0);
      ctx.lineTo(0, -r * 0.7);
      ctx.lineTo(-r * 0.7, -r * 0.4);
      ctx.stroke();

      // Forward Tachyon Lance Emitters on prow
      if (enemy.bossStage && enemy.bossStage >= 2) {
        ctx.fillStyle = '#f97316';
        ctx.fillRect(r * 1.1, -3, r * 0.4, 6);
      }

      // Phase 3: Core Singularity Distortion
      if (enemy.bossStage === 3) {
        const singPulse = Math.sin(performance.now() * 0.008) * 3;
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(0, 0, 12 + singPulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 18 + singPulse * 1.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (enemy.type === 'GATE_GUARDIAN' || enemy.type === 'HEAVY_CRUISER') {
      // Heavy Dreadnought / Cruiser: Octagonal armored dreadnought with wing sponsons
      ctx.beginPath();
      ctx.moveTo(r * 1.3, 0);
      ctx.lineTo(r * 0.4, r * 0.9);
      ctx.lineTo(-r * 0.5, r * 1.1);
      ctx.lineTo(-r * 1.1, r * 0.6);
      ctx.lineTo(-r * 0.8, 0);
      ctx.lineTo(-r * 1.1, -r * 0.6);
      ctx.lineTo(-r * 0.5, -r * 1.1);
      ctx.lineTo(r * 0.4, -r * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Armor Plating lines
      ctx.strokeStyle = enemy.secondaryColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(r * 0.6, 0);
      ctx.lineTo(-r * 0.4, r * 0.5);
      ctx.moveTo(r * 0.6, 0);
      ctx.lineTo(-r * 0.4, -r * 0.5);
      ctx.stroke();
    } else if (enemy.type === 'SNIPER_CORVETTE') {
      // Sniper Corvette: Sleek needle-nosed interceptor with long magnetic rail cannon
      ctx.beginPath();
      ctx.moveTo(r * 1.7, 0); // Extended rail barrel
      ctx.lineTo(-r * 0.7, r * 0.75);
      ctx.lineTo(-r * 0.4, 0);
      ctx.lineTo(-r * 0.7, -r * 0.75);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rail Accelerator Rails
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(r * 0.2, -2.5);
      ctx.lineTo(r * 1.6, -2.5);
      ctx.moveTo(r * 0.2, 2.5);
      ctx.lineTo(r * 1.6, 2.5);
      ctx.stroke();
    } else {
      // Drone Sentry: Aggressive stealth delta-wing
      ctx.beginPath();
      ctx.moveTo(r * 1.2, 0);
      ctx.lineTo(-r * 0.8, r * 0.85);
      ctx.lineTo(-r * 0.3, 0);
      ctx.lineTo(-r * 0.8, -r * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Core Power Crystal Visor
    ctx.fillStyle = isAggro ? '#ef4444' : enemy.color;
    ctx.beginPath();
    ctx.arc(r * 0.15, 0, Math.max(2, r * 0.25), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // end ship rotation

    // Render Boss Barrier Drones
    if (enemy.isBoss && enemy.barrierDrones) {
      for (const drone of enemy.barrierDrones) {
        if (!drone.alive) continue;
        const drX = enemy.position.x + Math.cos(drone.angle) * drone.distance;
        const drY = enemy.position.y + Math.sin(drone.angle) * drone.distance;

        // Energy tether
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.0;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(enemy.position.x, enemy.position.y);
        ctx.lineTo(drX, drY);
        ctx.stroke();

        // Drone satellite
        ctx.translate(drX, drY);
        ctx.rotate(drone.angle + Math.PI / 2);

        // Deflector shield arc
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(0, 0, 14, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        // Drone core
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(0, 5);
        ctx.lineTo(-6, 0);
        ctx.lineTo(0, -5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 3. Tactical Health & Shield Over-Head Bar (Screen Oriented)
    const barW = enemy.isBoss ? 160 : Math.max(34, enemy.radius * 2.2);
    const barH = enemy.isBoss ? 5 : 3.5;
    const barX = enemy.position.x - barW / 2;
    const barY = enemy.position.y - enemy.radius - (enemy.isBoss ? 28 : 18);

    ctx.save();
    // Background bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH * 2 + 3);

    // Hull Bar (Red/Green)
    const hullRatio = Math.max(0, enemy.hull / enemy.maxHull);
    ctx.fillStyle = enemy.isBoss ? '#ef4444' : hullRatio > 0.4 ? '#ef4444' : '#dc2626';
    ctx.fillRect(barX, barY + barH + 1, barW * hullRatio, barH);

    // Shield Bar (Cyan)
    if (enemy.maxShield > 0) {
      const sRatio = Math.max(0, enemy.shield / enemy.maxShield);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(barX, barY, barW * sRatio, barH);
    }

    // Hostile Name & Aggro State
    if (enemy.isBoss) {
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 9px "Space Mono", monospace';
      ctx.textAlign = 'center';
      const stageText = enemy.bossStage === 1 ? 'PHASE I' : enemy.bossStage === 2 ? 'PHASE II [OVERDRIVE]' : 'PHASE III [SINGULARITY]';
      ctx.fillText(`⚠️ ${enemy.name.toUpperCase()} [${stageText}]`, enemy.position.x, barY - 5);
    } else if (isAggro) {
      ctx.fillStyle = '#f87171';
      ctx.font = '8px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`AGGRO`, enemy.position.x, barY - 4);
    }
    ctx.restore();

    // 4. Boss Phase Transition Overload Charging Aura & Countdown
    if (enemy.isBoss && enemy.phaseTransitionTimer && enemy.phaseTransitionTimer > 0) {
      ctx.save();
      const chargeRatio = enemy.phaseTransitionTimer / 4.5;
      const chargeRadius = enemy.radius * 1.8 + (1 - chargeRatio) * 70;
      ctx.strokeStyle = enemy.bossStage === 2 ? '#f97316' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(enemy.position.x, enemy.position.y, chargeRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Flashing warning text
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 11px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠️ CORE OVERDRIVE: ${enemy.phaseTransitionTimer.toFixed(1)}s (FALL BACK!)`, enemy.position.x, enemy.position.y + enemy.radius + 24);
      ctx.restore();
    }
  }
}

function renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
  for (const proj of projectiles) {
    ctx.save();
    ctx.translate(proj.position.x, proj.position.y);
    ctx.rotate(proj.rotation);

    const isPlayer = proj.isPlayer;

    if (proj.type === 'PULSE_LASER') {
      // Pulse Laser: Luminous energy bolt
      ctx.fillStyle = proj.color;
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.ellipse(0, 0, proj.radius * 2.8, proj.radius * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Core white laser beam
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, proj.radius * 1.6, proj.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.type === 'HEAT_SEEKER') {
      // Heat Seeker: Micro-missile with fiery trail
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = proj.color;
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(proj.radius * 1.6, 0);
      ctx.lineTo(-proj.radius * 1.2, proj.radius * 0.7);
      ctx.lineTo(-proj.radius * 0.7, 0);
      ctx.lineTo(-proj.radius * 1.2, -proj.radius * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rocket engine flare
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(-proj.radius * 1.1, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.type === 'AREA_MISSILE') {
      // Area Missile: Heavy EMP flak torpedo with pulsating field
      ctx.strokeStyle = proj.color;
      ctx.lineWidth = 2.0;
      ctx.fillStyle = '#0f172a';

      ctx.beginPath();
      ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Concentric EMP rings
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius * 1.8, 0, Math.PI * 2);
      ctx.stroke();
    } else if (proj.type === 'SNIPER') {
      // Sniper: Supersonic kinetic slug with piercing ionization wake
      ctx.fillStyle = '#34d399';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;

      // Needle slug
      ctx.beginPath();
      ctx.moveTo(proj.radius * 4.5, 0);
      ctx.lineTo(-proj.radius * 3.5, proj.radius * 0.8);
      ctx.lineTo(-proj.radius * 1.5, 0);
      ctx.lineTo(-proj.radius * 3.5, -proj.radius * 0.8);
      ctx.closePath();
      ctx.fill();

      // Ionization tracer line
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-proj.radius * 2, 0);
      ctx.lineTo(-proj.radius * 18, 0);
      ctx.stroke();
    } else if (proj.type === 'TACHYON_BEAM') {
      // Tachyon Arc-Lance: Blinding hyper-velocity lance beam
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.ellipse(0, 0, proj.radius * 6.0, proj.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Blinding white inner core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, proj.radius * 4.0, proj.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Energy discharge prongs
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-proj.radius * 3, 0);
      ctx.lineTo(-proj.radius * 14, 0);
      ctx.stroke();
    } else if (proj.type === 'VORTEX_CANNON') {
      // Singularity Vortex Cannon: Event horizon sphere with orbiting accretion disk
      const time = performance.now() * 0.01;

      // Accretion disk halo
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius * 1.7 + Math.sin(time) * 2, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary spinning ring
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius * 2.3 + Math.cos(time * 1.5) * 2, 0, Math.PI * 2);
      ctx.stroke();

      // Pitch black event horizon
      ctx.fillStyle = '#030712';
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Gravitational lensing rim
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    ctx.restore();
  }
}

function renderVelocityTrail(ctx: CanvasRenderingContext2D, ship: Ship) {
  const currentSpeed = Math.hypot(ship.velocity.x, ship.velocity.y);

  // Twin Wingtip Aerodynamic Slipstream Vortices (intensify with speed)
  if (currentSpeed > 70 && ship.trail.length >= 3) {
    ctx.save();
    const perpX = -Math.sin(ship.rotation);
    const perpY = Math.cos(ship.rotation);
    const wingOffset = ship.radius * 0.75;
    const vortexAlpha = Math.min(0.65, (currentSpeed - 70) / 220);

    for (const side of [-1, 1]) {
      ctx.strokeStyle = `rgba(56, 189, 248, ${vortexAlpha})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      const tipX = ship.position.x + perpX * wingOffset * side;
      const tipY = ship.position.y + perpY * wingOffset * side;
      ctx.moveTo(tipX, tipY);

      const lookback = Math.min(8, ship.trail.length);
      for (let i = 0; i < lookback; i++) {
        const pt = ship.trail[i];
        ctx.lineTo(pt.x + perpX * wingOffset * side * (1 - i / lookback), pt.y + perpY * wingOffset * side * (1 - i / lookback));
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  if (ship.trail.length < 2) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 6.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(ship.trail[0].x, ship.trail[0].y);
  for (let i = 1; i < ship.trail.length; i++) {
    ctx.lineTo(ship.trail[i].x, ship.trail[i].y);
  }
  ctx.stroke();

  for (let i = 0; i < ship.trail.length - 1; i++) {
    const p1 = ship.trail[i];
    const p2 = ship.trail[i + 1];
    const progress = 1 - i / ship.trail.length;

    ctx.strokeStyle = `rgba(56, 189, 248, ${p1.alpha * 0.65})`;
    ctx.lineWidth = Math.max(1.2, progress * 3.5);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  ctx.restore();
}

function renderTrajectoryPrediction(
  ctx: CanvasRenderingContext2D,
  ship: Ship,
  massNodes: MassNode[]
) {
  const currentSpeed = Math.hypot(ship.velocity.x, ship.velocity.y);
  if (currentSpeed < 12) return;

  const simSteps = 28;
  const simDt = 0.08;

  let simX = ship.position.x;
  let simY = ship.position.y;
  let simVx = ship.velocity.x;
  let simVy = ship.velocity.y;

  const points: { x: number; y: number; isHazard: boolean }[] = [{ x: simX, y: simY, isHazard: false }];
  let hazardDetected = false;

  for (let s = 0; s < simSteps; s++) {
    for (const node of massNodes) {
      const dx = node.position.x - simX;
      const dy = node.position.y - simY;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      if (dist < node.gravityRadius) {
        const effDistSq = Math.max(distSq, 2800);
        let force = (0.85 * node.mass) / effDistSq;
        const falloff = Math.max(0, 1 - Math.pow(dist / node.gravityRadius, 2));
        force = Math.min(force * falloff, 320);

        const normX = dx / (dist || 1);
        const normY = dy / (dist || 1);
        simVx += normX * force * simDt;
        simVy += normY * force * simDt;

        if (dist < node.radius + 18) {
          hazardDetected = true;
        }
      }
    }

    simX += simVx * simDt;
    simY += simVy * simDt;
    points.push({ x: simX, y: simY, isHazard: hazardDetected });
  }

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 0; i < points.length - 1; i++) {
    const pt1 = points[i];
    const pt2 = points[i + 1];
    const alpha = (1 - i / points.length) * 0.75;

    ctx.strokeStyle = pt2.isHazard
      ? `rgba(248, 113, 113, ${alpha})`
      : `rgba(56, 189, 248, ${alpha})`;
    ctx.lineWidth = Math.max(1, (1 - i / points.length) * 2.2);
    ctx.setLineDash([6, 6]);

    ctx.beginPath();
    ctx.moveTo(pt1.x, pt1.y);
    ctx.lineTo(pt2.x, pt2.y);
    ctx.stroke();
  }

  ctx.restore();
}

function renderFlightAvionics(ctx: CanvasRenderingContext2D, ship: Ship) {
  const currentSpeed = Math.hypot(ship.velocity.x, ship.velocity.y);
  const facingX = Math.cos(ship.rotation);
  const facingY = Math.sin(ship.rotation);

  ctx.save();

  // 1. Nose Sightline
  const noseLineLen = 42;
  const noseStartX = ship.position.x + facingX * (ship.radius * 1.2);
  const noseStartY = ship.position.y + facingY * (ship.radius * 1.2);
  const noseEndX = ship.position.x + facingX * (ship.radius + noseLineLen);
  const noseEndY = ship.position.y + facingY * (ship.radius + noseLineLen);

  ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(noseStartX, noseStartY);
  ctx.lineTo(noseEndX, noseEndY);
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(noseEndX, noseEndY, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 2. Prograde Flight Reticle
  if (currentSpeed > 10) {
    const velAngle = Math.atan2(ship.velocity.y, ship.velocity.x);
    const velNormX = ship.velocity.x / currentSpeed;
    const velNormY = ship.velocity.y / currentSpeed;

    const reticleDist = Math.min(130, Math.max(55, currentSpeed * 0.42));
    const retX = ship.position.x + velNormX * reticleDist;
    const retY = ship.position.y + velNormY * reticleDist;

    ctx.save();
    ctx.translate(retX, retY);
    ctx.rotate(velAngle);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(11, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, -11);
    ctx.moveTo(0, 6);
    ctx.lineTo(0, 11);
    ctx.stroke();

    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 3. Drift Angle Arc
    let angleDiff = velAngle - ship.rotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const absDiffDeg = Math.round(Math.abs(angleDiff) * (180 / Math.PI));

    if (absDiffDeg >= 12 && currentSpeed > 22) {
      const arcRadius = ship.radius + 24;
      const startAngle = ship.rotation;
      const endAngle = velAngle;
      const counterClockwise = angleDiff < 0;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(ship.position.x, ship.position.y, arcRadius, startAngle, endAngle, counterClockwise);
      ctx.stroke();

      const midAngle = ship.rotation + angleDiff * 0.5;
      const labelX = ship.position.x + Math.cos(midAngle) * (arcRadius + 14);
      const labelY = ship.position.y + Math.sin(midAngle) * (arcRadius + 14);

      ctx.fillStyle = 'rgba(186, 230, 253, 0.85)';
      ctx.font = '9px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${absDiffDeg}° DRIFT`, labelX, labelY);
    }
  }

  ctx.restore();
}

function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  ctx.save();
  for (const p of particles) {
    const alpha = (1 - p.life / p.maxLife) * p.alpha;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 - (p.life / p.maxLife) * 0.4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function renderShip(ctx: CanvasRenderingContext2D, ship: Ship) {
  ctx.save();
  ctx.translate(ship.position.x, ship.position.y);
  ctx.rotate(ship.rotation);

  const r = ship.radius;

  // 1. Solar Collector charging shimmer
  if (ship.isSolarCharging) {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.fillRect(-r * 0.6, -r * 1.4, r * 0.3, r * 0.5);
    ctx.fillRect(-r * 0.6, r * 0.9, r * 0.3, r * 0.5);
    ctx.restore();
  }

  // 2. Shield Bubble & Impact Ripple
  if (ship.shield > 0) {
    ctx.save();
    const shieldRatio = ship.shield / ship.maxShield;
    const impact = ship.shieldImpactPulse || 0;

    ctx.strokeStyle = impact > 0.1
      ? `rgba(56, 189, 248, ${0.8 + impact * 0.4})`
      : `rgba(56, 189, 248, ${0.45 * shieldRatio})`;
    ctx.lineWidth = impact > 0.1 ? 2.8 : 1.6;

    ctx.fillStyle = impact > 0.1
      ? 'rgba(56, 189, 248, 0.22)'
      : 'rgba(56, 189, 248, 0.07)';

    ctx.beginPath();
    ctx.arc(0, 0, r * 1.55 + impact * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Subtle Hex shield lattice lines
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.2)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Multi-Stage Supersonic Plasma Thruster & Mach Shock Diamonds
  if (ship.isThrusting && ship.energy > 0) {
    ctx.save();
    const currentSpeed = Math.hypot(ship.velocity.x, ship.velocity.y);
    const speedRatio = Math.min(2.6, 1.0 + currentSpeed / 170);
    const time = performance.now() * 0.001;

    // A. Volumetric Thermal Dissipation Bloom
    const haloR = r * (1.8 + speedRatio * 0.9);
    const plumeGrad = ctx.createRadialGradient(-r * 0.8, 0, r * 0.2, -r * 0.8, 0, haloR);
    plumeGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    plumeGrad.addColorStop(0.4, 'rgba(99, 102, 241, 0.22)');
    plumeGrad.addColorStop(0.8, 'rgba(244, 63, 94, 0.1)');
    plumeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = plumeGrad;
    ctx.beginPath();
    ctx.arc(-r * 0.8, 0, haloR, 0, Math.PI * 2);
    ctx.fill();

    // B. Twin Port & Starboard Auxiliary Wing Nozzle Vector Jets
    const nacelleSpread = r * 0.65;
    const nacellePlumeLen = (r * 1.3 + (Math.random() - 0.5) * 4) * speedRatio;

    ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, -nacelleSpread - 2.5);
    ctx.lineTo(-r * 0.35 - nacellePlumeLen, -nacelleSpread);
    ctx.lineTo(-r * 0.35, -nacelleSpread + 2.5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-r * 0.35, nacelleSpread - 2.5);
    ctx.lineTo(-r * 0.35 - nacellePlumeLen, nacelleSpread);
    ctx.lineTo(-r * 0.35, nacelleSpread + 2.5);
    ctx.closePath();
    ctx.fill();

    // C. Main Engine Plasma Exhaust Flame Spear
    const mainPlumeLen = (r * 2.3 + Math.sin(time * 55) * 3 + Math.random() * 6) * speedRatio;
    const plumeW = r * (0.55 + Math.sin(time * 38) * 0.05);

    // Outer plasma mantle (Sky Blue / Cyan)
    const mantleGrad = ctx.createLinearGradient(-r * 0.6, 0, -r * 0.6 - mainPlumeLen, 0);
    mantleGrad.addColorStop(0, '#ffffff');
    mantleGrad.addColorStop(0.18, '#38bdf8');
    mantleGrad.addColorStop(0.68, '#0284c7');
    mantleGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

    ctx.fillStyle = mantleGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -plumeW);
    ctx.lineTo(-r * 0.6 - mainPlumeLen, 0);
    ctx.lineTo(-r * 0.6, plumeW);
    ctx.closePath();
    ctx.fill();

    // Inner blinding white-hot plasma core
    const coreLen = mainPlumeLen * 0.58;
    const coreW = plumeW * 0.48;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -coreW);
    ctx.lineTo(-r * 0.6 - coreLen, 0);
    ctx.lineTo(-r * 0.6, coreW);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // D. Supersonic Mach Shock Diamonds (Compression Disks along plume)
    const diamondCount = speedRatio > 1.6 ? 4 : (speedRatio > 1.2 ? 3 : 2);
    for (let d = 1; d <= diamondCount; d++) {
      const dx = -r * 0.6 - (mainPlumeLen * (d / (diamondCount + 1.2)));
      const diamondScale = (1 - (d / (diamondCount + 1))) * r * 0.32;
      const pulse = Math.sin(time * 45 + d) * 0.8;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(dx + diamondScale + pulse, 0);
      ctx.lineTo(dx, -diamondScale * 0.65);
      ctx.lineTo(dx - diamondScale - pulse, 0);
      ctx.lineTo(dx, diamondScale * 0.65);
      ctx.closePath();
      ctx.fill();

      // Shock disc glow ring
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.75)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    ctx.restore();
  }

  // 4. Reverse brake RCS jet glow when holding S
  if (ship.isBraking && ship.energy > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(248, 113, 113, 0.7)';
    ctx.beginPath();
    ctx.arc(r * 0.8, -r * 0.6, 3, 0, Math.PI * 2);
    ctx.arc(r * 0.8, r * 0.6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 5. Active Weapon Wingtip Mounts / Hardpoints
  ctx.save();
  ctx.fillStyle = '#38bdf8';
  if (ship.selectedWeapon === 'SNIPER') {
    // Extended dorsal kinetic railgun
    ctx.fillStyle = '#34d399';
    ctx.fillRect(r * 0.2, -2, r * 1.4, 4);
  } else if (ship.selectedWeapon === 'HEAT_SEEKER') {
    // Amber missile pods
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-r * 0.2, -r * 0.95, r * 0.6, 3.5);
    ctx.fillRect(-r * 0.2, r * 0.75, r * 0.6, 3.5);
  } else if (ship.selectedWeapon === 'AREA_MISSILE') {
    // Violet heavy torpedo launcher
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(-r * 0.1, -r * 0.85, r * 0.7, 4);
    ctx.fillRect(-r * 0.1, r * 0.65, r * 0.7, 4);
  }
  ctx.restore();

  // 6. Ship Geometric Hull
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(r * 1.3, 0);
  ctx.lineTo(-r * 0.9, r * 0.95);
  ctx.lineTo(-r * 0.5, 0);
  ctx.lineTo(-r * 0.9, -r * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cockpit Visor
  ctx.strokeStyle = ship.inVoidPocket ? '#c084fc' : '#38bdf8';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(r * 0.3, 0);
  ctx.lineTo(r * 0.9, 0);
  ctx.stroke();

  ctx.restore();
}

function renderExtractionIndicator(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  camera: Camera,
  gatePos: { x: number; y: number },
  shipPos: { x: number; y: number }
) {
  const dx = gatePos.x - shipPos.x;
  const dy = gatePos.y - shipPos.y;
  const distWorld = Math.hypot(dx, dy);

  const gateScreenX = (gatePos.x - camera.x) * camera.zoom + viewW / 2;
  const gateScreenY = (gatePos.y - camera.y) * camera.zoom + viewH / 2;

  const margin = 48;
  const isOffScreen =
    gateScreenX < margin ||
    gateScreenX > viewW - margin ||
    gateScreenY < margin ||
    gateScreenY > viewH - margin;

  if (isOffScreen) {
    const angle = Math.atan2(dy, dx);
    const clampedX = Math.max(margin, Math.min(viewW - margin, viewW / 2 + Math.cos(angle) * (viewW / 2 - margin)));
    const clampedY = Math.max(margin, Math.min(viewH - margin, viewH / 2 + Math.sin(angle) * (viewH / 2 - margin)));

    ctx.save();
    ctx.translate(clampedX, clampedY);

    ctx.rotate(angle);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-6, -7);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.rotate(-angle);

    const distKm = (distWorld / 1000).toFixed(1);
    ctx.fillStyle = 'rgba(224, 242, 254, 0.9)';
    ctx.font = '10px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${distKm} km`, 0, 18);

    ctx.restore();
  }
}

/**
 * Precursor Derelict Megastructures
 */
function renderDerelicts(ctx: CanvasRenderingContext2D, derelicts: DerelictStation[], ship: Ship) {
  for (const d of derelicts) {
    ctx.save();
    const { x, y } = d.position;
    ctx.translate(x, y);

    const dist = Math.hypot(ship.position.x - x, ship.position.y - y);
    const salvageRadius = d.radius + 35;
    const inRange = dist < salvageRadius;

    if (!d.salvaged) {
      // Pulsing salvage detection perimeter
      ctx.strokeStyle = inRange ? 'rgba(56, 189, 248, 0.6)' : 'rgba(251, 191, 36, 0.25)';
      ctx.lineWidth = inRange ? 2 : 1.2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, salvageRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Atmospheric beacon glow
      const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, d.radius * 1.6);
      aura.addColorStop(0, inRange ? 'rgba(56, 189, 248, 0.3)' : 'rgba(245, 158, 11, 0.2)');
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, d.radius * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Superstructure rotation
    ctx.rotate(d.rotation);

    if (d.type === 'OBSERVATORY') {
      // Central dome
      ctx.fillStyle = d.salvaged ? '#1e293b' : '#0f172a';
      ctx.strokeStyle = d.salvaged ? '#475569' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, d.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Trusses & Sensor dishes
      const trussLen = d.radius * 0.9;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.strokeStyle = d.salvaged ? '#334155' : '#7dd3fc';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * trussLen, Math.sin(a) * trussLen);
        ctx.stroke();

        ctx.fillStyle = d.salvaged ? '#475569' : '#0284c7';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * trussLen, Math.sin(a) * trussLen, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (d.type === 'SOLAR_ARRAY') {
      ctx.strokeStyle = d.salvaged ? '#475569' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-d.radius * 0.8, 0);
      ctx.lineTo(d.radius * 0.8, 0);
      ctx.stroke();

      for (let side = -1; side <= 1; side += 2) {
        for (let p = 0; p < 3; p++) {
          const px = -d.radius * 0.5 + p * (d.radius * 0.5);
          ctx.fillStyle = d.salvaged ? '#1e293b' : 'rgba(30, 58, 138, 0.85)';
          ctx.strokeStyle = d.salvaged ? '#334155' : '#60a5fa';
          ctx.lineWidth = 1.2;
          ctx.fillRect(px - 10, side * 14, 20, side * 18);
          ctx.strokeRect(px - 10, side * 14, 20, side * 18);
        }
      }
    } else {
      // HABITAT_RING
      ctx.strokeStyle = d.salvaged ? '#334155' : '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, d.radius * 0.75, 0, Math.PI * 2);
      ctx.stroke();

      for (let s = 0; s < 6; s++) {
        const sa = (s * Math.PI) / 3;
        ctx.strokeStyle = d.salvaged ? '#1e293b' : '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(sa) * d.radius * 0.75, Math.sin(sa) * d.radius * 0.75);
        ctx.stroke();
      }

      ctx.fillStyle = d.salvaged ? '#1e293b' : '#334155';
      ctx.strokeStyle = d.salvaged ? '#475569' : '#f8fafc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, d.radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Core salvage light
    ctx.fillStyle = d.salvaged ? '#475569' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Holographic Salvage Info
    if (dist < salvageRadius * 2.5) {
      ctx.save();
      ctx.textAlign = 'center';
      if (d.salvaged) {
        ctx.fillStyle = '#64748b';
        ctx.font = '9px "Space Mono", monospace';
        ctx.fillText(`✓ ${d.name.toUpperCase()} [SALVAGED]`, x, y - d.radius - 12);
      } else {
        ctx.fillStyle = inRange ? '#38bdf8' : '#fbbf24';
        ctx.font = 'bold 10px "Space Mono", monospace';
        ctx.fillText(`⬢ ${d.name.toUpperCase()} [RUINS]`, x, y - d.radius - 14);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '9px "Space Mono", monospace';
        ctx.fillText('ENTER CORE TO RECOVER SHIELD, ENERGY & SCORE', x, y - d.radius - 2);
      }
      ctx.restore();
    }
  }
}

/**
 * Drifting Asteroids
 */
function renderAsteroids(ctx: CanvasRenderingContext2D, asteroids: Asteroid[]) {
  for (const a of asteroids) {
    ctx.save();
    ctx.translate(a.position.x, a.position.y);
    ctx.rotate(a.rotation);

    const numPoints = a.vertices.length;
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
      const v = a.vertices[i];
      if (i === 0) ctx.moveTo(v.x, v.y);
      else ctx.lineTo(v.x, v.y);
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(-a.radius, -a.radius, a.radius, a.radius);
    grad.addColorStop(0, '#475569');
    grad.addColorStop(0.5, '#334155');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Crater details
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.beginPath();
    ctx.arc(a.radius * 0.25, -a.radius * 0.2, a.radius * 0.22, 0, Math.PI * 2);
    ctx.arc(-a.radius * 0.3, a.radius * 0.25, a.radius * 0.18, 0, Math.PI * 2);
    ctx.fill();

    if (a.health < a.maxHealth) {
      const barW = a.radius * 1.4;
      const barH = 3;
      const hpPct = Math.max(0, a.health / a.maxHealth);
      ctx.rotate(-a.rotation);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(-barW / 2, -a.radius - 8, barW, barH);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-barW / 2, -a.radius - 8, barW * hpPct, barH);
    }

    ctx.restore();
  }
}

/**
 * Screen-Space Out-Of-Bounds Warning Strobe & HUD Alert
 */
function renderOutOfBoundsWarning(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  ship: Ship,
  worldSize: { width: number; height: number }
) {
  const time = performance.now() * 0.001;
  ctx.save();

  // 1. Red Strobe Screen-Edge Vignette
  const strobeAlpha = 0.22 + Math.sin(time * 10) * 0.14;
  const edgeWidth = 36;

  const gradTop = ctx.createLinearGradient(0, 0, 0, edgeWidth * 2);
  gradTop.addColorStop(0, `rgba(239, 68, 68, ${strobeAlpha})`);
  gradTop.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = gradTop;
  ctx.fillRect(0, 0, viewW, edgeWidth * 2);

  const gradBottom = ctx.createLinearGradient(0, viewH, 0, viewH - edgeWidth * 2);
  gradBottom.addColorStop(0, `rgba(239, 68, 68, ${strobeAlpha})`);
  gradBottom.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = gradBottom;
  ctx.fillRect(0, viewH - edgeWidth * 2, viewW, edgeWidth * 2);

  const gradLeft = ctx.createLinearGradient(0, 0, edgeWidth * 2, 0);
  gradLeft.addColorStop(0, `rgba(239, 68, 68, ${strobeAlpha})`);
  gradLeft.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = gradLeft;
  ctx.fillRect(0, 0, edgeWidth * 2, viewH);

  const gradRight = ctx.createLinearGradient(viewW, 0, viewW - edgeWidth * 2, 0);
  gradRight.addColorStop(0, `rgba(239, 68, 68, ${strobeAlpha})`);
  gradRight.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = gradRight;
  ctx.fillRect(viewW - edgeWidth * 2, 0, edgeWidth * 2, viewH);

  // 2. High-Tech Tactical Breach Warning Banner
  const bannerW = 460;
  const bannerH = 68;
  const bannerX = (viewW - bannerW) / 2;
  const bannerY = 82;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.fillRect(bannerX, bannerY, bannerW, bannerH);

  ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 + Math.sin(time * 8) * 0.3})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(bannerX, bannerY, bannerW, 4);

  const outDist = Math.round(ship.outOfBoundsDistance || 0);
  const dps = Math.round(18 + outDist * 0.04);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 12px "Space Mono", monospace';
  ctx.fillText('⚠️ CRITICAL: SECTOR BOUNDARY BREACHED', viewW / 2, bannerY + 24);

  ctx.fillStyle = '#fca5a5';
  ctx.font = '10px "Space Mono", monospace';
  ctx.fillText(
    `OUT OF BOUNDS: ${outDist}m  |  ATMOSPHERIC DECAY: -${dps} HP/s`,
    viewW / 2,
    bannerY + 42
  );

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px "Space Mono", monospace';
  ctx.fillText('TURN BACK IMMEDIATELY TO PREVENT SHIP CORROSION', viewW / 2, bannerY + 58);

  // 3. Directional Compass to Sector Center
  const centerX = worldSize.width / 2;
  const centerY = worldSize.height / 2;
  const toCenterAngle = Math.atan2(centerY - ship.position.y, centerX - ship.position.x);

  ctx.save();
  ctx.translate(viewW / 2, bannerY + bannerH + 34);
  ctx.rotate(toCenterAngle);

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-8, -7);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-8, 7);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 9px "Space Mono", monospace';
  ctx.fillText('VECTOR TO SAFE SECTOR ZONE', viewW / 2, bannerY + bannerH + 56);

  ctx.restore();
}

/**
 * High-Tech Tactical Mini-Map Radar (Screen Space UI with Local, Sector & Expanded Modes)
 */
function renderMiniMap(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  ship: Ship,
  massNodes: MassNode[],
  voidPockets: VoidPocket[],
  shards: EnergyShard[],
  ancientSignal: AncientSignal,
  extractionGate: ExtractionGate,
  hostileShips: HostileShip[],
  projectiles: Projectile[],
  worldSize: { width: number; height: number },
  mode: 'SECTOR' | 'LOCAL' | 'EXPANDED',
  derelicts?: DerelictStation[],
  asteroids?: Asteroid[]
) {
  const isExpanded = mode === 'EXPANDED';
  const mapSize = isExpanded
    ? Math.min(viewW - 70, viewH - 70, 700)
    : 196;

  const mapX = isExpanded ? (viewW - mapSize) / 2 : 20;
  const mapY = isExpanded ? (viewH - mapSize) / 2 : viewH - mapSize - 20;

  ctx.save();

  // If expanded, render full dark scrim behind the map
  if (isExpanded) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
    ctx.fillRect(0, 0, viewW, viewH);
  }

  // Glassmorphic Map Container Background
  ctx.fillStyle = isExpanded ? 'rgba(10, 15, 30, 0.96)' : 'rgba(6, 11, 25, 0.92)';
  ctx.fillRect(mapX, mapY, mapSize, mapSize);

  // Border & Tech Frame
  ctx.strokeStyle = isExpanded ? 'rgba(56, 189, 248, 0.75)' : 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = isExpanded ? 2 : 1.5;
  ctx.strokeRect(mapX, mapY, mapSize, mapSize);

  // Map header title & buttons
  ctx.fillStyle = isExpanded ? '#38bdf8' : 'rgba(148, 163, 184, 0.9)';
  ctx.font = isExpanded ? 'bold 11px "Space Mono", monospace' : '9px "Space Mono", monospace';
  const headerTitle = isExpanded
    ? 'TACTICAL SECTOR COMMAND RADAR [EXPANDED MATRIX]'
    : mode === 'SECTOR'
    ? 'TACTICAL RADAR [SECTOR]'
    : 'LOCAL RADAR [2.5KM]';
  ctx.fillText(headerTitle, mapX + 10, mapY + (isExpanded ? 18 : 14));

  // Toggle hints
  ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
  ctx.font = isExpanded ? '10px "Space Mono", monospace' : '8px "Space Mono", monospace';
  ctx.textAlign = 'right';
  const actionText = isExpanded ? '[TAB / ESC] MINIMIZE   [M] RADAR' : '[TAB] EXPAND  [M] MODE';
  ctx.fillText(actionText, mapX + mapSize - 10, mapY + (isExpanded ? 18 : 14));

  // Clip content within map radar area
  const headerH = isExpanded ? 28 : 18;
  const footerH = isExpanded ? 28 : 20;
  const radarAreaH = mapSize - headerH - footerH;

  ctx.save();
  ctx.beginPath();
  ctx.rect(mapX + 2, mapY + headerH, mapSize - 4, radarAreaH);
  ctx.clip();

  // Radar Grid & Sweeper Line
  const time = performance.now() * 0.001;
  const centerScreenX = mapX + mapSize / 2;
  const centerScreenY = mapY + headerH + radarAreaH / 2;

  // Range rings
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centerScreenX, centerScreenY, isExpanded ? 120 : 35, 0, Math.PI * 2);
  ctx.arc(centerScreenX, centerScreenY, isExpanded ? 220 : 65, 0, Math.PI * 2);
  ctx.stroke();

  // Sweep Line
  const sweepA = time * 1.8;
  const sweepLen = isExpanded ? mapSize * 0.48 : 85;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
  ctx.beginPath();
  ctx.moveTo(centerScreenX, centerScreenY);
  ctx.lineTo(centerScreenX + Math.cos(sweepA) * sweepLen, centerScreenY + Math.sin(sweepA) * sweepLen);
  ctx.stroke();

  // Coordinate Conversion Helper
  const innerPad = isExpanded ? 24 : 12;
  const scale = (mapSize - innerPad * 2) / worldSize.width;
  const originX = mapX + innerPad;
  const originY = mapY + headerH + 8;

  const worldToMap = (wx: number, wy: number) => {
    if (mode === 'LOCAL') {
      const localRange = 2600;
      const dx = wx - ship.position.x;
      const dy = wy - ship.position.y;
      return {
        x: centerScreenX + (dx / localRange) * (isExpanded ? 220 : 65),
        y: centerScreenY + (dy / localRange) * (isExpanded ? 220 : 65),
      };
    }
    return {
      x: originX + wx * scale,
      y: originY + wy * scale,
    };
  };

  // 1. Draw Void Pockets on Radar
  for (const vp of voidPockets) {
    const p = worldToMap(vp.position.x, vp.position.y);
    const r = mode === 'LOCAL' ? (vp.radius / 2600) * (isExpanded ? 220 : 65) : vp.radius * scale;
    ctx.fillStyle = 'rgba(147, 51, 234, 0.25)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(3, r), 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Draw Asteroids on Radar
  if (asteroids) {
    for (const ast of asteroids) {
      const ap = worldToMap(ast.position.x, ast.position.y);
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(ap.x, ap.y, isExpanded ? 2.2 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Draw Precursor Derelicts on Radar
  if (derelicts) {
    for (const d of derelicts) {
      const dp = worldToMap(d.position.x, d.position.y);
      ctx.fillStyle = d.salvaged ? '#475569' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, isExpanded ? 4.5 : 3.0, 0, Math.PI * 2);
      ctx.fill();

      if (isExpanded) {
        ctx.fillStyle = d.salvaged ? '#64748b' : '#fbbf24';
        ctx.font = '8px "Space Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(d.salvaged ? `[SALVAGED] ${d.name}` : `⬢ ${d.name}`, dp.x + 6, dp.y + 3);
      }
    }
  }

  // 4. Draw Mass Nodes & Precursor Artifacts on Radar
  for (const node of massNodes) {
    const p = worldToMap(node.position.x, node.position.y);
    const nodeR = mode === 'LOCAL'
      ? (node.radius / 2600) * (isExpanded ? 220 : 65)
      : Math.max(3, node.radius * scale);
    const gravR = mode === 'LOCAL'
      ? (node.gravityRadius / 2600) * (isExpanded ? 220 : 65)
      : node.gravityRadius * scale;

    // Gravity field
    ctx.strokeStyle = `${node.color}33`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, gravR, 0, Math.PI * 2);
    ctx.stroke();

    // Planet Body
    ctx.fillStyle = node.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(3, nodeR), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ◈ PRECURSOR ARTIFACT
    if (node.artifact && !node.artifact.isDissolved) {
      const isSynced = node.artifact.isCollected;
      const artColor = isSynced ? '#4ade80' : '#fbbf24';
      const artX = p.x + nodeR + 5;
      const artY = p.y - nodeR - 5;

      const pingR = 3.5 + Math.sin(time * 4) * 1.5;
      ctx.strokeStyle = `${artColor}66`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(artX, artY, pingR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = artColor;
      ctx.beginPath();
      ctx.moveTo(artX, artY - (isExpanded ? 4.5 : 3.5));
      ctx.lineTo(artX + (isExpanded ? 4.2 : 3.2), artY);
      ctx.lineTo(artX, artY + (isExpanded ? 4.5 : 3.5));
      ctx.lineTo(artX - (isExpanded ? 4.2 : 3.2), artY);
      ctx.closePath();
      ctx.fill();

      if (isExpanded || mode === 'LOCAL') {
        ctx.fillStyle = artColor;
        ctx.font = isExpanded ? '9px "Space Mono", monospace' : '7px "Space Mono", monospace';
        ctx.textAlign = 'left';
        const label = isSynced ? `✓ ${node.artifact.name}` : `◈ ${node.artifact.name} (${node.artifact.completedOrbits}/3)`;
        ctx.fillText(label, artX + 6, artY + 3);
      }
    } else if (isExpanded) {
      // In expanded mode, show planet name even if artifact synced
      ctx.fillStyle = 'rgba(203, 213, 225, 0.7)';
      ctx.font = '8px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(node.name, p.x + nodeR + 4, p.y + 3);
    }
  }

  // 5. Draw Ancient Signal on Radar
  const signalPos = worldToMap(ancientSignal.position.x, ancientSignal.position.y);
  const sigColor = ancientSignal.scanned ? '#4ade80' : '#c084fc';
  ctx.strokeStyle = sigColor;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(signalPos.x, signalPos.y, (isExpanded ? 6 : 4) + Math.sin(time * 4) * 2, -Math.PI * 0.75, -Math.PI * 0.25);
  ctx.stroke();
  ctx.fillStyle = sigColor;
  ctx.fillRect(signalPos.x - 2.5, signalPos.y - 2.5, 5, 5);

  if (isExpanded) {
    ctx.fillStyle = sigColor;
    ctx.font = '9px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(ancientSignal.scanned ? '✓ ANCIENT TELEMETRY' : '✦ SIGNAL BEACON', signalPos.x + 8, signalPos.y + 3);
  }

  // 6. Draw Energy Shards on Radar
  for (const s of shards) {
    if (s.collected) continue;
    const sp = worldToMap(s.position.x, s.position.y);
    ctx.fillStyle = s.type === 'RICH' ? '#f59e0b' : 'rgba(56, 189, 248, 0.7)';
    ctx.fillRect(sp.x - 1, sp.y - 1, s.type === 'RICH' ? 2.5 : 1.8, s.type === 'RICH' ? 2.5 : 1.8);
  }

  // 7. Draw Extraction Gate on Radar
  const gatePos = worldToMap(extractionGate.position.x, extractionGate.position.y);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  const hexRadius = isExpanded ? 7.5 : 4.5;
  for (let h = 0; h < 6; h++) {
    const ha = (h / 6) * Math.PI * 2 + time * 0.8;
    const hx = gatePos.x + Math.cos(ha) * hexRadius;
    const hy = gatePos.y + Math.sin(ha) * hexRadius;
    if (h === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(gatePos.x - 1.5, gatePos.y - 1.5, 3, 3);

  if (isExpanded) {
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⬡ EXTRACTION GATE', gatePos.x + 10, gatePos.y + 3);
  }

  // 8. Draw Hostile Ships on Radar
  if (hostileShips) {
    for (const enemy of hostileShips) {
      if (enemy.dormantUntilRelicsCollected) continue;
      if (enemy.state === 'DEAD') {
        const dp = worldToMap(enemy.spawnOrigin.x, enemy.spawnOrigin.y);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(dp.x, dp.y, isExpanded ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const ep = worldToMap(enemy.position.x, enemy.position.y);
        ctx.fillStyle = enemy.state === 'COMBAT' ? '#ef4444' : '#f97316';
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, enemy.type === 'GATE_GUARDIAN' ? (isExpanded ? 5 : 3.5) : (isExpanded ? 4 : 2.5), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 9. Draw Projectiles on Radar (in local or expanded mode)
  if ((mode === 'LOCAL' || isExpanded) && projectiles) {
    for (const proj of projectiles) {
      const prp = worldToMap(proj.position.x, proj.position.y);
      ctx.fillStyle = proj.isPlayer ? '#38bdf8' : '#ef4444';
      ctx.fillRect(prp.x - 1, prp.y - 1, 2, 2);
    }
  }

  // 10. Draw Player Ship on Radar
  const shipPos = worldToMap(ship.position.x, ship.position.y);
  ctx.save();
  ctx.translate(shipPos.x, shipPos.y);
  ctx.rotate(ship.rotation);

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  const shipIconScale = isExpanded ? 1.4 : 1.0;
  ctx.moveTo(5.5 * shipIconScale, 0);
  ctx.lineTo(-4 * shipIconScale, 3.2 * shipIconScale);
  ctx.lineTo(-2 * shipIconScale, 0);
  ctx.lineTo(-4 * shipIconScale, -3.2 * shipIconScale);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  ctx.restore(); // end clip

  // 11. Tactical Radar Legend Strip
  const legendY = mapY + mapSize - 9;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(mapX + 2, mapY + mapSize - footerH, mapSize - 4, footerH - 2);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(mapX + 2, mapY + mapSize - footerH, mapSize - 4, footerH - 2);

  ctx.font = isExpanded ? '9px "Space Mono", monospace' : '8px "Space Mono", monospace';
  ctx.textAlign = 'left';

  if (isExpanded) {
    // Comprehensive Expanded Legend
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('◈ Relic', mapX + 16, legendY);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('○ Planet', mapX + 85, legendY);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('⬡ Gate', mapX + 155, legendY);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('⬢ Ruins', mapX + 215, legendY);
    ctx.fillStyle = '#c084fc';
    ctx.fillText('✦ Beacon', mapX + 280, legendY);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('● Hostile', mapX + 355, legendY);
    ctx.fillStyle = '#64748b';
    ctx.fillText('• Asteroid', mapX + 435, legendY);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('▲ You', mapX + 520, legendY);
  } else {
    // Compact Legend
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('◈', mapX + 8, legendY);
    ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
    ctx.fillText('Relic', mapX + 16, legendY);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('○', mapX + 46, legendY);
    ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
    ctx.fillText('Body', mapX + 54, legendY);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('⬡', mapX + 80, legendY);
    ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
    ctx.fillText('Gate', mapX + 88, legendY);

    ctx.fillStyle = '#f8fafc';
    ctx.fillText('▲', mapX + 114, legendY);
    ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
    ctx.fillText('You', mapX + 122, legendY);

    ctx.fillStyle = '#ef4444';
    ctx.fillText('●', mapX + 144, legendY);
    ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
    ctx.fillText('Hostile', mapX + 152, legendY);
  }

  ctx.restore();
}

function renderDebugVisuals(
  ctx: CanvasRenderingContext2D,
  ship: Ship,
  massNodes: MassNode[],
  voidPockets: VoidPocket[],
  ancientSignal: AncientSignal,
  extractionGate: ExtractionGate,
  fps: number
) {
  ctx.save();

  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ship.position.x, ship.position.y);
  ctx.lineTo(ship.position.x + ship.velocity.x, ship.position.y + ship.velocity.y);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(ship.position.x, ship.position.y, ship.radius, 0, Math.PI * 2);
  ctx.stroke();

  for (const node of massNodes) {
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.beginPath();
    ctx.arc(node.position.x, node.position.y, node.gravityRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}
