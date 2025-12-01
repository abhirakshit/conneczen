import { NextRequest, NextResponse } from "next/server";
import {createJSClient} from "@/lib/supabase/client";
import twilio from "twilio";

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
        return NextResponse.json(
            { error: "userId query param is required" },
            { status: 400 }
        );
    }

    try {
        // 1️⃣ Create Supabase server client
        const supabase = createJSClient();

        // 2️⃣ Fetch user's phone number
        const { data: user, error } = await supabase
            .from("users")
            .select("phone")
            .eq("id", userId)
            .single();

        if (error || !user?.phone) {
            return NextResponse.json(
                { error: "User phone not found" },
                { status: 404 }
            );
        }

        const phone = user.phone;

        // 2) Fetch settings (coach type, language)
        const { data: settings } = await supabase
            .from("user_settings")
            .select("language, coach_type")
            .eq("user_id", userId)
            .single();

        // 3) Fetch last session + transcript + analysis
        const { data: sessions } = await supabase
            .from("call_sessions")
            .select("id")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1);

        let lastTranscript = "";
        let followups: string[] = [];

        if (sessions?.length) {
            const lastSessionId = sessions[0].id;

            lastTranscript = sessions[0].transcript;

            const { data: analysis } = await supabase
                .from("call_analysis")
                .select("plan_for_next_day")
                .eq("call_session_id", lastSessionId)
                .single();

            if (analysis?.plan_for_next_day)
                followups = analysis.plan_for_next_day;
        }

        // -------------------------------------------------------
        // 4) Build personalized instructions
        // -------------------------------------------------------
        let greeting = "";
        if (!sessions?.length) {
            // FIRST EVER CALL
            greeting = `
Hi ${user.name ?? "my friend"}, I'm Kai.
This is our first time speaking, so let's take this slow.
I'd love to understand what you're dealing with right now.
What's the addiction or habit you're trying to break?
And what made you want to start today?
`;
        } else {
            // NORMAL CALL
            greeting = `
Hi ${user.name ?? "my friend"}, welcome back.

Yesterday you shared: "${lastTranscript || "some important things."}"

${followups.length
                ? `Before we continue, I want to check in on something: ${followups[0]}`
                : `How has your day been so far?`}
`;
        }

        const fullInstructions = `
You are Kai, an addiction recovery voice coach. Speak calmly, compassionately, and with structure.

Start the call by saying exactly this greeting:

"${greeting.trim()}"

After that, continue with supportive coaching:
- Ask about wins and struggles
- Explore triggers
- Help set one realistic intention for tomorrow
- Never judge, shame, or escalate
- Keep your tone grounded and present
`;

        // -------------------------------------------------------
        // 5) Store call context
        // -------------------------------------------------------
        const { data: contextRow } = await supabase
            .from("call_context")
            .insert({
                user_id: userId,
                instructions: fullInstructions,
            })
            .select()
            .single();

        // console.log("CTX Row", contextRow);

        // 3️⃣ Create Twilio client
        const twilioClient = twilio(
            process.env.TWILIO_SID!,
            process.env.TWILIO_AUTH_TOKEN!
        );

        const VOICE_WORKER_URL = process.env.NEXT_PUBLIC_VOICE_WORKER_URL!;

        // 4️⃣ Trigger the call
        const call = await twilioClient.calls.create({
            to: phone,
            from: process.env.TWILIO_NUMBER!,
            url: `${VOICE_WORKER_URL}/twilio/voice?contextId=${contextRow.id}`, // pass the userId along
        });

        // 5️⃣ Return success
        return NextResponse.json({
            ok: true,
            callSid: call.sid,
            phone,
        });
    } catch (err: any) {
        console.error("Twilio call error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}