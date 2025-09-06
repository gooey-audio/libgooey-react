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
import { Button, Card, Tabs } from "./ui";
import InstrumentControls from "./InstrumentControls";
import Slider from "./components/Slider";
import SequencerUI from "./components/Sequencer";
import SpectrumAnalyzer from "./components/SpectrumAnalyzer";

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

  const [activeTab, setActiveTab] = useState<"instruments" | "master">(
    "instruments"
  );

  const { audioContext, isLoaded, isLoading, error, initialize, stage } =
    useLibGooey({
      autoInit: true, // Manual initialization for demo
    });

  const sequencerRef = useRef<Sequencer | null>(null);

  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [monitorGain, setMonitorGain] = useState<GainNode | null>(null);

  const [instrumentsLoading, setInstrumentsLoading] = useState(false);

  const [instrumentsLoaded, setInstrumentsLoaded] = useState(false);
  const [sequencerStarting, setSequencerStarting] = useState(false);
  // Master-level chain removed; effects are applied per-instrument at creation time

  const { currentStep, startBeatTracking, stopBeatTracking } = useBeatTracker({
    audioContext,
    sequencerRef,
  });
  // Setup spectrum analyzer and monitoring node when audioContext is ready
  useEffect(() => {
    if (!audioContext) return;

    let localAnalyser: AnalyserNode | null = null;
    let localMonitor: GainNode | null = null;
    try {
      localAnalyser = audioContext.createAnalyser();
      localAnalyser.fftSize = 2048;
      localAnalyser.smoothingTimeConstant = 0.8;

      localMonitor = audioContext.createGain();
      localMonitor.gain.value = 1.0; // unity gain; this tap is not routed to destination
      localMonitor.connect(localAnalyser);

      setAnalyser(localAnalyser);
      setMonitorGain(localMonitor);
    } catch (e) {
      console.error("Failed to initialize spectrum analyzer:", e);
    }

    return () => {
      try {
        if (localMonitor) localMonitor.disconnect();
      } catch {}
    };
  }, [audioContext]);

  // Connect stage output to monitor when available
  useEffect(() => {
    if (!stage || !monitorGain) return;
    try {
      stage.getMainOutput().connect(monitorGain);
    } catch (e) {
      // ignore duplicate connections
    }
  }, [stage, monitorGain]);

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

      // Stage connection to monitor is handled by a separate effect

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
    monitorGain,
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

  const startSequencer = async () => {
    const ctx = audioContext;

    if (
      ctx &&
      stage &&
      !sequencerRef.current &&
      instrumentsLoaded &&
      !sequencerStarting
    ) {
      setSequencerStarting(true);

      try {
        const sequencer = new Sequencer(ctx, {
          tempo: 120,
          stage,
          // for now lets assume that we'll reference the instruments by name
          // could make sense to validate that they exist during constructor
          pattern: patterns,
        });

        sequencerRef.current = sequencer;
        sequencer.start();

        // Wait for the sequencer to properly initialize and start scheduling
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Verify the sequencer actually started
        if (sequencer.isRunning()) {
          startBeatTracking();
        } else {
          console.warn("Sequencer failed to initialize properly, retrying...");
          // Retry once
          sequencer.stop();
          await new Promise((resolve) => setTimeout(resolve, 50));
          sequencer.start();
          await new Promise((resolve) => setTimeout(resolve, 100));

          if (sequencer.isRunning()) {
            startBeatTracking();
          } else {
            console.error("Sequencer failed to start after retry");
          }
        }
      } catch (error) {
        console.error("Failed to start sequencer:", error);
      } finally {
        setSequencerStarting(false);
      }
    }
  };

  const stopSequencer = () => {
    if (sequencerRef.current) {
      sequencerRef.current.stop();
      sequencerRef.current = null;
    }
    stopBeatTracking();
    setSequencerStarting(false);
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

  const tabs = [
    { id: "instruments", label: "Instruments" },
    { id: "master", label: "Master" },
  ];

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      {/* Top Bar - 10% height */}
      <header className="w-full bg-black border-b border-white/20 flex items-center justify-between px-6">
        <h1 className="text-xl font-bold">LibGooey Drum Machine</h1>
        <div className="flex gap-4">
          <Button
            onClick={triggerKick}
            variant="secondary"
            size="default"
            className="px-4 py-2"
          >
            Kick
          </Button>
          <Button
            onClick={triggerSnare}
            variant="secondary"
            size="default"
            className="px-4 py-2"
          >
            Snare
          </Button>
          <Button
            onClick={triggerPinkHat}
            variant="secondary"
            size="default"
            className="px-4 py-2 bg-pink-500/20 border-pink-300/20 hover:bg-pink-500/40"
          >
            Pink Hat
          </Button>
          <Button
            onClick={startSequencer}
            variant="default"
            size="default"
            className="w-16 h-16 p-0 flex items-center justify-center"
            disabled={sequencerStarting}
          >
            {sequencerStarting ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </Button>
          <Button
            onClick={stopSequencer}
            variant="default"
            size="default"
            className="w-16 h-16 p-0 flex items-center justify-center"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" />
            </svg>
          </Button>
        </div>
      </header>

      {/* Main Content Area - 65% height */}
      <main className="flex flex-col">
        <div className="flex flex-1">
          {/* Left Panel - 50% width */}
          <div className="w-1/2 p-4 border-r border-white/20">
            {/* Tab Navigation */}
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(tabId) =>
                setActiveTab(tabId as "instruments" | "master")
              }
              className="mb-4"
            />

            {/* Tab Content */}
            <div className="h-[calc(100%-6rem)] overflow-auto">
              {activeTab === "master" && (
                <div>
                  <div className="max-w-2xl mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-white">
                      Master Volume
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-sm font-medium text-white/70">
                        Master
                      </div>
                      <Slider
                        min={0}
                        max={2}
                        step={0.01}
                        value={volumes.master}
                        onChange={(v) => handleVolumeChange("master", v)}
                        className="flex-1"
                        ariaLabel="Master volume"
                      />
                      <div className="w-12 text-sm text-white/70">
                        {(volumes.master * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <Card className="p-4 text-white">
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
                          <div className="w-20 text-xs text-white/70">
                            Drive
                          </div>
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
                          <div className="w-20 text-xs text-white/70">
                            Tone Hz
                          </div>
                          <Slider
                            min={100}
                            max={8000}
                            step={50}
                            value={overdriveSettings.params.toneHz}
                            onChange={(v) =>
                              updateOverdrive({ toneHz: Math.round(v) })
                            }
                            className="flex-1"
                            ariaLabel="Overdrive tone"
                          />
                          <div className="w-16 text-xs text-white/70">
                            {overdriveSettings.params.toneHz}Hz
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium">Reverb</div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={reverbSettings.enabled}
                            onChange={(e) =>
                              updateReverb({ enabled: e.target.checked })
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
                          <div className="w-20 text-xs text-white/70">
                            PreDelay
                          </div>
                          <Slider
                            min={0}
                            max={200}
                            step={1}
                            value={reverbSettings.params.preDelayMs}
                            onChange={(v) =>
                              updateReverb({ preDelayMs: Math.round(v) })
                            }
                            className="flex-1"
                            ariaLabel="Reverb predelay"
                          />
                          <div className="w-16 text-xs text-white/70">
                            {reverbSettings.params.preDelayMs}ms
                          </div>
                        </div>
                      </div>
                    </Card>
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
          </div>

          {/* Right Panel - 50% width */}
          <div className="w-1/2 p-4">
            {/* Sequencer - Takes up full right panel */}
            <Card className="h-full p-6">
              <div className="h-[calc(100%-3rem)] overflow-auto">
                <SequencerUI
                  patterns={patterns}
                  currentStep={currentStep}
                  instruments={instruments}
                  onPatternClick={handlePatternClick}
                  onClearPattern={handleClearPattern}
                  onRandomizePattern={handleRandomizePattern}
                />
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Analyzer Section - Full width */}
      <section className="w-full p-4 border-t border-white/20">
        <Card className="h-full p-4">
          {analyser ? (
            <SpectrumAnalyzer
              audioContext={audioContext}
              isActive={instrumentsLoaded}
              analyser={analyser}
            />
          ) : (
            <div className="flex items-center justify-center h-20 text-white/70 text-sm">
              Spectrum analyzer loading...
            </div>
          )}
        </Card>
      </section>

      {/* Footer - remaining height */}
      <footer className="h-[10%] w-full bg-black border-t border-white/20 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/70">BPM: 120</span>
          <span className="text-sm text-white/70">
            Step: {currentStep + 1}/16
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70">Master Volume:</span>
          <div className="w-24 h-2 bg-white/20 rounded-full">
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${volumes.master * 50}%` }}
            ></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
