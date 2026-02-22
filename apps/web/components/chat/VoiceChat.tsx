"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { RealtimeSession } from "@openai/agents-realtime";

// Your Kai agent

// UI components
import Transcript from "@/components/chat/Transcript";
import Events from "@/components/chat/Events";
import BottomToolbar from "@/components/chat/BottomToolbar";

// Contexts (you already have these in your project)
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import {addictionCoachAgent} from "../../../../packages/agents/addictionCoach";
import useAudioDownload from "@/hooks/useAudioDownload";

type SessionStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED";

export default function VoiceChatClient() {
    // ------------------------------
    // State
    // ------------------------------
    const [sessionStatus, setSessionStatus] = useState<SessionStatus>("DISCONNECTED");
    const [userText, setUserText] = useState("");
    const [isPTTActive, setIsPTTActive] = useState(false);
    const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState(false);
    const [isEventsPaneExpanded, setIsEventsPaneExpanded] = useState(true);
    const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] = useState(true);

    // ------------------------------
    // Context
    // ------------------------------
    const { addTranscriptMessage } = useTranscript();
    const { logServerEvent } = useEvent();

    // ------------------------------
    // Realtime session ref
    // ------------------------------
    const sessionRef = useRef<RealtimeSession | null>(null);

    // Initialize the recording hook.
    const { startRecording, stopRecording, downloadRecording } =
        useAudioDownload();

    // Load persisted UI prefs
    useEffect(() => {
        const storedLogsExpanded = localStorage.getItem("logsExpanded");
        if (storedLogsExpanded) {
            setIsEventsPaneExpanded(storedLogsExpanded === "true");
        }
        const storedAudioPlaybackEnabled = localStorage.getItem("audioPlaybackEnabled");
        if (storedAudioPlaybackEnabled) {
            setIsAudioPlaybackEnabled(storedAudioPlaybackEnabled === "true");
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("logsExpanded", isEventsPaneExpanded.toString());
    }, [isEventsPaneExpanded]);

    useEffect(() => {
        localStorage.setItem(
            "audioPlaybackEnabled",
            isAudioPlaybackEnabled.toString(),
        );
    }, [isAudioPlaybackEnabled]);

    // ------------------------------
    // Helper: fetch ephemeral key
    // ------------------------------
    const fetchEphemeralKey = async (): Promise<string | null> => {
        try {
            const res = await fetch("/api/session");
            const data = await res.json();

            // Depending on how your API is implemented, adapt this line:
            // The OpenAI example returns { client_secret: { value: "..." } }
            const key =
                data?.client_secret?.value ??
                data?.client_secret ??
                data?.apiKey ??
                data?.value ??
                null;

            if (!key) {
                console.error("No ephemeral key in /api/session response:", data);
                return null;
            }

            logServerEvent(data, "fetch_session_token_response");
            return key;
        } catch (err) {
            console.error("Error fetching ephemeral key:", err);
            return null;
        }
    };

    // ------------------------------
    // Connect to Realtime (voice)
    // ------------------------------
    const connectToRealtime = async () => {
        if (sessionStatus !== "DISCONNECTED") return;

        setSessionStatus("CONNECTING");

        const apiKey = await fetchEphemeralKey();
        if (!apiKey) {
            setSessionStatus("DISCONNECTED");
            return;
        }

        // 1) Create a new session
        const session = new RealtimeSession(addictionCoachAgent);

        sessionRef.current = session;

        // 2) Wire message events → transcript
        // @ts-expect-error - SDK event types may be incomplete
        session.on("message", (msg: any) => {
            try {
                const content = msg?.content ?? [];
                const textPart = content.find(
                    (c: any) => c.type === "output_text" && c.text,
                );
                const text = textPart?.text;
                if (!text) return;

                addTranscriptMessage(uuidv4(), "assistant", text);
            } catch (err) {
                console.error("Error handling message event:", err);
            }
        });

        // Optional: log other events
        // @ts-expect-error - SDK event types may be incomplete
        session.on("response.completed", (event: any) => {
            logServerEvent(event, "response.completed");
        });

        session.on("error", (event: any) => {
            console.error("Realtime session error:", event);
        });

        try {
            // 3) Connect — this will prompt for mic access and start audio I/O
            await session.connect({ apiKey });
            setSessionStatus("CONNECTED");

            // Kick off coaching with a greeting
            session.sendMessage("Hi Kai, I'm ready to talk.");
        } catch (err) {
            console.error("Error connecting Realtime session:", err);
            setSessionStatus("DISCONNECTED");
            sessionRef.current = null;
        }
    };

    // ------------------------------
    // Disconnect
    // ------------------------------
    const disconnectFromRealtime = () => {
        try {
            sessionRef.current?.close();
        } catch (err) {
            console.error("Error closing Realtime session:", err);
        } finally {
            sessionRef.current = null;
            setSessionStatus("DISCONNECTED");
            setIsPTTUserSpeaking(false);
        }
    };

    // ------------------------------
    // Text send
    // ------------------------------
    const handleSendTextMessage = () => {
        if (!userText.trim()) return;
        if (sessionStatus !== "CONNECTED") return;

        const text = userText.trim();

        // Echo into transcript
        addTranscriptMessage(uuidv4(), "user", text, true);

        // Send to Realtime session
        try {
            sessionRef.current?.sendMessage(text);
        } catch (err) {
            console.error("Failed to send message to Realtime session:", err);
        }

        setUserText("");
    };

    // ------------------------------
    // PTT handlers (optional, simple)
    // ------------------------------
    const handleTalkButtonDown = () => {
        if (sessionStatus !== "CONNECTED") return;
        setIsPTTUserSpeaking(true);

        // For now, let continuous VAD handle speech;
        // if you later want strict PTT, you can use input_audio_buffer events.
    };

    const handleTalkButtonUp = () => {
        if (sessionStatus !== "CONNECTED") return;
        setIsPTTUserSpeaking(false);
    };

    // ------------------------------
    // Toggle connection
    // ------------------------------
    const onToggleConnection = () => {
        if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
            disconnectFromRealtime();
        } else {
            connectToRealtime();
        }
    };

    return (
        <div className="text-base flex flex-col min-h-[calc(100vh-64px)] text-gray-800 relative">
            {/* Top bar */}
            <div className="p-4 text-lg font-semibold flex justify-between items-center border-b">
                <div>Conneczen • Live Voice Session</div>
                <div className="text-sm text-gray-500">
                    Status:{" "}
                    <span
                        className={
                            sessionStatus === "CONNECTED"
                                ? "text-green-600"
                                : sessionStatus === "CONNECTING"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                        }
                    >
            {sessionStatus.toLowerCase()}
          </span>
                </div>
            </div>

            {/* Main content: transcript + events */}
            <div className="flex flex-1 gap-2 overflow-hidden relative">
                <Transcript
                    userText={userText}
                    setUserText={setUserText}
                    onSendMessage={handleSendTextMessage}
                    downloadRecording={downloadRecording}
                    canSend={
                        sessionStatus === "CONNECTED"
                    }
                />

                <Events isExpanded={isEventsPaneExpanded} />
            </div>

            {/* Bottom toolbar */}
            <BottomToolbar
                sessionStatus={sessionStatus}
                onToggleConnection={onToggleConnection}
                isPTTActive={isPTTActive}
                setIsPTTActive={setIsPTTActive}
                isPTTUserSpeaking={isPTTUserSpeaking}
                handleTalkButtonDown={handleTalkButtonDown}
                handleTalkButtonUp={handleTalkButtonUp}
                isEventsPaneExpanded={isEventsPaneExpanded}
                setIsEventsPaneExpanded={setIsEventsPaneExpanded}
                isAudioPlaybackEnabled={isAudioPlaybackEnabled}
                setIsAudioPlaybackEnabled={setIsAudioPlaybackEnabled}
                codec="opus"           // kept for compatibility; not actually switching
                onCodecChange={() => {}} // no-op for now
            />
        </div>
    );
}