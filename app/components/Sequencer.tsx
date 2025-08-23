import React from 'react';

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
    <div className="overflow-auto">
      <h3 className="text-lg font-semibold mb-3">Sequencer Pattern</h3>
      <div className="space-y-2">
        {instruments.map((instrument) => (
          <div key={instrument} className="flex items-center gap-2">
            <div className="w-16 text-sm font-medium text-gray-700">
              {instrument}
            </div>
            <div className="flex gap-1 flex-1">
              <button
                onClick={() => onClearPattern(instrument)}
                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                title="Clear pattern"
              >
                Clear
              </button>
              <button
                onClick={() => onRandomizePattern(instrument)}
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
                    onClick={() => onPatternClick(instrument, i)}
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
                          : "rgba(255, 255, 255, 0.25)"
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
  );
}