"use server";

import { createSSRClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { hasConfirmedIdentity, getConfirmedIdentity } from "@/lib/queries/identity";
import type { CoachingDomain, RecordStatus, Vision } from "@/types/database";

interface CreateVisionInput {
  domain: CoachingDomain;
  title: string;
  narrative?: string;
}

interface CreateVisionResult {
  success: boolean;
  visionId?: string;
  error?: string;
}

interface UpdateVisionInput {
  title?: string;
  narrative?: string;
  status?: RecordStatus;
}

interface UpdateVisionResult {
  success: boolean;
  error?: string;
}

interface GetVisionsResult {
  success: boolean;
  visions?: Vision[];
  error?: string;
}

/**
 * Create a new vision
 * GATED: Requires confirmed identity profile
 */
export async function createVision(
  data: CreateVisionInput
): Promise<CreateVisionResult> {
  try {
    const supabase = await createSSRClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // GATE: Check for confirmed identity
    const hasIdentity = await hasConfirmedIdentity(user.id);
    if (!hasIdentity) {
      return {
        success: false,
        error: "Cannot create vision without confirmed identity. Please complete identity discovery first.",
      };
    }

    // Get the confirmed identity profile to link
    const { identity } = await getConfirmedIdentity(user.id);
    if (!identity) {
      return { success: false, error: "No confirmed identity profile found" };
    }

    // Create vision linked to identity profile
    const { data: vision, error } = await supabase
      .from("visions")
      .insert({
        user_id: user.id,
        identity_profile_id: identity.id,
        domain: data.domain,
        title: data.title,
        narrative: data.narrative || null,
        status: "draft" as RecordStatus,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating vision:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/visions");

    return { success: true, visionId: vision.id };
  } catch (err) {
    console.error("Error in createVision:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Get all visions for the current user
 * GATED: Returns empty if no confirmed identity
 */
export async function getVisions(): Promise<GetVisionsResult> {
  try {
    const supabase = await createSSRClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // GATE: Check for confirmed identity
    const hasIdentity = await hasConfirmedIdentity(user.id);
    if (!hasIdentity) {
      return {
        success: true,
        visions: [],
        error: "Complete identity discovery to create visions",
      };
    }

    const { data, error } = await supabase
      .from("visions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching visions:", error);
      return { success: false, error: error.message };
    }

    return { success: true, visions: data as Vision[] };
  } catch (err) {
    console.error("Error in getVisions:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Get a single vision by ID (with ownership check)
 */
export async function getVisionById(
  visionId: string
): Promise<{ success: boolean; vision?: Vision; error?: string }> {
  try {
    const supabase = await createSSRClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("visions")
      .select("*")
      .eq("id", visionId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching vision:", error);
      return { success: false, error: error.message };
    }

    return { success: true, vision: data as Vision };
  } catch (err) {
    console.error("Error in getVisionById:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Update a vision
 */
export async function updateVision(
  visionId: string,
  data: UpdateVisionInput
): Promise<UpdateVisionResult> {
  try {
    const supabase = await createSSRClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("visions")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", visionId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating vision:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/visions");
    revalidatePath(`/visions/${visionId}`);

    return { success: true };
  } catch (err) {
    console.error("Error in updateVision:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Delete a vision
 */
export async function deleteVision(
  visionId: string
): Promise<UpdateVisionResult> {
  try {
    const supabase = await createSSRClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("visions")
      .delete()
      .eq("id", visionId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting vision:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/visions");

    return { success: true };
  } catch (err) {
    console.error("Error in deleteVision:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Get visions by domain
 */
export async function getVisionsByDomain(
  domain: CoachingDomain
): Promise<GetVisionsResult> {
  try {
    const supabase = await createSSRClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // GATE: Check for confirmed identity
    const hasIdentity = await hasConfirmedIdentity(user.id);
    if (!hasIdentity) {
      return {
        success: true,
        visions: [],
        error: "Complete identity discovery to create visions",
      };
    }

    const { data, error } = await supabase
      .from("visions")
      .select("*")
      .eq("user_id", user.id)
      .eq("domain", domain)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching visions by domain:", error);
      return { success: false, error: error.message };
    }

    return { success: true, visions: data as Vision[] };
  } catch (err) {
    console.error("Error in getVisionsByDomain:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
