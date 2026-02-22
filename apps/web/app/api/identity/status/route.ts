import { NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabase/server";
import { hasConfirmedIdentity, getIdentityDraftForContext } from "@/lib/queries/identity";

/**
 * GET /api/identity/status
 * Returns the current user's identity status for UI gating
 */
export async function GET() {
  try {
    const supabase = await createSSRClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { hasConfirmedIdentity: false, hasDraft: false },
        { status: 401 }
      );
    }

    const [hasIdentity, draft] = await Promise.all([
      hasConfirmedIdentity(user.id),
      getIdentityDraftForContext(user.id),
    ]);

    return NextResponse.json({
      hasConfirmedIdentity: hasIdentity,
      hasDraft: !!draft,
      draft: draft, // Include draft data for UI display if needed
    });
  } catch (error) {
    console.error("Error checking identity status:", error);
    return NextResponse.json(
      { error: "Failed to check identity status" },
      { status: 500 }
    );
  }
}
