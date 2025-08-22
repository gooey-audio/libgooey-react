# Spectrogram Integration Setup

This document describes the setup required for the spectrogram visualization feature.

## Required Dependency

The spectrogram feature requires the `spectrogram` package. Install it using:

```bash
pnpm add spectrogram
```

Or with npm:

```bash
npm install spectrogram
```

## Integration

The spectrogram display has been integrated into the main demo application (`app/page.tsx`) and includes:

1. **SpectrogramDisplay Component** (`app/SpectrogramDisplay.tsx`):
   - Displays real-time frequency analysis of audio output
   - Uses the `spectrogram` package with fallback to manual canvas drawing
   - Shows time-frequency representation with color-coded intensity

2. **Audio Analysis Setup**:
   - Creates an AnalyserNode connected to the audio stage output
   - FFT size: 2048 samples
   - Smoothing time constant: 0.8
   - Connected between stage output and audio destination

3. **UI Integration**:
   - Added to the main demo page between sequencer pattern and master volume sections
   - Shows active/inactive status based on sequencer state
   - Responsive canvas sizing

## Features

- Real-time spectrogram visualization of instrument waveforms
- Fallback to manual canvas drawing if spectrogram package fails to load
- Color-coded frequency intensity (blue = low intensity, red = high intensity)
- Automatic cleanup of animation frames when inactive
- Memory management for time-slice data

## Usage

The spectrogram automatically displays when:
1. Audio context is initialized
2. Instruments are loaded
3. Audio is playing (sequencer running or manual triggers)

The display updates in real-time showing the frequency content of all active instruments mixed together through the audio stage.