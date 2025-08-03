import { Oscillator } from "./oscillator";
import { Noise } from "./noise";

// Define a type for any generator (Oscillator or Noise)
export type AudioGenerator = Oscillator | Noise;

type InstGenerator = {
  gen: AudioGenerator;
};

// an instrument is a collection of audio generators
export class Instrument {
  ctx: AudioContext;
  generators: Record<string, InstGenerator>;

  constructor(audioContext: AudioContext) {
    this.ctx = audioContext;
    this.generators = {};
  }

  addGenerator(name: string, gen: AudioGenerator) {
    this.generators[name] = {
      gen,
    };
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
    trigger() {
      this.triggerAt(this.ctx.currentTime);
    }
  
    triggerAt(time: number) {
      for (const key in this.generators) {
        if (this.generators.hasOwnProperty(key)) {
          const gen = this.generators[key].gen;
          const osc = gen.start(time);
  
          if (osc) {
            // the stop time should really be controlled by
            // the generator's own envelope choice
            osc.stop(this.ctx.currentTime + 0.5);
          }
        }
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
