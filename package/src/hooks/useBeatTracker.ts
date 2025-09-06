import { useState, useRef, useEffect } from "react";
import type { Sequencer } from "../sequencer";

interface UseBeatTrackerOptions {
  audioContext: AudioContext | null;
  sequencerRef: React.MutableRefObject<Sequencer | null>;
}

export function useBeatTracker({
  audioContext,
  sequencerRef,
}: UseBeatTrackerOptions) {
  const [currentStep, setCurrentStep] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  const updateCurrentBeat = () => {
    if (
      sequencerRef.current &&
      sequencerRef.current.startTime &&
      sequencerRef.current.startTime > 0 &&
      audioContext
    ) {
      const sequencer = sequencerRef.current;
      const ctx = audioContext;

      // Calculate elapsed time since start
      const elapsedTime = ctx.currentTime - (sequencer.startTime || 0);

      // Get the current step directly from the sequencer (0-15)
      const sequencerStep = sequencer.getCurrentStep();
      // Convert to 1-indexed for display (1-16)
      const step = sequencerStep + 1;

      // Update state if changed (prevents unnecessary re-renders)
      if (currentStep !== step) {
        console.log(`Step changed from ${currentStep} to ${step} (sequencer step: ${sequencerStep}, elapsed: ${elapsedTime.toFixed(3)}s)`);
        setCurrentStep(step);
      }

      // Continue the animation loop
      animationFrameRef.current = requestAnimationFrame(updateCurrentBeat);
    } else {
      // If sequencer is not properly initialized, retry in a bit
      if (sequencerRef.current && audioContext) {
        animationFrameRef.current = requestAnimationFrame(updateCurrentBeat);
      }
    }
  };

  const startBeatTracking = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // Reset to step 1 when starting
    setCurrentStep(1);
    updateCurrentBeat();
  };

  const stopBeatTracking = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setCurrentStep(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    currentStep,
    startBeatTracking,
    stopBeatTracking,
  };
}
