"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSSRClient } from "@/lib/supabase/client";

export default function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get("next") || "/dashboard";

    useEffect(() => {
        const supabase = createSSRClient();

        // Restore session from cookie
        supabase.auth.getSession().then(({data}) => {
            if (data.session) {
                router.replace(next);
            } else {
                router.replace("/sign-in"); // or show an error
            }
        });
    }, [next]);

    return <div className="flex h-screen items-center justify-center text-gray-500">
        Signing in ...
    </div>
}