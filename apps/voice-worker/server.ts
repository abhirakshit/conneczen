import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import {RealtimeAgent, RealtimeSession} from "@openai/agents-realtime";
import dotenv from "dotenv";
import {TwilioRealtimeTransportLayer} from "@openai/agents-extensions";
import {createClient} from "@supabase/supabase-js";

dotenv.config();
const PORT = process.env.PORT || 8080;
const { OPENAI_API_KEY } = process.env;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SECRET_KEY!;


if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    console.error("❌ Missing required environment variables.");
    process.exit(1);
}

const BASE_URL = process.env.VOICE_WORKER_BASE_URL;

if (!BASE_URL) {
    throw new Error("VOICE_WORKER_BASE_URL missing from environment");
}

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE
);

const WORKER_WS_URL =
    BASE_URL.replace("https://", "wss://").replace("http://", "ws://") +
    "/twilio-media";

console.log("🔗 Using WS URL:", WORKER_WS_URL);


// ---------- 2. Twilio → returns TwiML with <Stream> ----------
app.post("/twilio/voice", (req, res) => {
    // const userId = req.query.userId;
    //
    // const wsUrl = `wss://${req.headers.host}/media-stream?userId=${userId}`;

    const contextId = req.query.contextId;
    const host = req.headers.host;

    const wsUrl = `wss://${host}/media-stream?contextId=${contextId}`;

    const twiml = `
    <Response>
      <Say>Starting your coaching session.</Say>
      <Connect>
        <Stream url="${wsUrl}" />
      </Connect>
    </Response>
  `.trim();

    res.type("text/xml").send(twiml);
});

// ---------- 3. Create HTTP server + WebSocket server ----------
const server = http.createServer(app);

// WebSocketServer bound to /media-stream
const wss = new WebSocketServer({
    server,
    path: "/media-stream",
});

// ---------- 4. Handle Twilio media WebSocket and bridge to OpenAI ----------

wss.on("connection", async (ws, req) => {
    console.log("🟢 Twilio media WebSocket connected");
    const params = new URLSearchParams(req.url?.split("?")[1]);
    const contextId = params.get("contextId");

    const { data: context } = await supabase
        .from("call_context")
        .select("instructions, user_id")
        .eq("id", contextId)
        .single();

    const instructions = context?.instructions;

    // This wrapper understands Twilio's event format: {event: "start" | "media" | "stop", ...}
    const twilioTransportLayer = new TwilioRealtimeTransportLayer({
        twilioWebSocket: ws,
    });

    const kaiAgent = new RealtimeAgent({
        name: "Kai",
        instructions: instructions
    });

    const session = new RealtimeSession(kaiAgent, {
        transport: twilioTransportLayer,
        model: "gpt-realtime",
        config: {
            audio: {
                output: {
                    voice: "verse", // or 'alloy' depending on model
                },
            },
        },
    });

    session.on("error", (err) => {
        console.error("❌ Realtime session error:", err);
    });

    session.on("history_added", (item) => {
        // Later we can persist transcripts here
        console.log("📝 History item:", JSON.stringify(item, null, 2));
    });

    try {
        await session.connect({ apiKey: OPENAI_API_KEY! });
        console.log("🤖 Connected to OpenAI Realtime");
    } catch (err) {
        console.error("❌ Failed to connect Realtime session:", err);
        ws.close();
        return;
    }

    ws.on("close", () => {
        console.log("🔴 Twilio WebSocket closed");
        session.close().catch((err: any) =>
            console.error("Error closing Realtime session:", err),
        );
    });

    ws.on("error", (err) => {
        console.error("❌ WebSocket error:", err);
    });
});

// ---------- 5. Start server ----------

server.listen(PORT, () => {
    console.log(`🚀 Voice worker listening on port ${PORT}`);
});