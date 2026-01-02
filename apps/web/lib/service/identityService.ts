import { createJSClient } from "@/lib/supabase/client";
import type { CoachingDomain, RecordStatus } from "@/lib/types/identity";
import {DBName} from "@/lib/constants/dbConstants";


/**
 * Fetch identity profile (user + domain)
 */
export async function getIdentityProfile(
    userId: string,
    domain: CoachingDomain
) {
    const supabase = createJSClient();

    return supabase
        .from(DBName.IDENTITY_PROFILES)
        .select("*")
        .eq("user_id", userId)
        .eq("domain", domain)
        .maybeSingle();
}

/**
 * Create a new draft identity
 * Fails if one already exists (by DB constraint)
 */
export async function createIdentityDraft(
    userId: string,
    domain: CoachingDomain
) {
    const supabase = createJSClient();

    return supabase
        .from(DBName.IDENTITY_PROFILES)
        .insert({
            user_id: userId,
            domain,
            status: "draft" satisfies RecordStatus,
        })
        .select()
        .single();
}

/**
 * Update identity text (DRAFT ONLY)
 */
export async function updateIdentityDraft(
    identityId: string,
    identityStatement: string
) {
    const supabase = createJSClient();

    return supabase
        .from(DBName.IDENTITY_PROFILES)
        .update({
            identity_statement: identityStatement,
            updated_at: new Date().toISOString(),
        })
        .eq("id", identityId)
        .eq("status", "draft")
        .select()
        .single();
}

/**
 * Confirm identity (one-way)
 */
export async function confirmIdentity(identityId: string) {
    const supabase = createJSClient();

    return supabase
        .from(DBName.IDENTITY_PROFILES)
        .update({
            status: "confirmed",
            updated_at: new Date().toISOString(),
        })
        .eq("id", identityId)
        .eq("status", "draft")
        .select()
        .single();
}

/**
 * Archive identity (admin / system only)
 */
export async function archiveIdentity(identityId: string) {
    const supabase = createJSClient();

    return supabase
        .from(DBName.IDENTITY_PROFILES)
        .update({
            status: "archived",
            updated_at: new Date().toISOString(),
        })
        .eq("id", identityId);
}