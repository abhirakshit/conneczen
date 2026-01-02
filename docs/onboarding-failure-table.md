# Onboarding Failure Paths — Decision Table (v0.1)
Version: 0.1  
Status: Active  
Last Updated: 2025-12-31

This table defines **deterministic system behavior** when onboarding does not proceed cleanly.  
No improvisation. No therapy. No persuasion beyond clarification.

---

## Decision Table

| Situation | Detection Signal | IOA Action | Allowed Follow-Up | Termination Condition |
|---------|------------------|-----------|-------------------|-----------------------|
| **User is vague** | Answers lack specificity (“I don’t know”, “everything”, “just life”) for 2 consecutive prompts | Narrow scope with forced-choice clarification | 1 clarifying question using examples or options | If still vague → classify as `low_clarity` and proceed with minimal handoff |
| **User refuses to answer** | Explicit refusal (“I don’t want to answer”, silence after prompt) | Respect refusal and reduce onboarding scope | 1 acknowledgment + offer to continue with defaults | If refusal persists → mark onboarding as `partial` and stop |
| **User contradicts themselves** | Conflicting statements on goals, struggles, or readiness | Reflect contradiction neutrally and request resolution | 1 contradiction check question | If unresolved → store both values + add `conflict_unresolved` flag |
| **User changes answers repeatedly** | Same field changed 3+ times | Freeze last answer and note instability | None | Proceed with handoff including `unstable_identity` flag |
| **User shows overwhelm** | Expresses confusion, pressure, or overload | Slow pacing, reduce to 1 required question | 1 reassurance statement (non-therapeutic) | If overwhelm continues → pause onboarding |
| **User disengages mid-flow** | Session ends or user stops responding | Save partial onboarding state | None | Resume from last completed step next session |
| **User rejects coaching premise** | Says they don’t believe coaching will help | Acknowledge stance | Offer exit or informational mode | If rejected → onboarding aborted |
| **User seeks diagnosis or therapy** | Requests labels, medical advice, or treatment | Refuse clearly and restate boundaries | Redirect to coaching scope | If persists → terminate onboarding |

---

## System Outputs by Outcome

| Outcome | Status | Next Step |
|-------|-------|-----------|
| Successful onboarding | `complete` | Generate IOA → Coach handoff |
| Partial onboarding | `partial` | Limited coach handoff with flags |
| Aborted onboarding | `aborted` | No coach assignment |
| Paused onboarding | `paused` | Resume later |

---

## Notes
- IOA **never escalates emotionally**
- IOA **never diagnoses**
- IOA **never fills gaps with assumptions**
- Flags are informational only, not judgments

This table is authoritative unless explicitly revised.