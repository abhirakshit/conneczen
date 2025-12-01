"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { RealtimeAgent, RealtimeSession, tool } from "@openai/agents-realtime";

export default function VoiceChatSDK() {
    const [session, setSession] = useState<RealtimeSession | null>(null);
    const [connected, setConnected] = useState(false);

    async function start() {
        if (connected) return;

        // 1. Build an agent (can live outside component if static)
        const getWeatherTool = tool({
            name: "get_weather",
            description: "Get the weather for a given city",
            parameters: z.object({ city: z.string() }),
            execute: async ({ city }) => `The weather in ${city} is sunny`,
        });

        const agent = new RealtimeAgent({
            name: "Conneczen Coach",
            instructions:
                "You are a calm, concise voice coach. Ask one question at a time.",
            tools: [getWeatherTool],
        });

        const tokenResponse = await fetch("/api/session");
        console.log("TR PP", tokenResponse);
        const client_secret = await tokenResponse.json();
        console.log("TR PP", client_secret);
        const token = client_secret?.value;
        if (!token) throw new Error("Missing ephemeral token");

        // 3. Create a realtime session
        const s = new RealtimeSession(agent);

        s.on("connectionstatechange", (state) => {
            if (state === "connected") setConnected(true);
            if (state === "disconnected") setConnected(false);
        });

        s.on("error", (e) => console.error("Realtime error:", e));

        // 4. Connect (SDK handles WebRTC internally)
        await s.connect({ apiKey: token });

        setSession(s);
    }

    function stop() {
        session?.disconnect();
        setConnected(false);
    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={start}
                disabled={connected}
                className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
            >
                {connected ? "Connected" : "Start Voice"}
            </button>
            <button
                onClick={stop}
                disabled={!connected}
                className="px-3 py-2 bg-gray-200 rounded"
            >
                Stop
            </button>
        </div>
    );
}