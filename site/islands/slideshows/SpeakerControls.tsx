import { useEffect } from "preact/hooks";
import {
  SIZE_CYCLE,
  TEXT_SIZE_KEY,
  textSize,
  type TextSize,
} from "./speakerState.ts";

interface SpeakerControlsProps {
  title: string;
  slug: string;
}

const SIZE_LABEL: Record<TextSize, string> = {
  normal: "Aa",
  large: "AA",
  xlarge: "AAA",
};

const SIZE_TITLE: Record<TextSize, string> = {
  normal: "Normal text — click for large",
  large: "Large text — click for extra large",
  xlarge: "Extra large text — click for normal",
};

const BODY_CLASSES: Record<TextSize, string | null> = {
  normal: null,
  large: "large-text-mode",
  xlarge: "xlarge-text-mode",
};

function applyBodyClass(size: TextSize) {
  document.body.classList.remove("large-text-mode", "xlarge-text-mode");
  const cls = BODY_CLASSES[size];
  if (cls) document.body.classList.add(cls);
}

export default function SpeakerControls({ title, slug }: SpeakerControlsProps) {
  // Restore text-size preference
  useEffect(() => {
    const saved = localStorage.getItem(TEXT_SIZE_KEY) as TextSize | null;
    const size: TextSize = SIZE_CYCLE.includes(saved as TextSize)
      ? (saved as TextSize)
      : "normal";
    textSize.value = size;
    applyBodyClass(size);
  }, []);

  // Wake Lock — keep screen on while speaker notes are open
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch (_e) {
        // Browser denied or API unavailable — silent fail
      }
    }

    requestWakeLock();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      wakeLock?.release();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  function cycleTextSize() {
    const idx = SIZE_CYCLE.indexOf(textSize.value);
    const next = SIZE_CYCLE[(idx + 1) % SIZE_CYCLE.length];
    textSize.value = next;
    applyBodyClass(next);
    localStorage.setItem(TEXT_SIZE_KEY, next);
  }

  return (
    <div class="slideshow-heading">
      <span style="font-size:0.75rem;color:rgba(255,255,255,0.5);">
        {title}
      </span>
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <button
          type="button"
          onClick={cycleTextSize}
          title={SIZE_TITLE[textSize.value]}
          class={`speaker-text speaker-text--${textSize.value}`}
        >
          {SIZE_LABEL[textSize.value]}
        </button>
        <a
          href={`/slideshows/${slug}`}
          style="font-size:0.7rem;color:rgba(255,255,255,0.35);"
          target="_blank"
          rel="noopener noreferrer"
        >
          Slideshow ↗
        </a>
      </div>
    </div>
  );
}
