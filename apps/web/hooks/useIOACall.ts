"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { IOARealtimeClient } from "@conneczen/realtime";
import type { ConnectionState, TranscriptEntry } from "@conneczen/types";
import type {
  IdentityDraft,
  IdentityConfirmation,
  IOASessionState,
} from "@conneczen/types";
import { initialIOASessionState } from "@conneczen/types";
import { saveIdentityDraft, confirmIdentity } from "@/lib/actions/identity";

interface IOATokenResponse {
  token: string;
  expiresAt: number;
  userName: string | null;
  isReturningUser: boolean;
  hasExistingDraft: boolean;
}

interface UseIOACallReturn {
  connectionState: ConnectionState;
  isAiSpeaking: boolean;
  transcript: TranscriptEntry[];
  aiAudioLevel: number;
  error: string | null;
  // IOA-specific state
  sessionState: IOASessionState;
  confirmationRequested: boolean;
  /** Whether this is a returning user (has previous IOA session or draft) */
  isReturningUser: boolean;
  /** Whether the user has an existing identity draft in progress */
  hasExistingDraft: boolean;
  /** User's name from profile */
  userName: string | null;
  // Actions
  connect: (mediaStream: MediaStream) => Promise<void>;
  disconnect: () => void;
  confirmAndComplete: () => Promise<boolean>;
  getFormattedTranscript: () => string;
}

export function useIOACall(): UseIOACallReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [aiAudioLevel, setAiAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // IOA-specific state
  const [sessionState, setSessionState] = useState<IOASessionState>({
    ...initialIOASessionState,
  });
  const [confirmationRequested, setConfirmationRequested] = useState(false);

  // Returning user context
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [hasExistingDraft, setHasExistingDraft] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  const clientRef = useRef<IOARealtimeClient | null>(null);
  const audioLevelDecayRef = useRef<number | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
      if (audioLevelDecayRef.current) {
        cancelAnimationFrame(audioLevelDecayRef.current);
      }
    };
  }, []);

  // Decay AI audio level for smooth visualization
  const decayAudioLevel = useCallback(() => {
    setAiAudioLevel((prev) => {
      const newLevel = prev * 0.9;
      if (newLevel > 0.01) {
        audioLevelDecayRef.current = requestAnimationFrame(decayAudioLevel);
      }
      return newLevel;
    });
  }, []);

  /**
   * Handle identity draft updates from IOA tool calls
   */
  const handleIdentityDraftUpdate = useCallback(async (draft: Partial<IdentityDraft>) => {
    // Update local state
    setSessionState((prev) => ({
      ...prev,
      onboardingState: "collecting",
      identityDraft: {
        ...prev.identityDraft,
        ...draft,
      },
    }));

    // Persist to database
    try {
      await saveIdentityDraft(draft);
    } catch (err) {
      console.error("Failed to save identity draft:", err);
    }
  }, []);

  /**
   * Handle confirmation request from IOA
   */
  const handleConfirmationRequested = useCallback((confirmation: IdentityConfirmation) => {
    setSessionState((prev) => ({
      ...prev,
      confirmationRequested: true,
      identityConfirmation: confirmation,
      consentAcknowledged: true, // IOA only calls this after consent
    }));
    setConfirmationRequested(true);
  }, []);

  /**
   * Fetch IOA ephemeral token with context info
   */
  const fetchToken = async (): Promise<IOATokenResponse> => {
    const response = await fetch("/api/ioa/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get IOA session token");
    }

    return response.json();
  };

  /**
   * Connect to IOA
   */
  const connect = useCallback(async (mediaStream: MediaStream) => {
    if (clientRef.current) {
      throw new Error("Already connected");
    }

    setError(null);
    setConnectionState("connecting");
    setSessionState((prev) => ({ ...prev, onboardingState: "started" }));

    try {
      const tokenResponse = await fetchToken();

      if (!tokenResponse.token) {
        throw new Error("No token received from server");
      }

      // Capture returning user context
      setIsReturningUser(tokenResponse.isReturningUser || false);
      setHasExistingDraft(tokenResponse.hasExistingDraft || false);
      setUserName(tokenResponse.userName || null);

      clientRef.current = new IOARealtimeClient({
        onConnectionStateChange: (state) => {
          setConnectionState(state);
        },
        onTranscriptUpdate: (newTranscript) => {
          setTranscript(newTranscript);
        },
        onAiSpeakingChange: (speaking) => {
          setIsAiSpeaking(speaking);
          if (!speaking) {
            decayAudioLevel();
          }
        },
        onAudioData: (audioData) => {
          let sum = 0;
          for (let i = 0; i < audioData.length; i++) {
            sum += Math.abs(audioData[i]);
          }
          const level = Math.min(1, (sum / audioData.length) * 5);
          setAiAudioLevel(level);
        },
        onError: (err) => {
          setError(err.message);
          console.error("IOA client error:", err);
        },
        // IOA-specific callbacks
        onIdentityDraftUpdate: handleIdentityDraftUpdate,
        onConfirmationRequested: handleConfirmationRequested,
        onToolCall: (toolName, args) => {
          console.log("IOA tool called:", toolName, args);
        },
      });

      await clientRef.current.connect(tokenResponse.token, mediaStream);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Connection failed";
      setError(errorMessage);
      setConnectionState("error");
      setSessionState((prev) => ({ ...prev, onboardingState: "stalled" }));
      throw err;
    }
  }, [decayAudioLevel, handleIdentityDraftUpdate, handleConfirmationRequested]);

  /**
   * Disconnect from IOA
   */
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setConnectionState("disconnected");
    setIsAiSpeaking(false);
    setAiAudioLevel(0);
  }, []);

  /**
   * Confirm identity and complete onboarding
   */
  const confirmAndComplete = useCallback(async (): Promise<boolean> => {
    if (!sessionState.identityConfirmation) {
      setError("No identity confirmation available");
      return false;
    }

    try {
      const result = await confirmIdentity(
        sessionState.identityConfirmation.identity_summary,
        sessionState.identityConfirmation.coach_recommendation,
        sessionState.identityDraft
      );

      if (result.success) {
        setSessionState((prev) => ({
          ...prev,
          onboardingState: "completed",
        }));
        return true;
      } else {
        setError(result.error || "Failed to confirm identity");
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Confirmation failed";
      setError(errorMessage);
      return false;
    }
  }, [sessionState.identityConfirmation, sessionState.identityDraft]);

  /**
   * Get formatted transcript
   */
  const getFormattedTranscript = useCallback(() => {
    if (clientRef.current) {
      return clientRef.current.getFormattedTranscript();
    }
    return transcript
      .map((entry) => `${entry.role === "user" ? "User" : "IOA"}: ${entry.text}`)
      .join("\n\n");
  }, [transcript]);

  return {
    connectionState,
    isAiSpeaking,
    transcript,
    aiAudioLevel,
    error,
    sessionState,
    confirmationRequested,
    isReturningUser,
    hasExistingDraft,
    userName,
    connect,
    disconnect,
    confirmAndComplete,
    getFormattedTranscript,
  };
}
