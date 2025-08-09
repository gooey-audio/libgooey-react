import { OverdriveParams, OverdriveEffect } from './overdrive';
import { ReverbParams, ConvolverReverbEffect } from './reverb';

// Registry mapping effect names to their parameter types
export interface EffectParamsRegistry {
  'Overdrive': OverdriveParams;
  'Reverb': ReverbParams;
  // Add more effects here as they are created
}

// Registry mapping effect names to their effect class types
export interface EffectClassRegistry {
  'Overdrive': OverdriveEffect;
  'Reverb': ConvolverReverbEffect;
  // Add more effects here as they are created
}

// Helper type to get parameter type from effect name
export type EffectParamsForName<T extends keyof EffectParamsRegistry> = EffectParamsRegistry[T];

// Helper type to get effect class type from effect name
export type EffectClassForName<T extends keyof EffectClassRegistry> = EffectClassRegistry[T];

// Union of all valid effect names
export type EffectName = keyof EffectParamsRegistry;

// Helper type for partial parameters (used in updates)
export type PartialEffectParams<T extends EffectName> = Partial<EffectParamsForName<T>>;
