import { Envelope, ADSRConfig } from "./envelope";

export enum OscType {
  Triangle,
  Sine,
}

export class Oscillator {
  private ctx: AudioContext;
  // private gain: GainNode;
  private type: OscType;
  // private osc: OscillatorNode;
  private envelope?: Envelope;
  private pitchEnvelope?: Envelope;
  private baseFrequency: number;

  constructor(ctx: AudioContext, freq: number, type: OscType = OscType.Sine) {
    this.ctx = ctx;
    this.baseFrequency = freq;
    this.type = type;
    // this.gain =
  }

  makeOscillator() {
    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    const osc = this.ctx.createOscillator();

    // TODO
    // find better enum enforcement
    if ((this.type = OscType.Sine)) {
      osc.type = "sine";
    }

    if ((this.type = OscType.Triangle)) {
      osc.type = "triangle";
    }

    osc.frequency.setValueAtTime(this.baseFrequency, now);
    gain.gain.setValueAtTime(0, now); // Start from silence, envelope will control volume

    osc.connect(gain);

    // TODO
    // this needs to be lifted if we want stage to
    // have a top level "two bus" style gain
    gain.connect(this.ctx.destination);

    return { osc, gain };
  }

  // connect(gain: GainNode) {
  //   this.gain.connect(gain);
  // }

  setADSR(config: ADSRConfig) {
    this.envelope = new Envelope(this.ctx, config);
  }

  setPitchADSR(config: ADSRConfig) {
    this.pitchEnvelope = new Envelope(this.ctx, config);
  }

  // creating the oscillator node on start, instead of constructor
  // allows us to trigger many instances during sequencer lookahead
  start(time: number) {
    const { osc, gain } = this.makeOscillator();
    osc.start(time);

    // Apply envelope if one is set
    if (this.envelope) {
      this.envelope.apply(gain, time);
    } else {
      // Fallback to default envelope, not sure we want this for non-trigger types
      gain.gain.setValueAtTime(1, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    }

    // Apply pitch envelope if one is set
    if (this.pitchEnvelope) {
      this.pitchEnvelope.applyToPitch(osc, this.baseFrequency, 0.5, time); // 50% pitch range for nice effect
    }

    return osc;
  }

  // stop(future: number) {
  //   this.osc.stop(future);
  // }
}
