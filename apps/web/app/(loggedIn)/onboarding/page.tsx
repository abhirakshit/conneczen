"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJSClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {useAuth} from "@/hooks/authContext";

dayjs.extend(utc);
dayjs.extend(timezone);

import { COACH_TYPES } from "@/lib/constants/coachTypes";
import {NavbarHome} from "@/components/navbar-home";

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = createJSClient();
    const { user } = useAuth();


    const detectedTimezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    const [form, setForm] = useState({
        full_name: user?.user_metadata.full_name,
        coach_type: "",
        language: "en",
        timezone: detectedTimezone,
    });

    const [schedules, setSchedules] = useState([
        { schedule_type: "evening", call_time_local: "21:00" },
    ]);

    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const updateSchedule = (index: number, field: string, value: string) => {
        const copy = [...schedules];
        copy[index] = { ...copy[index], [field]: value };
        setSchedules(copy);
    };

    const addSchedule = () =>
        setSchedules([
            ...schedules,
            { schedule_type: "custom", call_time_local: "09:00" },
        ]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        if (!user) {
            console.log("No user found.");
            return;
        }

        // 1️⃣ Save user_settings
        const { error: settingsError } = await supabase.from("user_settings").upsert({
            user_id: user.id,
            full_name: form.full_name,
            coach_type: form.coach_type,
            language: form.language,
            timezone: form.timezone,
        });

        if (settingsError) {
            console.error(settingsError);
            setLoading(false);
            return;
        }

        // 2️⃣ Save user_schedules
        for (const s of schedules) {
            const [hours, minutes] = s.call_time_local.split(":").map(Number);

            const localTime = dayjs()
                .tz(form.timezone)
                .hour(hours)
                .minute(minutes)
                .second(0)
                .millisecond(0);

            const utcTime = localTime.utc().format("HH:mm");

            await supabase.from("user_schedules").upsert({
                user_id: user.id,
                schedule_type: s.schedule_type,
                call_time_local: s.call_time_local,
                call_time_utc: utcTime,
                timezone: form.timezone,
            });
        }

        setLoading(false);
        router.push("/dashboard");
    }

    return (
        <div className="max-w-lg mx-auto py-10 space-y-6">
            <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
                <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                    <NavbarHome/>
                </div>
            </nav>
            <h1 className="text-3xl font-semibold text-center">
                Complete Your Setup
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    name="full_name"
                    placeholder="Your full name"
                    value={form.full_name}
                    onChange={handleChange}
                />

                <div>
                    <label className="text-sm font-medium mb-1 block">
                        Choose Your Coaching Focus
                    </label>
                    <Select
                        value={form.coach_type}
                        onValueChange={(value) => setForm({...form, coach_type: value})}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a coaching style"/>
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
                    <label className="text-sm font-medium">Preferred Language</label>
                    <Select
                        value={form.language}
                        onValueChange={(value) => setForm({...form, language: value})}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a language"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="hi">Hindi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <p className="text-sm text-gray-500">
                    Timezone detected:{" "}
                    <span className="font-medium">{form.timezone}</span>
                </p>

                <div className="space-y-4">
                    <h2 className="text-xl font-medium">Daily Call Times</h2>
                    {schedules.map((s, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-1/2">
                                <Select
                                    value={s.schedule_type}
                                    onValueChange={(value) =>
                                        updateSchedule(i, "schedule_type", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Type"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="morning">Morning</SelectItem>
                                        <SelectItem value="evening">Evening</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Input
                                type="time"
                                value={s.call_time_local}
                                onChange={(e) =>
                                    updateSchedule(i, "call_time_local", e.target.value)
                                }
                            />
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={addSchedule}
                        className="mt-2"
                    >
                        + Add Another Call
                    </Button>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Saving..." : "Save & Continue"}
                </Button>
            </form>
        </div>
    );
}