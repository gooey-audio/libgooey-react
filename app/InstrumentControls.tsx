"use client";

import React, { useState } from "react";
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
  const [instrumentEffects, setInstrumentEffects] = useState<Record<string, {
    overdrive: { enabled: boolean; params: OverdriveParams };
    reverb: { enabled: boolean; params: ReverbParams };
  }>>(() => {
    const initial: Record<string, any> = {};
    instruments.forEach(instrument => {
      initial[instrument] = {
        overdrive: {
          enabled: false,
          params: { mix: 0.5, drive: 0.75, toneHz: 1200 }
        },
        reverb: {
          enabled: false,
          params: { mix: 0.25, preDelayMs: 20 }
        }
      };
    });
    return initial;
  });

  const updateInstrumentOverdrive = (instrument: string, updates: Partial<OverdriveParams> | { enabled: boolean }) => {
    if ("enabled" in updates) {
      const enabled = updates.enabled;
      setInstrumentEffects(prev => ({
        ...prev,
        [instrument]: {
          ...prev[instrument],
          overdrive: { ...prev[instrument].overdrive, enabled }
        }
      }));
      if (stage) {
        stage.setInstrumentEffectBypassed(instrument, "Overdrive", !enabled);
      }
      return;
    }
    
    setInstrumentEffects(prev => ({
      ...prev,
      [instrument]: {
        ...prev[instrument],
        overdrive: {
          ...prev[instrument].overdrive,
          params: { ...prev[instrument].overdrive.params, ...updates }
        }
      }
    }));
    
    if (stage) {
      const params: OverdriveParams = { 
        ...instrumentEffects[instrument].overdrive.params, 
        ...updates 
      };
      stage.updateInstrumentEffect(instrument, "Overdrive", params);
    }
  };

  const updateInstrumentReverb = (instrument: string, updates: Partial<ReverbParams> | { enabled: boolean }) => {
    if ("enabled" in updates) {
      const enabled = updates.enabled;
      setInstrumentEffects(prev => ({
        ...prev,
        [instrument]: {
          ...prev[instrument],
          reverb: { ...prev[instrument].reverb, enabled }
        }
      }));
      if (stage) {
        stage.setInstrumentEffectBypassed(instrument, "Reverb", !enabled);
      }
      return;
    }
    
    setInstrumentEffects(prev => ({
      ...prev,
      [instrument]: {
        ...prev[instrument],
        reverb: {
          ...prev[instrument].reverb,
          params: { ...prev[instrument].reverb.params, ...updates }
        }
      }
    }));
    
    if (stage) {
      const params: ReverbParams = { 
        ...instrumentEffects[instrument].reverb.params, 
        ...updates 
      };
      stage.updateInstrumentEffect(instrument, "Reverb", params);
    }
  };

  const currentInstrument = activeTab;
  const currentSettings = filterSettings[currentInstrument];
  const currentEffects = instrumentEffects[currentInstrument];

  return (
    <div className="my-6">
      <h3 className="text-lg font-semibold mb-3">Instrument Controls</h3>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-300 mb-4">
        {instruments.map((instrument) => (
          <button
            key={instrument}
            onClick={() => setActiveTab(instrument)}
            className={`px-4 py-2 font-medium text-sm capitalize transition-colors ${
              activeTab === instrument
                ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            {instrument}
          </button>
        ))}
      </div>

      {/* Current Instrument Control Panel */}
      <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
        <h4 className="text-md font-semibold mb-4 capitalize">{currentInstrument} Controls</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Volume Control */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-700">Volume</h5>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={volumes[currentInstrument] || 1}
                onChange={(e) => onVolumeChange(currentInstrument, parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="w-12 text-sm text-gray-600">
                {((volumes[currentInstrument] || 1) * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-700">Filter</h5>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentSettings?.enabled || false}
                  onChange={(e) => onFilterChange(currentInstrument, "enabled", e.target.checked)}
                  className="form-checkbox"
                />
                <span className="text-xs text-gray-600">Enable</span>
              </label>
            </div>
            
            {currentSettings?.enabled && (
              <div className="space-y-2">
                {/* Frequency */}
                <div className="flex items-center gap-2">
                  <div className="w-16 text-xs text-gray-600">Freq</div>
                  <input
                    type="range"
                    min="100"
                    max="20000"
                    step="100"
                    value={currentSettings.frequency}
                    onChange={(e) => onFilterChange(currentInstrument, "frequency", parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="w-16 text-xs text-gray-600">{currentSettings.frequency}Hz</div>
                </div>
                
                {/* Q */}
                <div className="flex items-center gap-2">
                  <div className="w-16 text-xs text-gray-600">Q</div>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={currentSettings.Q}
                    onChange={(e) => onFilterChange(currentInstrument, "Q", parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="w-16 text-xs text-gray-600">{currentSettings.Q.toFixed(1)}</div>
                </div>
                
                {/* Type */}
                <select
                  value={currentSettings.type}
                  onChange={(e) => onFilterChange(currentInstrument, "type", e.target.value as BiquadFilterType)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
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
            )}
          </div>

          {/* Effects Controls */}
          <div className="space-y-4">
            <h5 className="text-sm font-medium text-gray-700">Effects</h5>
            
            {/* Overdrive */}
            <div className="p-3 border border-gray-200 rounded bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium">Overdrive</div>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={currentEffects?.overdrive.enabled || false}
                    onChange={(e) => updateInstrumentOverdrive(currentInstrument, { enabled: e.target.checked })}
                    className="form-checkbox h-3 w-3"
                  />
                  <span className="text-xs text-gray-600">On</span>
                </label>
              </div>
              
              {currentEffects?.overdrive.enabled && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 text-xs text-gray-600">Mix</div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={currentEffects.overdrive.params.mix}
                      onChange={(e) => updateInstrumentOverdrive(currentInstrument, { mix: parseFloat(e.target.value) })}
                      className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="w-8 text-xs text-gray-600">
                      {(currentEffects.overdrive.params.mix * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 text-xs text-gray-600">Drive</div>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.01"
                      value={currentEffects.overdrive.params.drive}
                      onChange={(e) => updateInstrumentOverdrive(currentInstrument, { drive: parseFloat(e.target.value) })}
                      className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="w-8 text-xs text-gray-600">
                      {currentEffects.overdrive.params.drive.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 text-xs text-gray-600">Tone</div>
                    <input
                      type="range"
                      min="100"
                      max="8000"
                      step="50"
                      value={currentEffects.overdrive.params.toneHz}
                      onChange={(e) => updateInstrumentOverdrive(currentInstrument, { toneHz: parseInt(e.target.value) })}
                      className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="w-8 text-xs text-gray-600">
                      {currentEffects.overdrive.params.toneHz}Hz
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reverb */}
            <div className="p-3 border border-gray-200 rounded bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium">Reverb</div>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={currentEffects?.reverb.enabled || false}
                    onChange={(e) => updateInstrumentReverb(currentInstrument, { enabled: e.target.checked })}
                    className="form-checkbox h-3 w-3"
                  />
                  <span className="text-xs text-gray-600">On</span>
                </label>
              </div>
              
              {currentEffects?.reverb.enabled && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 text-xs text-gray-600">Mix</div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={currentEffects.reverb.params.mix}
                      onChange={(e) => updateInstrumentReverb(currentInstrument, { mix: parseFloat(e.target.value) })}
                      className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="w-8 text-xs text-gray-600">
                      {(currentEffects.reverb.params.mix * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 text-xs text-gray-600">Pre</div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="1"
                      value={currentEffects.reverb.params.preDelayMs}
                      onChange={(e) => updateInstrumentReverb(currentInstrument, { preDelayMs: parseInt(e.target.value) })}
                      className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="w-8 text-xs text-gray-600">
                      {currentEffects.reverb.params.preDelayMs}ms
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}