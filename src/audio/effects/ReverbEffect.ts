import { SingleInOutEffect } from './SingleInOutEffect';

export type ReverbParams = {
  mix: number; // 0..1
  preDelayMs: number; // >= 0
};

export class ConvolverReverbEffect extends SingleInOutEffect<ReverbParams> {
  private readonly convolver: ConvolverNode;
  private preDelay?: DelayNode;

  constructor(
    ctx: AudioContext,
    private impulseBuffer?: AudioBuffer,
    opts: Partial<ReverbParams> = {}
  ) {
    super(ctx, 'Reverb', opts.mix ?? 0.3);
    this.convolver = new ConvolverNode(ctx);
    if (this.impulseBuffer) {
      this.convolver.buffer = this.impulseBuffer;
    } else {
      // Provide a simple default impulse response so the effect is audible
      this.convolver.buffer = createDefaultImpulseResponse(ctx, 2.0, 2.0);
    }

    // set up wet path depending on predelay
    if (this.preDelay) {
      this.preDelay.connect(this.convolver);
      this.initializeEffectCore(this.preDelay, this.convolver);
    } else {
      this.initializeEffectCore(this.convolver, this.convolver);
    }
    this.update({
      mix: opts.mix ?? 0.3,
      preDelayMs: opts.preDelayMs ?? 0,
    });
  }

  setImpulse(buffer: AudioBuffer) {
    this.impulseBuffer = buffer;
    if (this.convolver) this.convolver.buffer = buffer;
  }

  update(params: Partial<ReverbParams>) {
    if (params.mix !== undefined) this.setMix(params.mix);

    if (params.preDelayMs !== undefined) {
      const value = Math.max(0, params.preDelayMs) / 1000;
      if (!this.preDelay) {
        this.preDelay = new DelayNode(this.audioContext, { delayTime: value });
        // Rewire: split -> preDelay -> convolver
        this.preDelay.connect(this.convolver);
        this.initializeEffectCore(this.preDelay, this.convolver);
      } else {
        this.preDelay.delayTime.value = value;
      }
    }
  }

  remove() {
    super.remove();
    if (this.convolver) this.convolver.buffer = null;
  }
}

function createDefaultImpulseResponse(
  ctx: AudioContext,
  durationSeconds = 1.5,
  decay = 2.0,
) {
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(durationSeconds * rate));
  const ir = ctx.createBuffer(2, length, rate);

  for (let channel = 0; channel < ir.numberOfChannels; channel++) {
    const data = ir.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // Exponential decay noise
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }

  return ir;
}


