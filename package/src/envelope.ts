export interface ADSRConfig {
  attack: number; // Attack time in seconds
  decay: number; // Decay time in seconds
  sustain: number; // Sustain level (0-1)
  release: number; // Release time in seconds
  peak?: number; // Optional peak value for pitch/filter envelopes
  end?: number; // Optional end value for pitch/filter envelopes
  curve?: number; // Optional curve for exponential ramps
}

export class Envelope {
  private ctx: AudioContext;
  private config: ADSRConfig;

  constructor(ctx: AudioContext, config: ADSRConfig) {
    this.ctx = ctx;
    this.config = config;
  }

  // Apply the ADSR envelope to a GainNode
  apply(
    gainNode: GainNode,
    startTime: number = this.ctx.currentTime,
    noteLength?: number,
  ) {
    const { attack, decay, sustain, release } = this.config;
    const gain = gainNode.gain;

    // Start from silence
    gain.setValueAtTime(0, startTime);

    // Attack phase: ramp up to peak (1.0)
    gain.linearRampToValueAtTime(1.0, startTime + attack);

    // Decay phase: ramp down to sustain level
    gain.exponentialRampToValueAtTime(
      Math.max(sustain, 0.001), // Ensure sustain is not exactly 0 for exponential ramp
      startTime + attack + decay,
    );

    // If sustain is 0 (like drums), start release immediately after decay
    // Otherwise, sustain until note release
    if (sustain === 0 || noteLength !== undefined) {
      const releaseStart =
        noteLength !== undefined
          ? startTime + noteLength
          : startTime + attack + decay;

      // Release phase: ramp down to silence
      gain.exponentialRampToValueAtTime(0.001, releaseStart + release);
    }
    // If sustain > 0 and no noteLength specified, the envelope will hold at sustain level
    // until stop() is called with a future time
  }

  // Apply the ADSR envelope to an oscillator's frequency
  applyToPitch(
    oscillator: OscillatorNode,
    baseFrequency: number,
    // pitchRange: number = 1.0,
    startTime: number = this.ctx.currentTime,
    noteLength?: number,
  ) {
    const { attack, decay, sustain, release, peak, end, curve } = this.config;
    const frequency = oscillator.frequency;

    const startFreq = peak !== undefined ? peak : baseFrequency; // Use peak if provided, else baseFrequency
    const endFreq = end !== undefined ? end : baseFrequency; // Use end if provided, else baseFrequency

    console.log('Pitch envelope:', { startFreq, endFreq, attack, decay, curve, startTime });

    // Set initial frequency
    frequency.setValueAtTime(startFreq, startTime);

    // Attack phase: stay at startFreq (no ramp needed since we start there)
    // frequency.linearRampToValueAtTime(startFreq, startTime + attack);

    // Decay phase: ramp to endFreq
    if (curve !== undefined) {
      // Use setTargetAtTime with proper time constant
      const timeConstant = Math.abs(curve);
      frequency.setTargetAtTime(endFreq, startTime + attack, timeConstant);
      console.log('Using setTargetAtTime:', { endFreq, timeConstant, targetTime: startTime + attack });
    } else {
      frequency.exponentialRampToValueAtTime(
        Math.max(endFreq, baseFrequency * 0.1), // Ensure frequency doesn't go too low
        startTime + attack + decay,
      );
      console.log('Using exponentialRampToValueAtTime:', { endFreq, targetTime: startTime + attack + decay });
    }

    // If sustain is 0 (like drums), start release immediately after decay
    // Otherwise, sustain until note release
    if (sustain === 0 || noteLength !== undefined) {
      const releaseStart =
        noteLength !== undefined
          ? startTime + noteLength
          : startTime + attack + decay;

      // Release phase: return to end frequency
      frequency.exponentialRampToValueAtTime(
        endFreq,
        releaseStart + release,
      );
    }
  }

  // Apply the ADSR envelope to a filter's frequency parameter
  applyToFilter(
    filter: BiquadFilterNode,
    baseFrequency: number,
    frequencyRange: number = 1.0,
    startTime: number = this.ctx.currentTime,
    noteLength?: number,
  ) {
    const { attack, decay, sustain, release } = this.config;
    const frequency = filter.frequency;

    // Start at base frequency + range (high frequency for low-pass)
    const startFreq = baseFrequency + baseFrequency * frequencyRange;
    const sustainFreq =
      baseFrequency + baseFrequency * frequencyRange * sustain;

    frequency.setValueAtTime(startFreq, startTime);

    // Attack phase: stay at high frequency
    frequency.linearRampToValueAtTime(startFreq, startTime + attack);

    // Decay phase: drop to sustain frequency
    frequency.exponentialRampToValueAtTime(
      Math.max(sustainFreq, baseFrequency * 0.1), // Ensure frequency doesn't go too low
      startTime + attack + decay,
    );

    // If sustain is 0 (like drums), start release immediately after decay
    // Otherwise, sustain until note release
    if (sustain === 0 || noteLength !== undefined) {
      const releaseStart =
        noteLength !== undefined
          ? startTime + noteLength
          : startTime + attack + decay;

      // Release phase: return to base frequency
      frequency.exponentialRampToValueAtTime(
        Math.max(baseFrequency, 20),
        releaseStart + release,
      );
    }
  }
}
