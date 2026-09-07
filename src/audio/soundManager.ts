/**
 * Pure Web Audio API Sound Synthesizer for The Drift.
 * Minimalist atmospheric space audio:
 * - Subtle deep ambient drone
 * - Low-frequency reactive thrust engine rumble
 * - Crystalline pentatonic shard collection chimes
 * - Dynamic gravity harmonic resonance
 * - Ancient signal sonar ping
 * - Hull impact distortion
 * - Extraction portal harmonic chord
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  // Continuous sound nodes
  private ambientGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private gravityGain: GainNode | null = null;
  private gravityOsc: OscillatorNode | null = null;

  private isEngineRunning = false;
  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.setupContinuousNodes();
      this.isInitialized = true;
    } catch {
      // Audio context might fail on restricted environments
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val && this.ctx && this.ctx.state === 'running') {
      if (this.ambientGain) this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.gravityGain) this.gravityGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public isSoundEnabled(): boolean {
    return this.enabled;
  }

  private ensureContext(): boolean {
    if (!this.enabled) return false;
    try {
      if (!this.ctx) {
        this.init();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return !!this.ctx && this.ctx.state !== 'closed';
    } catch {
      return false;
    }
  }

  private safeAudio(fn: (ctx: AudioContext, t: number) => void) {
    try {
      if (!this.ensureContext() || !this.ctx) return;
      fn(this.ctx, this.ctx.currentTime);
    } catch {
      // Audio safely suppressed if not allowed
    }
  }

  private setupContinuousNodes() {
    if (!this.ctx) return;

    // 1. Ambient deep space drone
    try {
      const droneOsc1 = this.ctx.createOscillator();
      const droneOsc2 = this.ctx.createOscillator();
      const droneFilter = this.ctx.createBiquadFilter();
      this.ambientGain = this.ctx.createGain();

      droneOsc1.type = 'sine';
      droneOsc1.frequency.value = 55; // A1
      droneOsc2.type = 'sine';
      droneOsc2.frequency.value = 82.4; // E2 (fifth harmonic)

      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 120;

      this.ambientGain.gain.value = 0.04;

      droneOsc1.connect(droneFilter);
      droneOsc2.connect(droneFilter);
      droneFilter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      droneOsc1.start();
      droneOsc2.start();
    } catch {
      // ignore
    }

    // 2. Engine thrust synth
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 65; // Low rumble

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 140;

      this.engineGain.gain.value = 0;

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch {
      // ignore
    }

    // 3. Gravity field harmonic resonance
    try {
      this.gravityOsc = this.ctx.createOscillator();
      const gravFilter = this.ctx.createBiquadFilter();
      this.gravityGain = this.ctx.createGain();

      this.gravityOsc.type = 'sine';
      this.gravityOsc.frequency.value = 98; // G2

      gravFilter.type = 'bandpass';
      gravFilter.frequency.value = 220;
      gravFilter.Q.value = 3.0;

      this.gravityGain.gain.value = 0;

      this.gravityOsc.connect(gravFilter);
      gravFilter.connect(this.gravityGain);
      this.gravityGain.connect(this.ctx.destination);

      this.gravityOsc.start();
    } catch {
      // ignore
    }
  }

  public updateThrust(isThrusting: boolean, isBraking: boolean, speedNorm: number = 0) {
    if (!this.ensureContext() || !this.engineGain || !this.ctx) return;

    const t = this.ctx.currentTime;
    if (isThrusting) {
      this.engineGain.gain.setTargetAtTime(0.08, t, 0.08);
      if (this.engineOsc) {
        this.engineOsc.frequency.setTargetAtTime(75 + speedNorm * 45, t, 0.1);
      }
      if (this.engineFilter) {
        this.engineFilter.frequency.setTargetAtTime(200 + speedNorm * 120, t, 0.1);
      }
    } else if (isBraking) {
      this.engineGain.gain.setTargetAtTime(0.06, t, 0.06);
      if (this.engineOsc) {
        this.engineOsc.frequency.setTargetAtTime(50, t, 0.08);
      }
      if (this.engineFilter) {
        this.engineFilter.frequency.setTargetAtTime(120, t, 0.08);
      }
    } else {
      this.engineGain.gain.setTargetAtTime(0, t, 0.15);
    }
  }

  public startThrust() {
    this.updateThrust(true, false);
  }

  public stopThrust() {
    this.updateThrust(false, false);
  }

  public startBrake() {
    this.updateThrust(false, true);
  }

  public stopBrake() {
    this.updateThrust(false, false);
  }

  public updateGravityField(intensity: number) { // intensity 0 to 1
    if (!this.ensureContext() || !this.gravityGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    const t = this.ctx.currentTime;
    this.gravityGain.gain.setTargetAtTime(clamped * 0.07, t, 0.2);
    if (this.gravityOsc) {
      this.gravityOsc.frequency.setTargetAtTime(90 + clamped * 50, t, 0.2);
    }
  }

  public playShardCollect(isRich: boolean) {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const notes = isRich ? [587.33, 880, 1174.66, 1760] : [523.25, 659.25, 783.99]; // D5-A5-D6-A6 or C5-E5-G5
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isRich ? 'triangle' : 'sine';
    
    // Arpeggio
    notes.forEach((freq, idx) => {
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);
    });

    gain.gain.setValueAtTime(isRich ? 0.12 : 0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isRich ? 0.45 : 0.3));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + (isRich ? 0.45 : 0.3));
  }

  public playGravityAssist() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.35);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  public playDamage() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    // White noise burst with lowpass sweep
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  public playSignalPing() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, t + 0.15); // E6

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  public playExtractionComplete() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const chord = [261.63, 329.63, 392.00, 523.25, 659.25]; // C Major chord
    chord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.06, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.05);
      osc.stop(t + 1.2);
    });
  }

  public playArtifactOrbitAdvance(orbitNum: number) {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const baseFreq = 440 * Math.pow(2, (orbitNum - 1) * 4 / 12); // A4, C#5, E5
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.22);

    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playArtifactUnlocked() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Harmonic pentatonic crystalline burst
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.08, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.06);
      osc.stop(t + 1.4);
    });
  }

  public playLaserShot() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);

    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playMissileLaunch() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(460, t + 0.22);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playAreaMissileFire() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.35);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  public playRailgunFire() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    // High frequency electric crack + low resonance
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(2400, t);
    osc1.frequency.exponentialRampToValueAtTime(120, t + 0.28);
    gain1.gain.setValueAtTime(0.18, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);

    osc1.start(t);
    osc1.stop(t + 0.3);

    // Deep sub bass thump
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(110, t);
    osc2.frequency.exponentialRampToValueAtTime(35, t + 0.4);
    gain2.gain.setValueAtTime(0.2, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc2.start(t);
    osc2.stop(t + 0.4);
  }

  public playExplosion(intensity: number = 1.0) {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;
    const duration = Math.min(0.8, 0.25 + intensity * 0.3);

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600 * intensity, t);
    filter.frequency.exponentialRampToValueAtTime(40, t + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.min(0.28, 0.12 * intensity), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  public playShieldHit() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(1300, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.2);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playShieldBreak() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.linearRampToValueAtTime(150, t + 0.35);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  public playShieldRecharged() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.25);

    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playEnemyWarpIn() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(980, t + 0.4);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  public playBossAlert() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Dual low horn
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(65, t);
    osc1.frequency.exponentialRampToValueAtTime(55, t + 1.2);
    osc2.frequency.setValueAtTime(130, t);
    osc2.frequency.exponentialRampToValueAtTime(110, t + 1.2);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 1.2);
    osc2.stop(t + 1.2);
  }

  public playBossPhaseAdvance() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.5);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.55);
  }

  public playTachyonBeam() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.28);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playVortexCannon() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.4);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  public playSingularityVortex() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.4);
    osc.frequency.linearRampToValueAtTime(70, t + 0.8);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.8);
  }

  public playWarpJump() {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.8);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.95);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.95);
  }

  public playClick() {
    this.safeAudio((ctx, t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.04);

      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    });
  }

  public playUpgrade() {
    this.playUpgradePurchased();
  }

  public playWeaponUnlocked() {
    this.playUpgradePurchased();
  }

  public playUpgradePurchased() {
    this.safeAudio((ctx, t) => {
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.08, t + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.25);
      });
    });
  }

  public playLoreTransmission() {
    this.safeAudio((ctx, t) => {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.06, t + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.35);
      });
    });
  }

  public stopAll() {
    try {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      if (this.engineGain) this.engineGain.gain.setTargetAtTime(0, t, 0.05);
      if (this.gravityGain) this.gravityGain.gain.setTargetAtTime(0, t, 0.05);
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
