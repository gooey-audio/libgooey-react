'use client';

import React, { useRef, useEffect, useState } from 'react';

interface SpectrumAnalyzerProps {
  audioContext: AudioContext | null;
  isActive: boolean;
  width?: number;
  height?: number;
  analyser?: AnalyserNode | null;
}

export default function SpectrumAnalyzer({ audioContext, isActive, width = 400, height = 100, analyser }: SpectrumAnalyzerProps) {
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

    function draw() {
      if (!canvasContext || !analyser) return;

      // Get frequency data
      analyser.getByteFrequencyData(dataArray);

      // console.log('GET BYPTES DATA', dataArray)

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
  }, [isActive, width, height, analyser]);

  return (
    <div className="spectrum-analyzer-container bg-black/20 border border-white/10 rounded-xl backdrop-blur-sm p-4">
      {/* <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Spectrum Analyzer</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isActive && analyser ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-300">
            {isActive && analyser ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div> */}
      
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-500 rounded bg-gray-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      
      <div className="mt-2 text-xs text-gray-400 text-center">
        Real-time frequency analysis of final audio output
      </div>
    </div>
  );
}