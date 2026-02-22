"use server";

import { createSSRClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  IdentityDraft,
  IOAHandoffContract,
  CoachRecommendation,
  OnboardingState
} from "@conneczen/types";
import type { CoachingDomain, RecordStatus, RecommendedCoachType } from "@/types/database";

/**
 * Create or update identity draft during IOA conversation
 * Also syncs to core_identity table
 */
export async function saveIdentityDraft(
  draft: Partial<IdentityDraft>,
  domain: CoachingDomain = "purpose"
) {
  const supabase = await createSSRClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check for existing identity_profile draft
  const { data: existing } = await supabase
    .from("identity_profiles")
    .select("id")
    .eq("user_id", user.id)
    .eq("domain", domain)
    .eq("status", "draft")
    .single();

  let identityProfileId: string;

  if (existing) {
    // Update existing draft
    const { error } = await supabase
      .from("identity_profiles")
      .update({
        identity_statement: buildIdentityStatement(draft),
        confidence_level: draft.readiness_level,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      console.error("Error updating identity draft:", error);
      return { success: false, error: error.message };
    }

    identityProfileId = existing.id;
  } else {
    // Create new draft
    const { data, error } = await supabase
      .from("identity_profiles")
      .insert({
        user_id: user.id,
        domain,
        status: "draft" as RecordStatus,
        identity_statement: buildIdentityStatement(draft),
        confidence_level: draft.readiness_level,
        created_by: "ai",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating identity draft:", error);
      return { success: false, error: error.message };
    }

    identityProfileId = data.id;
  }

  // Sync to core_identity table
  await syncToCoreIdentity(supabase, user.id, draft);

  return { success: true, identityProfileId };
}

/**
 * Sync identity draft to core_identity table
 */
async function syncToCoreIdentity(
  supabase: Awaited<ReturnType<typeof createSSRClient>>,
  userId: string,
  draft: Partial<IdentityDraft>
) {
  // Check for existing core_identity
  const { data: existingCore } = await supabase
    .from("core_identity")
    .select("id")
    .eq("user_id", userId)
    .single();

  // Build update/insert data (only include non-null values)
  const coreData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (draft.preferred_name) {
    coreData.preferred_name = draft.preferred_name;
  }
  if (draft.primary_struggle) {
    coreData.primary_struggle = draft.primary_struggle;
  }
  if (draft.desired_direction) {
    coreData.desired_direction = draft.desired_direction;
  }
  if (draft.readiness_level !== undefined) {
    coreData.readiness_level = draft.readiness_level;
  }
  if (draft.time_availability !== undefined) {
    coreData.time_availability = draft.time_availability;
  }

  if (existingCore) {
    // Update existing core_identity
    const { error } = await supabase
      .from("core_identity")
      .update(coreData)
      .eq("id", existingCore.id);

    if (error) {
      console.error("Error updating core_identity:", error);
      // Don't fail the main operation
    }
  } else {
    // Create new core_identity draft
    // Only create if we have the required fields
    if (draft.preferred_name && draft.primary_struggle && draft.desired_direction) {
      const { error } = await supabase
        .from("core_identity")
        .insert({
          user_id: userId,
          preferred_name: draft.preferred_name,
          primary_struggle: draft.primary_struggle,
          desired_direction: draft.desired_direction,
          readiness_level: draft.readiness_level || null,
          time_availability: draft.time_availability || null,
          status: "draft" as RecordStatus,
        });

      if (error) {
        console.error("Error creating core_identity:", error);
        // Don't fail the main operation
      }
    }
  }
}

/**
 * Confirm identity and trigger coach handoff
 * Also confirms core_identity
 */
export async function confirmIdentity(
  identitySummary: string,
  coachRecommendation: CoachRecommendation,
  draft: IdentityDraft,
  domain: CoachingDomain = "purpose"
) {
  const supabase = await createSSRClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Find the draft identity profile
  const { data: profile, error: fetchError } = await supabase
    .from("identity_profiles")
    .select("id")
    .eq("user_id", user.id)
    .eq("domain", domain)
    .eq("status", "draft")
    .single();

  if (fetchError || !profile) {
    return { success: false, error: "No draft identity found" };
  }

  const now = new Date().toISOString();

  // Update to confirmed status
  const { error: updateError } = await supabase
    .from("identity_profiles")
    .update({
      status: "active" as RecordStatus,
      identity_statement: identitySummary,
      confidence_level: draft.readiness_level,
      clarity_level: 3, // Default clarity on first confirmation
      last_confirmed_at: now,
      updated_at: now,
    })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Error confirming identity:", updateError);
    return { success: false, error: updateError.message };
  }

  // Update user settings with recommended coach type
  const coachTypeMap: Record<string, string> = {
    foundational: "mindfulness",
    health: "wellness",
    addiction: "wellness",
    focus: "productivity",
    relationships: "mindfulness",
    career: "productivity",
  };

  const { error: settingsError } = await supabase
    .from("user_settings")
    .update({
      coach_type: coachTypeMap[coachRecommendation.coach_type] || "mindfulness",
      full_name: draft.preferred_name,
      updated_at: now,
    })
    .eq("user_id", user.id);

  if (settingsError) {
    console.error("Error updating user settings:", settingsError);
    // Don't fail the whole operation for this
  }

  // Confirm core_identity
  const coreIdentityId = await confirmCoreIdentityRecord(
    supabase,
    user.id,
    draft,
    coachRecommendation,
    domain
  );

  // Create handoff contract
  const handoffContract: IOAHandoffContract = {
    handoff_version: "1.0.0",
    user_id: user.id,
    preferred_name: draft.preferred_name || "",
    primary_struggle: draft.primary_struggle || "",
    desired_direction: draft.desired_direction || "",
    readiness_level: draft.readiness_level || 1,
    time_availability: draft.time_availability || "low",
    coach_recommendation: {
      coach_type: coachRecommendation.coach_type,
      confidence: coachRecommendation.confidence || 0.8,
    },
    consent_acknowledged: true,
    created_at: now,
  };

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  return {
    success: true,
    identityProfileId: profile.id,
    coreIdentityId,
    handoffContract
  };
}

/**
 * Confirm or create core_identity record
 */
async function confirmCoreIdentityRecord(
  supabase: Awaited<ReturnType<typeof createSSRClient>>,
  userId: string,
  draft: IdentityDraft,
  coachRecommendation: CoachRecommendation,
  primaryDomain: CoachingDomain
): Promise<string | null> {
  const now = new Date().toISOString();

  // Check for existing core_identity
  const { data: existingCore } = await supabase
    .from("core_identity")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existingCore) {
    // Update and confirm existing core_identity
    const { error } = await supabase
      .from("core_identity")
      .update({
        preferred_name: draft.preferred_name || "",
        primary_struggle: draft.primary_struggle || "",
        desired_direction: draft.desired_direction || "",
        readiness_level: draft.readiness_level,
        time_availability: draft.time_availability,
        recommended_coach: coachRecommendation.coach_type as RecommendedCoachType,
        coach_confidence: coachRecommendation.confidence || null,
        primary_domain: primaryDomain,
        status: "active" as RecordStatus,
        confirmed_at: now,
        updated_at: now,
      })
      .eq("id", existingCore.id);

    if (error) {
      console.error("Error confirming core_identity:", error);
      return null;
    }

    return existingCore.id;
  } else {
    // Create new confirmed core_identity
    const { data, error } = await supabase
      .from("core_identity")
      .insert({
        user_id: userId,
        preferred_name: draft.preferred_name || "",
        primary_struggle: draft.primary_struggle || "",
        desired_direction: draft.desired_direction || "",
        readiness_level: draft.readiness_level,
        time_availability: draft.time_availability,
        recommended_coach: coachRecommendation.coach_type as RecommendedCoachType,
        coach_confidence: coachRecommendation.confidence || null,
        primary_domain: primaryDomain,
        status: "active" as RecordStatus,
        confirmed_at: now,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating core_identity:", error);
      return null;
    }

    return data.id;
  }
}

/**
 * Get current identity draft for user
 */
export async function getIdentityDraft(domain: CoachingDomain = "purpose") {
  const supabase = await createSSRClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("identity_profiles")
    .select("*")
    .eq("user_id", user.id)
    .eq("domain", domain)
    .eq("status", "draft")
    .single();

  if (error && error.code !== "PGRST116") { // Not found is ok
    return { success: false, error: error.message };
  }

  return { success: true, draft: data };
}

/**
 * Get confirmed identity profile for user
 */
export async function getConfirmedIdentity(domain: CoachingDomain = "purpose") {
  const supabase = await createSSRClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("identity_profiles")
    .select("*")
    .eq("user_id", user.id)
    .eq("domain", domain)
    .eq("status", "active")
    .single();

  if (error && error.code !== "PGRST116") {
    return { success: false, error: error.message };
  }

  return { success: true, identity: data };
}

/**
 * Update onboarding state in user settings
 */
export async function updateOnboardingState(state: OnboardingState) {
  const supabase = await createSSRClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Mark onboarding as completed if state is 'completed'
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (state === "completed") {
    updates.onboarding_completed = true;
  }

  const { error } = await supabase
    .from("user_settings")
    .update(updates)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Helper to build identity statement from draft fields
 */
function buildIdentityStatement(draft: Partial<IdentityDraft>): string {
  const parts: string[] = [];

  if (draft.preferred_name) {
    parts.push(`Name: ${draft.preferred_name}`);
  }
  if (draft.primary_struggle) {
    parts.push(`Primary struggle: ${draft.primary_struggle}`);
  }
  if (draft.desired_direction) {
    parts.push(`Desired direction: ${draft.desired_direction}`);
  }
  if (draft.readiness_level) {
    parts.push(`Readiness level: ${draft.readiness_level}/5`);
  }
  if (draft.time_availability) {
    parts.push(`Time availability: ${draft.time_availability}`);
  }

  return parts.join("\n");
}
