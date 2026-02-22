"use client";
import { create } from "zustand";
import { createSSRClient } from "@/lib/supabase/client";
import {CoachTypeId} from "@/lib/types/coachTypes";

interface Schedule {
    id: string;
    schedule_type: string;
    call_time_local: string;
    call_time_utc: string;
    timezone: string;
}

interface UserSettings {
    user_id: string;
    full_name: string;
    coach_type: CoachTypeId;
    language: string;
    timezone: string;
    onboarding_completed: boolean;
}

interface UserDataState {
    settings: UserSettings | null;
    schedules: Schedule[];
    onboardingStatus: string;
    onboardingComplete: boolean;
    loading: boolean;
    fetchUserData: (userId: string) => Promise<void>;
    updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
    refreshSchedules: (userId: string) => Promise<void>;
    setOnboardingComplete: (value: boolean) => void;
}

export const useUserData = create<UserDataState>((set, get) => ({
    settings: null,
    schedules: [],
    onboardingStatus: "pending",
    onboardingComplete: false,
    loading: false,

    fetchUserData: async (userId) => {
        const supabase = createSSRClient();
        set({ loading: true });

        const [{ data: settings }, { data: schedules }] =
            await Promise.all([
                supabase
                    .from("user_settings")
                    .select("*")
                    .eq("user_id", userId)
                    .maybeSingle(),

                supabase
                    .from("user_schedules")
                    .select("*")
                    .eq("user_id", userId)
                    .eq("active", true),
            ]);

        // Use onboarding_completed flag from user_settings
        const onboardingComplete = settings?.onboarding_completed === true;

        set({
            settings: settings || null,
            schedules: schedules || [],
            onboardingStatus: onboardingComplete ? "complete" : "incomplete",
            onboardingComplete,
            loading: false,
        });
    },

    updateSettings: async (updates) => {
        const supabase = createSSRClient();
        const settings = get().settings;
        if (!settings) return;

        const updated = { ...settings, ...updates };
        await supabase.from("user_settings").upsert(updated);
        set({ settings: updated });
    },

    refreshSchedules: async (userId) => {
        const supabase = createSSRClient();
        const { data: schedules } = await supabase
            .from("user_schedules")
            .select("*")
            .eq("user_id", userId)
            .order("call_time_local", { ascending: true });

        set({ schedules: schedules || [] });
    },

    setOnboardingComplete: (value) =>
        set({
            onboardingComplete: value,
            onboardingStatus: value ? "complete" : "incomplete",
        }),
}));