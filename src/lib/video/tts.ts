import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import type { Alignment } from "./remotion/contracts";
import { syntheticAlignment, type SpeechResult } from "./timing";

const execFileAsync = promisify(execFile);

export async function probeDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const val = parseFloat(stdout.trim());
    return Number.isFinite(val) ? val : 0;
  } catch (err) {
    console.warn("ffprobe error:", err);
    return 0;
  }
}

export async function synthesizeSceneAudio({
  text,
  voiceId,
  voiceName = "viraj",
  destPath,
  apiKey,
}: {
  text: string;
  voiceId: string;
  voiceName?: string;
  destPath: string;
  apiKey?: string;
}): Promise<SpeechResult> {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  // 1. Try ElevenLabs API with timestamps (if key is provided)
  if (apiKey && voiceId && !["neerja", "prabhat", "christopher", "jenny", "viraj", "monica"].includes(voiceId.toLowerCase())) {
    try {
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
        voiceId
      )}/with-timestamps?output_format=mp3_44100_128`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "User-Agent": "VidyaMotion/1.0",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio_base64 && data.alignment) {
          const buffer = Buffer.from(data.audio_base64, "base64");
          fs.writeFileSync(destPath, buffer);
          const duration = await probeDuration(destPath);
          return {
            duration,
            alignment: data.alignment as Alignment,
            audioFile: destPath,
            isSynthetic: false,
          };
        }
      } else {
        const errText = await res.text().catch(() => "");
        console.warn(`ElevenLabs HTTP ${res.status}:`, errText.slice(0, 200));
      }
    } catch (err) {
      console.warn("ElevenLabs synthesis exception, falling back to neural TTS:", err);
    }
  }

  // 2. Microsoft Edge Neural Voice Engine (100% Free, Studio-Grade Clarity, Zero API Keys)
  const EDGE_VOICE_MAP: Record<string, string> = {
    neerja: "en-IN-NeerjaNeural",
    monica: "en-IN-NeerjaNeural",
    prabhat: "en-IN-PrabhatNeural",
    viraj: "en-IN-PrabhatNeural",
    madhur: "hi-IN-MadhurNeural",
    swara: "hi-IN-SwaraNeural",
    christopher: "en-US-ChristopherNeural",
    guy: "en-US-GuyNeural",
    jenny: "en-US-JennyNeural",
    aria: "en-US-AriaNeural",
    ryan: "en-GB-RyanNeural",
    sonia: "en-GB-SoniaNeural",
  };

  const selectedEdgeVoice =
    EDGE_VOICE_MAP[voiceName.toLowerCase()] ||
    EDGE_VOICE_MAP[voiceId.toLowerCase()] ||
    (/swara/i.test(voiceName)
      ? "hi-IN-SwaraNeural"
      : /madhur/i.test(voiceName)
      ? "hi-IN-MadhurNeural"
      : /female|monica|neerja|jenny|aria|tara/i.test(voiceName)
      ? "en-IN-NeerjaNeural"
      : "en-IN-PrabhatNeural");

  try {
    await execFileAsync("python3", [
      "-m",
      "edge_tts",
      "--voice",
      selectedEdgeVoice,
      "--text",
      text,
      "--write-media",
      destPath,
    ]);

    const duration = await probeDuration(destPath);
    if (duration > 0.5) {
      return {
        duration,
        alignment: syntheticAlignment(text, duration),
        audioFile: destPath,
        isSynthetic: false,
      };
    }
  } catch (err) {
    console.warn("Edge Neural TTS failed, trying macOS say fallback:", err);
  }

  // 3. macOS System Voice Fallback (if edge-tts is unavailable)
  const sysVoice = /monica|neerja|female/i.test(voiceName) ? "Tara" : "Aman";
  const tempAiff = destPath.replace(/\.mp3$/, ".aiff");

  try {
    await execFileAsync("/usr/bin/say", ["-v", sysVoice, "-o", tempAiff, text]);
    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      tempAiff,
      "-c:a",
      "libmp3lame",
      "-b:a",
      "192k",
      destPath,
    ]);

    if (fs.existsSync(tempAiff)) {
      fs.unlinkSync(tempAiff);
    }

    const duration = await probeDuration(destPath);
    return {
      duration: duration || Math.max(5.0, text.split(/\s+/).length / 2.5),
      alignment: syntheticAlignment(text, duration),
      audioFile: destPath,
      isSynthetic: true,
    };
  } catch (err) {
    console.warn("System TTS failed, using audio tone generator fallback:", err);
  }

  // 3. Fallback: silent audio generator
  const estDuration = Math.max(5.0, text.split(/\s+/).length / 2.5);
  await execFileAsync("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `anullsrc=r=44100:cl=stereo:d=${estDuration.toFixed(3)}`,
    "-c:a",
    "libmp3lame",
    destPath,
  ]);

  return {
    duration: estDuration,
    alignment: syntheticAlignment(text, estDuration),
    audioFile: destPath,
    isSynthetic: true,
  };
}
