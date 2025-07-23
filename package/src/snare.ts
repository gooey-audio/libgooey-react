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

  // Apply ADSR settings to the tonal oscillator as specified
  osc1.setADSR(Envelope.createConfig(
    0.001,                   // Very fast attack
    config.decay_time * 0.8, // Main decay
    0.0,                     // No sustain - drums should decay to silence
    config.decay_time * 0.4  // Medium release
  ));

  const noise = new Noise(ctx);

  // const osc2 = new Oscillator(ctx, freq2);

  inst.addGenerator("sub", osc1);
  inst.addGenerator("noise", noise);

  return inst;
};
