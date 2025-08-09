// Re-export all effects for convenient importing
export type { AudioEffect, EffectParams } from './AudioEffect';
export { SingleInOutEffect } from './SingleInOutEffect';
export { OverdriveEffect, type OverdriveParams } from './overdrive';
export { ConvolverReverbEffect, type ReverbParams } from './reverb';
export { EffectChain } from './EffectChain';
export type { 
  EffectName, 
  EffectParamsForName, 
  EffectClassForName, 
  PartialEffectParams 
} from './EffectRegistry';
