'use client';

import React, { useRef, useEffect, useState } from 'react';

interface SpectrumAnalyzerProps {
  audioContext: AudioContext | null;
  isActive: boolean;
  analyser?: AnalyserNode | null;
}

export default function SpectrumAnalyzer({ audioContext, isActive, analyser }: SpectrumAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Animation loop for drawing the spectrum
  useEffect(() => {
    if (!isActive || !analyser || !canvasRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Set canvas size to match its display size
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Set actual canvas resolution
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvasContext.scale(window.devicePixelRatio, window.devicePixelRatio);

    function draw() {
      if (!canvasContext || !analyser) return;

      // Get frequency data
      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      canvasContext.fillStyle = 'rgb(30, 30, 30)';
      canvasContext.fillRect(0, 0, width, height);

      // Draw interpolated line
      canvasContext.strokeStyle = 'white';
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
  }, [isActive, analyser]);

  return (
    <div className="spectrum-analyzer-container w-full h-full flex flex-col">
      <canvas
        ref={canvasRef}
        className="w-full h-full border border-white/20 rounded bg-gray-900 block"
      />
      
      <div className="mt-2 text-xs text-white/70 text-center">
        Real-time frequency analysis of final audio output
      </div>
    </div>
  );
}