import { Envelope, ADSRConfig } from "./envelope";
import { Filter, FilterConfig } from "./filter";
import { Overdrive, OverdriveConfig } from "./effects";

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
  private filter?: Filter;
  private overdrive?: Overdrive;
  private baseFrequency: number;

  constructor(ctx: AudioContext, freq: number, type: OscType = OscType.Sine) {
    this.ctx = ctx;
    this.baseFrequency = freq;
    this.type = type;
    // this.gain =
  }

  makeOscillator(destination?: AudioNode, startTime?: number) {
    const now = startTime || this.ctx.currentTime;
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

    // Set up signal chain: osc -> [filter] -> [overdrive] -> gain -> destination
    const target = destination || this.ctx.destination;
    let currentNode: AudioNode = osc;

    // Apply filter if present
    if (this.filter) {
      this.filter.apply(currentNode, gain, now);
      currentNode = gain;
    } else {
      currentNode.connect(gain);
      currentNode = gain;
    }

    // Apply overdrive if present (after filter, before final gain)
    if (this.overdrive) {
      const overdriveNode = this.overdrive.getNode();
      if (this.filter) {
        // If we have a filter, reconnect: osc -> filter -> overdrive -> gain -> destination
        gain.disconnect();
        this.filter.apply(osc, overdriveNode, now);
        overdriveNode.connect(gain);
      } else {
        // No filter: osc -> overdrive -> gain -> destination
        gain.disconnect();
        osc.connect(overdriveNode);
        overdriveNode.connect(gain);
      }
    }

    gain.connect(target);

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

  setFilter(config: FilterConfig | undefined) {
    this.filter = config ? new Filter(this.ctx, config) : undefined;
  }

  removeFilter() {
    this.filter = undefined;
  }

  setFilterADSR(config: ADSRConfig, frequencyRange: number = 1.0) {
    if (this.filter) {
      this.filter.setFrequencyADSR(config, frequencyRange);
    }
  }

  setOverdrive(config: OverdriveConfig) {
    this.overdrive = new Overdrive(this.ctx, config);
  }

  removeOverdrive() {
    this.overdrive = undefined;
  }

  // creating the oscillator node on start, instead of constructor
  // allows us to trigger many instances during sequencer lookahead
  start(time: number, destination?: AudioNode) {
    const { osc, gain } = this.makeOscillator(destination, time);
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
