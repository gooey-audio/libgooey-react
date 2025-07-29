"use client";

import React from "react";
import { useLibGooey } from "@/package/src/libgooey";
import { makeKick } from "@/package/src/kick";
import { makeSnare } from "@/package/src/snare";
import { makeClosedHiHat, makeOpenHiHat } from "@/package/src/hihat";

export default function ReactTestPage() {
  const { audioContext, isLoaded, isLoading, error, initialize, stage } =
    useLibGooey({
      autoInit: false, // Manual initialization for demo
    });

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

  const triggerClosedHiHat = () => {
    const ctx = audioContext;
    if (ctx && stage) {
      // TODO
      // shouldn't make this on every click
      const closedHihat = makeClosedHiHat(ctx);

      stage.addInstrument("closedHihat", closedHihat);

      // TODO
      // allow trigger of n names
      stage.trigger("closedHihat");

      console.log("Closed HiHat triggered!");
    }
  };

  const triggerOpenHiHat = () => {
    const ctx = audioContext;
    if (ctx && stage) {
      // TODO
      // shouldn't make this on every click
      const openHihat = makeOpenHiHat(ctx);

      stage.addInstrument("openHihat", openHihat);

      // TODO
      // allow trigger of n names
      stage.trigger("openHihat");

      console.log("Open HiHat triggered!");
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
      <button onClick={triggerClosedHiHat}>Closed HiHat</button>
      <button onClick={triggerOpenHiHat}>Open HiHat</button>
    </div>
  );
}
