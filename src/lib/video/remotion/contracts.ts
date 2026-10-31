export const FPS = 30;

export interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface Caption {
  text: string;
  start: number; // frame
  end: number;   // frame
}

export interface SearchConfig {
  values: number[];
  target: number;
  step: number;
  mode: "setup" | "compare" | "result";
  decisionCue?: string;
  decisionOccurrence?: number;
}

export interface ComparisonConfig {
  left: { heading: string; points: string[] };
  right: { heading: string; points: string[] };
}

export interface ScienceConfig {
  headline?: string;
  badge?: string;
  vectorLabel?: string;
  value?: string;
  unit?: string;
  points?: string[];
}

export interface TimedScene {
  id: string;
  title: string;
  kicker: string;
  narration: string;
  type: "binary-search" | "comparison" | "flow" | "science" | "concept" | "overview";
  labels: string[];
  cue: string;
  occurrence: number;
  start: number;       // frame offset in global composition
  frames: number;      // total scene duration in frames
  cueFrame: number;    // frame relative to scene start where focus animation triggers
  decisionFrame?: number; // frame relative to scene start where elimination/decision triggers
  captions: Caption[];
  audioFile?: string;  // absolute path or public-relative URL
  search?: SearchConfig;
  comparison?: ComparisonConfig;
  science?: ScienceConfig;
  accentWords?: string[];
}

export interface Timeline {
  title: string;
  fps: number;
  frames: number;
  scenes: TimedScene[];
}

export function cueOffset(text: string, phrase: string, occurrence = 1): number {
  if (!phrase) return 0;
  let start = -1;
  const lowerText = text.toLowerCase();
  const lowerPhrase = phrase.toLowerCase().trim();
  for (let n = 0; n < occurrence; n++) {
    start = lowerText.indexOf(lowerPhrase, start + 1);
    if (start < 0) {
      // Fallback: try individual significant words
      const words = lowerPhrase.split(/\s+/).filter(w => w.length > 3);
      for (const w of words) {
        const found = lowerText.indexOf(w);
        if (found >= 0) return found;
      }
      return 0; // Graceful fallback to beginning of scene
    }
  }
  return Math.max(0, start);
}
