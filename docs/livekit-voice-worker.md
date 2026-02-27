# LiveKit Voice Worker Implementation

Implementation guide for in-app voice calling using LiveKit + LiveKit Agents.

## Overview

The current voice-worker uses **Twilio PSTN** for phone calls. This doc covers adding **LiveKit** for in-app calling from the Flutter app, which:
- Eliminates per-minute Twilio costs for app users
- Provides lower latency (no PSTN hop)
- Enables richer features (participant events, room metadata)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUTTER APP                                  │
│                   (livekit_client)                               │
│                                                                  │
│   1. Request token from backend                                  │
│   2. Connect to LiveKit room                                     │
│   3. Publish audio track                                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   LIVEKIT CLOUD                                  │
│               (wss://xxx.livekit.cloud)                          │
│                                                                  │
│   • Handles WebRTC signaling                                     │
│   • Routes audio between participants                            │
│   • Dispatches agent when participant joins                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│               LIVEKIT AGENTS SERVER                              │
│                    (Node.js)                                     │
│                                                                  │
│   1. Receive room join event from LiveKit                        │
│   2. Fetch user context from Supabase                            │
│   3. Start voice pipeline: STT → LLM → TTS                       │
│   4. Stream audio back to room                                   │
│   5. Save transcript on disconnect                               │
└─────────────────────────────────────────────────────────────────┘
```

## Components to Build

### 1. Token Server Endpoint (apps/web or apps/voice-worker)

Add a `/api/livekit/token` endpoint that:
- Authenticates the user (via Supabase JWT)
- Creates a unique room name
- Generates a LiveKit token with publish permissions
- Stores call context in Supabase (like current `call_context` table)

```typescript
// Example: apps/web/app/api/livekit/token/route.ts
import { AccessToken } from 'livekit-server-sdk';

export async function POST(req: Request) {
  const { userId, callType } = await req.json();

  // Generate room name
  const roomName = `conneczen-${userId}-${Date.now()}`;

  // Create call context in Supabase (for agent to fetch)
  const { data: context } = await supabase
    .from('call_context')
    .insert({
      user_id: userId,
      room_name: roomName,
      call_type: callType, // 'morning' | 'evening' | 'on_demand'
      instructions: await buildInstructions(userId, callType),
    })
    .select()
    .single();

  // Generate LiveKit token
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: userId, ttl: '1h' }
  );

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return Response.json({
    token: await token.toJwt(),
    roomUrl: process.env.LIVEKIT_URL,
    roomName,
    contextId: context.id,
  });
}
```

### 2. LiveKit Agents Worker (apps/livekit-worker)

New app using `@livekit/agents` SDK:

```typescript
// apps/livekit-worker/agent.ts
import { WorkerOptions, defineAgent, llm, multimodal } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import { createClient } from '@supabase/supabase-js';

export default defineAgent({
  entry: async (ctx) => {
    // Wait for user to connect
    await ctx.waitForParticipant();

    // Get room name to fetch context
    const roomName = ctx.room.name;

    // Fetch instructions from Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!
    );

    const { data: context } = await supabase
      .from('call_context')
      .select('instructions, user_id')
      .eq('room_name', roomName)
      .single();

    // Create voice assistant with OpenAI Realtime
    const assistant = new multimodal.MultimodalAgent({
      model: new openai.realtime.RealtimeModel({
        instructions: context?.instructions || 'You are a supportive coach.',
        voice: 'verse',
        turnDetection: {
          type: 'server_vad',
          threshold: 0.5,
          silenceDurationMs: 500,
        },
      }),
    });

    // Start the assistant
    const session = await assistant.start(ctx.room, ctx.participant);

    // Handle transcript events
    session.on('transcript', (transcript) => {
      console.log('Transcript:', transcript);
      // Save to Supabase for analytics
    });

    // Wait for disconnect
    await ctx.waitForDisconnect();

    // Save final transcript
    console.log('Call ended for room:', roomName);
  },
});
```

### 3. Worker Entry Point

```typescript
// apps/livekit-worker/index.ts
import { WorkerOptions, cli, defineAgent } from '@livekit/agents';
import agent from './agent';

cli.runApp(
  new WorkerOptions({
    agent,
    // Connect to LiveKit Cloud
    wsUrl: process.env.LIVEKIT_URL,
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
  })
);
```

### 4. Package.json for livekit-worker

```json
{
  "name": "conneczen-livekit-worker",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "npx livekit-agents dev",
    "start": "npx livekit-agents start"
  },
  "dependencies": {
    "@livekit/agents": "^0.4.0",
    "@livekit/agents-plugin-openai": "^0.4.0",
    "@supabase/supabase-js": "^2.86.0",
    "dotenv": "^17.2.3"
  }
}
```

## Environment Variables

Add to `.env`:

```bash
# LiveKit Cloud
LIVEKIT_URL=wss://conneczen-z2t6bdrf.livekit.cloud
LIVEKIT_API_KEY=APIQ5JYTE4w9XXz
LIVEKIT_API_SECRET=<your-secret>

# Existing
OPENAI_API_KEY=<your-key>
SUPABASE_URL=<your-url>
SUPABASE_SERVICE_ROLE=<your-key>
```

## Flutter Integration

The Flutter app (separate repo) uses `livekit_client`:

```dart
// 1. Get token from backend
final response = await http.post(
  Uri.parse('$backendUrl/api/livekit/token'),
  body: jsonEncode({'userId': userId, 'callType': 'morning'}),
);
final data = jsonDecode(response.body);

// 2. Connect to room
final room = Room();
await room.connect(data['roomUrl'], data['token']);

// 3. Enable microphone
await room.localParticipant?.setMicrophoneEnabled(true);

// 4. Agent automatically joins and starts conversation
```

## Deployment

### LiveKit Agents Deployment Options

1. **LiveKit Cloud Agents (Recommended for MVP)**
   - Deploy agent code to LiveKit Cloud
   - Auto-scales, managed infrastructure
   - `npx livekit-agents deploy`

2. **Self-hosted**
   - Run on Railway, Render, or Fly.io
   - Need persistent process (not serverless)
   - `npx livekit-agents start`

### Running Locally

```bash
# Terminal 1: Start agent worker
cd apps/livekit-worker
npm install
npm run dev

# Terminal 2: Start Next.js app (for token endpoint)
cd apps/web
yarn dev

# Terminal 3: Run Flutter app
cd /path/to/flutter-app
./run_dev.sh
```

## Migration Path

| Phase | PSTN (Twilio) | In-App (LiveKit) |
|-------|---------------|------------------|
| Current | ✅ Working | ❌ Not built |
| Phase 1 | ✅ Keep for phone calls | ✅ Build for Flutter app |
| Phase 2 | ✅ Fallback option | ✅ Primary for app users |
| Future | Optional | Primary |

## Cost Comparison

| Method | Per-minute | 10 min/day/user/month |
|--------|------------|----------------------|
| Twilio PSTN | ~$0.07 | ~$21 |
| LiveKit Cloud | ~$0.02-0.04 | ~$6-12 |
| OpenAI Realtime | ~$0.16 | ~$48 |

## Open Questions

1. **Agent hosting**: LiveKit Cloud Agents vs self-hosted?
2. **Token endpoint**: Add to `apps/web` API routes or separate service?
3. **Transcript storage**: Real-time to Supabase or batch on disconnect?
4. **Room cleanup**: Auto-delete rooms after call ends?

## References

- [LiveKit Agents Docs](https://docs.livekit.io/agents/)
- [LiveKit Agents JS SDK](https://github.com/livekit/agents-js)
- [livekit_client Flutter](https://pub.dev/packages/livekit_client)
- [OpenAI Realtime Plugin](https://docs.livekit.io/agents/plugins/openai/)
