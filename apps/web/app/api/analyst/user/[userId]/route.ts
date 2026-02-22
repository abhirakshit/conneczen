import { NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabase/server";
import { runAnalysisForUser } from "@/lib/services/analyst";
import { getLatestBriefing, needsAnalysis } from "@/lib/queries/briefings";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * POST /api/analyst/user/[userId]
 *
 * Trigger analysis for a specific user.
 * Can be called on-demand after important sessions.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await params;

    // Authenticate the requesting user
    const supabase = await createSSRClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow users to trigger analysis for themselves
    // or admins (could add admin check here later)
    if (user.id !== userId) {
      return NextResponse.json(
        { error: "Forbidden - can only analyze own sessions" },
        { status: 403 }
      );
    }

    // Check if analysis is needed
    const needsNewAnalysis = await needsAnalysis(userId);
    if (!needsNewAnalysis) {
      const { briefing } = await getLatestBriefing(userId);
      return NextResponse.json({
        success: true,
        message: "Analysis already up to date",
        briefing,
      });
    }

    // Run analysis
    console.log(`Running on-demand analysis for user ${userId}`);
    const result = await runAnalysisForUser(userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Fetch the newly created briefing
    const { briefing } = await getLatestBriefing(userId);

    return NextResponse.json({
      success: true,
      briefingId: result.briefingId,
      briefing,
    });
  } catch (error) {
    console.error("Error in single-user analyst endpoint:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analyst/user/[userId]
 *
 * Get the latest briefing for a user.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await params;

    // Authenticate the requesting user
    const supabase = await createSSRClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow users to view their own briefings
    if (user.id !== userId) {
      return NextResponse.json(
        { error: "Forbidden - can only view own briefings" },
        { status: 403 }
      );
    }

    const { briefing, error } = await getLatestBriefing(userId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const needsNewAnalysis = await needsAnalysis(userId);

    return NextResponse.json({
      success: true,
      briefing,
      needsAnalysis: needsNewAnalysis,
    });
  } catch (error) {
    console.error("Error fetching user briefing:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
