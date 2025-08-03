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
      audioContext
    ) {
      const sequencer = sequencerRef.current;
      const ctx = audioContext;

      // Calculate elapsed time since start
      const elapsedTime = ctx.currentTime - (sequencer.startTime || 0);

      // Duration of one 16th note (you could also calculate this here if not exposing it)
      const sixteenthNoteDuration = sequencer.getSixteenthNoteTime();

      // Total 16th notes elapsed (use floor to get the current discrete step)
      const totalSixteenthsElapsed = Math.floor(
        elapsedTime / sixteenthNoteDuration
      );

      // Modulo 16 to get the current step (0-15), looping infinitely
      const step = (totalSixteenthsElapsed % 16) + 1;

      // Update state if changed (prevents unnecessary re-renders)
      if (currentStep !== step) {
        console.log(`Step changed from ${currentStep} to ${step}`);
        setCurrentStep(step);
      }

      // Continue the animation loop
      animationFrameRef.current = requestAnimationFrame(updateCurrentBeat);
    }
  };

  const startBeatTracking = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
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
