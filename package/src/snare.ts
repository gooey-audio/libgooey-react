import { Instrument } from "./instrument";
import { Oscillator, OscType } from "./oscillator";
import { Noise } from "./noise";
import { Envelope } from "./envelope";

export interface SnareConfig {
  decay_time: number;
}

export const makeSnare = (ctx: AudioContext, freq1: number, freq2: number, config: SnareConfig = { decay_time: 0.3 }) => {
  const inst = new Instrument(ctx);

  const osc1 = new Oscillator(ctx, freq1, OscType.Triangle);

  const noise = new Noise(ctx);
  
  // Apply ADSR settings to the noise oscillator
  noise.setADSR({
    attack: 0.001,                   // Very fast attack
    decay: config.decay_time * 0.8,  // Main decay
    sustain: 0.0,                    // No sustain - drums should decay to silence
    release: config.decay_time * 0.4  // Medium release
  });

  // Add additional longer oscillator to the snare tone (non-noise)
  const osc2 = new Oscillator(ctx, freq2, OscType.Triangle);
  osc2.setADSR({
    attack: 0.001,                   // Very fast attack
    decay: config.decay_time * 1.2,  // Longer decay than noise
    sustain: 0.0,                    // No sustain - drums should decay to silence
    release: config.decay_time * 0.6  // Longer release than noise
  });

  inst.addGenerator("sub", osc1);
  inst.addGenerator("noise", noise);
  inst.addGenerator("tone", osc2);

  return inst;
};
