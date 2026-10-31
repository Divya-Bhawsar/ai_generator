import {
  FPS,
  cueOffset,
  type Alignment,
  type Caption,
  type TimedScene,
  type Timeline,
} from "./remotion/contracts";

export interface SpeechResult {
  duration: number;
  alignment: Alignment;
  audioFile?: string;
  isSynthetic?: boolean;
}

export function makeCaptions(alignment: Alignment): Caption[] {
  const chars = alignment.characters || [];
  const starts = alignment.character_start_times_seconds || [];
  const ends = alignment.character_end_times_seconds || [];

  if (!chars.length || chars.length !== starts.length || chars.length !== ends.length) {
    return [];
  }

  const text = chars.join("");
  const words: Array<{ text: string; start: number; end: number }> = [];

  const matches = [...text.matchAll(/\S+/g)];
  for (const m of matches) {
    const word = m[0];
    const startIndex = m.index ?? 0;
    const endIndex = Math.min(chars.length - 1, startIndex + word.length - 1);
    words.push({
      text: word,
      start: starts[startIndex] ?? 0,
      end: ends[endIndex] ?? (starts[startIndex] ?? 0) + 0.3,
    });
  }

  const result: Caption[] = [];
  let group: typeof words = [];

  const flush = () => {
    if (group.length) {
      const startSec = group[0].start;
      const endSec = group[group.length - 1].end;
      const startFrame = Math.max(0, Math.floor(startSec * FPS));
      const endFrame = Math.max(startFrame + 1, Math.ceil(endSec * FPS));

      result.push({
        text: group.map((w) => w.text).join(" "),
        start: startFrame,
        end: endFrame,
      });
      group = [];
    }
  };

  for (const w of words) {
    const currentLength = group.map((x) => x.text).join(" ").length;
    const timeSpan = group.length ? w.end - group[0].start : 0;

    if (group.length && (currentLength + w.text.length + 1 > 42 || timeSpan > 3.2)) {
      flush();
    }
    group.push(w);
    if (/[.!?;:]$/.test(w.text)) {
      flush();
    }
  }
  flush();

  // Clamp adjacent caption overlaps
  for (let i = 0; i < result.length - 1; i++) {
    result[i].end = Math.min(result[i].end, result[i + 1].start);
  }

  return result;
}

export function syntheticAlignment(text: string, duration: number): Alignment {
  const characters = Array.from(text);
  const total = Math.max(1, characters.length);
  const step = Math.max(0.01, (duration - 0.3) / total);

  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => 0.15 + i * step),
    character_end_times_seconds: characters.map((_, i) => 0.15 + (i + 1) * step),
  };
}

export function compileTimeline(
  title: string,
  rawScenes: Array<Record<string, any>>,
  speechMap: Record<string, SpeechResult>
): Timeline {
  let globalFrame = 0;

  const timedScenes: TimedScene[] = rawScenes.map((scene, idx) => {
    const id = scene.id || scene.sceneId || `scene-${idx + 1}`;
    const narration = scene.narration || "";
    const speech = speechMap[id] || {
      duration: Math.max(6.0, narration.split(/\s+/).length / 2.4),
      alignment: syntheticAlignment(narration, 8.0),
      isSynthetic: true,
    };

    const text = speech.alignment.characters.join("");
    const cue = scene.cue || (scene.accentWords?.[0] ?? scene.accent_words?.[0] ?? "");
    const cueCharOffset = cueOffset(text, cue, scene.occurrence || 1);

    const cueTime = speech.alignment.character_start_times_seconds[cueCharOffset] ?? 0.8;
    const cueFrame = Math.max(4, Math.floor(cueTime * FPS));

    let decisionFrame: number | undefined;
    const decisionCue = scene.search?.decisionCue || scene.decisionCue;
    if (decisionCue) {
      const decOffset = cueOffset(text, decisionCue, scene.search?.decisionOccurrence || 1);
      const decTime = speech.alignment.character_start_times_seconds[decOffset] ?? cueTime + 1.2;
      decisionFrame = Math.max(cueFrame + 12, Math.floor(decTime * FPS));
    }

    const durationSeconds = speech.duration || 6.0;
    // Add 0.4s breathing buffer to ensure narration finishes comfortably
    const sceneFrames = Math.ceil((durationSeconds + 0.4) * FPS);

    const captions = makeCaptions(speech.alignment);

    const timedScene: TimedScene = {
      id,
      title: scene.title || `Scene ${idx + 1}`,
      kicker: scene.kicker || (idx === 0 ? "INTRODUCTION" : `STEP 0${idx + 1}`),
      narration,
      type: scene.type || (scene.search ? "binary-search" : scene.comparison ? "comparison" : "flow"),
      labels: scene.labels || (scene.visualLabel ? [scene.visualLabel.slice(0, 24)] : ["Concept"]),
      cue,
      occurrence: scene.occurrence || 1,
      start: globalFrame,
      frames: sceneFrames,
      cueFrame,
      decisionFrame,
      captions,
      audioFile: speech.audioFile,
      svgCode: scene.svgCode || scene.diagram?.svg_code,
      diagram: scene.diagram,
      search: scene.search,
      comparison: scene.comparison,
      science: scene.science,
      accentWords: scene.accentWords || scene.accent_words || [],
    };

    globalFrame += sceneFrames;
    return timedScene;
  });

  return {
    title,
    fps: FPS,
    frames: globalFrame,
    scenes: timedScenes,
  };
}
