# Product Requirements Document

**Product:** VidyaMotion (provisional working title; name availability not checked)  
**Status:** Draft for product and engineering review  
**Version:** 1.0  
**Last updated:** October 26, 2026

## 1. Summary

Help educators, subject matter experts, and creators turn an educational idea into a short animated explainer. A creator enters a topic and may brainstorm with AI. The system generates a combined script and scene-by-scene storyboard, then produces motion graphics, narration, and synchronized on-video captions. The creator reviews, requests conversational changes, previews, and downloads or publishes to Instagram.

The experience is a guided workflow, not a professional editing suite. AI handles production; the creator reviews the storyboard before rendering and revises in natural language rather than using a timeline.

**Product promise:** From an idea to a clear, narrated, animated explainer video in a few simple steps.

### Agreed decisions

- Working name: VidyaMotion, provisional until the owner confirms it and checks availability.
- V1 is an English-language educational explainer product for Indian audiences.
- Encourage Indian-relevant examples, familiar units, and context where suitable; do not assume every topic needs India-specific framing.
- Default target narration length is 60–90 seconds, with no duration presets. A creator may ask for a shorter or longer version conversationally.
- Default export is Instagram vertical (9:16); square (1:1) and landscape (16:9) are available as alternate output formats.
- Generate motion graphics, narration, and synchronized on-video captions.
- Generate and review script and storyboard together.
- Include conversational revisions, preview, export, autosave, and Instagram publish-now.
- Offer two or three previewable Indian English voice presets, including male and female options, after auditioning provider voices.
- Use a minimal explanatory visual style: icons, diagrams, simple illustrations, and purposeful motion; avoid random decoration and overlays.
- Users self-register and each gets an individual workspace, project list, and personal Instagram connection. Users cannot access each other’s projects or connected accounts.
- No shared Instagram account, shared workspace, or team collaboration in V1.
- No brand kit or branding setup in V1.
- Defer user-facing usage metering, billing, subscriptions, API-cost dashboards, scheduling, teams, and other social platforms.
- No formal backup/restore or long-term archive feature in V1. Autosaved project inputs remain the source for retrying or regenerating a failed/lost output.


## 2. Problem and opportunity

Short educational video production requires idea development, scripting, scene planning, voice recording, animation, captions, export, and publishing. Many creators lack the time or editing skills to complete these steps.

The product combines that work while giving the creator control at two checkpoints: storyboard review before rendering and video preview before export or publishing. Its differentiation is an educational workflow with editable motion graphics and reliable scene-to-voice synchronization, not ownership of a foundational video model.

## 3. Goals and non-goals

### V1 goals

1. Let a creator self-register and receive an isolated personal workspace.
2. Start from a rough topic and optionally brainstorm with AI.
3. Generate educational script and storyboard together in one action.
4. Review and revise narration and scene visuals conversationally.
5. Produce explanatory motion graphics, voiceover, and synchronized captions.
6. Autosave project inputs and recover from transient failures by retrying or regenerating.
7. Preview and download the finished video in vertical, square, or landscape format.
8. Let each creator connect their own eligible Instagram account and publish a finished video.
9. Keep the workflow usable without video-editing knowledge.


### V1 non-goals

- Billing, subscriptions, usage meters, credit balances, or cost dashboards.
- Team workspaces, collaboration, or organization approval.
- Multitrack timeline editing, manual keyframing, or a professional editor.
- Avatars, face generation, lip sync, or talking-head video.
- Brand kits, logos, custom fonts, or brand colors.
- Post scheduling, calendar, analytics, or non-Instagram publishing.
- Guaranteed virality, engagement, or factual correctness without review.
- Generating every frame as photorealistic AI footage.
- A commercial promise of unlimited generation. Costs still exist internally even when metering is not shown.

## 4. Users and jobs

**Primary — educator/educational creator:** “Help me explain this topic clearly in a short video without writing a full production script or animating it myself.”

**Secondary — subject matter expert:** “Turn what I know into a visual explanation, and let me correct anything that does not represent my idea.”

**Secondary — emerging creator:** “Help me turn a thought into a finished educational video I can share.”

Large media teams needing high-volume batch production, extensive brand governance, and a professional editor are not the initial target.

## 5. Product principles

- AI performs production work; users do not orchestrate separate tools for script, scenes, voice, captions, and animation.
- Review the storyboard before full rendering.
- Conversation is the primary revision method.
- Show narration and visual plan together.
- Timing follows the generated narration.
- Save meaningful changes automatically.
- Use sensible defaults and avoid unnecessary setup.
- Distinguish video generation completion from publishing success.
- Every failure state provides a useful recovery action.

## 6. Main workflow

The dashboard has one prominent create action and a project list. The creator-facing flow has four stages:

1. **Idea and brainstorm**
2. **Script and storyboard review**
3. **Generate and preview video**
4. **Export or publish**

Flow: Dashboard → New video → Enter topic/brainstorm → Generate script and storyboard → Review/revise → Generate video → Preview/revise → Download or publish to Instagram.

Internal processing may have more steps, but these appear as concise progress updates, not additional user decisions. The user can leave and return at any stage.

## 7. User flows and requirements

### 7.1 Sign-up, sign-in, and personal dashboard

1. A person can create an account through self-service sign-up and later sign in.
2. Each account receives its own dashboard and personal workspace.
3. Projects, brainstorms, source files, generated media, and social connections are owned by that account.
4. Instagram connection is optional until that creator chooses to publish.
5. Dashboard explains the product and presents “Create an explainer.” An empty state includes an example topic.

Cards show title, topic, updated time, thumbnail, and status: Draft, Generating, Ready, Needs attention, or Failed. Failed projects remain visible with recovery actions.

**Isolation requirements:** Users must only see and operate on their own projects, source files, renders, and Instagram connection. There is no shared team workspace or shared account in V1. Account IDs must be checked on every application, database, media-download, and publishing operation.

**Acceptance:** Any person can self-register. Reopening their account restores their own saved projects. A different account cannot see, edit, download, publish, or delete those projects. Instagram is not required to start creating.


### 7.2 Idea input and brainstorming

1. User opens a project and enters a topic, question, rough thought, or brainstorming request in one conversational input.
2. User can brainstorm briefly with AI or skip straight to storyboard generation.
3. User may optionally add notes or a source document.
4. User selects one primary action to generate script and storyboard.
5. Create and autosave the project before long-running generation begins.

Keep brainstorming as a short conversation, not a wizard. State accepted source formats and upload limits before upload. User can remove sources before generation. Do not generate a generic video from an empty prompt. Treat uploaded content as reference, not instructions to the system. Generate English narration and prefer India-relevant analogies, examples, spelling, and units when appropriate to the topic and audience; avoid forcing local references where they do not help.

**Acceptance:** The user can start with a topic or brainstorm; optional source material is supported; prompt, conversation, and source references persist on navigation.

### 7.3 Combined script and storyboard generation

One action creates narration and a scene plan. Target 60–90 seconds of spoken narration. Do not use a fixed word count because voice, pace, and language vary. Validate actual duration after voice generation.

Each scene includes:

- Sequence and short title.
- Narration text.
- Visual explanation and motion-graphic plan.
- Optional on-screen labels, numbers, and short text.
- Motion/transition cue.
- Source references or factual notes when sources are provided or research is enabled.
- Estimated duration, marked as an estimate until measured narration exists.

The script appears in scene cards; it is not a separate stage.

Generation should use a clear opening, logical explanation, and concise takeaway without forcing a viral formula. Write for speech, avoid unexplained jargon, dense paragraphs, fabricated statistics, and unsupported claims. Prefer diagrams, comparisons, processes, charts, labeled objects, and kinetic text. If the topic is materially ambiguous, ask one concise clarification; otherwise make an assumption and show it. On schema failure, attempt bounded repair, preserve the prompt, and offer retry.

**Acceptance:** Script and storyboard appear together; every scene has narration and a concrete visual plan; estimated duration is 60–90 seconds or deviation is explained with a conversational correction; user reviews before rendering; storyboard persists as structured versioned data.

### 7.4 Storyboard review and conversational revisions

Show scene cards in order, with narration and visuals together. The user can approve, request changes in plain language, directly correct narration, restore a prior version, or regenerate after changing the central topic. Provide two or three voice previews for Indian English narration (including male and female options); the creator selects one voice for a render. The UI language and V1 script language remain English.

Examples: “Make this clearer for a 12-year-old,” “simplify scene 3,” “use a diagram instead of a chart,” “shorten the introduction.”

Revision rules:
- Preserve unaffected scenes for local edits.
- If pacing or teaching order changes, update dependent scenes and summarize what changed.
- Do not silently change factual meaning or approved source material.
- Serialize/queue concurrent requests; never silently discard a prompt.
- Create a new version for each applied change; support undo/restore.
- If script changes after rendering, mark the render as based on the older version and require a new render to reflect the edit.

**Acceptance:** Revisions act on the current saved version; changed scenes are identifiable; prior version can be restored; approval exposes one clear next action.

### 7.5 Video generation and progress

After approval, “Generate video” creates a background job. The job continues if the user navigates away.

Recommended pipeline:
1. Validate approved storyboard.
2. Generate narration, preferably as scene-aligned segments.
3. Measure actual audio and align scene timing.
4. Obtain word or phrase caption timestamps.
5. Build animation from approved visual directions and a controlled motion-primitive library.
6. Compose scenes, narration, captions, transitions, and any approved sound bed.
7. Render the chosen aspect ratio.
8. Validate the media, save artifact/thumbnail, and update project status.

Core output uses scene-based animation. Generative video may be an optional asset source after validation; it is not required for coherent, synchronized output.

Progress labels: Creating narration; Timing scenes and captions; Animating scenes; Rendering video; Checking video. Progress should be monotonic where feasible and must not imply unsupported precision. Queued jobs may be canceled; if an active render cannot be safely interrupted, explain that and preserve the project.

**Acceptance:** A successful job yields preview and download; narration, visuals, and captions are synchronized; output is validated for codec, duration, resolution, aspect ratio, and integrity; prior successful render survives later failure.

### 7.6 Narration and caption synchronization

Narration is generated from the approved script. Scene-level audio segments are preferred.

- Actual audio duration is the source of truth for total length.
- Scene boundaries derive from actual segment durations plus configurable transitions.
- Use word timestamps when reliable; phrase-level timing is the fallback.
- Attach animation events to spoken phrases/scene events, not guessed fixed seconds.
- Do not speed up or truncate speech to force target duration without approval.
- If audio falls outside 60–90 seconds, offer conversational shortening/expansion before final render.
- Burn captions into video by default in V1.
- Use readable phrase-sized groups; word highlighting is optional if clear.
- Maintain contrast, safe margins, and placement away from important visuals/platform interface areas.
- Caption text follows the script and can be revised through the script/conversation flow.
- If word alignment fails, use phrase timing if validation passes.

On-video subtitles are distinct from the Instagram post description. A separate downloadable subtitle file is out of scope for V1.

### 7.7 Preview and revisions

Completed video view includes player, play/pause, seek bar, and status. User can preview, download, request conversational changes, regenerate one scene when supported, regenerate all when timing changes, restore an earlier render, or choose another supported aspect ratio.

State clearly when an edit requires another render. Never replace the only successful render until its replacement completes.

### 7.8 Export

- One-click MP4 download.
- Use broadly compatible H.264 video/AAC audio, subject to current platform specs.
- Show aspect ratio and quality in export details.
- Download/storage failure offers retry without creating duplicate projects.
- Secure downloads to the project owner; refresh expired links only after authorization.

### 7.9 Instagram connect and publish

Each creator connects their own eligible Instagram professional account. A creator cannot publish to another user’s connection, and V1 has no shared account.

**Connect:** Explain account eligibility and that the creator authorizes the app through Meta. Use the official OAuth flow and request only required scopes. Show the connected account name and disconnect/reconnect controls. Keep Meta app credentials in server-side environment secrets; never ask creators to provide Instagram passwords or paste access tokens.

**Publish now:**
1. User selects “Publish to Instagram.”
2. Select that user’s connected account or connect it.
3. Show video and editable post description. Generated description is optional and distinct from on-video captions.
4. User confirms.
5. Create media container using a publicly accessible, short-lived media URL as Meta requires.
6. Poll container status with bounded backoff.
7. Publish only when ready.
8. Report success only after Meta confirms; show returned link where available.

Use vertical 9:16 as the default Instagram output. The user may render square or landscape variants where useful. V1 has publish-now only; scheduling is V2. During internal testing, add the team’s accounts as permitted app testers/roles. Access for people outside app roles may require Meta app review and additional access approval.

**Failure cases:** Unsupported/personal account explains eligibility; expired/revoked permissions request reconnect while preserving project; processing timeout retains pending state; rejected video gives actionable reason; rate limits/outages preserve project and offer retry; repeated clicks are blocked while outcome is unknown; disconnect during publish requires status check before reporting.


### 7.10 Autosave, retry, and regeneration

Autosave idea, conversation, source references, storyboard, and project state. Do not build a formal backup, restore, or long-term archive system in V1. Show saving/saved/save-failed status and preserve local input until the server confirms the save. Jobs run server-side and can be retried. If a generated output is lost or corrupted, offer regeneration from the saved project and storyboard. Keep failure messages actionable. Project deletion requires confirmation and removes that creator’s associated assets under the basic storage policy.


## 8. Functional requirements and priority

P0 = required V1; P1 = useful follow-up; V2 = deferred.

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Self-service registration, sign-in, and account-isolated dashboard/projects | P0 |
| FR-02 | Create from topic or brainstorm conversation | P0 |
| FR-03 | Optional notes/source document; prefer India-relevant examples for Indian audiences | P1 |
| FR-04 | Generate combined educational script/storyboard | P0 |
| FR-05 | 60–90 second target without presets; validate actual audio | P0 |
| FR-06 | Review storyboard before render | P0 |
| FR-07 | Conversational revisions and direct script correction | P0 |
| FR-08 | Version storyboard and restore prior version | P0 |
| FR-09 | Generate motion graphics, voiceover, synchronized captions | P0 |
| FR-10 | Phrase-level caption fallback | P0 |
| FR-11 | Async rendering, validation, persisted job state | P0 |
| FR-12 | Preview, download, retain successful prior renders | P0 |
| FR-13 | Instagram 9:16 default; 1:1 and 16:9 output variants | P0 |
| FR-14 | Each user connects their own eligible Instagram account through Meta OAuth | P0 |
| FR-15 | Publish now and report confirmed status | P0 |
| FR-16 | Autosave and expose save failures | P0 |
| FR-17 | Regenerate individual scene when supported | P1 |
| FR-18 | Editable AI-drafted Instagram description | P1 |
| FR-19 | Scheduled publishing | V2 |
| FR-20 | Billing/usage/cost views | V2 |
| FR-21 | Teams, collaboration, branding | V2 |
| FR-22 | Other platforms and analytics | V2 |

## 9. UX requirements

**Dashboard:** Primary “Create an explainer” action; each signed-in user sees only their own projects; cards with title/topic/time/thumbnail/status; simple status filters; failed jobs remain actionable. Self-service registration is enabled.

**Creation:** Compact topic/chat surface; one main storyboard-generation action; optional sources; no setup wizard, branding, or billing.

**Storyboard:** One card per scene; narration/visual together; prominent approval; conversation accessible; estimated timings distinguished from measured.

**Generation:** Persistent progress; jobs reopen from dashboard; explain failures and next action in plain language.

**Preview/publish:** Player is primary; export and publish are clear; each user’s Instagram connection is private to their account; vertical 9:16 is default with square/landscape variants available.

## 10. Educational, visual, and accessibility quality

- Use English and plain language for the stated audience, with India-relevant examples/context when appropriate; keep a logical explanation order.
- Avoid fake citations, made-up statistics, and unsupported claims.
- Use source material when supplied; identify claims not grounded in it.
- Never claim verification unless a defined verification step ran.
- Prompt lightweight factual review before publish.
- Use a minimal explanatory visual language: simple icons, diagrams, clear illustrations, comparisons, charts, timelines, processes, and purposeful kinetic text. Avoid random decoration, overlays, and clutter.
- Visuals explain narration; avoid random stock footage as default.
- Keep text legible and motion understandable; avoid flashing, strobing, excessive movement, tiny labels, clutter.
- Captions are on by default, contrast-safe, and inside safe margins.
- Do not rely on color/motion alone for meaning. Preserve clear audio.

## 11. AI/media architecture candidates

### Script/storyboard/revisions
Start with the stable Gemini 3.8 Flash model for idea brainstorming, structured storyboard generation, and conversational revisions. Keep the provider behind an application interface so models can change without rewriting project logic. Persist structured versions and keep API keys server-side. Compare output quality on representative Indian educational topics before locking the production configuration.

### Voice
Use ElevenLabs as the first TTS provider to evaluate. Start by auditioning the current Eleven v4 model for educational narration and select two or three suitable Indian English voice IDs, including male and female choices. Accent quality is voice-dependent, so do not assume the model alone guarantees an Indian English accent. Provide short audio previews in the dashboard. Compare samples against Gemini 3.8 Flash TTS, which documents regional accent support, before committing. Keep voice IDs configurable so the provider or voice can be changed without changing project data. Store scene-level audio and voice metadata per render. Hindi and other Indian languages are not in V1; English is the launch language.

### Animation/render
Remotion is a candidate for composition and MP4 rendering. Map constrained scene data to vetted React/SVG/canvas primitives; do not execute arbitrary model-generated code. Confirm license is suitable for organization size and SaaS use.

### Alignment
Prefer provider word timestamps when reliable; otherwise use an alignment/transcription service. Keep phrase-level fallback. Actual audio drives timing.

### Optional generated clips
Treat video models as optional sources of short scene assets. Validate price, duration, rights, content policy, latency, and failure rates on educational examples. Do not make them the only animation route.

### Instagram
Use Meta’s official OAuth/API with a Connect Instagram button. Each user authorizes their own eligible professional account; the product stores and uses that user’s token only for their projects. Store app credentials server-side and never collect account passwords. Isolate publishing so creating/downloading works during Meta outages.

### Application platform and infrastructure
- **Web app/API:** Next.js with TypeScript on Vercel.
- **Authentication:** Clerk is the recommended fast path for self-service signup/sign-in and user identity. Use account ownership checks on every request. An alternative is Auth.js if minimizing managed services is more important than setup speed.
- **Database:** MongoDB Atlas for user-owned workspaces, projects, structured storyboard versions, render jobs, and publish attempts.
- **Media storage:** Cloudflare R2 for source uploads, narration, thumbnails, and final MP4s. Use private objects and short-lived signed URLs; only make a render publicly retrievable for the Meta publish window as needed.
- **Rendering:** A separate Node.js worker/container running Remotion and FFmpeg. Vercel hosts the app and API, but should not be the primary video-rendering runtime because browser-based rendering is resource intensive and long-running. The worker receives a render job and writes the result to R2.
- **Job handling:** For the first multi-user test, use a small managed job queue and a single render worker; keep retries bounded. Do not run a long render in the user’s browser request.
- **Per-user isolation:** Every project, source, render, and social connection has an owner user ID; server-side authorization checks are mandatory.

### Free experimentation
- Gemini AI Studio/API offers free-tier access for some text models; verify quotas and data-use terms.
- ElevenLabs free plan is suitable for voice evaluation; confirm API voice availability and commercial rights for selected tier.
- Remotion can be prototyped locally; verify license tier before production.
- Replicate lists models with limited free runs for comparisons.
- Runway API currently requires purchased credits and a minimum initial payment.
- Recheck all provider prices and trial terms at implementation time.

## 12. Data concepts and security

Entities: User; Project; SourceAsset; StoryboardVersion; RenderJob; RenderArtifact; SocialConnection; PublishAttempt.

Store ownership, source/prompt references, structured scene data, revisions, model metadata, job status, retries, media metadata, secure storage references, OAuth scopes/expiry, and publish outcome.

Rules:
- Enforce account ownership on every project/source/artifact request and URL; deny cross-user access.
- Encrypt social tokens/secrets at rest. Each user has their own SocialConnection records.
- Do not log secrets, full source documents, or unnecessary personal data.
- No formal backup/restore system or long-term archive is required in V1. Autosaved source project state enables retry/regeneration.
- Keep only the operational metadata needed to diagnose failures and support the active user workflow.
- Validate uploads, enforce size/type limits, and treat uploaded text as untrusted input.
- Apply basic signup and job-abuse protections even though billing and user-facing usage limits are deferred.

## 13. State models

**Project:** Draft; Generating storyboard; Storyboard ready; Rendering; Ready; Needs attention; Failed; Deleted.

**Render job:** Queued; Preparing narration; Aligning timing; Building scenes; Rendering; Validating; Completed; Retryable failure; Permanent failure; Canceled.

**Publish attempt:** Draft; Uploading/processing; Ready to publish; Publishing; Published; Retryable failure; Needs reconnection; Permanent failure.

A project can remain Ready if a later render fails but an earlier successful artifact exists. Status persists through refresh. Retries are bounded and idempotent where possible.

## 14. Edge cases and recovery

| Scenario | Required behavior |
|---|---|
| Empty/vague/contradictory topic | Ask one concise clarification if needed; otherwise state the assumption. |
| Malformed storyboard | Bounded schema repair; preserve input and offer retry. |
| Estimated or actual narration outside 60–90 sec | Offer conversational shortening/expansion before final render. |
| Unsupported language/voice | Explain options; preserve script/project. |
| TTS timeout/outage | Bounded retry; approved fallback only, disclose material voice change. |
| Word alignment unavailable | Phrase-level captions if validation passes. |
| Scene animation fails | Retry; then safe template fallback and flag substitution. |
| Renderer crash/worker restart | Resume idempotently or show recovery; preserve prior render. |
| Storyboard changes during render | Bind render to old version, label it, offer new render. |
| Concurrent revisions | Serialize/queue; never silently discard a prompt. |
| Autosave/network failure | Show unsaved state, retry, preserve local input. |
| Browser closes during render | Continue server job; show state on return. |
| Aspect ratio changed | Render new variant and retain old output. |
| Expired download URL | Refresh after authorization check. |
| Unsupported Instagram account | Explain eligibility; preserve prepared post. |
| Token expired/permission revoked | Request reconnection without losing media/post text. |
| Meta container stuck processing | Bounded polling; avoid duplicate submission. |
| Publish outcome unknown after timeout | Query status; do not blindly republish. |
| Instagram rejects video | Show actionable reason; keep download available. |
| Repeated publish clicks | Prevent duplicate requests while unresolved. |
| Account disconnected during publish | Determine outcome before reporting. |
| Unsupported/corrupt/oversized source | Reject early with format/limit guidance; preserve project. |
| Source contains model instructions | Treat as source content, never system instruction. |
| Project deleted during active job | Cancel if possible; prevent new artifacts attaching; clean up per policy. |
| Music unavailable | Complete video without music; it is not required. |

## 15. Non-functional requirements

**Reliability:** Long jobs run in background workers. Retries are bounded/idempotent. Preserve successful artifacts. Expose useful status.

**Privacy/security:** Secrets remain server-side; tokens encrypted; project ownership enforced; uploads validated; retention/deletion defined; review provider training/retention policies before production use of private source content.

**Performance:** Storyboard returns promptly or gives a clear wait state. Render does not block navigation. Dashboard thumbnail does not require loading full video.

**Accessibility:** Keyboard-accessible core actions, semantic labels, visible focus, readable captions, actionable errors.

**Observability:** Track stage, provider/model, retries, sanitized failures, validation, and publish results. Never log OAuth secrets/raw documents. Alert on material outages/backlogs.

## 16. Success measures

**Product:** projects reaching storyboard-ready; approved storyboards reaching validated render; renders downloaded/published; time to first preview; repeat creation; user feedback after preview.

**Quality/reliability:** render completion/retry rate; caption timing errors/fallbacks; share of videos within target; Instagram success and duplicate-post rate; full rewrite rate; reported factual/visual mismatch.

Do not optimize speed at the expense of educational clarity or synchronization.

## 17. Release plan

### Phase 0: prototype
- Evaluate Gemini 3.8 Flash on sample Indian educational topics, structured output, and revisions.
- Compare Eleven v4 Indian English voice samples with Gemini 3.8 Flash TTS; verify API/commercial terms.
- Build small Remotion primitive library and validate audio/caption timing.
- Render representative videos in supported aspect ratios.
- Estimate provider/render/storage costs internally.

### Phase 1: self-service creation MVP
Self-service authentication, strictly isolated user workspaces, autosaved project inputs, brainstorming, combined storyboard, review/revisions, English narration with Indian English voice presets, minimal animated explainers, captions, async render worker, preview, vertical/square/landscape export, and retry/regeneration.

### Phase 2: Instagram
Meta OAuth, account connection, publish-now, status/retry/reconnect, duplicate protection.

### Later
Scheduling, billing/usage display, teams, branding, more platforms, analytics, broader voice/language support, optional generated video assets based on validated demand.

## 18. Launch acceptance checklist

- Creator can go from topic to storyboard without editing expertise.
- Script and storyboard appear together before render.
- Conversational revisions work and versions can be restored.
- Valid output includes explanatory motion graphics, narration, and on-video captions.
- Timing follows actual audio with a fallback.
- Work autosaves and survives refresh/navigation.
- Creator previews/downloads a validated MP4 in supported aspect ratios.
- Eligible Instagram professional accounts can connect and publish with recovery paths.
- Failed new render/publish does not destroy prior successful video.
- Provider cost, licensing, privacy, and retention are reviewed for production setup.

## 19. Naming and unresolved validation

**VidyaMotion** is the current provisional working title, chosen to suggest Indian learning and animation. The product owner has not yet confirmed it as the final name. Trademark and domain availability have not been checked.

The technical recommendations are initial choices, not production guarantees. Voice naturalness, model structured-output reliability, rendering performance, API terms, Meta permission review, and per-video operating costs must be validated in the prototype.

## 20. Reference documentation

- [Gemini model list](https://ai.google.dev/gemini-api/docs/models) and [Gemini TTS](https://ai.google.dev/gemini-api/docs/speech-generation)
- [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)
- [ElevenLabs model selection](https://elevenlabs.io/docs/eleven-api/choosing-the-right-model) and [accent guidance](https://elevenlabs.io/docs/help-center/troubleshooting/why-does-my-voice-change-accent-or-language)
- [Remotion licensing and pricing](https://www.remotion.dev/docs/license/pricing)
- [Replicate limited free model runs](https://replicate.com/collections/try-for-free)
- [Runway API setup and credits](https://docs.dev.runwayml.com/guides/setup/)
- [Meta Instagram API documentation](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-3fe78620-2258-44b6-893f-42d76c7200d7)
- [MongoDB and Next.js](https://www.mongodb.com/docs/drivers/node-frameworks/next-integration/)
- [Vercel function limitations](https://vercel.com/docs/functions/limitations)
