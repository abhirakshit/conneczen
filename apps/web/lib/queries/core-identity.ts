import { createSSRClient } from "@/lib/supabase/server";
import type { CoreIdentity, RecordStatus } from "@/types/database";

// Re-export for convenience
export type { CoreIdentity };

/**
 * Get core identity for a user
 */
export async function getCoreIdentity(
  userId: string
): Promise<{ coreIdentity: CoreIdentity | null; error: Error | null }> {
  const supabase = await createSSRClient();

  const { data, error } = await supabase
    .from("core_identity")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return { coreIdentity: null, error: null };
    }
    console.error("Error fetching core identity:", error);
    return { coreIdentity: null, error };
  }

  return { coreIdentity: data as CoreIdentity, error: null };
}

/**
 * Check if user has a confirmed core identity
 */
export async function hasConfirmedCoreIdentity(userId: string): Promise<boolean> {
  const supabase = await createSSRClient();

  const { count, error } = await supabase
    .from("core_identity")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    console.error("Error checking confirmed core identity:", error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Get core identity by status
 */
export async function getCoreIdentityByStatus(
  userId: string,
  status: RecordStatus
): Promise<{ coreIdentity: CoreIdentity | null; error: Error | null }> {
  const supabase = await createSSRClient();

  const { data, error } = await supabase
    .from("core_identity")
    .select("*")
    .eq("user_id", userId)
    .eq("status", status)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { coreIdentity: null, error: null };
    }
    console.error("Error fetching core identity by status:", error);
    return { coreIdentity: null, error };
  }

  return { coreIdentity: data as CoreIdentity, error: null };
}

/**
 * Get core identity for coach context
 * Returns a simplified object for prompt injection
 */
export async function getCoreIdentityForContext(userId: string): Promise<{
  preferredName: string;
  primaryStruggle: string;
  desiredDirection: string;
  readinessLevel: number | null;
  lifeStage: string | null;
  valuesSummary: string | null;
  primaryDomain: string | null;
} | null> {
  const { coreIdentity } = await getCoreIdentity(userId);

  if (!coreIdentity || coreIdentity.status !== "active") {
    return null;
  }

  return {
    preferredName: coreIdentity.preferred_name,
    primaryStruggle: coreIdentity.primary_struggle,
    desiredDirection: coreIdentity.desired_direction,
    readinessLevel: coreIdentity.readiness_level,
    lifeStage: coreIdentity.life_stage,
    valuesSummary: coreIdentity.values_summary,
    primaryDomain: coreIdentity.primary_domain,
  };
}

/**
 * Get users with specific flags
 * Useful for monitoring and intervention
 */
export async function getUsersWithFlags(
  flags: string[]
): Promise<{ userIds: string[]; error: Error | null }> {
  const supabase = await createSSRClient();

  const { data, error } = await supabase
    .from("core_identity")
    .select("user_id, flags")
    .eq("status", "active")
    .not("flags", "is", null);

  if (error) {
    console.error("Error fetching users with flags:", error);
    return { userIds: [], error };
  }

  // Filter users who have any of the specified flags
  const userIds = (data || [])
    .filter((row) => {
      const userFlags = row.flags as string[] | null;
      return userFlags?.some((f) => flags.includes(f));
    })
    .map((row) => row.user_id);

  return { userIds, error: null };
}

/**
 * Get users by recommended coach type
 * Useful for routing users to appropriate coaches
 */
export async function getUsersByRecommendedCoach(
  coachType: string
): Promise<{ userIds: string[]; error: Error | null }> {
  const supabase = await createSSRClient();

  const { data, error } = await supabase
    .from("core_identity")
    .select("user_id")
    .eq("recommended_coach", coachType)
    .eq("status", "active");

  if (error) {
    console.error("Error fetching users by recommended coach:", error);
    return { userIds: [], error };
  }

  return {
    userIds: (data || []).map((row) => row.user_id),
    error: null,
  };
}

/**
 * Check if core identity needs synthesis update
 * Returns true if values_summary is null but user has completed sessions
 */
export async function needsSynthesisUpdate(userId: string): Promise<boolean> {
  const supabase = await createSSRClient();

  // Get core identity
  const { data: coreIdentity } = await supabase
    .from("core_identity")
    .select("values_summary, updated_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!coreIdentity) {
    return false; // No core identity to update
  }

  // If no values_summary, check if there are completed sessions
  if (!coreIdentity.values_summary) {
    const { count } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("call_status", "completed")
      .eq("session_type", "regular");

    return (count || 0) >= 3; // Need at least 3 regular sessions for synthesis
  }

  // Check if there are sessions newer than the last update
  const { data: newerSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("call_status", "completed")
    .eq("session_type", "regular")
    .gt("started_at", coreIdentity.updated_at)
    .limit(1)
    .single();

  return !!newerSession;
}