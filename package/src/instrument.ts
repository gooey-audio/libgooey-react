import { Oscillator } from "./oscillator";
import { Noise, WhiteNoise, PinkNoise } from "./generators";
import { EffectChain } from "./effects/EffectChain";
import { AudioEffect } from "./effects/AudioEffect";
import { EffectName, PartialEffectParams } from "./effects/EffectRegistry";

// Define a type for any generator (Oscillator or Noise)
export type AudioGenerator = Oscillator | Noise | WhiteNoise | PinkNoise;

type InstGenerator = {
  gen: AudioGenerator;
  gain: GainNode;
  volume: number;
  connectedTarget?: AudioNode | null;
};

export type GeneratorOptions = {
  volume?: number; // linear gain, 1.0 = unity
};

// an instrument is a collection of audio generators
export class Instrument {
  ctx: AudioContext;
  generators: Record<string, InstGenerator>;
  private effectChain?: EffectChain;
  private effectChainConnectedTo?: AudioNode;

  constructor(audioContext: AudioContext) {
    this.ctx = audioContext;
    this.generators = {};
  }

  addGenerator(name: string, gen: AudioGenerator, options?: GeneratorOptions) {
    const gain = new GainNode(this.ctx);
    const volume = options?.volume ?? 1.0;
    gain.gain.value = volume;

    this.generators[name] = {
      gen,
      gain,
      volume,
      connectedTarget: null,
    };
  }

  setGeneratorVolume(name: string, volume: number) {
    const instGen = this.generators[name];
    if (!instGen) return;
    instGen.volume = volume;
    instGen.gain.gain.setValueAtTime(volume, this.ctx.currentTime);
  }

  private ensureEffectChain() {
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

  updateEffect<T extends EffectName>(
    effectName: T,
    params: PartialEffectParams<T>
  ) {
    if (!this.effectChain) return;
    this.effectChain.updateByName(effectName, params);
  }

  hasEffect(effectName: string): boolean {
    if (!this.effectChain) return false;
    return this.effectChain.findByNameGeneric(effectName) !== undefined;
  }

  // trigger sort of only makes sense for "oneshot instruments"
  trigger(destination?: AudioNode) {
    this.triggerAt(this.ctx.currentTime, destination);
  }

  triggerAt(time: number, destination?: AudioNode) {
    // Ensure effect chain output is connected to the final destination
    const finalDestination = destination || this.ctx.destination;
    if (this.effectChain && this.effectChainConnectedTo !== finalDestination) {
      // Connect effect chain output to final destination if not already connected
      try {
        this.effectChain.output.disconnect();
      } catch (_) {
        // ignore if not connected
      }
      this.effectChain.output.connect(finalDestination);
      this.effectChainConnectedTo = finalDestination;
    }

    for (const key in this.generators) {
      if (this.generators.hasOwnProperty(key)) {
        const instGen = this.generators[key];
        const gen = instGen.gen;

        // Determine where this generator should feed into
        const targetDestination = this.effectChain
          ? this.effectChain.input
          : finalDestination;

        // Ensure the per-generator gain is connected to the correct target without duplicating connections
        if (instGen.connectedTarget !== targetDestination) {
          try {
            instGen.gain.disconnect();
          } catch (_) {
            // ignore if not connected
          }
          instGen.gain.connect(targetDestination);
          instGen.connectedTarget = targetDestination;
        }

        // Start the generator into its dedicated gain node (for volume control)
        const osc = gen.start(time, instGen.gain);

        if (osc) {
          // the stop time should really be controlled by
          // the generator's own envelope choice
          osc.stop(this.ctx.currentTime + 0.5);
        }
      }
    }
  }
}
