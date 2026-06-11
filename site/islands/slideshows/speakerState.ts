import { signal } from "@preact/signals";

export type TextSize = "normal" | "large" | "xlarge";

export const TEXT_SIZE_KEY = "speaker-text-size";
export const SIZE_CYCLE: TextSize[] = ["normal", "large", "xlarge"];

/** Shared signal so SpeakerTimer can react to text-size changes. */
export const textSize = signal<TextSize>("normal");
