import { createSSRClient } from "@/lib/supabase/server";
import type { User, UserSettings, UserSchedule } from "@/types/database";

// Combined profile type for convenience
export type UserProfileData = {
  user: User;
  settings: UserSettings | null;
  schedule: UserSchedule | null; // Kept for backwards compatibility (first active schedule)
  schedules: UserSchedule[]; // All active schedules
};

/**
 * Get user with settings and active schedule
 */
export async function getUserProfile(userId: string): Promise<{
  profile: UserProfileData | null;
  error: Error | null;
}> {
  const supabase = await createSSRClient();

  // Fetch user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (userError) {
    console.error("Error fetching user:", userError);
    return { profile: null, error: userError };
  }

  // Fetch settings
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Fetch all active schedules
  const { data: schedules } = await supabase
    .from("user_schedules")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .order("schedule_type", { ascending: true }); // morning before evening

  const scheduleList = (schedules || []) as UserSchedule[];

  return {
    profile: {
      user,
      settings: settings || null,
      schedule: scheduleList[0] || null, // Backwards compatibility
      schedules: scheduleList,
    },
    error: null,
  };
}

/**
 * Get just user settings (for onboarding check)
 */
export async function getUserSettings(userId: string) {
  const supabase = await createSSRClient();

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user settings:", error);
  }

  return { settings: data, error };
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const supabase = await createSSRClient();

  const { data } = await supabase
    .from("user_settings")
    .select("onboarding_completed")
    .eq("user_id", userId)
    .single();

  return data?.onboarding_completed ?? false;
}

/**
 * Check if user profile exists (for onboarding flow)
 */
export async function userProfileExists(userId: string): Promise<boolean> {
  const supabase = await createSSRClient();

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking user profile:", error);
  }

  return !!data;
}

/**
 * Get user's active schedule
 */
export async function getUserSchedule(userId: string) {
  const supabase = await createSSRClient();

  const { data, error } = await supabase
    .from("user_schedules")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user schedule:", error);
  }

  return { schedule: data, error };
}
