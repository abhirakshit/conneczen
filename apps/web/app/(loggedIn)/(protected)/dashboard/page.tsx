"use client";

import {Suspense, useState} from "react";
import { useAuth } from "@/hooks/authContext";
import {TranscriptProvider} from "@/app/contexts/TranscriptContext";
import {EventProvider} from "@/app/contexts/EventContext";
import VoiceChatClient from "@/components/chat/VoiceChatClient";
import {useUserData} from "@/lib/store/useUserData";

export default function DashboardHome() {
    // const { user } = useAuth();
    // const [draft, setDraft] = useState<string>("");
    const {
        settings,
        schedules,
        loading,
    } = useUserData();

    console.log("DD", settings, schedules, loading);
    return (
        <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Daily Overview</h1>

            <Suspense fallback={<div>Loading...</div>}>
                <TranscriptProvider>
                    <EventProvider>
                        <VoiceChatClient />
                    </EventProvider>
                </TranscriptProvider>
            </Suspense>
        </div>
    );
}