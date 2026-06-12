Specification: Calendar

## Functional requirements

- [x] REQ-F-001 Provide a root-level Calendar entry point at `/calendar`. Verification: route and navigation tests.
- [x] REQ-F-002 Expose the current TimeView functionality at `/insights` instead of `/time`. Verification: route migration tests.
- [x] REQ-F-003 Remove the existing Grafana route currently exposed at `/insights` so the renamed TimeView has no route collision. Verification: route migration tests and code review.
- [x] REQ-F-004 Present both historical beekeeping activity and future reminders/tasks relevant to beekeeping operations in one calendar-oriented view. Verification: populated-state acceptance test.
- [x] REQ-F-005 Map each calendar item to a specific source record or to a specific generated reminder template. Verification: calendar item mapping tests.
- [x] REQ-F-006 Allow the user to open the related source context from a calendar item when the item is based on an existing record. Verification: navigation/link tests.
- [x] REQ-F-007 Limit Calendar v1 item sources to inspections, hive log entries, treatment-generated reminders, and queen milestone reminders. Verification: source filtering tests.
- [x] REQ-F-008 Distinguish generated reminders/tasks from historical records visually and textually. Verification: UI acceptance tests.
- [ ] REQ-F-009 Define treatment reminder generation rules before implementation. Verification: approved specification update and reminder rule tests.
- [ ] REQ-F-010 Define queen milestone generation rules before implementation. Verification: approved specification update and milestone rule tests.
- [x] REQ-F-011 Keep seasonal tasks, administrative tasks, external calendar provider integrations, notification delivery redesign, generic workflow engines, broad brainstorm features, and replacement of existing TimeView telemetry/charting out of Calendar v1 unless later approved. Verification: code review and scope review.
- [x] REQ-F-012 Show inspection recency in Calendar v1 by displaying the latest known inspection date for the relevant hive/apiary context, even when that inspection falls outside the currently selected calendar date range. The recency indicator is based on an inspection source record, links to the related source context when available, and must not be presented as a future task. Verification: inspection recency UI and mapping tests.

## Non-functional requirements

### Performance

- [x] REQ-NF-PERF-001 Calendar initial render loads a bounded default date range from 4 weeks before today through 4 weeks after today; user-expanded calendar loading is capped to dates within 1 year before through 1 year after today. Initial item volume is limited to approved Calendar v1 sources within the selected date range, with no unbounded historical load. Verification: approved specification update and data-loading tests.
- [x] REQ-NF-PERF-002 Avoid loading unbounded historical records on initial render. Verification: code review and query/data-fetch tests.
- [x] REQ-NF-PERF-003 The inspection recency indicator may query only the latest inspection record per relevant hive/apiary context and must not require loading full inspection history outside the selected calendar range. Verification: data-fetch tests and code review.

### Security

- [x] REQ-NF-SEC-001 Require normal authenticated app access for Calendar. Verification: route access tests.
- [x] REQ-NF-SEC-002 Calendar is available to all logged-in users and is not restricted by subscription tier in Calendar v1. Verification: approved specification update and gate tests.
- [x] REQ-NF-SEC-003 Keep treatment reminder guidance informational only and do not imply replacement of product-label, veterinary, or regulatory instructions. Verification: copy review.

### Quality

- [x] REQ-NF-QUAL-001 Include automated tests for route/menu visibility and approved date-mapping logic. Verification: test suite.
- [x] REQ-NF-QUAL-002 Cover at least one empty state and one populated state for the approved Calendar v1 scope. Verification: acceptance tests.
- [x] REQ-NF-QUAL-003 Verify that `/calendar` and `/insights` resolve to the intended pages and that the old Grafana `/insights` route no longer exists. Verification: route migration tests.
- [x] REQ-NF-QUAL-004 Cover inspection recency behavior for at least one hive/apiary with a latest inspection inside the selected range and one with a latest inspection outside the selected range. Verification: inspection recency tests.

### Complexity

- [x] REQ-NF-CPLX-001 Reuse existing routes, models, and translation patterns where practical. Verification: code review.
- [x] REQ-NF-CPLX-002 Avoid introducing a new generic scheduling system unless future reminders require one and that expansion is explicitly approved. Verification: architecture review.

### Documentation

- [x] REQ-NF-DOC-001 Keep new menu labels, item labels, empty states, and warnings compatible with the existing translation approach using `T`-wrapped UI strings. Verification: code review and localization review.
- [ ] REQ-NF-DOC-002 Localize treatment reminder copy and keep it legally cautious if treatment reminders are approved for implementation. Verification: localization and copy review.
- [x] REQ-NF-DOC-003 Keep this specification as the source of truth for Calendar route decisions, Calendar v1 scope, source types, known risks, and pending follow-up requirements. Verification: review process.

### UX

- [x] REQ-NF-UX-001 Calendar v1 uses a hybrid primary presentation: a month calendar grid for date-oriented overview plus a timeline for chronological item details. Verification: approved specification update and UI acceptance tests.
- [x] REQ-NF-UX-002 Clearly distinguish past items from future-due items when both are shown together. Verification: UI acceptance tests.
- [x] REQ-NF-UX-003 Provide a clear empty state when no records exist in the selected date range. Verification: empty-state acceptance test.
- [x] REQ-NF-UX-004 Display inspection recency as a historical status/summary signal, not as a generated reminder or due task, so users can quickly see when inspections were last performed. Verification: UI acceptance tests.

## Decisions

- [x] DEC-001 Create a new root menu item and route for Calendar at `/calendar`.
- [x] DEC-002 Rename the current TimeView route from `/time` to `/insights`.
- [x] DEC-003 Treat Calendar as a separate top-level product area, not as a sub-view inside Insights.
- [x] DEC-004 Remove the existing Grafana route currently served at `/insights`.
- [x] DEC-005 Build Calendar v1 as a combined calendar that shows both historical activity and future reminders/tasks in one place.
- [x] DEC-006 Include inspections, hive log entries, treatment-generated reminders, and queen milestone reminders as the only Calendar v1 item sources.
- [x] DEC-007 Keep seasonal and administrative tasks out of Calendar v1.
- [x] DEC-008 Preserve existing TimeView telemetry/charting functionality under the renamed `/insights` route instead of replacing it with Calendar.
- [x] DEC-009 Use existing dated data where practical, including inspections with `added`, hive log entries with `createdAt`, hive collapse dates, alerts/history, and queen added year/string, while limiting accepted Calendar v1 implementation sources to DEC-006.
- [x] DEC-010 Treat treatment reminders and queen lifecycle milestones as generated future reminder/task items, separate from historical source records.
- [x] DEC-011 Make Calendar v1 available to all logged-in users, without hobbyist/professional tier restrictions.
- [x] DEC-012 Use a hybrid Calendar v1 presentation with a month calendar grid and a timeline.
- [x] DEC-013 Use a default Calendar load window of the last 4 weeks plus the next 4 weeks, and cap user-expanded loading to ±1 year from today; Calendar v1 item volume is bounded by the approved sources within the selected date range rather than by loading all historical records.
- [x] DEC-014 Add an inspection recency indicator to Calendar v1 so the user can see the last time inspections were performed without expanding the calendar date range or adding a new Calendar v1 source type.

## Known risks

- [ ] RISK-001 Treatment reminder automation is not currently supported by the stored treatment data model because treatment logging uses free-text input only and does not store reminder metadata such as category, applied date, follow-up date, or reminder status. Impact: treatment reminders may require new inputs or model changes. Control: define the reminder data contract as part of REQ-F-009 before implementation.
- [ ] RISK-002 Queen lifecycle scheduling may require new input flows and milestone templates that do not exist in the current app. Impact: queen milestone reminders may expand scope. Control: define required source dates and approved templates as part of REQ-F-010 before implementation.
- [ ] RISK-003 Legal and regional treatment guidance varies. Impact: reminder copy could be mistaken for regulatory or veterinary instructions. Control: keep treatment copy informational and legally cautious as required by REQ-NF-SEC-003 and REQ-NF-DOC-002.

## Acceptance criteria

- [x] AC-001 A logged-in user can discover and open Calendar from root navigation at `/calendar`.
- [x] AC-002 A logged-in user can open existing TimeView functionality at `/insights` instead of `/time`.
- [x] AC-003 The previous Grafana route at `/insights` is no longer exposed.
- [x] AC-004 Calendar shows both historical items and future reminders/tasks from Calendar v1 sources only: inspections, hive log entries, treatment-generated reminders, and queen milestone reminders.
- [x] AC-005 Each displayed item shows a date and a label identifying what the item represents.
- [x] AC-006 Each item based on an existing record links to the relevant source context.
- [x] AC-007 The UI distinguishes historical items from future reminders/tasks visually and textually.
- [x] AC-008 Users see a clear empty state when no applicable items exist in the selected date range.
- [x] AC-009 Calendar shows when the latest inspection was performed for the relevant hive/apiary context, including when that latest inspection is outside the currently selected date range.
- [ ] AC-010 Treatment reminder behavior is accepted only after generation rules, copy constraints, and data requirements are explicitly defined.
- [ ] AC-011 Queen milestone behavior is accepted only after generation rules, templates, and required source dates are explicitly defined.

## Implementation plan

Links/prompts generated from this spec:

- [ ] Prompt: Implement route migration by adding `/calendar`, moving current TimeView from `/time` to `/insights`, removing the old Grafana `/insights` route, and updating root navigation. Verify with route/menu tests.
- [ ] Prompt: Implement Calendar v1 item mapping for inspections and hive log entries with bounded initial loading, historical item labels, source-context links, inspection recency indicators, and empty/populated acceptance coverage.
- [ ] Prompt: Define and implement treatment-generated reminder rules after REQ-F-009 is resolved, including required treatment data fields, legally cautious localized copy, generated-item labels, and tests.
- [ ] Prompt: Define and implement queen milestone reminder rules after REQ-F-010 is resolved, including required source dates, milestone templates, generated-item labels, and tests.
