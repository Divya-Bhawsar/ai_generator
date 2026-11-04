import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import type { Alignment } from "./remotion/contracts";
import { syntheticAlignment, type SpeechResult } from "./timing";

const execFileAsync = promisify(execFile);

let cachedPythonBin: string | null = null;

export function getPythonBinary(): string {
  if (cachedPythonBin) return cachedPythonBin;

  const candidates = [
    "/usr/local/bin/python3",
    "/opt/homebrew/bin/python3",
    "/Library/Frameworks/Python.framework/Versions/3.13/bin/python3",
    "/Library/Frameworks/Python.framework/Versions/3.12/bin/python3",
    "/Library/Frameworks/Python.framework/Versions/3.11/bin/python3",
    "python3",
  ];

  for (const p of candidates) {
    if (p.startsWith("/") && fs.existsSync(p)) {
      cachedPythonBin = p;
      return p;
    }
  }

  cachedPythonBin = "python3";
  return cachedPythonBin;
}

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

function saveMetaCache(metaPath: string, data: { text: string; voiceId: string; voiceName?: string; duration: number; alignment: any; isSynthetic?: boolean }) {
  try {
    fs.writeFileSync(metaPath, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // ignore
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

  // Instant Cache Check: If audio & metadata already exist for this text and voice, reuse instantly
  const metaPath = `${destPath}.meta.json`;
  if (fs.existsSync(destPath) && fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      if (
        meta.text === text &&
        (meta.voiceId === voiceId || meta.voiceName === voiceName) &&
        meta.duration > 0.5
      ) {
        return {
          duration: meta.duration,
          alignment: meta.alignment || syntheticAlignment(text, meta.duration),
          audioFile: destPath,
          isSynthetic: Boolean(meta.isSynthetic),
        };
      }
    } catch {
      // Fallback to synthesizing
    }
  }

  const normalizedVoiceId = (voiceId || "").toLowerCase();
  const normalizedVoiceName = (voiceName || "").toLowerCase();

  // Edge-TTS Neural Voice Map (100% Free, Studio-Grade Neural Clarity)
  const EDGE_VOICE_MAP: Record<string, string> = {
    madhur: "hi-IN-MadhurNeural",
    swara: "hi-IN-SwaraNeural",
    neerja: "en-IN-NeerjaNeural",
    prabhat: "en-IN-PrabhatNeural",
    viraj: "en-IN-PrabhatNeural",
    monica: "en-IN-NeerjaNeural",
    christopher: "en-US-ChristopherNeural",
    guy: "en-US-GuyNeural",
    jenny: "en-US-JennyNeural",
    aria: "en-US-AriaNeural",
    ryan: "en-GB-RyanNeural",
    sonia: "en-GB-SoniaNeural",
  };

  const isEdgeVoice =
    Boolean(EDGE_VOICE_MAP[normalizedVoiceId]) ||
    Boolean(EDGE_VOICE_MAP[normalizedVoiceName]) ||
    /madhur|swara|neerja|prabhat|christopher|jenny|viraj|monica|guy|aria|ryan|sonia/i.test(
      `${voiceId} ${voiceName}`
    );

  // 1. Try ElevenLabs API ONLY if an explicit custom 20+ char ElevenLabs ID is provided (NOT our Edge voices)
  if (apiKey && !isEdgeVoice && voiceId && voiceId.length > 15) {
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
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio_base64 && data.alignment) {
          const buffer = Buffer.from(data.audio_base64, "base64");
          fs.writeFileSync(destPath, buffer);
          const duration = await probeDuration(destPath);
          const result = {
            duration,
            alignment: data.alignment as Alignment,
            audioFile: destPath,
            isSynthetic: false,
          };
          saveMetaCache(metaPath, { text, voiceId, voiceName, ...result });
          return result;
        }
      } else {
        const errText = await res.text().catch(() => "");
        console.warn(`ElevenLabs HTTP ${res.status}:`, errText.slice(0, 200));
      }
    } catch (err) {
      console.warn("ElevenLabs synthesis exception, falling back to neural TTS:", err);
    }
  }

  // 2. Microsoft Edge Neural Voice Engine (Studio-Grade Distinct Personalities)
  const selectedEdgeVoice =
    EDGE_VOICE_MAP[normalizedVoiceName] ||
    EDGE_VOICE_MAP[normalizedVoiceId] ||
    (/swara/i.test(`${voiceId} ${voiceName}`)
      ? "hi-IN-SwaraNeural"
      : /madhur/i.test(`${voiceId} ${voiceName}`)
      ? "hi-IN-MadhurNeural"
      : /christopher|male.*us/i.test(`${voiceId} ${voiceName}`)
      ? "en-US-ChristopherNeural"
      : /jenny|female.*us/i.test(`${voiceId} ${voiceName}`)
      ? "en-US-JennyNeural"
      : /neerja|monica|female/i.test(`${voiceId} ${voiceName}`)
      ? "en-IN-NeerjaNeural"
      : "en-IN-PrabhatNeural");

  const pythonBin = getPythonBinary();

  try {
    await execFileAsync(pythonBin, [
      "-m",
      "edge_tts",
      "--no-progress",
      "--voice",
      selectedEdgeVoice,
      "--text",
      text,
      "--write-media",
      destPath,
    ]);

    const duration = await probeDuration(destPath);
    if (duration > 0.5) {
      const result = {
        duration,
        alignment: syntheticAlignment(text, duration),
        audioFile: destPath,
        isSynthetic: false,
      };
      saveMetaCache(metaPath, { text, voiceId, voiceName, ...result });
      return result;
    }
  } catch (err) {
    console.warn(`Edge Neural TTS (${selectedEdgeVoice}) failed with ${pythonBin}, trying macOS voice fallback:`, err);
  }

  // 3. macOS Distinct Voice Fallback (if edge-tts is temporarily offline)
  const MACOS_VOICE_MAP: Record<string, string> = {
    madhur: "Rishi",
    prabhat: "Aman",
    viraj: "Aman",
    swara: "Lekha",
    neerja: "Tara",
    monica: "Tara",
    christopher: "Alex",
    jenny: "Samantha",
    aria: "Samantha",
    guy: "Alex",
  };

  const sysVoice =
    MACOS_VOICE_MAP[normalizedVoiceName] ||
    MACOS_VOICE_MAP[normalizedVoiceId] ||
    (/swara/i.test(`${voiceId} ${voiceName}`)
      ? "Lekha"
      : /madhur/i.test(`${voiceId} ${voiceName}`)
      ? "Rishi"
      : /christopher/i.test(`${voiceId} ${voiceName}`)
      ? "Alex"
      : /jenny/i.test(`${voiceId} ${voiceName}`)
      ? "Samantha"
      : /neerja|monica|female/i.test(`${voiceId} ${voiceName}`)
      ? "Tara"
      : "Aman");

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
    const result = {
      duration: duration || Math.max(5.0, text.split(/\s+/).length / 2.5),
      alignment: syntheticAlignment(text, duration),
      audioFile: destPath,
      isSynthetic: true,
    };
    saveMetaCache(metaPath, { text, voiceId, voiceName, ...result });
    return result;
  } catch (err) {
    console.warn("System TTS failed, using audio tone generator fallback:", err);
  }

  // 4. Fallback: silent audio generator
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
