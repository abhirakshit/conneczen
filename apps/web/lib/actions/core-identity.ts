"use server";

import { createSSRClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  CoreIdentity,
  RecordStatus,
  TimeAvailability,
  RecommendedCoachType,
  CoachingDomain,
} from "@/types/database";
import type { IdentityDraft, CoachRecommendation } from "@conneczen/types";

type CoreIdentityInsert = {
  preferred_name: string;
  primary_struggle: string;
  desired_direction: string;
  readiness_level?: number | null;
  time_availability?: TimeAvailability | null;
  recommended_coach?: RecommendedCoachType | null;
  coach_confidence?: number | null;
  flags?: string[] | null;
};

type CoreIdentityUpdate = Partial<{
  preferred_name: string;
  primary_struggle: string;
  desired_direction: string;
  readiness_level: number | null;
  time_availability: TimeAvailability | null;
  recommended_coach: RecommendedCoachType | null;
  coach_confidence: number | null;
  values_summary: string | null;
  life_stage: string | null;
  primary_domain: CoachingDomain | null;
  overall_clarity: number | null;
  flags: string[] | null;
  status: RecordStatus;
}>;

/**
 * Create core identity from IOA confirmation
 * Called when user confirms their identity during onboarding
 */
export async function createCoreIdentity(
  draft: IdentityDraft,
  coachRecommendation?: CoachRecommendation,
  flags?: string[]
) {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if core identity already exists
  const { data: existing } = await supabase
    .from("core_identity")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { success: false, error: "Core identity already exists" };
  }

  const insertData: CoreIdentityInsert & { user_id: string; status: RecordStatus } = {
    user_id: user.id,
    preferred_name: draft.preferred_name || "",
    primary_struggle: draft.primary_struggle || "",
    desired_direction: draft.desired_direction || "",
    readiness_level: draft.readiness_level,
    time_availability: draft.time_availability,
    status: "draft",
  };

  if (coachRecommendation) {
    insertData.recommended_coach = coachRecommendation.coach_type as RecommendedCoachType;
    insertData.coach_confidence = coachRecommendation.confidence || null;
  }

  if (flags) {
    insertData.flags = flags;
  }

  const { data, error } = await supabase
    .from("core_identity")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("Error creating core identity:", error);
    return { success: false, error: error.message };
  }

  return { success: true, coreIdentityId: data.id };
}

/**
 * Update core identity draft
 * Used during IOA conversation to incrementally save fields
 */
export async function updateCoreIdentityDraft(updates: Partial<IdentityDraft>) {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Build update object
  const updateData: CoreIdentityUpdate & { updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (updates.preferred_name !== undefined) {
    updateData.preferred_name = updates.preferred_name || undefined;
  }
  if (updates.primary_struggle !== undefined) {
    updateData.primary_struggle = updates.primary_struggle || undefined;
  }
  if (updates.desired_direction !== undefined) {
    updateData.desired_direction = updates.desired_direction || undefined;
  }
  if (updates.readiness_level !== undefined) {
    updateData.readiness_level = updates.readiness_level;
  }
  if (updates.time_availability !== undefined) {
    updateData.time_availability = updates.time_availability;
  }

  const { error } = await supabase
    .from("core_identity")
    .update(updateData)
    .eq("user_id", user.id)
    .eq("status", "draft");

  if (error) {
    console.error("Error updating core identity draft:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Confirm core identity
 * Transitions from draft to active status
 */
export async function confirmCoreIdentity(
  coachRecommendation?: CoachRecommendation
) {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const updateData: CoreIdentityUpdate & { confirmed_at: string; updated_at: string } = {
    status: "active",
    confirmed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (coachRecommendation) {
    updateData.recommended_coach = coachRecommendation.coach_type as RecommendedCoachType;
    updateData.coach_confidence = coachRecommendation.confidence || null;
  }

  const { error } = await supabase
    .from("core_identity")
    .update(updateData)
    .eq("user_id", user.id)
    .eq("status", "draft");

  if (error) {
    console.error("Error confirming core identity:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  return { success: true };
}

/**
 * Update synthesis fields (called by Analyst Agent)
 * These fields are derived from session analysis
 */
export async function updateCoreIdentitySynthesis(
  userId: string,
  synthesis: {
    values_summary?: string;
    life_stage?: string;
    primary_domain?: CoachingDomain;
    overall_clarity?: number;
    flags?: string[];
  }
) {
  const supabase = await createSSRClient();

  const updateData: CoreIdentityUpdate & { updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (synthesis.values_summary !== undefined) {
    updateData.values_summary = synthesis.values_summary;
  }
  if (synthesis.life_stage !== undefined) {
    updateData.life_stage = synthesis.life_stage;
  }
  if (synthesis.primary_domain !== undefined) {
    updateData.primary_domain = synthesis.primary_domain;
  }
  if (synthesis.overall_clarity !== undefined) {
    updateData.overall_clarity = synthesis.overall_clarity;
  }
  if (synthesis.flags !== undefined) {
    updateData.flags = synthesis.flags;
  }

  const { error } = await supabase
    .from("core_identity")
    .update(updateData)
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    console.error("Error updating core identity synthesis:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Add flags to core identity
 */
export async function addCoreIdentityFlags(userId: string, newFlags: string[]) {
  const supabase = await createSSRClient();

  // Get current flags
  const { data: current } = await supabase
    .from("core_identity")
    .select("flags")
    .eq("user_id", userId)
    .single();

  const existingFlags = (current?.flags as string[] | null) || [];
  const mergedFlags = [...new Set([...existingFlags, ...newFlags])];

  const { error } = await supabase
    .from("core_identity")
    .update({
      flags: mergedFlags,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Error adding core identity flags:", error);
    return { success: false, error: error.message };
  }

  return { success: true, flags: mergedFlags };
}

/**
 * Remove flags from core identity
 */
export async function removeCoreIdentityFlags(userId: string, flagsToRemove: string[]) {
  const supabase = await createSSRClient();

  // Get current flags
  const { data: current } = await supabase
    .from("core_identity")
    .select("flags")
    .eq("user_id", userId)
    .single();

  const existingFlags = (current?.flags as string[] | null) || [];
  const filteredFlags = existingFlags.filter((f) => !flagsToRemove.includes(f));

  const { error } = await supabase
    .from("core_identity")
    .update({
      flags: filteredFlags.length > 0 ? filteredFlags : null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing core identity flags:", error);
    return { success: false, error: error.message };
  }

  return { success: true, flags: filteredFlags };
}

/**
 * Get core identity for current user
 */
export async function getCoreIdentity(): Promise<{
  success: boolean;
  coreIdentity?: CoreIdentity | null;
  error?: string;
}> {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("core_identity")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: true, coreIdentity: null };
    }
    return { success: false, error: error.message };
  }

  return { success: true, coreIdentity: data as CoreIdentity };
}

/**
 * Archive core identity (soft delete)
 * Used when user wants to start fresh
 */
export async function archiveCoreIdentity() {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("core_identity")
    .update({
      status: "archived" as RecordStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) {
    console.error("Error archiving core identity:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");

  return { success: true };
}