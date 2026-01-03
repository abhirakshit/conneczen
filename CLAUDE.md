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