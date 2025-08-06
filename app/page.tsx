"use client";

import React, { useRef, useState } from "react";
import { useLibGooey } from "@/package/src/libgooey";
import { makeKick } from "@/package/src/kick";
import { makeSnare } from "@/package/src/snare";
import { makePinkHat } from "@/package/src/pink-hat";
import { Sequencer } from "@/package/src/sequencer";
import { useBeatTracker } from "@/package/src/hooks";
import { FilterConfig } from "@/package/src/filter";

export default function ReactTestPage() {
  const [patterns, setPatterns] = useState({
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    hat: [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1],
    pinkHat: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  });

  const [volumes, setVolumes] = useState({
    master: 1,
    kick: 1,
    snare: 1,
    hat: 1,
    pinkHat: 1,
  });

  const [filterSettings, setFilterSettings] = useState({
    kick: {
      enabled: false,
      frequency: 2000,
      Q: 1,
      type: "lowpass" as BiquadFilterType,
    },
    snare: {
      enabled: false,
      frequency: 4000,
      Q: 1,
      type: "lowpass" as BiquadFilterType,
    },
    hat: {
      enabled: false,
      frequency: 8000,
      Q: 1,
      type: "lowpass" as BiquadFilterType,
    },
    pinkHat: {
      enabled: false,
      frequency: 6000,
      Q: 1,
      type: "lowpass" as BiquadFilterType,
    },
  });

  const { audioContext, isLoaded, isLoading, error, initialize, stage } =
    useLibGooey({
      autoInit: false, // Manual initialization for demo
    });

  const sequencerRef = useRef<Sequencer | null>(null);

  const { currentStep, startBeatTracking, stopBeatTracking } = useBeatTracker({
    audioContext,
    sequencerRef,
  });

  const handleInitialize = async () => {
    await initialize();
  };

  const handlePatternClick = (instrumentName: string, stepIndex: number) => {
    setPatterns((prev) => {
      const newPatterns = { ...prev };
      const instrumentPattern = [
        ...newPatterns[instrumentName as keyof typeof prev],
      ];
      instrumentPattern[stepIndex] = instrumentPattern[stepIndex] === 1 ? 0 : 1;
      newPatterns[instrumentName as keyof typeof prev] = instrumentPattern;

      // Update the sequencer pattern if it's running
      if (sequencerRef.current) {
        sequencerRef.current.setPattern(instrumentName, instrumentPattern);
      }

      return newPatterns;
    });
  };

  const handleClearPattern = (instrumentName: string) => {
    setPatterns((prev) => {
      const newPatterns = { ...prev };
      const clearedPattern = new Array(16).fill(0);
      newPatterns[instrumentName as keyof typeof prev] = clearedPattern;

      // Update the sequencer pattern if it's running
      if (sequencerRef.current) {
        sequencerRef.current.setPattern(instrumentName, clearedPattern);
      }

      return newPatterns;
    });
  };

  const handleVolumeChange = (target: string, value: number) => {
    setVolumes((prev) => ({ ...prev, [target]: value }));

    if (stage) {
      if (target === "master") {
        stage.setMainVolume(value);
      } else {
        stage.setInstrumentVolume(target, value);
      }
    }
  };

  const createFilterConfig = (
    instrumentName: string
  ): FilterConfig | undefined => {
    const settings =
      filterSettings[instrumentName as keyof typeof filterSettings];
    if (!settings.enabled) return undefined;

    return {
      frequency: settings.frequency,
      Q: settings.Q,
      type: settings.type,
    };
  };

  const handleFilterChange = (
    instrumentName: string,
    property: string,
    value: any
  ) => {
    setFilterSettings((prev) => ({
      ...prev,
      [instrumentName]: {
        ...prev[instrumentName as keyof typeof prev],
        [property]: value,
      },
    }));

    // Recreate instrument with new filter settings if sequencer is running
    if (sequencerRef.current && audioContext && stage) {
      recreateInstrument(instrumentName);
    }
  };

  const recreateInstrument = (instrumentName: string) => {
    if (!audioContext || !stage) return;

    const filterConfig = createFilterConfig(instrumentName);

    switch (instrumentName) {
      case "kick":
        const kick = makeKick(
          audioContext,
          50,
          300,
          filterConfig ? { filter: filterConfig } : undefined
        );
        stage.addInstrument("kick", kick);
        break;
      case "snare":
        const snare = makeSnare(audioContext, 400, 800, {
          decay_time: 0.3,
          filter: filterConfig,
        });
        stage.addInstrument("snare", snare);
        break;
      case "hat":
        const hat = makeSnare(audioContext, 200, 800, {
          decay_time: 0.1,
          filter: filterConfig,
        });
        stage.addInstrument("hat", hat);
        break;
    }
  };

  const triggerKick = () => {
    const ctx = audioContext;
    if (ctx && stage) {
      // TODO
      // shouldn't make this on every click
      const filterConfig = createFilterConfig("kick");
      const kick1 = makeKick(
        ctx,
        200,
        800,
        filterConfig ? { filter: filterConfig } : undefined
      );

      const kick2 = makeKick(
        ctx,
        1500,
        2000,
        filterConfig ? { filter: filterConfig } : undefined
      );

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
      const filterConfig = createFilterConfig("snare");
      const snare1 = makeSnare(ctx, 200, 800, {
        decay_time: 0.3,
        filter: filterConfig,
      });

      stage.addInstrument("snare", snare1);

      // TODO
      // allow trigger of n names
      stage.trigger("snare");
    }
  };

  const triggerPinkHat = () => {
    const ctx = audioContext;
    if (ctx && stage) {
      // TODO
      // shouldn't make this on every click
      const pinkHat1 = makePinkHat(ctx, { decay_time: 0.12 });

      stage.addInstrument("pinkHat", pinkHat1);

      // TODO
      // allow trigger of n names
      stage.trigger("pinkHat");

      console.log("Pink Hat triggered!");
    }
  };

  const startSequencer = () => {
    const ctx = audioContext;

    if (ctx && stage && !sequencerRef.current) {
      const startTime = ctx.currentTime;

      // Create instruments with filter configs
      const kickFilter = createFilterConfig("kick");
      const kick = makeKick(
        ctx,
        50,
        300,
        kickFilter ? { filter: kickFilter } : undefined
      );
      stage.addInstrument("kick", kick);

      const snareFilter = createFilterConfig("snare");
      const snare = makeSnare(ctx, 400, 800, {
        decay_time: 0.3,
        filter: snareFilter,
      });
      stage.addInstrument("snare", snare);

      const hatFilter = createFilterConfig("hat");
      const hat = makeSnare(ctx, 200, 800, {
        decay_time: 0.1,
        filter: hatFilter,
      });
      stage.addInstrument("hat", hat);

      const pinkHat = makePinkHat(ctx, { decay_time: 0.1 });
      stage.addInstrument("pinkHat", pinkHat);

      const sequencer = new Sequencer(ctx, {
        tempo: 120,
        stage,
        // for now lets assume that we'll reference the instruments by name
        // could make sense to validate that they exist during constructor
        pattern: patterns,
      });

      sequencerRef.current = sequencer;
      sequencer.start();

      // Start beat tracking
      startBeatTracking();

      // Start the sequencer when desired, e.g., on user action.
      startSequencer();
    }
  };

  const stopSequencer = () => {
    if (sequencerRef.current) {
      sequencerRef.current.stop();
      sequencerRef.current = null;
    }
    stopBeatTracking();
  };

  const handleRandomizePattern = (instrumentName: string) => {
    setPatterns((prev) => {
      const newPatterns = { ...prev };
      const randomPattern = Array.from({ length: 16 }, () =>
        Math.random() > 0.5 ? 1 : 0
      );
      newPatterns[instrumentName as keyof typeof prev] = randomPattern;

      // Update the sequencer pattern if it's running
      if (sequencerRef.current) {
        sequencerRef.current.setPattern(instrumentName, randomPattern);
      }

      return newPatterns;
    });
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

  const instruments = Object.keys(patterns);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">LibGooey React Hook Test</h1>
      <p className="text-green-600 mb-6">
        ✅ Audio engine loaded successfully!
      </p>

      <div className="flex gap-4 mb-6">
        <button
          onClick={triggerKick}
          className="px-6 py-3 bg-black/20 border border-white/10 rounded-xl text-white font-medium hover:bg-black/40 hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
        >
          Kick
        </button>
        <button
          onClick={triggerSnare}
          className="px-6 py-3 bg-black/20 border border-white/10 rounded-xl text-white font-medium hover:bg-black/40 hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
        >
          Snare
        </button>
        <button
          onClick={triggerPinkHat}
          className="px-6 py-3 bg-pink-500/20 border border-pink-300/20 rounded-xl text-white font-medium hover:bg-pink-500/40 hover:border-pink-300/40 transition-all duration-200 backdrop-blur-sm"
        >
          Pink Hat
        </button>
        <button
          onClick={startSequencer}
          className="px-6 py-3 bg-black/20 border border-white/10 rounded-xl text-white font-medium hover:bg-black/40 hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
        >
          Start Sequencer
        </button>
        <button
          onClick={stopSequencer}
          className="px-6 py-3 bg-black/20 border border-white/10 rounded-xl text-white font-medium hover:bg-black/40 hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
        >
          Stop Sequencer
        </button>
      </div>

      <div className="my-6">
        <h3 className="text-lg font-semibold mb-3">Sequencer Pattern</h3>
        <div className="space-y-2">
          {instruments.map((instrument) => (
            <div key={instrument} className="flex items-center gap-2">
              <div className="w-16 text-sm font-medium text-gray-700">
                {instrument}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleClearPattern(instrument)}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  title="Clear pattern"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleRandomizePattern(instrument)}
                  className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                  title="Randomize pattern"
                >
                  Random
                </button>
                {Array.from({ length: 16 }).map((_, i) => {
                  const isActive =
                    patterns[instrument as keyof typeof patterns][i] === 1;
                  const isCurrentStep = i === currentStep - 1; // currentStep is 1-indexed, array is 0-indexed

                  return (
                    <svg
                      key={i}
                      width={24}
                      height={24}
                      style={{
                        // border: "1px solid #ccc",
                        background: isCurrentStep
                          ? "#3b82f6"
                          : isActive
                            ? "#10b981"
                            : "#f3f4f6",
                        borderRadius: 2,
                        boxShadow: isCurrentStep
                          ? "0 0 0 2px #2563eb"
                          : undefined,
                        transition: "background 0.2s, box-shadow 0.2s",
                        cursor: "pointer",
                      }}
                      onClick={() => handlePatternClick(instrument, i)}
                    >
                      <rect
                        x={2}
                        y={2}
                        width={20}
                        height={20}
                        fill={
                          isCurrentStep
                            ? "#3b82f6"
                            : isActive
                              ? "#10b981"
                              : "#e5e7eb"
                        }
                        rx={4}
                      />
                    </svg>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="my-6">
        <h3 className="text-lg font-semibold mb-3">Volume Controls</h3>
        <div className="space-y-3">
          {/* Master Volume */}
          <div className="flex items-center gap-4">
            <div className="w-16 text-sm font-medium text-gray-700">Master</div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={volumes.master}
              onChange={(e) =>
                handleVolumeChange("master", parseFloat(e.target.value))
              }
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="w-12 text-sm text-gray-600">
              {(volumes.master * 100).toFixed(0)}%
            </div>
          </div>

          {/* Instrument Volumes */}
          {instruments.map((instrument) => (
            <div key={instrument} className="flex items-center gap-4">
              <div className="w-16 text-sm font-medium text-gray-700 capitalize">
                {instrument}
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={volumes[instrument as keyof typeof volumes]}
                onChange={(e) =>
                  handleVolumeChange(instrument, parseFloat(e.target.value))
                }
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="w-12 text-sm text-gray-600">
                {(volumes[instrument as keyof typeof volumes] * 100).toFixed(0)}
                %
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="my-6">
        <h3 className="text-lg font-semibold mb-3">Filter Controls</h3>
        <div className="space-y-4">
          {instruments.map((instrument) => {
            
            const settings =
              filterSettings[instrument as keyof typeof filterSettings];
            
              return (
              <div
                key={instrument}
                className="p-4 border border-gray-300 rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 text-sm font-medium text-gray-700 capitalize">
                    {instrument}
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={(e) =>
                        handleFilterChange(
                          instrument,
                          "enabled",
                          e.target.checked
                        )
                      }
                      className="form-checkbox"
                    />
                    <span className="text-sm text-gray-600">Enable Filter</span>
                  </label>
                </div>

                {settings.enabled && (
                  <div className="space-y-3">
                    {/* Frequency Control */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 text-xs text-gray-600">
                        Frequency
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="20000"
                        step="100"
                        value={settings.frequency}
                        onChange={(e) =>
                          handleFilterChange(
                            instrument,
                            "frequency",
                            parseInt(e.target.value)
                          )
                        }
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="w-16 text-xs text-gray-600">
                        {settings.frequency}Hz
                      </div>
                    </div>

                    {/* Q (Resonance) Control */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 text-xs text-gray-600">
                        Resonance
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={settings.Q}
                        onChange={(e) =>
                          handleFilterChange(
                            instrument,
                            "Q",
                            parseFloat(e.target.value)
                          )
                        }
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="w-16 text-xs text-gray-600">
                        {settings.Q.toFixed(1)}
                      </div>
                    </div>

                    {/* Filter Type Control */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 text-xs text-gray-600">Type</div>
                      <select
                        value={settings.type}
                        onChange={(e) =>
                          handleFilterChange(
                            instrument,
                            "type",
                            e.target.value as BiquadFilterType
                          )
                        }
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                      >
                        <option value="lowpass">Low Pass</option>
                        <option value="highpass">High Pass</option>
                        <option value="bandpass">Band Pass</option>
                        <option value="notch">Notch</option>
                        <option value="allpass">All Pass</option>
                        <option value="peaking">Peaking</option>
                        <option value="lowshelf">Low Shelf</option>
                        <option value="highshelf">High Shelf</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3>Current Step: {currentStep}</h3>
      </div>
    </div>
  );
}
