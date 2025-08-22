"use client";

import React from "react";

type SliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  ariaLabel?: string;
};

export default function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  className,
  ariaLabel,
}: SliderProps) {
  const base = `w-full appearance-none h-2 rounded-full bg-neutral-800 focus:outline-none focus-visible:outline-none focus:ring-0
  [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-neutral-800
  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:mt-[-4px]
  [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:shadow-none [&:focus::-webkit-slider-thumb]:shadow-none [&:focus-visible::-webkit-slider-thumb]:shadow-none
  [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-neutral-800
  [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-none`;

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      aria-label={ariaLabel}
      className={`${base} ${className || ""}`}
    />
  );
}
