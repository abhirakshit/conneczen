"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/authContext";
import { useUserData } from "@/lib/store/useUserData";
import { useRouter, usePathname } from "next/navigation";

export default function LoggedInLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    const { user } = useAuth();
    const { fetchUserData, loading: userDataLoading, onboardingStatus } = useUserData();

    /**
     * Load user data when user is available
     */
    useEffect(() => {
        if (user?.id) {
            fetchUserData(user.id);
        }
    }, [user?.id, fetchUserData]);

    /**
     * Redirect logic:
     * - /home handles routing to /onboarding or /dashboard
     * - If user tries to access protected routes without completing onboarding → redirect
     * - If user tries to access /onboarding after completing → redirect to /dashboard
     */
    useEffect(() => {
        if (!user?.id || onboardingStatus === "pending" || userDataLoading) return;

        const isOnboardingPage = pathname.startsWith("/onboarding");
        const isHomePage = pathname === "/home";

        // Let /home handle its own routing
        if (isHomePage) return;

        // Incomplete onboarding: force to /onboarding (unless already there)
        if (onboardingStatus === "incomplete" && !isOnboardingPage) {
            router.replace("/onboarding");
            return;
        }

        // Complete onboarding: redirect away from /onboarding
        if (onboardingStatus === "complete" && isOnboardingPage) {
            router.replace("/dashboard");
            return;
        }
    }, [user?.id, onboardingStatus, userDataLoading, pathname, router]);

    /**
     * Show loading while fetching user data
     */
    if (!user?.id || onboardingStatus === "pending" || userDataLoading) {
        return (
            <div className="flex h-screen items-center justify-center text-muted-foreground">
                Loading...
            </div>
        );
    }

    return <>{children}</>;
}