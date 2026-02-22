"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WebCallInterface } from "@/components/call/web-call-interface";
import { createSession, completeSession, failSession } from "@/lib/actions/sessions";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Client component for regular reflection sessions
 * Used when user has confirmed identity
 */
export function RegularCallPageClient() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Create session when call starts
  const handleCallStart = useCallback(async () => {
    if (isCreatingSession || sessionId) return;

    setIsCreatingSession(true);
    const result = await createSession("regular");
    if (result.success && result.sessionId) {
      setSessionId(result.sessionId);
    } else {
      console.error("Failed to create session:", result.error);
    }
    setIsCreatingSession(false);
  }, [isCreatingSession, sessionId]);

  // Complete session when call ends
  const handleCallEnd = async (duration: number, transcript: string) => {
    if (sessionId) {
      // Store the transcript from the OpenAI Realtime API
      await completeSession(sessionId, transcript || `Call duration: ${duration} seconds`);

      // Trigger async summary generation
      try {
        await fetch("/api/calls/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      } catch (error) {
        console.error("Failed to trigger summary generation:", error);
        // Don't block navigation on summary failure
      }
    }

    // Navigate to the session detail page or dashboard
    if (sessionId) {
      router.push(`/sessions/${sessionId}`);
    } else {
      router.push("/dashboard");
    }
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
          <MessageCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reflection Session
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Take a moment to reflect and check in with yourself.
          Your AI companion is here to listen and help you explore your thoughts.
        </p>
      </div>

      {/* Call Interface */}
      <WebCallInterface
        onCallStart={handleCallStart}
        onCallEnd={handleCallEnd}
        onSkip={handleSkip}
        callType="regular"
        sessionId={sessionId}
      />

      {/* Info */}
      <div className="text-center text-sm text-muted-foreground max-w-sm mx-auto">
        <p>
          Sessions typically last 3-5 minutes. Speak naturally and take your time.
        </p>
      </div>
    </div>
  );
}
