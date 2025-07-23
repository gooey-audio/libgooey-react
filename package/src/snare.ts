import { Instrument } from "./instrument";
import { Oscillator, OscType } from "./oscillator";
import { Noise } from "./noise";

export const makeSnare = (ctx: AudioContext, freq1: number, freq2: number) => {
  const inst = new Instrument(ctx);

  const osc1 = new Oscillator(ctx, freq1, OscType.Triangle);

  const noise = new Noise(ctx);

  // const osc2 = new Oscillator(ctx, freq2);

  inst.addGenerator("sub", osc1);
  inst.addGenerator("noise", noise);

  return inst;
};
