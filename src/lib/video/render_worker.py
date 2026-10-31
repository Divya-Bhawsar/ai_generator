#!/usr/bin/env python3
"""Asynchronous Video Render Worker for VidyaMotion.

Renders high-retention 9:16 vertical MP4 explainer videos with:
- Neural ElevenLabs voiceover (with system neural TTS fallback on quota limits)
- Voice- & text-keyed smart caching
- Kinetic word/phrase-synchronized ASS subtitles with neon keyword highlights
- Modern glassmorphic motion graphic cards captured via headless Chrome
- Smooth Ken Burns dynamic camera push-in
- Broadcast-grade H.264/AAC encoding via FFmpeg
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from typing import Any

# Ensure FFmpeg is in PATH
HOMEBREW_BIN = "/opt/homebrew/bin"
LOCAL_BIN = "/usr/local/bin"
current_path = os.environ.get("PATH", "")
for b in (HOMEBREW_BIN, LOCAL_BIN):
    if b not in current_path:
        os.environ["PATH"] = f"{b}:{os.environ.get('PATH', '')}"

# Add script directory to sys.path so template_generator can be imported
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from template_generator import generate_scene_html, render_html_to_png

WIDTH, HEIGHT, FPS = 1080, 1920, 30

def get_audio_cache_key(voice_id: str, narration: str) -> str:
    content = f"{voice_id}:::{narration.strip()}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:16]

def update_status(status_file: Path, status: str, progress: int, stage: str, video_url: str = "", duration: float = 0.0, error: str = "") -> None:
    data = {
        "status": status,
        "progress": progress,
        "stage": stage,
        "videoUrl": video_url,
        "duration": duration,
        "error": error,
    }
    status_file.write_text(json.dumps(data, indent=2), encoding="utf-8")

def run_cmd(args: list[str], cwd: Path | None = None) -> str:
    proc = subprocess.run(args, cwd=cwd, check=True, text=True, capture_output=True)
    return proc.stdout.strip()

def probe_duration(path: Path) -> float:
    try:
        val = run_cmd([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(path)
        ])
        return float(val)
    except Exception:
        return 0.0

def ass_time(seconds: float) -> str:
    cs = max(0, int(round(seconds * 100)))
    hours, rem = divmod(cs, 360000)
    minutes, rem = divmod(rem, 6000)
    whole, centis = divmod(rem, 100)
    return f"{hours}:{minutes:02d}:{whole:02d}.{centis:02d}"

def split_phrases(text: str, max_words: int = 4) -> list[str]:
    words = re.findall(r"\S+", text.strip())
    return [" ".join(words[i:i + max_words]) for i in range(0, len(words), max_words)]

def caption_cues(text: str, alignment: dict[str, Any] | None, duration: float) -> list[dict[str, Any]]:
    pieces = split_phrases(text, max_words=4)
    if alignment:
        chars = alignment.get("characters", [])
        starts = alignment.get("character_start_times_seconds", [])
        ends = alignment.get("character_end_times_seconds", [])
        transcript = "".join(chars)
        if len(chars) == len(starts) == len(ends) and transcript:
            result = []
            cursor = 0
            for phrase in pieces:
                idx = transcript.find(phrase, cursor)
                if idx < 0:
                    break
                end_idx = idx + len(phrase) - 1
                if end_idx >= len(ends):
                    break
                start = max(0.0, float(starts[idx]))
                end = min(duration, float(ends[end_idx]))
                if end > start:
                    result.append({"text": phrase, "start": start, "end": end})
                cursor = end_idx + 1
            if len(result) == len(pieces):
                return result

    # Fallback timing based on word count
    counts = [len(p.split()) for p in pieces]
    total = max(1, sum(counts))
    cursor = 0.2
    result = []
    for p, count in zip(pieces, counts):
        span = max(1.0, (duration - 0.4) * count / total)
        end = min(duration, cursor + span)
        if end > cursor:
            result.append({"text": p, "start": cursor, "end": end})
        cursor = end
    return result

def synthesize_voice(voice_name: str, voice_id: str, text: str, dest_path: Path, api_key: str, work_dir: Path) -> tuple[float, list[dict[str, Any]]]:
    # 1. Try ElevenLabs API if key configured
    if api_key and voice_id:
        try:
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128"
            payload = json.dumps({
                "text": text,
                "model_id": "eleven_v4",
                "language_code": "en",
            }).encode("utf-8")
            req = urllib.request.Request(url, data=payload, headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
                "User-Agent": "VidyaMotion/1.0",
            })
            with urllib.request.urlopen(req, timeout=40) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                dest_path.write_bytes(base64.b64decode(resp_data.get("audio_base64", "")))
                dur = probe_duration(dest_path)
                cues = caption_cues(text, resp_data.get("alignment"), dur)
                return dur, cues
        except Exception as e:
            print(f"ElevenLabs API unavailable ({e}), using system neural voice fallback...", file=sys.stderr)

    # 2. System neural voice fallback (Tara for female / Monica, Aman for male / Viraj)
    sys_voice = "Tara" if "monica" in voice_name.lower() else "Aman"
    temp_aiff = dest_path.with_suffix(".aiff")
    try:
        subprocess.run(["/usr/bin/say", "-v", sys_voice, "-o", str(temp_aiff), text], check=True, capture_output=True)
        run_cmd([
            "ffmpeg", "-y", "-i", str(temp_aiff),
            "-c:a", "libmp3lame", "-b:a", "192k", str(dest_path)
        ])
        temp_aiff.unlink(missing_ok=True)
        dur = probe_duration(dest_path)
        cues = caption_cues(text, None, dur)
        return dur, cues
    except Exception as e:
        print(f"System TTS error ({e}), using audio generator fallback...", file=sys.stderr)

    # 3. Final audio generator fallback
    est = max(1.5, len(text.split()) / 2.5)
    run_cmd([
        "ffmpeg", "-y", "-f", "lavfi", "-i",
        f"anullsrc=r=48000:cl=stereo:d={est:.3f}",
        "-c:a", "libmp3lame", str(dest_path)
    ])
    dur = probe_duration(dest_path)
    cues = caption_cues(text, None, dur)
    return dur, cues

def make_ass(scene: dict, duration: float, index: int, work_dir: Path) -> Path:
    events = []
    cues = scene.get("caption_cues") or caption_cues(scene["narration"], None, duration)
    accents = scene.get("accentWords") or scene.get("accent_words") or []

    for cue in cues:
        raw_phrase = str(cue.get("text", "")).replace("\\", r"\\").replace("{", r"\{").replace("}", r"\}")

        # Highlight accent keywords with neon yellow in ASS format
        phrase = raw_phrase
        for acc in accents:
            acc_clean = str(acc).strip()
            if acc_clean:
                pattern = re.compile(rf"\b({re.escape(acc_clean)})\b", re.IGNORECASE)
                phrase = pattern.sub(r"{\\c&H00FFFF&}\1{\\c&HFFFFFF&}", phrase)

        start = float(cue.get("start", 0))
        end = min(duration, float(cue.get("end", duration)))
        if phrase and end > start:
            events.append(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Caption,,0,0,0,,{phrase}")

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {WIDTH}
PlayResY: {HEIGHT}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Arial,58,&H00FFFFFF,&H0000FFFF,&H000B0E14,&H80000000,1,0,0,0,100,100,1,0,1,5,2,2,70,70,420,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ass_path = work_dir / f"scene-{index:02d}.ass"
    ass_path.write_text(header + "\n".join(events) + "\n", encoding="utf-8")
    return ass_path

def esc_path(p: Path) -> str:
    return str(p.resolve()).replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")

def render_scene(scene: dict, index: int, total_scenes: int, topic: str, audio: Path, duration: float, work_dir: Path) -> Path:
    # 1. Generate Glassmorphic Frame HTML & capture to PNG via headless Chrome
    html_content = generate_scene_html(scene, index, total_scenes, topic)
    scene_png = work_dir / f"scene-{index:02d}.png"
    render_html_to_png(html_content, scene_png)

    # 2. Build Subtitles
    ass_path = make_ass(scene, duration, index, work_dir)

    # 3. Render animated video clip with Ken Burns zoom & kinetic subtitles
    clip = work_dir / f"clip-{index:02d}.mp4"
    ass_esc = esc_path(ass_path)
    vf = f"zoompan=z='min(zoom+0.0006,1.04)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={WIDTH}x{HEIGHT}:fps={FPS},subtitles='{ass_esc}'"

    run_cmd([
        "ffmpeg", "-y",
        "-loop", "1", "-t", f"{duration:.3f}",
        "-i", str(scene_png),
        "-i", str(audio),
        "-vf", vf,
        "-t", f"{duration:.3f}",
        "-r", str(FPS),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-shortest", str(clip)
    ])
    return clip

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", required=True)
    parser.add_argument("--voice-id", default="Q1NHvGuV9SzxtiSnVDEH")
    parser.add_argument("--voice-name", default="viraj")
    parser.add_argument("--storyboard-file", type=Path, required=True)
    parser.add_argument("--output-mp4", type=Path, required=True)
    parser.add_argument("--status-file", type=Path, required=True)
    args = parser.parse_args()

    # Load API keys from .env.local
    env_file = Path(".env.local")
    api_key = os.environ.get("ELEVENLABS_API_KEY", "")
    if not api_key and env_file.is_file():
        for line in env_file.read_text().splitlines():
            if line.startswith("ELEVENLABS_API_KEY="):
                api_key = line.split("=", 1)[1].strip().strip("\"'")

    work_dir = Path("public/renders") / f"work_{args.project_id}"
    work_dir.mkdir(parents=True, exist_ok=True)
    args.output_mp4.parent.mkdir(parents=True, exist_ok=True)

    try:
        update_status(args.status_file, "rendering", 5, "Loading storyboard specification...")
        spec = json.loads(args.storyboard_file.read_text(encoding="utf-8"))
        scenes = spec.get("scenes", [])
        total_scenes = len(scenes)
        topic = spec.get("title", "")

        if total_scenes == 0:
            raise ValueError("No scenes found in storyboard")

        # Step 1: Synthesize Audio (keyed by voice_id + narration hash)
        audio_files = []
        durations = []

        for i, scene in enumerate(scenes):
            prog = 10 + int((i / total_scenes) * 35)
            update_status(args.status_file, "rendering", prog, f"Generating voiceover for Scene {i+1} of {total_scenes} ({args.voice_name})...")

            cache_key = get_audio_cache_key(args.voice_id, scene["narration"])
            audio_dest = work_dir / f"audio_s{i+1:02d}_{cache_key}.mp3"
            align_dest = work_dir / f"audio_s{i+1:02d}_{cache_key}.json"

            # Check if valid cached audio for THIS exact voice and text already exists
            if audio_dest.is_file() and audio_dest.stat().st_size > 1000:
                dur = probe_duration(audio_dest)
                if align_dest.is_file():
                    try:
                        scene["caption_cues"] = json.loads(align_dest.read_text(encoding="utf-8"))
                    except Exception:
                        scene["caption_cues"] = caption_cues(scene["narration"], None, dur)
                else:
                    scene["caption_cues"] = caption_cues(scene["narration"], None, dur)
                audio_files.append(audio_dest)
                durations.append(dur)
                continue

            # Synthesize fresh audio
            dur, cues = synthesize_voice(
                args.voice_name,
                args.voice_id,
                scene["narration"],
                audio_dest,
                api_key,
                work_dir,
            )
            scene["caption_cues"] = cues
            try:
                align_dest.write_text(json.dumps(cues), encoding="utf-8")
            except Exception:
                pass

            audio_files.append(audio_dest)
            durations.append(dur)

        # Step 2: Render Each Scene Fresh
        # Clean previous clip MP4s to prevent stale concatenation
        for old_clip in work_dir.glob("clip-*.mp4"):
            old_clip.unlink(missing_ok=True)

        clips = []
        for i, (scene, audio, dur) in enumerate(zip(scenes, audio_files, durations)):
            prog = 45 + int((i / total_scenes) * 45)
            update_status(args.status_file, "rendering", prog, f"Rendering motion graphics for Scene {i+1} of {total_scenes}...")
            clip = render_scene(scene, i + 1, total_scenes, topic, audio, dur, work_dir)
            clips.append(clip)

        # Step 3: Concat Video
        update_status(args.status_file, "rendering", 92, "Merging scenes into 1080x1920 MP4 explainer video...")
        concat_file = work_dir / "concat.txt"
        concat_file.write_text("".join(f"file '{c.name}'\n" for c in clips), encoding="utf-8")

        run_cmd([
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file),
            "-c", "copy", "-movflags", "+faststart", str(args.output_mp4)
        ])

        total_dur = probe_duration(args.output_mp4)
        cache_buster = int(time.time())
        video_web_path = f"/videos/{args.output_mp4.name}?v={cache_buster}"

        update_status(
            args.status_file,
            "ready",
            100,
            "Render complete!",
            video_url=video_web_path,
            duration=round(total_dur, 1),
        )

        print(f"RENDER_SUCCESS:{video_web_path}:{round(total_dur, 1)}")
        return 0

    except Exception as exc:
        err_msg = str(exc)
        print(f"RENDER_ERROR:{err_msg}", file=sys.stderr)
        update_status(args.status_file, "failed", 0, "Render failed", error=err_msg)
        return 1

if __name__ == "__main__":
    sys.exit(main())
