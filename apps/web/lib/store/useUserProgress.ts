"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

type OnboardingStatus = "pending" | "incomplete" | "complete";

interface UserProgressState {
    onboardingStatus: OnboardingStatus;
    refreshStatus: (userId: string) => Promise<void>;
}

export const useUserProgress = create<UserProgressState>((set) => ({
    onboardingStatus: "pending",

    refreshStatus: async (userId: string) => {
        const supabase = createClient();

        const { data: settings } = await supabase
            .from("user_settings")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

        const { data: schedules } = await supabase
            .from("user_schedules")
            .select("id")
            .eq("user_id", userId)
            .limit(1);

        const isComplete = !!settings && schedules && schedules.length > 0;
        set({ onboardingStatus: isComplete ? "complete" : "incomplete" });
    },
}));