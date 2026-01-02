# Identity – Minimum Required Fields
Version: 0.1  
Status: Active  
Last Updated: 2025-12-31
---

## Purpose
This document defines the **minimum identity data** required to onboard a user safely and effectively into Conneczen, with a focus on **psychological stability, clarity, and long-term coaching effectiveness**.

The goal is to collect **just enough identity signal** to:
- Ground the user
- Avoid premature specialization or overreach
- Enable safe handoff to a coach
- Prevent identity fragmentation later

This is **not** a diagnostic or clinical profile.

---

## Core Principle
> Identity data should reduce confusion, not increase self-analysis.

If a field does not clearly help the system:
- Understand the user’s *direction*
- Maintain psychological safety
- Personalize coaching tone and cadence

…it does **not** belong in the minimum set.

---

## Minimum Identity Fields (Required)

### 1. User ID
**Type:** system-generated  
**Purpose:**
- Stable reference across sessions, agents, and time
- Prevents identity drift

---

### 2. Preferred Name
**Type:** string  
**Why it matters:**
- Establishes agency and respect
- Anchors conversations emotionally
- Reduces depersonalization

**Notes:**
- Must be confirmed verbally by the agent
- Can change later

---

### 3. Primary Struggle (Self-Described)
**Type:** short free text (1–2 sentences)  
**Why it matters:**
- Centers the system on the user’s lived experience
- Avoids premature labeling (e.g., “addiction”, “disorder”)

**Example:**
> “I keep relapsing into habits I hate and feel stuck.”

---

### 4. Desired Direction (Not a Goal)
**Type:** guided free text  
**Why it matters:**
- Focuses on *direction*, not outcomes
- Supports motivation even when goals fail

**Examples:**
- “I want to feel healthier and more in control.”
- “I want to stop feeling ashamed all the time.”

---

### 5. Readiness Level (Self-Assessed)
**Type:** enum or scale (e.g., 1–5)  
**Why it matters:**
- Prevents pushing too hard too fast
- Allows adaptive pacing

**Prompt example:**
> “On a scale of 1–5, how ready do you feel to work on this right now?”

---

### 6. Time Availability (Rough)
**Type:** enum (low / medium / high)  
**Why it matters:**
- Prevents unrealistic plans
- Protects against burnout and shame

---

### 7. Consent Acknowledgement
**Type:** boolean + timestamp  
**Why it matters:**
- Confirms user understands:
    - This is coaching, not therapy
    - No diagnosis or guarantees
- Required for ethical boundary enforcement

---

## Nice-to-Have (Explicitly Deferred)

These are **not required at onboarding** and should be added later **only if useful**.

- Age
- Gender
- Cultural background
- Detailed habit history
- Trauma history
- Medical information
- Moral or spiritual beliefs
- Past failures or timelines

**Reason for deferral:**  
Early over-collection increases cognitive load and can destabilize users who already feel overwhelmed.

---

## Explicitly Excluded
The onboarding process must **not** collect or infer:

- Diagnoses
- Personality labels
- Psychological classifications
- Risk predictions
- “Root causes”
- Clinical severity ratings

These belong to **later reflection**, not initial identity formation.

---

## Success Criteria
Identity data is sufficient if:
- The user feels *seen*, not analyzed
- The system can select an appropriate foundational coach
- The user can start acting without feeling boxed in

---

## Status
Version: v1.0  
Scope: Onboarding Agent (IOA)  
Next Review: After first 20 real users