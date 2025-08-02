"use client";

import React, { useRef, useState } from "react";
import { useLibGooey } from "@/package/src/libgooey";
import { makeKick } from "@/package/src/kick";
import { makeSnare } from "@/package/src/snare";
import { Sequencer } from "@/package/src/sequencer";

export default function ReactTestPage() {
  const [step, setCurrentStep] = useState(0);

  const { audioContext, isLoaded, isLoading, error, initialize, stage } =
    useLibGooey({
      autoInit: false, // Manual initialization for demo
    });

  const sequencerRef = useRef<Sequencer | null>(null);

  const handleInitialize = async () => {
    await initialize();
  };

  const triggerKick = () => {
    const ctx = audioContext;
    if (ctx && stage) {
      // TODO
      // shouldn't make this on every click
      const kick1 = makeKick(ctx, 200, 800);

      const kick2 = makeKick(ctx, 1500, 2000);

      stage.addInstrument("kick", kick1);
      stage.addInstrument("kick2", kick2);

      // TODO
      // allow trigger of n names
      stage.trigger("kick");
      stage.trigger("kick2");

      console.log("Kick triggered!");
    }
  };

  const triggerSnare = () => {
    const ctx = audioContext;
    if (ctx && stage) {
      // TODO
      // shouldn't make this on every click
      const snare1 = makeSnare(ctx, 200, 800);

      stage.addInstrument("snare", snare1);

      // TODO
      // allow trigger of n names
      stage.trigger("snare");
    }
  };

  const startSequencer = () => {
    const ctx = audioContext;
    if (ctx && stage && !sequencerRef.current) {
      //

      const startTime = ctx.currentTime;

      const kick = makeKick(ctx, 50, 300);
      stage.addInstrument("kick", kick);

      const snare = makeKick(ctx, 400, 800);
      stage.addInstrument("snare", snare);

      const hat = makeSnare(ctx, 200, 800);
      stage.addInstrument("hat", hat);

      const sequencer = new Sequencer(ctx, {
        tempo: 120,
        stage,
        // for now lets assume that we'll reference the instruments by name
        // could make sense to validate that they exist during constructor
        pattern: {
          // could be cool to make helpers for generating these
          kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
          snare: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
          hat: [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1],
        },
      });

      sequencerRef.current = sequencer;
      sequencer.start();

      // let currentBeat = 0;
      const bpm = 120; // Beats per minute
      const beatsPerSecond = bpm / 60;
      const sixteenthNoteDurationSeconds = 60 / (4 * bpm);

      console.log("duration seconds", sixteenthNoteDurationSeconds);

      // let startTime = 0;

      // Your sequencer function, e.g., called when starting the sequence.
      // function startSequencer() {
      // currentBeat = 0;
      // startTime = audioContext.currentTime;

      // }

      // Update the current beat based on the elapsed time since the sequencer started.
      function updateCurrentBeat() {
        if (sequencer.startTime && ctx) {
          // Use the sequencer's current beat directly
          const current = sequencer.currentBeat;

          console.log("current", current);

          if (step != current) {
            setCurrentStep(current);
          }

          if (sequencerRef.current) {
            requestAnimationFrame(updateCurrentBeat);
          }
        }
      }

      requestAnimationFrame(updateCurrentBeat);

      // Start the sequencer when desired, e.g., on user action.
      startSequencer();
    }
  };

  const stopSequencer = () => {
    if (sequencerRef.current) {
      sequencerRef.current.stop();
      sequencerRef.current = null;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">LibGooey React Hook Test</h1>
        <div className="text-lg">Loading audio engine...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">LibGooey React Hook Test</h1>
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">LibGooey React Hook Test</h1>
        <p className="mb-4">Click to initialize the audio engine:</p>
        <button
          onClick={handleInitialize}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Initialize Audio
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">LibGooey React Hook Test</h1>
      <p className="text-green-600 mb-6">
        ✅ Audio engine loaded successfully!
      </p>

      <button onClick={triggerKick}>Kick</button>
      <button onClick={triggerSnare}>Snare</button>
      <button onClick={startSequencer}>Start Sequencer</button>
      <button onClick={stopSequencer}>Stop Sequencer</button>

      <div className="flex gap-1 my-6">
        {Array.from({ length: 16 }).map((_, i) => (
          <svg
            key={i}
            width={24}
            height={24}
            style={{
              border: "1px solid #ccc",
              background: i === step ? "#3b82f6" : "#f3f4f6",
              borderRadius: 4,
              boxShadow: i === step ? "0 0 0 2px #2563eb" : undefined,
              transition: "background 0.2s, box-shadow 0.2s",
            }}
          >
            <rect
              x={2}
              y={2}
              width={20}
              height={20}
              fill={i === step ? "#3b82f6" : "#e5e7eb"}
              stroke="#9ca3af"
              strokeWidth={i === step ? 2 : 1}
              rx={4}
            />
          </svg>
        ))}
      </div>

      <div>
        <h3>{step}</h3>
      </div>
    </div>
  );
}
