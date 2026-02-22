"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IOACallInterface } from "@/components/call/ioa-call-interface";
import { createSession, completeSession, failSession } from "@/lib/actions/sessions";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Client component for IOA (Identity Onboarding Agent) sessions
 * Used when user doesn't have a confirmed identity yet
 * This allows multi-session IOA conversations across multiple calls
 */
export function IOACallPageClient() {
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

  // Complete session when call ends
  const handleCallEnd = async (transcript: string) => {
    if (sessionId) {
      // Store the transcript from the IOA session
      await completeSession(sessionId, transcript);

      // Trigger async summary generation for context in next session
      try {
        await fetch("/api/calls/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      } catch (error) {
        console.error("Failed to trigger summary generation:", error);
      }
    }
  };

  // Handle identity confirmation - navigate to dashboard
  const handleIdentityConfirmed = () => {
    router.push("/dashboard");
  };

  // Handle call skip/cancel
  const handleSkip = async () => {
    if (sessionId) {
      await failSession(sessionId, "declined");
    }
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Continue Identity Discovery
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Let&apos;s pick up where we left off. Your Identity Onboarding Agent
          remembers your previous conversations and is ready to help you
          clarify who you are and what you want to work on.
        </p>
      </div>

      {/* IOA Call Interface */}
      <IOACallInterface
        onCallStart={handleCallStart}
        onCallEnd={handleCallEnd}
        onIdentityConfirmed={handleIdentityConfirmed}
        onSkip={handleSkip}
      />

      {/* Info */}
      <div className="text-center text-sm text-muted-foreground max-w-sm mx-auto space-y-2">
        <p>
          Once your identity is confirmed, you&apos;ll be matched with a coach
          suited to your needs.
        </p>
        <p className="text-xs">
          This is not therapy—it&apos;s a conversation to understand your situation.
        </p>
      </div>
    </div>
  );
}
