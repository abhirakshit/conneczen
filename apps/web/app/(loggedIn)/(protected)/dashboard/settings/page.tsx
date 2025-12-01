"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/authContext";
import { useUserData } from "@/lib/store/useUserData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { createJSClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { COACH_TYPES } from "@/lib/constants/coachTypes";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function SettingsPage() {
    const { user } = useAuth();
    const supabase = createJSClient();

    const {
        settings,
        schedules,
        fetchUserData,
        updateSettings,
        refreshSchedules,
        loading,
    } = useUserData();

    const [saving, setSaving] = useState(false);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (user?.id) fetchUserData(user.id);
    }, [user?.id]);

    async function handleSaveSettings() {
        if (!settings) return;
        setSaving(true);
        try {
            await updateSettings(settings);
            toast.success("Settings updated successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    async function handleAddSchedule() {
        if (!user?.id) return;
        setAdding(true);
        try {
            const timezoneStr =
                settings?.timezone ||
                Intl.DateTimeFormat().resolvedOptions().timeZone ||
                "UTC";

            const newSchedule = {
                user_id: user.id,
                schedule_type: "custom",
                call_time_local: "09:00",
                call_time_utc: dayjs()
                    .tz(timezoneStr)
                    .hour(9)
                    .minute(0)
                    .utc()
                    .format("HH:mm"),
                timezone: timezoneStr,
            };

            const { error } = await supabase.from("user_schedules").insert(newSchedule);
            if (error) throw error;

            await refreshSchedules(user.id);
            toast.success("New schedule added.");
        } catch (err) {
            console.error(err);
            toast.error("Error adding schedule. Please try again.");
        } finally {
            setAdding(false);
        }
    }

    async function handleUpdateSchedule(id: string, field: string, value: string) {
        try {
            const schedule = schedules.find((s) => s.id === id);
            if (!schedule) return;

            const updated = { ...schedule, [field]: value };

            const [h, m] = updated.call_time_local.split(":").map(Number);
            const utcTime = dayjs()
                .tz(updated.timezone)
                .hour(h)
                .minute(m)
                .utc()
                .format("HH:mm");

            const userId = user?.id;
            const { error } = await supabase.from("user_schedules").upsert({
                id: updated.id,
                user_id: userId,
                schedule_type: updated.schedule_type,
                call_time_local: updated.call_time_local,
                call_time_utc: utcTime,
                timezone: updated.timezone,
            });

            if (error) throw error;

            await refreshSchedules(userId);
            toast.success("Schedule updated.");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update schedule.");
        }
    }

    async function handleDeleteSchedule(id: string) {
        try {
            const { error } = await supabase.from("user_schedules").delete().eq("id", id);
            if (error) throw error;

            await refreshSchedules(user?.id);
            toast.success("Schedule deleted.");
        } catch (err) {
            console.error(err);
            toast.error("Could not delete schedule.");
        }
    }

    if (loading || !settings) {
        return (
            <div className="flex min-h-screen items-center justify-center text-gray-500">
                Loading settings...
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-10 space-y-8">
            <h1 className="text-3xl font-semibold mb-4">Your Settings</h1>

            {/* ==== User Settings ==== */}
            <div className="space-y-4 border p-5 rounded-md">
                <Input
                    placeholder="Full Name"
                    value={settings.full_name || ""}
                    onChange={(e) => updateSettings({ full_name: e.target.value })}
                />

                <div>
                    <label className="text-sm font-medium mb-1 block">Coach Type</label>
                    <Select
                        value={settings.coach_type || ""}
                        onValueChange={(v) => updateSettings({ coach_type: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Coach Type" />
                        </SelectTrigger>
                        <SelectContent>
                            {COACH_TYPES.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-1 block">Language</label>
                    <Select
                        value={settings.language || "en"}
                        onValueChange={(v) => updateSettings({ language: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="hi">Hindi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-1 block">Timezone</label>
                    <Input
                        value={settings.timezone || ""}
                        onChange={(e) => updateSettings({ timezone: e.target.value })}
                    />
                </div>

                <Button onClick={handleSaveSettings} disabled={saving} className="w-full mt-3">
                    {saving ? "Saving..." : "Save Settings"}
                </Button>
            </div>

            {/* ==== Schedules ==== */}
            <div className="space-y-4 border p-5 rounded-md">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Daily Call Schedules</h2>
                    <Button onClick={handleAddSchedule} disabled={adding} variant="outline">
                        {adding ? "Adding..." : "Add Schedule"}
                    </Button>
                </div>

                {schedules.length === 0 ? (
                    <p className="text-gray-500">No schedules found.</p>
                ) : (
                    schedules.map((s) => (
                        <div
                            key={s.id}
                            className="flex items-center justify-between gap-3 border-b pb-2"
                        >
                            <div className="flex items-center gap-3 w-full">
                                <Select
                                    value={s.schedule_type}
                                    onValueChange={(v) =>
                                        handleUpdateSchedule(s.id, "schedule_type", v)
                                    }
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="morning">Morning</SelectItem>
                                        <SelectItem value="evening">Evening</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Input
                                    type="time"
                                    value={s.call_time_local}
                                    onChange={(e) =>
                                        handleUpdateSchedule(s.id, "call_time_local", e.target.value)
                                    }
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteSchedule(s.id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}