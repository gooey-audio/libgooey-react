import { Instrument } from "./instrument";
import { Oscillator } from "./oscillator";
import { Noise } from "./generators";
import { FilterConfig } from "./filter";
import { OverdriveConfig } from "./effects";

export interface KickConfig {
  filter?: FilterConfig;
  clickFilter?: FilterConfig;
  overdrive?: OverdriveConfig;
}

export const makeKick = (
  ctx: AudioContext,
  freq1: number,
  freq2: number,
  config?: KickConfig,
) => {
  const inst = new Instrument(ctx);

  const osc1 = new Oscillator(ctx, freq1);
  const osc2 = new Oscillator(ctx, freq2);

  // Add pitch envelopes to the tonal oscillators
  osc1.setPitchADSR({
    attack: 0.005, // Very quick attack
    decay: 0.1, // Fast decay to create the pitch drop
    sustain: 0, // No sustain - typical for kick drums
    release: 0.05, // Quick release
  });

  osc2.setPitchADSR({
    attack: 0.005, // Very quick attack
    decay: 0.08, // Slightly faster decay for the main oscillator
    sustain: 0, // No sustain - typical for kick drums
    release: 0.05, // Quick release
  });

  // Add optional filters to oscillators
  if (config?.filter) {
    osc1.setFilter(config.filter);
    osc2.setFilter(config.filter);
  }

  // Add optional overdrive to oscillators
  if (config?.overdrive) {
    osc1.setOverdrive(config.overdrive);
    osc2.setOverdrive(config.overdrive);
  }

  // Add short "click" sound using noise generator
  const clickNoise = new Noise(ctx);

  clickNoise.setADSR({
    attack: 0.001, // Extremely quick attack for sharp click
    decay: 0.01, // Very short decay
    sustain: 0, // No sustain
    release: 0.005, // Very quick release
  });

  // Add optional filter to click noise (separate config)
  if (config?.clickFilter) {
    clickNoise.setFilter(config.clickFilter);
  }

  inst.addGenerator("sub", osc1);
  inst.addGenerator("main", osc2);
  inst.addGenerator("click", clickNoise);

  return inst;
};
