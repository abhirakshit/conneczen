import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight } from "lucide-react";
import { formatDuration, truncateText } from "@/lib/utils/format";
import { formatInTimezone } from "@/lib/utils/timezone";
import type { Session } from "@/types/database";
import { EmptyState } from "./empty-state";

interface RecentSessionsCardProps {
  sessions: Session[];
  timezone: string;
}

// Helper to extract summary text from summary_json
function getSummaryText(summaryJson: unknown): string | null {
  if (!summaryJson) return null;
  if (typeof summaryJson === "string") return summaryJson;
  if (typeof summaryJson === "object" && summaryJson !== null) {
    const obj = summaryJson as Record<string, unknown>;
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

export function RecentSessionsCard({ sessions, timezone }: RecentSessionsCardProps) {
  if (sessions.length === 0) {
    return (
      <Card className="bg-white border-amber-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-amber-600">
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<MessageSquare className="h-10 w-10" />}
            title="No sessions yet"
            description="Your reflection sessions will appear here after your first voice call."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-amber-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-amber-600">
          Recent Sessions
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
          <Link href="/sessions" className="text-xs">
            View all
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.map((session) => {
          const summaryText = getSummaryText(session.summary_json);
          const duration = calculateDuration(session.started_at, session.ended_at);

          return (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="block rounded-lg border border-amber-200 p-3 hover:bg-amber-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-amber-900">
                      {formatInTimezone(session.started_at, timezone, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-amber-600">
                      {formatInTimezone(session.started_at, timezone, {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
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
                  <p className="text-sm text-amber-700 truncate">
                    {truncateText(summaryText, 80) || "No summary available"}
                  </p>
                </div>
                {duration && (
                  <span className="text-xs text-amber-600 whitespace-nowrap">
                    {formatDuration(duration)}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
