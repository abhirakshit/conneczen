import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration, truncateText } from "@/lib/utils/format";
import { formatInTimezone } from "@/lib/utils/timezone";
import type { Session, Json } from "@/types/database";
import { ChevronRight } from "lucide-react";

interface SessionCardProps {
  session: Session;
  timezone: string;
}

// Helper to extract summary text from summary_json
function getSummaryText(summaryJson: Json | null): string | null {
  if (!summaryJson) return null;
  if (typeof summaryJson === "string") return summaryJson;
  if (typeof summaryJson === "object" && summaryJson !== null && !Array.isArray(summaryJson)) {
    const obj = summaryJson as Record<string, Json | undefined>;
    if (typeof obj.summary === "string") return obj.summary;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.content === "string") return obj.content;
  }
  return null;
}

// Calculate duration from started_at and ended_at
function calculateDuration(startedAt: string, endedAt: string | null): number | null {
  if (!endedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  return Math.round((end - start) / 1000);
}

export function SessionCard({ session, timezone }: SessionCardProps) {
  const summaryText = getSummaryText(session.summary_json);
  const duration = calculateDuration(session.started_at, session.ended_at);

  return (
    <Link href={`/sessions/${session.id}`}>
      <Card className="hover:bg-amber-100/50 transition-colors bg-white border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-amber-900">
                  {formatInTimezone(session.started_at, timezone, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <Badge
                  className={session.call_status === "completed"
                    ? "bg-teal-100 text-teal-800 border-teal-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"}
                >
                  {session.call_status}
                </Badge>
              </div>
              <p className="text-sm text-amber-700">
                {formatInTimezone(session.started_at, timezone, {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
                {duration && (
                  <>
                    {" "}
                    &middot; {formatDuration(duration)}
                  </>
                )}
              </p>
              <p className="text-sm text-amber-600 line-clamp-2 mt-2">
                {truncateText(summaryText, 150) || "No summary available"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-amber-400 flex-shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
