"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react";
import { useRealtimeCall } from "@/hooks/useRealtimeCall";
import type { CallType, TranscriptEntry } from "@conneczen/types";

type CallState = "idle" | "requesting-permission" | "connecting" | "active" | "ended";

interface WebCallInterfaceProps {
  onCallStart?: () => void;
  onCallEnd?: (duration: number, transcript: string) => void;
  onSkip?: () => void;
  userName?: string;
  callType?: CallType;
  sessionId?: string | null;
}

export function WebCallInterface({
  onCallStart,
  onCallEnd,
  onSkip,
  userName,
  callType = "welcome",
  sessionId,
}: WebCallInterfaceProps) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userAudioLevel, setUserAudioLevel] = useState(0);
  const [showSoftWarning, setShowSoftWarning] = useState(false);
  const [extensionState, setExtensionState] = useState<"none" | "prompted" | "extended">("none");

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const durationRef = useRef(0);
  const lastUserActivityRef = useRef<number>(Date.now());
  const extensionPromptedAtRef = useRef<number | null>(null);
  const extensionStateRef = useRef(extensionState);

  const SOFT_WARNING_SECONDS = 180;
  const EXTENSION_PROMPT_SECONDS = 300;
  const NO_RESPONSE_TIMEOUT_MS = 30000;
  const ACTIVITY_LEVEL_THRESHOLD = 0.06;

  // Realtime API hook
  const {
    connectionState,
    isAiSpeaking,
    transcript,
    aiAudioLevel,
    error: realtimeError,
    connect,
    disconnect,
    getFormattedTranscript,
  } = useRealtimeCall({
    sessionId,
    callType,
    onTranscriptUpdate: (newTranscript) => {
      transcriptRef.current = newTranscript;
    },
  });

  // Update error from realtime hook
  useEffect(() => {
    if (realtimeError) {
      setError(realtimeError);
    }
  }, [realtimeError]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    extensionStateRef.current = extensionState;
  }, [extensionState]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    disconnect();
  }, [disconnect]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Audio level visualization for user's microphone
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const level = average / 255;
    setUserAudioLevel(level);

    if (!isMuted && level > ACTIVITY_LEVEL_THRESHOLD) {
      lastUserActivityRef.current = Date.now();
      if (extensionStateRef.current === "prompted") {
        setExtensionState("extended");
        extensionPromptedAtRef.current = null;
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, [isMuted]);

  const startCall = async () => {
    setError(null);
    setCallState("requesting-permission");
    setDuration(0);
    setShowSoftWarning(false);
    setExtensionState("none");
    extensionPromptedAtRef.current = null;
    lastUserActivityRef.current = Date.now();

    // Notify parent that call is starting (for session creation)
    onCallStart?.();

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Set up audio analysis for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      setCallState("connecting");

      // Connect to OpenAI Realtime API
      await connect(stream);

      setCallState("active");
      startTimeRef.current = Date.now();

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);

      // Start audio visualization
      updateAudioLevel();

    } catch (err) {
      console.error("Error starting call:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start call. Please check your microphone permissions."
      );
      setCallState("idle");
    }
  };

  const endCall = useCallback(() => {
    const finalTranscript = getFormattedTranscript();
    const finalDuration = durationRef.current;
    cleanup();
    setCallState("ended");
    onCallEnd?.(finalDuration, finalTranscript);
  }, [cleanup, getFormattedTranscript, onCallEnd]);

  const handleExtend = useCallback(() => {
    setExtensionState("extended");
    extensionPromptedAtRef.current = null;
  }, []);

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (callState !== "active") return;

    if (!showSoftWarning && duration >= SOFT_WARNING_SECONDS) {
      setShowSoftWarning(true);
    }

    if (extensionState === "none" && duration >= EXTENSION_PROMPT_SECONDS) {
      setExtensionState("prompted");
      extensionPromptedAtRef.current = Date.now();
    }
  }, [callState, duration, showSoftWarning, extensionState]);

  useEffect(() => {
    if (callState !== "active" || extensionState !== "prompted") return;

    const interval = setInterval(() => {
      const promptedAt = extensionPromptedAtRef.current;
      if (!promptedAt) return;

      const now = Date.now();
      if (lastUserActivityRef.current > promptedAt) {
        handleExtend();
        return;
      }

      if (now - promptedAt >= NO_RESPONSE_TIMEOUT_MS) {
        endCall();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [callState, extensionState, handleExtend, endCall]);

  // Determine which audio level to show (user or AI)
  const displayAudioLevel = isAiSpeaking ? aiAudioLevel : userAudioLevel;
  const speakerLabel = isAiSpeaking ? "AI is speaking..." : "Listening to you...";

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        {/* Idle State */}
        {callState === "idle" && (
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {callType === "welcome" ? "Ready for Your Welcome Call?" : "Ready to Reflect?"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {callType === "welcome"
                  ? "Experience a brief intro session with your AI reflection companion. This helps you get familiar with how daily sessions will feel."
                  : "Take a few minutes to check in with yourself. Your AI companion is here to listen."}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Button onClick={startCall} size="lg" className="w-full">
                <Phone className="mr-2 h-5 w-5" />
                {callType === "welcome" ? "Start Welcome Call" : "Start Session"}
              </Button>
              {onSkip && (
                <Button variant="ghost" onClick={onSkip} className="w-full">
                  Skip for now
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              You&apos;ll need to allow microphone access for the call.
            </p>
          </div>
        )}

        {/* Requesting Permission */}
        {callState === "requesting-permission" && (
          <div className="text-center space-y-4 py-8">
            <div className="animate-pulse">
              <Mic className="h-12 w-12 mx-auto text-primary" />
            </div>
            <p className="text-muted-foreground">Requesting microphone access...</p>
          </div>
        )}

        {/* Connecting */}
        {callState === "connecting" && (
          <div className="text-center space-y-4 py-8">
            <div className="relative">
              <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="absolute inset-0 h-20 w-20 mx-auto rounded-full border-2 border-primary/30 animate-ping" />
            </div>
            <p className="text-muted-foreground">
              {connectionState === "connecting"
                ? "Connecting to your AI companion..."
                : "Setting up your session..."}
            </p>
          </div>
        )}

        {/* Active Call */}
        {callState === "active" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {callType === "welcome" ? "Welcome Call" : "Reflection Session"}
              </p>
              <p className="text-3xl font-mono font-semibold">{formatDuration(duration)}</p>
            </div>

            {showSoftWarning && extensionState === "none" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                About 2 minutes left. We will wrap up soon.
              </div>
            )}

            {extensionState === "prompted" && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm space-y-3">
                <p className="text-muted-foreground">
                  We have been chatting for about 5 minutes. Would you like a few more minutes?
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleExtend} className="flex-1">
                    Keep going
                  </Button>
                  <Button variant="outline" onClick={endCall} className="flex-1">
                    End session
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  We will wrap up if there is no response for 30 seconds.
                </p>
              </div>
            )}

            {/* Audio Visualization */}
            <div className="flex items-center justify-center gap-1 h-16">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-75 ${
                    isAiSpeaking ? "bg-green-500" : "bg-primary"
                  }`}
                  style={{
                    height: `${Math.max(8, displayAudioLevel * 64 * (0.5 + Math.random() * 0.5))}px`,
                    opacity: 0.3 + displayAudioLevel * 0.7,
                  }}
                />
              ))}
            </div>

            {/* Speaking Indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Volume2 className={`h-4 w-4 ${isAiSpeaking ? "text-green-500" : ""}`} />
              <span>{speakerLabel}</span>
            </div>

            {/* Transcript Preview */}
            {transcript.length > 0 && (
              <div className="max-h-20 overflow-y-auto text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                {transcript.slice(-2).map((entry, i) => (
                  <p key={i} className="truncate">
                    <span className="font-medium">
                      {entry.role === "user" ? "You: " : "AI: "}
                    </span>
                    {entry.text}
                  </p>
                ))}
              </div>
            )}

            {/* Call Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={endCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>

            {isMuted && (
              <p className="text-center text-sm text-muted-foreground">
                You are muted
              </p>
            )}
          </div>
        )}

        {/* Call Ended */}
        {callState === "ended" && (
          <div className="text-center space-y-6 py-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Phone className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {callType === "welcome" ? "Welcome Call Complete!" : "Session Complete!"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {callType === "welcome"
                  ? `Great start${userName ? `, ${userName}` : ""}! You spoke for ${formatDuration(duration)}. Your daily reflection sessions will feel just like this.`
                  : `Thanks for taking time to reflect${userName ? `, ${userName}` : ""}. Session duration: ${formatDuration(duration)}.`}
              </p>
            </div>
            <Button onClick={() => onCallEnd?.(duration, getFormattedTranscript())} className="w-full">
              {callType === "welcome" ? "Continue to Dashboard" : "View Session Summary"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
