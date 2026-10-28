# System Design — VidyaMotion

**Status:** Proposed implementation design for V1 internal testing  
**Product name:** VidyaMotion (provisional)  
**Last updated:** October 28, 2026  
**Related documents:** [PRD.md](PRD.md) · [API_DESIGN.md](API_DESIGN.md) · [DATABASE_DESIGN.md](DATABASE_DESIGN.md) · [PIPELINE_DESIGN.md](PIPELINE_DESIGN.md) · [prototype/README.md](prototype/README.md)

## 1. Purpose

Translate the approved PRD into an implementable technical design for the dashboard and asynchronous video pipeline. A local provider-backed media prototype already exists; this document distinguishes it from the production system that remains to be built.

## 2. Design goals

- Keep the creator workflow simple while running generation asynchronously.
- Isolate every user's projects, media, and Instagram connection.
- Let actual narration duration drive the video timeline and captions.
- Keep rendering out of a Vercel request handler.
- Keep AI and media providers replaceable.
- Support retry or regeneration from saved project/storyboard inputs.
- Use minimal infrastructure for early multi-user testing.

## 3. Architecture overview

Creator browser → Vercel Next.js app/API → Clerk identity  
Vercel API ↔ MongoDB Atlas projects/storyboards/render jobs  
Browser ↔ Cloudflare R2 using short-lived signed upload/download URLs  
Vercel API → Gemini API for ideas, scripts, storyboards, and revisions  
Render worker ↔ MongoDB for job claiming and progress  
Render worker → ElevenLabs TTS and optional alignment provider  
Render worker → Remotion + FFmpeg → Cloudflare R2  
Creator → Meta OAuth via app → Meta Instagram API → R2 temporary media URL

### Runtime boundaries

**Vercel / Next.js:** UI, authentication callbacks, project CRUD, short AI requests, signed R2 URL issuance, Meta OAuth callbacks, and job submission. It returns immediately after recording a render job; it does not render synchronously.

**MongoDB Atlas:** canonical state for user-owned projects, storyboard versions, render jobs, social connections, publish attempts, and transactional outbox events. A managed queue delivers job IDs to workers; MongoDB remains the source of truth.

**Node.js render worker:** separate long-running container with Chromium/FFmpeg. It consumes queue messages, atomically claims canonical jobs in MongoDB, calls TTS/alignment, renders Remotion compositions, validates output, and uploads artifacts.

**Cloudflare R2:** private storage for source uploads, audio, thumbnails, and MP4s. Browser operations use short-lived signed URLs after server-side ownership checks. Meta gets a temporary signed GET URL valid long enough to fetch the video.

Recommended queue: SQS Standard plus a dead-letter queue, behind an adapter. This adds AWS to the stack and should be confirmed before implementation. The worker host remains to be selected; Vercel remains the web host.

## 4. Authentication and tenant isolation

Use Clerk for the first app iteration: self-service signup/sign-in and an authenticated user ID. Auth.js with a supported login provider is a fallback if managed-service dependency or cost is not suitable.

Every project-scoped request must verify the session and that the resource belongs to that user. Apply ownership checks to reads, updates, deletes, storyboard versions, render jobs, signed R2 URLs, social connections, and publish operations. Never trust an owner ID provided by the browser.

R2 object keys can be namespaced by owner and project IDs, but the key path is not authorization. URL issuance must still verify ownership. V1 has no shared workspace or shared Instagram account.

## 5. Data model

- **User:** identity provider ID, account state, timestamps.
- **Project:** owner ID, title, topic, conversation state, current storyboard version, selected output format, status, timestamps.
- **SourceAsset:** owner/project IDs, type, R2 key, upload/extraction state, file size.
- **StoryboardVersion:** owner/project IDs, version, narration, ordered scene array, source notes, revision summary, model metadata, approval state.
- **RenderJob:** owner/project/storyboard IDs, output ratio, job/stage status, attempts, worker lease, sanitized error, timestamps.
- **RenderArtifact:** owner/project/job IDs, ratio, duration, dimensions, codecs, R2 keys, validation result.
- **SocialConnection:** owner ID, Meta account ID/name, encrypted token, scopes, expiry, status.
- **PublishAttempt:** owner/project/artifact/connection IDs, post caption, Meta IDs, idempotency key, status, error, published URL/time.

V1 does not add formal archive, backup, or restore features. Saved project/storyboard inputs are sufficient to retry or regenerate a failed output.

## 6. Generation pipeline

### Storyboard

1. Authenticate and create/update the project.
2. Send topic, conversation, and optional extracted source text to the model.
3. Generate schema-constrained English scene data.
4. Validate fields and limits; make one bounded repair attempt if malformed.
5. Save a new storyboard version owned by the authenticated user.
6. Return it for creator review.

Initial model candidate: stable Gemini 3.8 Flash for idea planning, structured storyboard generation, and revisions. Validate structured output and Indian educational examples before locking it.

Each scene has a stable ID/order, title, narration, visual intent, allowed motion primitive, labels/data, transition, source notes, and estimated (non-authoritative) timing. Never execute model-generated code. The model selects from controlled primitives such as hook, concept diagram, comparison, process steps, simple chart, and takeaway.

### Render job

1. User approves a storyboard and submits a render.
2. API inserts a queued job and returns the job ID.
3. Worker claims it atomically with a time-limited lease.
4. Generate narration in scene-aligned segments.
5. Measure actual audio durations and align words/phrases.
6. Map scene data to Remotion compositions.
7. Render and normalize media with FFmpeg.
8. Validate readability, audio/video streams, duration, ratio, dimensions, and codecs.
9. Upload artifacts and mark job complete.
10. UI polls job status initially; add server-sent events only if polling becomes a problem.

Actual audio duration is the timeline source. Captions use provider timestamps when available and phrase-level fallback otherwise. If the audio is outside 60–90 seconds, offer shortening/expansion before final render; do not silently speed up or cut narration.

### Retry

- Bounded retry with backoff for transient provider/network errors.
- Persist sanitized failure code and stage, not secrets/raw provider dumps.
- Worker leases expire so a crashed job can be reclaimed where safe.
- Make artifact writes idempotent by job and attempt ID.
- User regeneration creates a new job and preserves the approved storyboard.
- No formal backup or artifact restore in V1.

## 7. Visual system and formats

**Default art direction:** minimal educational infographic animation; neutral background, one or two accent colors, simple icons/vector illustrations, diagrams, labels, arrows, comparisons, processes, simple charts, and purposeful movement. Large type is reserved for key terms. Avoid decorative overlays, clutter, and random stock footage.

Use vetted Remotion components selected by constrained scene data. Do not render arbitrary model-generated React/JavaScript.

**Aspect ratios:** Instagram vertical 9:16 default, with square 1:1 and landscape 16:9 variants. Keep important labels and diagrams in safe areas. The creator can change format in preview/export without choosing it during idea entry.

**Captions:** burn into MP4. Default to phrase-sized groups; word highlighting is optional if readable. Keep format-aware safe areas and avoid obscuring diagram labels. Validate contrast, line wrapping, size, and timing.

## 8. Voice provider

Evaluate ElevenLabs first, using Eleven v4 as the narration candidate. Audition two or three specific Indian English voice IDs with representative scripts; provide male and female previews. Accent quality depends on the selected voice, not just the model. Compare against Gemini 3.8 Flash TTS for regional accent fidelity. V1 language remains English. Keep provider and voice IDs configurable.

## 9. Instagram authorization

Add a Connect Instagram button using Meta OAuth. Each creator authorizes their own eligible professional account. Never ask for passwords or pasted user tokens. Store Meta App ID/secret only in server-side environment secrets.

For development, use permitted app roles/testers and a professional test account. Before serving accounts outside app roles, verify current Meta login flow, scopes, account eligibility, App Review, and access requirements in Meta's developer dashboard.

Publishing flow:
1. Verify signed-in user owns both project and social connection.
2. Create temporary R2 GET URL and Meta media container.
3. Poll status with bounded backoff.
4. Publish only when ready.
5. Save confirmed outcome and post URL.
6. Preserve project/render on failures.

After ambiguous timeout, query status before resubmitting to reduce duplicate posts.

## 10. Initial API boundaries

- Project create/read/update/delete: authenticated owner only.
- Brainstorm: continue idea conversation for an owned project.
- Storyboard generate/revise: create versioned structured data.
- Render create/status/retry: enqueue and inspect owned background jobs.
- Download: issue short-lived authorized R2 URL.
- Instagram connect/callback: bind OAuth connection to current user.
- Publish: create an owned publish attempt for the user's connected account.

All routes derive identity from the authenticated session. Request bodies cannot choose the owner.

## 11. Infrastructure and secrets

- **App:** Next.js/TypeScript on Vercel.
- **Authentication:** Clerk; Auth.js fallback.
- **Database:** MongoDB Atlas.
- **Object storage:** Cloudflare R2, private objects, short-lived signed URLs.
- **Rendering:** separate Node.js container with Remotion and FFmpeg.
- **Queue:** recommended SQS Standard + DLQ; MongoDB RenderJob remains canonical state and workers claim it atomically.
- **AI:** Gemini API for script/storyboard/revisions.
- **Voice:** ElevenLabs first candidate; compare Gemini TTS.
- **Publishing:** Meta OAuth/Instagram API.

Server-only secrets: model keys, Meta app credentials, Mongo connection string, R2 credentials, Clerk keys, and worker authentication. Never expose them through public client variables or logs. The worker gets only required permissions.

The provider-backed prototype has run using local credentials that are not included in source control. Never place secrets or voice-account credentials in this document. See the prototype README for the local setup guidance.

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Vague or unsupported educational claims | Constrained scene schema, source notes, storyboard approval |
| Indian English accent varies by voice | Compare voice samples on Indian names, terms, and units |
| Caption drift | Audio-first timing, word timestamps or phrase fallback, inspect output |
| Rendering unsuitable on Vercel | Dedicated container worker |
| Self-signup creates abuse/provider spend | Basic signup/job rate limiting and admin pause controls; no user billing page |
| Meta permissions or review blocks publishing | Test with a professional account early; export remains available |
| Cross-user project leakage | Owner checks at every API, storage-signing, and publish boundary |

## 13. Prototype status

A local provider-backed media prototype exists and has generated sample educational videos. It uses Python standard-library orchestration, Gemini structured storyboard generation, ElevenLabs scene-level narration with returned character timing, and FFmpeg/FFprobe. Its renderer creates procedural motion graphics using hand-coded scene types and burns phrase captions into MP4. It does not use Remotion and is not the production dashboard.

The prototype validates the basic provider-to-render path and provides concrete audio/visual examples. It does not implement Next.js, Clerk, MongoDB, R2, a managed queue, a production Node worker, Vercel deployment, or Meta OAuth/publishing. Some topic visuals are currently hard-coded; production needs a reusable allowlisted component registry. Some local fallback/demo paths use estimated caption timing; the provider-backed path groups returned character timing into phrase cues.

## 14. Implementation sequence

1. Build and review the local video pipeline spike.
2. Compare storyboard model and voice options; lock initial providers.
3. Verify Meta OAuth/publishing with a professional test account.
4. Build Next.js, Clerk, account-isolated MongoDB projects, and R2 media access.
5. Add storyboard/revision APIs.
6. Add render-job records and the dedicated worker.
7. Add preview/export and then Instagram connect/publish.
8. Before broader self-service use, validate isolation, abuse controls, privacy terms, provider costs, and Meta permissions.

## 15. References

- [Gemini API models](https://ai.google.dev/gemini-api/docs/models)
- [Gemini TTS](https://ai.google.dev/gemini-api/docs/speech-generation)
- [ElevenLabs model guidance](https://elevenlabs.io/docs/eleven-api/choosing-the-right-model)
- [ElevenLabs accent guidance](https://elevenlabs.io/docs/help-center/troubleshooting/why-does-my-voice-change-accent-or-language)
- [Remotion licensing](https://www.remotion.dev/docs/license/pricing)
- [MongoDB with Next.js](https://www.mongodb.com/docs/drivers/node-frameworks/next-integration/)
- [Vercel function limits](https://vercel.com/docs/functions/limitations)
- [Meta Instagram API](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-3fe78620-2258-44b6-893f-42d76c7200d7)



## 16. Dashboard API contracts

The creator sees four stages: Idea, Storyboard, Generate, Publish. Backend stages remain internal progress. Every Route Handler or Server Action authenticates, validates input, authorizes the resource, and delegates to shared domain services. Suggested API surface under /api/v1:

| Routes | Purpose |
|---|---|
| POST/GET /projects | Create and list the signed-in user's projects |
| GET/PATCH/DELETE /projects/:id | Read/update/delete an owned project |
| POST /projects/:id/brainstorm | Optional idea conversation |
| POST /projects/:id/storyboards | Generate combined script/storyboard |
| POST /projects/:id/storyboards/:version/revisions | Create a conversationally revised version |
| POST /projects/:id/storyboards/:version/approve | Approve an immutable version |
| POST /projects/:id/uploads/presign, /finalize | Authorize and confirm source upload |
| POST/GET /projects/:id/render-jobs | Create job and read status |
| POST /projects/:id/render-jobs/:jobId/retry | Retry with saved approved inputs |
| POST /artifacts/:id/download-url | Issue temporary download URL |
| GET /integrations/instagram/connect, /callback | Start/complete user-bound OAuth |
| POST/GET /projects/:id/publish-attempts | Publish-now and inspect its status |

Mutations that can be retried accept an idempotency key. Return stable errors such as AUTH_REQUIRED, NOT_FOUND, VALIDATION_ERROR, STORYBOARD_NOT_APPROVED, DURATION_OUT_OF_RANGE, PROVIDER_TEMPORARY_FAILURE, CONNECTION_REAUTH_REQUIRED, PUBLISH_NOT_ELIGIBLE, and RATE_LIMITED. Never return raw provider errors, signed URLs, secrets, or stack traces.

Autosave is debounced and shows saving/saved/error state. Use version or ETag checks to reject stale writes. On network failure, keep local unsent edits and offer retry. Poll active jobs every few seconds, with backoff while the page is hidden. Closing the browser does not cancel a job.

## 17. Consistency and failure handling

- Each generation or revision creates an append-only storyboard version. A render pins one approved version, format, voice, and pipeline configuration snapshot.
- Changes during rendering create a later version; they never mutate the active job input. Keep the previous successful artifact available if a new render is running or fails.
- MongoDB is canonical state; a managed queue carries job IDs. Create RenderJob and outbox event in a Mongo transaction. An outbox relay may publish twice after a crash; atomic worker claims and idempotency prevent duplicate effects.
- SQS Standard is at-least-once delivery. The worker atomically claims a job with a lease, renews the lease and queue visibility while running, checkpoints completed scene assets, and writes artifacts under attempt-specific keys. Repeated failures go to a DLQ for operator review.
- Retry transient provider/network errors with bounded exponential backoff and jitter. Schema-invalid AI output gets at most one repair. Retry one failed TTS scene only when safe. User regeneration creates a new job; prior artifacts remain immutable.
- If narration falls outside 60–90 seconds, mark needs_revision. Never time-stretch, truncate, or silently rewrite narration.
- If Meta times out after a possible publish, query the container/post state before creating another publish side effect.
- If R2 upload succeeds but the database commit fails, reconcile the attempt-scoped object or clean it as an orphan. Never expose an unvalidated output.
- Deletion first marks the project for deletion/cancellation, then performs retryable record/object cleanup. Define retention before enabling source uploads.
- If multiple tabs edit stale data, reject the stale version and let the creator reload/reapply.

| Condition | Expected result |
|---|---|
| Duplicate render request or queue delivery | Return/claim existing job; no duplicate artifact |
| Worker crash or expired lease | Reconcile checkpoints and resume safe stage |
| Invalid storyboard or unsupported visual primitive | Reject; bounded schema repair; no executable model output |
| Alignment text/timing mismatch | Re-align, fall back to phrase captions, or fail actionably |
| Expired R2 URL | Reissue only after new ownership check |
| Expired/revoked Meta token | Preserve artifact; ask creator to reconnect |
| Invalid or hostile source upload | Check actual type/size; parse in resource-limited worker; reject |
| Database/queue/provider outage | Persist state, retry boundedly, alert on backlog; never show false success |

Formal backup/restore is out of scope, but retention/deletion and cleanup retries still need explicit behavior. Regeneration is not a substitute for preserving user-approved project inputs.

## 18. Security and privacy

- Verify Clerk identity server-side. Every resource lookup filters by both resource ID and ownerId; do not accept ownerId from the browser. Return not-found for another user's ID.
- Object-key prefixes are not authorization. Check ownership before every upload/download URL, job, and publish operation.
- Protect OAuth using one-time state/nonce tied to the signed-in user and exact redirect URI. Encrypt Meta tokens at rest; limit token decryption to the publishing service.
- Use TLS, secure cookies, CSRF/origin validation for cookie-authenticated mutations, and restrictive CSP.
- Keep Gemini, ElevenLabs, Clerk, MongoDB, R2, queue, and Meta secrets in server-side secret storage; separate environments and rotate exposed keys.
- Treat R2 signed URLs as bearer tokens: short expiry, restricted method/object, limited CORS origins, and no query-string logging.
- Validate actual upload type/signature and size, not only browser Content-Type. Treat source text as untrusted reference material. Never execute model-generated code or fetch arbitrary model-supplied URLs.
- Redact prompts/source text, access tokens, API keys, raw provider bodies, and signed URLs from logs.
- Add internal rate/concurrency limits and provider pause controls even without user billing or quotas.

## 19. Operations, monitoring, and pilot targets

Each web request and worker run carries a correlation ID and internal user/project/job identifiers. Log state transitions, provider/model, voice preset alias, stage duration, retry count, validation summary, and publish result without logging raw source content.

Monitor storyboard success/latency, queue age/depth, outbox lag, worker heartbeats and expired leases, retries/DLQ, render duration and memory, media validation failures, provider errors and estimated internal spend, Meta publish states, R2 failures, and orphan cleanup. Alert on sustained backlog, worker crash loops, DLQ growth, stuck publish attempts, unusual spend, and cleanup failure. Provide an audited operator replay path.

Initial pilot targets, to be measured rather than promised as SLAs:

- Common dashboard reads/writes p95 under two seconds, excluding provider work.
- Render submission returns after durable job/outbox commit, target under two seconds.
- Active job updates appear within about five seconds via polling.
- Every accepted job reaches completed, needs-revision, canceled, or actionable failure.
- Every completed artifact passes decode, stream, duration, dimensions, ratio, audio, and caption validation.
- Authorization checks show no cross-user access.
- Do not state a render-completion SLA before measuring representative throughput.

Before internal rollout, test authorization and cross-tenant isolation, outbox dispatch, duplicate messages, lease recovery, signed URLs, OAuth state, all three output ratios, provider timeouts, worker termination, R2 interruption, and publish timeout-after-side-effect. A successful local MP4 does not validate the dashboard or Meta pipeline.

## 20. Technical decisions still open

The PRD's product decisions are treated as approved. Confirm these engineering recommendations before implementing the affected integration:

1. Render-worker container host and CPU/memory/disk profile.
2. Whether to accept AWS SQS Standard + DLQ as an additional dependency, or choose another managed queue behind the queue interface.
3. The two or three final Indian English voices after same-script auditions.
4. Gemini model ID after quality, schema reliability, latency, and internal spend evaluation.
5. Current Meta login product, eligible account type, scopes, review, and token lifecycle.
6. Accepted source upload types, size limits, retention, and deletion behavior.

## 21. Official technical references

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication)
- [Clerk Next.js App Router authentication](https://clerk.com/docs/reference/nextjs/app-router/auth)
- [MongoDB transactions](https://www.mongodb.com/docs/manual/core/transactions/)
- [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Cloudflare R2 browser uploads](https://developers.cloudflare.com/r2/objects/upload-objects/)
- [Amazon SQS visibility timeout and DLQ behavior](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html)
- [Vercel Function limits](https://vercel.com/docs/functions/limitations)
- [Remotion rendering](https://www.remotion.dev/docs/render)
- [Meta Instagram API](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-3fe78620-2258-44b6-893f-42d76c7200d7)
