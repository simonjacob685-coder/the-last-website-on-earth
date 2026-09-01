/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * THE LAST WEBSITE ON EARTH — PREMIUM ADAPTIVE SOUNDSCAPE ENGINE
 *
 * ARCHITECTURAL DESIGN:
 * - 100% Web Audio API procedural synthesis (zero external audio asset dependencies).
 * - Continuous, multi-bus adaptive soundscape with reusable AudioNode graphs.
 * - ZERO AudioNode allocations inside requestAnimationFrame.
 * - Smooth parametric interpolation using AudioParam.setTargetAtTime / linearRampToValueAtTime.
 * - Aesthetic: Digital archaeological installation — meditative, deep, subtle, non-game.
 */

import { DiscoveryId, MemoryId } from '../types';

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private initialized: boolean = false;
  private starting: boolean = false;

  // Master Output Chain
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // ----------------------------------------------------
  // PERMANENT AMBIENT BUSES & NODES
  // ----------------------------------------------------
  // 1. Archive Ambient Bus (Sub-bass drone + room tone air)
  private archiveGain: GainNode | null = null;
  private archiveDroneOsc1: OscillatorNode | null = null;
  private archiveDroneOsc2: OscillatorNode | null = null;
  private archiveFilter1: BiquadFilterNode | null = null;
  private archiveFilter2: BiquadFilterNode | null = null;
  private archiveLfo: OscillatorNode | null = null;
  private archiveLfoGain: GainNode | null = null;
  private archiveNoiseSource: AudioBufferSourceNode | null = null;

  // 2. Ocean Ambience Bus (Generative ocean waves + airy foam wash)
  private oceanGain: GainNode | null = null;
  private oceanNoiseSource: AudioBufferSourceNode | null = null;
  private oceanWaveFilter: BiquadFilterNode | null = null;
  private oceanAirFilter: BiquadFilterNode | null = null;
  private oceanWaveLfo: OscillatorNode | null = null;
  private oceanWaveLfoGain: GainNode | null = null;

  // 3. City Ambience Bus (Sub-harmonic electrical transformer + distant resonance)
  private cityGain: GainNode | null = null;
  private cityHumOsc1: OscillatorNode | null = null;
  private cityHumOsc2: OscillatorNode | null = null;
  private cityHumOsc3: OscillatorNode | null = null;
  private cityResonanceFilter: BiquadFilterNode | null = null;
  private cityNoiseSource: AudioBufferSourceNode | null = null;
  private cityLfo: OscillatorNode | null = null;
  private cityLfoGain: GainNode | null = null;

  // 4. Message Ambience Bus (Intimate delicate transmission carrier + heartbeat)
  private messageGain: GainNode | null = null;
  private messageCarrierOsc1: OscillatorNode | null = null;
  private messageCarrierOsc2: OscillatorNode | null = null;
  private messageTremoloLfo: OscillatorNode | null = null;
  private messageTremoloGain: GainNode | null = null;
  private messagePulseInterval: number | null = null;

  // 5. Final Signal Ambience Bus (Cosmic 1420MHz harmonic beacon)
  private signalGain: GainNode | null = null;
  private signalBeaconOsc1: OscillatorNode | null = null;
  private signalBeaconOsc2: OscillatorNode | null = null;
  private signalPulseLfo: OscillatorNode | null = null;
  private signalPulseGain: GainNode | null = null;

  // State Tracking
  private activeFocus: DiscoveryId | null = null;
  private isFinalSilenceActive: boolean = false;
  private discoveredMemorySet: Set<string> = new Set();

  // Coordinates of key sound sources in 3D archive chamber
  private readonly positions = {
    ocean: [-4.2, 1.2, 2.2] as const,
    city: [4.4, 1.8, 1.6] as const,
    message: [0.2, -2.6, 3.4] as const,
    secret_signal: [8.4, 4.8, -6.2] as const,
  };

  constructor() {
    // AudioContext is initialized on first user interaction to obey browser autoplay policies
  }

  /**
   * Lazily initialize and resume the Web Audio Context
   */
  public initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }

    try {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {}

    return this.ctx;
  }

  /**
   * Build the complete permanent Audio Graph once
   */
  public startAmbient() {
    if (this.initialized || this.starting) return;
    this.starting = true;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // ----------------------------------------------------
      // 0. MASTER OUTPUT CHAIN
      // ----------------------------------------------------
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0.0001 : 0.22, now);

      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-16, now);
      this.compressor.knee.setValueAtTime(10, now);
      this.compressor.ratio.setValueAtTime(3.5, now);
      this.compressor.attack.setValueAtTime(0.04, now);
      this.compressor.release.setValueAtTime(0.25, now);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(ctx.destination);

      // Create a reusable 4-second pink noise buffer
      const bufferLength = ctx.sampleRate * 4;
      const pinkNoiseBuffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate);
      const pinkOut = pinkNoiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferLength; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        pinkOut[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      // ----------------------------------------------------
      // 1. ARCHIVE AMBIENCE BUS
      // (Deep sub-bass drone + quiet electronic room tone air)
      // ----------------------------------------------------
      this.archiveGain = ctx.createGain();
      this.archiveGain.gain.setValueAtTime(0.13, now);
      this.archiveGain.connect(this.masterGain);

      // Sub-bass oscillators (46Hz fundamental + 69.2Hz fifth)
      this.archiveDroneOsc1 = ctx.createOscillator();
      this.archiveDroneOsc1.type = 'sine';
      this.archiveDroneOsc1.frequency.setValueAtTime(46.0, now);

      this.archiveDroneOsc2 = ctx.createOscillator();
      this.archiveDroneOsc2.type = 'triangle';
      this.archiveDroneOsc2.frequency.setValueAtTime(69.2, now);

      // Cascaded 24dB lowpass filtering for warm, deep sub tone
      this.archiveFilter1 = ctx.createBiquadFilter();
      this.archiveFilter1.type = 'lowpass';
      this.archiveFilter1.frequency.setValueAtTime(105, now);
      this.archiveFilter1.Q.setValueAtTime(1.8, now);

      this.archiveFilter2 = ctx.createBiquadFilter();
      this.archiveFilter2.type = 'lowpass';
      this.archiveFilter2.frequency.setValueAtTime(120, now);

      // Slow LFO for subtle breathing movement in the archive room tone
      this.archiveLfo = ctx.createOscillator();
      this.archiveLfo.type = 'sine';
      this.archiveLfo.frequency.setValueAtTime(0.035, now); // ~28s slow cycle

      this.archiveLfoGain = ctx.createGain();
      this.archiveLfoGain.gain.setValueAtTime(18, now);

      this.archiveLfo.connect(this.archiveLfoGain);
      this.archiveLfoGain.connect(this.archiveFilter1.frequency);

      const droneSubGain = ctx.createGain();
      droneSubGain.gain.setValueAtTime(0.65, now);

      this.archiveDroneOsc1.connect(this.archiveFilter1);
      this.archiveDroneOsc2.connect(this.archiveFilter1);
      this.archiveFilter1.connect(this.archiveFilter2);
      this.archiveFilter2.connect(droneSubGain);
      droneSubGain.connect(this.archiveGain);

      // Room Air (subtle filtered high-pass/low-pass noise)
      this.archiveNoiseSource = ctx.createBufferSource();
      this.archiveNoiseSource.buffer = pinkNoiseBuffer;
      this.archiveNoiseSource.loop = true;

      const roomAirFilter = ctx.createBiquadFilter();
      roomAirFilter.type = 'bandpass';
      roomAirFilter.frequency.setValueAtTime(380, now);
      roomAirFilter.Q.setValueAtTime(1.4, now);

      const roomAirGain = ctx.createGain();
      roomAirGain.gain.setValueAtTime(0.012, now);

      this.archiveNoiseSource.connect(roomAirFilter);
      roomAirFilter.connect(roomAirGain);
      roomAirGain.connect(this.archiveGain);

      this.archiveDroneOsc1.start(now);
      this.archiveDroneOsc2.start(now);
      this.archiveLfo.start(now);
      this.archiveNoiseSource.start(now);

      // ----------------------------------------------------
      // 2. OCEAN AMBIENCE BUS
      // (Generative sea waves + distant airy spray)
      // ----------------------------------------------------
      this.oceanGain = ctx.createGain();
      this.oceanGain.gain.setValueAtTime(0.0001, now);
      this.oceanGain.connect(this.masterGain);

      this.oceanNoiseSource = ctx.createBufferSource();
      this.oceanNoiseSource.buffer = pinkNoiseBuffer;
      this.oceanNoiseSource.loop = true;

      this.oceanWaveFilter = ctx.createBiquadFilter();
      this.oceanWaveFilter.type = 'lowpass';
      this.oceanWaveFilter.frequency.setValueAtTime(260, now);
      this.oceanWaveFilter.Q.setValueAtTime(2.6, now);

      this.oceanAirFilter = ctx.createBiquadFilter();
      this.oceanAirFilter.type = 'bandpass';
      this.oceanAirFilter.frequency.setValueAtTime(1300, now);
      this.oceanAirFilter.Q.setValueAtTime(3.0, now);

      // Wave swell LFO (~8.5 second wave cycle)
      this.oceanWaveLfo = ctx.createOscillator();
      this.oceanWaveLfo.type = 'sine';
      this.oceanWaveLfo.frequency.setValueAtTime(0.118, now);

      this.oceanWaveLfoGain = ctx.createGain();
      this.oceanWaveLfoGain.gain.setValueAtTime(190, now);

      this.oceanWaveLfo.connect(this.oceanWaveLfoGain);
      this.oceanWaveLfoGain.connect(this.oceanWaveFilter.frequency);

      const oceanWaveGain = ctx.createGain();
      oceanWaveGain.gain.setValueAtTime(0.45, now);

      const oceanAirGain = ctx.createGain();
      oceanAirGain.gain.setValueAtTime(0.04, now);

      this.oceanNoiseSource.connect(this.oceanWaveFilter);
      this.oceanWaveFilter.connect(oceanWaveGain);
      oceanWaveGain.connect(this.oceanGain);

      this.oceanNoiseSource.connect(this.oceanAirFilter);
      this.oceanAirFilter.connect(oceanAirGain);
      oceanAirGain.connect(this.oceanGain);

      this.oceanWaveLfo.start(now);
      this.oceanNoiseSource.start(now);

      // ----------------------------------------------------
      // 3. CITY AMBIENCE BUS
      // (Sub-harmonic transformer hum + hollow mechanical resonance)
      // ----------------------------------------------------
      this.cityGain = ctx.createGain();
      this.cityGain.gain.setValueAtTime(0.0001, now);
      this.cityGain.connect(this.masterGain);

      // Electrical grid harmonics: 50Hz (EU/archival grid), 100Hz 2nd harmonic, 150Hz 3rd harmonic
      this.cityHumOsc1 = ctx.createOscillator();
      this.cityHumOsc1.type = 'sine';
      this.cityHumOsc1.frequency.setValueAtTime(50.0, now);

      this.cityHumOsc2 = ctx.createOscillator();
      this.cityHumOsc2.type = 'sine';
      this.cityHumOsc2.frequency.setValueAtTime(100.1, now);

      this.cityHumOsc3 = ctx.createOscillator();
      this.cityHumOsc3.type = 'triangle';
      this.cityHumOsc3.frequency.setValueAtTime(150.2, now);

      const cityHumSubGain = ctx.createGain();
      cityHumSubGain.gain.setValueAtTime(0.35, now);

      const cityHumFilter = ctx.createBiquadFilter();
      cityHumFilter.type = 'lowpass';
      cityHumFilter.frequency.setValueAtTime(220, now);

      this.cityHumOsc1.connect(cityHumFilter);
      this.cityHumOsc2.connect(cityHumFilter);
      this.cityHumOsc3.connect(cityHumFilter);
      cityHumFilter.connect(cityHumSubGain);
      cityHumSubGain.connect(this.cityGain);

      // Distant hollow mechanical resonance
      this.cityNoiseSource = ctx.createBufferSource();
      this.cityNoiseSource.buffer = pinkNoiseBuffer;
      this.cityNoiseSource.loop = true;

      this.cityResonanceFilter = ctx.createBiquadFilter();
      this.cityResonanceFilter.type = 'bandpass';
      this.cityResonanceFilter.frequency.setValueAtTime(185, now);
      this.cityResonanceFilter.Q.setValueAtTime(5.5, now);

      // Slow drift LFO on mechanical resonance
      this.cityLfo = ctx.createOscillator();
      this.cityLfo.type = 'sine';
      this.cityLfo.frequency.setValueAtTime(0.052, now);

      this.cityLfoGain = ctx.createGain();
      this.cityLfoGain.gain.setValueAtTime(25, now);

      this.cityLfo.connect(this.cityLfoGain);
      this.cityLfoGain.connect(this.cityResonanceFilter.frequency);

      const cityMechGain = ctx.createGain();
      cityMechGain.gain.setValueAtTime(0.06, now);

      this.cityNoiseSource.connect(this.cityResonanceFilter);
      this.cityResonanceFilter.connect(cityMechGain);
      cityMechGain.connect(this.cityGain);

      this.cityHumOsc1.start(now);
      this.cityHumOsc2.start(now);
      this.cityHumOsc3.start(now);
      this.cityLfo.start(now);
      this.cityNoiseSource.start(now);

      // ----------------------------------------------------
      // 4. MESSAGE AMBIENCE BUS
      // (Intimate delicate carrier tone + heartbeat pulse)
      // ----------------------------------------------------
      this.messageGain = ctx.createGain();
      this.messageGain.gain.setValueAtTime(0.0001, now);
      this.messageGain.connect(this.masterGain);

      this.messageCarrierOsc1 = ctx.createOscillator();
      this.messageCarrierOsc1.type = 'sine';
      this.messageCarrierOsc1.frequency.setValueAtTime(528.0, now); // Solfeggio / delicate transmission tone

      this.messageCarrierOsc2 = ctx.createOscillator();
      this.messageCarrierOsc2.type = 'sine';
      this.messageCarrierOsc2.frequency.setValueAtTime(660.0, now); // Pure ethereal interval

      // Subtle tremolo modulation for shimmering digital signal
      this.messageTremoloLfo = ctx.createOscillator();
      this.messageTremoloLfo.type = 'sine';
      this.messageTremoloLfo.frequency.setValueAtTime(0.32, now);

      this.messageTremoloGain = ctx.createGain();
      this.messageTremoloGain.gain.setValueAtTime(0.02, now);

      const carrierSubGain = ctx.createGain();
      carrierSubGain.gain.setValueAtTime(0.035, now);

      this.messageTremoloLfo.connect(this.messageTremoloGain);
      this.messageTremoloGain.connect(carrierSubGain.gain);

      this.messageCarrierOsc1.connect(carrierSubGain);
      this.messageCarrierOsc2.connect(carrierSubGain);
      carrierSubGain.connect(this.messageGain);

      this.messageCarrierOsc1.start(now);
      this.messageCarrierOsc2.start(now);
      this.messageTremoloLfo.start(now);

      // ----------------------------------------------------
      // 5. FINAL SIGNAL AMBIENCE BUS
      // (Cosmic Hydrogen Line 1420MHz Harmonic Beacon)
      // ----------------------------------------------------
      this.signalGain = ctx.createGain();
      this.signalGain.gain.setValueAtTime(0.0001, now);
      this.signalGain.connect(this.masterGain);

      this.signalBeaconOsc1 = ctx.createOscillator();
      this.signalBeaconOsc1.type = 'sine';
      this.signalBeaconOsc1.frequency.setValueAtTime(710.2, now);

      this.signalBeaconOsc2 = ctx.createOscillator();
      this.signalBeaconOsc2.type = 'sine';
      this.signalBeaconOsc2.frequency.setValueAtTime(1420.4, now);

      this.signalPulseLfo = ctx.createOscillator();
      this.signalPulseLfo.type = 'sine';
      this.signalPulseLfo.frequency.setValueAtTime(0.38, now); // ~2.6s periodic beacon pulse

      this.signalPulseGain = ctx.createGain();
      this.signalPulseGain.gain.setValueAtTime(0.025, now);

      const beaconSubGain = ctx.createGain();
      beaconSubGain.gain.setValueAtTime(0.035, now);

      this.signalPulseLfo.connect(this.signalPulseGain);
      this.signalPulseGain.connect(beaconSubGain.gain);

      this.signalBeaconOsc1.connect(beaconSubGain);
      this.signalBeaconOsc2.connect(beaconSubGain);
      beaconSubGain.connect(this.signalGain);

      this.signalBeaconOsc1.start(now);
      this.signalBeaconOsc2.start(now);
      this.signalPulseLfo.start(now);

      this.initialized = true;
      this.starting = false;
    } catch {
      this.starting = false;
    }
  }

  // ----------------------------------------------------
  // ADAPTIVE SPATIAL AUDIO SYSTEM (CALLED IN RAF)
  // ZERO NODES CREATED IN RAF — PURE MATH & AUDIO PARAM LERP
  // ----------------------------------------------------
  /**
   * Updates the volume mix of the environment in real time based on camera position and modal state
   */
  public updateSpatialState(
    cameraPos: { x: number; y: number; z: number },
    activeDiscovery: DiscoveryId | null,
    isAllRecovered: boolean,
    isPanelOpen: boolean
  ) {
    if (!this.ctx || !this.initialized || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const tc = 0.28; // Smooth exponential time constant

      if (this.isFinalSilenceActive) {
        // Special contemplative silence during "Someone is still listening."
        this.archiveGain?.gain.setTargetAtTime(0.003, now, 0.6);
        this.oceanGain?.gain.setTargetAtTime(0.0001, now, 0.5);
        this.cityGain?.gain.setTargetAtTime(0.0001, now, 0.5);
        this.messageGain?.gain.setTargetAtTime(0.0001, now, 0.5);
        this.signalGain?.gain.setTargetAtTime(0.045, now, 0.4);
        return;
      }

      // If a specific discovery panel is actively open, crossfade directly to focused state
      if (isPanelOpen && activeDiscovery) {
        switch (activeDiscovery) {
          case 'ocean':
            this.archiveGain?.gain.setTargetAtTime(0.035, now, tc);
            this.oceanGain?.gain.setTargetAtTime(0.15, now, tc);
            this.cityGain?.gain.setTargetAtTime(0.0001, now, tc);
            this.messageGain?.gain.setTargetAtTime(0.0001, now, tc);
            this.signalGain?.gain.setTargetAtTime(0.0001, now, tc);
            return;

          case 'city':
            this.archiveGain?.gain.setTargetAtTime(0.035, now, tc);
            this.oceanGain?.gain.setTargetAtTime(0.0001, now, tc);
            this.cityGain?.gain.setTargetAtTime(0.13, now, tc);
            this.messageGain?.gain.setTargetAtTime(0.0001, now, tc);
            this.signalGain?.gain.setTargetAtTime(0.0001, now, tc);
            return;

          case 'message':
            // Message intimate silence: ambient sound drops to near silence
            this.archiveGain?.gain.setTargetAtTime(0.015, now, 0.5);
            this.oceanGain?.gain.setTargetAtTime(0.0001, now, 0.4);
            this.cityGain?.gain.setTargetAtTime(0.0001, now, 0.4);
            this.messageGain?.gain.setTargetAtTime(0.12, now, tc);
            this.signalGain?.gain.setTargetAtTime(0.0001, now, 0.4);
            return;

          case 'secret_signal':
            this.archiveGain?.gain.setTargetAtTime(0.012, now, 0.5);
            this.oceanGain?.gain.setTargetAtTime(0.0001, now, 0.4);
            this.cityGain?.gain.setTargetAtTime(0.0001, now, 0.4);
            this.messageGain?.gain.setTargetAtTime(0.0001, now, 0.4);
            this.signalGain?.gain.setTargetAtTime(0.14, now, tc);
            return;

          case 'archive_core':
            this.archiveGain?.gain.setTargetAtTime(0.15, now, tc);
            this.oceanGain?.gain.setTargetAtTime(0.0001, now, tc);
            this.cityGain?.gain.setTargetAtTime(0.0001, now, tc);
            this.messageGain?.gain.setTargetAtTime(0.0001, now, tc);
            this.signalGain?.gain.setTargetAtTime(0.0001, now, tc);
            return;

          default:
            // Terminal / Transceiver / Fragments
            this.archiveGain?.gain.setTargetAtTime(0.08, now, tc);
            this.oceanGain?.gain.setTargetAtTime(0.0001, now, tc);
            this.cityGain?.gain.setTargetAtTime(0.0001, now, tc);
            this.messageGain?.gain.setTargetAtTime(0.0001, now, tc);
            this.signalGain?.gain.setTargetAtTime(0.0001, now, tc);
            return;
        }
      }

      // ----------------------------------------------------
      // FREE ORBIT CAMERA: DISTANCE-BASED NATURAL ATTENUATION
      // ----------------------------------------------------
      const distToOcean = Math.hypot(
        cameraPos.x - this.positions.ocean[0],
        cameraPos.y - this.positions.ocean[1],
        cameraPos.z - this.positions.ocean[2]
      );

      const distToCity = Math.hypot(
        cameraPos.x - this.positions.city[0],
        cameraPos.y - this.positions.city[1],
        cameraPos.z - this.positions.city[2]
      );

      const distToMsg = Math.hypot(
        cameraPos.x - this.positions.message[0],
        cameraPos.y - this.positions.message[1],
        cameraPos.z - this.positions.message[2]
      );

      const distToSignal = Math.hypot(
        cameraPos.x - this.positions.secret_signal[0],
        cameraPos.y - this.positions.secret_signal[1],
        cameraPos.z - this.positions.secret_signal[2]
      );

      // Distance falloff radii (smooth cosine/exponential curve)
      const maxDistance = 7.5;
      const oceanWeight = Math.max(0, 1 - distToOcean / maxDistance) ** 2;
      const cityWeight = Math.max(0, 1 - distToCity / maxDistance) ** 2;
      const msgWeight = Math.max(0, 1 - distToMsg / maxDistance) ** 2;
      const signalWeight = Math.max(0, 1 - distToSignal / 10.0) ** 2;

      const targetOcean = oceanWeight * 0.12;
      const targetCity = cityWeight * 0.10;
      const targetMsg = msgWeight * 0.09;

      let targetSignal = 0;
      if (isAllRecovered) {
        // Subtle background signal presence when all 3 memories are recovered
        targetSignal = Math.max(0.012, signalWeight * 0.12);
      }

      // Base archive volume softens slightly when specific relics are loud
      const totalRelicPresence = targetOcean + targetCity + targetMsg + targetSignal;
      const baseArchiveTarget = isAllRecovered ? 0.08 : 0.13;
      const targetArchive = Math.max(0.04, baseArchiveTarget - totalRelicPresence * 0.45);

      this.archiveGain?.gain.setTargetAtTime(targetArchive, now, tc);
      this.oceanGain?.gain.setTargetAtTime(Math.max(0.0001, targetOcean), now, tc);
      this.cityGain?.gain.setTargetAtTime(Math.max(0.0001, targetCity), now, tc);
      this.messageGain?.gain.setTargetAtTime(Math.max(0.0001, targetMsg), now, tc);
      this.signalGain?.gain.setTargetAtTime(Math.max(0.0001, targetSignal), now, tc);
    } catch {}
  }

  /**
   * Adapts atmosphere on discrete focus changes
   */
  public setFocusAtmosphere(focus: DiscoveryId | null) {
    this.activeFocus = focus;
    if (!this.ctx || !this.initialized || this.isMuted) return;

    try {
      if (this.messagePulseInterval) {
        window.clearInterval(this.messagePulseInterval);
        this.messagePulseInterval = null;
      }

      if (focus === 'message') {
        this.playHeartbeatPulse();
        this.messagePulseInterval = window.setInterval(() => {
          if (!this.isMuted && this.activeFocus === 'message') {
            this.playHeartbeatPulse();
          }
        }, 2200);
      }
    } catch {}
  }

  /**
   * Special contemplative state when final signal message is revealed
   */
  public setFinalSilence(active: boolean) {
    this.isFinalSilenceActive = active;
  }

  // ----------------------------------------------------
  // ONE-SHOT DISCOVERY CHIMES (TRIGGERED ONLY ONCE PER RECOVERY)
  // ----------------------------------------------------
  public playMemoryOpen(type: 'ocean' | 'city' | 'message') {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      // Check if this is the very first time this memory is discovered
      const isFirstDiscovery = !this.discoveredMemorySet.has(type);
      if (isFirstDiscovery) {
        this.discoveredMemorySet.add(type);
        this.playUniqueDiscoveryChime(type);
      }

      this.setFocusAtmosphere(type);
    } catch {}
  }

  /**
   * Unique discovery chime that plays ONLY once upon first recovery
   */
  private playUniqueDiscoveryChime(type: 'ocean' | 'city' | 'message') {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;

      if (type === 'ocean') {
        // Soft resonant water-like chime (subterranean droplet resonance)
        const notes = [392.0, 587.33, 783.99]; // G4, D5, G5
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1400, now + idx * 0.08);
          filter.frequency.exponentialRampToValueAtTime(400, now + idx * 0.08 + 1.6);

          gain.gain.setValueAtTime(0.001, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.07 / (idx + 1), now + idx * 0.08 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.8);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.masterGain || this.ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 1.9);
        });
      } else if (type === 'city') {
        // Electrical resonance relay ping (warm metallic transformer chime)
        const notes = [110.0, 220.0, 440.0]; // A2, A3, A4
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = idx === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          gain.gain.setValueAtTime(0.001, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.06 / (idx + 1), now + idx * 0.05 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 1.4);

          osc.connect(gain);
          gain.connect(this.masterGain || this.ctx.destination);

          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 1.5);
        });
      } else if (type === 'message') {
        // Quiet transmission confirmation (delicate 3-tone harmonic confirmation)
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);

          gain.gain.setValueAtTime(0.001, now + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.06 / (idx + 1), now + idx * 0.09 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 1.6);

          osc.connect(gain);
          gain.connect(this.masterGain || this.ctx.destination);

          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 1.7);
        });
      }
    } catch {}
  }

  private playHeartbeatPulse() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Lub
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(58, now);
      osc1.frequency.exponentialRampToValueAtTime(34, now + 0.18);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.05, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(this.masterGain || this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.24);

      // Dub
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(52, now + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(28, now + 0.38);
      gain2.gain.setValueAtTime(0.001, now + 0.18);
      gain2.gain.linearRampToValueAtTime(0.035, now + 0.21);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      osc2.connect(gain2);
      gain2.connect(this.masterGain || this.ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.44);
    } catch {}
  }

  public playGlitchBurst() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.1);

      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  public playArchiveComplete() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const now = this.ctx.currentTime;
      const chords = [130.81, 196.0, 261.63, 392.0, 523.25]; // Warm C major resonance
      chords.forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.12);

        gain.gain.setValueAtTime(0.001, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.06 / (i + 1), now + i * 0.12 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 3.8);

        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 4.0);
      });
    } catch {}
  }

  public playHoverResonance() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.06);

      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  public playUiClick() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.04);

      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  public playFragmentDiscovered() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const now = this.ctx.currentTime;
      const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6 pure chime
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.001, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.035 / (i + 1), now + i * 0.06 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 1.4);

        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 1.5);
      });
    } catch {}
  }

  public playObjectInspect() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.12);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  public setAtmosphereQuieter(quiet: boolean) {
    try {
      if (!this.masterGain || !this.ctx || this.isMuted) return;
      const targetGain = quiet ? 0.08 : 0.22;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 1.2);
    } catch {}
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0.0001 : 0.22, this.ctx.currentTime);
      }
    } catch {}
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const soundEngine = new SoundEngine();
