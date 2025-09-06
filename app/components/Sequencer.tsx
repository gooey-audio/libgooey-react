import React from "react";

interface SequencerProps {
  patterns: Record<string, number[]>;
  currentStep: number;
  instruments: string[];
  onPatternClick: (instrumentName: string, stepIndex: number) => void;
  onClearPattern: (instrumentName: string) => void;
  onRandomizePattern: (instrumentName: string) => void;
}

export default function Sequencer({
  patterns,
  currentStep,
  instruments,
  onPatternClick,
  onClearPattern,
  onRandomizePattern,
}: SequencerProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-3">
        {instruments.map((instrument) => (
          <div key={instrument} className="flex gap-1 w-full">
            {/* Instrument label square */}
            <div className="flex-1 aspect-square bg-white/10 border border-white/30 rounded text-sm text-white font-bold flex items-center justify-center">
              {instrument.charAt(0).toUpperCase()}
            </div>

            {/* Clear button */}
            <button
              onClick={() => onClearPattern(instrument)}
              className="flex-1 aspect-square bg-red-500/20 border border-red-400/30 rounded text-xs text-red-300 hover:bg-red-500/40 hover:border-red-400/50 transition-all duration-200 flex items-center justify-center"
              title="Clear pattern"
            >
              x
            </button>

            {/* Random button */}
            <button
              onClick={() => onRandomizePattern(instrument)}
              className="flex-1 aspect-square bg-purple-500/20 border border-purple-400/30 rounded text-xs text-purple-300 hover:bg-purple-500/40 hover:border-purple-400/50 transition-all duration-200 flex items-center justify-center"
              title="Randomize pattern"
            >
              rnd
            </button>

            {/* Step buttons */}
            {Array.from({ length: 16 }).map((_, i) => {
              const isActive =
                patterns[instrument as keyof typeof patterns][i] === 1;
              const isCurrentStep = i === currentStep - 1; // currentStep is 1-indexed, array is 0-indexed

              return (
                <button
                  key={i}
                  onClick={() => onPatternClick(instrument, i)}
                  className={`flex-1 aspect-square rounded transition-all duration-200 border ${
                    isCurrentStep
                      ? "bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50"
                      : isActive
                        ? "bg-green-500 border-green-400"
                        : "bg-black/40 border-white/20 hover:bg-white/10 hover:border-white/30"
                  }`}
                  title={`Step ${i + 1}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm text-white/70 text-center">
        Step: {currentStep}/16
      </div>
    </div>
  );
}
