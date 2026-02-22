"use server";

import { z } from "zod";
import { createSSRClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { localTimeToUtc } from "@/lib/utils/timezone";
import type { ScheduleType } from "@/types/database";

const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  timezone: z.string().min(1, "Timezone is required"),
  morning_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
    .nullable(),
  evening_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
    .nullable(),
  disclaimer_accepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the disclaimer to continue",
  }),
  privacy_acknowledged: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge the privacy policy to continue",
  }),
}).refine(
  (data) => data.morning_time !== null || data.evening_time !== null,
  { message: "At least one call time is required" }
);

export type OnboardingFormData = z.infer<typeof onboardingSchema>;

export async function completeOnboarding(formData: OnboardingFormData) {
  const supabase = await createSSRClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const validated = onboardingSchema.safeParse(formData);

  if (!validated.success) {
    const firstError = validated.error.issues[0];
    return {
      success: false,
      error: firstError?.message ?? "Invalid data",
    };
  }

  const now = new Date().toISOString();
  const {
    name,
    phone,
    timezone,
    morning_time,
    evening_time,
    disclaimer_accepted,
    privacy_acknowledged,
  } = validated.data;

  try {
    // 1. Check if user exists, create/update
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existingUser) {
      // Update existing user
      const { error: userError } = await supabase
        .from("users")
        .update({
          name,
          phone,
          email: user.email,
        })
        .eq("id", user.id);

      if (userError) throw userError;
    } else {
      // Create new user
      const { error: userError } = await supabase.from("users").insert({
        id: user.id,
        name,
        phone,
        email: user.email,
      });

      if (userError) throw userError;
    }

    // 2. Create/update user_settings
    const { data: existingSettings } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const settingsData = {
      full_name: name,
      timezone,
      onboarding_completed: true,
      disclaimer_accepted_at: disclaimer_accepted ? now : null,
      privacy_acknowledged_at: privacy_acknowledged ? now : null,
      updated_at: now,
    };

    if (existingSettings) {
      const { error: settingsError } = await supabase
        .from("user_settings")
        .update(settingsData)
        .eq("user_id", user.id);

      if (settingsError) throw settingsError;
    } else {
      const { error: settingsError } = await supabase
        .from("user_settings")
        .insert({
          user_id: user.id,
          ...settingsData,
        });

      if (settingsError) throw settingsError;
    }

    // 3. Deactivate all existing schedules
    await supabase
      .from("user_schedules")
      .update({ active: false, updated_at: now })
      .eq("user_id", user.id);

    // 4. Create morning schedule if enabled
    if (morning_time) {
      const morningTimeLocal = `${morning_time}:00`;
      const morningTimeUtc = localTimeToUtc(morning_time, timezone);

      const { error: morningError } = await supabase
        .from("user_schedules")
        .insert({
          user_id: user.id,
          schedule_type: "morning" as ScheduleType,
          call_time_local: morningTimeLocal,
          call_time_utc: morningTimeUtc,
          timezone,
          active: true,
        });

      if (morningError) throw morningError;
    }

    // 5. Create evening schedule if enabled
    if (evening_time) {
      const eveningTimeLocal = `${evening_time}:00`;
      const eveningTimeUtc = localTimeToUtc(evening_time, timezone);

      const { error: eveningError } = await supabase
        .from("user_schedules")
        .insert({
          user_id: user.id,
          schedule_type: "evening" as ScheduleType,
          call_time_local: eveningTimeLocal,
          call_time_utc: eveningTimeUtc,
          timezone,
          active: true,
        });

      if (eveningError) throw eveningError;
    }

    revalidatePath("/dashboard");
    revalidatePath("/onboarding");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return { success: false, error: "Failed to save your preferences" };
  }
}
