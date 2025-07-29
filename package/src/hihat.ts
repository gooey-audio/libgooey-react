import { Instrument } from "./instrument";
import { Oscillator, OscType } from "./oscillator";
import { Noise } from "./noise";

export interface HiHatConfig {
  base_frequency: number; // Base frequency for filtering (6000-12000Hz typical)
  resonance: number; // Filter resonance (0.0-1.0)
  brightness: number; // High-frequency content (0.0-1.0)
  decay_time: number; // Decay length in seconds
  attack_time: number; // Attack time in seconds
  volume: number; // Overall volume (0.0-1.0)
  is_open: boolean; // true for open, false for closed
}

const createHiHatConfig = (
  base_frequency: number,
  resonance: number,
  brightness: number,
  decay_time: number,
  attack_time: number,
  volume: number,
  is_open: boolean,
): HiHatConfig => {
  return {
    base_frequency: Math.max(4000.0, Math.min(16000.0, base_frequency)), // Reasonable hi-hat range
    resonance: Math.max(0.0, Math.min(1.0, resonance)),
    brightness: Math.max(0.0, Math.min(1.0, brightness)),
    decay_time: Math.max(0.01, Math.min(3.0, decay_time)), // Reasonable decay range
    attack_time: Math.max(0.001, Math.min(0.1, attack_time)), // Quick attack for hi-hats
    volume: Math.max(0.0, Math.min(1.0, volume)),
    is_open,
  };
};

const closedDefault = (): HiHatConfig =>
  createHiHatConfig(8000.0, 0.7, 0.6, 0.1, 0.001, 0.8, false);

const openDefault = (): HiHatConfig =>
  createHiHatConfig(8000.0, 0.5, 0.8, 0.8, 0.001, 0.7, true);

export const makeHiHat = (
  ctx: AudioContext,
  config: HiHatConfig = closedDefault(),
) => {
  const inst = new Instrument(ctx);

  // Main noise source for the hi-hat body
  const mainNoise = new Noise(ctx);

  // Brightness noise for high-frequency emphasis
  const brightnessNoise = new Noise(ctx);

  // High-frequency oscillator for metallic character
  const metallicOsc = new Oscillator(ctx, config.base_frequency, OscType.Sine);

  if (config.is_open) {
    // Open hi-hat: longer decay, more sustain
    mainNoise.setADSR({
      attack: config.attack_time, // Quick attack
      decay: config.decay_time * 0.3, // Medium decay
      sustain: 0.3, // Some sustain for open sound
      release: config.decay_time * 0.7, // Longer release
    });

    brightnessNoise.setADSR({
      attack: config.attack_time, // Quick attack
      decay: config.decay_time * 0.3, // Shorter decay for brightness
      sustain: 0.0, // No sustain
      release: config.decay_time * 0.1, // Very short release
    });

    metallicOsc.setADSR({
      attack: config.attack_time, // Quick attack
      decay: config.decay_time * 0.4, // Medium decay
      sustain: 0.2, // Low sustain
      release: config.decay_time * 0.6, // Longer release for open sound
    });
  } else {
    // Closed hi-hat: very short decay, no sustain
    mainNoise.setADSR({
      attack: config.attack_time, // Quick attack
      decay: config.decay_time * 0.8, // Most of the decay
      sustain: 0.0, // No sustain for closed sound
      release: config.decay_time * 0.2, // Short release
    });

    brightnessNoise.setADSR({
      attack: config.attack_time, // Quick attack
      decay: config.decay_time * 0.3, // Shorter decay for brightness
      sustain: 0.0, // No sustain
      release: config.decay_time * 0.1, // Very short release
    });

    metallicOsc.setADSR({
      attack: config.attack_time, // Quick attack
      decay: config.decay_time * 0.9, // Most of the decay
      sustain: 0.0, // No sustain for closed sound
      release: config.decay_time * 0.1, // Very short release
    });
  }

  // Add pitch envelope to metallic oscillator for more character
  metallicOsc.setPitchADSR({
    attack: config.attack_time, // Instant attack
    decay: config.decay_time * 0.2, // Quick pitch drop
    sustain: 0.0, // Drop to base frequency
    release: config.decay_time * 0.1, // Quick release
  });

  inst.addGenerator("main", mainNoise);
  inst.addGenerator("brightness", brightnessNoise);
  inst.addGenerator("metallic", metallicOsc);

  return inst;
};

// Convenience functions for different hi-hat types
export const makeClosedHiHat = (ctx: AudioContext) =>
  makeHiHat(ctx, closedDefault());

export const makeOpenHiHat = (ctx: AudioContext) =>
  makeHiHat(ctx, openDefault());
