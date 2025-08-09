import { Oscillator } from "./oscillator";
import { Noise, WhiteNoise, PinkNoise } from "./generators";
import { EffectChain } from "./effects/EffectChain";
import { AudioEffect } from "./effects/AudioEffect";
import { EffectName, PartialEffectParams } from "./effects/EffectRegistry";

// Define a type for any generator (Oscillator or Noise)
export type AudioGenerator = Oscillator | Noise | WhiteNoise | PinkNoise;

type InstGenerator = {
  gen: AudioGenerator;
};

// an instrument is a collection of audio generators
export class Instrument {
  ctx: AudioContext;
  generators: Record<string, InstGenerator>;
  private effectChain?: EffectChain;

  constructor(audioContext: AudioContext) {
    this.ctx = audioContext;
    this.generators = {};
  }

  addGenerator(name: string, gen: AudioGenerator) {
    this.generators[name] = {
      gen,
    };
  }

  ensureEffectChain() {
    if (!this.effectChain) {
      this.effectChain = new EffectChain(this.ctx);
    }
    return this.effectChain;
  }

  addEffect(effect: AudioEffect<any>) {
    const chain = this.ensureEffectChain();
    chain.add(effect);
  }

  getEffectChain(): EffectChain | undefined {
    return this.effectChain;
  }

  setEffectBypassed(effectName: string, bypassed: boolean) {
    if (!this.effectChain) return;
    this.effectChain.setBypassedByName(effectName, bypassed);
  }

  updateEffect<T extends EffectName>(effectName: T, params: PartialEffectParams<T>) {
    if (!this.effectChain) return;
    this.effectChain.updateByName(effectName, params);
  }

  // link this generators of this instrument
  // to the stage
  // could otherwise be down via prop access
  // connect(gain: GainNode) {
  //   for (const key in this.generators) {
  //     if (this.generators.hasOwnProperty(key)) {
  //       const gen = this.generators[key].gen;
  //       gen.connect(gain);
  //     }
  //   }
  // }

  // trigger sort of only makes sense for "oneshot instruments"
  trigger(destination?: AudioNode) {
    this.triggerAt(this.ctx.currentTime, destination);
  }

  triggerAt(time: number, destination?: AudioNode) {
    for (const key in this.generators) {
      if (this.generators.hasOwnProperty(key)) {
        const gen = this.generators[key].gen;
        // If there is an effect chain, route generators through it
        const targetDestination = this.effectChain ? this.effectChain.input : destination;
        const osc = gen.start(time, targetDestination);

        if (osc) {
          // the stop time should really be controlled by
          // the generator's own envelope choice
          osc.stop(this.ctx.currentTime + 0.5);
        }
      }
    }
    // Ensure the chain output is connected to the provided destination
    if (this.effectChain && destination) {
      this.effectChain.output.disconnect();
      this.effectChain.output.connect(destination);
    }
  }


}

// export class OneShot extends Instrument {
//   // private ctx: AudioContext;
//   constructor(audioContext: AudioContext) {
//     super(audioContext);
//   }
// }

// class Oneshot extends Instrument {

// }
