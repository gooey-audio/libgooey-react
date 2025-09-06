"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

interface SpectrumAnalyzerProps {
  audioContext: AudioContext | null;
  isActive: boolean;
  analyser?: AnalyserNode | null;
}

export default function SpectrumAnalyzer({
  audioContext,
  isActive,
  analyser,
}: SpectrumAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Setup canvas size and resolution
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Only update if size has changed
    if (width !== canvasSize.width || height !== canvasSize.height) {
      setCanvasSize({ width, height });

      // Set actual canvas resolution
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;

      const context = canvas.getContext("2d");
      if (context) {
        context.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    }
  }, [canvasSize.width, canvasSize.height]);

  // Handle canvas resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial setup
    setupCanvas();

    // Use ResizeObserver for better performance
    const resizeObserver = new ResizeObserver(() => {
      setupCanvas();
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, [setupCanvas]);

  // Animation loop for drawing the spectrum
  useEffect(() => {
    if (
      !isActive ||
      !analyser ||
      !canvasRef.current ||
      canvasSize.width === 0 ||
      canvasSize.height === 0
    ) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext("2d");
    if (!canvasContext) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const { width, height } = canvasSize;

    function draw() {
      if (!canvasContext || !analyser) return;

      // Get frequency data
      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      canvasContext.fillStyle = "rgb(30, 30, 30)";
      canvasContext.fillRect(0, 0, width, height);

      // Draw interpolated line
      canvasContext.strokeStyle = "white";
      canvasContext.lineWidth = 2;
      canvasContext.beginPath();

      let started = false;
      for (let i = 0; i < bufferLength; i++) {
        const x = (i / bufferLength) * width;
        const barHeight = (dataArray[i] / 255) * height;
        const y = height - barHeight;

        if (!started) {
          canvasContext.moveTo(x, y);
          started = true;
        } else {
          canvasContext.lineTo(x, y);
        }
      }

      canvasContext.stroke();

      animationFrameRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, analyser, canvasSize]);

  return (
    <div className="spectrum-analyzer-container w-full h-full flex flex-col">
      <canvas
        ref={canvasRef}
        className="w-1/2 h-[80px] border border-white/20 rounded bg-gray-900 block"
      />
    </div>
  );
}
