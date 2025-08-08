export interface AudioEffect<P extends Record<string, unknown>> {
  readonly name: string;
  readonly input: AudioNode;
  readonly output: AudioNode;
  setMix(mix: number): void;
  setBypassed(bypassed: boolean): void;
  update(params: Partial<P>): void;
  remove(): void;
}

export type EffectParams<E extends AudioEffect<any>> = E extends AudioEffect<infer P>
  ? P
  : never;


