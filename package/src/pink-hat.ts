import { Instrument } from "./instrument";
import { PinkNoise } from "./generators";
import { OverdriveEffect, OverdriveParams } from "./effects/overdrive";
import { ConvolverReverbEffect, ReverbParams } from "./effects/reverb";

export interface PinkHatConfig {
  decay_time: number;
  effects?: {
    overdrive?: Partial<OverdriveParams> & { enabled?: boolean };
    reverb?: Partial<ReverbParams> & { enabled?: boolean };
  };
}

export const makePinkHat = (
  ctx: AudioContext,
  config: PinkHatConfig = { decay_time: 0.15 },
) => {
  const inst = new Instrument(ctx);

  const pinkNoise = new PinkNoise(ctx);

  // Apply ADSR settings to the pink noise - shorter than snare for hat-like sound
  pinkNoise.setADSR({
    attack: 0.001, // Very fast attack
    decay: config.decay_time * 0.8, // Quick decay for crisp hat sound
    sustain: 0.0, // No sustain - hats should decay to silence quickly
    release: config.decay_time * 0.3, // Quick release
  });

  inst.addGenerator("pink", pinkNoise);

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
