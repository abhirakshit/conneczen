"use client";

import { useEffect, useRef, useState } from "react";

export default function VoiceTestPage() {
    const [connected, setConnected] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);

    // Output playback
    const playbackContextRef = useRef<AudioContext | null>(null);
    const playbackBufferQueueRef = useRef<Float32Array[]>([]);

    useEffect(() => {
        playbackContextRef.current = new AudioContext();
        return () => {
            playbackContextRef.current?.close();
        };
    }, []);

    const connectWS = () => {
        if (wsRef.current) return;

        const ws = new WebSocket(process.env.NEXT_PUBLIC_WORKER_WS_URL!);
        // e.g. wss://<ngrok-host>/media-stream-test

        ws.binaryType = "arraybuffer";

        ws.onopen = () => {
            console.log("WS connected");
            setConnected(true);
        };

        ws.onclose = () => {
            console.log("WS closed");
            setConnected(false);
            wsRef.current = null;
        };

        ws.onmessage = async (event) => {
            // Expect JSON with { type: "audio", payload: "<base64>" }
            try {
                const data = JSON.parse(typeof event.data === "string" ? event.data : "");
                if (data.type === "audio" && data.payload) {
                    const pcm16 = base64ToInt16(data.payload);
                    playPCM16(pcm16);
                }
            } catch (e) {
                console.warn("Non-JSON or unexpected message:", event.data);
            }
        };

        wsRef.current = ws;
    };

    const disconnectWS = () => {
        wsRef.current?.close();
    };

    const startStreaming = async () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn("WS not connected");
            return;
        }

        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = audioContextRef.current;

        const source = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(2048, 1, 1);

        processor.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0); // Float32 [-1,1]
            const pcm16 = float32ToInt16(input);
            const b64 = int16ToBase64(pcm16);

            wsRef.current?.send(
                JSON.stringify({
                    type: "audio_chunk",
                    payload: b64,
                }),
            );
        };

        source.connect(processor);
        processor.connect(ctx.destination);

        sourceNodeRef.current = source;
        processorRef.current = processor;
        setSpeaking(true);
    };

    const stopStreaming = () => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        setSpeaking(false);
    };

    // Helpers: conversion
    function float32ToInt16(float32: Float32Array): Int16Array {
        const out = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
            let s = float32[i];
            s = Math.max(-1, Math.min(1, s));
            out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return out;
    }

    function int16ToBase64(int16: Int16Array): string {
        const buf = Buffer.from(int16.buffer);
        return buf.toString("base64");
    }

    function base64ToInt16(b64: string): Int16Array {
        const buf = Buffer.from(b64, "base64");
        return new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2);
    }

    // Playback
    const playPCM16 = (pcm16: Int16Array) => {
        const ctx = playbackContextRef.current;
        if (!ctx) return;

        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
            float32[i] = pcm16[i] / 32768;
        }

        const buffer = ctx.createBuffer(1, float32.length, ctx.sampleRate);
        buffer.copyToChannel(float32, 0);

        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(ctx.destination);
        src.start();
    };

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-semibold">Browser ↔ Worker Voice Test</h1>

            <div className="space-x-2">
                {!connected ? (
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                        onClick={connectWS}
                    >
                        Connect
                    </button>
                ) : (
                    <button
                        className="px-4 py-2 bg-gray-600 text-white rounded"
                        onClick={disconnectWS}
                    >
                        Disconnect
                    </button>
                )}

                {connected && !speaking && (
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded"
                        onClick={startStreaming}
                    >
                        Start Mic
                    </button>
                )}

                {connected && speaking && (
                    <button
                        className="px-4 py-2 bg-red-600 text-white rounded"
                        onClick={stopStreaming}
                    >
                        Stop Mic
                    </button>
                )}
            </div>

            <div>
                <p>WS status: {connected ? "Connected" : "Disconnected"}</p>
                <p>Mic streaming: {speaking ? "On" : "Off"}</p>
            </div>
        </div>
    );
}