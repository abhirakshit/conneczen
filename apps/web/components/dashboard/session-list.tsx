import { SessionCard } from "./session-card";
import { EmptyState } from "./empty-state";
import { MessageSquare } from "lucide-react";
import type { Session } from "@/types/database";

interface SessionListProps {
  sessions: Session[];
  timezone: string;
}

export function SessionList({ sessions, timezone }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-12 w-12" />}
        title="No sessions yet"
        description="Your reflection sessions will appear here after your first voice call. We'll call you at your scheduled time."
      />
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} timezone={timezone} />
      ))}
    </div>
  );
}
