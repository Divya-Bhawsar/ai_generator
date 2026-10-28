#!/usr/bin/env python3
"""Render a local or provider-backed explainer with FFmpeg.

It demonstrates a complete narrated/animated/captioned MP4 without external keys.
The voice is a local placeholder, not the planned ElevenLabs production voice.
Caption timing is phrase-level and estimated from word counts, not forced aligned.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WORK = ROOT / "work"
OUT = ROOT / "output"
STORYBOARD = ROOT / "storyboard.json"
WIDTH, HEIGHT, FPS = 1080, 1920, 30
VOICE = "Aman"
VOICE_RATE = "135"
BG = "0x0B1220"
WHITE = "0xF8FAFC"
MUTED = "0xCBD5E1"
ACCENT = "0x45D6B5"
GOLD = "0xF7C873"
FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
SPECTRUM = ["0xF43F5E", "0xFB923C", "0xFACC15", "0x4ADE80", "0x38BDF8", "0x6366F1", "0xC084FC"]

def run(args: list[str]) -> str:
    proc = subprocess.run(args, cwd=ROOT, check=True, text=True, capture_output=True)
    return proc.stdout.strip()

def esc_filter_path(path: Path) -> str:
    return str(path.resolve()).replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")

def probe_duration(path: Path) -> float:
    value = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", str(path)])
    try:
        return float(value)
    except ValueError:
        return 0.0

def split_phrases(text: str, max_words: int = 5) -> list[str]:
    words = re.findall(r"\S+", text.strip())
    return [" ".join(words[i:i + max_words]) for i in range(0, len(words), max_words)]

def ass_time(seconds: float) -> str:
    cs = max(0, int(round(seconds * 100)))
    hours, rem = divmod(cs, 360000)
    minutes, rem = divmod(rem, 6000)
    whole, centis = divmod(rem, 100)
    return f"{hours}:{minutes:02d}:{whole:02d}.{centis:02d}"

def create_audio(scene: dict, index: int) -> tuple[Path, float]:
    aiff = WORK / f"scene-{index:02d}.aiff"
    wav = WORK / f"scene-{index:02d}.wav"
    if scene.get("audio_file"):
        source = Path(scene["audio_file"])
        if not source.is_file():
            raise SystemExit(f"Scene {index} audio file does not exist: {source}")
        run(["ffmpeg", "-y", "-i", str(source), "-ar", "48000", "-ac", "2",
             "-c:a", "pcm_s16le", str(wav)])
        duration = probe_duration(wav)
        if duration < 0.1:
            raise SystemExit(f"Scene {index} provider audio is empty or unreadable.")
        return wav, duration
    run(["/usr/bin/say", "-v", VOICE, "-r", VOICE_RATE, "-o", str(aiff), scene["narration"]])
    local_duration = probe_duration(aiff)
    if local_duration < 0.1:
        # This sandbox's system TTS returned an empty AIFF. Use silence at estimated
        # narration duration so the renderer/layout can still be exercised honestly.
        duration = max(1.0, len(scene["narration"].split()) / 135 * 60)
        run(["ffmpeg", "-y", "-f", "lavfi", "-i",
             f"anullsrc=r=48000:cl=stereo:d={duration:.3f}",
             "-c:a", "pcm_s16le", str(wav)])
        return wav, duration
    run(["ffmpeg", "-y", "-i", str(aiff), "-ar", "48000", "-ac", "2",
         "-c:a", "pcm_s16le", str(wav)])
    return wav, probe_duration(wav)

def make_ass(scene: dict, duration: float, index: int) -> Path:
    events = []
    cues = scene.get("caption_cues")
    if isinstance(cues, list) and cues:
        timed_phrases = [(str(cue.get("text", "")), float(cue.get("start", 0)),
                          min(duration, float(cue.get("end", duration)))) for cue in cues]
    else:
        phrases = split_phrases(scene["narration"])
        counts = [len(phrase.split()) for phrase in phrases]
        total_words = max(1, sum(counts))
        cursor = 0.35
        timed_phrases = []
        for phrase, count in zip(phrases, counts):
            span = max(1.25, (duration - 0.65) * count / total_words)
            end = min(duration, cursor + span)
            timed_phrases.append((phrase, cursor, end))
            cursor = end
    for phrase, start, end in timed_phrases:
        escaped = phrase.replace("\\", r"\\").replace("{", r"\{").replace("}", r"\}")
        if phrase and end > start:
            events.append(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Caption,,0,0,0,,{escaped}")
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
    path = WORK / f"scene-{index:02d}.ass"
    path.write_text(header + "\n".join(events) + "\n", encoding="utf-8")
    return path

def visual_filter(scene: dict, index: int, ass_path: Path) -> str:
    title_path = WORK / ("title-%02d.txt" % index)
    title_path.write_text(scene["title"], encoding="utf-8")
    title = esc_filter_path(title_path)
    body_lines = textwrap.wrap(scene["visual_label"], width=25)
    body_filters = []
    for line_index, line in enumerate(body_lines):
        body_path = WORK / ("body-%02d-%02d.txt" % (index, line_index))
        body_path.write_text(line, encoding="utf-8")
        body = esc_filter_path(body_path)
        body_filters.append(
            "drawtext=fontfile='%s':textfile='%s':fontcolor=%s:fontsize=54:x=(w-text_w)/2:y=%d"
            % (FONT, body, MUTED, 650 + line_index * 72)
        )
    panel_height = max(105, 46 + len(body_lines) * 72)
    f = (
        "drawbox=x=150:y=350:w='min(780,t*650)':h=14:color=%s:t=fill,"
        "drawtext=fontfile='%s':textfile='%s':fontcolor=%s:fontsize=82:x=(w-text_w)/2:y=440:line_spacing=18,"
        "drawbox=x=180:y=620:w=720:h=%d:color=0x152238@1:t=fill,"
        % (ACCENT, FONT, title, WHITE, panel_height)
        + ",".join(body_filters)
    )
    kind = scene.get("visual_type", "concept")
    scene_words = (scene.get("title", "") + " " + scene.get("visual_label", "")).lower()
    if kind == "hook" and any(word in scene_words for word in ("rain", "monsoon", "sunlight")):
        kind = "light_ray"
    if kind == "light_ray" and any(word in scene_words for word in ("reflection", "reflecting")):
        kind = "droplet"
    if kind == "flow":
        f += (
            ",drawbox=x='170+mod(t*100,580)':y=1040:w=110:h=110:color=%s:t=fill"
            ",drawbox=x=485:y=1040:w=110:h=110:color=0x314158:t=fill"
            ",drawbox=x=800:y=1040:w=110:h=110:color=0x314158:t=fill"
            ",drawtext=fontfile='%s':text='HEAT':fontcolor=%s:fontsize=32:x=190:y=1078"
            ",drawtext=fontfile='%s':text='STEAM':fontcolor=%s:fontsize=30:x=500:y=1078"
            ",drawtext=fontfile='%s':text='PRESSURE':fontcolor=%s:fontsize=26:x=800:y=1078"
            % (GOLD, FONT, BG, FONT, WHITE, FONT, WHITE)
        )
    elif kind == "bars":
        f += (
            ",drawbox=x=260:y=1120:w=140:h=300:color=0x314158:t=fill"
            ",drawbox=x=470:y='1120-min(400,t*70)':w=140:h='min(400,t*70)':color=%s:t=fill"
            ",drawbox=x=680:y='1120-min(560,t*100)':w=140:h='min(560,t*100)':color=%s:t=fill"
            ",drawtext=fontfile='%s':text='OPEN POT':fontcolor=%s:fontsize=30:x=250:y=1460"
            ",drawtext=fontfile='%s':text='PRESSURE':fontcolor=%s:fontsize=28:x=660:y=1460"
            % (ACCENT, GOLD, FONT, MUTED, FONT, WHITE)
        )
    elif kind == "safety":
        f += (
            ",drawbox=x=330:y=1020:w=420:h=300:color=0x24334A:t=fill"
            ",drawbox=x='520+22*sin(t*2)':y=940:w=40:h=130:color=%s:t=fill"
            ",drawtext=fontfile='%s':text='STEAM RELEASE':fontcolor=%s:fontsize=38:x='330+20*sin(t*2)':y=1380"
            % (GOLD, FONT, ACCENT)
        )
    elif kind == "light_ray":
        f += (
            ",drawtext=fontfile='%s':text='●':fontcolor=%s:fontsize=150:x=115:y=1010"
            ",drawtext=fontfile='%s':text='SUNLIGHT':fontcolor=%s:fontsize=28:x=105:y=1190"
            ",drawbox=x=290:y=1090:w='min(400,t*150)':h=18:color=0xFFF5C2:t=fill"
            ",drawtext=fontfile='%s':text='WHITE LIGHT':fontcolor=0xFFF5C2:fontsize=28:x=320:y=1015"
            ",drawtext=fontfile='%s':text='●':fontcolor=0x38BDF8:fontsize=245:x=650:y=990"
            ",drawtext=fontfile='%s':text='WATER DROP':fontcolor=%s:fontsize=27:x=665:y=1230"
            ",drawtext=fontfile='%s':text='LIGHT ENTERS WATER':fontcolor=%s:fontsize=30:x=260:y=1370"
            % (FONT, GOLD, FONT, WHITE, FONT, FONT, FONT, MUTED, FONT, ACCENT)
        )
    elif kind == "droplet":
        f += (
            ",drawtext=fontfile='%s':text='●':fontcolor=0x1688C7:fontsize=390:x=330:y=925"
            ",drawbox=x=80:y=1090:w=390:h=14:color=0xFFF5C2:t=fill"
            ",drawbox=x=470:y=1090:w=125:h=14:color=0xFFF5C2:t=fill"
            ",drawbox=x=580:y=1090:w=14:h=130:color=0xFFF5C2:t=fill"
            ",drawbox=x=470:y=1206:w=124:h=14:color=0xFFF5C2:t=fill"
            ",drawtext=fontfile='%s':text='●':fontcolor=0xFFFFFF:fontsize=44:x='470+85*abs(sin(t*1.7))':y='1060+130*abs(sin(t*1.7+1.1))'"
            ",drawtext=fontfile='%s':text='1  ENTER':fontcolor=%s:fontsize=25:x=85:y=1140"
            ",drawtext=fontfile='%s':text='2  BOUNCE':fontcolor=%s:fontsize=25:x=650:y=1360"
            ",drawtext=fontfile='%s':text='3  EXIT':fontcolor=%s:fontsize=25:x=735:y=1020"
            % (FONT, FONT, FONT, MUTED, FONT, GOLD, FONT, ACCENT)
        )
    elif kind == "spectrum":
        f += ",drawtext=fontfile='%s':text='ONE BEAM  →  MANY COLORS':fontcolor=%s:fontsize=34:x=210:y=915" % (FONT, WHITE)
        labels = ["RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "INDIGO", "VIOLET"]
        for band, (color, label) in enumerate(zip(SPECTRUM, labels)):
            y = 1000 + band * 57
            x = 170 + band * 22
            f += (
                ",drawbox=x='%d+min(330,t*95)':y=%d:w='min(440,t*170)':h=34:color=%s:t=fill"
                ",drawtext=fontfile='%s':text='%s':fontcolor=%s:fontsize=23:x=710:y=%d"
                % (x, y, color, FONT, label, WHITE, y + 3)
            )
        f += (
            ",drawtext=fontfile='%s':text='●':fontcolor=0xFFFFFF:fontsize=42:x='145+mod(t*180,550)':y=1120"
            ",drawtext=fontfile='%s':text='SHORTER WAVELENGTHS BEND MORE':fontcolor=%s:fontsize=25:x=210:y=1435"
            % (FONT, FONT, MUTED)
        )
    elif kind == "rainbow":
        f += ",drawtext=fontfile='%s':text='A RAINBOW IS A COLORFUL LIGHT PATH':fontcolor=%s:fontsize=31:x=175:y=900" % (FONT, WHITE)
        colors = ["0xF43F5E", "0xFB923C", "0xFACC15", "0x4ADE80", "0x38BDF8", "0x6366F1", "0xC084FC"]
        for band, color in enumerate(colors):
            x = 180 + band * 34
            y = 995 + band * 24
            width = 720 - band * 68
            height = 385 - band * 33
            f += (
                ",drawbox=x=%d:y=%d:w=%d:h=22:color=%s:t=fill"
                ",drawbox=x=%d:y=%d:w=22:h=%d:color=%s:t=fill"
                ",drawbox=x=%d:y=%d:w=22:h=%d:color=%s:t=fill"
                % (x, y, width, color, x, y, height, color, x + width - 22, y, height, color)
            )
        f += (
            ",drawtext=fontfile='%s':text='●':fontcolor=0xFFFFFF:fontsize=46:x='190+mod(t*200,650)':y=1110"
            ",drawtext=fontfile='%s':text='SUNLIGHT  +  RAINDROPS  +  YOUR VIEW':fontcolor=%s:fontsize=27:x=200:y=1425"
            % (FONT, FONT, MUTED)
        )
    elif kind in {"binary_array", "binary_mid", "binary_narrow", "binary_found"}:
        values = [4, 8, 12, 16, 23, 29, 35]
        if kind == "binary_narrow":
            low, high, mid = 4, 6, 5
            comparison = "23 < 29   KEEP THE LEFT SIDE"
        elif kind == "binary_found":
            low, high, mid = 4, 4, 4
            comparison = "23 = 23   TARGET FOUND"
        elif kind == "binary_mid":
            low, high, mid = 0, 6, 3
            comparison = "23 > 16   DISCARD THE LEFT HALF"
        else:
            low, high, mid = 0, 6, -1
            comparison = "FIND 23 IN A SORTED ARRAY"
        f += ",drawtext=fontfile='%s':text='TARGET  23':fontcolor=%s:fontsize=39:x=390:y=925" % (FONT, GOLD)
        for cell, value in enumerate(values):
            x = 145 + cell * 113
            if kind == "binary_found" and cell == 4:
                fill, border, ink = "0x15803D", ACCENT, WHITE
            elif cell == mid:
                fill, border, ink = "0x7C5A17", GOLD, WHITE
            elif cell == 4:
                fill, border, ink = "0x1C3852", "0x38BDF8", WHITE
            elif low <= cell <= high:
                fill, border, ink = "0x1B2A40", "0x49617D", MUTED
            else:
                fill, border, ink = "0x131C2C", "0x263449", "0x64748B"
            f += (
                f",drawbox=x={x}:y=1000:w=100:h=112:color={fill}:t=fill"
                f",drawbox=x={x}:y=1000:w=100:h=112:color={border}:t=5"
                f",drawtext=fontfile='{FONT}':text='{value}':fontcolor={ink}:fontsize=43:x={x+31}:y=1025"
                f",drawtext=fontfile='{FONT}':text='{cell}':fontcolor={ink}:fontsize=22:x={x+44}:y=1081"
            )
        if kind != "binary_array":
            for position, label, color in ((low, "LOW", ACCENT), (mid, "MID", GOLD), (high, "HIGH", ACCENT)):
                x = 145 + position * 113 + 20
                f += f",drawtext=fontfile='{FONT}':text='{label}':fontcolor={color}:fontsize=23:x={x}:y=1140"
        f += (
            f",drawtext=fontfile='{FONT}':text='{comparison}':fontcolor={WHITE}:fontsize=28:x=(w-text_w)/2:y=1235"
            f",drawbox=x=175:y=1320:w=730:h=18:color=0x27364A:t=fill"
            f",drawbox=x={145+low*113}:y=1314:w={(high-low+1)*113-13}:h=30:color={ACCENT}@0.9:t=fill"
            f",drawtext=fontfile='{FONT}':text='COMPARE THE MIDDLE, THEN SHRINK THE RANGE':fontcolor={MUTED}:fontsize=24:x=190:y=1375"
        )
    elif kind == "binary_complexity":
        f += ",drawtext=fontfile='%s':text='HOW MANY VALUES MAY NEED CHECKING?':fontcolor=%s:fontsize=29:x=190:y=930" % (FONT, WHITE)
        f += ",drawtext=fontfile='%s':text='LINEAR SEARCH  ·  UP TO 64 CHECKS':fontcolor=%s:fontsize=27:x=185:y=1010" % (FONT, MUTED)
        f += ",drawbox=x=185:y=1055:w=700:h=42:color=0xF97373:t=fill"
        f += ",drawtext=fontfile='%s':text='BINARY SEARCH  ·  ABOUT 7 CHECKS':fontcolor=%s:fontsize=27:x=185:y=1160" % (FONT, WHITE)
        f += ",drawbox=x=185:y=1205:w=700:h=42:color=0x263449:t=fill"
        f += ",drawbox=x=185:y=1205:w='min(90,t*90)':h=42:color=%s:t=fill" % ACCENT
        f += ",drawtext=fontfile='%s':text='64  >  32  >  16  >  8  >  4  >  2  >  1':fontcolor=%s:fontsize=27:x=200:y=1300" % (FONT, GOLD)
        f += ",drawtext=fontfile='%s':text='EACH COMPARISON HALVES THE SEARCH RANGE':fontcolor=%s:fontsize=23:x=195:y=1370" % (FONT, MUTED)
    f += ",subtitles='%s'" % esc_filter_path(ass_path)
    return f

def render_scene(scene: dict, index: int, audio: Path, duration: float) -> Path:
    ass = make_ass(scene, duration, index)
    clip = WORK / f"scene-{index:02d}.mp4"
    run([
        "ffmpeg", "-y", "-f", "lavfi", "-i",
        f"color=c={BG}:s={WIDTH}x{HEIGHT}:r={FPS}:d={duration:.3f}",
        "-i", str(audio), "-vf", visual_filter(scene, index, ass),
        "-t", f"{duration:.3f}", "-r", str(FPS),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
        "-ar", "48000", "-shortest", str(clip)
    ])
    return clip

def main() -> None:
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise SystemExit("FFmpeg and FFprobe are required.")
    parser = argparse.ArgumentParser(description="Render a storyboard as a captioned explainer video.")
    parser.add_argument("--storyboard", type=Path, default=STORYBOARD)
    parser.add_argument("--output", type=Path, default=OUT / "pressure-cooker-explainer-9x16.mp4")
    args = parser.parse_args()
    if not args.storyboard.is_file():
        raise SystemExit(f"Storyboard file does not exist: {args.storyboard}")
    spec = json.loads(args.storyboard.read_text(encoding="utf-8"))
    uses_provider_audio = any(scene.get("audio_file") for scene in spec.get("scenes", []))
    if not uses_provider_audio and not Path("/usr/bin/say").exists():
        raise SystemExit("This prototype requires macOS /usr/bin/say.")
    WORK.mkdir(parents=True, exist_ok=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    clips = []
    total_audio = 0.0
    for index, scene in enumerate(spec["scenes"], 1):
        audio, duration = create_audio(scene, index)
        total_audio += duration
        print(f"Scene {index}: {duration:.1f}s narration")
        clips.append(render_scene(scene, index, audio, duration))
    if not 60 <= total_audio <= 90:
        raise SystemExit(f"Prototype narration is {total_audio:.1f}s; revise VOICE_RATE or storyboard to target 60–90s.")
    concat = WORK / "concat.txt"
    concat.write_text("".join(f"file '{clip.name}'\n" for clip in clips), encoding="utf-8")
    output = args.output.resolve()
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat),
         "-c", "copy", "-movflags", "+faststart", str(output)])
    info = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format",
                           "-of", "json", str(output)]))
    video = next(stream for stream in info["streams"] if stream["codec_type"] == "video")
    audio = next(stream for stream in info["streams"] if stream["codec_type"] == "audio")
    summary = {
        "file": str(output),
        "duration_seconds": float(info["format"]["duration"]),
        "width": video["width"], "height": video["height"],
        "fps": video["r_frame_rate"],
        "video_codec": video["codec_name"], "audio_codec": audio["codec_name"],
        "voice": (f"{spec.get('voice_provider', 'provider')} {spec.get('voice_model', '')} ({spec.get('voice_id', 'selected voice')})"
                  if uses_provider_audio else "silent placeholder; local macOS TTS returned zero-length audio in this environment"),
        "caption_timing": (spec.get("scenes", [{}])[0].get("caption_timing_source", "estimated phrase-level timing; not word-aligned")
                           if uses_provider_audio else "estimated phrase-level timing; not word-aligned"),
        "scene_count": len(clips)
    }
    output.with_name("render-metadata.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))

if __name__ == "__main__":
    main()
