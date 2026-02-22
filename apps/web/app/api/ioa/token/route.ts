import { createSSRClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getIdentityDraftForContext } from "@/lib/queries/identity";
import { getLatestSessionSummary } from "@/lib/queries/sessions";
import type { IdentityDraft } from "@conneczen/types";
import type { Json } from "@/types/database";

const openai = new OpenAI();

// IOA System Prompt (from ioa.ts agent definition)
const IOA_SYSTEM_PROMPT = `You are the Identity Onboarding Agent (IOA).

Your sole responsibility is to help the user clarify who they are and what they want to work on, so the system can route them to the correct long-term coach.

You are NOT a therapist, NOT a diagnostician, and NOT a motivational speaker.

# Hard Boundaries

You MUST NOT:
- Diagnose conditions or assign labels
- Give advice on behavior change
- Provide coping strategies
- Promise outcomes or guarantees
- Act as a long-term coach
- Push urgency or pressure

You MAY:
- Ask reflective questions
- Rephrase and summarize user statements
- Highlight contradictions gently
- Propose draft identity statements
- Ask for confirmation or clarification

# Required Information to Collect

You need to gather these pieces of information naturally through conversation:
1. Preferred name - what they want to be called
2. Primary struggle - in their own words, what's weighing on them
3. Desired direction - where they want to move toward (NOT a goal)
4. Readiness level - how ready they feel to work on this (ask on a scale of 1-5)
5. Time availability - how much time/energy they have (low, medium, high)

# Conversation Flow

## Phase 1: Orientation (brief)
- Introduce yourself and your role
- Set expectations: you're here to understand them, not to coach or fix anything yet
- Emphasize they're in control

Example: "Hi, I'm here to help you get clear on what you want to work on. I won't be coaching you directly—my job is just to understand where you're at so we can connect you with the right support. Sound good?"

## Phase 2: Exploration
Ask open-ended questions:
- "What's been weighing on you most lately?"
- "If one area of your life improved, which would matter most right now?"
- "What have you already tried, if anything?"

Let them talk. Do not rush. Use save_identity_draft to record information as you learn it.

## Phase 3: Reflection
- Summarize what they've said
- Surface any inconsistencies neutrally
- Ask if your understanding is accurate

Example: "So it sounds like you've been struggling with [X], and you'd like to move toward [Y]. Does that feel accurate?"

## Phase 4: Confirmation
When you have all required information:
1. Propose a brief identity statement
2. Ask explicitly if it feels accurate enough to move forward
3. Mention this is coaching, not therapy or medical care
4. If they confirm, call request_confirmation with the summary

Example: "Before we move on, I want to make sure you know this is a coaching service—it's about reflection and structure, not medical or psychological treatment. Does that work for you?"

# If They Ask for Advice

If the user asks for advice or solutions:
1. Acknowledge their request warmly
2. Explain your role boundary briefly
3. Redirect back to understanding them

Example: "I hear you wanting some direction on that. Right now I'm focused on understanding your situation so we can match you with a coach who can really help. Can you tell me more about [redirect]?"

# Failure Handling

If identity cannot be clarified:
- Do not force completion
- Suggest they take time and return when ready
- Leave identity in draft status

# Tone

- Calm and neutral
- Respectful and non-authoritative
- No jargon or urgency
- Psychologically safe

Your job ends when identity is sufficiently clear and explicitly confirmed by the user.`;

/**
 * Build IOA system prompt with context injection for returning users
 */
function buildIOAPromptWithContext({
  identityDraft,
  previousSessionSummary,
  userName,
  isReturningUser,
}: {
  identityDraft: IdentityDraft | null;
  previousSessionSummary: Json | null;
  userName: string | null;
  isReturningUser: boolean;
}): string {
  let prompt = IOA_SYSTEM_PROMPT;

  if (isReturningUser && (identityDraft || previousSessionSummary)) {
    prompt += `\n\n# Context from Previous Sessions\n\n`;
    prompt += `You are continuing a conversation with a returning user. `;
    prompt += `Start by warmly greeting them, briefly acknowledging what you discussed before, and asking how they're feeling about it.\n\n`;

    if (identityDraft) {
      prompt += `## Identity Draft (collected so far)\n`;
      prompt += `The following information was gathered in previous sessions:\n`;
      if (identityDraft.preferred_name) {
        prompt += `- **Preferred name**: ${identityDraft.preferred_name}\n`;
      }
      if (identityDraft.primary_struggle) {
        prompt += `- **Primary struggle**: ${identityDraft.primary_struggle}\n`;
      }
      if (identityDraft.desired_direction) {
        prompt += `- **Desired direction**: ${identityDraft.desired_direction}\n`;
      }
      if (identityDraft.readiness_level) {
        prompt += `- **Readiness level**: ${identityDraft.readiness_level}/5\n`;
      }
      if (identityDraft.time_availability) {
        prompt += `- **Time availability**: ${identityDraft.time_availability}\n`;
      }
      prompt += `\n`;
    }

    if (previousSessionSummary) {
      prompt += `## Last Session Summary\n`;
      prompt += `Here's what was discussed in the previous session:\n`;
      prompt += `\`\`\`json\n${JSON.stringify(previousSessionSummary, null, 2)}\n\`\`\`\n\n`;
    }

    prompt += `## Your Opening for This Session\n`;
    prompt += `- Greet them warmly by name if known\n`;
    prompt += `- Briefly summarize what you learned about them last time (1-2 sentences)\n`;
    prompt += `- Ask if anything has changed or if they'd like to continue where you left off\n`;
    prompt += `- Continue gathering any missing identity information naturally\n`;

    // Add guidance based on what's missing
    const missingFields: string[] = [];
    if (!identityDraft?.preferred_name) missingFields.push("preferred name");
    if (!identityDraft?.primary_struggle) missingFields.push("primary struggle");
    if (!identityDraft?.desired_direction) missingFields.push("desired direction");
    if (!identityDraft?.readiness_level) missingFields.push("readiness level");
    if (!identityDraft?.time_availability) missingFields.push("time availability");

    if (missingFields.length > 0) {
      prompt += `\n## Still Needed\n`;
      prompt += `You still need to gather: ${missingFields.join(", ")}.\n`;
      prompt += `Work these into the conversation naturally.\n`;
    } else {
      prompt += `\n## Ready for Confirmation\n`;
      prompt += `You have all required identity information. After greeting and checking in, `;
      prompt += `you can move to the Confirmation phase if the user is ready.\n`;
    }
  } else if (userName) {
    // First-time user with known name
    prompt += `\n\n# User Info\n`;
    prompt += `The user's name is ${userName}. You may greet them by name.\n`;
  }

  return prompt;
}

// Tool definitions for IOA
const IOA_TOOLS = [
  {
    type: "function" as const,
    name: "save_identity_draft",
    description: "Save or update the user's identity profile as a draft. Call this when you have gathered identity information from the user. The draft can be updated multiple times during the conversation. Fields not provided will retain their previous values.",
    parameters: {
      type: "object",
      properties: {
        preferred_name: {
          type: "string",
          description: "The name the user wants to be called"
        },
        primary_struggle: {
          type: "string",
          description: "User's self-described core struggle, in their own words"
        },
        desired_direction: {
          type: "string",
          description: "The direction the user wants to move toward (not a goal)"
        },
        readiness_level: {
          type: "number",
          minimum: 1,
          maximum: 5,
          description: "Self-reported readiness to engage (1-5)"
        },
        time_availability: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Rough estimate of time/energy available"
        }
      },
      required: []
    }
  },
  {
    type: "function" as const,
    name: "request_confirmation",
    description: "Call this when you have gathered all required identity information and the user has verbally agreed that the identity summary is accurate. This will prompt the user to confirm their identity via the UI. Only call this after: (1) you have a preferred name, (2) a primary struggle, (3) a desired direction, (4) the user has acknowledged this is coaching (not therapy).",
    parameters: {
      type: "object",
      properties: {
        identity_summary: {
          type: "string",
          description: "A 1-2 sentence neutral summary of the user's identity and direction"
        },
        coach_recommendation: {
          type: "object",
          properties: {
            coach_type: {
              type: "string",
              description: "Recommended coach type (e.g., 'foundational', 'addiction', 'health')"
            },
            reasoning: {
              type: "string",
              description: "One sentence explaining why this coach type is appropriate"
            }
          },
          required: ["coach_type", "reasoning"]
        }
      },
      required: ["identity_summary", "coach_recommendation"]
    }
  }
];

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

    // Fetch user profile for personalization
    const { data: profile } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();

    // Fetch context for returning users
    const [identityDraft, lastSession] = await Promise.all([
      getIdentityDraftForContext(user.id),
      getLatestSessionSummary(user.id, "ioa"),
    ]);

    // Determine if this is a returning user (has previous IOA session or draft)
    const isReturningUser = !!(identityDraft || lastSession);
    const hasExistingDraft = !!identityDraft;

    // Build dynamic system prompt with context injection
    const systemPrompt = buildIOAPromptWithContext({
      identityDraft,
      previousSessionSummary: lastSession?.summary ?? null,
      userName: profile?.name || null,
      isReturningUser,
    });

    // Create ephemeral token with IOA configuration
    const response = await openai.beta.realtime.sessions.create({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "alloy", // IOA uses alloy voice as per the agent definition
      instructions: systemPrompt,
      tools: IOA_TOOLS,
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
      expiresAt: response.client_secret?.expires_at,
      userName: profile?.name || null,
      isReturningUser,
      hasExistingDraft,
    });

  } catch (error) {
    console.error("Error creating IOA session:", error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create IOA session token" },
      { status: 500 }
    );
  }
}
