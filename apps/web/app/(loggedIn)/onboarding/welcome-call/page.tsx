"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IOACallInterface } from "@/components/call/ioa-call-interface";
import { createSession, completeSession, failSession } from "@/lib/actions/sessions";
import { updateOnboardingState } from "@/lib/actions/identity";
import { Fingerprint } from "lucide-react";

export default function WelcomeCallPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Create IOA session when call starts
  const handleCallStart = useCallback(async () => {
    if (isCreatingSession || sessionId) return;

    setIsCreatingSession(true);
    const result = await createSession("ioa");
    if (result.success && result.sessionId) {
      setSessionId(result.sessionId);
    } else {
      console.error("Failed to create IOA session:", result.error);
    }
    setIsCreatingSession(false);
  }, [isCreatingSession, sessionId]);

  // Handle call end (identity may or may not be confirmed)
  const handleCallEnd = async (transcript: string) => {
    if (sessionId) {
      await completeSession(sessionId, transcript || "IOA session");

      // Trigger async summary generation for context in future IOA sessions
      try {
        await fetch("/api/calls/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      } catch (error) {
        console.error("Failed to trigger summary generation:", error);
        // Don't block - summary generation is for future context
      }
    }
  };

  // Handle identity confirmation - this means onboarding is complete
  const handleIdentityConfirmed = async () => {
    // Mark onboarding as completed
    await updateOnboardingState("completed");

    // Navigate to dashboard
    router.push("/dashboard");
  };

  // Handle skip - user wants to skip IOA for now
  const handleSkip = async () => {
    if (sessionId) {
      await failSession(sessionId, "declined");
    }
    // Don't mark onboarding as completed since identity isn't established
    // But allow them to continue to a limited dashboard
    router.push("/dashboard");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
          <Fingerprint className="h-8 w-8 text-teal-600" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-amber-900">
          Let&apos;s Get to Know You
        </h1>
        <p className="text-amber-700 max-w-md mx-auto">
          Before connecting you with a coach, our Identity Agent will have a brief
          conversation to understand your situation. This helps us match you with
          the right support.
        </p>
      </div>

      {/* What to Expect */}
      <div className="max-w-md mx-auto bg-amber-100/50 rounded-lg p-4 space-y-3 border border-amber-200">
        <p className="text-sm font-medium text-amber-900">What to expect:</p>
        <ul className="text-sm text-amber-700 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-medium">1.</span>
            <span>The agent will ask about what&apos;s on your mind</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-medium">2.</span>
            <span>Share as much or as little as you&apos;re comfortable with</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-medium">3.</span>
            <span>The agent will summarize and confirm your identity profile</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-medium">4.</span>
            <span>Based on your needs, we&apos;ll recommend the right coach type</span>
          </li>
        </ul>
      </div>

      {/* IOA Call Interface */}
      <IOACallInterface
        onCallStart={handleCallStart}
        onCallEnd={handleCallEnd}
        onIdentityConfirmed={handleIdentityConfirmed}
        onSkip={handleSkip}
      />

      {/* Disclaimer */}
      <div className="text-center text-xs text-amber-600 max-w-sm mx-auto space-y-2">
        <p>
          This is a coaching service, not therapy or medical care. The Identity Agent
          will not diagnose, treat, or give advice - just listen and understand.
        </p>
        <p>
          All conversations are confidential. You can stop at any time.
        </p>
      </div>
    </div>
  );
}
