
# API Design — VidyaMotion

**Status:** Proposed V1 contract for review  
**Updated:** October 29, 2026  
**References:** [PRD.md](PRD.md) · [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) · [PIPELINE_DESIGN.md](PIPELINE_DESIGN.md) · [DATABASE_DESIGN.md](DATABASE_DESIGN.md)

## 1. Purpose and status

This document defines the HTTP API used by the dashboard and provider callbacks. It is an implementation contract, not a deployed API or completed OpenAPI file. The reviewed contract should be encoded as OpenAPI 3.1.2 and stored with the application. OpenAPI is a language-neutral interface description; see the [official specification](https://spec.openapis.org/oas/v3.1).

The product-approved behaviors are self-service accounts, isolated personal workspaces, storyboard revisions/versioning, async rendering, video export, and publish-now to each user's own Instagram account. Queue vendor, provider models, final voices, Meta permissions, source upload limits, and some operational limits remain recommendations/open decisions.

Uppercase normative terms: MUST is required, SHOULD is recommended, MAY is optional.

## 2. API principles

- Base all app endpoints under /api/v1, over HTTPS, with JSON request/response bodies.
- Authenticate from the validated Clerk session. Never accept an owner ID from the browser.
- Authorize every resource against the session owner, including nested assets, jobs, artifacts, and social connections.
- Treat the API as a boundary: validate every request, validate provider results, and use public DTOs separate from Mongo documents/provider SDKs.
- Keep render work asynchronous. A request creates a durable job and returns; the worker updates status independently of the browser.
- Preserve immutable storyboard versions and pin every render to one approved version.
- Use idempotency for retryable mutations and version preconditions for edits.
- Never expose provider keys, Meta tokens, raw provider payloads, private object keys, signed URL query strings, stack traces, or internal cost details.
- Transfer media bytes directly to/from private R2 via short-lived signed URLs; do not proxy large files through the app API.

## 3. Headers and transport

**Media type:** application/json; charset=utf-8. **Time:** UTC RFC 3339 strings. **IDs:** opaque strings; clients must not infer Mongo ObjectId format.

| Header | Contract |
|---|---|
| Cookie | Clerk secure session for authenticated app endpoints |
| Content-Type | Required for JSON bodies; unsupported type returns 415 |
| Idempotency-Key | Required on retryable creates/publish; 16–128 printable characters |
| If-Match | Required on mutable project/message state where stale writes could lose edits |
| X-Request-Id | Optional input; server validates or replaces it, always returns one |

Responses include X-Request-Id and Cache-Control: no-store for personal data. Mutating cookie-authenticated requests require origin/CSRF validation. CORS is restricted to configured app origins; no wildcard credentialed CORS.

## 4. Authentication and resource authorization

Signup, verification, sign-in, and sign-out use Clerk UI. The API accepts no passwords. A minimal user profile may be created on the first authenticated request using Clerk's immutable subject as ownerId. Any Clerk webhook is signature-verified, replay-safe, and idempotent.

Each request follows: validate session → get ownerId from Clerk → validate input → resolve resource by both ID and ownerId → apply domain-state checks → perform operation. A resource owned by another account returns 404, not 403, to avoid enumeration.

| Operation | Authorization checks |
|---|---|
| Project, messages, storyboard | Parent project and child record belong to ownerId |
| Upload presign/finalize | Project and asset belong to owner; asset allows requested transition |
| Render/retry/status | Project, approved version, and job belong to same owner |
| Preview/download | Artifact is owned, validated, and available |
| Instagram | Connection, project, and artifact are owned by same user |
| Delete | Project owned; active jobs canceled best-effort; cleanup queued |

Internal operator functions use separate credentials and are not exposed as user routes.

## 5. Common response, errors, and status codes

Success envelope:

~~~json
{
  "data": {},
  "requestId": "req_01J...",
  "meta": {}
}
~~~

Error envelope:

~~~json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields need attention.",
    "requestId": "req_01J...",
    "retryable": false,
    "details": [{"field": "title", "reason": "too_long"}]
  }
}
~~~

Error messages are safe to display. Details never contain source text or provider internals.

| HTTP | Meaning | Example codes |
|---|---|---|
| 200 | Successful read/update | OK |
| 201 | Synchronous resource created | PROJECT_CREATED, STORYBOARD_CREATED |
| 202 | Durable async operation accepted | RENDER_ACCEPTED, PUBLISH_ACCEPTED, DELETE_ACCEPTED |
| 204 | Successful operation with no response body | DISCONNECTED |
| 400 | Malformed/invalid request or cursor | INVALID_REQUEST, INVALID_CURSOR |
| 401 | Missing/invalid session | AUTH_REQUIRED |
| 404 | Missing or not-owned resource | NOT_FOUND |
| 409 | State/idempotency conflict | CONFLICT, IDEMPOTENCY_KEY_REUSED, JOB_ALREADY_ACTIVE |
| 412 | Stale If-Match version | VERSION_MISMATCH |
| 413 / 415 | Request too large / wrong media type | PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE |
| 422 | Valid syntax, invalid domain state | STORYBOARD_NOT_APPROVED, DURATION_OUT_OF_RANGE |
| 429 | Rate/concurrency cap | RATE_LIMITED |
| 500 | Unexpected server fault | INTERNAL_ERROR |
| 502–504 | Upstream failure/timeout/unavailable | PROVIDER_UNAVAILABLE, UPSTREAM_TIMEOUT |

Use Retry-After for 429 and selected temporary failures. Do not return raw stack traces.

## 6. Pagination, filtering, concurrency

Collection endpoints use opaque cursor pagination, not offset. Default limit 20, min 1, max 50. Cursor encodes/binds the owner, sort tuple, and active filters; reject invalid/mismatched cursor with 400. Stable project order is updatedAt descending then id descending. Do not return total counts in V1. Each endpoint documents its allowlisted filters.

Response:

~~~json
{
  "data": [],
  "requestId": "req_...",
  "meta": {"nextCursor": "opaque...", "hasMore": true, "limit": 20}
}
~~~

Mutations that may overwrite creator work require If-Match/version. Stale writes return 412 and current version identifier. The client reloads/reapplies; the API never silently overwrites a newer version.

## 7. Idempotency and retry rules

For a retryable mutation, the server stores owner, operation scope, key, canonical request hash, resource/operation ID, response status, and expiry. Same key and same payload returns the original result. Same key and different payload returns 409 IDEMPOTENCY_KEY_REUSED. Concurrent requests with the same key converge on one operation. Keep records at least 24 hours. Mongo TTL cleanup is asynchronous, so application logic must honor expiry and avoid duplicate side effects even before cleanup.

Render/publish retries are domain-aware. An ambiguous Instagram response must be reconciled against known provider container/post state before any second publish call. Never blindly retry an operation with a possible external side effect.

## 8. Public resource shapes

### Project

~~~json
{
  "id": "prj_...",
  "title": "How binary search works",
  "topic": "Explain binary search simply",
  "status": "storyboard_ready",
  "currentStoryboardVersionId": "sbv_...",
  "latestArtifactId": null,
  "createdAt": "2026-10-29T09:30:00Z",
  "updatedAt": "2026-10-29T09:31:00Z"
}
~~~

Statuses: draft, generating_storyboard, storyboard_ready, rendering, ready, needs_attention, failed, deleted. It is a dashboard summary; individual render/publish resources are authoritative for their work.

### Storyboard version

~~~json
{
  "id": "sbv_...",
  "projectId": "prj_...",
  "version": 3,
  "parentVersionId": "sbv_...",
  "title": "How binary search works",
  "language": "en",
  "locale": "en-IN",
  "targetSeconds": {"min": 60, "max": 90},
  "scenes": [{
    "sceneId": "scene_01",
    "order": 1,
    "title": "Start with a sorted list",
    "narration": "Imagine looking for a number in a sorted list...",
    "visual": {
      "primitive": "comparison",
      "summary": "Highlight the middle value, then discard one half.",
      "labels": ["sorted list", "middle"],
      "elements": []
    },
    "transition": "continue",
    "sourceRefs": []
  }],
  "approval": {"status": "approved", "approvedAt": "2026-10-29T09:40:00Z"},
  "createdAt": "2026-10-29T09:35:00Z"
}
~~~

Visual primitives are server allowlisted; no executable scene code, arbitrary CSS, or external model-supplied URL is accepted. Narration is English; Indian examples are used when helpful.

### Render job and artifact

~~~json
{
  "id": "rnd_...",
  "projectId": "prj_...",
  "storyboardVersionId": "sbv_...",
  "aspectRatio": "9:16",
  "voicePresetId": "voice_indian_english_01",
  "status": "rendering",
  "stage": "building_scenes",
  "attempt": 1,
  "retryable": false,
  "createdAt": "2026-10-29T09:45:00Z",
  "updatedAt": "2026-10-29T09:48:00Z",
  "completedAt": null,
  "error": null
}
~~~

Artifacts expose ID, ratio, duration, dimensions, status, and timestamps. They never expose R2 keys. Preview/download endpoints return a temporary URL after rechecking ownership.

## 9. Endpoint catalog and payloads

### Projects

- POST /projects: create from topic. Body: { "topic": "...", "title": "optional" }. Topic 1–2000 chars; title 1–120. Save user input before model work. 201 returns project.
- GET /projects: cursor list; optional allowlisted status and query filters.
- GET /projects/{projectId}: summary and workflow pointers, not all nested resources.
- PATCH /projects/{projectId}: only title and user defaults (voice preset, output ratio); require If-Match. Never allow owner/status/current version fields.
- DELETE /projects/{projectId}: require confirmation/idempotency; 202 deletion state. Cancel active jobs best-effort and enqueue cleanup.

### Brainstorm messages

- GET /projects/{projectId}/messages: cursor-paginated project conversation; order and direction explicit.
- POST /projects/{projectId}/messages: body { "text": "...", "replyToMessageId": null }. Text 1–4000 chars. Save user message before AI call. For V1, assistant response is a bounded synchronous call and response 201 includes saved messages. If the provider fails, preserve the user message for retry. If measured latency exceeds web limits, add a durable generation-operation resource before implementation.

### Storyboard

- POST /projects/{projectId}/storyboards: body includes sourceMessageId, optional sourceAssetIds, locale en-IN, default targetSeconds {min:60,max:90}. Do not add duration preset controls. Validate all references and structured model output; bounded repair only. 201 returns newly persisted version. On failure, do not save a partial version.
- GET /projects/{projectId}/storyboards: cursor list, newest first.
- GET /projects/{projectId}/storyboards/{versionId}: one version and its scenes.
- POST /projects/{projectId}/storyboards/{versionId}/revisions: body { "instruction": "...", "baseVersion": 3 }. Instruction 1–2000 chars. Serialize revisions or return 409 REVISION_IN_PROGRESS. Response 201 gives new version, parent, changed scene IDs, and revision summary.
- POST /projects/{projectId}/storyboards/{versionId}/approve: no mutable scene body. Approves exact version; it becomes immutable.
- Restore prior version: POST /projects/{projectId}/storyboards/{versionId}/restore. Creates a new version copied from that prior version; approval is required again.

If actual narration is outside the 60–90 second target, preserve storyboard and offer conversational shortening/expansion. Do not time-stretch/truncate. Any shorter/longer user-requested target is an explicit conversational change and must be shown for approval.

### Voices

- GET /voice-presets: active public preset IDs, display/accent description, safe preview reference. Hide provider voice IDs.
- POST /voice-presets/{presetId}/preview: authenticated and rate-limited; use fixed server-controlled sample text. Return short-lived audio URL or stream.

### Source uploads (P1; disabled until policy is decided)

- POST /projects/{projectId}/uploads: metadata body filename/type/size/checksum; server generates random R2 key; 201 asset plus short-lived PUT URL.
- POST /projects/{projectId}/uploads/{assetId}/complete: verify object existence, actual size/type/checksum; mark uploaded or rejected.
- DELETE /projects/{projectId}/uploads/{assetId}: owned, idempotent delete. Never accept arbitrary storage key or media URL from browser.

### Render jobs and artifacts

- POST /projects/{projectId}/render-jobs: body { "storyboardVersionId": "sbv_...", "aspectRatio": "9:16", "voicePresetId": "voice_..." }. Validate same owner/project, approved version, active voice, ratio enum 9:16/1:1/16:9. Create job and outbox event in one Mongo transaction; return 202.
- GET /projects/{projectId}/render-jobs: cursor list, optional status.
- GET /projects/{projectId}/render-jobs/{jobId}: safe stage/status/error/retryability. Poll every 3–5s while visible, back off when hidden.
- POST /projects/{projectId}/render-jobs/{jobId}/cancel: queued cancel; active cancellation best-effort; return 202.
- POST /projects/{projectId}/render-jobs/{jobId}/retry: allowed only for retryable failure or after user action; new attempt/job; idempotency key required. Preserve earlier output.
- GET /projects/{projectId}/artifacts: cursor list, newest first.
- POST /artifacts/{artifactId}/download-url: 200 temporary signed GET URL, expiry, filename, content type; owner check each time.

Render request does not accept target duration, owner, R2 path, model ID, or raw voice ID from browser.

### Instagram

- GET /integrations/instagram/connection: connected state, safe account display info, scopes/status. Never tokens.
- GET /integrations/instagram/connect: authenticated navigation redirect; server creates one-time user-bound OAuth state/nonce.
- GET /integrations/instagram/callback: verify state/nonce, exchange code server-side, encrypt token, bind account to current user, prevent replay. Redirect to safe UI with status code.
- DELETE /integrations/instagram/connection: disconnect confirmed account and remove local token material; preserve past publish records.
- POST /projects/{projectId}/publish-attempts: body {artifactId, caption, connectionId}. Proposed caption max 2,200 chars, confirm against chosen Meta product. Verify artifact/project/connection same owner and artifact ready. Server creates temporary R2 URL; browser cannot supply URL. Create durable attempt; return 202.
- GET /projects/{projectId}/publish-attempts/{attemptId}: status, safe message, retryability, publishedAt, permalink only after provider confirmation.
- POST /projects/{projectId}/publish-attempts/{attemptId}/retry: only after known failure and provider state reconciliation. Unknown outcome returns 409 PUBLISH_OUTCOME_UNKNOWN.

Exact Meta login product, permissions/scopes, eligible account, review needs, media limits, caption limits, and token lifecycle must be verified against current Meta docs before implementation. Scheduling is not exposed in V1.

### Provider callbacks/webhooks

Webhooks are separate non-browser routes. Verify signature over raw body, timestamp/replay window, and event ID. Persist idempotently before acknowledgment. Do not expose queue replay or operator actions publicly.

## 10. Rate limits and payload sizes

Provisional internal-testing limits: project create 20/user/hour; model brainstorm/storyboard/revision 10/user/hour and one in-flight revision/project; 2 active renders/user and 1/project; voice preview 20/user/hour; one unresolved publish per artifact/account. Total render worker concurrency is a separate global cap. Source uploads stay disabled until policy is chosen.

Return 429 RATE_LIMITED with Retry-After. These protect provider spend and abuse; they are not billing or credit quotas. Limits must be enforced server-side and adjusted using actual observability.

## 11. Compatibility and review decisions

- Breaking contract changes require /api/v2 or a documented migration window.
- Additive optional response fields are compatible; do not change enum meanings.
- Reject unknown mutation fields to prevent mass assignment and catch stale clients.
- Keep OpenAPI schemas, runtime validators, and response tests aligned.
- IDs are opaque; clients do not infer database types.
- Before implementation confirm: synchronous versus durable async storyboard calls; upload types/limits; exact Clerk lifecycle webhooks; Meta product/scopes and token lifecycle; whether a creator may connect more than one account; final rate limits.

## 12. References

- [OpenAPI Specification 3.1.2](https://spec.openapis.org/oas/v3.1)
- [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication)
- [Clerk App Router authentication](https://clerk.com/docs/reference/nextjs/app-router/auth)
- [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Meta Instagram API documentation](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-3fe78620-2258-44b6-893f-42d76c7200d7)
