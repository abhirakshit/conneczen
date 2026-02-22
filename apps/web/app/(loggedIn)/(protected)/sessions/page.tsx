import { createSSRClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/queries/users";
import { getUserSessions } from "@/lib/queries/sessions";
import { SessionList } from "@/components/dashboard/session-list";
import { Pagination } from "@/components/dashboard/pagination";

interface SessionsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function SessionsPage({ searchParams }: SessionsPageProps) {
  const { page: pageParam } = await searchParams;
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const page = Number(pageParam) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const [{ profile }, { sessions, total }] = await Promise.all([
    getUserProfile(user.id),
    getUserSessions(user.id, { limit, offset }),
  ]);

  const timezone = profile?.settings?.timezone || profile?.schedule?.timezone || "UTC";
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <p className="text-muted-foreground">
          {total > 0
            ? `You have ${total} reflection session${total !== 1 ? "s" : ""}.`
            : "Your reflection sessions will appear here."}
        </p>
      </div>

      <SessionList sessions={sessions} timezone={timezone} />

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
