# LibGooey React - High-Level Audio Programming Framework

## Overview

**LibGooey React** is a TypeScript framework that provides high-quality APIs for describing and building audio programs using combinations of oscillators, filters, envelopes, sequencers, and effects. The framework abstracts the Web Audio API surface to provide a more intuitive, higher-level programming interface for audio synthesis and music production applications.

**Primary Goal**: Enable developers to build synthesizers, drum machines, and similar audio applications without directly dealing with the complexity of the Web Audio API.

## Repository Structure

### Core Package (`/package/src/`)
The main library code is located in the `/package/` directory and contains the TypeScript framework:

**Core Audio Primitives:**
- `oscillator.ts` - Oscillator generators (sine, triangle) with ADSR envelopes
- `envelope.ts` - ADSR (Attack, Decay, Sustain, Release) envelope implementation
- `filter.ts` - Audio filtering capabilities with configurable parameters
- `generators/` - Noise generators (white noise, pink noise)
- `sequencer.ts` - Pattern-based sequencing system with 16th note granularity
- `stage.ts` - Audio mixing stage for managing multiple instruments

**Instrument System:**
- `instrument.ts` - Base class for combining multiple audio generators into instruments
- `kick.ts`, `snare.ts`, `pink-hat.ts` - Pre-built drum instrument factories

**Effects System:**
- `effects/` - Modular audio effects chain system
  - `AudioEffect.ts` - Base effect interface
  - `EffectChain.ts` - Chain multiple effects together
  - `overdrive.ts` - Overdrive/distortion effect
  - `reverb.ts` - Convolution reverb effect

**React Integration:**
- `libgooey.ts` - Main React hook (`useLibGooey`) for initializing audio context
- `hooks/useBeatTracker.ts` - Hook for tracking sequencer beat position

### Development/Testing Environment (`/app/`)
A Next.js application that serves as a fast debugging and feedback environment:

- `page.tsx` - Interactive drum machine demo with real-time controls
- Provides UI for testing oscillators, filters, effects, and sequencing
- Real-time parameter adjustment for rapid prototyping

### Key Design Principles

1. **High-Level Abstractions**: Developers work with musical concepts (instruments, patterns, effects) rather than low-level Web Audio nodes
2. **Composable Architecture**: Audio generators, effects, and instruments can be combined flexibly
3. **React Integration**: Seamless integration with React applications via hooks
4. **Real-time Control**: All parameters can be adjusted in real-time for interactive applications
5. **Scheduling System**: Precise timing using Web Audio's scheduling capabilities

## Core Components

### Oscillator System
```typescript
// Create oscillators with envelopes and filters
const osc = new Oscillator(audioContext, 440, OscType.Sine);
osc.setADSR({ attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.5 });
osc.setFilter({ frequency: 2000, Q: 1, type: "lowpass" });
```

### Instrument Creation
```typescript
// Build instruments from multiple generators
const instrument = new Instrument(audioContext);
instrument.addGenerator("osc1", oscillator1);
instrument.addGenerator("noise", whiteNoise);
```

### Sequencing
```typescript
// Pattern-based sequencing
const sequencer = new Sequencer(audioContext, {
  tempo: 120,
  stage: audioStage,
  pattern: {
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
  }
});
```

### Stage Management
```typescript
// Mix multiple instruments with individual volume control
const stage = new Stage(audioContext);
stage.addInstrument("kick", kickDrum);
stage.addInstrument("snare", snareDrum);
stage.setInstrumentVolume("kick", 0.8);
```

## Usage Patterns

### React Integration
```typescript
const { audioContext, stage, isLoaded } = useLibGooey({
  sampleRate: 44100,
  autoInit: true
});
```

### Effect Chains
```typescript
// Add effects to instruments
const kick = makeKick(audioContext, 200, 800, {
  effects: {
    overdrive: { mix: 0.5, drive: 0.75, toneHz: 1200, enabled: true },
    reverb: { mix: 0.25, preDelayMs: 20, enabled: true }
  }
});
```

## Development Environment

The included Next.js application (`/app/`) provides:
- Real-time drum machine interface
- Parameter tweaking for all audio components
- Pattern sequencing with visual feedback
- Volume mixing controls
- Filter parameter adjustment
- Effect parameter controls

## Target Use Cases

- **Synthesizer Applications**: Build software synthesizers with custom oscillators and effects
- **Drum Machine Development**: Create drum machines with programmable patterns
- **Music Production Tools**: Develop DAW-like applications with sequencing
- **Interactive Audio**: Real-time audio manipulation in web applications
- **Educational Tools**: Teach audio synthesis concepts with high-level APIs

## Framework Philosophy

LibGooey React bridges the gap between the powerful but complex Web Audio API and the musical concepts that developers actually want to work with. Instead of manually creating and connecting AudioNodes, developers can focus on musical composition, sound design, and user experience while the framework handles the underlying audio plumbing.
