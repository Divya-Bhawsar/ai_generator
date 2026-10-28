# Video Pipeline Technical Design and Prototype Plan

**Product:** VidyaMotion (provisional)  
**Status:** Proposed technical design  
**Date:** October 27, 2026  
**Related documents:** [PRD.md](PRD.md) · [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) · [API_DESIGN.md](API_DESIGN.md) · [DATABASE_DESIGN.md](DATABASE_DESIGN.md)

## 1. Scope

This document focuses on the media pipeline that converts an approved educational storyboard into a downloadable and publishable video. It defines production stages, service boundaries, data contracts, timing rules, retries, quality gates, and a staged prototype plan.

V1 output: English educational explainer, 60–90 seconds, minimal motion graphics, narration, burned-in captions, and a rendered MP4. Instagram vertical is the default; square and landscape variants can be rendered from the same approved story.

## 2. Pipeline at a glance

1. Creator submits an idea and optional source notes.
2. Gemini generates script and structured storyboard.
3. Creator reviews and approves a storyboard version.
4. Backend creates a durable render job and returns immediately.
5. Worker generates narration, measures durations, and obtains word/phrase alignment.
6. Renderer builds motion scenes and captions against the measured audio timeline.
7. Worker validates and stores MP4 plus thumbnail in R2.
8. Creator previews, revises, downloads, or starts Instagram publishing.
9. For publishing, Meta fetches a temporary signed video URL and confirms publication.

The pipeline is version-bound: every render job references the exact storyboard version it used. Changes made during rendering create a later version and do not mutate an in-progress job.

## 3. Component responsibilities

| Component | Responsibility |
|---|---|
| Next.js app on Vercel | Authenticated UI, idea/storyboard API, project CRUD, job submission/status, signed storage URLs, Meta OAuth callback |
| Clerk | Self-service user identity and session |
| MongoDB Atlas | User-owned projects, storyboard versions, render jobs, artifacts, social connections, publish attempts |
| Gemini adapter | Brainstorming, script/storyboard JSON, conversational revision |
| ElevenLabs adapter | Voice previews and production narration |
| Alignment adapter | Word or phrase timing for the exact generated transcript |
| Node render worker | Job claim, stage progression, provider calls, render orchestration, validation, upload |
| Remotion | Scene timeline and controlled animated compositions |
| FFmpeg / FFprobe | Codec normalization, concatenation/mixing, poster frame, final validation |
| Cloudflare R2 | Private source and output media objects |
| Meta adapter | User-authorized publish-now workflow |

Keep provider clients behind application interfaces. A provider change should not require changing storyboard records or user flows.

## 4. Generation contracts

### 4.1 Storyboard response

The model returns structured data, validated server-side before storage. Suggested logical shape:

    {
      "title": "How a pressure cooker speeds up cooking",
      "language": "en",
      "locale": "en-IN",
      "targetSeconds": { "min": 60, "max": 90 },
      "audience": "General Indian audience",
      "scenes": [
        {
          "sceneId": "stable-id",
          "order": 1,
          "title": "The key idea",
          "narration": "Spoken words for this scene.",
          "visual": {
            "primitive": "concept_diagram",
            "summary": "Show trapped steam raising pressure.",
            "labels": ["steam", "pressure"],
            "elements": []
          },
          "transition": "continue",
          "sourceNotes": []
        }
      ]
    }

The exact implementation may use Zod or an equivalent runtime schema. Required invariants:
- scene IDs are unique within the version;
- order is contiguous and stable;
- narration is non-empty;
- primitive is from an allowlisted set;
- labels and element counts/lengths are bounded;
- no executable code is accepted;
- source notes remain separate from model instructions;
- language is English and examples should be India-relevant when useful.

Suggested primitives: hook, concept diagram, comparison, process steps, simple chart, metric callout, labeled object, and takeaway.

### 4.2 Render job

A render job is immutable with respect to its source storyboard version.

Fields:
- renderJobId, userId, projectId, storyboardVersionId;
- requested aspect ratio and output profile;
- narration provider/model/voice ID configuration;
- stage, progress, attempt count, lease owner, lease expiry;
- startedAt, updatedAt, completedAt;
- sanitized failure code and retryability.

The API must derive userId from the authenticated session. The browser cannot assign a job to another user.

### 4.3 Render artifact

Store:
- artifactId, owning user/project/job/version IDs;
- object keys for final MP4, audio master, thumbnail;
- actual duration, width, height, frame rate;
- video/audio codecs and file size;
- caption mode and timing source;
- validation status and creation time.

## 5. Detailed stage design

### Stage A — prepare storyboard

- Validate the approved storyboard version.
- Confirm narration is English, scene sequence is valid, and visual primitives are supported.
- Estimate spoken duration for an early warning only.
- If the estimate is far outside 60–90 seconds, let the creator request a concise revision before rendering.
- Do not treat word-count estimates as final duration.

### Stage B — synthesize narration

- Use ElevenLabs as first candidate, initially evaluating Eleven v4 and specific Indian English voice IDs.
- Generate one audio segment per scene where the provider and voice produce acceptable continuity.
- Keep one voice ID consistent across all segments in a render.
- Normalize punctuation, whitespace, and pronunciation substitutions using a versioned text-normalization record; never change visible script text without reflecting the change to the creator.
- Store temporary scene audio in a private R2 prefix with a short lifecycle.
- Record actual duration, sample rate, channels, provider request ID, and sanitized status per scene.

Voice presets should be curated from actual audition results, not dynamically inferred from the label. The UI offers two or three previewable choices, including male and female Indian English options. Compare provider samples on the same Indian place names, educational terms, and numbers. The creator’s selected voice is attached to the render, not permanently forced on the account.

### Stage C — align transcript and audio

Preferred sequence:
1. Use provider-returned word timestamps when available and verified against the returned audio.
2. Otherwise run transcription/alignment against the actual generated scene audio using the exact scene transcript.
3. Validate that alignment text matches the transcript and timestamps fit within the segment duration.
4. If word-level confidence is low, collapse to phrase-level captions.
5. If even phrase timing is invalid, keep audio and use scene-level caption blocks or fail with an actionable message; never invent precise timing.

Store alignment as normalized offsets from the start of each scene audio segment. Do not store timing only as global timeline floats.

### Stage D — reconcile duration and pacing

Let each scene audio duration be the measured segment duration. Add transitions only where the composition requires them; transitions must not truncate speech. Total duration equals the sum of measured audio and intentional tails.

If total is below 60 seconds or above 90:
- do not stretch/crop audio automatically;
- return a suggested conversational action such as “expand the explanation to reach the target” or “shorten the narration to fit”;
- regenerate the affected storyboard/narration before final render;
- retain the previous approved storyboard.

For final compositions, audio is authoritative and the timeline is quantized to the chosen frame rate. At 30 fps, each frame represents 1/30 second; caption boundaries snap to frame boundaries without accumulating drift.

### Stage E — map scenes to motion graphics

- Convert constrained scene visual data to validated component props.
- Render only allowlisted Remotion components; never evaluate model-generated React or JavaScript.
- Let visual component events bind to scene-relative narration timestamps, e.g. reveal label when the key term is spoken.
- Use simple, semantically meaningful motion: draw/reveal, move/compare, progress, highlight, and settle.
- Keep key labels in aspect-ratio-safe regions.
- Every scene needs a static fallback composition if its animated component fails.
- Use consistent colors, type sizes, transition timing, and caption placement across the video; this is the product’s neutral visual system, not a user brand kit.

### Stage F — captions

Captions are burned into the MP4 for V1.

Data per caption cue:
- sceneId;
- normalized start/end offsets;
- visible text;
- optional active-word range;
- confidence/timing source.

Rules:
- phrase-sized captions are the reliable default;
- word highlighting is optional and should be disabled if it causes clutter;
- split at natural punctuation and line width;
- preserve readable contrast and safe areas across 9:16, 1:1, and 16:9;
- avoid captions obscuring labels that carry the same information;
- captions follow any pronunciation-normalized speech while preserving readable creator-approved wording.

### Stage G — composition and encode

- Compose the scene sequence and measured audio timeline.
- Default render: 9:16, 1080x1920, 30 fps, H.264 video, AAC audio, yuv420p.
- Alternate variants: 1:1 and 16:9 using reflowed safe areas, not a blind crop.
- Remotion creates frame content; FFmpeg handles concatenation/audio normalization/encode where appropriate.
- Generate a thumbnail from a useful non-caption-obscured frame.
- Upload to a private R2 object key tied to user/project/render IDs.

### Stage H — validate output

Use FFprobe and application checks to verify:
- file exists, non-zero size, and decodes;
- expected video and audio streams exist;
- actual duration is within the selected target or is clearly flagged;
- width/height/aspect ratio/fps match requested variant;
- audio is not silent or clipped;
- captions have cues and are inside duration;
- video has no missing or blank scene segment;
- output object is readable through an authorized signed URL.

Only then mark the render job complete and show Preview.

## 6. Job state machine and idempotency

Suggested job states:

Queued → Preparing narration → Aligning → Building scenes → Rendering → Validating → Uploading → Completed

Retryable failure can occur at any stage. Permanent failure should be reserved for invalid inputs, unsupported formats, exhausted retries, or a provider response that requires user action.

Worker processing:
- claim one job atomically and set a lease;
- renew lease while active;
- checkpoint the stage and completed scene assets;
- write outputs under attempt-specific temporary keys;
- promote/copy final artifact keys only after validation;
- mark completion with a compare-and-set on the current job attempt.

Retries:
- transient HTTP/network errors: bounded exponential backoff with jitter;
- malformed model output: one schema-repair attempt, then user retry;
- TTS failure for one scene: retry that scene, preserving successful audio segments;
- render failure: retry failed composition where safe;
- expired lease: reclaim only if the stage can be safely repeated;
- duplicate create request: idempotency key returns the existing active job;
- user regeneration: new render job; never mutate an earlier artifact.

Progress shown to users is stage-based and approximate. It must not imply percent precision that the worker cannot measure.

## 7. Storage and retention behavior

- Project and storyboard data autosave in MongoDB.
- Source documents, narration, and outputs are private R2 objects.
- Use signed URLs for browser transfers; enforce user ownership before URL creation.
- A temporary signed GET URL used by Meta has a bounded lifetime sufficient for processing.
- V1 does not provide a formal backup/restore or archive feature.
- Failed outputs can be regenerated from saved project/storyboard inputs.
- Define a basic cleanup policy for temporary scene audio and abandoned render attempts so experimental outputs do not accumulate indefinitely.

## 8. Instagram publish pipeline

1. User chooses Publish.
2. Verify the current user owns project, artifact, and social connection.
3. Ensure the selected artifact matches the user’s chosen aspect ratio.
4. Create a temporary R2 GET URL and Meta media container.
5. Poll processing status with bounded backoff.
6. Publish after Meta reports the container is ready.
7. Persist confirmation and returned media URL.
8. On timeout, query known container/publish status before retrying.
9. Preserve MP4 and post description after every failure.

Only request the publishing permission required for the chosen Meta login path. App credentials remain server-side. Team/test accounts must be authorized by Meta’s development-mode roles; verify current review requirements before wider use.

## 9. Failure handling matrix

| Failure | Recovery |
|---|---|
| Storyboard invalid | One bounded schema repair, then preserve inputs and ask user to retry |
| Voice provider timeout | Retry affected scene; retain successful scene audio |
| Unsupported pronunciation | Add project-scoped pronunciation override and regenerate only affected narration |
| Alignment mismatch | Phrase-level fallback; if still invalid, scene-level captions or actionable failure |
| Render worker crash | Lease expiry/reclaim; resume from completed stage outputs where safe |
| FFmpeg/Remotion failure | Save sanitized stage error, retry boundedly, preserve storyboard |
| R2 upload failure | Retry upload from worker-local artifact; expire local temp after success/final failure |
| Output validation fails | Do not show as complete; explain stage and retry/regenerate |
| User edits storyboard during render | Finish the pinned version and label it; new version gets new job |
| Meta rejects media | Keep output downloadable; show Meta error and recovery suggestion |
| Uncertain publish outcome | Query container/media status before another publish request |

## 10. Observability and internal spend

Billing is out of product scope, but internal measurement is required even in a private test:
- provider, model, voice ID, request ID, and stage duration;
- model/TTS/render attempts and failure codes;
- rendered seconds, output size, worker CPU/memory/runtime;
- internal cost estimate per pipeline run where providers expose usage.

Do not log API keys, OAuth tokens, full source documents, or raw private user media. Basic account/job rate limits and an operator kill switch protect an open-signup test from accidental runaway calls; these are operational safeguards, not a billing feature.

## 11. Prototype plan

### Current local renderer status

The prototype under prototype/ has both a local FFmpeg demo path and a provider-backed path. The local system speech command can return zero-length audio and use an estimated timing track; the provider-backed path has generated narrated videos with ElevenLabs scene audio and returned character timing grouped into phrase captions. Visuals are procedural FFmpeg compositions, not Remotion. These runs validate the core media path, not production dashboard isolation, job durability, or Meta publishing.

### Prototype 1 — provider-backed vertical slice

Goal: generate one real video using the intended providers.

Steps:
1. Configure Gemini and ElevenLabs keys securely in local environment variables; never commit them.
2. Run Gemini 3.8 Flash on the pressure-cooker prompt and validate returned schema.
3. Generate two or three Indian English voice samples using selected ElevenLabs voice IDs.
4. Select the best narration voice for the representative topic.
5. Generate narration by scene; save audio and actual durations.
6. Obtain provider timestamps or align the audio against the approved transcript.
7. Render minimal motion scenes and phrase captions in Remotion.
8. Produce 9:16 MP4 and inspect frames and audio.
9. Record duration, failures, latency, estimated provider/render cost, and voice selection.

### Prototype 2 — format and regeneration

1. Render the same approved storyboard in 1:1 and 16:9.
2. Request a scene revision and verify only the affected scene is rebuilt where possible.
3. Simulate TTS, render, and storage errors; confirm retry and saved storyboard behavior.
4. Confirm captions and visual labels remain within safe areas.

### Prototype 3 — Meta test publish

1. Configure Meta developer app and callback URL.
2. Use a professional test Instagram account authorized for the app.
3. Connect with OAuth, publish the validated video, and verify status/link.
4. Test expired/revoked permission and ambiguous timeout behavior.
5. Keep download usable if publishing is unavailable.

## 12. Prototype acceptance criteria

Provider-backed vertical slice is complete when:
- the final file has audible English narration;
- video duration is measured from audio and is 60–90 seconds;
- captions are aligned to actual narration using word timing or validated phrase timing;
- animated elements explain each scene and do not cover captions;
- MP4 metadata matches 9:16, 1080x1920, 30 fps, H.264/AAC;
- output can be regenerated from the saved storyboard;
- the team has reviewed voice naturalness, caption legibility, and educational clarity;
- provider usage and internal per-video cost are recorded for engineering planning.

## 13. Decisions still open

- Which two or three Indian English voice IDs sound best to the team.
- Whether Eleven v4 or Gemini 3.8 Flash TTS gives the desired voice consistency and accent quality.
- Which word/phrase alignment path has reliable timing on the selected voice.
- Where to host the long-running render container.
- Use a managed queue for durable delivery; recommended SQS Standard with a DLQ, MongoDB as canonical job state, and a transactional outbox. Confirm AWS dependency or choose an equivalent before implementation.
- Which Meta login flow/permissions are accepted for the target accounts and app access tier.
- Exact supported media-file limits and cleanup windows.

## 14. Provider and platform references

- [Gemini API models](https://ai.google.dev/gemini-api/docs/models)
- [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output)
- [Gemini TTS generation](https://ai.google.dev/gemini-api/docs/speech-generation)
- [ElevenLabs model selection](https://elevenlabs.io/docs/eleven-api/choosing-the-right-model)
- [ElevenLabs accent guidance](https://elevenlabs.io/docs/help-center/troubleshooting/why-does-my-voice-change-accent-or-language)
- [Remotion licensing and pricing](https://www.remotion.dev/docs/license/pricing)
- [Vercel function limits](https://vercel.com/docs/functions/limitations)
- [Meta Instagram API documentation](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-3fe78620-2258-44b6-893f-42d76c7200d7)
