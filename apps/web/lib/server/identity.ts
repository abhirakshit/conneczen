import { createSSRClient } from "@/lib/supabase/client";

export async function getActiveIdentity(userId: string, domain: string) {
    const supabase = createSSRClient();

    const { data, error } = await supabase
        .from("identity_profiles")
        .select("*")
        .eq("user_id", userId)
        .eq("domain", domain)
        .eq("status", "active")
        .single();

    if (error && error.code !== "PGRST116") {
        throw error;
    }

    return data ?? null;
}

export async function createIdentity(
    userId: string,
    domain: string,
    identityStatement: string
) {
    const supabase = createSSRClient();

    // Archive any existing active identity in this domain
    await supabase
        .from("identity_profiles")
        .update({ status: "archived" })
        .eq("user_id", userId)
        .eq("domain", domain)
        .eq("status", "active");

    const { data, error } = await supabase
        .from("identity_profiles")
        .insert({
            user_id: userId,
            domain,
            identity_statement: identityStatement,
            status: "active",
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function proposeIdentityUpdate(
    userId: string,
    domain: string,
    proposedStatement: string
) {
    const supabase = createSSRClient();

    const { data, error } = await supabase
        .from("identity_update_proposals")
        .insert({
            user_id: userId,
            domain,
            proposed_statement: proposedStatement,
        });

    if (error) throw error;
    return true;
}