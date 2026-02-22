import { createSSRClient } from "@/lib/supabase/server";
import { getSummaryGenerationPrompt } from "@conneczen/prompts";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { SessionSummary } from "@conneczen/types";

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
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Fetch session and verify ownership
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, transcript, user_id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if transcript exists
    if (!session.transcript || session.transcript.trim().length === 0) {
      return NextResponse.json(
        { error: "No transcript available for this session" },
        { status: 400 }
      );
    }

    // Generate summary using OpenAI Chat API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: getSummaryGenerationPrompt(),
        },
        {
          role: "user",
          content: `Please analyze this reflection session transcript and generate a summary:\n\n${session.transcript}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    // Parse the summary
    let summary: SessionSummary;
    try {
      summary = JSON.parse(responseContent);
    } catch {
      console.error("Failed to parse summary JSON:", responseContent);
      throw new Error("Invalid summary format from OpenAI");
    }

    // Update session with summary data
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        summary_json: summary,
        mental_state: summary.mental_state,
        next_questions: summary.next_questions,
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update session:", updateError);
      throw new Error("Failed to save summary");
    }

    return NextResponse.json({
      success: true,
      summary,
    });

  } catch (error) {
    console.error("Error generating summary:", error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate summary" },
      { status: 500 }
    );
  }
}
