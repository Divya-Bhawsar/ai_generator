#!/usr/bin/env python3
"""Generate 4 studio-grade royalty-free background music loops for VidyaMotion:
1. Lofi Chill (warm electric piano chords, sub-bass, vinyl warmth)
2. Tech Flow (minimalist digital arpeggio, modern clean pulse)
3. Ambient Documentary (cinematic drone pads, evolving harmonics)
4. Cinematic Mystery (dramatic tension bassline, deep suspense)
"""
import math
import os
import subprocess
from pathlib import Path
import numpy as np

SAMPLE_RATE = 44100
DURATION = 75.0  # 75 seconds seamless loop (covers standard 60-70s reel)
OUTPUT_DIR = Path("public/audio/music")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def note_freq(note_name: str) -> float:
    """Convert note name (e.g. C4, D#3, Bb2) to frequency in Hz."""
    notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    flat_map = {"Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"}
    
    clean = note_name.strip()
    if len(clean) >= 2 and clean[:2] in flat_map:
        clean = flat_map[clean[:2]] + clean[2:]
    
    match = clean[:-1]
    octave = int(clean[-1])
    semitone = notes.index(match)
    # A4 is 440Hz, semitone 9, octave 4
    n = semitone - 9 + (octave - 4) * 12
    return 440.0 * (2.0 ** (n / 12.0))

def save_wav_to_mp3(audio: np.ndarray, mp3_path: Path, ffmpeg_filter: str = "") -> None:
    """Normalize and encode numpy float array to 192k MP3 via FFmpeg."""
    # Peak normalize to -1 dB
    peak = np.max(np.abs(audio))
    if peak > 0:
        audio = audio / peak * 0.88
    
    int16_audio = (audio * 32767).astype(np.int16)
    temp_raw = mp3_path.with_suffix(".raw")
    temp_raw.write_bytes(int16_audio.tobytes())
    
    channels = 2 if len(audio.shape) > 1 and audio.shape[1] == 2 else 1
    
    cmd = [
        "ffmpeg", "-y",
        "-f", "s16le",
        "-ar", str(SAMPLE_RATE),
        "-ac", str(channels),
        "-i", str(temp_raw),
    ]
    if ffmpeg_filter:
        cmd.extend(["-af", ffmpeg_filter])
    cmd.extend([
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        str(mp3_path)
    ])
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    temp_raw.unlink(missing_ok=True)
    print(f"✓ Generated: {mp3_path}")

def generate_lofi_track() -> None:
    """Generate warm Lofi Study Beats (Dm9 -> G13 -> Cmaj9 -> Am9)."""
    t = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION), endpoint=False)
    bpm = 76.0
    beat_dur = 60.0 / bpm
    bar_dur = beat_dur * 4
    
    # Chord progression: Dm9, G13, Cmaj9, Am9
    progression = [
        ["D3", "F3", "A3", "C4", "E4"],     # Dm9
        ["G2", "F3", "B3", "E4", "A4"],     # G13
        ["C3", "E3", "G3", "B3", "D4"],     # Cmaj9
        ["A2", "E3", "G3", "C4", "B4"],     # Am9
    ]
    
    left = np.zeros_like(t)
    right = np.zeros_like(t)
    
    total_bars = int(math.ceil(DURATION / bar_dur))
    for bar_idx in range(total_bars):
        chord = progression[bar_idx % len(progression)]
        bar_start_time = bar_idx * bar_dur
        
        # Soft Rhodes-style electric piano chords
        for note in chord:
            freq = note_freq(note)
            for beat in range(4):
                if beat in [0, 2]: # Play on beats 1 and 3, gentle syncopation
                    strum_offset = 0.015 * chord.index(note)
                    note_start = bar_start_time + beat * beat_dur + strum_offset
                    if note_start >= DURATION:
                        continue
                    
                    note_len = beat_dur * 1.85
                    start_sample = int(note_start * SAMPLE_RATE)
                    end_sample = min(len(t), start_sample + int(note_len * SAMPLE_RATE))
                    dur_samples = end_sample - start_sample
                    if dur_samples <= 0:
                        continue
                    
                    sub_t = np.linspace(0, dur_samples / SAMPLE_RATE, dur_samples, endpoint=False)
                    # Gentle FM/harmonic electric piano envelope
                    env = np.exp(-sub_t * 1.8) * (1.0 - np.exp(-sub_t * 80.0))
                    # Fundamental + soft 2nd & 3rd harmonics + gentle detune chorus
                    tone = (
                        0.60 * np.sin(2 * np.pi * freq * sub_t) +
                        0.25 * np.sin(2 * np.pi * (freq * 2.001) * sub_t) +
                        0.10 * np.sin(2 * np.pi * (freq * 3.0) * sub_t) +
                        0.05 * np.sin(2 * np.pi * (freq * 0.5) * sub_t)
                    )
                    
                    pan = 0.45 + 0.1 * (chord.index(note) / len(chord))
                    left[start_sample:end_sample] += tone * env * pan * 0.35
                    right[start_sample:end_sample] += tone * env * (1.0 - pan) * 0.35
        
        # Sub-bass on beat 1 and 3.5
        root_freq = note_freq(chord[0]) * 0.5
        for bass_beat, bass_len in [(0, 1.8), (2.5, 1.2)]:
            bass_start = bar_start_time + bass_beat * beat_dur
            if bass_start >= DURATION:
                continue
            start_s = int(bass_start * SAMPLE_RATE)
            end_s = min(len(t), start_s + int(bass_len * beat_dur * SAMPLE_RATE))
            dur_s = end_s - start_s
            if dur_s > 0:
                sub_t = np.linspace(0, dur_s / SAMPLE_RATE, dur_s, endpoint=False)
                bass_env = np.exp(-sub_t * 1.4) * (1.0 - np.exp(-sub_t * 60.0))
                bass_tone = np.sin(2 * np.pi * root_freq * sub_t) + 0.2 * np.sin(2 * np.pi * root_freq * 2 * sub_t)
                left[start_s:end_s] += bass_tone * bass_env * 0.45
                right[start_s:end_s] += bass_tone * bass_env * 0.45

        # Soft Lofi boom-bap rhythm (warm low kick, rimshot, closed hi-hat)
        for beat in range(4):
            # Kick on 0 and 2.5
            for kick_time in [0.0, 2.5]:
                k_start = bar_start_time + kick_time * beat_dur
                if k_start < DURATION:
                    s_idx = int(k_start * SAMPLE_RATE)
                    k_len = int(0.25 * SAMPLE_RATE)
                    e_idx = min(len(t), s_idx + k_len)
                    sub_t = np.linspace(0, (e_idx - s_idx) / SAMPLE_RATE, e_idx - s_idx, endpoint=False)
                    k_pitch = 85.0 * np.exp(-sub_t * 22.0) + 42.0
                    k_env = np.exp(-sub_t * 14.0)
                    k_wave = np.sin(2 * np.pi * k_pitch * sub_t) * k_env * 0.32
                    left[s_idx:e_idx] += k_wave
                    right[s_idx:e_idx] += k_wave
            
            # Rimshot / Snare on 1.0 and 3.0
            if beat in [1, 3]:
                sn_start = bar_start_time + beat * beat_dur
                if sn_start < DURATION:
                    s_idx = int(sn_start * SAMPLE_RATE)
                    sn_len = int(0.18 * SAMPLE_RATE)
                    e_idx = min(len(t), s_idx + sn_len)
                    sub_t = np.linspace(0, (e_idx - s_idx) / SAMPLE_RATE, e_idx - s_idx, endpoint=False)
                    sn_noise = np.random.uniform(-0.15, 0.15, e_idx - s_idx) * np.exp(-sub_t * 30.0)
                    sn_tone = np.sin(2 * np.pi * 210.0 * sub_t) * np.exp(-sub_t * 25.0) * 0.15
                    left[s_idx:e_idx] += (sn_noise + sn_tone) * 0.22
                    right[s_idx:e_idx] += (sn_noise + sn_tone) * 0.22
            
            # Delicate closed hi-hat (swung 8th notes)
            for sub_hat in [0.0, 0.55]:
                h_start = bar_start_time + (beat + sub_hat) * beat_dur
                if h_start < DURATION:
                    s_idx = int(h_start * SAMPLE_RATE)
                    h_len = int(0.06 * SAMPLE_RATE)
                    e_idx = min(len(t), s_idx + h_len)
                    sub_t = np.linspace(0, (e_idx - s_idx) / SAMPLE_RATE, e_idx - s_idx, endpoint=False)
                    h_noise = np.random.uniform(-0.08, 0.08, e_idx - s_idx) * np.exp(-sub_t * 70.0)
                    left[s_idx:e_idx] += h_noise * 0.12
                    right[s_idx:e_idx] += h_noise * 0.14

    # Subtle vinyl crackle backdrop
    vinyl = np.random.normal(0, 0.006, len(t))
    crackle_hits = np.random.binomial(1, 0.0004, len(t)) * np.random.uniform(-0.06, 0.06, len(t))
    left += vinyl + crackle_hits
    right += vinyl + crackle_hits
    
    stereo = np.column_stack([left, right])
    # Apply warm lowpass filter & gentle room echo in ffmpeg
    save_wav_to_mp3(
        stereo,
        OUTPUT_DIR / "music-lofi.mp3",
        ffmpeg_filter="lowpass=f=3800,aecho=0.8:0.7:40:0.3,loudnorm=I=-16:TP=-1.5:LRA=7"
    )

def generate_tech_track() -> None:
    """Generate Tech Flow (pulsing arpeggios, clean modern synth in F minor)."""
    t = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION), endpoint=False)
    bpm = 112.0
    step_dur = (60.0 / bpm) / 4.0  # 16th note steps
    
    # F minor modern pentatonic arpeggio pattern
    arp_notes = ["F3", "Ab3", "C4", "Eb4", "F4", "C4", "Ab3", "C4", "Eb4", "F4", "Ab4", "F4", "Eb4", "C4", "Bb3", "G3"]
    
    left = np.zeros_like(t)
    right = np.zeros_like(t)
    
    total_steps = int(DURATION / step_dur)
    for step in range(total_steps):
        note = arp_notes[step % len(arp_notes)]
        freq = note_freq(note)
        step_start = step * step_dur
        s_idx = int(step_start * SAMPLE_RATE)
        note_len = step_dur * 1.5
        e_idx = min(len(t), s_idx + int(note_len * SAMPLE_RATE))
        dur_s = e_idx - s_idx
        if dur_s <= 0:
            continue
        
        sub_t = np.linspace(0, dur_s / SAMPLE_RATE, dur_s, endpoint=False)
        # Pluck envelope
        env = np.exp(-sub_t * 18.0)
        # Pulse/square harmonic tone
        synth = (
            0.50 * np.sin(2 * np.pi * freq * sub_t) +
            0.30 * np.sin(2 * np.pi * (freq * 2.0) * sub_t) +
            0.15 * np.sin(2 * np.pi * (freq * 3.0) * sub_t)
        )
        
        pan = 0.5 + 0.25 * math.sin(step * 0.4)
        left[s_idx:e_idx] += synth * env * pan * 0.28
        right[s_idx:e_idx] += synth * env * (1.0 - pan) * 0.28
        
        # Crisp digital click every beat (every 4 steps)
        if step % 4 == 0:
            click_len = min(len(t) - s_idx, int(0.02 * SAMPLE_RATE))
            if click_len > 0:
                c_t = np.linspace(0, click_len / SAMPLE_RATE, click_len, endpoint=False)
                click = np.sin(2 * np.pi * 1200.0 * c_t) * np.exp(-c_t * 200.0) * 0.12
                left[s_idx:s_idx + click_len] += click
                right[s_idx:s_idx + click_len] += click
        
        # Sub-bass pulse on root F every 16 steps
        if step % 16 == 0:
            bass_len = min(len(t) - s_idx, int(step_dur * 12 * SAMPLE_RATE))
            if bass_len > 0:
                b_t = np.linspace(0, bass_len / SAMPLE_RATE, bass_len, endpoint=False)
                b_env = np.exp(-b_t * 1.8)
                b_wave = np.sin(2 * np.pi * note_freq("F2") * b_t) * b_env * 0.45
                left[s_idx:s_idx + bass_len] += b_wave
                right[s_idx:s_idx + bass_len] += b_wave

    stereo = np.column_stack([left, right])
    save_wav_to_mp3(
        stereo,
        OUTPUT_DIR / "music-tech.mp3",
        ffmpeg_filter="aecho=0.8:0.6:120:0.35,loudnorm=I=-16:TP=-1.5:LRA=8"
    )

def generate_ambient_track() -> None:
    """Generate Documentary Ambient (ethereal strings, evolving drone pads)."""
    t = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION), endpoint=False)
    
    # Evolving root chords: C, Eb, G, Bb, D
    pad_freqs = [
        [note_freq("C3"), note_freq("G3"), note_freq("Eb4"), note_freq("Bb4")],
        [note_freq("Ab2"), note_freq("Eb3"), note_freq("C4"), note_freq("G4")],
        [note_freq("F2"), note_freq("C3"), note_freq("Ab3"), note_freq("Eb4")],
        [note_freq("G2"), note_freq("D3"), note_freq("Bb3"), note_freq("F4")],
    ]
    
    left = np.zeros_like(t)
    right = np.zeros_like(t)
    
    chord_dur = 18.0  # 18 seconds per evolving pad
    for i, chord in enumerate(pad_freqs):
        c_start = i * chord_dur
        c_end = min(DURATION, (i + 1) * chord_dur + 4.0)  # Overlap 4s for seamless crossfade
        s_idx = int(c_start * SAMPLE_RATE)
        e_idx = int(c_end * SAMPLE_RATE)
        dur_s = e_idx - s_idx
        if dur_s <= 0:
            continue
        
        sub_t = np.linspace(0, dur_s / SAMPLE_RATE, dur_s, endpoint=False)
        # Smooth attack and release envelope
        fade_in = np.clip(sub_t / 3.5, 0, 1)
        fade_out = np.clip((dur_s / SAMPLE_RATE - sub_t) / 3.5, 0, 1)
        pad_env = fade_in * fade_out
        
        for f_idx, freq in enumerate(chord):
            # Rich string/pad chorus with subtle vibrato
            vibrato = np.sin(2 * np.pi * 0.3 * sub_t) * 0.6
            v1 = np.sin(2 * np.pi * (freq + vibrato) * sub_t)
            v2 = np.sin(2 * np.pi * (freq * 1.002 - vibrato) * sub_t)
            tone = (v1 * 0.6 + v2 * 0.4) * pad_env * 0.18
            
            pan = 0.3 + 0.4 * (f_idx / len(chord))
            left[s_idx:e_idx] += tone * pan
            right[s_idx:e_idx] += tone * (1.0 - pan)
    
    stereo = np.column_stack([left, right])
    save_wav_to_mp3(
        stereo,
        OUTPUT_DIR / "music-ambient.mp3",
        ffmpeg_filter="aecho=0.8:0.7:250:0.45,lowpass=f=4500,loudnorm=I=-17:TP=-1.5:LRA=6"
    )

def generate_cinematic_track() -> None:
    """Generate Cinematic Mystery (tension bass ostinato, dramatic strings)."""
    t = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION), endpoint=False)
    bpm = 120.0
    beat_dur = 60.0 / bpm
    
    left = np.zeros_like(t)
    right = np.zeros_like(t)
    
    # 8th note ostinato in D minor (D2, D2, F2, D2, G2, D2, A2, D2)
    ostinato = [note_freq("D2"), note_freq("D2"), note_freq("F2"), note_freq("D2"),
                note_freq("G2"), note_freq("D2"), note_freq("A2"), note_freq("D2")]
    
    step_dur = beat_dur / 2.0  # 8th notes
    total_steps = int(DURATION / step_dur)
    
    for step in range(total_steps):
        freq = ostinato[step % len(ostinato)]
        step_start = step * step_dur
        s_idx = int(step_start * SAMPLE_RATE)
        dur_s = min(len(t) - s_idx, int(step_dur * 1.2 * SAMPLE_RATE))
        if dur_s <= 0:
            continue
        
        sub_t = np.linspace(0, dur_s / SAMPLE_RATE, dur_s, endpoint=False)
        env = np.exp(-sub_t * 6.5)
        # Sawtooth-like tension bass tone
        bass = (
            0.60 * np.sin(2 * np.pi * freq * sub_t) +
            0.30 * np.sin(2 * np.pi * (freq * 2) * sub_t) +
            0.15 * np.sin(2 * np.pi * (freq * 3) * sub_t)
        ) * env * 0.38
        
        left[s_idx:s_idx + dur_s] += bass * 0.5
        right[s_idx:s_idx + dur_s] += bass * 0.5
        
        # Soft heart-rate sub-thud on beat 1 and 3 (step 0 and 4)
        if step % 4 == 0:
            thud_len = min(len(t) - s_idx, int(0.3 * SAMPLE_RATE))
            if thud_len > 0:
                th_t = np.linspace(0, thud_len / SAMPLE_RATE, thud_len, endpoint=False)
                thud = np.sin(2 * np.pi * 50.0 * np.exp(-th_t * 15.0) * th_t) * np.exp(-th_t * 12.0) * 0.4
                left[s_idx:s_idx + thud_len] += thud
                right[s_idx:s_idx + thud_len] += thud

    stereo = np.column_stack([left, right])
    save_wav_to_mp3(
        stereo,
        OUTPUT_DIR / "music-cinematic.mp3",
        ffmpeg_filter="aecho=0.8:0.7:180:0.4,loudnorm=I=-16:TP=-1.5:LRA=7"
    )

if __name__ == "__main__":
    print("Synthesizing 4 studio-grade background music tracks for VidyaMotion...")
    generate_lofi_track()
    generate_tech_track()
    generate_ambient_track()
    generate_cinematic_track()
    print("All background music tracks generated successfully in public/audio/music/")
