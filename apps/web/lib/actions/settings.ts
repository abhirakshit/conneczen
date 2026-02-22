"use server";

import { z } from "zod";
import { createSSRClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { localTimeToUtc } from "@/lib/utils/timezone";
import type { ScheduleType } from "@/types/database";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().nullable().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  morning_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
    .nullable(),
  evening_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
    .nullable(),
}).refine(
  (data) => data.morning_time !== null || data.evening_time !== null,
  { message: "At least one call time is required" }
);

export type SettingsFormData = z.infer<typeof settingsSchema>;

export async function updateSettings(formData: SettingsFormData) {
  const supabase = await createSSRClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const validated = settingsSchema.safeParse(formData);

  if (!validated.success) {
    const firstError = validated.error.issues[0];
    return {
      success: false,
      error: firstError?.message ?? "Invalid data",
    };
  }

  const now = new Date().toISOString();
  const { name, phone, timezone, morning_time, evening_time } = validated.data;

  try {
    // 1. Update user name and phone
    const { error: userError } = await supabase
      .from("users")
      .update({
        name,
        phone: phone || null,
      })
      .eq("id", user.id);

    if (userError) throw userError;

    // 2. Update user_settings timezone
    const { error: settingsError } = await supabase
      .from("user_settings")
      .update({
        full_name: name,
        timezone,
        updated_at: now,
      })
      .eq("user_id", user.id);

    if (settingsError) throw settingsError;

    // 3. Deactivate all existing schedules
    await supabase
      .from("user_schedules")
      .update({ active: false, updated_at: now })
      .eq("user_id", user.id);

    // 4. Create/update morning schedule if enabled
    if (morning_time) {
      const morningTimeLocal = `${morning_time}:00`;
      const morningTimeUtc = localTimeToUtc(morning_time, timezone);

      // Check if morning schedule exists
      const { data: existingMorning } = await supabase
        .from("user_schedules")
        .select("id")
        .eq("user_id", user.id)
        .eq("schedule_type", "morning")
        .single();

      if (existingMorning) {
        const { error } = await supabase
          .from("user_schedules")
          .update({
            call_time_local: morningTimeLocal,
            call_time_utc: morningTimeUtc,
            timezone,
            active: true,
            updated_at: now,
          })
          .eq("id", existingMorning.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_schedules")
          .insert({
            user_id: user.id,
            schedule_type: "morning" as ScheduleType,
            call_time_local: morningTimeLocal,
            call_time_utc: morningTimeUtc,
            timezone,
            active: true,
          });

        if (error) throw error;
      }
    }

    // 5. Create/update evening schedule if enabled
    if (evening_time) {
      const eveningTimeLocal = `${evening_time}:00`;
      const eveningTimeUtc = localTimeToUtc(evening_time, timezone);

      // Check if evening schedule exists
      const { data: existingEvening } = await supabase
        .from("user_schedules")
        .select("id")
        .eq("user_id", user.id)
        .eq("schedule_type", "evening")
        .single();

      if (existingEvening) {
        const { error } = await supabase
          .from("user_schedules")
          .update({
            call_time_local: eveningTimeLocal,
            call_time_utc: eveningTimeUtc,
            timezone,
            active: true,
            updated_at: now,
          })
          .eq("id", existingEvening.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_schedules")
          .insert({
            user_id: user.id,
            schedule_type: "evening" as ScheduleType,
            call_time_local: eveningTimeLocal,
            call_time_utc: eveningTimeUtc,
            timezone,
            active: true,
          });

        if (error) throw error;
      }
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}
