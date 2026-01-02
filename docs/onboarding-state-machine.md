# Onboarding State Machine (v1)

This document defines the minimal, explicit state machine for user onboarding.
It is designed to be deterministic, debuggable, and safe for agent-driven flows.

---

## States

### 1. `started`
**Meaning**
- User has initiated onboarding.
- No meaningful identity data has been captured yet.

**Entry Conditions**
- User account created
- First onboarding interaction triggered (UI or agent)

**Allowed Transitions**
- → `collecting`
- → `stalled`

**Notes**
- This state should be short-lived.
- No assumptions about user intent are allowed here.

---

### 2. `collecting`
**Meaning**
- The system is actively gathering identity, goals, constraints, and preferences.

**Entry Conditions**
- User responds meaningfully to at least one onboarding prompt.

**Allowed Transitions**
- → `completed`
- → `stalled`

**Notes**
- Partial data is expected.
- Identity profiles may exist in `draft` status.
- Conflicting or vague answers do NOT block this state.

---

### 3. `stalled`
**Meaning**
- Onboarding cannot proceed due to insufficient or blocked input.

**Entry Conditions**
- User refuses to answer key questions
- Repeatedly provides vague or contradictory responses
- User abandons onboarding mid-flow (timeout or exit)

**Allowed Transitions**
- → `collecting`
- → `completed` (only if minimum criteria later satisfied)

**Notes**
- This is a recoverable state.
- System should switch to clarification or motivational prompts.
- No escalation to coaching occurs from this state.

---

### 4. `completed`
**Meaning**
- Minimum onboarding success criteria are met.
- A stable identity snapshot is confirmed.

**Entry Conditions**
- Required identity fields captured
- At least one identity profile confirmed
- Coach handoff contract successfully generated

**Allowed Transitions**
- None (terminal)

**Notes**
- This state is irreversible.
- Further changes occur through coaching flows, not onboarding.

---

## Invalid Transitions (Explicitly Disallowed)

- `started` → `completed`
- `completed` → any other state
- `stalled` → `started`

---

## Design Principles

- States reflect **process reality**, not optimism
- Stalling is expected and normal
- Completion requires confirmation, not confidence
- No hidden or implicit states

---

## Related Documents

- `onboarding-success-criteria.md`
- `identity-minimum-fields.md`
- `ioa-boundaries.md`
- `coach-handoff-schema.json`