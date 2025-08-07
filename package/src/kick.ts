import { Instrument } from "./instrument";
import { Oscillator, OscType } from "./oscillator";
import { PinkNoise } from "./generators/pink-noise";
import { FilterConfig } from "./filter";
import { ADSRConfig } from "./envelope";

export interface KickConfig {
  filter?: FilterConfig;
  clickEnvelope?: ADSRConfig;
  mainEnvelope?: ADSRConfig;
}

export const makeKick = (
  ctx: AudioContext,
  frequency: number = 60, // Single base frequency for the kick
  config?: KickConfig,
) => {
  const inst = new Instrument(ctx);

  // Create sine wave oscillator for the kick body
  const sineOsc = new Oscillator(ctx, frequency, OscType.Sine);

  // Fast "click" envelope for the sine wave (Attack: 0-1ms, Decay: 5-20ms, Sustain: 0%, Release: 0ms)
  const clickEnvelope: ADSRConfig = config?.clickEnvelope || {
    attack: 0.001, // 1ms attack
    decay: 0.01, // 10ms decay (between 5-20ms range)
    sustain: 0, // 0% sustain
    release: 0, // 0ms release
  };

  sineOsc.setADSR(clickEnvelope);

  // Create pink noise generator
  const pinkNoise = new PinkNoise(ctx);

  // Main envelope for combined signal (Attack: 0.5-400ms, Decay: 0.5-4000ms, Sustain: 0%, Release: 0ms)
  const mainEnvelope: ADSRConfig = config?.mainEnvelope || {
    attack: 0.002, // 2ms attack (within 0.5-400ms range)
    decay: 0.15, // 150ms decay (within 0.5-4000ms range)
    sustain: 0, // 0% sustain
    release: 0, // 0ms release
  };

  pinkNoise.setADSR(mainEnvelope);

  // Configure lowpass resonant filter (100Hz cutoff, Q=0.2)
  const filterConfig: FilterConfig = config?.filter || {
    frequency: 100, // 100Hz cutoff
    Q: 0.2, // Q of 0.2
    type: "lowpass", // Lowpass resonant filter
  };

  // Apply filter to both sine wave and pink noise
  sineOsc.setFilter(filterConfig);
  pinkNoise.setFilter(filterConfig);

  inst.addGenerator("sine", sineOsc);
  inst.addGenerator("pink", pinkNoise);

  return inst;
};
