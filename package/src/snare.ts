import { Instrument } from "./instrument";
import { Oscillator, OscType } from "./oscillator";
import { Noise } from "./generators";
import { Envelope } from "./envelope";
import { FilterConfig } from "./filter";
import { OverdriveEffect, OverdriveParams } from "./effects/overdrive";
import { ConvolverReverbEffect, ReverbParams } from "./effects/reverb";

export interface SnareConfig {
  decay_time: number;
  filter?: FilterConfig;
  noiseFilter?: FilterConfig;
  effects?: {
    overdrive?: Partial<OverdriveParams> & { enabled?: boolean };
    reverb?: Partial<ReverbParams> & { enabled?: boolean };
  };
}

export const makeSnare = (
  ctx: AudioContext,
  freq1: number,
  freq2: number,
  config: SnareConfig = { decay_time: 0.3 },
) => {
  const inst = new Instrument(ctx);

  const osc1 = new Oscillator(ctx, freq1, OscType.Triangle);

  const noise = new Noise(ctx);

  // Apply ADSR settings to the noise oscillator
  noise.setADSR({
    attack: 0.001, // Very fast attack
    decay: config.decay_time * 0.1, // Main decay
    sustain: 0.0, // No sustain - drums should decay to silence
    release: config.decay_time * 0.02, // Medium release
  });

  // Add additional longer oscillator to the snare tone (non-noise)
  const osc2 = new Oscillator(ctx, freq2, OscType.Triangle);
  osc2.setADSR({
    attack: 0.001, // Very fast attack
    decay: config.decay_time * 1.2, // Longer decay than noise
    sustain: 0.0, // No sustain - drums should decay to silence
    release: config.decay_time * 0.6, // Longer release than noise
  });

  // Apply pitch envelope to the tonal oscillator
  osc2.setPitchADSR({
    attack: 0.001, // Instant attack
    decay: config.decay_time * 0.3, // Quick pitch drop
    sustain: 0.0, // Drop to base frequency
    release: config.decay_time * 0.1, // Quick release
  });

  // Add optional filters
  if (config.filter) {
    osc1.setFilter(config.filter);
    osc2.setFilter(config.filter);
  }

  // Add optional separate filter for noise (different characteristics)
  if (config.noiseFilter) {
    noise.setFilter(config.noiseFilter);
  } else if (config.filter) {
    // Use the same filter as oscillators if no separate noise filter
    noise.setFilter(config.filter);
  }

  inst.addGenerator("sub", osc1);
  inst.addGenerator("noise", noise);
  inst.addGenerator("tone", osc2);

  // Optional per-instrument effects
  if (config.effects) {
    if (config.effects.overdrive) {
      const od = new OverdriveEffect(ctx, config.effects.overdrive);
      od.setBypassed(!config.effects.overdrive.enabled);
      inst.addEffect(od);
    }
    if (config.effects.reverb) {
      const rv = new ConvolverReverbEffect(ctx, undefined, config.effects.reverb);
      rv.setBypassed(!config.effects.reverb.enabled);
      inst.addEffect(rv);
    }
  }

  return inst;
};
