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
  config: SnareConfig = { decay_time: 0.3 }
) => {
  const inst = new Instrument(ctx);

  const osc1 = new Oscillator(ctx, 200, OscType.Sine);

  const noise = new Noise(ctx);

  // Apply ADSR settings to the noise oscillator
  noise.setADSR({
    attack: 0.001, // Very fast attack
    decay: config.decay_time * 0.1, // Main decay
    sustain: 0.0, // No sustain - drums should decay to silence
    release: config.decay_time * 0.02, // Medium release
  });

  // Apply volume envelope to the sine oscillator
  osc1.setADSR({
    attack: 0.001, // Very fast attack
    decay: config.decay_time * 0.2, // Decay time
    sustain: 0.0, // No sustain - drums should decay to silence
    release: config.decay_time * 0.05, // Release time
  });

  // Apply pitch envelope to the tonal oscillator
  osc1.setPitchADSR({
    attack: 0.001, // 1ms
    decay: 0.049, // 49ms to reach 180 Hz
    sustain: 0, // Not used here, but required
    release: 0, // Not used here, but required
    peak: 220, // Start at 220 Hz
    end: 180, // Glide to 180 Hz
    curve: 0.01, // Fast exponential curve for snappy pitch drop
  });

  // Add additional longer oscillator to the snare tone (non-noise)
  const osc2 = new Oscillator(ctx, 400, OscType.Triangle);
  osc2.setADSR({
    attack: 0.001, // 0ms attack
    decay: 0.1, // 100ms decay (between 50-150ms range)
    sustain: 1, // 100% base pitch
    release: 0.01, // 10ms release (between 0-20ms if needed)
    curve: -0.8, // Exponential decay
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
  // inst.addGenerator("tone", osc2);

  // Optional per-instrument effects
  if (config.effects) {
    if (config.effects.overdrive) {
      const od = new OverdriveEffect(ctx, config.effects.overdrive);
      od.setBypassed(!config.effects.overdrive.enabled);
      inst.addEffect(od);
    }
    if (config.effects.reverb) {
      const rv = new ConvolverReverbEffect(
        ctx,
        undefined,
        config.effects.reverb
      );
      rv.setBypassed(!config.effects.reverb.enabled);
      inst.addEffect(rv);
    }
  }

  

  return inst;
};
