import { signal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { textSize } from "./speakerState.ts";

// Module-level signals so timer state persists across re-renders
const elapsed = signal(0);
const timerRunning = signal(false);
const hasStarted = signal(false);

function fmtTime(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const FONT_SIZE: Record<string, string> = {
  normal: "0.8rem",
  large: "1.05rem",
  xlarge: "1.3rem",
};

const ICON_SIZE: Record<string, string> = {
  normal: "0.65rem",
  large: "0.85rem",
  xlarge: "1.05rem",
};

const RESET_SIZE: Record<string, string> = {
  normal: "0.75rem",
  large: "0.95rem",
  xlarge: "1.2rem",
};

interface Props {
  totalDurationMinutes?: number;
}

export default function SpeakerTimer({ totalDurationMinutes = 45 }: Props) {
  const totalSeconds = totalDurationMinutes * 60;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const unsubscribe = timerRunning.subscribe((running) => {
      if (running) {
        interval = setInterval(() => {
          elapsed.value += 1;
        }, 1000);
      } else {
        if (interval) clearInterval(interval);
      }
    });
    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, []);

  const isOverTime = hasStarted.value && elapsed.value > totalSeconds;
  const isWarning = hasStarted.value &&
    elapsed.value >= totalSeconds - 300 &&
    !isOverTime;

  const timerColour = !hasStarted.value
    ? "rgba(255,255,255,0.4)"
    : isOverTime
    ? "#ef4444"
    : isWarning
    ? "#f97316"
    : "#22c55e";

  const displayTime = hasStarted.value
    ? fmtTime(elapsed.value)
    : fmtTime(totalSeconds);

  const fontSize = FONT_SIZE[textSize.value] ?? "0.8rem";
  const iconSize = ICON_SIZE[textSize.value] ?? "0.65rem";
  const resetSize = RESET_SIZE[textSize.value] ?? "0.75rem";

  return (
    <div
      onClick={() => {
        if (!hasStarted.value) {
          hasStarted.value = true;
          elapsed.value = 0;
        }
        timerRunning.value = !timerRunning.value;
      }}
      style="position:fixed;bottom:0.65rem;left:0.85rem;z-index:100;display:flex;align-items:center;gap:0.5rem;background:rgba(0,0,0,0.5);border-radius:999px;padding:0.4rem 0.9rem;cursor:pointer;user-select:none;-webkit-user-select:none;"
      title={timerRunning.value
        ? "Pause"
        : hasStarted.value
        ? "Resume"
        : "Start"}
    >
      <span
        style={`font-size:${iconSize};color:rgba(255,255,255,0.55);line-height:1;`}
      >
        {timerRunning.value ? "⏸" : "▶"}
      </span>
      <span
        style={`font-size:${fontSize};font-weight:600;font-variant-numeric:tabular-nums;color:${timerColour};letter-spacing:0.02em;transition:color 0.3s;`}
      >
        {isOverTime && (
          <span style="font-size:0.6em;opacity:0.7;margin-right:0.15em;">
            +
          </span>
        )}
        {displayTime}
      </span>
      <span
        onClick={(e) => {
          e.stopPropagation();
          elapsed.value = 0;
          timerRunning.value = false;
          hasStarted.value = false;
        }}
        style={`font-size:${resetSize};color:rgba(255,255,255,0.3);line-height:1;padding:0.15rem 0;`}
        title="Reset"
      >
        ↺
      </span>
    </div>
  );
}
