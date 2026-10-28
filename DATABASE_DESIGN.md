
# Database Design — VidyaMotion

**Status:** Proposed V1 MongoDB design for review  
**Updated:** October 29, 2026  
**References:** [PRD.md](PRD.md) · [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) · [API_DESIGN.md](API_DESIGN.md) · [PIPELINE_DESIGN.md](PIPELINE_DESIGN.md)

## 1. Purpose and principles

MongoDB Atlas is the canonical store for individual workspaces and workflow state. Cloudflare R2 stores media bytes; a managed queue (SQS Standard + DLQ recommended, pending confirmation) transports render IDs; Clerk is the identity provider. External provider calls never run within MongoDB transactions.

Invariants:

- Every user-owned document includes ownerId from the verified Clerk subject. The browser never chooses ownerId.
- Every child access verifies ownerId and parent IDs. Random IDs are not authorization.
- Storyboard versions are append-only. Editing or restoring creates a new version.
- A render pins one approved storyboard version, ratio, voice configuration, and pipeline snapshot.
- Only validated artifacts are available to preview/download/publish. Preserve prior successful artifacts.
- Jobs/outbox/idempotency use unique indexes and conditional state updates.
- Database validators check document shape/enums; application services check cross-document ownership and legal transitions.

## 2. MongoDB conventions and validation

- Internal IDs use ObjectId; API IDs are opaque strings.
- Dates use BSON Date in UTC; API serializes RFC 3339.
- Clerk subject is ownerId. Do not store passwords or identity-provider secrets.
- Add schemaVersion to durable collection documents.
- Embed bounded scene arrays in immutable storyboard versions. Keep conversations, jobs, artifacts, outbox and publish attempts in separate collections.
- Put media, audio, large alignment payloads and source documents in R2; store only private object references/checksums in MongoDB.
- Use MongoDB $jsonSchema validators for required fields, BSON types, enums and basic limits; also validate requests/provider output in application schemas.
- MongoDB supports a subset based on JSON Schema draft 4; do not assume every modern JSON Schema keyword or format is enforced. Cross-document rules always belong in domain services/transactions.
- Start new collections at validationLevel strict and validationAction error. Existing documents are not retroactively repaired by adding a validator.

References: [MongoDB schema validation](https://www.mongodb.com/docs/manual/core/schema-validation/) and [JSON Schema support](https://www.mongodb.com/docs/manual/core/schema-validation/specify-json-schema/).

## 3. Relationships and embedding

~~~mermaid
erDiagram
  USER_PROFILE ||--o{ PROJECT : owns
  PROJECT ||--o{ PROJECT_MESSAGE : contains
  PROJECT ||--o{ STORYBOARD_VERSION : versions
  PROJECT ||--o{ SOURCE_ASSET : references
  PROJECT ||--o{ RENDER_JOB : renders
  STORYBOARD_VERSION ||--o{ RENDER_JOB : pins
  RENDER_JOB ||--o{ RENDER_ARTIFACT : creates
  USER_PROFILE ||--o{ SOCIAL_CONNECTION : authorizes
  RENDER_ARTIFACT ||--o{ PUBLISH_ATTEMPT : published_as
  SOCIAL_CONNECTION ||--o{ PUBLISH_ATTEMPT : destination
  RENDER_JOB ||--o{ OUTBOX_EVENT : emits
~~~

MongoDB references are not foreign keys. Every query includes ownerId; child resource operations also include projectId. Embed only bounded scene arrays and small visual props. Do not embed unbounded chat, render history, or media. Keep artifacts and publishing separate from project summary state.

## 4. Collections

Examples below are logical shapes; use BSON ObjectId/Date types. All user-owned collections include ownerId and schemaVersion.

### userProfiles

Minimal local profile linked to Clerk; Clerk remains authoritative.

Fields: ownerId (unique), displayName (optional), preferences.locale (en-IN), preferences.defaultVoicePresetId, preferences.defaultAspectRatio, accountState active/deleting/deleted, createdAt, updatedAt, deletedAt.

Do not copy email unless product needs it. If stored, treat as PII and keep synchronized only from verified identity events.

### projects

Dashboard summary; workflow-specific records remain authoritative.

Fields: ownerId, title, topic, status, currentStoryboardVersionId, latestArtifactId, activeRenderJobId, conversationSequence, defaults, deletion state, schemaVersion, createdAt, updatedAt.

Statuses: draft, generating_storyboard, storyboard_ready, rendering, ready, needs_attention, failed, deleted. Enforce title/topic bounds in application and validator. Project status is a transactionally maintained display projection, never the sole proof that a render completed.

### projectMessages

Append-only idea/conversation records so histories can be cursor-paginated.

Fields: ownerId, projectId, sequence, role (user/assistant/system_summary), kind (idea/brainstorm/revision/generation_result/error_summary), text, replyToMessageId, operationId, createdAt, schemaVersion.

Do not store hidden prompts, API keys, or raw provider payloads as user-visible messages. Keep sequence unique per project or order by createdAt plus _id.

### storyboardVersions

One record per generation, revision, or restore. Scene list is bounded (initial target 4–6, confirm in implementation).

Fields: ownerId, projectId, version, parentVersionId, sourceMessageIds, sourceAssetIds, title, language=en, locale=en-IN, targetSeconds, estimatedSeconds, scenes, revision summary/changedSceneIds, approval status/timestamp, provider/model/prompt-version metadata, schemaVersion, createdAt.

Each scene has stable sceneId, contiguous order, title, narration, and visual object. Visual primitive must be from an allowlist (hook, concept_diagram, comparison, process_steps, simple_chart, metric_callout, labeled_object, takeaway); labels/elements/text lengths are bounded. No executable code, arbitrary CSS, or unchecked URLs.

Once approved, a version is immutable. Restore creates a new draft version copied from the old one and requires approval again. A formerly approved version remains renderable.

### sourceAssets (P1, initially disabled)

Fields: ownerId, projectId, sanitized originalName, declared/detected content type, byteSize, checksum, private objectKey, status, extraction status/reference, rejectionCode, timestamps, schemaVersion.

Statuses: awaiting_upload, uploaded, scanning, ready, rejected, deleting, deleted. Do not enable until accepted file types, size caps, scanning/extraction and retention are decided. Validate detected signature, not browser MIME alone.

### renderJobs

Canonical background job and immutable input/config snapshot.

Fields: ownerId, projectId, storyboardVersionId, requestKey, attempt, retryOfJobId, aspectRatio, outputProfile, voice preset/provider reference, status, stage, approximate progress label, bounded scene checkpoints, worker lease/heartbeat, attemptCount, nextAttemptAt, sanitized failure code/message, artifactIds, startedAt, completedAt, timestamps, schemaVersion.

Statuses: queued, preparing_narration, aligning, building_scenes, rendering, validating, uploading, retryable_failure, needs_revision, permanent_failure, cancel_requested, canceled, completed. Do not persist provider secrets. Large audio/alignment data stays in R2.

### renderArtifacts

Immutable successful output metadata. Create only after validation and confirmed R2 upload.

Fields: ownerId, projectId, renderJobId, storyboardVersionId, aspectRatio, durationSeconds, width, height, fps, videoCodec, audioCodec, fileSizeBytes, captionTimingSource, validationSummary, private object keys, thumbnailKey, status ready/deleting/deleted, createdAt, deletedAt, schemaVersion.

Never overwrite a previous artifact. Store checksums. API projections never expose object keys.

### socialConnections

Initial assumption: one active Instagram connection per user. Confirm if multiple accounts should be supported before building the unique index.

Fields: ownerId, provider=meta_instagram, providerAccountId, displayName, accountType, grantedScopes, encrypted access/refresh tokens, tokenExpiresAt, status active/reauth_required/disconnected, connectedAt, updatedAt, disconnectedAt, encryptionKeyVersion, schemaVersion.

Encrypt tokens at the application layer/envelope-key service. Exclude token ciphertext from normal projections, API responses, logs and untrusted support tools.

### publishAttempts

Fields: ownerId, projectId, artifactId, socialConnectionId, idempotencyKey, caption, status, Meta container/media IDs, permalink, temporary URL expiry only, attemptCount, nextPollAt, outcomeUnknownSince, failureCode, safeMessage, requestedAt, publishedAt, updatedAt, schemaVersion.

Statuses: queued, creating_container, processing, ready_to_publish, publishing, outcome_unknown, retryable_failure, permanent_failure, needs_reauth, published, canceled. Never persist a bearer media URL after processing/expiry.

### outboxEvents and idempotencyRecords

Outbox fields: eventId, aggregateType/Id, ownerId, eventType, payloadVersion, bounded ID-only payload, dispatchStatus, dispatchAttempts, nextAttemptAt, createdAt, dispatchedAt, lastErrorCode, schemaVersion.

Idempotency fields: ownerId, scope, key, canonical requestHash, resourceType/Id, responseStatus, bounded safe response, createdAt, expiresAt, schemaVersion. Never store tokens or signed URLs in replay bodies.

## 5. Indexes

All user-facing queries filter ownerId. Build indexes from real query plans and verify with explain.

| Collection | Index | Purpose |
|---|---|---|
| userProfiles | unique {ownerId: 1} | One profile per Clerk subject |
| projects | {ownerId: 1, updatedAt: -1, _id: -1} | Stable dashboard cursor |
| projects | {ownerId: 1, status: 1, updatedAt: -1, _id: -1} | Status-filtered dashboard |
| projectMessages | unique {ownerId: 1, projectId: 1, sequence: 1} | Conversation sequence |
| projectMessages | {ownerId: 1, projectId: 1, createdAt: -1, _id: -1} | Message cursor |
| storyboardVersions | unique {ownerId: 1, projectId: 1, version: 1} | Prevent duplicate version |
| storyboardVersions | {ownerId: 1, projectId: 1, createdAt: -1, _id: -1} | Version history |
| sourceAssets | unique {ownerId: 1, objectKey: 1} | Key uniqueness |
| sourceAssets | {ownerId: 1, projectId: 1, status: 1, createdAt: -1} | Lookup/cleanup |
| renderJobs | {ownerId: 1, projectId: 1, createdAt: -1, _id: -1} | User history |
| renderJobs | {status: 1, nextAttemptAt: 1, createdAt: 1} | Retry/lease reconciliation |
| renderJobs | unique {ownerId: 1, requestKey: 1}, partial when key exists | Create idempotency |
| renderArtifacts | {ownerId: 1, projectId: 1, createdAt: -1, _id: -1} | Artifact history |
| socialConnections | unique {ownerId: 1, provider: 1} | One connection/provider/user |
| socialConnections | unique {provider: 1, providerAccountId: 1} | Prevent binding same account twice, if product policy approves |
| publishAttempts | unique {ownerId: 1, idempotencyKey: 1} | Publish dedupe |
| publishAttempts | {ownerId: 1, projectId: 1, requestedAt: -1} | Publish history |
| publishAttempts | unique {metaContainerId: 1}, partial when present | Provider reconciliation |
| outboxEvents | unique {eventId: 1} | Event dedupe |
| outboxEvents | {dispatchStatus: 1, nextAttemptAt: 1, createdAt: 1} | Relay pending scan |
| idempotencyRecords | unique {ownerId: 1, scope: 1, key: 1} | Request replay |
| idempotencyRecords | TTL {expiresAt: 1}, expireAfterSeconds: 0 | Eventual cleanup |

Use partial unique indexes for optional fields; do not let missing/null values collide. TTL removal is asynchronous, so application logic checks expiresAt. TTL is for idempotency/temporary records only, not user projects or artifacts. Use R2 lifecycle cleanup for temporary media after explicit retention decisions.

See [MongoDB index properties](https://www.mongodb.com/docs/manual/core/indexes/index-properties/) and [TTL indexes](https://www.mongodb.com/docs/manual/core/index-ttl/).

## 6. State transitions

Use conditional updates comparing current status, attempt, and lease. Invalid transitions are application errors and operational alerts.

### Storyboard

~~~text
draft -> approved
draft -> superseded when a later version becomes current
approved -> immutable
restore(oldVersion) -> new draft version -> approved separately
~~~

### Render

~~~text
queued -> preparing_narration -> aligning -> building_scenes -> rendering -> validating -> uploading -> completed
active -> retryable_failure -> queued (bounded)
active -> needs_revision
active -> permanent_failure
queued/active -> cancel_requested -> canceled (best effort)
~~~

Worker atomically claims queued/retryable work, assigns a lease, and checkpoints progress. Heartbeats compare job, worker, attempt, and lease. Expired lease recovery reconciles completed scene outputs first. Only the current lease/attempt may commit the artifact.

### Publish

~~~text
queued -> creating_container -> processing -> ready_to_publish -> publishing -> published
active -> retryable_failure or needs_reauth or permanent_failure
publishing -> outcome_unknown -> provider reconciliation -> published or safe retry
~~~

Do not label ambiguous external outcomes as failed until queried. Only confirmed Meta success sets published/permalink.

### Project summary

Project.status is a projection maintained when workflow state changes. Proposed priority: deleted/deleting; active render; successful artifact ready; current storyboard storyboard_ready; otherwise draft; needs_attention/failed when latest operation requires action. With several jobs, choose latest active/latest terminal consistently. Never infer job completion solely from project.status.

## 7. Transactions and external side effects

Atlas must run on a transaction-capable replica set or sharded deployment. Keep transactions short and retry transient transaction errors. Never call Gemini, ElevenLabs, Meta, R2, or SQS inside a transaction. See [MongoDB transactions](https://www.mongodb.com/docs/manual/core/transactions/).

| Operation | Short atomic database work | External action outside transaction |
|---|---|---|
| Profile initialization | Upsert unique owner profile | Clerk session/webhook |
| Project create | Project + idempotency record | Model call |
| Storyboard save | Insert version + update project pointer/status + applied message | Gemini call occurs first |
| Approve version | Set approval once + project summary | None |
| Create render | Job + outbox event + idempotency + project active status | Relay publishes after commit |
| Worker claim | Conditional status/lease update | Provider/render stages |
| Render completion | Insert artifact + complete job + update project + outbox | Upload/validate media first |
| Publish request | PublishAttempt + outbox + idempotency | Meta API calls after commit |
| Publish success | Confirm attempt and permalink | Meta status lookup before commit |
| Project delete | Tombstone + cancellation/cleanup event | R2/child cleanup asynchronously |

The outbox relay can send twice if it crashes after queue publish but before marking dispatched. Consumers dedupe eventId and atomically claim the canonical job. A database transaction cannot make external media or social actions atomic.

## 8. Integrity, access patterns, and data checks

- Parent lookup for every child mutation: project {_id, ownerId, deletion.state: active}.
- Render creation: storyboard {_id, ownerId, projectId, approval.status: approved}; verify no equivalent active job.
- Publish: artifact and connection must match owner and requested project; artifact status ready; connection active.
- Every query/read projection excludes encrypted token, worker lease, provider raw payload, and private storage keys unless internal worker role explicitly needs them.
- Use bounded cursor pagination and deterministic sort tuples. Do not use unbounded project arrays for messages/jobs.
- Version counter allocated atomically/transactionally; duplicate version numbers are prevented by unique index. Gaps are acceptable.
- Cleanup actions are idempotent and re-check deletion state.
- Use application invariants plus DB validators; Mongo validators are not a substitute for authorization or transition logic.

## 9. Deletion and retention

PRD excludes formal user-facing archive/backup/restore, but requires confirmed deletion and retry from saved inputs. Define retention before enabling source uploads.

1. Confirm delete; transaction marks project deleting, blocks new work, and emits cleanup/cancel event.
2. Request cancellation of active jobs; allow worker to stop at safe checkpoints.
3. Cleanup worker deletes R2 prefixes and child records in bounded batches.
4. Keep minimal tombstone until cleanup succeeds; then delete/anonymize according to approved retention.
5. Retry cleanup idempotently and alert on stuck cleanup.
6. Account deletion processes every owned project, revokes/removes social tokens, and removes profile after cleanup.
7. Set explicit durations for successful media, failed temp files, conversation history, and deletion completion.

R2 lifecycle expiry must not delete successful artifacts sooner than product retention. Mongo TTL is eventual, not a precise scheduler.

## 10. Migrations and schema changes

Manage validators, indexes and migrations as reviewed versioned scripts. Use expand → migrate → contract:

1. Add optional fields and compatible validator rules.
2. Deploy code that reads old/new and writes the new shape.
3. Backfill in resumable bounded batches with checkpoints.
4. Verify counts, invariants, indexes and query plans.
5. Tighten required fields/remove old fields after all app/worker versions are upgraded.

Before creating a unique index, find and resolve duplicates. Adding a validator does not repair existing documents; scan and backfill first. Test validator/index changes against staging data. For destructive changes, take a verified infrastructure snapshot/export even though user-facing restore is out of scope. Keep rolling deploy versions compatible.

Migration scripts must be idempotent, resumable, privacy-safe in logs, have rollback plans, and avoid long collection-wide transactions. See [MongoDB validation updates](https://www.mongodb.com/docs/manual/core/schema-validation/update-schema-validation/).

## 11. Operations and capacity

- Start with a replica-set Atlas deployment sized for internal testing; no sharding until measured need.
- Reuse pooled Mongo clients; set connection, server-selection, and transaction timeouts for web and worker runtimes.
- Monitor connection counts, query latency, index size, transaction retries/aborts, validation failures, outbox lag, and cleanup backlog.
- Keep worker transactions closed during rendering. Use leases/heartbeats to coordinate workers.
- Check explain plans for dashboard lists, message/version pagination, job reconciliation, outbox polling, and artifact history.
- Bound document sizes; large source text and media belong in R2/controlled sidecar storage.

## 12. Decisions to confirm

1. Atlas region/tier and transaction support.
2. One Instagram connection per user or multiple.
3. Conversation and provider-input retention.
4. Source file types, limits, scanning/extraction, and retention.
5. Media and account deletion windows.
6. Synchronous storyboard generation or a durable generation-operation collection.
7. Whether restricted provider diagnostics need a separate audit store.

## 13. References

- [MongoDB schema validation](https://www.mongodb.com/docs/manual/core/schema-validation/)
- [MongoDB JSON Schema support](https://www.mongodb.com/docs/manual/core/schema-validation/specify-json-schema/)
- [MongoDB transactions](https://www.mongodb.com/docs/manual/core/transactions/)
- [MongoDB index properties](https://www.mongodb.com/docs/manual/core/indexes/index-properties/)
- [MongoDB TTL indexes](https://www.mongodb.com/docs/manual/core/index-ttl/)
- [MongoDB validation updates](https://www.mongodb.com/docs/manual/core/schema-validation/update-schema-validation/)
