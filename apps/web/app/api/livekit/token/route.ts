import { createSSRClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export async function POST(request: Request) {
  try {
    // Validate environment
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      return NextResponse.json(
        { error: "LiveKit not configured" },
        { status: 500 }
      );
    }

    // Authenticate user
    const supabase = await createSSRClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const { callType } = await request.json();

    if (!callType || !["morning", "evening", "on_demand"].includes(callType)) {
      return NextResponse.json(
        { error: "Invalid callType. Must be: morning, evening, or on_demand" },
        { status: 400 }
      );
    }

    // Generate unique room name
    const roomName = `conneczen-${user.id}-${Date.now()}`;

    // Fetch user profile for context
    const { data: profile } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();

    // Build instructions for the voice agent
    const instructions = await buildInstructions(supabase, user.id, callType, profile?.name);

    // Create call context in Supabase (for voice-worker to fetch)
    const { data: context, error: contextError } = await supabase
      .from("call_context")
      .insert({
        user_id: user.id,
        room_name: roomName,
        call_type: callType,
        instructions,
      })
      .select()
      .single();

    if (contextError) {
      console.error("Error creating call context:", contextError);
      return NextResponse.json(
        { error: "Failed to create call context" },
        { status: 500 }
      );
    }

    // Generate LiveKit token
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: user.id,
      ttl: "1h",
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();

    return NextResponse.json({
      token: jwt,
      roomUrl: LIVEKIT_URL,
      roomName,
      contextId: context.id,
      userName: profile?.name || null,
    });

  } catch (error) {
    console.error("Error creating LiveKit token:", error);
    return NextResponse.json(
      { error: "Failed to create LiveKit token" },
      { status: 500 }
    );
  }
}

/**
 * Build coach instructions based on call type and user context
 */
async function buildInstructions(
  supabase: Awaited<ReturnType<typeof createSSRClient>>,
  userId: string,
  callType: string,
  userName: string | null
): Promise<string> {
  // Fetch recent session for context
  const { data: lastSession } = await supabase
    .from("sessions")
    .select("summary, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let instructions = `You are Kai, a supportive and calm voice coach.

Your role is to help the user reflect on their day through gentle conversation.
You are NOT a therapist or medical professional. You're a supportive companion for daily reflection.

## Tone
- Warm and calm
- Non-judgmental
- Curious, not directive
- Brief responses (1-2 sentences, then let them talk)

## Hard Boundaries
- Do NOT diagnose or give medical advice
- Do NOT push if they seem uncomfortable
- Do NOT use shame-based language
- Keep it conversational, not clinical
`;

  if (userName) {
    instructions += `\n## User\nTheir name is ${userName}. Greet them warmly.\n`;
  }

  if (callType === "morning") {
    instructions += `
## Morning Check-in Flow
1. Greet them and ask how they slept
2. Ask what's on their mind for today
3. Gently explore: any intentions or hopes for the day?
4. If they mention challenges, acknowledge without solving
5. End by wishing them well

Keep it light - this is a quick morning touchpoint, not deep work.
`;
  } else if (callType === "evening") {
    instructions += `
## Evening Reflection Flow
1. Greet them and ask how their day went
2. Explore: what went well? what was hard?
3. Ask if anything surprised them today
4. Gently ask: anything they'd do differently?
5. End by acknowledging their reflection

This is processing time, not problem-solving. Let them talk.
`;
  } else {
    instructions += `
## On-Demand Check-in
1. Greet them warmly
2. Ask what prompted them to call
3. Listen and reflect back what you hear
4. Help them process, not solve
5. End when they feel heard

Follow their lead - this is their time.
`;
  }

  if (lastSession?.summary) {
    instructions += `
## Context from Last Session
Here's what was discussed previously:
${JSON.stringify(lastSession.summary, null, 2)}

You may gently reference this if relevant, but don't force it.
`;
  }

  return instructions;
}
