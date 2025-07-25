import { Instrument } from "./instrument";
import { Oscillator } from "./oscillator";

export const makeKick = (ctx: AudioContext, freq1: number, freq2: number) => {
  const inst = new Instrument(ctx);

  const osc1 = new Oscillator(ctx, freq1);

  const osc2 = new Oscillator(ctx, freq2);

  inst.addGenerator("sub", osc1);
  inst.addGenerator("main", osc2);

  return inst;
};
