# Conneczen Product Specification

## Overview

Conneczen is a voice-first personal reflection and coaching platform. Users receive brief daily phone calls (via Twilio) or browser-based voice sessions to check in with themselves, guided by AI agents.

**Core Value Proposition**: Brief, consistent daily reflection calls that help users stay connected with themselves without the overhead of traditional coaching or therapy apps.

---

## User Journey

### 1. Signup & Onboarding

**Signup**: Email/password or OAuth via Supabase Auth

**Onboarding** (single-page form at `/onboarding`):
- Name
- Phone number (for Twilio calls)
- Timezone (auto-detected, with override)
- Morning check-in time (toggle + time picker, default 7:00 AM)
- Evening reflection time (toggle + time picker, default 8:00 PM)
- Privacy acknowledgment checkbox
- Disclaimer checkbox (not therapy/medical care)

On submit:
- Creates `users` record
- Creates `user_settings` with `onboarding_completed = true`
- Creates 1-2 `user_schedules` records (morning and/or evening)
- Redirects to dashboard

### 2. Dashboard

Clean, minimal interface showing:
- Personalized greeting
- Next scheduled call cards (morning/evening)
- "Start Session Now" button for immediate browser-based calls
- Recent sessions list with AI summaries

### 3. Daily Calls

**Scheduled Calls** (via Twilio):
- Voice worker checks `user_schedules` for due calls
- Initiates outbound call to user's phone
- 3-5 minute guided reflection

**On-Demand Sessions** (browser):
- User clicks "Start Session Now"
- WebRTC connection to OpenAI Realtime API
- Same reflection experience, browser-based

### 4. Session Review

After each session:
- Transcript saved to `sessions` table
- AI generates summary, extracts mental state, suggests follow-up questions
- User can review past sessions at `/sessions`
- Session detail shows: date, duration, AI summary, mental state, questions to explore, full transcript

### 5. Settings

Users can modify:
- Morning/evening call times
- Timezone
- Name
- Phone number

---

## Technical Architecture

### Frontend (apps/web)

**Framework**: Next.js 16 with App Router, React 19, Turbopack

**Auth**: Supabase Auth with SSR session handling

**State**: Zustand store (`useUserData`) for user settings, schedules, onboarding status

**UI**:
- shadcn/ui + Radix primitives
- Tailwind CSS 4
- Amber/teal color scheme

**Layout**: DashboardShell with responsive sidebar

### Backend

**Database**: Supabase (PostgreSQL)

**Voice (Browser)**: OpenAI Realtime API via WebRTC

**Voice (Phone)**:
- Twilio for call initiation/reception
- Voice worker (Express.js) bridges Twilio streams to OpenAI

### Shared Packages

- `@conneczen/types` - TypeScript types for database schema
- `@conneczen/agents` - AI agent configurations
- `@conneczen/realtime` - OpenAI Realtime API client
- `@conneczen/prompts` - Agent prompt templates

---

## Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (matches Supabase auth.users) |
| name | text | Display name |
| phone | text | Phone number for calls |
| email | text | Email address |

### user_settings
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users |
| full_name | text | Full name |
| timezone | text | IANA timezone |
| onboarding_completed | boolean | Has completed onboarding |
| disclaimer_accepted_at | timestamp | When disclaimer was accepted |
| privacy_acknowledged_at | timestamp | When privacy was acknowledged |

### user_schedules
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users |
| schedule_type | enum | 'morning', 'evening', 'custom' |
| call_time_local | time | Time in user's timezone |
| call_time_utc | time | Time in UTC |
| timezone | text | IANA timezone |
| active | boolean | Is this schedule active |

### sessions
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users |
| session_type | enum | 'ioa', 'coaching', 'reflection' |
| call_status | enum | 'pending', 'in_progress', 'completed', 'failed' |
| started_at | timestamp | Session start time |
| ended_at | timestamp | Session end time |
| transcript | text | Full conversation transcript |
| summary_json | jsonb | AI-generated summary |
| mental_state | jsonb | Extracted mental state |
| next_questions | jsonb | Suggested follow-up questions |

---

## AI Agents

### Reflection Agent (Default)
- Guides brief daily check-ins
- Asks open-ended questions about user's day/state
- Summarizes and reflects back
- Non-judgmental, calm tone

### IOA (Identity Onboarding Agent)
- Used for deeper identity discovery sessions
- Establishes psychological grounding
- Creates draft identity profiles
- Skipped in MVP (simplified onboarding)

### Analyst Agent
- Post-session processing
- Generates summaries from transcripts
- Extracts mental state indicators
- Suggests follow-up questions

---

## MVP Scope

### Included
- Email/password signup
- Single-page onboarding (name, phone, timezone, schedule)
- Dashboard with schedule cards
- Browser-based voice sessions via OpenAI Realtime
- Session history with AI summaries
- Settings page

### Deferred
- Twilio outbound calls (voice worker exists but not integrated)
- IOA identity discovery flow
- Multiple coaching domains
- Streak tracking
- Goals/visions
- Push notifications

---

## Design Principles

1. **Voice-first**: Reflection happens through conversation, not typing
2. **Brief & consistent**: 3-5 minute daily calls, not hour-long sessions
3. **Non-judgmental**: No shame, no streaks, no comparisons
4. **Simple**: Minimal UI, clear actions, no feature bloat
5. **Private**: Conversations encrypted, transcripts auto-deleted after 7 days

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page (redirects to /home if logged in) |
| `/auth/login` | Login page |
| `/auth/signup` | Signup page |
| `/auth/callback` | OAuth callback |
| `/home` | Routing hub (redirects to /onboarding or /dashboard) |
| `/onboarding` | Single-page onboarding form |
| `/dashboard` | Main dashboard |
| `/dashboard/sessions` | Sessions list |
| `/dashboard/settings` | Settings form |
| `/sessions/[id]` | Session detail |
| `/call` | Browser-based voice session |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Twilio (voice worker)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```
