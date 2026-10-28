# Video pipeline prototype

This folder contains a rendering proof of concept for the VidyaMotion system design.

## Local render demonstration

From the workspace root:

    python3 prototype/render_demo.py

Requires FFmpeg and FFprobe. It uses macOS `/usr/bin/say` when available, then writes the rendered MP4 and metadata under `prototype/output/`.

## Provider-backed run

Fill the blank values in the workspace-root `.env.local`. The script loads it locally and process environment variables override it. Configure `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, and either `ELEVENLABS_VOICE_ID` or the named `ELEVENLABS_VOICE_VIRAJ_ID` / `ELEVENLABS_VOICE_MONICA_ID` values. `.gitignore` excludes `.env.local` and generated live assets. The voice IDs remain blank until copied from the ElevenLabs account. Optional model settings are `GEMINI_MODEL` (default `gemini-3.8-flash`) and `ELEVENLABS_MODEL` (default `eleven_v4`).

From the workspace root:

    python3 prototype/provider_pipeline.py --topic "Why does a pressure cooker cook rajma and chana faster?" --voice-name viraj

This asks Gemini for a 4–6 scene educational storyboard, generates each scene's narration with ElevenLabs, saves returned alignment cues, and renders the MP4 under `prototype/live/output/`. To choose another output path, pass `--output /path/to/video.mp4`.

Use `--prepare-only` if you want to inspect the generated storyboard and audio before rendering. The renderer also works directly with a saved provider storyboard:

    python3 prototype/render_demo.py --storyboard prototype/live/storyboard.json --output prototype/live/output/explainer-9x16.mp4

To generate voice samples first, fill both named voice IDs in `.env.local` and run `python3 prototype/provider_pipeline.py --preview-voices-only`. Listen to the files in `prototype/live/voice-previews/`, then choose `--voice-name viraj` or `--voice-name monica` for a full run. Add `--preview-voices` to the full command to generate samples and continue into the video. Provider-generated voice duration is measured before export; the renderer stops if the total is outside the 60–90 second target.

## Prototype status

The local demo path may use macOS speech; in this environment that command returned a zero-length audio file, so that path uses a silent timing track with estimated caption timing. The provider-backed path instead generates narration through ElevenLabs and uses returned character timing grouped into phrase captions.

The local storyboard uses estimated phrase timings based on word counts. In the provider-backed path, ElevenLabs character timing is grouped into phrase-level caption cues and used by the renderer. The visual scenes use a small FFmpeg-based motion-graphic mock composition, not Remotion. This prototype does not connect MongoDB, Cloudflare R2, Meta, or Vercel.

The provider-backed path has been run to generate sample videos. Local credentials are not included in source control; keep provider keys and voice IDs in the ignored environment file and never paste secrets into source files.
