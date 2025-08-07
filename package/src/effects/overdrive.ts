export interface OverdriveConfig {
  drive?: number;
}

export class Overdrive {
  private ctx: AudioContext;
  private node: WaveShaperNode;

  constructor(ctx: AudioContext, config: OverdriveConfig = {}) {
    this.ctx = ctx;
    this.node = createMaxOverdrive(ctx, config.drive);
  }

  getNode(): WaveShaperNode {
    return this.node;
  }

  setDrive(drive: number) {
    this.node.curve = makeMaxOverdriveCurve(drive);
  }
}

function createMaxOverdrive(context: AudioContext, drive = 1): WaveShaperNode {
  const node = context.createWaveShaper();
  node.curve = makeMaxOverdriveCurve(drive);
  node.oversample = "4x"; // helps reduce aliasing
  return node;
}

function makeMaxOverdriveCurve(drive: number): Float32Array {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const g = Math.max(1, drive); // match zmap 1–10 range
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1; // -1 to 1
    // Max overdrive~ style: pre-gain then arctangent soft clip
    curve[i] = (2 / Math.PI) * Math.atan(g * x);
  }
  return curve;
}
