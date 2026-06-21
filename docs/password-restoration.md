# Task Specification: password-restoration

## Task
design password restoration feature

## Context
- Project: gratheon web-app
- Git branch: password-restoration
- This document is the single source of truth for planning this task before implementation.

## Requirements

### Functional
- [x] REQ-F-001 The user can request a password reset by providing their registered email address.
- [x] REQ-F-002 The system sends an email to the user containing a secure, unique password reset link.
- [x] REQ-F-003 The user clicks the link to navigate to a password restoration page.
- [x] REQ-F-004 On the restoration page, the user enters and confirms a new password to complete the reset.

### Non-functional
#### Performance
- [ ] REQ-NF-PERF-001 No performance requirement captured yet.

#### Security
- [x] REQ-NF-SEC-001 The password reset link must be one-time use and cryptographically secure.
- [x] REQ-NF-SEC-002 Password reset emails should not confirm the existence of an account to unauthenticated users (e.g., generic success message).
- [x] REQ-NF-SEC-003 Password reset links expire exactly 1 hour after creation.
- [x] REQ-NF-SEC-004 The password reset request endpoint must be rate limited to 3 requests per day per user/IP to prevent abuse.
- [x] REQ-NF-SEC-005 Existing active sessions remain valid after a successful password reset.

#### Quality
- [x] REQ-NF-QUAL-001 Keep the change testable, maintainable, and scoped to the task.

#### Complexity
- [x] REQ-NF-CPLX-001 Prefer the simplest design that satisfies approved requirements.

#### Documentation
- [x] REQ-NF-DOC-001 Update user/developer documentation when behavior or workflow changes.

#### UX
- [x] REQ-NF-UX-001 Provide clear feedback when a reset email is successfully requested.
- [x] REQ-NF-UX-002 Handle expired or invalid links gracefully with user-friendly error messages.

## Decisions
- [x] DEC-001 The password restoration flow will use an **Email Link**.
- [x] DEC-002 The password reset link will be valid for 1 hour.
- [x] DEC-003 Password reset requests will be rate limited to 3 per day.
- [x] DEC-004 A successful password reset will **not** invalidate existing active sessions.

## Open questions
- None.

## Ambiguities / risks
- [x] RISK-001 Incomplete requirements may cause rework.

## Acceptance criteria
- [x] AC-001 User can successfully request a password reset and receive an email with a link.
- [x] AC-002 Clicking the link opens a form to enter a new password.
- [x] AC-003 Submitting the form updates the user's password and allows them to log in.
- [x] AC-004 Expired or used links are rejected.
- [x] AC-005 Exceeding the rate limit of 3 reset requests per day returns an appropriate error or generic success to deter enumeration.
- [x] AC-006 Changing the password does not log the user out of their other active sessions.

## Implementation sessions
- [x] Implemented full password restoration flow across `user-cycle`, `graphql-router`, and `web-app` in this branch. Backend stores only hashed reset tokens, expires links after 1 hour, marks links used after reset, applies 3/day rate limiting by email/user/IP, and keeps sessions valid because JWT sessions are not revoked.