#!/usr/bin/env python3
"""Asynchronous Video Render Worker for VidyaMotion.

Renders high-retention 9:16 vertical MP4 explainer videos with:
- Neural ElevenLabs voiceover
- Phrase-level synchronized kinetic subtitles (ASS)
- Procedural motion graphic scenes (charts, flow diagrams, cards)
- Broadcast-grade H.264/AAC encoding via FFmpeg
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import shutil
import subprocess
import sys
import textwrap
from pathlib import Path
from typing import Any

# Ensure FFmpeg is in PATH
HOMEBREW_BIN = "/opt/homebrew/bin"
if HOMEBREW_BIN not in os.environ.get("PATH", ""):
    os.environ["PATH"] = f"{HOMEBREW_BIN}:{os.environ.get('PATH', '')}"

WIDTH, HEIGHT, FPS = 1080, 1920, 30
BG = "0x0B1220"
WHITE = "0xF8FAFC"
MUTED = "0xCBD5E1"
ACCENT = "0x45D6B5"
GOLD = "0xF7C873"
FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
SPECTRUM = ["0xF43F5E", "0xFB923C", "0xFACC15", "0x4ADE80", "0x38BDF8", "0x6366F1", "0xC084FC"]

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

def split_phrases(text: str, max_words: int = 5) -> list[str]:
    words = re.findall(r"\S+", text.strip())
    return [" ".join(words[i:i + max_words]) for i in range(0, len(words), max_words)]

def caption_cues(text: str, alignment: dict[str, Any] | None, duration: float) -> list[dict[str, Any]]:
    pieces = split_phrases(text)
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

def make_ass(scene: dict, duration: float, index: int, work_dir: Path) -> Path:
    events = []
    cues = scene.get("caption_cues") or caption_cues(scene["narration"], None, duration)
    for cue in cues:
        phrase = str(cue.get("text", "")).replace("\\", r"\\").replace("{", r"\{").replace("}", r"\}")
        start = float(cue.get("start", 0))
        end = min(duration, float(cue.get("end", duration)))
        if phrase and end > start:
            events.append(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Caption,,0,0,0,,{phrase}")

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {WIDTH}
PlayResY: {HEIGHT}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Arial,52,&H00FFFFFF,&H00B5D645,&HAA07111F,&H6607111F,1,0,0,0,100,100,0,0,1,3,1,2,90,90,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ass_path = work_dir / f"scene-{index:02d}.ass"
    ass_path.write_text(header + "\n".join(events) + "\n", encoding="utf-8")
    return ass_path

def esc_path(p: Path) -> str:
    return str(p.resolve()).replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")

def visual_filter(scene: dict, index: int, ass_path: Path, work_dir: Path) -> str:
    title_path = work_dir / f"title-{index:02d}.txt"
    title_path.write_text(scene.get("title", f"Scene {index}"), encoding="utf-8")
    title_esc = esc_path(title_path)

    body_text = scene.get("visualLabel") or scene.get("visual_label") or "Visual explanation"
    body_lines = textwrap.wrap(body_text, width=26)
    body_filters = []
    for line_idx, line in enumerate(body_lines):
        body_p = work_dir / f"body-{index:02d}-{line_idx:02d}.txt"
        body_p.write_text(line, encoding="utf-8")
        body_filters.append(
            f"drawtext=fontfile='{FONT}':textfile='{esc_path(body_p)}':fontcolor={MUTED}:fontsize=54:x=(w-text_w)/2:y={650 + line_idx * 72}"
        )

    panel_h = max(105, 46 + len(body_lines) * 72)
    f = (
        f"drawbox=x=150:y=350:w='min(780,t*650)':h=14:color={ACCENT}:t=fill,"
        f"drawtext=fontfile='{FONT}':textfile='{title_esc}':fontcolor={WHITE}:fontsize=82:x=(w-text_w)/2:y=440:line_spacing=18,"
        f"drawbox=x=180:y=620:w=720:h={panel_h}:color=0x152238@1:t=fill,"
        + ",".join(body_filters)
    )

    kind = scene.get("visualType") or scene.get("visual_type") or "concept"

    if kind == "flow":
        f += (
            f",drawbox=x='170+mod(t*100,580)':y=1040:w=110:h=110:color={GOLD}:t=fill"
            ",drawbox=x=485:y=1040:w=110:h=110:color=0x314158:t=fill"
            ",drawbox=x=800:y=1040:w=110:h=110:color=0x314158:t=fill"
            f",drawtext=fontfile='{FONT}':text='INPUT':fontcolor={BG}:fontsize=30:x=185:y=1078"
            f",drawtext=fontfile='{FONT}':text='PROCESS':fontcolor={WHITE}:fontsize=26:x=495:y=1078"
            f",drawtext=fontfile='{FONT}':text='OUTPUT':fontcolor={WHITE}:fontsize=28:x=810:y=1078"
        )
    elif kind in ("bars", "comparison"):
        f += (
            ",drawbox=x=260:y=1120:w=140:h=300:color=0x314158:t=fill"
            f",drawbox=x=470:y='1120-min(400,t*70)':w=140:h='min(400,t*70)':color={ACCENT}:t=fill"
            f",drawbox=x=680:y='1120-min(560,t*100)':w=140:h='min(560,t*100)':color={GOLD}:t=fill"
            f",drawtext=fontfile='{FONT}':text='BASELINE':fontcolor={MUTED}:fontsize=28:x=260:y=1460"
            f",drawtext=fontfile='{FONT}':text='IMPACT':fontcolor={WHITE}:fontsize=28:x=685:y=1460"
        )
    elif kind == "takeaway":
        f += (
            ",drawbox=x=180:y=1020:w=720:h=360:color=0x1E293B:t=fill"
            f",drawbox=x=180:y=1020:w=720:h=360:color={GOLD}:t=6"
            f",drawtext=fontfile='{FONT}':text='KEY TAKEAWAY':fontcolor={GOLD}:fontsize=36:x=(w-text_w)/2:y=1080"
            f",drawtext=fontfile='{FONT}':text='✓  Core Concept Mastered':fontcolor={WHITE}:fontsize=32:x=230:y=1170"
            f",drawtext=fontfile='{FONT}':text='✓  Ready to Apply & Share':fontcolor={ACCENT}:fontsize=32:x=230:y=1250"
        )
    else:
        # Default concept motion
        f += (
            ",drawbox=x=220:y=1050:w=640:h=320:color=0x162032:t=fill"
            f",drawbox=x=220:y=1050:w=640:h=320:color={ACCENT}:t=4"
            f",drawtext=fontfile='{FONT}':text='●':fontcolor={GOLD}:fontsize=90:x='320+240*abs(sin(t*1.5))':y=1130"
            f",drawtext=fontfile='{FONT}':text='EXPLAINER FOCUS':fontcolor={WHITE}:fontsize=30:x=(w-text_w)/2:y=1300"
        )

    f += f",subtitles='{esc_path(ass_path)}'"
    return f

def render_scene(scene: dict, index: int, audio: Path, duration: float, work_dir: Path) -> Path:
    ass = make_ass(scene, duration, index, work_dir)
    clip = work_dir / f"scene-{index:02d}.mp4"
    vf = visual_filter(scene, index, ass, work_dir)
    run_cmd([
        "ffmpeg", "-y", "-f", "lavfi", "-i",
        f"color=c={BG}:s={WIDTH}x{HEIGHT}:r={FPS}:d={duration:.3f}",
        "-i", str(audio), "-vf", vf,
        "-t", f"{duration:.3f}", "-r", str(FPS),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
        "-ar", "48000", "-shortest", str(clip)
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
    api_key = ""
    if env_file.is_file():
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

        if total_scenes == 0:
            raise ValueError("No scenes found in storyboard")

        # Step 1: Synthesize Audio
        audio_files = []
        durations = []

        import urllib.request
        for i, scene in enumerate(scenes):
            prog = 10 + int((i / total_scenes) * 35)
            update_status(args.status_file, "rendering", prog, f"Generating voiceover for Scene {i+1} of {total_scenes}...")

            audio_dest = work_dir / f"scene-{i+1:02d}.mp3"

            if api_key and args.voice_id:
                url = f"https://api.elevenlabs.io/v1/text-to-speech/{args.voice_id}/with-timestamps?output_format=mp3_44100_128"
                payload = json.dumps({
                    "text": scene["narration"],
                    "model_id": "eleven_v4",
                    "language_code": "en",
                }).encode("utf-8")
                req = urllib.request.Request(url, data=payload, headers={
                    "xi-api-key": api_key,
                    "Content-Type": "application/json",
                })
                with urllib.request.urlopen(req, timeout=60) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    audio_dest.write_bytes(base64.b64decode(resp_data.get("audio_base64", "")))
                    scene["caption_cues"] = caption_cues(
                        scene["narration"],
                        resp_data.get("alignment"),
                        probe_duration(audio_dest),
                    )
            else:
                # Offline fallback with silent track
                est = max(1.5, len(scene["narration"].split()) / 2.5)
                run_cmd([
                    "ffmpeg", "-y", "-f", "lavfi", "-i",
                    f"anullsrc=r=48000:cl=stereo:d={est:.3f}",
                    "-c:a", "libmp3lame", str(audio_dest)
                ])

            dur = probe_duration(audio_dest)
            audio_files.append(audio_dest)
            durations.append(dur)

        # Step 2: Render Each Scene
        clips = []
        for i, (scene, audio, dur) in enumerate(zip(scenes, audio_files, durations)):
            prog = 45 + int((i / total_scenes) * 45)
            update_status(args.status_file, "rendering", prog, f"Rendering motion graphics for Scene {i+1} of {total_scenes}...")
            clip = render_scene(scene, i + 1, audio, dur, work_dir)
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
        video_web_path = f"/videos/{args.output_mp4.name}"

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
