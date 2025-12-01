// import { useEffect, useState } from "react";
// import { createJSClient } from "@/lib/supabase/client";
//
// export function useOnboardingCheck(userId?: string) {
//   const [status, setStatus] = useState<"pending" | "complete" | "incomplete">(
//     "pending"
//   );
//
//   useEffect(() => {
//     if (!userId) return;
//     const supabase = createJSClient();
//
//     (async () => {
//       const { data: settingsData } = await supabase
//         .from("user_settings")
//         .select("id")
//         .eq("user_id", userId)
//         .limit(1);
//
//       const { data: schedulesData } = await supabase
//         .from("user_schedules")
//         .select("id")
//         .eq("user_id", userId)
//         .limit(1);
//
//       const complete =
//         !!(settingsData?.length && schedulesData?.length);
//       console.log("ONB Status", complete);
//       setStatus(complete ? "complete" : "incomplete");
//     })();
//   }, [userId]);
//
//   return status;
// }