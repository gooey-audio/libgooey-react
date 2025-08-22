"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useLibGooey } from "@/package/src/libgooey";
import { makeKick } from "@/package/src/kick";
import { makeSnare } from "@/package/src/snare";
import { makePinkHat } from "@/package/src/pink-hat";
import { Sequencer } from "@/package/src/sequencer";
import { useBeatTracker } from "@/package/src/hooks";
import { FilterConfig } from "@/package/src/filter";
import { OverdriveParams } from "@/package/src/effects/overdrive";
import { ReverbParams } from "@/package/src/effects/reverb";
import InstrumentControls from "./InstrumentControls";
import Slider from "./components/Slider";

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
      enabled: true,
      frequency: 5000,
      Q: 1,
      type: "highpass" as BiquadFilterType,
    },
  });

  const [activeTab, setActiveTab] = useState<
    "sequencer" | "instruments" | "master"
  >("sequencer");

  const { audioContext, isLoaded, isLoading, error, initialize, stage } =
    useLibGooey({
      autoInit: true, // Manual initialization for demo
    });

  const sequencerRef = useRef<Sequencer | null>(null);
  const [instrumentsLoading, setInstrumentsLoading] = useState(false);
  const [instrumentsLoaded, setInstrumentsLoaded] = useState(false);
  // Master-level chain removed; effects are applied per-instrument at creation time

  const { currentStep, startBeatTracking, stopBeatTracking } = useBeatTracker({
    audioContext,
    sequencerRef,
  });

  // const handleInitialize = async () => {
  //   await initialize();
  // };

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
    setFilterSettings((prev) => {
      const newSettings = {
        ...prev,
        [instrumentName]: {
          ...prev[instrumentName as keyof typeof prev],
          [property]: value,
        },
      };

      // Update instrument filter settings immediately if stage exists
      if (stage) {
        const instrumentSettings =
          newSettings[instrumentName as keyof typeof newSettings];
        const filterConfig = instrumentSettings?.enabled
          ? {
              frequency: instrumentSettings.frequency,
              Q: instrumentSettings.Q,
              type: instrumentSettings.type,
            }
          : undefined;
        stage.setInstrumentFilter(instrumentName, filterConfig);
      }

      return newSettings;
    });
  };

  // ==== Effects: state and helpers ====
  const [overdriveSettings, setOverdriveSettings] = useState<{
    enabled: boolean;
    params: OverdriveParams;
  }>({
    enabled: false,
    params: { mix: 0.5, drive: 0.75, toneHz: 1200 },
  });

  const [reverbSettings, setReverbSettings] = useState<{
    enabled: boolean;
    params: ReverbParams;
  }>({
    enabled: false,
    params: { mix: 0.25, preDelayMs: 20 },
  });

  const updateOverdrive = (
    updates: Partial<OverdriveParams> | { enabled: boolean }
  ) => {
    if ("enabled" in updates) {
      const enabled = updates.enabled;
      setOverdriveSettings((prev) => ({ ...prev, enabled }));
      // Propagate bypass to existing instruments
      if (stage) {
        ["kick", "snare", "hat", "pinkHat"].forEach((name) =>
          stage.setInstrumentEffectBypassed(name, "Overdrive", !enabled)
        );
      }
      return;
    }
    setOverdriveSettings((prev) => ({
      ...prev,
      params: { ...prev.params, ...updates },
    }));
    // Propagate param changes
    if (stage) {
      const params: OverdriveParams = {
        ...overdriveSettings.params,
        ...updates,
      };
      ["kick", "snare", "hat", "pinkHat"].forEach((name) =>
        stage.updateInstrumentEffect(name, "Overdrive", params)
      );
    }
  };

  const updateReverb = (
    updates: Partial<ReverbParams> | { enabled: boolean }
  ) => {
    if ("enabled" in updates) {
      const enabled = updates.enabled;
      setReverbSettings((prev) => ({ ...prev, enabled }));
      if (stage) {
        ["kick", "snare", "hat", "pinkHat"].forEach((name) =>
          stage.setInstrumentEffectBypassed(name, "Reverb", !enabled)
        );
      }
      return;
    }
    setReverbSettings((prev) => ({
      ...prev,
      params: { ...prev.params, ...updates },
    }));
    if (stage) {
      const params: ReverbParams = { ...reverbSettings.params, ...updates };
      ["kick", "snare", "hat", "pinkHat"].forEach((name) =>
        stage.updateInstrumentEffect(name, "Reverb", params)
      );
    }
  };

  const createInstruments = useCallback(async () => {
    if (!audioContext || !stage || instrumentsLoading) return;

    setInstrumentsLoading(true);
    setInstrumentsLoaded(false);

    try {
      // Create/replace kick instruments
      const kick1 = makeKick(audioContext, 100, {
        effects: {
          overdrive: {
            ...overdriveSettings.params,
            enabled: overdriveSettings.enabled,
          },
          reverb: {
            ...reverbSettings.params,
            enabled: reverbSettings.enabled,
          },
        },
      });

      stage.addInstrument("kick", kick1);

      // Create snare instrument
      const snare = makeSnare(audioContext, 400, 800, {
        decay_time: 0.3,
        effects: {
          overdrive: {
            ...overdriveSettings.params,
            enabled: overdriveSettings.enabled,
          },
          reverb: {
            ...reverbSettings.params,
            enabled: reverbSettings.enabled,
          },
        },
      });

      stage.addInstrument("snare", snare);

      // Create hat instrument
      const hat = makeSnare(audioContext, 200, 800, {
        decay_time: 0.1,
        effects: {
          overdrive: {
            ...overdriveSettings.params,
            enabled: overdriveSettings.enabled,
          },
          reverb: {
            ...reverbSettings.params,
            enabled: reverbSettings.enabled,
          },
        },
      });

      stage.addInstrument("hat", hat);

      // Create pink hat instrument
      const pinkHat = makePinkHat(audioContext, {
        decay_time: 0.1,
        effects: {
          overdrive: {
            ...overdriveSettings.params,
            enabled: overdriveSettings.enabled,
          },
          reverb: {
            ...reverbSettings.params,
            enabled: reverbSettings.enabled,
          },
        },
      });

      stage.addInstrument("pinkHat", pinkHat);

      // Apply current filter settings
      const kickFilter = createFilterConfig("kick");
      const snareFilter = createFilterConfig("snare");
      const hatFilter = createFilterConfig("hat");
      const pinkHatFilter = createFilterConfig("pinkHat");

      stage.setInstrumentFilter("kick", kickFilter);
      stage.setInstrumentFilter("snare", snareFilter);
      stage.setInstrumentFilter("hat", hatFilter);
      stage.setInstrumentFilter("pinkHat", pinkHatFilter);

      // Apply current volume settings
      stage.setInstrumentVolume("kick", volumes.kick);
      stage.setInstrumentVolume("snare", volumes.snare);
      stage.setInstrumentVolume("hat", volumes.hat);
      stage.setInstrumentVolume("pinkHat", volumes.pinkHat);
      stage.setMainVolume(volumes.master);

      setInstrumentsLoaded(true);
    } catch (error) {
      console.error("Failed to create instruments:", error);
    } finally {
      setInstrumentsLoading(false);
    }
  }, [
    audioContext,
    stage,
    overdriveSettings,
    reverbSettings,
    volumes,
    instrumentsLoading,
    makeKick,
    makeSnare,
    makePinkHat,
  ]);

  // Effect to create instruments when audio context is ready and on hot reload
  useEffect(() => {
    if (isLoaded && !instrumentsLoaded && !instrumentsLoading) {
      createInstruments();
    }
  }, [isLoaded, createInstruments, instrumentsLoaded, instrumentsLoading]);

  const triggerKick = () => {
    if (stage && instrumentsLoaded) {
      stage.trigger("kick");
      console.log("Kick triggered!");
    }
  };

  const triggerSnare = () => {
    if (stage && instrumentsLoaded) {
      stage.trigger("snare");
      console.log("Snare triggered!");
    }
  };

  const triggerPinkHat = () => {
    if (stage && instrumentsLoaded) {
      stage.trigger("pinkHat");
      console.log("Pink Hat triggered!");
    }
  };

  const startSequencer = () => {
    const ctx = audioContext;

    if (ctx && stage && !sequencerRef.current && instrumentsLoaded) {
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

  if (isLoading || instrumentsLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">LibGooey React Hook Test</h1>
        <div className="text-lg">
          {isLoading ? "Loading audio engine..." : "Loading instruments..."}
        </div>
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

  if (!isLoaded || !instrumentsLoaded) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">LibGooey React Hook Test</h1>
        <div className="text-lg">Instruments are loading...</div>
      </div>
    );
  }

  const instruments = Object.keys(patterns);

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Top 10%: Buttons only, centered horizontally */}
      <div className="flex-[0_0_10%] p-4 overflow-hidden">
        <div className="h-full flex items-center justify-center gap-4">
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
            Start
          </button>
          <button
            onClick={stopSequencer}
            className="px-6 py-3 bg-black/20 border border-white/10 rounded-xl text-white font-medium hover:bg-black/40 hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
          >
            Stop
          </button>
        </div>
      </div>

      {/* Middle 70%: Tabbed Controls (Sequencer, Effects, Instruments, Master) */}
      <div className="flex-[1_1_70%] p-4 overflow-auto">
        <div className="mb-4 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("sequencer")}
              className={`px-3 py-2 rounded-t-md border-b-2 ${
                activeTab === "sequencer"
                  ? "border-white/80 text-white font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Sequencer
            </button>
            <button
              onClick={() => setActiveTab("instruments")}
              className={`px-3 py-2 rounded-t-md border-b-2 ${
                activeTab === "instruments"
                  ? "border-white/80 text-white font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Instruments
            </button>
            <button
              onClick={() => setActiveTab("master")}
              className={`px-3 py-2 rounded-t-md border-b-2 ${
                activeTab === "master"
                  ? "border-white/80 text-white font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Master
            </button>
          </div>
        </div>

        {activeTab === "sequencer" && (
          <div className="overflow-auto">
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
                            background: isCurrentStep
                              ? "#3b82f6"
                              : isActive
                                ? "#10b981"
                                : "transparent",
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
                                  : "transparent"
                            }
                            stroke={
                              isCurrentStep || isActive
                                ? "transparent"
                                : "rgba(255, 255, 255, 0.1)"
                            }
                            strokeWidth={1}
                            rx={4}
                          />
                        </svg>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600">Current Step: {currentStep}</div>
          </div>
        )}

        {activeTab === "master" && (
          <div>
            <div className="max-w-2xl mb-6">
              <h3 className="text-lg font-semibold mb-3">Master Volume</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 text-sm font-medium text-gray-700">Master</div>
                <Slider
                  min={0}
                  max={2}
                  step={0.01}
                  value={volumes.master}
                  onChange={(v) => handleVolumeChange("master", v)}
                  className="flex-1"
                  ariaLabel="Master volume"
                />
                <div className="w-12 text-sm text-gray-600">
                  {(volumes.master * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-black/20 border border-white/10 rounded-xl backdrop-blur-sm text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">Overdrive</div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={overdriveSettings.enabled}
                      onChange={(e) =>
                        updateOverdrive({ enabled: e.target.checked })
                      }
                    />
                    <span className="text-sm text-white/70">Enable</span>
                  </label>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-xs text-white/70">Mix</div>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={overdriveSettings.params.mix}
                      onChange={(v) => updateOverdrive({ mix: v })}
                      className="flex-1"
                      ariaLabel="Overdrive mix"
                    />
                    <div className="w-16 text-xs text-white/70">
                      {(overdriveSettings.params.mix * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-xs text-white/70">Drive</div>
                    <Slider
                      min={0}
                      max={1.5}
                      step={0.01}
                      value={overdriveSettings.params.drive}
                      onChange={(v) => updateOverdrive({ drive: v })}
                      className="flex-1"
                      ariaLabel="Overdrive drive"
                    />
                    <div className="w-16 text-xs text-white/70">
                      {overdriveSettings.params.drive.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-xs text-white/70">Tone Hz</div>
                    <Slider
                      min={100}
                      max={8000}
                      step={50}
                      value={overdriveSettings.params.toneHz}
                      onChange={(v) => updateOverdrive({ toneHz: Math.round(v) })}
                      className="flex-1"
                      ariaLabel="Overdrive tone"
                    />
                    <div className="w-16 text-xs text-white/70">
                      {overdriveSettings.params.toneHz}Hz
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black/20 border border-white/10 rounded-xl backdrop-blur-sm text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">Reverb</div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={reverbSettings.enabled}
                      onChange={(e) => updateReverb({ enabled: e.target.checked })}
                    />
                    <span className="text-sm text-white/70">Enable</span>
                  </label>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-xs text-white/70">Mix</div>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={reverbSettings.params.mix}
                      onChange={(v) => updateReverb({ mix: v })}
                      className="flex-1"
                      ariaLabel="Reverb mix"
                    />
                    <div className="w-16 text-xs text-white/70">
                      {(reverbSettings.params.mix * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-xs text-white/70">PreDelay</div>
                    <Slider
                      min={0}
                      max={200}
                      step={1}
                      value={reverbSettings.params.preDelayMs}
                      onChange={(v) => updateReverb({ preDelayMs: Math.round(v) })}
                      className="flex-1"
                      ariaLabel="Reverb predelay"
                    />
                    <div className="w-16 text-xs text-white/70">
                      {reverbSettings.params.preDelayMs}ms
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "instruments" && (
          <InstrumentControls
            instruments={instruments}
            volumes={volumes}
            filterSettings={filterSettings}
            stage={stage}
            onVolumeChange={handleVolumeChange}
            onFilterChange={handleFilterChange}
          />
        )}
      </div>

      {/* Bottom 20%: Visual placeholders */}
      <div className="flex-[0_0_20%] p-4 overflow-hidden">
        <div className="flex gap-4 h-full">
          <div className="flex-1 bg-black/20 border border-white/10 rounded-xl flex items-center justify-center">
            <span className="text-white/70 text-sm">Spectrogram (placeholder)</span>
          </div>
          <div className="flex-1 bg-black/20 border border-white/10 rounded-xl flex items-center justify-center">
            <span className="text-white/70 text-sm">Spectrum Analyzer (placeholder)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
