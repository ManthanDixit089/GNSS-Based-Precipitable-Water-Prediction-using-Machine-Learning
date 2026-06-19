"use client";

import React, { useState, useEffect, useRef } from "react";

type TimeScrubberProps = {
  /** Number of time steps (frames) available */
  steps: number;
  /** Current time/frame index */
  value: number;
  /** Called when user changes the time/frame */
  onChange: (idx: number) => void;
  /** Optional: show play/pause button for animation */
  showPlay?: boolean;
  /** Optional: label for the time axis (e.g., "Time", "Frame") */
  label?: string;
};

const TimeScrubber: React.FC<TimeScrubberProps> = ({
  steps,
  value,
  onChange,
  showPlay = true,
  label = "Time",
}) => {
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        const nextIdx = (value + 1) % steps;
        onChange(nextIdx);
      }, 900);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, steps, onChange, value]);

  // Ensure play stops at last frame if not looping
  useEffect(() => {
    if (value === steps - 1 && playing) setPlaying(false);
  }, [value, steps, playing]);

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-black/30 rounded-xl shadow">
      {showPlay && (
        <button
          className="text-white bg-sky-600 hover:bg-sky-700 rounded p-1"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <svg width={20} height={20} fill="currentColor"><rect x="4" y="4" width="4" height="12"/><rect x="12" y="4" width="4" height="12"/></svg>
          ) : (
            <svg width={20} height={20} fill="currentColor"><polygon points="5,4 17,10 5,16"/></svg>
          )}
        </button>
      )}
      <label className="text-xs text-white/80">{label}</label>
      <input
        type="range"
        min={0}
        max={steps - 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-48 accent-sky-400"
      />
      <span className="text-xs text-white/80">{value + 1} / {steps}</span>
    </div>
  );
};

export default TimeScrubber;