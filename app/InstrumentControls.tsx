"use client";

import React, { useState } from "react";
import { Card } from "./ui";
import Slider from "./components/Slider";
import { FilterConfig } from "@/package/src/filter";
import { OverdriveParams } from "@/package/src/effects/overdrive";
import { ReverbParams } from "@/package/src/effects/reverb";
import { Stage } from "@/package/src/stage";

type InstrumentName = "kick" | "snare" | "hat" | "pinkHat";

interface FilterSettings {
  enabled: boolean;
  frequency: number;
  Q: number;
  type: BiquadFilterType;
}

interface InstrumentControlsProps {
  instruments: string[];
  volumes: Record<string, number>;
  filterSettings: Record<string, FilterSettings>;
  stage: Stage | null;
  onVolumeChange: (instrument: string, value: number) => void;
  onFilterChange: (instrument: string, property: string, value: any) => void;
}

export default function InstrumentControls({
  instruments,
  volumes,
  filterSettings,
  stage,
  onVolumeChange,
  onFilterChange,
}: InstrumentControlsProps) {
  const [activeTab, setActiveTab] = useState<string>(instruments[0] || "kick");

  // Per-instrument effects state
  const [instrumentEffects, setInstrumentEffects] = useState<
    Record<
      string,
      {
        overdrive: { enabled: boolean; params: OverdriveParams };
        reverb: { enabled: boolean; params: ReverbParams };
      }
    >
  >(() => {
    const initial: Record<string, any> = {};
    instruments.forEach((instrument) => {
      initial[instrument] = {
        overdrive: {
          enabled: false,
          params: { mix: 0.5, drive: 0.75, toneHz: 1200 },
        },
        reverb: {
          enabled: false,
          params: { mix: 0.25, preDelayMs: 20 },
        },
      };
    });
    return initial;
  });

  const updateInstrumentOverdrive = (
    instrument: string,
    updates: Partial<OverdriveParams> | { enabled: boolean }
  ) => {
    if ("enabled" in updates) {
      const enabled = updates.enabled;
      setInstrumentEffects((prev) => ({
        ...prev,
        [instrument]: {
          ...prev[instrument],
          overdrive: { ...prev[instrument].overdrive, enabled },
        },
      }));
      if (stage) {
        stage.setInstrumentEffectBypassed(instrument, "Overdrive", !enabled);
      }
      return;
    }

    setInstrumentEffects((prev) => ({
      ...prev,
      [instrument]: {
        ...prev[instrument],
        overdrive: {
          ...prev[instrument].overdrive,
          params: { ...prev[instrument].overdrive.params, ...updates },
        },
      },
    }));

    if (stage) {
      const params: OverdriveParams = {
        ...instrumentEffects[instrument].overdrive.params,
        ...updates,
      };
      stage.updateInstrumentEffect(instrument, "Overdrive", params);
    }
  };

  const updateInstrumentReverb = (
    instrument: string,
    updates: Partial<ReverbParams> | { enabled: boolean }
  ) => {
    if ("enabled" in updates) {
      const enabled = updates.enabled;
      setInstrumentEffects((prev) => ({
        ...prev,
        [instrument]: {
          ...prev[instrument],
          reverb: { ...prev[instrument].reverb, enabled },
        },
      }));
      if (stage) {
        stage.setInstrumentEffectBypassed(instrument, "Reverb", !enabled);
      }
      return;
    }

    setInstrumentEffects((prev) => ({
      ...prev,
      [instrument]: {
        ...prev[instrument],
        reverb: {
          ...prev[instrument].reverb,
          params: { ...prev[instrument].reverb.params, ...updates },
        },
      },
    }));

    if (stage) {
      const params: ReverbParams = {
        ...instrumentEffects[instrument].reverb.params,
        ...updates,
      };
      stage.updateInstrumentEffect(instrument, "Reverb", params);
    }
  };

  const currentInstrument = activeTab;
  const currentSettings = filterSettings[currentInstrument];
  const currentEffects = instrumentEffects[currentInstrument];

  return (
    <div className="my-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/20 mb-4">
        {instruments.map((instrument) => (
          <button
            key={instrument}
            onClick={() => setActiveTab(instrument)}
            className={`px-4 py-2 font-medium text-sm capitalize transition-colors ${
              activeTab === instrument
                ? "border-b-2 border-white text-white bg-white/10"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            {instrument}
          </button>
        ))}
      </div>

      {/* Current Instrument Control Panel */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Volume Control */}
            <Card className="p-4 h-32">
              <h5 className="text-sm font-medium text-white/90 mb-3">Volume</h5>
              <div className="flex items-center gap-4">
                <Slider
                  min={0}
                  max={2}
                  step={0.01}
                  value={volumes[currentInstrument] || 1}
                  onChange={(v) => onVolumeChange(currentInstrument, v)}
                  className="flex-1"
                  ariaLabel={`${currentInstrument} volume`}
                />
                <div className="w-12 text-sm text-white/70">
                  {((volumes[currentInstrument] || 1) * 100).toFixed(0)}%
                </div>
              </div>
            </Card>

            {/* Overdrive Effect */}
            <Card className="p-4 h-48">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-white/90">Overdrive</h5>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentEffects?.overdrive.enabled || false}
                    onChange={(e) =>
                      updateInstrumentOverdrive(currentInstrument, {
                        enabled: e.target.checked,
                      })
                    }
                    className="form-checkbox h-3 w-3"
                  />
                  <span className="text-xs text-white/70">Enable</span>
                </label>
              </div>

              <div
                className={`space-y-3 ${!currentEffects?.overdrive.enabled ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-12 text-xs text-white/70">Mix</div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={currentEffects?.overdrive.params.mix || 0.5}
                    onChange={(v) =>
                      updateInstrumentOverdrive(currentInstrument, { mix: v })
                    }
                    className="flex-1"
                    ariaLabel={`${currentInstrument} overdrive mix`}
                  />
                  <div className="w-10 text-xs text-white/70">
                    {(
                      (currentEffects?.overdrive.params.mix || 0.5) * 100
                    ).toFixed(0)}
                    %
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 text-xs text-white/70">Drive</div>
                  <Slider
                    min={0}
                    max={1.5}
                    step={0.01}
                    value={currentEffects?.overdrive.params.drive || 0.75}
                    onChange={(v) =>
                      updateInstrumentOverdrive(currentInstrument, { drive: v })
                    }
                    className="flex-1"
                    ariaLabel={`${currentInstrument} overdrive drive`}
                  />
                  <div className="w-10 text-xs text-white/70">
                    {(currentEffects?.overdrive.params.drive || 0.75).toFixed(
                      2
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 text-xs text-white/70">Tone</div>
                  <Slider
                    min={100}
                    max={8000}
                    step={50}
                    value={currentEffects?.overdrive.params.toneHz || 1200}
                    onChange={(v) =>
                      updateInstrumentOverdrive(currentInstrument, {
                        toneHz: Math.round(v),
                      })
                    }
                    className="flex-1"
                    ariaLabel={`${currentInstrument} overdrive tone`}
                  />
                  <div className="w-10 text-xs text-white/70">
                    {currentEffects?.overdrive.params.toneHz || 1200}Hz
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Filter Controls */}
            <Card className="p-4 h-48">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-white/90">Filter</h5>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentSettings?.enabled || false}
                    onChange={(e) =>
                      onFilterChange(
                        currentInstrument,
                        "enabled",
                        e.target.checked
                      )
                    }
                    className="form-checkbox h-3 w-3"
                  />
                  <span className="text-xs text-white/70">Enable</span>
                </label>
              </div>

              <div
                className={`space-y-3 ${!currentSettings?.enabled ? "opacity-50 pointer-events-none" : ""}`}
              >
                {/* Frequency */}
                <div className="flex items-center gap-2">
                  <div className="w-12 text-xs text-white/70">Freq</div>
                  <Slider
                    min={100}
                    max={20000}
                    step={100}
                    value={currentSettings?.frequency || 2000}
                    onChange={(v) =>
                      onFilterChange(
                        currentInstrument,
                        "frequency",
                        Math.round(v)
                      )
                    }
                    className="flex-1"
                    ariaLabel={`${currentInstrument} filter frequency`}
                  />
                  <div className="w-14 text-xs text-white/70">
                    {currentSettings?.frequency || 2000}Hz
                  </div>
                </div>

                {/* Q */}
                <div className="flex items-center gap-2">
                  <div className="w-12 text-xs text-white/70">Q</div>
                  <Slider
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={currentSettings?.Q || 1}
                    onChange={(v) => onFilterChange(currentInstrument, "Q", v)}
                    className="flex-1"
                    ariaLabel={`${currentInstrument} filter Q`}
                  />
                  <div className="w-14 text-xs text-white/70">
                    {(currentSettings?.Q || 1).toFixed(1)}
                  </div>
                </div>

                {/* Type */}
                <select
                  value={currentSettings?.type || "lowpass"}
                  onChange={(e) =>
                    onFilterChange(
                      currentInstrument,
                      "type",
                      e.target.value as BiquadFilterType
                    )
                  }
                  className="w-full px-2 py-1 text-xs border border-white/30 rounded bg-black/50 text-white"
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
            </Card>

            {/* Reverb Effect */}
            <Card className="p-4 h-32">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-white/90">Reverb</h5>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentEffects?.reverb.enabled || false}
                    onChange={(e) =>
                      updateInstrumentReverb(currentInstrument, {
                        enabled: e.target.checked,
                      })
                    }
                    className="form-checkbox h-3 w-3"
                  />
                  <span className="text-xs text-white/70">Enable</span>
                </label>
              </div>

              <div
                className={`space-y-2 ${!currentEffects?.reverb.enabled ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-12 text-xs text-white/70">Mix</div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={currentEffects?.reverb.params.mix || 0.25}
                    onChange={(v) =>
                      updateInstrumentReverb(currentInstrument, { mix: v })
                    }
                    className="flex-1"
                    ariaLabel={`${currentInstrument} reverb mix`}
                  />
                  <div className="w-10 text-xs text-white/70">
                    {(
                      (currentEffects?.reverb.params.mix || 0.25) * 100
                    ).toFixed(0)}
                    %
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 text-xs text-white/70">Pre</div>
                  <Slider
                    min={0}
                    max={200}
                    step={1}
                    value={currentEffects?.reverb.params.preDelayMs || 20}
                    onChange={(v) =>
                      updateInstrumentReverb(currentInstrument, {
                        preDelayMs: Math.round(v),
                      })
                    }
                    className="flex-1"
                    ariaLabel={`${currentInstrument} reverb pre-delay`}
                  />
                  <div className="w-10 text-xs text-white/70">
                    {currentEffects?.reverb.params.preDelayMs || 20}ms
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}
