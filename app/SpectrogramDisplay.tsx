"use client";

import React, { useRef, useEffect, useState } from "react";

interface SpectrogramDisplayProps {
  audioContext: AudioContext | null;
  isActive: boolean;
  width?: number;
  height?: number;
  analyser?: AnalyserNode | null;
}

export default function SpectrogramDisplay({
  audioContext,
  isActive,
  width = 800,
  height = 200,
  analyser,
}: SpectrogramDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const spectrogramDataRef = useRef<number[][]>([]);
  const [spectrogramInstance, setSpectrogramInstance] = useState<any>(null);

  // Initialize spectrogram
  useEffect(() => {
    if (!analyser || !canvasRef.current || !audioContext) return;

    const initSpectrogram = async () => {
      try {
        const spectrogramModule = await import("spectrogram");
        const Spectrogram = spectrogramModule.default || spectrogramModule;

        if (!canvasRef.current) return;

        const spectrogram = new Spectrogram(canvasRef.current, {
          audio: {
            enable: false, // We'll provide data manually
          },
          colors: function (steps: number) {
            const colors = [];
            for (let i = 0; i < steps; i++) {
              const ratio = i / steps;
              // Create a color gradient from blue to red
              const hue = (1 - ratio) * 240; // Blue to red
              const saturation = 80;
              const lightness = 20 + ratio * 60; // Darker to lighter
              colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
            }
            return colors;
          },
        });

        // Try to connect the analyser node to the spectrogram
        try {
          // The spectrogram library expects either a MediaStream or Audio element
          // Since we have an AnalyserNode, we'll always fall back to manual mode
          console.log("Spectrogram library loaded, but using manual mode for AnalyserNode compatibility");
          setSpectrogramInstance(null); // Force manual mode
        } catch (connectError) {
          console.error("Failed to connect spectrogram to analyser:", connectError);
          setSpectrogramInstance(null);
        }
      } catch (error) {
        console.error("Failed to initialize spectrogram:", error);
        console.log("Using manual spectrogram drawing mode");
        setSpectrogramInstance(null);
      }
    };

    initSpectrogram();
  }, [analyser, audioContext]);

  // Initialize canvas when component mounts or dimensions change
  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  // Manual spectrogram animation loop function - defined outside useEffect to avoid recreating
  const startManualSpectrogram = React.useCallback(() => {
    if (!isActive || !analyser || !audioContext) return;
    
    console.log("Starting manual spectrogram mode");

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let frameCount = 0;

    function updateManualSpectrogram() {
      if (!analyser || !isActive) return;

      // Get frequency data
      analyser.getByteFrequencyData(dataArray);

      // Convert to array of numbers normalized to 0-1 range
      const normalizedData = Array.from(dataArray).map((value) => value / 255);
      
      // Debug log every 60 frames (roughly once per second at 60fps)
      if (frameCount % 60 === 0) {
        const maxValue = Math.max(...normalizedData);
        const avgValue = normalizedData.reduce((a, b) => a + b, 0) / normalizedData.length;
        console.log(`Manual spectrogram frame ${frameCount}: max=${maxValue.toFixed(3)}, avg=${avgValue.toFixed(3)}, bufferLength=${bufferLength}`);
      }
      frameCount++;

      // Add new data to spectrogram
      spectrogramDataRef.current.push(normalizedData);

      // Keep only the last N time slices to prevent memory issues
      const maxTimeSlices = Math.floor(width / 2);
      if (spectrogramDataRef.current.length > maxTimeSlices) {
        spectrogramDataRef.current.shift();
      }

      // Draw the spectrogram manually
      drawManualSpectrogram(normalizedData);

      animationFrameRef.current = requestAnimationFrame(
        updateManualSpectrogram
      );
    }

    updateManualSpectrogram();
  }, [isActive, analyser, audioContext, width, height]);

  // Animation loop for updating the spectrogram
  useEffect(() => {
    console.log("Spectrogram effect - isActive:", isActive, "analyser:", !!analyser, "audioContext state:", audioContext?.state);
    
    if (!isActive || !analyser || !audioContext || audioContext.state !== 'running') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Stop the spectrogram when inactive
      if (spectrogramInstance) {
        try {
          spectrogramInstance.stop();
        } catch (error) {
          console.error("Error stopping spectrogram:", error);
        }
      }
      return;
    }

    // Always use manual drawing for AnalyserNode compatibility
    startManualSpectrogram();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isActive, analyser, audioContext, startManualSpectrogram]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (spectrogramInstance) {
        try {
          spectrogramInstance.stop();
        } catch (error) {
          console.error("Error stopping spectrogram on cleanup:", error);
        }
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [spectrogramInstance]);

  // Initialize canvas with clear background
  const initializeCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the entire canvas with dark background
    ctx.fillStyle = '#1F2937'; // Dark gray background
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  // Manual spectrogram drawing function
  const drawManualSpectrogram = React.useCallback((frequencyData: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Shift existing image data to the left
    const imageData = ctx.getImageData(1, 0, width - 1, height);
    ctx.putImageData(imageData, 0, 0);

    // Clear the rightmost column
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(width - 1, 0, 1, height);

    // Draw new frequency data as a vertical line on the right
    const sliceWidth = 1;
    const x = width - sliceWidth;

    for (let i = 0; i < frequencyData.length; i++) {
      const y = height - (i / frequencyData.length) * height;
      const intensity = frequencyData[i];

      // Only draw if there's some intensity
      if (intensity > 0.001) {
        // Color based on intensity
        const hue = (1 - intensity) * 240; // Blue to red
        const saturation = 80;
        const lightness = 20 + intensity * 60;

        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.fillRect(x, y, sliceWidth, height / frequencyData.length);
      }
    }
  }, [width, height]);


  return (
    <div className="spectrogram-container bg-gray-800 p-4 rounded-lg border border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Spectrogram</h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${isActive && analyser ? "bg-green-500" : "bg-red-500"}`}
          ></div>
          <span className="text-sm text-gray-300">
            {isActive && analyser ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full border border-gray-500 rounded bg-gray-900"
        style={{ maxWidth: "100%", height: "auto" }}
      />

      <div className="mt-2 text-xs text-gray-400 text-center">
        Time-frequency representation of audio output
      </div>
    </div>
  );
}

// Export the component with a ref to access methods
export const SpectrogramDisplayWithRef = React.forwardRef<
  { connectSource: (source: AudioNode) => void },
  SpectrogramDisplayProps
>((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    connectSource: (source: AudioNode) => {
      // This will use the same analyser as the spectrum analyzer
      // No need to create a new connection
      console.log("Spectrogram display connected to audio source");
    },
  }));

  return <SpectrogramDisplay {...props} />;
});

SpectrogramDisplayWithRef.displayName = "SpectrogramDisplayWithRef";
