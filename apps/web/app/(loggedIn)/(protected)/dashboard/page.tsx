import { createSSRClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/queries/users";
import { getRecentSessions } from "@/lib/queries/sessions";
import { NextCallCard } from "@/components/dashboard/next-call-card";
import { StartSessionCard } from "@/components/dashboard/start-session-card";
import { RecentSessionsCard } from "@/components/dashboard/recent-sessions-card";
import { Sun, Moon } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createSSRClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [profileResult, sessionsResult] = await Promise.all([
    getUserProfile(user.id),
    getRecentSessions(user.id, 5),
  ]);

  const { profile } = profileResult;
  const { sessions } = sessionsResult;

  const timezone = profile?.settings?.timezone || "America/Los_Angeles";
  const userName = profile?.settings?.full_name || profile?.user?.name || "there";

  // Get morning and evening schedules
  const morningSchedule = profile?.schedules?.find(s => s.schedule_type === "morning");
  const eveningSchedule = profile?.schedules?.find(s => s.schedule_type === "evening");

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-amber-900">
          Welcome back, {userName}
        </h1>
        <p className="text-amber-700 mt-1">
          Here&apos;s your daily reflection overview
        </p>
      </div>

      {/* Schedule Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Morning Call */}
        <div className="relative">
          <div className="absolute -top-2 left-3 flex items-center gap-1 bg-amber-50 px-2 text-xs font-medium text-amber-600">
            <Sun className="h-3 w-3" />
            Morning
          </div>
          <NextCallCard
            callTime={morningSchedule?.call_time_local?.slice(0, 5) || null}
            timezone={timezone}
            scheduleType="morning"
          />
        </div>

        {/* Evening Call */}
        <div className="relative">
          <div className="absolute -top-2 left-3 flex items-center gap-1 bg-amber-50 px-2 text-xs font-medium text-indigo-600">
            <Moon className="h-3 w-3" />
            Evening
          </div>
          <NextCallCard
            callTime={eveningSchedule?.call_time_local?.slice(0, 5) || null}
            timezone={timezone}
            scheduleType="evening"
          />
        </div>

        {/* Start Session */}
        <StartSessionCard />
      </div>

      {/* Recent Sessions */}
      <RecentSessionsCard sessions={sessions} timezone={timezone} />
    </div>
  );
}
