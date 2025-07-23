import { Envelope, ADSRConfig } from "./envelope";

export enum OscType {
  Triangle,
  Sine,
}

export class Oscillator {
  private ctx: AudioContext;
  private gain: GainNode;
  private osc: OscillatorNode;
  private envelope?: Envelope;

  constructor(ctx: AudioContext, freq: number, type: OscType = OscType.Sine) {
    this.ctx = ctx;

    const now = this.ctx.currentTime;

    const osc = ctx.createOscillator();
    this.osc = osc;

    // TODO
    // find better enum enforcement

    if ((type = OscType.Sine)) {
      osc.type = "sine";
    }

    if ((type = OscType.Triangle)) {
      osc.type = "triangle";
    }

    osc.frequency.setValueAtTime(freq, now);

    const gain = ctx.createGain();

    gain.gain.setValueAtTime(0, now); // Start from silence, envelope will control volume

    osc.connect(gain);

    this.gain = gain;
  }

  connect(gain: GainNode) {
    this.gain.connect(gain);
  }

  setADSR(config: ADSRConfig) {
    this.envelope = new Envelope(this.ctx, config);
  }

  start() {
    this.osc.start();
    
    // Apply envelope if one is set
    if (this.envelope) {
      this.envelope.apply(this.gain);
    } else {
      // Fallback to original behavior if no envelope is set
      const now = this.ctx.currentTime;
      this.gain.gain.setValueAtTime(1, now);
      this.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    }
  }

  stop(future: number) {
    this.osc.stop(future);
  }
}
