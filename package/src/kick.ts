import { Instrument } from "./instrument";
import { Oscillator, OscType } from "./oscillator";
import { PinkNoise } from "./generators/pink-noise";
import { FilterConfig } from "./filter";
import { ADSRConfig } from "./envelope";
import { OverdriveEffect, OverdriveParams } from "./effects/overdrive";
import { ConvolverReverbEffect, ReverbParams } from "./effects/reverb";

export interface KickConfig {
  filter?: FilterConfig;
  clickFilter?: FilterConfig;
  clickEnvelope?: ADSRConfig;
  mainEnvelope?: ADSRConfig;
  effects?: {
    overdrive?: Partial<OverdriveParams> & { enabled?: boolean };
    reverb?: Partial<ReverbParams> & { enabled?: boolean };
  };
}

export const makeKick = (
  ctx: AudioContext,
  frequency: number = 50, // Lower frequency for better low-end thump
  config?: KickConfig,
) => {
  const inst = new Instrument(ctx);

  // Create sine wave oscillator for the kick body
  const sineOsc = new Oscillator(ctx, frequency, OscType.Sine);

  // Low thump envelope for the sine wave - longer than click but shorter than main envelope
  const clickEnvelope: ADSRConfig = config?.clickEnvelope || {
    attack: 0.002, // 2ms attack for smooth onset
    decay: 0.08, // 80ms decay for low-end thump (longer than click, shorter than noise)
    sustain: 0, // 0% sustain
    release: 0, // 0ms release
  };

  sineOsc.setADSR(clickEnvelope);

  // Create pink noise generator
  const pinkNoise = new PinkNoise(ctx);

  // Main envelope for combined signal (Attack: 0.5-400ms, Decay: 0.5-4000ms, Sustain: 0%, Release: 0ms)
  const mainEnvelope: ADSRConfig = config?.mainEnvelope || {
    attack: 0.002, // 2ms attack (within 0.5-400ms range)
    decay: 0.15,
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

  // TODO
  // probably this just needed more lowpass filtration
  inst.addGenerator("pink", pinkNoise, { volume: 0.04 });

  // Optional per-instrument effects
  if (config?.effects) {
    if (config.effects.overdrive) {
      const od = new OverdriveEffect(ctx, config.effects.overdrive);
      od.setBypassed(!config.effects.overdrive.enabled);
      inst.addEffect(od);
    }
    if (config.effects.reverb) {
      const rv = new ConvolverReverbEffect(
        ctx,
        undefined,
        config.effects.reverb,
      );
      rv.setBypassed(!config.effects.reverb.enabled);
      inst.addEffect(rv);
    }
  }

  return inst;
};
