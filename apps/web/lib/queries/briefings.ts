import { createSSRClient } from "@/lib/supabase/server";
import type { CoachBriefing, RiskLevel } from "@/types/database";

// Re-export for convenience
export type { CoachBriefing };

/**
 * Get the latest briefing for a user
 */
export async function getLatestBriefing(
  userId: string
): Promise<{ briefing: CoachBriefing | null; error: Error | null }> {
  const supabase = await createSSRClient();

  const { data, error } = await supabase
    .from("coach_briefings")
    .select("*")
    .eq("user_id", userId)
    .order("analysis_date", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return { briefing: null, error: null };
    }
    console.error("Error fetching latest briefing:", error);
    return { briefing: null, error };
  }

  return { briefing: data as CoachBriefing, error: null };
}

/**
 * Get briefing history for a user
 */
export async function getBriefingHistory(
  userId: string,
  limit: number = 10
): Promise<{ briefings: CoachBriefing[]; error: Error | null }> {
  const supabase = await createSSRClient();

  const { data, error } = await supabase
    .from("coach_briefings")
    .select("*")
    .eq("user_id", userId)
    .order("analysis_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching briefing history:", error);
    return { briefings: [], error };
  }

  return { briefings: (data || []) as CoachBriefing[], error: null };
}

/**
 * Check if a user needs fresh analysis
 * Returns true if:
 * - User has no briefing, OR
 * - User has sessions newer than their latest briefing
 */
export async function needsAnalysis(userId: string): Promise<boolean> {
  const supabase = await createSSRClient();

  // Get latest briefing date
  const { data: latestBriefing } = await supabase
    .from("coach_briefings")
    .select("analysis_date")
    .eq("user_id", userId)
    .order("analysis_date", { ascending: false })
    .limit(1)
    .single();

  if (!latestBriefing) {
    // No briefing exists - check if user has any completed sessions
    const { count } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("call_status", "completed");

    return (count || 0) >= 2; // Need at least 2 sessions for analysis
  }

  // Check for sessions newer than the briefing
  const { data: newerSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("call_status", "completed")
    .gt("started_at", latestBriefing.analysis_date)
    .limit(1)
    .single();

  return !!newerSession;
}

/**
 * Get briefing by ID (with ownership check)
 */
export async function getBriefingById(
  briefingId: string,
  userId: string
): Promise<{ briefing: CoachBriefing | null; error: Error | null }> {
  const supabase = await createSSRClient();

  const { data, error } = await supabase
    .from("coach_briefings")
    .select("*")
    .eq("id", briefingId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { briefing: null, error: null };
    }
    console.error("Error fetching briefing by ID:", error);
    return { briefing: null, error };
  }

  return { briefing: data as CoachBriefing, error: null };
}

/**
 * Get users with elevated risk levels
 * Useful for monitoring dashboard
 */
export async function getUsersWithElevatedRisk(
  minRiskLevel: RiskLevel = "moderate"
): Promise<{ userIds: string[]; error: Error | null }> {
  const supabase = await createSSRClient();

  const riskLevels: RiskLevel[] = ["moderate", "high"];
  if (minRiskLevel === "low") {
    riskLevels.unshift("low");
  }

  // Get the latest briefing for each user with elevated risk
  const { data, error } = await supabase
    .from("coach_briefings")
    .select("user_id, analysis_date, risk_level")
    .in("risk_level", riskLevels)
    .order("analysis_date", { ascending: false });

  if (error) {
    console.error("Error fetching users with elevated risk:", error);
    return { userIds: [], error };
  }

  // Filter to only the latest briefing per user
  const latestByUser = new Map<string, { date: string; risk: string }>();
  for (const briefing of data || []) {
    const existing = latestByUser.get(briefing.user_id);
    if (!existing || new Date(briefing.analysis_date) > new Date(existing.date)) {
      latestByUser.set(briefing.user_id, {
        date: briefing.analysis_date,
        risk: briefing.risk_level,
      });
    }
  }

  // Return users whose latest briefing has elevated risk
  const userIds = Array.from(latestByUser.entries())
    .filter(([, info]) => riskLevels.includes(info.risk as RiskLevel))
    .map(([userId]) => userId);

  return { userIds, error: null };
}

/**
 * Get briefing count for a user
 */
export async function getBriefingCount(userId: string): Promise<number> {
  const supabase = await createSSRClient();

  const { count, error } = await supabase
    .from("coach_briefings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching briefing count:", error);
    return 0;
  }

  return count || 0;
}
