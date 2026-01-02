// apps/web/lib/identity/identityService.ts

import { createSSRClient } from "@/lib/supabase/client";
import { CoachingDomain, RecordStatus } from "@/lib/types/types";

export type IdentityProfile = {
    id: string;
    user_id: string;
    domain: CoachingDomain;
    status: RecordStatus;
    identity_statement: string | null;
    created_at: string;
    updated_at: string;
};

/**
 * CREATE
 * Creates a new identity profile in DRAFT state.
 * Fails if profile already exists for (user_id, domain).
 */
export async function createIdentityProfile(
    userId: string,
    domain: CoachingDomain
): Promise<IdentityProfile> {
    const supabase = createSSRClient();

    const { data, error } = await supabase
        .from("identity_profiles")
        .insert({
            user_id: userId,
            domain,
            status: "draft",
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create identity profile: ${error.message}`);
    }

    return data;
}

/**
 * UPDATE (DRAFT ONLY)
 * Updates identity statement while still in DRAFT.
 */
export async function updateIdentityDraft(
    profileId: string,
    identityStatement: string
): Promise<IdentityProfile> {
    const supabase = createSSRClient();

    const { data, error } = await supabase
        .from("identity_profiles")
        .update({
            identity_statement: identityStatement,
            updated_at: new Date().toISOString(),
        })
        .eq("id", profileId)
        .eq("status", "draft") // hard boundary
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update draft identity: ${error.message}`);
    }

    if (!data) {
        throw new Error("Identity profile not found or not in draft state");
    }

    return data;
}

/**
 * CONFIRM
 * Locks the identity profile.
 * No further updates allowed by IOA after this.
 */
export async function confirmIdentity(
    profileId: string
): Promise<IdentityProfile> {
    const supabase = createSSRClient();

    const { data, error } = await supabase
        .from("identity_profiles")
        .update({
            status: "confirmed",
            updated_at: new Date().toISOString(),
        })
        .eq("id", profileId)
        .eq("status", "draft") // cannot confirm twice
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to confirm identity: ${error.message}`);
    }

    if (!data) {
        throw new Error("Identity profile not found or already confirmed");
    }

    return data;
}

/**
 * READ (Helper)
 * Fetch active identity for a domain.
 */
export async function getActiveIdentityProfile(
    userId: string,
    domain: CoachingDomain
): Promise<IdentityProfile | null> {
    const supabase = createSSRClient();

    const { data, error } = await supabase
        .from("identity_profiles")
        .select("*")
        .eq("user_id", userId)
        .eq("domain", domain)
        .neq("status", "archived")
        .single();

    if (error && error.code !== "PGRST116") {
        throw new Error(`Failed to fetch identity profile: ${error.message}`);
    }

    return data ?? null;
}