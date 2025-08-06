import { Envelope, ADSRConfig } from "../envelope";

export class PinkNoise {
  private ctx: AudioContext;
  private envelope?: Envelope;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  makeBufferSource(destination?: AudioNode) {
    const bufferSize = this.ctx.sampleRate * 0.2; // 0.2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Pink noise using Paul Kellet's method
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;

      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
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
