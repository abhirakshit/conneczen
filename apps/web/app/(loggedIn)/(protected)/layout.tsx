import { redirect } from "next/navigation";
import { createSSRClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/queries/users";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSSRClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { profile } = await getUserProfile(user.id);

  return (
    <DashboardShell user={user} profile={profile}>
      {children}
    </DashboardShell>
  );
}
