import { Instrument } from "./instrument";
import { Oscillator, OscType } from "./oscillator";
import { Noise } from "./noise";

export const makeClosedHiHat = (ctx: AudioContext) => {
  const inst = new Instrument(ctx);

  // Main noise source for the hi-hat body
  const mainNoise = new Noise(ctx);

  // Brightness noise for high-frequency emphasis
  const brightnessNoise = new Noise(ctx);

  // High-frequency oscillator for metallic character
  const metallicOsc = new Oscillator(ctx, 8000.0, OscType.Sine);

  // Closed hi-hat: very short decay, no sustain
  mainNoise.setADSR({
    attack: 0.001, // Quick attack
    decay: 0.08, // Most of the decay
    sustain: 0.0, // No sustain for closed sound
    release: 0.02, // Short release
  });

  brightnessNoise.setADSR({
    attack: 0.001, // Quick attack
    decay: 0.03, // Shorter decay for brightness
    sustain: 0.0, // No sustain
    release: 0.01, // Very short release
  });

  metallicOsc.setADSR({
    attack: 0.001, // Quick attack
    decay: 0.09, // Most of the decay
    sustain: 0.0, // No sustain for closed sound
    release: 0.01, // Very short release
  });

  // Add pitch envelope to metallic oscillator for more character
  metallicOsc.setPitchADSR({
    attack: 0.001, // Instant attack
    decay: 0.02, // Quick pitch drop
    sustain: 0.0, // Drop to base frequency
    release: 0.01, // Quick release
  });

  inst.addGenerator("main", mainNoise);
  inst.addGenerator("brightness", brightnessNoise);
  inst.addGenerator("metallic", metallicOsc);

  return inst;
};

export const makeOpenHiHat = (ctx: AudioContext) => {
  const inst = new Instrument(ctx);

  // Main noise source for the hi-hat body
  const mainNoise = new Noise(ctx);

  // Brightness noise for high-frequency emphasis
  const brightnessNoise = new Noise(ctx);

  // High-frequency oscillator for metallic character
  const metallicOsc = new Oscillator(ctx, 5000.0, OscType.Sine);

  // Open hi-hat: longer decay, more sustain
  mainNoise.setADSR({
    attack: 0.001, // Quick attack
    decay: 0.24, // Medium decay
    sustain: 0.3, // Some sustain for open sound
    release: 0.56, // Longer release
  });

  brightnessNoise.setADSR({
    attack: 0.001, // Quick attack
    decay: 0.24, // Shorter decay for brightness
    sustain: 0.0, // No sustain
    release: 0.08, // Very short release
  });

  metallicOsc.setADSR({
    attack: 0.001, // Quick attack
    decay: 0.32, // Medium decay
    sustain: 0.05, // Very low sustain
    release: 0.24, // Medium release for open sound
  });

  // Add pitch envelope to metallic oscillator for more character
  metallicOsc.setPitchADSR({
    attack: 0.001, // Instant attack
    decay: 0.16, // Quick pitch drop
    sustain: 0.0, // Drop to base frequency
    release: 0.08, // Quick release
  });

  inst.addGenerator("main", mainNoise);
  inst.addGenerator("brightness", brightnessNoise);
  inst.addGenerator("metallic", metallicOsc);

  return inst;
};
