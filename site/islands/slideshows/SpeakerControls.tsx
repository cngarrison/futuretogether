import { useEffect, useState } from "preact/hooks";

interface SpeakerControlsProps {
  title: string;
  slug: string;
}

const LARGE_TEXT_KEY = "speaker-large-text";

export default function SpeakerControls({ title, slug }: SpeakerControlsProps) {
  const [largeText, setLargeText] = useState(false);

  // Restore large-text preference
  useEffect(() => {
    const saved = localStorage.getItem(LARGE_TEXT_KEY);
    if (saved === "1") {
      setLargeText(true);
      document.body.classList.add("large-text-mode");
    }
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

    // Wake lock is released when the tab is hidden; re-acquire on return
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

  function toggleLargeText() {
    const next = !largeText;
    setLargeText(next);
    if (next) {
      document.body.classList.add("large-text-mode");
      localStorage.setItem(LARGE_TEXT_KEY, "1");
    } else {
      document.body.classList.remove("large-text-mode");
      localStorage.setItem(LARGE_TEXT_KEY, "0");
    }
  }

  return (
    <div class="slideshow-heading">
      <span style="font-size:0.75rem;color:rgba(255,255,255,0.5);">
        {title}
      </span>
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <button
          onClick={toggleLargeText}
          title={largeText ? "Switch to normal text" : "Switch to large text"}
          class={`speaker-text-toggle${largeText ? " active" : ""}`}
        >
          Aa
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
