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

export interface DiagramConfig {
  diagram_type:
    | "metric_card"
    | "flow_pipeline"
    | "split_comparison"
    | "vector_system"
    | "orbital_cycle"
    | "data_curve"
    | "array_search";
  headline: string;
  badge?: string;
  metric?: {
    value: string;
    unit?: string;
    label: string;
    subtext?: string;
  };
  flow_steps?: Array<{
    step_number: number;
    title: string;
    detail?: string;
  }>;
  comparison?: {
    left_title: string;
    left_points: string[];
    right_title: string;
    right_points: string[];
  };
  vector_system?: {
    center_label: string;
    center_badge?: string;
    force_label?: string;
    secondary_label?: string;
    vectors?: Array<{
      name: string;
      direction?: string;
    }>;
  };
  key_takeaways?: string[];
  svg_code?: string;
}

export interface TimedScene {
  id: string;
  title: string;
  kicker: string;
  narration: string;
  type:
    | "binary-search"
    | "comparison"
    | "flow"
    | "science"
    | "concept"
    | "overview"
    | "bars"
    | "process_steps"
    | "gauge"
    | "aerodynamics"
    | "chart"
    | "cycle";
  labels: string[];
  cue: string;
  occurrence: number;
  start: number;       // frame offset in global composition
  frames: number;      // total scene duration in frames
  cueFrame: number;    // frame relative to scene start where focus animation triggers
  decisionFrame?: number; // frame relative to scene start where elimination/decision triggers
  captions: Caption[];
  audioFile?: string;  // absolute path or public-relative URL
  svgCode?: string;
  diagram?: DiagramConfig;
  search?: SearchConfig;
  comparison?: ComparisonConfig;
  science?: ScienceConfig;
  accentWords?: string[];
}

export interface SpeechSegment {
  startFrame: number;
  endFrame: number;
}

export interface BackgroundMusicTrack {
  id: "lofi" | "tech" | "ambient" | "cinematic" | "none";
  name: string;
  genre: string;
  icon: string;
  audioFile: string;
  previewUrl: string;
  baseVolume: number; // Volume when no speech is playing (e.g. 0.22, ~-13dB)
  duckVolume: number; // Volume during active speech (e.g. 0.05, ~-24dB)
  description: string;
  tag: string;
}

export const BACKGROUND_MUSIC_TRACKS: BackgroundMusicTrack[] = [
  {
    id: "lofi",
    name: "Lofi Study Beats",
    genre: "Lofi Hip-Hop",
    icon: "🎧",
    audioFile: "audio/music/music-lofi.mp3",
    previewUrl: "/audio/music/music-lofi.mp3",
    baseVolume: 0.22,
    duckVolume: 0.05,
    description: "Warm Rhodes electric piano, sub-bass & soft vinyl boom-bap rhythm",
    tag: "✦ Recommended for All Explainer Topics",
  },
  {
    id: "tech",
    name: "Tech Flow Arpeggio",
    genre: "Modern Tech",
    icon: "⚡",
    audioFile: "audio/music/music-tech.mp3",
    previewUrl: "/audio/music/music-tech.mp3",
    baseVolume: 0.20,
    duckVolume: 0.05,
    description: "Minimalist digital synth arpeggios with crisp electronic clicks",
    tag: "Top Choice for Coding, DSA & Architecture",
  },
  {
    id: "ambient",
    name: "Documentary Ambient",
    genre: "Cinematic Ambient",
    icon: "🌌",
    audioFile: "audio/music/music-ambient.mp3",
    previewUrl: "/audio/music/music-ambient.mp3",
    baseVolume: 0.24,
    duckVolume: 0.06,
    description: "Expansive ethereal strings, evolving drone pads & deep space atmosphere",
    tag: "Great for Science, Physics & Nature",
  },
  {
    id: "cinematic",
    name: "Cinematic Mystery",
    genre: "Tension & Suspense",
    icon: "🎬",
    audioFile: "audio/music/music-cinematic.mp3",
    previewUrl: "/audio/music/music-cinematic.mp3",
    baseVolume: 0.22,
    duckVolume: 0.05,
    description: "Dramatic sub-bass pulse & suspense strings with heart-rate thump",
    tag: "Great for Hooks, Paradoxes & Life Hacks",
  },
  {
    id: "none",
    name: "No Music (Voice Only)",
    genre: "Acapella",
    icon: "🔇",
    audioFile: "",
    previewUrl: "",
    baseVolume: 0,
    duckVolume: 0,
    description: "Pure studio neural voiceover without background soundtrack",
    tag: "Pure Voice Only",
  },
];

export type AspectRatio = "9:16" | "16:9" | "1:1";

export interface Timeline {
  title: string;
  fps: number;
  frames: number;
  aspectRatio?: AspectRatio;
  scenes: TimedScene[];
  backgroundMusic?: BackgroundMusicTrack;
  speechSegments?: SpeechSegment[];
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
