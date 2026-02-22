"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  Check,
  User,
  Target,
  Compass,
  Clock,
} from "lucide-react";
import { useIOACall } from "@/hooks/useIOACall";
import { hasMinimumIdentityFields } from "@conneczen/types";

type CallState = "idle" | "requesting-permission" | "connecting" | "active" | "ended";

interface IOACallInterfaceProps {
  onCallStart?: () => void;
  onCallEnd?: (transcript: string) => void;
  onIdentityConfirmed?: () => void;
  onSkip?: () => void;
  userName?: string;
}

export function IOACallInterface({
  onCallStart,
  onCallEnd,
  onIdentityConfirmed,
  onSkip,
  userName,
}: IOACallInterfaceProps) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userAudioLevel, setUserAudioLevel] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSoftWarning, setShowSoftWarning] = useState(false);
  const [extensionState, setExtensionState] = useState<"none" | "prompted" | "extended">("none");

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserActivityRef = useRef<number>(Date.now());
  const extensionPromptedAtRef = useRef<number | null>(null);
  const extensionStateRef = useRef(extensionState);

  const SOFT_WARNING_SECONDS = 180;
  const EXTENSION_PROMPT_SECONDS = 300;
  const NO_RESPONSE_TIMEOUT_MS = 30000;
  const ACTIVITY_LEVEL_THRESHOLD = 0.06;

  // IOA hook
  const {
    connectionState,
    isAiSpeaking,
    transcript,
    aiAudioLevel,
    error: ioaError,
    sessionState,
    confirmationRequested,
    connect,
    disconnect,
    confirmAndComplete,
    getFormattedTranscript,
  } = useIOACall();

  // Update error from IOA hook
  useEffect(() => {
    if (ioaError) {
      setError(ioaError);
    }
  }, [ioaError]);

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

  // Audio level visualization
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
    onCallStart?.();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      setCallState("connecting");

      await connect(stream);

      setCallState("active");
      startTimeRef.current = Date.now();

      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);

      updateAudioLevel();

    } catch (err) {
      console.error("Error starting IOA call:", err);
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
    cleanup();
    setCallState("ended");
    onCallEnd?.(finalTranscript);
  }, [cleanup, getFormattedTranscript, onCallEnd]);

  const handleExtend = useCallback(() => {
    setExtensionState("extended");
    extensionPromptedAtRef.current = null;
  }, []);

  const handleConfirm = async () => {
    setIsConfirming(true);
    const success = await confirmAndComplete();
    setIsConfirming(false);

    if (success) {
      endCall();
      onIdentityConfirmed?.();
    }
  };

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

  const displayAudioLevel = isAiSpeaking ? aiAudioLevel : userAudioLevel;
  const speakerLabel = isAiSpeaking ? "IOA is speaking..." : "Listening to you...";

  // Identity progress indicators
  const { identityDraft } = sessionState;
  const hasName = !!identityDraft.preferred_name;
  const hasStruggle = !!identityDraft.primary_struggle;
  const hasDirection = !!identityDraft.desired_direction;
  const hasReadiness = identityDraft.readiness_level !== null;

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

  return (
    <Card className="w-full max-w-md mx-auto bg-white border-amber-200">
      <CardContent className="p-6">
        {/* Idle State */}
        {callState === "idle" && (
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-amber-900">Identity Discovery Session</h3>
              <p className="text-amber-700 text-sm">
                Before we connect you with a coach, let&apos;s take a few minutes to understand
                where you&apos;re at and what you&apos;re looking for. This helps us match you
                with the right support.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Button onClick={startCall} size="lg" className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                <Phone className="mr-2 h-5 w-5" />
                Start Discovery Session
              </Button>
              {onSkip && (
                <Button variant="ghost" onClick={onSkip} className="w-full text-amber-700 hover:bg-amber-100">
                  Skip for now
                </Button>
              )}
            </div>

            <p className="text-xs text-amber-600">
              You&apos;ll need to allow microphone access. This is not therapy - it&apos;s
              a brief conversation to understand your needs.
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
              Connecting to your Identity Onboarding Agent...
            </p>
          </div>
        )}

        {/* Active Call */}
        {callState === "active" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Identity Discovery</p>
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

            {/* Identity Progress */}
            <div className="flex justify-center gap-2 flex-wrap">
              <Badge variant={hasName ? "default" : "outline"} className="gap-1">
                <User className="h-3 w-3" />
                Name
              </Badge>
              <Badge variant={hasStruggle ? "default" : "outline"} className="gap-1">
                <Target className="h-3 w-3" />
                Struggle
              </Badge>
              <Badge variant={hasDirection ? "default" : "outline"} className="gap-1">
                <Compass className="h-3 w-3" />
                Direction
              </Badge>
              <Badge variant={hasReadiness ? "default" : "outline"} className="gap-1">
                <Clock className="h-3 w-3" />
                Readiness
              </Badge>
            </div>

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
              <div className="max-h-24 overflow-y-auto text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                {transcript.slice(-3).map((entry, i) => (
                  <p key={i} className="truncate mb-1">
                    <span className="font-medium">
                      {entry.role === "user" ? "You: " : "IOA: "}
                    </span>
                    {entry.text}
                  </p>
                ))}
              </div>
            )}

            {/* Confirmation Button (appears when IOA requests confirmation) */}
            {confirmationRequested && sessionState.identityConfirmation && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Ready to confirm your identity?
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  {sessionState.identityConfirmation.identity_summary}
                </p>
                <Button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {isConfirming ? "Confirming..." : "Confirm & Continue"}
                </Button>
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
              {sessionState.onboardingState === "completed" ? (
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              ) : (
                <Phone className="h-8 w-8 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {sessionState.onboardingState === "completed"
                  ? "Identity Confirmed!"
                  : "Session Complete"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {sessionState.onboardingState === "completed"
                  ? `Thanks${userName ? `, ${userName}` : ""}! We've matched you with the right coaching support based on your needs.`
                  : `Session duration: ${formatDuration(duration)}. You can continue your identity discovery later.`}
              </p>
            </div>

            {/* Identity Summary */}
            {sessionState.identityConfirmation && (
              <div className="text-left bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Your Identity Summary</p>
                <p className="text-xs text-muted-foreground">
                  {sessionState.identityConfirmation.identity_summary}
                </p>
                <p className="text-xs text-primary">
                  Recommended: {sessionState.identityConfirmation.coach_recommendation.coach_type} coaching
                </p>
              </div>
            )}

            <Button
              onClick={() => onIdentityConfirmed?.()}
              className="w-full"
            >
              Continue to Dashboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
