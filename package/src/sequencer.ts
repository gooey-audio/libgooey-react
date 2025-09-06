import type { Stage } from "./stage";

type PatternDef = Record<string, number[]>;

type SequencerOpts = {
  tempo: number;
  stage: Stage;
  pattern: PatternDef;
};

// lookahead model
// assume 16th note granularity for now
export class Sequencer {
  private ctx: AudioContext;
  private stage: Stage;
  private tempo;
  private pattern: PatternDef;
  private secondsPerBeat;
  private lookahead;
  private scheduleAheadTime;
  private intervalRef: NodeJS.Timeout | undefined;
  private nextNoteTime;
  private sixteenthNoteTime;
  private current16thNote;

  public startTime: number | undefined;
  public currentBeat: number = 0;
  public getCurrentStep(): number {
    return this.current16thNote;
  }

  constructor(ctx: AudioContext, opts: SequencerOpts) {
    this.ctx = ctx;

    this.tempo = opts.tempo;
    this.stage = opts.stage;

    this.pattern = opts.pattern;

    this.secondsPerBeat = 60.0 / this.tempo;
    this.sixteenthNoteTime = this.secondsPerBeat / 4;
    this.lookahead = 25;
    this.scheduleAheadTime = 0.1;
    this.nextNoteTime = ctx.currentTime;
    this.current16thNote = 0;
  }

  // to work with my other instrument abstractions
  // they need an optional time scheduling input arg
  private scheduleNote(time: number) {
    const toTrigger: string[] = [];

    // scan
    Object.entries(this.pattern).forEach(([k, beats]) => {
      const hit = beats[this.current16thNote];

      if (hit && hit === 1) {
        toTrigger.push(k);
      }
    });

    console.log("to trig", toTrigger);

    toTrigger.forEach((instName) => {
      this.stage.triggerAt(instName, time);
    });

    // const osc = this.ctx.createOscillator();
    // const gain = this.ctx.createGain();
    // osc.connect(gain);
    // gain.connect(this.ctx.destination);
    // osc.frequency.value = 440;
    // osc.start(time);
    // osc.stop(time + 0.02);
  }

  public getSixteenthNoteTime() {
    return this.secondsPerBeat / 4;
  }

  private advanceNextNote() {
    this.nextNoteTime += this.sixteenthNoteTime;
    this.current16thNote++;
    this.currentBeat = this.current16thNote;
    if (this.current16thNote === 16) this.current16thNote = 0;
  }

  private scheduler() {
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      console.log(
        "scheduling step",
        this.current16thNote + 1,
        "at time",
        this.nextNoteTime
      );
      this.scheduleNote(this.nextNoteTime);
      this.advanceNextNote();
    }
  }

  public start() {
    this.startTime = this.ctx.currentTime;
    this.nextNoteTime = this.ctx.currentTime;
    this.current16thNote = 0;
    this.intervalRef = setInterval(this.scheduler.bind(this), this.lookahead);
  }

  public stop() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = undefined;
    }
    this.startTime = undefined;
    this.current16thNote = 0;
  }

  public isRunning(): boolean {
    return (
      this.intervalRef !== undefined &&
      this.startTime !== undefined &&
      this.startTime > 0
    );
  }

  public setPattern(instrumentName: string, pattern: number[]) {
    this.pattern[instrumentName] = [...pattern]; // Create a copy to avoid mutation issues
  }

  public getPattern(instrumentName: string): number[] | undefined {
    return this.pattern[instrumentName]
      ? [...this.pattern[instrumentName]]
      : undefined;
  }

  // todo rename
  public getAllPatterns(): PatternDef {
    // Return a deep copy to prevent external mutation
    const copy: PatternDef = {};
    Object.entries(this.pattern).forEach(([key, value]) => {
      copy[key] = [...value];
    });
    return copy;
  }
}
