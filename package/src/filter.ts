import { Envelope, ADSRConfig } from "./envelope";

export interface FilterConfig {
  frequency: number; // Cutoff frequency in Hz
  Q?: number; // Resonance (optional, default 1)
  type?: BiquadFilterType; // Filter type (default 'lowpass')
}

export class Filter {
  private ctx: AudioContext;
  private config: FilterConfig;
  private envelope?: Envelope;
  private frequencyRange: number = 1.0; // Frequency modulation range (default 100%)

  constructor(ctx: AudioContext, config: FilterConfig) {
    this.ctx = ctx;
    this.config = {
      Q: 1,
      type: "lowpass",
      ...config,
    };
  }

  // Create a fresh filter node for each trigger (following existing pattern)
  createFilterNode(): BiquadFilterNode {
    const filter = this.ctx.createBiquadFilter();
    filter.type = this.config.type!;
    filter.frequency.setValueAtTime(
      this.config.frequency,
      this.ctx.currentTime,
    );
    filter.Q.setValueAtTime(this.config.Q!, this.ctx.currentTime);
    return filter;
  }

  // Set ADSR envelope for frequency modulation
  setFrequencyADSR(config: ADSRConfig, frequencyRange: number = 1.0) {
    this.envelope = new Envelope(this.ctx, config);
    this.frequencyRange = frequencyRange;
  }

  // Apply filter to the signal chain
  apply(
    inputNode: AudioNode,
    outputNode: AudioNode,
    startTime: number,
  ): BiquadFilterNode {
    const filter = this.createFilterNode();

    // Insert filter into signal chain
    inputNode.connect(filter);
    filter.connect(outputNode);

    // Apply envelope to filter frequency if configured
    if (this.envelope) {
      this.envelope.applyToFilter(
        filter,
        this.config.frequency,
        this.frequencyRange,
        startTime,
      );
    }

    return filter;
  }
}
