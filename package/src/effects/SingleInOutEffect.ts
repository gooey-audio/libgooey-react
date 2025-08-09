import { AudioEffect } from "./AudioEffect";

export abstract class SingleInOutEffect<P extends Record<string, unknown>>
  implements AudioEffect<P>
{
  readonly name: string;

  readonly input: GainNode;
  readonly output: GainNode;

  protected readonly splitGain: GainNode;
  protected readonly dryGain: GainNode;
  protected readonly wetGain: GainNode;
  protected readonly sumGain: GainNode;

  private bypassed = false;
  private currentMix: number;
  private readonly ctx: AudioContext;
  private coreIn?: AudioNode;
  private coreOut?: AudioNode;

  constructor(ctx: AudioContext, name: string, initialMix = 0.5) {
    this.ctx = ctx;
    this.name = name;
    this.currentMix = Math.min(1, Math.max(0, initialMix));

    this.input = new GainNode(ctx);
    this.output = new GainNode(ctx);

    this.splitGain = new GainNode(ctx);
    this.dryGain = new GainNode(ctx, { gain: 1 - this.currentMix });
    this.wetGain = new GainNode(ctx, { gain: this.currentMix });
    this.sumGain = new GainNode(ctx);

    this.input.connect(this.splitGain);
    this.splitGain.connect(this.dryGain);
    this.dryGain.connect(this.sumGain);
    this.sumGain.connect(this.output);

    // Wet path will be wired by subclass via initializeEffectCore
    this.wetGain.connect(this.sumGain);
  }

  protected get audioContext(): AudioContext {
    return this.ctx;
  }

  /**
   * Call this from the subclass constructor after creating the effect's core nodes
   * to wire the wet path: split -> effectIn -> effectOut -> wet -> sum.
   */
  protected initializeEffectCore(effectInput: AudioNode, effectOutput: AudioNode) {
    // Disconnect any previous wiring if re-initializing
    if (this.coreIn) this.splitGain.disconnect(this.coreIn);
    if (this.coreOut) this.coreOut.disconnect(this.wetGain);

    this.coreIn = effectInput;
    this.coreOut = effectOutput;

    this.splitGain.connect(this.coreIn);
    this.coreOut.connect(this.wetGain);
  }

  setMix(mix: number) {
    const mixAmt = Math.min(1, Math.max(0, mix));
    this.currentMix = mixAmt;
    this.wetGain.gain.value = this.bypassed ? 0 : this.currentMix;
    this.dryGain.gain.value = 1 - this.currentMix;
  }

  setBypassed(bypassed: boolean) {
    this.bypassed = bypassed;
    if (bypassed) {
      this.wetGain.gain.value = 0;
      this.dryGain.gain.value = 1;
    } else {
      // Restore wet/dry based on current mix when un-bypassing
      this.wetGain.gain.value = this.currentMix;
      this.dryGain.gain.value = 1 - this.currentMix;
    }
  }

  // default no-op; subclasses override
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_: Partial<P>) {}

  remove() {
    this.input.disconnect();
    this.output.disconnect();
    this.splitGain.disconnect();
    this.dryGain.disconnect();
    this.wetGain.disconnect();
    this.sumGain.disconnect();
    if (this.coreIn) this.coreIn.disconnect();
    if (this.coreOut) this.coreOut.disconnect();
  }
}
