import { Envelope, ADSRConfig } from "../envelope";

export class WhiteNoise {
  private ctx: AudioContext;
  private envelope?: Envelope;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  makeBufferSource(destination?: AudioNode) {
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

    // Connect to the provided destination or default to audio context destination
    const target = destination || this.ctx.destination;
    gain.connect(target);

    return { bufferSource, gain };
  }

  setADSR(config: ADSRConfig) {
    this.envelope = new Envelope(this.ctx, config);
  }

  start(time: number, destination?: AudioNode) {
    const { bufferSource, gain } = this.makeBufferSource(destination);
    bufferSource.start(time);

    // Apply envelope if one is set
    if (this.envelope) {
      this.envelope.apply(gain, time);
    }

    return bufferSource;
  }
}
