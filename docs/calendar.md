# Task Specification: Calendar

## Status
Draft — refinement in progress

## Summary
Create a new root-accessible calendar capability at `/calendar` in the web-app that gives beekeepers a time-oriented perspective on their data.

In parallel, rename the current TimeView route from `/time` to `/insights`.

## Problem statement
The current product stores and displays beekeeping information in multiple domain-specific views, but it does not yet provide a single chronological view that helps the user understand:
- what already happened,
- what is due next,
- and which hive/apiary actions should be planned over time.

The initial brainstorm includes several different ideas:
- historical time-based views,
- generated treatment follow-up reminders,
- queen rearing milestone schedules,
- seasonal and administrative planning tasks.

Calendar v1 is confirmed to combine historical activity and future reminders, with a medium v1 scope focused on core activity, treatment reminders, and queen lifecycle milestones.

## Current codebase observations
- OBS-001: The app already has a root route at `/time`, exposed in the root menu as **Insights**, and it is gated by `ProfessionalTierGate`.
  - Relevant files:
    - `src/page/index.tsx`
    - `src/shared/menu/index.tsx`
    - `src/page/time/index.tsx`
- OBS-002: No existing route, page, or model named `calendar` was found in `src/`.
- OBS-003: Treatment logging currently uses free-text input only (`type`) and does not store reminder metadata such as category, applied date, follow-up date, or reminder status.
  - Relevant file: `src/page/hiveEdit/treatments/index.tsx`
- OBS-004: Existing dated data already present in the app includes at least:
  - inspections (`added`),
  - hive log entries (`createdAt`),
  - hive collapse dates,
  - alerts/history,
  - queen added year/string.
- OBS-005: The brainstorm mixes passive history and active scheduling. Calendar v1 will intentionally combine both.
- OBS-006: The app already has a separate `/insights` route mapped to the Grafana page, so renaming `/time` to `/insights` creates a route collision unless the Grafana route is removed.
  - Relevant files:
    - `src/page/index.tsx`
    - `src/page/grafana/index.tsx`

## Goal
Define a clear v1 specification for a combined calendar-oriented feature that fits the existing application structure and coexists cleanly with the renamed Insights area.

## Route and navigation decisions
- DEC-001: Create a new root menu item and route for Calendar at `/calendar`.
- DEC-002: Rename the current TimeView route from `/time` to `/insights`.
- DEC-003: Calendar is a separate top-level product area, not a sub-view inside Insights.
- DEC-004: Remove the existing Grafana route currently served at `/insights`.

## Scope decisions
- DEC-005: Calendar v1 shall be a combined calendar that shows both historical activity and future reminders/tasks in one place.
- DEC-006: Calendar v1 shall include these item sources:
  - inspections,
  - hive log entries,
  - treatment-generated reminders,
  - queen milestone reminders.
- DEC-007: Seasonal/admin tasks are out of scope for Calendar v1.

## In scope
- historical inspections
- historical hive log entries
- future treatment-generated reminders
- future queen lifecycle milestone reminders

## Explicitly out of scope unless later approved
- External calendar provider integrations (Google, Apple, Outlook)
- A notification delivery redesign across email/SMS/push channels
- A general-purpose workflow engine
- Seasonal/admin tasks in Calendar v1
- Full implementation of every brainstorm idea in the first release
- Replacing the current telemetry/charting functionality of the current TimeView/Insights page

## Functional requirements
- REQ-F-001: The system shall provide a root-level Calendar entry point at `/calendar`.
- REQ-F-002: The system shall expose the current TimeView at `/insights` instead of `/time`.
- REQ-F-003: The system shall remove the existing Grafana route currently exposed at `/insights`.
- REQ-F-004: The calendar capability shall present both historical beekeeping activity and future reminders/tasks relevant to beekeeping operations.
- REQ-F-005: Each calendar item shall map to a specific source record or a specific generated reminder template.
- REQ-F-006: The user shall be able to open the related source context from a calendar item when the item is based on an existing record.
- REQ-F-007: Calendar v1 shall include only these item sources:
  - inspections,
  - hive log entries,
  - treatment-generated reminders,
  - queen milestone reminders.
- REQ-F-008: The system shall distinguish generated reminders/tasks from historical records.
- REQ-F-009 (pending): Treatment reminder generation rules must be explicitly defined.
- REQ-F-010 (pending): Queen milestone generation rules must be explicitly defined.

## Non-functional requirements

### Performance
- REQ-NF-PERF-001 (pending): The maximum default date range and initial item volume for the calendar view must be defined.
- REQ-NF-PERF-002 (draft): The calendar shall avoid loading unbounded historical records on initial render.

### Security
- REQ-NF-SEC-001 (draft): Calendar access shall require normal authenticated app access.
- REQ-NF-SEC-002 (pending): Billing/tier access for the calendar must either reuse an existing gate or define a new one.
- REQ-NF-SEC-003 (draft): Legal/safety guidance shown for treatments must be informational only and must not imply replacement of product-label or regulatory instructions.

### Quality
- REQ-NF-QUAL-001 (draft): Implementation shall include automated tests for route/menu visibility and the approved date-mapping logic.
- REQ-NF-QUAL-002 (draft): Acceptance tests shall cover at least one empty state and one populated state for the approved v1 scope.
- REQ-NF-QUAL-003 (draft): Route migration tests shall verify that `/calendar` and `/insights` resolve to the intended pages, and that the old Grafana `/insights` route no longer exists.

### Complexity
- REQ-NF-CPLX-001 (draft): v1 should reuse existing routes, models, and translation patterns where practical.
- REQ-NF-CPLX-002 (draft): v1 should avoid introducing a new generic scheduling system unless future reminders are explicitly included in scope.

### Documentation
- REQ-NF-DOC-001 (draft): New menu labels, item labels, empty states, and warnings shall be compatible with the existing translation approach (`T` wrapped UI strings).
- REQ-NF-DOC-002 (pending): User-facing copy for treatment reminders must be localized and legally cautious if that feature is approved.

### UX
- REQ-NF-UX-001 (pending): The primary presentation mode must be defined (agenda list, month grid, week view, timeline, or hybrid).
- REQ-NF-UX-002: The calendar shall clearly distinguish past items from future-due items when both are shown together.
- REQ-NF-UX-003 (draft): The user shall have a clear empty state when no records exist in the selected date range.

## Implementation boundaries
- The feature shall be introduced as a separate root-level Calendar area.
- The existing `/time` route shall be renamed to `/insights`.
- The existing Grafana route at `/insights` shall be removed.
- Calendar v1 shall combine historical and future items, but only for these approved source types:
  - inspections,
  - hive log entries,
  - treatment-generated reminders,
  - queen milestone reminders.
- Seasonal/admin tasks are out of scope for v1.
- The current brainstorm references multiple files, but those references are not yet accepted implementation scope.

## Decisions
- DEC-001: Create a new root menu item and route for Calendar at `/calendar`.
- DEC-002: Rename the current TimeView route from `/time` to `/insights`.
- DEC-003: Calendar is a separate top-level product area, not a sub-view inside Insights.
- DEC-004: Remove the existing Grafana route currently served at `/insights`.
- DEC-005: Calendar v1 shall be a combined calendar that shows both historical activity and future reminders/tasks in one place.
- DEC-006: Calendar v1 shall include inspections, hive log entries, treatment-generated reminders, and queen milestone reminders.
- DEC-007: Seasonal/admin tasks are out of scope for Calendar v1.

## Open questions
- Q-004: Which audience/tier should have access to the feature?
  - all logged-in users,
  - hobbyist and above,
  - professional only,
  - or same access rules as existing Insights.
- Q-005: What primary UX format is expected in v1?
  - agenda list,
  - week/month calendar grid,
  - timeline,
  - or a hybrid.
- Q-006: For treatment reminders, should reminders be:
  - auto-generated from treatment type,
  - manually selectable templates,
  - or manual custom reminders only.
- Q-007: For queen lifecycle milestones, should the feature support:
  - guided milestone generation from a start date,
  - passive display only,
  - or be deferred from v1.

## Ambiguities / risks
- RISK-001: Calendar v1 scope is now narrowed, but treatment reminder generation rules and queen milestone generation rules are still unresolved.
- RISK-002: Treatment reminder automation is not currently supported by the stored treatment data model; adding it requires new inputs and date-calculation rules.
- RISK-003: Queen lifecycle scheduling may require new input flows and milestone templates that do not exist yet in the current app.
- RISK-004: Legal and regional treatment guidance varies; reminder copy must not be treated as universally correct veterinary or pesticide advice.

## Acceptance criteria
Acceptance criteria are intentionally provisional until Q-004 through Q-007 are answered.

- AC-001: A logged-in user can discover and open Calendar from root navigation at `/calendar`.
- AC-002: A logged-in user can open the existing TimeView functionality at `/insights` instead of `/time`.
- AC-003: The previous Grafana route at `/insights` is no longer exposed.
- AC-004: The calendar shows both historical items and future reminders/tasks from these v1 item sources only:
  - inspections,
  - hive log entries,
  - treatment-generated reminders,
  - queen milestone reminders.
- AC-005 (provisional): Each displayed item shows a date and a label that identifies what the item represents.
- AC-006 (provisional): Each item based on an existing record links to the relevant source context.
- AC-007: The UI distinguishes historical items from future reminders/tasks visually and textually.
- AC-008 (provisional): Empty-state behavior is defined for users with no applicable items.

## Appendix A — brainstorm themes captured from initialization
The initialization notes suggest the following possible future feature families:
- treatment follow-up reminders,
- queen rearing lifecycle milestone scheduling,
- seasonal tasks,
- administrative/compliance reminders.

For Calendar v1, only treatment follow-up reminders and queen lifecycle milestone scheduling are retained from those future families.
