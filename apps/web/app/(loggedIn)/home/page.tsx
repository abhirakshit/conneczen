"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserData } from "@/lib/store/useUserData";

/**
 * Routing hub: redirects to /onboarding or /dashboard based on onboarding status.
 * The parent (loggedIn) layout already fetches user data, so we just read the status.
 */
export default function HomePage() {
    const router = useRouter();
    const { onboardingStatus, loading } = useUserData();

    useEffect(() => {
        // Wait for data to load
        if (loading || onboardingStatus === "pending") return;

        if (onboardingStatus === "complete") {
            router.replace("/dashboard");
        } else {
            router.replace("/onboarding");
        }
    }, [onboardingStatus, loading, router]);

    return null;
}