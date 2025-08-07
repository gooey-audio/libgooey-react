import { Instrument } from "@/package/src/instrument";
import { FilterConfig } from "@/package/src/filter";

type InstrumentChannel = {
  instrument: Instrument;
  gain: GainNode;
};

// a collection of active instruments
// also provides mixing
// and "2bus processing"
export class Stage {
  private ctx: AudioContext;
  private mainOut: GainNode;
  private instruments: Record<string, InstrumentChannel>;

  constructor(audioContext: AudioContext, destination?: AudioNode) {
    this.ctx = audioContext;
    this.instruments = {};
    this.mainOut = this.ctx.createGain();
    this.mainOut.gain.setValueAtTime(1, this.ctx.currentTime);

    // Auto-connect to destination (default: audio context destination)
    const target = destination || this.ctx.destination;
    this.mainOut.connect(target);
  }

  addInstrument(name: string, instrument: Instrument) {
    // TODO: enforce name is not already taken
    if (this.instruments[name]) {
      console.warn(
        `Instrument "${name}" already exists. Replacing existing instrument.`
      );
    }

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1, this.ctx.currentTime);

    // Connect instrument's gain to the main output
    gain.connect(this.mainOut);

    this.instruments[name] = {
      instrument,
      gain,
    };
  }

  // TODO
  // check that name exists
  trigger(name: string) {
    const instChannel = this.instruments[name];
    if (instChannel) {
      instChannel.instrument.trigger(instChannel.gain);
    }
  }

  triggerAt(name: string, time: number) {
    const instChannel = this.instruments[name];
    if (instChannel) {
      instChannel.instrument.triggerAt(time, instChannel.gain);
    }
  }

  // Set the main/master volume for the entire stage
  setMainVolume(amt: number) {
    this.mainOut.gain.setValueAtTime(amt, this.ctx.currentTime);
  }

  // Set the volume for a specific instrument
  setInstrumentVolume(name: string, amt: number) {
    if (this.instruments[name]) {
      this.instruments[name].gain.gain.setValueAtTime(
        amt,
        this.ctx.currentTime
      );
    }
  }

  // Set filter configuration for a specific instrument
  setInstrumentFilter(name: string, filterConfig: FilterConfig | undefined) {
    const instChannel = this.instruments[name];
    if (!instChannel) {
      console.warn(`Instrument "${name}" not found.`);
      return;
    }

    const instrument = instChannel.instrument;

    // Apply filter to all generators in the instrument
    for (const generatorName in instrument.generators) {
      const generator = instrument.generators[generatorName].gen;

      if (filterConfig) {
        generator.setFilter(filterConfig);
      } else {
        // Remove filter using the dedicated method
        generator.removeFilter();
      }
    }
  }

  // Remove filter from a specific instrument
  removeInstrumentFilter(name: string) {
    const instChannel = this.instruments[name];
    if (!instChannel) {
      console.warn(`Instrument "${name}" not found.`);
      return;
    }

    const instrument = instChannel.instrument;

    // Remove filter from all generators in the instrument
    for (const generatorName in instrument.generators) {
      const generator = instrument.generators[generatorName].gen;
      generator.removeFilter();
    }
  }

  // Get the current instrument if it exists
  getInstrument(name: string): Instrument | undefined {
    const instChannel = this.instruments[name];
    return instChannel ? instChannel.instrument : undefined;
  }

  // Check if an instrument exists
  hasInstrument(name: string): boolean {
    return name in this.instruments;
  }

  // Connect the stage's main output to the audio context destination
  connect(destination?: AudioNode) {
    const target = destination || this.ctx.destination;
    this.mainOut.connect(target);
  }

  // Disconnect the stage from its current destination
  disconnect() {
    this.mainOut.disconnect();
  }

  // Get the main output node for advanced routing
  getMainOutput(): GainNode {
    return this.mainOut;
  }
}
