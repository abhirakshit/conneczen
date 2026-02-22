import { NextResponse } from "next/server";
import { runAnalysisForAllUsers } from "@/lib/services/analyst";

/**
 * POST /api/analyst/run
 *
 * Cron endpoint to run the Analyst Agent for all eligible users.
 * Protected by CRON_SECRET environment variable.
 *
 * Called nightly by Vercel Cron.
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // In production, require CRON_SECRET
    if (process.env.NODE_ENV === "production") {
      if (!cronSecret) {
        console.error("CRON_SECRET not configured");
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        );
      }

      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    console.log("Starting analyst cron job...");
    const startTime = Date.now();

    // Run analysis for all users who need it
    const result = await runAnalysisForAllUsers();

    const duration = Date.now() - startTime;
    console.log(`Analyst cron job completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      ...result,
    });
  } catch (error) {
    console.error("Error in analyst cron endpoint:", error);

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
 * GET /api/analyst/run
 *
 * Health check endpoint for the cron job.
 * Vercel pings this to verify the endpoint is reachable.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "analyst-cron",
    description: "Nightly analysis job for generating coach briefings",
  });
}
