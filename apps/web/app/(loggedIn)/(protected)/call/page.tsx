import { redirect } from "next/navigation";
import { createSSRClient } from "@/lib/supabase/server";
import { hasConfirmedIdentity } from "@/lib/queries/identity";
import { IOACallPageClient } from "@/components/call/ioa-call-page-client";
import { RegularCallPageClient } from "@/components/call/regular-call-page-client";

/**
 * Call Page - Routes between IOA and regular call interfaces
 *
 * If user has no confirmed identity: Shows IOA interface to continue identity discovery
 * If user has confirmed identity: Shows regular reflection call interface
 */
export default async function CallPage() {
  const supabase = await createSSRClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has a confirmed identity
  const hasIdentity = await hasConfirmedIdentity(user.id);

  if (!hasIdentity) {
    // User needs to continue IOA to establish identity
    return <IOACallPageClient />;
  }

  // User has confirmed identity, use regular reflection call
  return <RegularCallPageClient />;
}
