# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

### Root (Monorepo)
```bash
yarn install          # Install all dependencies
```

**Package Manager**: yarn only. Do not use npm or pnpm. Only `yarn.lock` should exist.

### Web App (apps/web)
```bash
cd apps/web
yarn dev       # Start dev server with Turbopack
yarn build     # Production build with Turbopack
yarn lint      # Run ESLint
yarn start     # Start production server
```

### Voice Worker (apps/voice-worker)
```bash
cd apps/voice-worker
yarn dev      # Start with ts-node-dev (hot reload)
yarn build    # Compile TypeScript
yarn start    # Run compiled server
```

## Architecture Overview

### Monorepo Structure
```
conneczen/
├── apps/
│   ├── web/              # Next.js 16 web application
│   └── voice-worker/     # Express.js Twilio voice server
├── packages/
│   ├── agents/           # AI agent configurations (IOA, Analyst)
│   ├── realtime/         # OpenAI Realtime API client
│   ├── types/            # Shared TypeScript types
│   ├── prompts/          # Agent prompt templates
│   └── utils/            # Shared utilities
└── docs/                 # Specifications and documentation
```

**Path Aliases** (configured in root tsconfig.json):
- `@conneczen/agents` → `packages/agents/index.ts`
- `@conneczen/realtime` → `packages/realtime/index.ts`
- `@conneczen/types` → `packages/types/index.ts`
- `@conneczen/prompts` → `packages/prompts/index.ts`

### Web App Architecture

**Stack**: Next.js 16, React 19, Supabase (auth + database), Zustand (state), shadcn/ui + Radix (components), Tailwind CSS 4, Zod (validation)

**Theme**: Amber/teal color scheme
- Background: `bg-amber-50`
- Text: `text-amber-900`, `text-amber-700`, `text-amber-600`
- Borders: `border-amber-200`
- Primary actions: `bg-teal-600`, `hover:bg-teal-700`
- Badges: `bg-teal-100 text-teal-800` (completed), `bg-amber-100 text-amber-800` (pending)

**Route Groups**:
- `app/auth/` - Login, signup, callback, logout
- `app/(loggedIn)/` - Authenticated routes (checks onboarding status)
- `app/(loggedIn)/onboarding/` - Single-page onboarding form
- `app/(loggedIn)/(protected)/` - Dashboard routes with DashboardShell layout

**Key Directories**:
- `components/dashboard/` - Dashboard UI components (DashboardShell, SessionCard, SettingsForm, etc.)
- `components/call/` - Voice call components (IOACallInterface)
- `lib/actions/` - Server actions (onboarding, settings, sessions, identity)
- `lib/queries/` - Database query functions
- `lib/store/` - Zustand stores (useUserData)
- `lib/supabase/` - Supabase clients and middleware
- `hooks/` - Custom hooks (authContext, useIOACall, useRealtimeCall)

### Supabase Client Usage

**IMPORTANT**: Always use the correct client:

- **Server Components/Actions**: Use `createSSRClient()` from `@/lib/supabase/server`
- **Client Components**: Use `createSSRClient()` from `@/lib/supabase/client` (uses `createBrowserClient`)
- **DO NOT USE**: `createJSClient()` - it doesn't include auth cookies and will fail RLS policies

### Database Tables (Supabase)

- `users` - User profile (name, phone, email)
- `user_settings` - Preferences, timezone, `onboarding_completed` flag
- `user_schedules` - Call schedules with `schedule_type` (morning/evening/custom)
- `sessions` - Voice session records with transcripts, summaries, mental state
- `identity_profiles` - User identity status (for IOA flow)

### Onboarding Flow

**Simplified single-page onboarding** (`/onboarding`):
1. Name and phone number
2. Timezone (auto-detected)
3. Morning check-in time (toggle + time picker)
4. Evening reflection time (toggle + time picker)
5. Privacy acknowledgment + disclaimer checkboxes
6. Submit → creates user, settings, schedules → redirects to dashboard

**Onboarding State Check**:
- Store (`useUserData`) checks `user_settings.onboarding_completed === true`
- If incomplete, `(loggedIn)/layout.tsx` redirects to `/onboarding`
- After completing, call `setOnboardingComplete(true)` before redirect

### Voice Worker Architecture

Handles real-time voice coaching calls:
```
Twilio Call → TwiML <Stream> → WebSocket /media-stream
    → TwilioRealtimeTransportLayer → OpenAI Realtime API
    → RealtimeAgent with instructions from Supabase
```

---

## Key Agents

### IOA - Identity Onboarding Agent
**Purpose**: Establish psychological grounding via voice conversation

**Can**:
- Ask reflective questions
- Create draft identity profiles
- Handle vague or conflicted answers

**Cannot**:
- Diagnose or treat
- Promise outcomes
- Begin coaching

### Coaches
- Operate only after IOA completion
- Receive only structured handoff data
- Single-domain focus (health, addiction, career, etc.)

---

## System Philosophy

This system supports **sustained human agency** for individuals navigating behavioral challenges.

### Core Principles
1. **Identity precedes behavior** - No behavior change without identity coherence
2. **Readiness gates action** - No plans/goals before readiness is established
3. **Shame disables agency** - Any shame-inducing behavior is a system failure
4. **Single-domain focus** - Coach only one behavioral domain at a time
5. **Draft → Confirm lifecycle** - All data starts as draft, confirmed explicitly

### Prohibited Behaviors
- Framing relapse as failure
- Using streaks before readiness
- Comparing users to benchmarks
- Shame-based feedback
- Therapy/diagnosis framing

---

## Component Patterns

### DashboardShell
Clean layout with:
- Mobile: Hamburger menu → sheet sidebar
- Desktop: Fixed 256px sidebar
- User dropdown at bottom of sidebar
- Nav: Dashboard, Sessions, Settings

### Dashboard Cards
- `NextCallCard` - Shows next scheduled call with relative time
- `StartSessionCard` - CTA to start immediate session
- `RecentSessionsCard` - List of recent sessions with summaries
- `SessionDetail` - Full session view with AI summary, mental state, transcript

### Settings Form
- Morning/evening schedule toggles with time pickers
- Timezone selector
- Account info (name, email, phone)

### Landing Page (`app/page.tsx`)
Critical content sections that must not be removed when making visual changes:
1. **"Built for people like you"** - busy professionals, verbal processors, seekers of clarity
2. **"Why other apps don't work"** - reminders ignored, streaks shame, writing is work, too many features
3. **"Grounded in behavioral science"** - implementation intentions, bookend reflection, voice processing

---

## Git Rules

- **Never change git remote URLs** without explicit user permission
- Ask before modifying any git configuration
- If a push fails due to credentials, inform the user - do not attempt workarounds

---

## What NOT to Build

Claude should actively resist:
- Large monolithic schemas
- Premature optimization
- Multi-agent orchestration before IOA is stable
- Hidden heuristics that override user intent
- Silent auto-confirmation of drafts
- Heavy CMS/workflow engines

---

## Final Rule

If you (Claude) are unsure:
- do not guess
- do not invent
- ask for clarification
- or suggest a minimal, reversible step

This system is designed to evolve slowly and safely.
