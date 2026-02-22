import { createSSRClient } from "@/lib/supabase/server";
import type { IdentityProfile } from "@/types/database";
import type { IdentityDraft } from "@conneczen/types";

// Re-export for convenience
export type { IdentityProfile };

/**
 * Check if user has a confirmed (active) identity profile
 */
export async function hasConfirmedIdentity(userId: string): Promise<boolean> {
  const supabase = await createSSRClient();

  const { count, error } = await supabase
    .from("identity_profiles")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    console.error("Error checking confirmed identity:", error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Get confirmed identity profile for a user
 */
export async function getConfirmedIdentity(
  userId: string
): Promise<{ identity: IdentityProfile | null; error: Error | null }> {
  const supabase = await createSSRClient();

  const { data, error } = await supabase
    .from("identity_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("last_confirmed_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    console.error("Error fetching confirmed identity:", error);
    return { identity: null, error };
  }

  return { identity: data as IdentityProfile | null, error: null };
}

/**
 * Get identity draft for context injection into IOA prompt
 * Parses the identity_statement field to extract structured data
 */
export async function getIdentityDraftForContext(
  userId: string
): Promise<IdentityDraft | null> {
  const supabase = await createSSRClient();

  // Get the most recent draft
  const { data, error } = await supabase
    .from("identity_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Error fetching identity draft:", error);
    }
    return null;
  }

  // Parse the identity_statement to extract structured fields
  return parseIdentityStatement(data?.identity_statement);
}

/**
 * Get identity draft profile (raw database record)
 */
export async function getIdentityDraftProfile(
  userId: string
): Promise<{ profile: IdentityProfile | null; error: Error | null }> {
  const supabase = await createSSRClient();

  const { data, error } = await supabase
    .from("identity_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching identity draft profile:", error);
    return { profile: null, error };
  }

  return { profile: data as IdentityProfile | null, error: null };
}

/**
 * Parse identity statement string into structured IdentityDraft
 * Format expected:
 *   Name: {preferred_name}
 *   Primary struggle: {primary_struggle}
 *   Desired direction: {desired_direction}
 *   Readiness level: {readiness_level}/5
 *   Time availability: {time_availability}
 */
function parseIdentityStatement(statement: string | null): IdentityDraft | null {
  if (!statement) {
    return null;
  }

  const draft: IdentityDraft = {
    preferred_name: null,
    primary_struggle: null,
    desired_direction: null,
    readiness_level: null,
    time_availability: null,
  };

  const lines = statement.split("\n");
  for (const line of lines) {
    const [key, ...valueParts] = line.split(":");
    const value = valueParts.join(":").trim();

    if (!key || !value) continue;

    const keyLower = key.toLowerCase().trim();

    if (keyLower === "name" || keyLower === "preferred name") {
      draft.preferred_name = value;
    } else if (keyLower === "primary struggle" || keyLower === "struggle") {
      draft.primary_struggle = value;
    } else if (keyLower === "desired direction" || keyLower === "direction") {
      draft.desired_direction = value;
    } else if (keyLower === "readiness level" || keyLower === "readiness") {
      // Parse "4/5" format
      const match = value.match(/^(\d)/);
      if (match) {
        draft.readiness_level = parseInt(match[1], 10);
      }
    } else if (keyLower === "time availability" || keyLower === "availability") {
      const valueLower = value.toLowerCase();
      if (valueLower === "low" || valueLower === "medium" || valueLower === "high") {
        draft.time_availability = valueLower as "low" | "medium" | "high";
      }
    }
  }

  // Return null if no fields were parsed
  const hasAnyField = Object.values(draft).some((v) => v !== null);
  return hasAnyField ? draft : null;
}
