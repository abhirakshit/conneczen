# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

### Root (Monorepo)
```bash
yarn install          # Install all dependencies
```

### Web App (apps/web)
```bash
yarn --cwd apps/web dev       # Start dev server with Turbopack
yarn --cwd apps/web build     # Production build with Turbopack
yarn --cwd apps/web lint      # Run ESLint
yarn --cwd apps/web start     # Start production server
```

### Voice Worker (apps/voice-worker)
```bash
yarn --cwd apps/voice-worker dev      # Start with ts-node-dev (hot reload)
yarn --cwd apps/voice-worker build    # Compile TypeScript
yarn --cwd apps/voice-worker start    # Run compiled server
```

## Architecture Overview

### Monorepo Structure
- **apps/web**: Next.js 15.5 web application (React 19, Turbopack)
- **apps/voice-worker**: Express.js server for real-time voice coaching via Twilio SIP + OpenAI Realtime API
- **packages/agents**: AI agent configurations
- **packages/utils**: Shared utilities

Path aliases: `@conneczen/agents/*` and `@conneczen/utils/*` map to respective packages.

### Web App Architecture

**Stack**: Next.js 15 App Router, React 19, Supabase (auth + database), Zustand (state), shadcn/ui + Radix (components), Tailwind CSS 4, Zod (validation)

**Route Groups**:
- `app/auth/` - Login, signup, callback, logout
- `app/(loggedIn)/` - Authenticated user routes
- `app/(loggedIn)/(protected)/` - Routes requiring complete onboarding (dashboard, charts, account, settings)

**Key Directories**:
- `lib/agentConfigs/` - AI agent prompt configurations (Kai addiction coach, chat supervisor, etc.)
- `lib/supabase/` - Client/server Supabase instances and middleware
- `lib/store/` - Zustand stores (useUserData, useUserProgress)
- `hooks/` - Custom hooks (authContext, useRealtimeSession, useOnboardingCheck)

**Authentication**: Supabase Auth with SSR session refresh in middleware. Role-based access via `getUserRole()`.

### Voice Worker Architecture

Handles real-time voice coaching calls:
```
Twilio Call → TwiML <Stream> → WebSocket /media-stream
    → TwilioRealtimeTransportLayer → OpenAI Realtime API
    → RealtimeAgent with instructions from Supabase call_context table
```

### Database Tables (Supabase)
- `user_settings` - User preferences, timezone, coach type
- `user_schedules` - Call schedules
- `identity_profiles` - User identity status
- `session_transcripts` - Voice session transcripts
- `call_context` - Call instructions for agents
- `user_roles` - Role definitions

## System Philosophy (from docs/system-doctrine.md)

This system supports **sustained human agency** for individuals navigating behavioral challenges. Key principles:

1. **Identity precedes behavior** - No behavior change without identity coherence
2. **Readiness gates action** - No plans/goals before readiness is established
3. **Shame disables agency** - Any shame-inducing behavior is a system failure
4. **Single-domain focus** - Coach only one behavioral domain at a time
5. **Lossy handoffs** - Agents intentionally don't share full context to preserve autonomy

**Agent Roles**:
- **IOA (Identity & Orientation Agent)**: Establishes identity, no goals/plans/tracking
- **Foundational Coach**: Reduces shame, stabilizes motivation
- **Domain Coach**: Tactical planning for a single domain (requires readiness)

**Prohibited Behaviors**: Framing relapse as failure, using streaks before readiness, comparing users to benchmarks, shame-based feedback.

## AI Agent Configuration Pattern

Agents in `lib/agentConfigs/` follow this structure:
- `index.ts` - Agent config with name, voice, instructions, tools, conversation states
- Tools use Zod schemas for inputs
- Conversation states define flow (intro → understand → plan → checkin)

## Environment Setup

Requires `.env.local` files in apps with Supabase and OpenAI credentials.


## Core Design Principles (Non-Negotiable)

### 1. Voice-First
- Onboarding happens via **conversation**, not forms
- AI agents interpret, summarize, and structure user input
- UI only confirms or visualizes agent output

### 2. Draft → Confirm Lifecycle
- All meaningful user data starts as `draft`
- Nothing is assumed permanent until **explicitly confirmed**
- This applies to:
    - identity profiles
    - settings
    - schedules
    - goals
    - visions

### 3. Separation of Responsibility
- **Onboarding Agent (IOA)** gathers identity
- **Coaches** act only after identity is confirmed
- No agent does therapy, diagnosis, or medical advice

### 4. Minimal State, Explicit Transitions
- Avoid hidden magic
- State transitions must be:
    - explicit
    - inspectable
    - reversible where possible

---

## Key Agents

### IOA — Identity Onboarding Agent
**Purpose**
- Establish psychological grounding
- Extract identity signals
- Prepare user for coaching

**Can**
- Ask reflective questions
- Create draft identity profiles
- Handle vague or conflicted answers
- Stall safely if user is not ready

**Cannot**
- Diagnose
- Treat addiction or mental illness
- Promise outcomes
- Begin coaching proper

### Coaches
- Operate only after IOA completion
- Receive **only structured handoff data**
- Never re-interpret identity unless explicitly asked

---

## Identity Model

Identity is **domain-scoped**, not global.

Examples:
- health
- addiction
- career
- relationships
- mental_health

Each identity profile:
- belongs to one domain
- has a lifecycle: `draft → confirmed → archived`
- may evolve, but only via explicit user consent

---

## Onboarding State Machine

States:
- `started`
- `collecting`
- `stalled`
- `completed`

Rules:
- No skipping states
- Stalled is a valid outcome
- Completion requires confirmed identity + minimum settings

---

## Data Ownership Rules

- Users own their data
- Agents may propose, not impose
- System must tolerate:
    - contradiction
    - uncertainty
    - slow progress

---

## What NOT to Build

Claude should actively resist:
- Large monolithic schemas
- Premature optimization
- Multi-agent orchestration before IOA is stable
- Hidden heuristics that override user intent
- Silent auto-confirmation of drafts

---

## Acceptable Technical Stack Decisions

- Next.js App Router
- Supabase (Postgres + Auth)
- Zustand for client state
- Server-side enforcement of onboarding
- WebRTC / Realtime voice for web
- Twilio for phone (later)

Do **not** introduce:
- CMS platforms
- workflow engines
- heavy state machines
  unless explicitly requested

---

## How to Extend the System Safely

When adding a feature, ask:
1. Does this respect draft → confirm?
2. Does this increase or reduce cognitive load?
3. Does an agent or a human own this decision?
4. Is this reversible?

If unclear, **pause and ask**.

---

## Tone and Behavior for AI Agents

Agents must be:
- calm
- grounded
- non-judgmental
- precise
- conservative in claims

Avoid:
- hype language
- therapy framing
- absolute statements
- moralizing

---

## Git Rules

- **Never change git remote URLs** without explicit user permission
- Ask before modifying any git configuration (remotes, hooks, config)
- If a push fails due to credentials, inform the user - do not attempt workarounds

---

## Final Rule

If you (Claude) are unsure:
- do not guess
- do not invent
- ask for clarification
- or suggest a minimal, reversible step

This system is designed to evolve slowly and safely.