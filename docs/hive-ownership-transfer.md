# Specification: Hive ownership transfer

## Context

GitHub issue: [Gratheon/web-app#167](https://github.com/Gratheon/web-app/issues/167) — “♻️ Hive ownership transfer”.

The issue body is empty, so this document turns the feature idea into an implementation-ready product and architecture plan.

## Problem

A beekeeper may sell, donate, or hand over management of a hive to another Gratheon user. Today hive ownership is enforced by `user_id` on many tables. A safe transfer cannot be implemented as a single `UPDATE hives SET user_id = ...` because hive state is spread across `swarm-api`, frontend offline IndexedDB cache, and related services such as image analysis, alerts, telemetry, and video streams.

## Goals

- Let a hive owner initiate transfer of one active hive to another user.
- Require recipient acceptance before ownership changes.
- Move enough hive domain data that the recipient can continue managing the hive without broken references.
- Remove transferred hive access from the previous owner after acceptance.
- Preserve audit/history showing that transfer happened.
- Avoid transferring personal notification channels, billing state, API tokens, or unrelated apiary inventory.

## Non-goals for v1

- Multi-owner/shared hive collaboration. Existing share tokens remain a separate read/share concept.
- Bulk apiary transfer.
- Transfer to non-users with full account provisioning. v1 may invite by email, but recipient must have or create an account before accepting.
- Automatic physical media file relocation unless explicitly supported by the media service.
- Transferring the sender’s alert channels, warehouse inventory counts, billing plan, or account settings.

## Current ownership model

### `swarm-api`

`swarm-api` is the source of truth for hives and access control. Most domain queries filter by `ctx.Value("userID")` and table-level `user_id`.

Important files:

- `swarm-api/schema.graphql`
- `swarm-api/graph/model/hive.go`
- `swarm-api/graph/model/apiary.go`
- `swarm-api/graph/model/box.go`
- `swarm-api/graph/model/frame.go`
- `swarm-api/graph/model/family.go`
- `swarm-api/graph/model/inspection.go`
- `swarm-api/graph/model/hive_log.go`
- `swarm-api/graph/model/device.go`
- `swarm-api/graph/mutation_hive_resolvers.go`
- `swarm-api/migrations/*.sql`

Core tables coupled to hive ownership:

- `hives(user_id, apiary_id)`
- `boxes(user_id, hive_id)`
- `frames(user_id, box_id)`
- `frames_sides(user_id)` via `frames.left_id/right_id`
- `families(user_id, hive_id)`
- `family_moves(user_id, family_id, from_hive_id, to_hive_id)`
- `inspections(user_id, hive_id)`
- `treatments(user_id, hive_id, box_id, family_id)`
- `hive_placements(user_id, apiary_id, hive_id)`
- `hive_logs(user_id, hive_id)`
- `devices(user_id, hive_id, box_id)`

User-scoped configuration that should not be blindly transferred:

- `warehouse_modules`
- `warehouse_frame_inventory`
- `warehouse_settings`
- custom `box_systems`, `box_specs`, `frame_specs`

Important schema caveats:

- `hives.family_id` is a legacy column that may still exist in migrations, while the active model uses `families.hive_id`. Transfer code must verify both references remain consistent.
- `hives.box_system_id`, `boxes.box_system_id`, `boxes.box_spec_id`, and `frames.frame_spec_id` may point to sender-owned custom box-system records. A transferred hive must not reference custom specs the recipient cannot see.
- `hive_logs` has a unique `(user_id, dedupe_key)` constraint. Re-owning logs can collide with recipient dedupe keys unless transfer code rewrites/nulls transfer-sensitive dedupe keys or handles conflicts explicitly.
- `families.preview_image_url` may reference user-scoped media paths and should follow the approved media-transfer policy.

### `web-app`

The frontend uses GraphQL plus an offline IndexedDB cache.

Important files:

- `web-app/src/api/schema.ts`
- `web-app/src/api/offlineIndexDbExchange.ts`
- `web-app/src/api/resolvers.ts`
- `web-app/src/models/db/index.ts`
- `web-app/src/models/db/writeHooks.ts`
- `web-app/src/models/hive.ts`
- `web-app/src/models/apiary.ts`
- `web-app/src/page/hiveEdit/hiveTopInfo/*`
- `web-app/src/page/apiaryList/*`
- `web-app/src/page/apiaryView/*`

Risk: IndexedDB currently stores entities by numeric `id` and local resolvers read many rows without per-user filtering. After a transfer, the sender’s browser may still have stale cached hive rows until the app refetches or purges them.

### `user-cycle`

`user-cycle` owns account identity and login.

Important files:

- `user-cycle/schema.graphql`
- `user-cycle/src/resolvers.ts`
- `user-cycle/src/models/user.ts`
- `user-cycle/src/send-mail.ts`

Current public schema exposes current user, login/register, token validation, password reset, and share-token validation. It does not expose a safe recipient lookup by email for other services.

### Other related services

#### `image-splitter`

Image and AI-derived data is user-scoped and hive-linked:

- `files(user_id, ...)`
- `files_hive_rel(user_id, hive_id, file_id)`
- `files_frame_side_rel(user_id, frame_side_id, inspection_id, file_id, ...)`
- `files_frame_side_cells(user_id, frame_side_id, inspection_id, file_id, ...)`
- `files_frame_side_queen_cups(user_id, frame_side_id, inspection_id, file_id, ...)`
- `files_box_rel(user_id, box_id, inspection_id, file_id)`
- `varroa_bottom_detections(user_id, box_id, file_id)`
- `hive_advice(user_id, hive_id)`

If object storage paths or signed URLs include user IDs, SQL-only ownership changes are insufficient.

#### `alerts`

Alert rules may reference hives/apiaries, but channel config is personal:

- `alert_rules(user_id, hive_id, apiary_id, ...)`
- `alerts(user_id, hive_id, alert_rule_id, ...)`
- `alert_channel_config(user_id, ...)`
- `alert_delivery_log(user_id, ...)`

v1 should disable or delete transferred hive alert rules for the sender and should not copy personal channel config to the recipient.

#### `gate-video-stream`

Video stream data is user-scoped and box-linked:

- `streams(user_id, box_id, ...)`
- `segments(user_id, stream_id, ...)`

Like images, video files may have user-scoped storage paths.

#### `telemetry-api`

Telemetry uses `hive_id`/`box_id` but not obvious `user_id` ownership in migrations. Access likely depends on `swarm-api` device/hive authorization or upstream tokens. Transfer must define whether historical telemetry follows the hive and how device tokens are rotated.

#### `event-stream-filter`

Subscription routing is user-scoped. Current subscriptions include channels such as `${uid}.hive.${hiveId}.frame_resources_detected`.

Transfer implications:

- existing sender WebSocket subscriptions should stop receiving transferred hive events after backend authorization changes;
- recipient subscriptions should use the recipient UID after transfer;
- any cached subscription/session state should be short-lived or revalidated on reconnect.

## Product flow

### Initiate transfer

1. Owner opens hive settings/top info in `web-app`.
2. Owner clicks “Transfer ownership”.
3. UI explains consequences:
   - recipient becomes the owner after acceptance;
   - sender loses edit/access after acceptance;
   - personal alerts and device tokens may be disabled;
   - transfer cannot be accepted while offline.
4. Owner enters recipient email and optional message.
5. Backend creates a pending transfer request and sends/returns an invitation.

### Accept transfer

1. Recipient opens a transfer link or sees pending inbound transfer in account/app UI.
2. If not logged in, recipient logs in/registers first.
3. Recipient selects a target apiary they own, or creates a new apiary during acceptance.
4. Recipient optionally chooses a new hive number if the transferred number conflicts with their active hives.
5. Recipient accepts.
6. Backend atomically moves ownership and returns the transferred hive.
7. Recipient sees the hive under the selected apiary.
8. Sender’s app receives stale-data handling on next query/refetch and no longer sees the hive.

### Cancel/decline/expire

- Sender can cancel a pending transfer before acceptance.
- Recipient can decline.
- Pending transfers expire, e.g. after 14 days.
- Expired or declined transfers do not change hive ownership.

## Proposed `swarm-api` changes

### New DB table

Add a migration for transfer lifecycle records. Keep this in `swarm-api` because transfer affects hive-domain ownership and must be transactional with hive updates.

```sql
CREATE TABLE hive_transfer_requests (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  token_hash CHAR(64) NOT NULL,
  hive_id INT UNSIGNED NOT NULL,
  from_user_id INT UNSIGNED NOT NULL,
  to_user_id INT UNSIGNED NULL,
  to_email VARCHAR(255) NOT NULL,
  message TEXT NULL,
  status ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  target_apiary_id INT UNSIGNED NULL,
  target_hive_number INT NULL,
  expires_at DATETIME NOT NULL,
  accepted_at DATETIME NULL,
  declined_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_hive_transfer_token_hash (token_hash),
  KEY idx_hive_transfer_from_status (from_user_id, status, created_at),
  KEY idx_hive_transfer_to_status (to_user_id, status, created_at),
  KEY idx_hive_transfer_hive_status (hive_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Notes:

- Store only a hash of the public invite token.
- `to_user_id` may be null until the recipient authenticates if lookup-by-email is unavailable or intentionally avoided.
- Keep `to_email` for display/audit, but normalize and avoid leaking whether the account exists.

### GraphQL API

Add types and mutations to `swarm-api/schema.graphql`:

```graphql
enum HiveTransferStatus {
	PENDING
	ACCEPTED
	DECLINED
	CANCELLED
	EXPIRED
}

type HiveTransferRequest {
	id: ID!
	hive: Hive
	fromUserId: ID!
	toUserId: ID
	toEmail: String!
	message: String
	status: HiveTransferStatus!
	expiresAt: DateTime!
	createdAt: DateTime!
	acceptedAt: DateTime
}

type HiveTransferPreview {
	request: HiveTransferRequest!
	hiveNumber: Int
	familyName: String
	apiaryName: String
}

input CreateHiveTransferInput {
	hiveId: ID!
	recipientEmail: String!
	message: String
}

input AcceptHiveTransferInput {
	token: String!
	targetApiaryId: ID!
	targetHiveNumber: Int
}

extend type Query {
	outboundHiveTransfers(status: HiveTransferStatus): [HiveTransferRequest!]!
	inboundHiveTransfers(status: HiveTransferStatus): [HiveTransferRequest!]!
	hiveTransferPreview(token: String!): HiveTransferPreview
}

extend type Mutation {
	createHiveTransfer(input: CreateHiveTransferInput!): HiveTransferRequest!
	acceptHiveTransfer(input: AcceptHiveTransferInput!): Hive!
	declineHiveTransfer(token: String!): Boolean!
	cancelHiveTransfer(id: ID!): Boolean!
}
```

Implementation files likely needed:

- `swarm-api/graph/model/hive_transfer.go`
- `swarm-api/graph/query_hive_transfer_resolvers.go`
- `swarm-api/graph/mutation_hive_transfer_resolvers.go`
- generated gqlgen files after running codegen
- integration tests similar to `mutation_hive_resolvers_integration_test.go`

### Transfer transaction

`acceptHiveTransfer` must run in a DB transaction and verify:

- transfer exists, token hash matches, status is `PENDING`, and `expires_at > NOW()`;
- current user is the intended recipient, or current user email matches `to_email` when `to_user_id` is null;
- hive is still active, owned by `from_user_id`, not collapsed/merged if product decides only active hives can transfer;
- target apiary exists, is active, and belongs to recipient;
- target hive number is either unique for recipient or auto-assigned.

Ownership updates in `swarm-api` should include:

- `hives`: set `user_id = to_user_id`, `apiary_id = target_apiary_id`, optionally `hive_number = target_hive_number`; verify legacy `family_id` still points to a transferred family if the column exists.
- `boxes`: set `user_id = to_user_id` for boxes in the hive.
- `frames`: set `user_id = to_user_id` for frames in those boxes.
- `frames_sides`: set `user_id = to_user_id` for left/right frame sides used by transferred frames.
- `families`: set `user_id = to_user_id` for families assigned to the hive; keep `hive_id` pointing to the transferred hive; handle `preview_image_url` according to the media policy.
- `family_moves`: set `user_id = to_user_id` for transferred families or preserve sender history by policy. v1 recommendation: transfer family move history with the family because it is biological history.
- `inspections`: set `user_id = to_user_id` for hive inspections if historical inspections should follow the hive. v1 recommendation: transfer them.
- `treatments`: set `user_id = to_user_id` for hive/family treatments. v1 recommendation: transfer them.
- `hive_logs`: either transfer all logs or create a boundary. v1 recommendation: transfer domain logs, resolve `(user_id, dedupe_key)` conflicts before updating, and add two transfer log entries: one for sender before transfer and one for recipient after transfer.
- `hive_placements`: delete sender placement and create/update recipient placement under target apiary, or update `user_id/apiary_id` and reset coordinates. v1 recommendation: reset to default/unplaced to avoid leaking sender apiary layout.
- `devices`: detach or deactivate by default, because tokens and hardware credentials are security-sensitive. If product wants device handover, add an explicit checkbox and rotate tokens.

Box-system references require a dedicated decision before implementation:

- If all referenced `box_systems` are global defaults (`user_id IS NULL`), keep existing `hives/boxes/frames` spec IDs.
- If the hive references sender-owned custom systems/specs, either clone the required system/spec graph to the recipient and remap IDs, or remap the hive to a default visible system with a user-visible warning. v1 recommendation: clone custom box-system definitions to preserve hive structure.

### Audit

Add a hive log action such as `OWNERSHIP_TRANSFERRED` in backend/frontend constants.

Audit should capture:

- previous owner user ID;
- new owner user ID;
- request ID;
- accepted time;
- whether devices/media/alerts were transferred, detached, or skipped.

Avoid exposing sender/recipient emails in normal hive log UI unless privacy is explicitly approved.

### User lookup and email invitation

Two viable designs:

1. **No lookup from `swarm-api` to `user-cycle` in v1**

   - `createHiveTransfer` stores normalized `to_email` and sends an invite link.
   - `acceptHiveTransfer` checks the logged-in user’s email claim or calls a minimal account endpoint to compare current user email with the invite email.
   - Pro: avoids user enumeration.
   - Con: requires current user email in auth context or a service-to-service lookup by current UID.

2. **Add internal recipient lookup in `user-cycle`**
   - Add an internal/service-auth resolver or HTTP endpoint: resolve normalized email to user ID.
   - Public API must never reveal whether an email exists.
   - Pro: `inboundHiveTransfers` can work by `to_user_id`.
   - Con: adds service coupling and security review.

Recommendation: use `user-cycle` for sending email and current-user identity, but do not expose public recipient lookup. If service-to-service auth is not ready, start with token-link acceptance and email match.

## Related service changes

### `image-splitter`

Decision required: should historical images and AI detections transfer with the hive?

Per-user detection settings (`user_detection_settings`) should not transfer because they are account preferences, not hive data.

Recommended v1 policy:

- Transfer metadata and access only if storage paths are not user-bound or can be safely re-owned.
- Otherwise leave media with sender and show transferred hive without historical photos, while keeping inspection JSON/domain records.

If media transfer is approved, implement a service-level operation, not direct cross-DB updates from `swarm-api`:

- `transferHiveMedia(fromUserId, toUserId, hiveId, frameSideIds, boxIds, inspectionIds)`
- update `files_hive_rel`, `files_frame_side_rel`, `files_frame_side_cells`, `files_frame_side_queen_cups`, `files_box_rel`, `varroa_bottom_detections`, `hive_advice`;
- copy/move object storage if paths contain `user_id`;
- verify signed URL generation uses new owner.

### `alerts`

Recommended v1 policy:

- Do not transfer alert channels.
- Disable or delete sender `alert_rules` referencing transferred hive/apiary.
- Optionally notify sender in UI that hive-specific alert rules will be removed.
- Recipient can create new alerts.

Possible later enhancement: create disabled alert-rule suggestions for recipient without channel config.

### `gate-video-stream`

Recommended v1 policy:

- Do not transfer active video stream credentials by default.
- Detach/deactivate streams for transferred boxes, or require explicit device handover and token rotation.
- If transferring historical segments, handle object storage paths explicitly.

### `telemetry-api`

Recommended v1 policy:

- Historical telemetry follows `hive_id` if read access is authorized through the transferred hive.
- Device ingestion credentials should be rotated or detached via `swarm-api` devices.
- Verify telemetry query authorization path before implementation.

## `web-app` changes

### Schema and API

Update `web-app/src/api/schema.ts` after backend schema changes.

Add frontend GraphQL operations for:

- create transfer;
- list pending outbound/inbound transfers;
- preview by token;
- accept/decline/cancel.

### UI entry points

Recommended v1 UI:

- Add “Transfer ownership” action in hive top info/settings area:
  - `web-app/src/page/hiveEdit/hiveTopInfo/index.tsx`
  - or `web-app/src/page/hiveEdit/hiveTopInfo/hiveTopEditForm/index.tsx`
- Add `TransferHiveModal` with recipient email, explanation, optional message, and confirmation.
- Add an account or notification section for pending transfers, or route-only accept page first.
- Add route such as `/hive-transfer/:token` for recipient preview and acceptance.

Acceptance page should:

- show hive preview: hive number, queen/family name, sender display if allowed, expiration;
- require login if unauthenticated;
- load recipient apiaries and allow selecting/creating target apiary;
- show hive number conflict and allow override/auto-assign;
- call `acceptHiveTransfer` online-only.

### Offline cache handling

After successful outgoing transfer creation:

- no ownership changes yet, so keep current cache.

After successful acceptance on recipient device:

- upsert transferred hive and nested entities from response;
- refetch apiaries/hive list;
- consider `dropDatabase()` or targeted invalidation if schema/write hooks cannot guarantee correctness.

After sender loses ownership:

- network refetch should stop returning the hive;
- local cache must remove hives not present in fresh `apiaries` response, or transfer acceptance should trigger a targeted deletion on next sync;
- if stale offline cache is shown, UI may briefly display a hive the backend rejects on mutation. Add friendly “You no longer have access to this hive” handling.

Potential files:

- `web-app/src/models/db/index.ts` — add targeted purge helper if needed.
- `web-app/src/api/resolvers.ts` — avoid returning stale transferred hives from offline cache when online data proves removal.
- `web-app/src/models/hive.ts` — add deletion/purge helpers.

### Copy and localization

All user-visible strings should use existing translation patterns (`T`, `useTranslation`). Required strings include:

- “Transfer ownership”
- “Recipient email”
- “The recipient will become the owner after accepting.”
- “You will lose access to this hive after transfer.”
- “Personal alerts and device tokens are not transferred.”
- “Select target apiary”
- “Accept transfer”
- “Decline transfer”
- “Transfer expired or already used.”

## Security and privacy requirements

- Transfer invite tokens must be high entropy and stored hashed.
- Accept/cancel/decline mutations must be authenticated, except preview can be token-gated with minimal non-sensitive data.
- Do not expose whether an arbitrary email is registered.
- Do not transfer sender personal data: alert channels, billing, account settings, unrelated apiaries, API tokens.
- Rotate or detach device/video credentials by default.
- Ensure old owner cannot mutate transferred hive after acceptance.
- Ensure recipient cannot accept transfer into an apiary they do not own.
- Rate-limit transfer creation per user and per hive to reduce spam.
- Avoid leaking exact sender apiary coordinates/layout to recipient unless that is part of the hive transfer contract.

## Edge cases

- Recipient email belongs to sender: reject.
- Hive deleted/collapsed/merged before acceptance: reject or expire transfer.
- Hive already has pending transfer: reject duplicate or allow resend.
- Recipient has no apiary: acceptance flow should create one or link to apiary creation.
- Target hive number conflicts: auto-assign next number or ask recipient.
- Sender changes hive after invite but before acceptance: accepted state should include latest hive state, or lock selected fields. v1 recommendation: accept latest state.
- Sender’s subscription plan limits recipient’s active hive count: enforce recipient billing limits before acceptance.
- Offline recipient opens transfer link: show online-required message.
- Media transfer fails after core transaction: use explicit policy. Prefer core transfer transaction not to include external service calls; record media transfer status and retry asynchronously if media transfer is required.

## Implementation phases

### Phase 1 — Core domain transfer without media/device handover

- Add `hive_transfer_requests` migration in `swarm-api`.
- Add GraphQL transfer API and integration tests.
- Transfer core `swarm-api` hive-domain rows in a DB transaction.
- Clone or remap sender-owned custom box-system references.
- Reset placement into recipient apiary.
- Detach/deactivate devices.
- Disable sender hive-specific alert rules via a follow-up service call or documented manual cleanup if cross-service command is not available.
- Add web-app initiate and accept flows.
- Add offline cache invalidation/refetch behavior.

### Phase 2 — Notifications and account UX

- Add email invitation through `user-cycle` email templates.
- Add inbound/outbound transfer list in account page.
- Add reminders for pending/expiring transfers if needed.

### Phase 3 — Media/video/telemetry continuity

- Implement explicit media ownership operation in `image-splitter`.
- Define and implement video stream/segment policy in `gate-video-stream`.
- Verify telemetry authorization and device-token rotation.

### Phase 4 — Advanced transfer options

- Bulk transfer multiple hives.
- Transfer full apiary.
- Optional device handover with token rotation.
- Optional read-only archive for sender.

## Acceptance criteria for v1

- Owner can create a pending transfer for an active hive by recipient email.
- Recipient can accept with a valid token while logged in as the matching account.
- Recipient must choose an owned target apiary.
- After acceptance, recipient can view and edit the hive, boxes, frames, families, inspections, treatments, and hive logs.
- After acceptance, sender cannot view or mutate the transferred hive through backend APIs.
- Sender’s personal alert channels and account settings are not transferred.
- Device/video credentials are detached or rotated according to approved v1 policy.
- Transfer actions are audited.
- Expired, cancelled, declined, duplicate, or already accepted transfers are handled gracefully.
- Frontend does not permanently show stale transferred hives from IndexedDB after online refresh.

## Open decisions

1. Should historical photos and AI detections transfer in v1, or be deferred?
2. Should historical telemetry always follow the hive?
3. Should devices be detached by default or offered as an explicit handover option?
4. Does auth context already provide current user email to `swarm-api`, or is a service-to-service lookup from `user-cycle` required?
5. Should sender retain any read-only archive after transfer, or lose all access immediately?
6. Should a transfer be allowed for collapsed/merged hives, or only active hives?
7. Should recipient billing plan limits block acceptance if the transferred hive exceeds their active hive limit?
