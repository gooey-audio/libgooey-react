import { SingleInOutEffect } from './SingleInOutEffect';

export type OverdriveParams = {
  mix: number; // 0..1
  drive: number; // 0..1.5
  toneHz: number; // lowpass frequency
};

export class OverdriveEffect extends SingleInOutEffect<OverdriveParams> {
  private readonly shaper: WaveShaperNode;
  private readonly postFilter: BiquadFilterNode;

  constructor(ctx: AudioContext, opts: Partial<OverdriveParams> = {}) {
    super(ctx, 'Overdrive', opts.mix ?? 0.5);
    this.shaper = new WaveShaperNode(ctx, { oversample: '4x' });
    this.postFilter = new BiquadFilterNode(ctx, {
      type: 'lowpass',
      frequency: 1200,
    });
    this.shaper.connect(this.postFilter);
    this.initializeEffectCore(this.shaper, this.postFilter);
    this.update({
      drive: opts.drive ?? 0.75,
      toneHz: opts.toneHz ?? 1200,
      mix: opts.mix ?? 0.5,
    });
  }

  update(params: Partial<OverdriveParams>) {
    if (params.mix !== undefined) this.setMix(params.mix);

    if (params.drive !== undefined) {
      const drive = Math.max(0, Math.min(1.5, params.drive));
      this.shaper.curve = createOverdriveCurve(drive);
    }
    if (params.toneHz !== undefined) {
      this.postFilter.frequency.value = Math.max(20, params.toneHz);
    }
  }

  remove() {
    super.remove();
  }
}

function createOverdriveCurve(drive: number) {
  const samples = 2048;
  const curve = new Float32Array(samples);
  const k = drive * 100;
  for (let i = 0; i < samples; i++) {
    const x = (i / samples) * 2 - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}
