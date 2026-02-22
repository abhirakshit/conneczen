import { createSSRClient } from "@/lib/supabase/server";
import type { Session, SessionType, Json } from "@/types/database";

// Re-export the Session type for convenience
export type { Session };

/**
 * Session summary context for IOA prompt injection
 */
export interface SessionSummaryContext {
  sessionId: string;
  startedAt: string;
  summary: Json | null;
  transcript: string | null;
}

interface GetSessionsOptions {
  limit?: number;
  offset?: number;
}

/**
 * Get paginated sessions for a user
 */
export async function getUserSessions(
  userId: string,
  options: GetSessionsOptions = {}
) {
  const { limit = 10, offset = 0 } = options;
  const supabase = await createSSRClient();

  const { data, error, count } = await supabase
    .from("sessions")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching sessions:", error);
    return { sessions: [], total: 0, error };
  }

  return { sessions: (data ?? []) as Session[], total: count ?? 0, error: null };
}

/**
 * Get recent sessions for dashboard overview
 */
export async function getRecentSessions(userId: string, limit = 5) {
  return getUserSessions(userId, { limit, offset: 0 });
}

/**
 * Get a single session by ID (with ownership check)
 */
export async function getSessionById(sessionId: string, userId: string) {
  const supabase = await createSSRClient();

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching session:", error);
    return { session: null, error };
  }

  return { session: data as Session, error: null };
}

/**
 * Get session count for a user
 */
export async function getSessionCount(userId: string) {
  const supabase = await createSSRClient();

  const { count, error } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching session count:", error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Get session count for current month
 */
export async function getMonthlySessionCount(userId: string) {
  const supabase = await createSSRClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("started_at", startOfMonth.toISOString());

  if (error) {
    console.error("Error fetching monthly session count:", error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Get the most recent completed session summary for context injection
 * Used to provide IOA with previous conversation context
 */
export async function getLatestSessionSummary(
  userId: string,
  sessionType?: SessionType
): Promise<SessionSummaryContext | null> {
  const supabase = await createSSRClient();

  let query = supabase
    .from("sessions")
    .select("id, started_at, summary_json, transcript")
    .eq("user_id", userId)
    .eq("call_status", "completed")
    .order("started_at", { ascending: false })
    .limit(1);

  // Optionally filter by session type
  if (sessionType) {
    query = query.eq("session_type", sessionType);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching latest session summary:", error);
    }
    return null;
  }

  return {
    sessionId: data.id,
    startedAt: data.started_at,
    summary: data.summary_json,
    transcript: data.transcript,
  };
}

/**
 * Get sessions by type (IOA or regular)
 */
export async function getSessionsByType(
  userId: string,
  sessionType: SessionType,
  options: GetSessionsOptions = {}
) {
  const { limit = 10, offset = 0 } = options;
  const supabase = await createSSRClient();

  const { data, error, count } = await supabase
    .from("sessions")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .eq("session_type", sessionType)
    .order("started_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching sessions by type:", error);
    return { sessions: [], total: 0, error };
  }

  return { sessions: (data ?? []) as Session[], total: count ?? 0, error: null };
}
