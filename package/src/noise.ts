import { Envelope, ADSRConfig } from "./envelope";

export class Noise {
  private ctx: AudioContext;
  // private gain: GainNode;
  // private bufferSource: AudioBufferSourceNode;
  private envelope?: Envelope;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  makeBufferSource() {
    const bufferSize = this.ctx.sampleRate * 0.2; // 0.2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const bufferSource = this.ctx.createBufferSource();
    bufferSource.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1, this.ctx.currentTime);

    bufferSource.connect(gain);

    // TODO
    // connect to master gain
    gain.connect(this.ctx.destination);

    return { bufferSource, gain };
  }

  // connect(gain: GainNode) {
  //   this.gain.connect(gain);
  // }

  setADSR(config: ADSRConfig) {
    this.envelope = new Envelope(this.ctx, config);
  }

  start(time: number) {
    const { bufferSource, gain } = this.makeBufferSource();
    bufferSource.start(time);

    // Apply envelope if one is set
    if (this.envelope) {
      this.envelope.apply(gain, time);
    }

    return bufferSource;
  }

  // stop(future: number) {
  //   this.bufferSource.stop(future);
  // }
}
