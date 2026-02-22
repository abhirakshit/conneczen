/**
 * Analyst Service
 *
 * Core logic for running the Analyst Agent to generate coaching briefings.
 * This service is called by cron jobs and on-demand API endpoints.
 *
 * Also updates core_identity with synthesized insights.
 */

import OpenAI from "openai";
import { createSSRClient } from "@/lib/supabase/server";
import {
  ANALYST_SYSTEM_PROMPT,
  buildAnalystUserMessage,
  validateAnalystOutput,
  createDefaultOutput,
  type AnalystOutput,
  type IdentitySynthesis,
} from "@conneczen/agents";
import { getCoreIdentity } from "@/lib/queries/core-identity";
import { updateCoreIdentitySynthesis } from "@/lib/actions/core-identity";
import type { AnalystBriefing, Session, RiskLevel } from "@/types/database";

const openai = new OpenAI();

// Number of sessions to analyze
const SESSIONS_TO_ANALYZE = 5;

// Minimum sessions required for meaningful analysis
const MIN_SESSIONS_FOR_ANALYSIS = 2;

interface AnalysisResult {
  success: boolean;
  briefing?: AnalystBriefing;
  identitySynthesis?: IdentitySynthesis;
  sessionIds?: string[];
  error?: string;
}

interface BatchAnalysisResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: { userId: string; error: string }[];
}

/**
 * Analyze sessions for a single user and generate a briefing + identity synthesis
 */
export async function analyzeUserSessions(userId: string): Promise<AnalysisResult> {
  try {
    const supabase = await createSSRClient();

    // Fetch user's core identity
    const { coreIdentity } = await getCoreIdentity(userId);

    // Fetch recent completed sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("call_status", "completed")
      .order("started_at", { ascending: false }) // Fetch newest first for recency
      .limit(SESSIONS_TO_ANALYZE);

    if (sessionsError) {
      return { success: false, error: `Failed to fetch sessions: ${sessionsError.message}` };
    }

    if (!sessions || sessions.length < MIN_SESSIONS_FOR_ANALYSIS) {
      const defaultOutput = createDefaultOutput(
        `Insufficient sessions (${sessions?.length || 0}/${MIN_SESSIONS_FOR_ANALYSIS} required)`
      );
      return {
        success: true,
        briefing: defaultOutput.briefing,
        identitySynthesis: defaultOutput.identity_synthesis,
        sessionIds: sessions?.map((s) => s.id) || [],
      };
    }

    const orderedSessions = [...sessions].reverse();

    // Build the analysis request
    const userMessage = buildAnalystUserMessage({
      coreIdentity,
      sessions: orderedSessions as Session[],
    });

    // Call GPT-4o for analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: ANALYST_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7, // Some creativity for insights
      max_tokens: 2500, // Increased for identity synthesis
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No response from analyst model" };
    }

    // Parse and validate the response
    let output: AnalystOutput;
    try {
      const parsed = JSON.parse(content);
      if (!validateAnalystOutput(parsed)) {
        console.error("Invalid analyst output structure:", parsed);
        return { success: false, error: "Invalid analyst output structure from model" };
      }
      output = parsed;
    } catch (parseError) {
      console.error("Failed to parse analyst response:", parseError);
      return { success: false, error: "Failed to parse analyst response" };
    }

    return {
      success: true,
      briefing: output.briefing,
      identitySynthesis: output.identity_synthesis,
      sessionIds: orderedSessions.map((s) => s.id),
    };
  } catch (error) {
    console.error("Error in analyzeUserSessions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Save a briefing to the database
 */
export async function saveBriefing(
  userId: string,
  briefing: AnalystBriefing,
  sessionIds: string[]
): Promise<{ success: boolean; briefingId?: string; error?: string }> {
  try {
    const supabase = await createSSRClient();

    const { data, error } = await supabase
      .from("coach_briefings")
      .insert({
        user_id: userId,
        sessions_analyzed: sessionIds,
        briefing_json: briefing,
        suggested_opening: briefing.suggested_opening,
        risk_level: briefing.risk_indicators.level as RiskLevel,
        primary_theme: briefing.key_themes[0]?.theme || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error saving briefing:", error);
      return { success: false, error: error.message };
    }

    return { success: true, briefingId: data.id };
  } catch (error) {
    console.error("Error in saveBriefing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Run analysis for a single user, save the briefing, and update core_identity
 */
export async function runAnalysisForUser(
  userId: string
): Promise<{ success: boolean; briefingId?: string; error?: string }> {
  // Generate the briefing and identity synthesis
  const analysisResult = await analyzeUserSessions(userId);

  if (!analysisResult.success || !analysisResult.briefing) {
    return { success: false, error: analysisResult.error || "Analysis failed" };
  }

  // Save the briefing
  const saveResult = await saveBriefing(
    userId,
    analysisResult.briefing,
    analysisResult.sessionIds || []
  );

  if (!saveResult.success) {
    return saveResult;
  }

  // Update core_identity with synthesis (if available)
  if (analysisResult.identitySynthesis) {
    const synthesis = analysisResult.identitySynthesis;

    // Only update fields that have values
    const synthesisUpdate: {
      values_summary?: string;
      life_stage?: string;
      primary_domain?: "career" | "relationships" | "health" | "purpose" | "finance";
      overall_clarity?: number;
      flags?: string[];
    } = {};

    if (synthesis.values_summary) {
      synthesisUpdate.values_summary = synthesis.values_summary;
    }
    if (synthesis.life_stage) {
      synthesisUpdate.life_stage = synthesis.life_stage;
    }
    if (synthesis.primary_domain) {
      synthesisUpdate.primary_domain = synthesis.primary_domain;
    }
    if (synthesis.overall_clarity !== null) {
      synthesisUpdate.overall_clarity = synthesis.overall_clarity;
    }
    if (synthesis.flags && synthesis.flags.length > 0) {
      synthesisUpdate.flags = synthesis.flags;
    }

    // Only call update if we have something to update
    if (Object.keys(synthesisUpdate).length > 0) {
      const synthResult = await updateCoreIdentitySynthesis(userId, synthesisUpdate);
      if (!synthResult.success) {
        console.error(`Failed to update core_identity synthesis for ${userId}:`, synthResult.error);
        // Don't fail the whole operation - briefing was saved successfully
      } else {
        console.log(`Updated core_identity synthesis for ${userId}`);
      }
    }
  }

  return saveResult;
}

/**
 * Get users who need analysis
 * Criteria:
 * - Has at least MIN_SESSIONS_FOR_ANALYSIS completed sessions
 * - Either has no briefing, or has new sessions since last briefing
 */
async function getUsersNeedingAnalysis(): Promise<string[]> {
  const supabase = await createSSRClient();

  // Get users with recent completed sessions
  const { data: usersWithSessions, error: usersError } = await supabase
    .from("sessions")
    .select("user_id")
    .eq("call_status", "completed")
    .order("started_at", { ascending: false });

  if (usersError || !usersWithSessions) {
    console.error("Error fetching users with sessions:", usersError);
    return [];
  }

  // Get unique user IDs
  const uniqueUserIds = [...new Set(usersWithSessions.map((s) => s.user_id))];

  // For each user, check if they need analysis
  const usersNeedingAnalysis: string[] = [];

  for (const userId of uniqueUserIds) {
    // Count completed sessions
    const { count: sessionCount } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("call_status", "completed");

    if (!sessionCount || sessionCount < MIN_SESSIONS_FOR_ANALYSIS) {
      continue;
    }

    // Get latest briefing
    const { data: latestBriefing } = await supabase
      .from("coach_briefings")
      .select("analysis_date, sessions_analyzed")
      .eq("user_id", userId)
      .order("analysis_date", { ascending: false })
      .limit(1)
      .single();

    // Get latest session date
    const { data: latestSession } = await supabase
      .from("sessions")
      .select("started_at")
      .eq("user_id", userId)
      .eq("call_status", "completed")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    // User needs analysis if:
    // 1. No briefing exists, OR
    // 2. There's a session newer than the latest briefing
    if (!latestBriefing) {
      usersNeedingAnalysis.push(userId);
    } else if (latestSession) {
      const briefingDate = new Date(latestBriefing.analysis_date);
      const sessionDate = new Date(latestSession.started_at);

      if (sessionDate > briefingDate) {
        usersNeedingAnalysis.push(userId);
      }
    }
  }

  return usersNeedingAnalysis;
}

/**
 * Run analysis for all users who need it
 * Called by the nightly cron job
 */
export async function runAnalysisForAllUsers(): Promise<BatchAnalysisResult> {
  const result: BatchAnalysisResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  try {
    const userIds = await getUsersNeedingAnalysis();
    result.processed = userIds.length;

    console.log(`Starting analysis for ${userIds.length} users`);

    for (const userId of userIds) {
      try {
        const analysisResult = await runAnalysisForUser(userId);

        if (analysisResult.success) {
          result.succeeded++;
          console.log(`Analysis succeeded for user ${userId}`);
        } else {
          result.failed++;
          result.errors.push({ userId, error: analysisResult.error || "Unknown error" });
          console.error(`Analysis failed for user ${userId}:`, analysisResult.error);
        }
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        result.errors.push({ userId, error: errorMessage });
        console.error(`Analysis error for user ${userId}:`, error);
      }

      // Small delay between users to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(
      `Analysis complete: ${result.succeeded}/${result.processed} succeeded, ${result.failed} failed`
    );

    return result;
  } catch (error) {
    console.error("Error in runAnalysisForAllUsers:", error);
    return result;
  }
}
