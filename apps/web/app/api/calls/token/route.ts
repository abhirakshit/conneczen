import { createSSRClient } from "@/lib/supabase/server";
import {
  getWelcomeCallPrompt,
  buildCoachPromptWithBriefing,
} from "@conneczen/prompts";
import { getLatestBriefing } from "@/lib/queries/briefings";
import { getCoreIdentity } from "@/lib/queries/core-identity";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { CallType } from "@conneczen/types";

const openai = new OpenAI();

export async function POST(request: Request) {
  try {
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
    const body = await request.json();
    const callType: CallType = body.callType || "regular";

    // Fetch user profile for personalization and voice preference
    const [{ data: profile }, { data: settings }] = await Promise.all([
      supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single(),
      supabase
        .from("user_settings")
        .select("voice_preference")
        .eq("user_id", user.id)
        .single(),
    ]);

    const userName = profile?.name || undefined;
    const voicePreference = settings?.voice_preference ?? "ash";

    // Build instructions based on call type
    let instructions: string;

    if (callType === "welcome") {
      // Welcome call uses simple prompt
      instructions = getWelcomeCallPrompt(userName);
    } else {
      // Regular calls get enhanced prompt with analyst briefing and core identity
      const [{ briefing }, { coreIdentity }] = await Promise.all([
        getLatestBriefing(user.id),
        getCoreIdentity(user.id),
      ]);

      instructions = buildCoachPromptWithBriefing({
        userName,
        briefing: briefing?.briefing_json,
        coreIdentity,
      });
    }

    // Create ephemeral token with session configuration
    const response = await openai.beta.realtime.sessions.create({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: voicePreference,
      instructions,
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: {
        model: "whisper-1"
      },
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 700
      }
    });

    return NextResponse.json({
      token: response.client_secret?.value,
      expiresAt: response.client_secret?.expires_at
    });

  } catch (error) {
    console.error("Error creating realtime session:", error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create session token" },
      { status: 500 }
    );
  }
}
