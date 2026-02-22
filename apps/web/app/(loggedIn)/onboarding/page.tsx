"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import OnboardingVoiceChat from "@/components/chat/OnboardingVoiceChat";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";

interface IdentityDraft {
    preferred_name?: string | null;
    primary_struggle?: string | null;
    desired_direction?: string | null;
    readiness_level?: number | null;
    time_availability?: "low" | "medium" | "high" | null;
}

interface ConfirmationData {
    identity_summary: string;
    coach_recommendation: {
        coach_type: string;
        reasoning: string;
    };
}

export default function OnboardingPage() {
    const router = useRouter();

    const [identityDraft, setIdentityDraft] = useState<IdentityDraft>({});
    const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const handleIdentityDraftSaved = (data: IdentityDraft) => {
        // Merge new data with existing draft
        setIdentityDraft((prev) => ({
            ...prev,
            ...Object.fromEntries(
                Object.entries(data).filter(([, v]) => v !== null)
            ),
        }));
    };

    const handleConfirmationReady = (data: ConfirmationData) => {
        setConfirmationData(data);
    };

    async function handleConfirm() {
        if (!confirmationData) return;

        setIsConfirming(true);
        try {
            await fetch("/api/onboarding/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    identity: identityDraft,
                    ...confirmationData,
                }),
            });
            router.replace("/dashboard");
        } catch (error) {
            console.error("Failed to confirm onboarding:", error);
            setIsConfirming(false);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-56px)]">
            <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>}>
                    <TranscriptProvider>
                        <EventProvider>
                            <OnboardingVoiceChat
                                onIdentityDraftSaved={handleIdentityDraftSaved}
                                onConfirmationReady={handleConfirmationReady}
                            />
                        </EventProvider>
                    </TranscriptProvider>
                </Suspense>
            </div>

            {confirmationData && (
                <div className="border-t bg-muted/50 p-4">
                    <div className="max-w-2xl mx-auto space-y-3">
                        <p className="text-sm text-muted-foreground">
                            {confirmationData.identity_summary}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Recommended: <span className="font-medium">{confirmationData.coach_recommendation.coach_type}</span>
                            {" — "}{confirmationData.coach_recommendation.reasoning}
                        </p>
                        <Button
                            onClick={handleConfirm}
                            disabled={isConfirming}
                            className="w-full"
                        >
                            {isConfirming ? "Confirming..." : "Confirm & Continue"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}