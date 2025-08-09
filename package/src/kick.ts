import { Instrument } from "./instrument";
import { Oscillator, OscType } from "./oscillator";
import { PinkNoise } from "./generators/pink-noise";
import { WhiteNoise } from "./generators/white-noise";
import { FilterConfig } from "./filter";
import { ADSRConfig } from "./envelope";
import { OverdriveEffect, OverdriveParams } from "./effects/overdrive";
import { ConvolverReverbEffect, ReverbParams } from "./effects/reverb";

export interface KickConfig {
  filter?: FilterConfig;
  clickFilter?: FilterConfig;
  clickEnvelope?: ADSRConfig;
  mainEnvelope?: ADSRConfig;
  clickLayer?: {
    enabled?: boolean;
    level?: number; // Volume level for click layer (default 0.3)
    filter?: FilterConfig; // High-pass filter for click (default 2000Hz)
    envelope?: ADSRConfig; // Quick decay envelope (default 5ms)
  };
  effects?: {
    overdrive?: Partial<OverdriveParams> & { enabled?: boolean };
    reverb?: Partial<ReverbParams> & { enabled?: boolean };
  };
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
    decay: 0.1, // 10ms decay (between 5-20ms range)
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

  // Optional white noise click layer
  if (config?.clickLayer?.enabled) {
    const whiteNoise = new WhiteNoise(ctx);

    // Configure high-pass filter for "clicky" sound (default 2000Hz)
    const clickFilterConfig: FilterConfig = config.clickLayer.filter || {
      frequency: 2000, // Remove lows for click sound
      Q: 1,
      type: "highpass",
    };
    whiteNoise.setFilter(clickFilterConfig);

    // Quick decay envelope for click (default 5ms decay)
    const clickNoiseEnvelope: ADSRConfig = config.clickLayer.envelope || {
      attack: 0.001, // 1ms attack
      decay: 0.005, // 5ms decay
      sustain: 0, // No sustain
      release: 0, // No release
    };
    whiteNoise.setADSR(clickNoiseEnvelope);

    // Add click layer with specified volume level
    const clickLevel = config.clickLayer.level ?? 0.3;
    inst.addGenerator("click", whiteNoise, { volume: clickLevel });
  }

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
