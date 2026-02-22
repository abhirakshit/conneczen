"use client";

import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Mic, MicOff, Phone, PhoneOff, PanelRightOpen, PanelRightClose } from "lucide-react";
import type { RealtimeAgent } from "@openai/agents/realtime";

import { Button } from "@/components/ui/button";
import Transcript from "@/components/chat/Transcript";
import Events from "@/components/chat/Events";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { useRealtimeSession } from "@/hooks/useRealtimeSession";
import { ioaScenario } from "@/lib/agentConfigs/ioa";

type SessionStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED";

interface OnboardingVoiceChatProps {
    /** Agent scenario to use - defaults to IOA */
    agents?: RealtimeAgent[];
    /** Called when agent requests identity confirmation */
    onConfirmationReady?: (data: {
        identity_summary: string;
        coach_recommendation: {
            coach_type: string;
            reasoning: string;
        };
    }) => void;
    /** Called when identity draft is saved */
    onIdentityDraftSaved?: (data: {
        preferred_name?: string | null;
        primary_struggle?: string | null;
        desired_direction?: string | null;
        readiness_level?: number | null;
        time_availability?: "low" | "medium" | "high" | null;
    }) => void;
}

export default function OnboardingVoiceChat({
    agents = ioaScenario,
    onConfirmationReady,
    onIdentityDraftSaved,
}: OnboardingVoiceChatProps) {
    const { addTranscriptMessage, addTranscriptBreadcrumb } = useTranscript();
    const { logClientEvent, logServerEvent } = useEvent();

    const [sessionStatus, setSessionStatus] = useState<SessionStatus>("DISCONNECTED");
    const [userText, setUserText] = useState("");
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isLogsExpanded, setIsLogsExpanded] = useState(false);

    const audioElementRef = useRef<HTMLAudioElement | null>(null);

    // Create audio element for playback
    const sdkAudioElement = React.useMemo(() => {
        if (typeof window === "undefined") return undefined;
        const el = document.createElement("audio");
        el.autoplay = true;
        el.style.display = "none";
        document.body.appendChild(el);
        return el;
    }, []);

    useEffect(() => {
        if (sdkAudioElement && !audioElementRef.current) {
            audioElementRef.current = sdkAudioElement;
        }
    }, [sdkAudioElement]);

    const {
        connect,
        disconnect,
        sendUserText,
        sendEvent,
        interrupt,
        mute,
    } = useRealtimeSession({
        onConnectionChange: (s) => setSessionStatus(s as SessionStatus),
        onToolCall: (toolName, toolArgs) => {
            // Handle IOA tool calls
            if (toolName === "request_confirmation" && onConfirmationReady) {
                onConfirmationReady(toolArgs);
            }
            if (toolName === "save_identity_draft" && onIdentityDraftSaved) {
                onIdentityDraftSaved(toolArgs);
            }
        },
    });

    const fetchEphemeralKey = async (): Promise<string | null> => {
        logClientEvent({ url: "/session" }, "fetch_session_token_request");
        const tokenResponse = await fetch("/api/session");
        const client_secret = await tokenResponse.json();
        logServerEvent(client_secret, "fetch_session_token_response");

        if (!client_secret?.value) {
            logClientEvent(client_secret, "error.no_ephemeral_key");
            console.error("No ephemeral key provided by the server");
            setSessionStatus("DISCONNECTED");
            return null;
        }

        return client_secret.value;
    };

    const connectToRealtime = async () => {
        if (sessionStatus !== "DISCONNECTED") return;
        setSessionStatus("CONNECTING");

        try {
            const EPHEMERAL_KEY = await fetchEphemeralKey();
            if (!EPHEMERAL_KEY) return;

            await connect({
                getEphemeralKey: async () => EPHEMERAL_KEY,
                initialAgents: agents,
                audioElement: sdkAudioElement,
                extraContext: {
                    addTranscriptBreadcrumb,
                },
            });
        } catch (err) {
            console.error("Error connecting:", err);
            setSessionStatus("DISCONNECTED");
        }
    };

    const disconnectFromRealtime = () => {
        disconnect();
        setSessionStatus("DISCONNECTED");
    };

    // When connected, set up VAD and trigger initial greeting
    useEffect(() => {
        if (sessionStatus === "CONNECTED") {
            // Enable server-side voice activity detection
            sendEvent({
                type: "session.update",
                session: {
                    turn_detection: {
                        type: "server_vad",
                        threshold: 0.9,
                        prefix_padding_ms: 300,
                        silence_duration_ms: 500,
                        create_response: true,
                    },
                },
            });

            // Trigger agent to greet the user
            const id = uuidv4().slice(0, 32);
            addTranscriptMessage(id, "user", "hi", true);
            sendEvent({
                type: "conversation.item.create",
                item: {
                    id,
                    type: "message",
                    role: "user",
                    content: [{ type: "input_text", text: "hi" }],
                },
            });
            sendEvent({ type: "response.create" });
        }
    }, [sessionStatus]);

    // Handle audio mute state
    useEffect(() => {
        if (audioElementRef.current) {
            audioElementRef.current.muted = !isAudioEnabled;
        }
        try {
            mute(!isAudioEnabled);
        } catch {
            // Ignore if not connected
        }
    }, [isAudioEnabled, mute]);

    const handleSendMessage = () => {
        if (!userText.trim() || sessionStatus !== "CONNECTED") return;
        interrupt();
        sendUserText(userText.trim());
        setUserText("");
    };

    const toggleConnection = () => {
        if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
            disconnectFromRealtime();
        } else {
            connectToRealtime();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Main content area with Transcript and Logs */}
            <div className="flex-1 overflow-hidden flex gap-2 p-2">
                <div className={`${isLogsExpanded ? "w-1/2" : "flex-1"} transition-all duration-200`}>
                    <Transcript
                        userText={userText}
                        setUserText={setUserText}
                        onSendMessage={handleSendMessage}
                        canSend={sessionStatus === "CONNECTED"}
                        downloadRecording={() => {}}
                    />
                </div>
                <Events isExpanded={isLogsExpanded} />
            </div>

            {/* Bottom controls */}
            <div className="border-t bg-background p-4">
                <div className="flex items-center justify-center gap-4">
                    {/* Mute toggle */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                        disabled={sessionStatus !== "CONNECTED"}
                    >
                        {isAudioEnabled ? (
                            <Mic className="h-5 w-5" />
                        ) : (
                            <MicOff className="h-5 w-5 text-muted-foreground" />
                        )}
                    </Button>

                    {/* Connect/Disconnect button */}
                    <Button
                        size="lg"
                        variant={sessionStatus === "CONNECTED" ? "destructive" : "default"}
                        onClick={toggleConnection}
                        disabled={sessionStatus === "CONNECTING"}
                        className="min-w-[140px]"
                    >
                        {sessionStatus === "CONNECTING" ? (
                            "Connecting..."
                        ) : sessionStatus === "CONNECTED" ? (
                            <>
                                <PhoneOff className="h-5 w-5 mr-2" />
                                End Call
                            </>
                        ) : (
                            <>
                                <Phone className="h-5 w-5 mr-2" />
                                Start Call
                            </>
                        )}
                    </Button>

                    {/* Logs toggle */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsLogsExpanded(!isLogsExpanded)}
                    >
                        {isLogsExpanded ? (
                            <PanelRightClose className="h-5 w-5" />
                        ) : (
                            <PanelRightOpen className="h-5 w-5" />
                        )}
                    </Button>
                </div>

                {sessionStatus === "DISCONNECTED" && (
                    <p className="text-center text-sm text-muted-foreground mt-3">
                        Click &quot;Start Call&quot; to begin your conversation
                    </p>
                )}
            </div>
        </div>
    );
}
