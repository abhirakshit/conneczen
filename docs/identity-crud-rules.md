# Identity CRUD Rules


---

## Purpose
This document defines **who is allowed to create, update, confirm, and archive identity profiles**, and under what conditions.  
These rules are designed to preserve psychological safety, prevent premature labeling, and maintain clear responsibility boundaries between the system, agents, and the user.

---

## Core Principles

- Identity is **co-created**, not assigned.
- The user always retains **final authority** over their identity.
- Agents may **propose**, **clarify**, and **reflect**, but never enforce.
- Identity changes are **tracked, deliberate, and reversible** until confirmed.

---

## Actors

- **User** — the human using the system
- **IOA (Identity Onboarding Agent)** — responsible for identity discovery and clarification
- **Coach Agent** — operates *after* identity confirmation
- **System** — enforces rules, status transitions, and auditability

---

## Identity Lifecycle States

- `draft` — being explored, not yet confirmed
- `confirmed` — accepted by the user
- `archived` — no longer active but preserved for history

---

## CRUD Boundaries

### 1. Create Identity Profile

**Allowed actors**
- IOA
- System (on first onboarding session)

**Rules**
- Created in `draft` state only
- Must be tied to a specific coaching domain
- One active draft per user per domain
- Creation requires at least minimum identity fields (see `identity-minimum-fields.md`)

**Not allowed**
- Coach agents
- Manual system creation without user interaction

---

### 2. Update Identity Profile

**Allowed actors**
- IOA
- User

**Rules**
- Updates allowed only while status = `draft`
- Updates must be incremental (no full overwrite unless user requests reset)
- Conflicting statements must be flagged, not resolved automatically
- System must preserve previous values for audit/history

**Not allowed**
- Coach agents
- Any updates after confirmation

---

### 3. Confirm Identity Profile

**Allowed actors**
- User (explicit confirmation)
- IOA (only to trigger confirmation request)

**Rules**
- Confirmation requires:
    - Explicit user acknowledgment
    - Clear identity statement
    - No unresolved contradictions
- Once confirmed:
    - Status changes to `confirmed`
    - Profile becomes read-only
    - Coach handoff is triggered

**Not allowed**
- Auto-confirmation by system
- Confirmation by coach agents
- Confirmation if identity confidence is low or user is unsure

---

### 4. Archive Identity Profile

**Allowed actors**
- User
- System (during identity reset or re-onboarding)

**Rules**
- Archived profiles remain immutable
- Exactly one `confirmed` identity per domain may be active at a time
- Archiving a confirmed identity requires:
    - Explicit user intent
    - Reason (optional but recommended)

**Not allowed**
- Silent or automatic archiving
- Deletion of identity records

---

## Coach Access Rules

- Coaches may **read** confirmed identities
- Coaches may **reference** identity statements in sessions
- Coaches may **suggest** identity evolution, but:
    - Must route changes back through IOA
    - Cannot directly modify identity records

---

## Safety Constraints

- No diagnosis, labels, or moral judgments
- No identity inference based on a single session
- No merging identities across domains automatically
- Identity ambiguity defaults to **pause**, not force

---

## Summary Table

| Action    | User | IOA | Coach | System |
|----------|------|-----|-------|--------|
| Create   | ❌   | ✅  | ❌    | ✅     |
| Update   | ✅   | ✅  | ❌    | ❌     |
| Confirm  | ✅   | ⚠️  | ❌    | ❌     |
| Archive  | ✅   | ❌  | ❌    | ⚠️     |

⚠️ = indirect or trigger-only

---

## Related Documents

- `identity-minimum-fields.md`
- `ioa-boundaries.md`
- `ioa-coach-handoff-schema.json`
- `system-doctrine.md` (linked)

---

**Status:** Draft v0.1  
**Next update:** After onboarding flow implementation