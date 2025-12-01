"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/authContext";
import { useUserData } from "@/lib/store/useUserData";
// import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { useRouter, usePathname } from "next/navigation";
import {NavbarHome} from "@/components/navbar-home";

export default function LoggedInLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    const { user } = useAuth();
    const { fetchUserData, loading: userDataLoading, onboardingStatus } = useUserData();

    /**
     * STEP 1 — User is logged in → Load their settings + schedules
     */
    useEffect(() => {
        if (user?.id) {
            fetchUserData(user.id).then(r => console.info("*** Loading user data...**"));
        }
    }, [user?.id]);


    /**
     * STEP 2 — Redirect:
     * - if onboarding incomplete → force to /onboarding/*
     * - if onboarding complete → force to /dashboard (unless already inside protected)
     */
    useEffect(() => {
        // Still loading auth or Zustand data?
        if (!user?.id || onboardingStatus === "pending" || userDataLoading) return;

        const isOnboardingPage = pathname.startsWith("/onboarding");

        if (onboardingStatus === "incomplete" && !isOnboardingPage) {
            router.replace("/onboarding");
            return;
        }

        if (onboardingStatus === "complete" && isOnboardingPage) {
            router.replace("/dashboard");
            return;
        }

        // Otherwise: user is allowed to stay where they are
    }, [user?.id, onboardingStatus, userDataLoading, pathname]);


    /**
     * STEP 3 — Unified loading screen
     */
    if (!user?.id || onboardingStatus === "pending" || userDataLoading) {
        return (
            <div className="flex h-screen items-center justify-center text-gray-500">
                Loading...
            </div>
        );
    }


    /**
     * STEP 4 — Render everything inside (loggedIn)
     */
    return <>
        {children}
    </>;
}