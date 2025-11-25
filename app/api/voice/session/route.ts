import { kaiAgent } from "@/lib/agentConfigs/kai";
import {NextResponse} from "next/server";

export async function POST() {
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-4o-realtime-preview-2024-12-17",
            modalities: ["audio"],
            commands: ["sip"],
            voice: "alloy",
            instructions: kaiAgent.instructions, // <<< reuse Kai
        }),
    });

    return NextResponse.json(await r.json());
}