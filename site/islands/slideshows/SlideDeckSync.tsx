import { useEffect } from "preact/hooks";
import { currentSlide, navigate } from "./SlideshowSync.tsx";
import type { SlideshowRole } from "@/types/slideshows.ts";

interface Props {
  role: SlideshowRole;
  slideCount: number;
}

export default function SlideDeckSync({ role, slideCount }: Props) {
  useEffect(() => {
    // When currentSlide signal changes, scroll the deck
    const unsubscribe = currentSlide.subscribe((index) => {
      const deck = document.getElementById("slide-deck");
      if (deck) {
        deck.scrollTo({
          left: index * globalThis.innerWidth,
          behavior: "smooth",
        });
      }
    });

    // If controller, also listen for keyboard nav
    if (role === "controller") {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "ArrowRight" || e.key === " ") {
          const next = Math.min(currentSlide.value + 1, slideCount - 1);
          navigate(next);
        } else if (e.key === "ArrowLeft") {
          const prev = Math.max(currentSlide.value - 1, 0);
          navigate(prev);
        }
      };
      globalThis.addEventListener("keydown", handleKey);
      return () => {
        unsubscribe();
        globalThis.removeEventListener("keydown", handleKey);
      };
    }

    return unsubscribe;
  }, [role, slideCount]);

  return null;
}
