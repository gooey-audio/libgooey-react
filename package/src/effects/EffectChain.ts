import { AudioEffect, EffectParams } from './AudioEffect';
import { EffectName, EffectParamsForName, PartialEffectParams, EffectClassForName } from './EffectRegistry';

export class EffectChain {
  readonly input: GainNode;
  readonly output: GainNode;

  private readonly ctx: AudioContext;
  private effects: AudioEffect<any>[] = [];

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.input = new GainNode(ctx);
    this.output = new GainNode(ctx);
    this.input.connect(this.output);
  }

  add(effect: AudioEffect<any>, index = this.effects.length) {
    this.effects.splice(index, 0, effect);
    this.rebuild();
  }

  move(effect: AudioEffect<any>, newIndex: number) {
    const i = this.effects.indexOf(effect);
    if (i < 0) return;
    this.effects.splice(i, 1);
    this.effects.splice(newIndex, 0, effect);
    this.rebuild();
  }

  remove(effect: AudioEffect<any>) {
    const i = this.effects.indexOf(effect);
    if (i < 0) return;
    this.effects.splice(i, 1);
    this.rebuild();
    effect.remove();
  }

  setBypassed(effect: AudioEffect<any>, bypassed: boolean) {
    effect.setBypassed(bypassed);
  }

  update<E extends AudioEffect<any>>(effect: E, params: Partial<EffectParams<E>>) {
    effect.update(params as Partial<EffectParams<E>>);
  }

  findByName<T extends EffectName>(name: T): EffectClassForName<T> | undefined {
    return this.effects.find((e) => e.name === name) as EffectClassForName<T> | undefined;
  }

  // Generic version for cases where effect name is not known at compile time
  findByNameGeneric(name: string): AudioEffect<any> | undefined {
    return this.effects.find((e) => e.name === name);
  }

  setBypassedByName(name: string, bypassed: boolean) {
    const effect = this.findByNameGeneric(name);
    if (effect) effect.setBypassed(bypassed);
  }

  updateByName<T extends EffectName>(name: T, params: PartialEffectParams<T>) {
    const effect = this.findByName(name);
    if (effect) effect.update(params);
  }

  // TODO
  // shouldn't be called during runtime because we have bypass
  // it could make more sense to have a .build() method to defer connecting nodes
  // on each change 
  // may also be insignificant performance hit at setup time
  private rebuild() {
    this.input.disconnect();
    // IMPORTANT: Do not disconnect effect.input here, as many effects wire their
    // internal graph from effect.input in their constructors. Disconnecting it
    // would sever that internal wiring. Only disconnect the outputs which are
    // the connections we (the chain) created.
    for (const e of this.effects) {
      e.output.disconnect();
    }
    let head: AudioNode = this.input;
    for (const e of this.effects) {
      head.connect(e.input);
      head = e.output;
    }
    head.connect(this.output);
  }
}
