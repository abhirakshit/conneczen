"use server";

import { createSSRClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { runAnalysisForUser } from "@/lib/services/analyst";
import { getLatestBriefing, needsAnalysis } from "@/lib/queries/briefings";
import type { CoachBriefing, AnalystBriefing } from "@/types/database";

interface TriggerAnalysisResult {
  success: boolean;
  briefing?: CoachBriefing;
  error?: string;
}

interface GetBriefingResult {
  success: boolean;
  briefing?: CoachBriefing | null;
  needsAnalysis?: boolean;
  error?: string;
}

/**
 * Trigger analysis for the current user
 * Creates a new briefing if there are new sessions since the last analysis
 */
export async function triggerAnalysis(): Promise<TriggerAnalysisResult> {
  try {
    const supabase = await createSSRClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if analysis is needed
    const needs = await needsAnalysis(user.id);
    if (!needs) {
      const { briefing } = await getLatestBriefing(user.id);
      return {
        success: true,
        briefing: briefing || undefined,
      };
    }

    // Run analysis
    const result = await runAnalysisForUser(user.id);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Get the new briefing
    const { briefing } = await getLatestBriefing(user.id);

    // Revalidate relevant pages
    revalidatePath("/dashboard");

    return {
      success: true,
      briefing: briefing || undefined,
    };
  } catch (error) {
    console.error("Error in triggerAnalysis:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get the current user's latest briefing
 */
export async function getCurrentBriefing(): Promise<GetBriefingResult> {
  try {
    const supabase = await createSSRClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const [{ briefing }, needs] = await Promise.all([
      getLatestBriefing(user.id),
      needsAnalysis(user.id),
    ]);

    return {
      success: true,
      briefing,
      needsAnalysis: needs,
    };
  } catch (error) {
    console.error("Error in getCurrentBriefing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if the current user needs analysis
 */
export async function checkNeedsAnalysis(): Promise<{ needsAnalysis: boolean; error?: string }> {
  try {
    const supabase = await createSSRClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { needsAnalysis: false, error: "Not authenticated" };
    }

    const needs = await needsAnalysis(user.id);
    return { needsAnalysis: needs };
  } catch (error) {
    console.error("Error in checkNeedsAnalysis:", error);
    return {
      needsAnalysis: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
