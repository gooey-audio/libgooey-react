import { Envelope, ADSRConfig } from "../envelope";
import { Filter, FilterConfig } from "../filter";

export class WhiteNoise {
  private ctx: AudioContext;
  private envelope?: Envelope;
  private filter?: Filter;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  makeBufferSource(destination?: AudioNode, startTime?: number) {
    const bufferSize = this.ctx.sampleRate * 0.2; // 0.2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const bufferSource = this.ctx.createBufferSource();
    bufferSource.buffer = buffer;

    const gain = this.ctx.createGain();
    const now = startTime || this.ctx.currentTime;
    gain.gain.setValueAtTime(1, now);

    // Set up signal chain: bufferSource -> [filter] -> gain -> destination
    const target = destination || this.ctx.destination;

    if (this.filter) {
      // Signal chain: bufferSource -> filter -> gain -> destination
      this.filter.apply(bufferSource, gain, now);
      gain.connect(target);
    } else {
      // Standard chain: bufferSource -> gain -> destination
      bufferSource.connect(gain);
      gain.connect(target);
    }

    return { bufferSource, gain };
  }

  setADSR(config: ADSRConfig) {
    this.envelope = new Envelope(this.ctx, config);
  }

  setFilter(config: FilterConfig) {
    this.filter = new Filter(this.ctx, config);
  }

  setFilterADSR(config: ADSRConfig, frequencyRange: number = 1.0) {
    if (this.filter) {
      this.filter.setFrequencyADSR(config, frequencyRange);
    }
  }

  start(time: number, destination?: AudioNode) {
    const { bufferSource, gain } = this.makeBufferSource(destination, time);
    bufferSource.start(time);

    // Apply envelope if one is set
    if (this.envelope) {
      this.envelope.apply(gain, time);
    }

    return bufferSource;
  }
}
