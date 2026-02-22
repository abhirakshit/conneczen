"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { RealtimeClient } from "@conneczen/realtime";
import type { ConnectionState, TranscriptEntry, CallType, TokenResponse } from "@conneczen/types";

interface UseRealtimeCallOptions {
  sessionId?: string | null;
  callType?: CallType;
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
}

interface UseRealtimeCallReturn {
  connectionState: ConnectionState;
  isAiSpeaking: boolean;
  transcript: TranscriptEntry[];
  aiAudioLevel: number;
  error: string | null;
  connect: (mediaStream: MediaStream) => Promise<void>;
  disconnect: () => void;
  getFormattedTranscript: () => string;
}

export function useRealtimeCall(options: UseRealtimeCallOptions = {}): UseRealtimeCallReturn {
  const { callType = "regular", onTranscriptUpdate } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [aiAudioLevel, setAiAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<RealtimeClient | null>(null);
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

  // Decay AI audio level over time for smooth visualization
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
   * Fetch ephemeral token from our API
   */
  const fetchToken = async (): Promise<TokenResponse> => {
    const response = await fetch("/api/calls/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get session token");
    }

    return response.json();
  };

  /**
   * Connect to OpenAI Realtime API
   */
  const connect = useCallback(async (mediaStream: MediaStream) => {
    if (clientRef.current) {
      throw new Error("Already connected");
    }

    setError(null);
    setConnectionState("connecting");

    try {
      // Get ephemeral token
      const { token } = await fetchToken();

      if (!token) {
        throw new Error("No token received from server");
      }

      // Create client with callbacks
      clientRef.current = new RealtimeClient({
        onConnectionStateChange: (state) => {
          setConnectionState(state);
        },
        onTranscriptUpdate: (newTranscript) => {
          setTranscript(newTranscript);
          onTranscriptUpdate?.(newTranscript);
        },
        onAiSpeakingChange: (speaking) => {
          setIsAiSpeaking(speaking);
          if (!speaking) {
            // Start decay when AI stops speaking
            decayAudioLevel();
          }
        },
        onAudioData: (audioData) => {
          // Calculate audio level for visualization
          let sum = 0;
          for (let i = 0; i < audioData.length; i++) {
            sum += Math.abs(audioData[i]);
          }
          const level = Math.min(1, (sum / audioData.length) * 5);
          setAiAudioLevel(level);
        },
        onError: (err) => {
          setError(err.message);
          console.error("Realtime client error:", err);
        },
      });

      // Connect with token and media stream
      await clientRef.current.connect(token, mediaStream);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Connection failed";
      setError(errorMessage);
      setConnectionState("error");
      throw err;
    }
  }, [callType, onTranscriptUpdate, decayAudioLevel]);

  /**
   * Disconnect from OpenAI Realtime API
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
   * Get formatted transcript string
   */
  const getFormattedTranscript = useCallback(() => {
    if (clientRef.current) {
      return clientRef.current.getFormattedTranscript();
    }
    return transcript
      .map((entry) => `${entry.role === "user" ? "User" : "AI"}: ${entry.text}`)
      .join("\n\n");
  }, [transcript]);

  return {
    connectionState,
    isAiSpeaking,
    transcript,
    aiAudioLevel,
    error,
    connect,
    disconnect,
    getFormattedTranscript,
  };
}
