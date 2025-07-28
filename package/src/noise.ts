import { Envelope, ADSRConfig } from "./envelope";

export class Noise {
  private ctx: AudioContext;
  private gain: GainNode;
  private bufferSource: AudioBufferSourceNode;
  private envelope?: Envelope;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    const bufferSize = ctx.sampleRate * 0.2; // 0.2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.bufferSource = ctx.createBufferSource();
    this.bufferSource.buffer = buffer;

    this.gain = ctx.createGain();
    this.gain.gain.setValueAtTime(1, ctx.currentTime);

    this.bufferSource.connect(this.gain);
  }

  connect(gain: GainNode) {
    this.gain.connect(gain);
  }

  setADSR(config: ADSRConfig) {
    this.envelope = new Envelope(this.ctx, config);
  }

  start() {
    this.bufferSource.start();
    
    // Apply envelope if one is set
    if (this.envelope) {
      this.envelope.apply(this.gain);
    }
  }

  stop(future: number) {
    this.bufferSource.stop(future);
  }
}
