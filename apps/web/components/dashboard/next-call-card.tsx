import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone } from "lucide-react";
import { getNextScheduledCall, isToday, isTomorrow, formatInTimezone } from "@/lib/utils/timezone";
import { getRelativeTime } from "@/lib/utils/format";
import type { ScheduleType } from "@/types/database";

interface NextCallCardProps {
  callTime: string | null; // "HH:MM" format
  timezone: string;
  scheduleType?: ScheduleType;
}

export function NextCallCard({ callTime, timezone, scheduleType }: NextCallCardProps) {
  if (!callTime) {
    return (
      <Card className="bg-white border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-amber-600">
            Next Call
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-600 text-sm">
            Not scheduled. Set your time in Settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const nextCall = getNextScheduledCall(callTime, timezone);
  const relativeTime = getRelativeTime(nextCall);

  const dayLabel = isToday(nextCall, timezone)
    ? "Today"
    : isTomorrow(nextCall, timezone)
    ? "Tomorrow"
    : formatInTimezone(nextCall, timezone, { weekday: "long" });

  const timeLabel = formatInTimezone(nextCall, timezone, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Card className="bg-white border-amber-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
          <Phone className="h-4 w-4" />
          {scheduleType === "morning" ? "Morning Check-in" : scheduleType === "evening" ? "Evening Reflection" : "Next Call"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-amber-900">{timeLabel}</p>
        <p className="text-sm text-amber-700 mt-1">
          {dayLabel} &middot; {relativeTime}
        </p>
      </CardContent>
    </Card>
  );
}
