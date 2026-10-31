import fs from "fs";
import path from "path";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia, renderStill } from "@remotion/renderer";
import { synthesizeSceneAudio } from "./tts";
import { compileTimeline, type SpeechResult } from "./timing";
import type { Timeline } from "./remotion/contracts";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export interface RenderJobParams {
  projectId: string;
  storyboard: {
    title: string;
    scenes: Array<Record<string, any>>;
  };
  voiceId?: string;
  voiceName?: string;
  outputMp4Path: string;
  statusFilePath: string;
  apiKey?: string;
}

export function updateRenderStatus(
  statusPath: string,
  data: {
    status: string;
    progress: number;
    stage: string;
    videoUrl?: string;
    duration?: number;
    error?: string;
  }
) {
  try {
    fs.mkdirSync(path.dirname(statusPath), { recursive: true });
    fs.writeFileSync(
      statusPath,
      JSON.stringify(
        {
          status: data.status,
          progress: data.progress,
          stage: data.stage,
          videoUrl: data.videoUrl || "",
          duration: data.duration || 0,
          error: data.error || "",
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } catch (err) {
    console.warn("Error writing render status file:", err);
  }
}

export async function runRemotionRenderJob(params: RenderJobParams): Promise<string> {
  const {
    projectId,
    storyboard,
    voiceId = "Q1NHvGuV9SzxtiSnVDEH",
    voiceName = "viraj",
    outputMp4Path,
    statusFilePath,
    apiKey = process.env.ELEVENLABS_API_KEY || "",
  } = params;

  const projectDir = path.join(process.cwd(), "public", "renders", projectId);
  const audioDir = path.join(projectDir, "audio");
  const previewDir = path.join(projectDir, "previews");
  fs.mkdirSync(audioDir, { recursive: true });
  fs.mkdirSync(previewDir, { recursive: true });
  fs.mkdirSync(path.dirname(outputMp4Path), { recursive: true });

  try {
    updateRenderStatus(statusFilePath, {
      status: "rendering",
      progress: 5,
      stage: `Synthesizing neural voiceover (${voiceName})...`,
    });

    // 1. Synthesize Audio for each scene
    const speechMap: Record<string, SpeechResult> = {};
    const rawScenes = storyboard.scenes || [];
    const totalScenes = Math.max(1, rawScenes.length);

    for (let i = 0; i < rawScenes.length; i++) {
      const scene = rawScenes[i];
      const sceneId = scene.id || scene.sceneId || `scene-${i + 1}`;
      const destAudio = path.join(audioDir, `${sceneId}.mp3`);

      const progress = Math.round(10 + (i / totalScenes) * 35);
      updateRenderStatus(statusFilePath, {
        status: "rendering",
        progress,
        stage: `Synthesizing voice for Scene ${i + 1} of ${totalScenes}...`,
      });

      const speech = await synthesizeSceneAudio({
        text: scene.narration,
        voiceId,
        voiceName,
        destPath: destAudio,
        apiKey,
      });

      // Remotion staticFile resolves paths relative to the publicDir
      speech.audioFile = `renders/${projectId}/audio/${sceneId}.mp3`;

      speechMap[sceneId] = speech;
    }

    // 2. Compile Timeline with precise cue frames
    updateRenderStatus(statusFilePath, {
      status: "rendering",
      progress: 48,
      stage: "Compiling kinetic timeline and audio cues...",
    });

    const timeline: Timeline = compileTimeline(
      storyboard.title || "VidyaMotion Explainer",
      rawScenes,
      speechMap
    );

    // Save timeline.json for debugging and inspector
    fs.writeFileSync(
      path.join(projectDir, "timeline.json"),
      JSON.stringify(timeline, null, 2)
    );

    // 3. Bundle Remotion Composition
    updateRenderStatus(statusFilePath, {
      status: "rendering",
      progress: 55,
      stage: "Bundling React motion graphics engine...",
    });

    const entryPoint = path.join(process.cwd(), "src", "lib", "video", "remotion", "Root.tsx");
    const serveUrl = await bundle({
      entryPoint,
      publicDir: path.join(process.cwd(), "public"),
    });

    const browserExecutable = fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined;
    const inputProps = { timeline };

    const composition = await selectComposition({
      serveUrl,
      id: "Explainer",
      inputProps,
      browserExecutable,
    });

    // 4. Render Preview Stills for Storyboard Studio
    updateRenderStatus(statusFilePath, {
      status: "rendering",
      progress: 62,
      stage: "Generating high-resolution scene previews...",
    });

    for (let i = 0; i < timeline.scenes.length; i++) {
      const s = timeline.scenes[i];
      const targetFrame = s.start + Math.min(s.frames - 2, Math.max(10, s.cueFrame + 15));
      try {
        await renderStill({
          serveUrl,
          composition,
          inputProps,
          browserExecutable,
          frame: targetFrame,
          output: path.join(previewDir, `${s.id}.png`),
        });
      } catch (stillErr) {
        console.warn(`Could not render preview still for ${s.id}:`, stillErr);
      }
    }

    // 5. Render Final MP4 Media
    updateRenderStatus(statusFilePath, {
      status: "rendering",
      progress: 68,
      stage: "Rendering 1080x1920 30fps MP4 video...",
    });

    const tempPartialMp4 = path.join(projectDir, "output.partial.mp4");

    await renderMedia({
      serveUrl,
      composition,
      inputProps,
      browserExecutable,
      codec: "h264",
      audioCodec: "aac",
      outputLocation: tempPartialMp4,
      concurrency: 2,
      crf: 22,
      onProgress: ({ progress }) => {
        const renderProgress = Math.round(68 + progress * 28);
        updateRenderStatus(statusFilePath, {
          status: "rendering",
          progress: renderProgress,
          stage: `Rendering motion graphics frames (${Math.round(progress * 100)}%)...`,
        });
      },
    });

    // Move partial MP4 to final destination
    if (fs.existsSync(tempPartialMp4)) {
      fs.renameSync(tempPartialMp4, outputMp4Path);
    }

    const durationSeconds = timeline.frames / 30;
    const publicUrl = `/videos/${projectId}.mp4`;

    updateRenderStatus(statusFilePath, {
      status: "ready",
      progress: 100,
      stage: "Ready for playback",
      videoUrl: publicUrl,
      duration: durationSeconds,
    });

    return publicUrl;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Remotion render failed:", err);
    updateRenderStatus(statusFilePath, {
      status: "failed",
      progress: 0,
      stage: "Render failed",
      error: errorMsg,
    });
    throw err;
  }
}
