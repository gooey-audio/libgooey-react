import { Instrument } from "./instrument";
import { PinkNoise } from "./generators";

export interface PinkHatConfig {
  decay_time: number;
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

  return inst;
};
