"use server";

import { createSSRClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CallStatus, SessionType } from "@/types/database";

interface CreateSessionResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

interface UpdateSessionResult {
  success: boolean;
  error?: string;
}

/**
 * Create a new session when a call starts
 * @param sessionType - Type of session: "ioa" for identity onboarding, "regular" for reflection
 */
export async function createSession(
  sessionType: SessionType = "regular"
): Promise<CreateSessionResult> {
  try {
    const supabase = await createSSRClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Create session with "initiated" status
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        session_type: sessionType,
        started_at: new Date().toISOString(),
        call_status: "initiated" as CallStatus,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return { success: false, error: error.message };
    }

    return { success: true, sessionId: data.id };
  } catch (err) {
    console.error("Error in createSession:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Update session when call ends
 */
export async function completeSession(
  sessionId: string,
  transcript?: string
): Promise<UpdateSessionResult> {
  try {
    const supabase = await createSSRClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Update session with completed status and end time
    const { error } = await supabase
      .from("sessions")
      .update({
        ended_at: new Date().toISOString(),
        call_status: "completed" as CallStatus,
        transcript: transcript || null,
      })
      .eq("id", sessionId)
      .eq("user_id", user.id); // Ensure ownership

    if (error) {
      console.error("Error completing session:", error);
      return { success: false, error: error.message };
    }

    // Revalidate dashboard and sessions pages
    revalidatePath("/dashboard");
    revalidatePath("/sessions");

    return { success: true };
  } catch (err) {
    console.error("Error in completeSession:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Mark session as failed (e.g., user declined, connection error)
 */
export async function failSession(
  sessionId: string,
  status: "failed" | "declined" = "failed"
): Promise<UpdateSessionResult> {
  try {
    const supabase = await createSSRClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("sessions")
      .update({
        ended_at: new Date().toISOString(),
        call_status: status as CallStatus,
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error failing session:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in failSession:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Update session with AI summary after analysis
 */
export async function updateSessionSummary(
  sessionId: string,
  summaryJson: Record<string, unknown>,
  mentalState?: Record<string, unknown>,
  nextQuestions?: string[]
): Promise<UpdateSessionResult> {
  try {
    const supabase = await createSSRClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("sessions")
      .update({
        summary_json: summaryJson,
        mental_state: mentalState || null,
        next_questions: nextQuestions || null,
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating session summary:", error);
      return { success: false, error: error.message };
    }

    // Revalidate session detail page
    revalidatePath(`/sessions/${sessionId}`);

    return { success: true };
  } catch (err) {
    console.error("Error in updateSessionSummary:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
