import { signal } from "@preact/signals";
import { useEffect } from "preact/hooks";

// Module-level signals so timer state persists across re-renders
const elapsed = signal(0);
const timerRunning = signal(false);

function fmtTime(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

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

  const remaining = totalSeconds - elapsed.value;
  const overTime = remaining < 0;
  const absSecs = Math.abs(remaining);
  const timerColour = remaining <= 300 ? "#ef4444" : "#22c55e";

  return (
    <div
      onClick={() => {
        timerRunning.value = !timerRunning.value;
      }}
      style="position:fixed;bottom:0.65rem;left:0.85rem;z-index:100;display:flex;align-items:center;gap:0.5rem;background:rgba(0,0,0,0.5);border-radius:999px;padding:0.4rem 0.9rem;cursor:pointer;user-select:none;-webkit-user-select:none;"
      title={timerRunning.value ? "Pause" : "Start"}
    >
      <span style="font-size:0.65rem;color:rgba(255,255,255,0.55);line-height:1;">
        {timerRunning.value ? "⏸" : "▶"}
      </span>
      <span
        style={`font-size:0.8rem;font-weight:600;font-variant-numeric:tabular-nums;color:${timerColour};letter-spacing:0.02em;`}
      >
        {overTime ? "-" : ""}{fmtTime(absSecs)}
      </span>
      <span
        onClick={(e) => {
          e.stopPropagation();
          elapsed.value = 0;
          timerRunning.value = false;
        }}
        style="font-size:0.75rem;color:rgba(255,255,255,0.3);line-height:1;padding:0.15rem 0;"
        title="Reset"
      >
        ↺
      </span>
    </div>
  );
}
