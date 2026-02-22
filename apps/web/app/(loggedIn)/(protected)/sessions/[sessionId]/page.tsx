import { notFound } from "next/navigation";
import { createSSRClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/queries/users";
import { getSessionById } from "@/lib/queries/sessions";
import { SessionDetail } from "@/components/dashboard/session-detail";

interface SessionDetailPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { sessionId } = await params;
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ profile }, { session }] = await Promise.all([
    getUserProfile(user.id),
    getSessionById(sessionId, user.id),
  ]);

  if (!session) {
    notFound();
  }

  const timezone = profile?.settings?.timezone || profile?.schedule?.timezone || "UTC";

  return <SessionDetail session={session} timezone={timezone} />;
}
