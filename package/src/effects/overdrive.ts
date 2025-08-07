export interface OverdriveConfig {
  drive?: number;
}

export class Overdrive {
  private ctx: AudioContext;
  private node: WaveShaperNode;

  constructor(ctx: AudioContext, config: OverdriveConfig = {}) {
    this.ctx = ctx;
    this.node = this.createOverdriveNode(config.drive || 1);
  }

  getNode(): WaveShaperNode {
    return this.node;
  }

  setDrive(drive: number) {
    this.node.curve = this.createOverdriveCurve(drive);
  }

  private createOverdriveNode(drive: number): WaveShaperNode {
    const node = this.ctx.createWaveShaper();
    node.curve = this.createOverdriveCurve(drive);
    node.oversample = "4x"; // helps reduce aliasing
    return node;
  }

  private createOverdriveCurve(drive: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const g = Math.max(1, drive);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1; // -1 to 1
      // Pre-gain then arctangent soft clipping
      curve[i] = (2 / Math.PI) * Math.atan(g * x);
    }
    return curve;
  }
}
