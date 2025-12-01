"use client";
import { create } from "zustand";
import { createJSClient } from "@/lib/supabase/client";
import {CoachTypeId} from "@/lib/constants/coachTypes";

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
        console.log('Start Fetch Data...', userId);
        const supabase = createJSClient();
        set({ loading: true });

        const { data: settings } = await supabase
            .from("user_settings")
            .select("*")
            .eq("user_id", userId).single();

        const { data: schedules } = await supabase
            .from("user_schedules")
            .select("*")
            .eq("user_id", userId);

        console.log('Fetched Data...', schedules, settings);

        const onboardingComplete = !!(settings && schedules?.length);

        set({
            settings: settings || null,
            schedules: schedules || [],
            onboardingStatus: onboardingComplete ? "complete" : "incomplete",
            onboardingComplete,
            loading: false,
        });
        console.log("Data Loaded", onboardingComplete);
    },

    updateSettings: async (updates) => {
        const supabase = createJSClient();
        const settings = get().settings;
        if (!settings) return;

        const updated = { ...settings, ...updates };
        await supabase.from("user_settings").upsert(updated);
        set({ settings: updated });
    },

    refreshSchedules: async (userId) => {
        const supabase = createJSClient();
        const { data: schedules } = await supabase
            .from("user_schedules")
            .select("*")
            .eq("user_id", userId)
            .order("call_time_local", { ascending: true });

        set({ schedules: schedules || [] });
    },

    setOnboardingComplete: (value) => set({ onboardingComplete: value }),
}));