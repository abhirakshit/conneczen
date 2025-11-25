import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const phone = searchParams.get("phone");

    if (!phone) {
        return NextResponse.json({ error: "phone query param is required" }, { status: 400 });
    }

    try {
        const twilioClient = twilio(
            process.env.TWILIO_SID!,
            process.env.TWILIO_AUTH_TOKEN!
        );

        const call = await twilioClient.calls.create({
            to: phone,
            from: process.env.TWILIO_NUMBER!,
            url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/voice/twilio`, // TwiML route we create next
        });

        return NextResponse.json({
            ok: true,
            callSid: call.sid,
            message: "Call initiated",
        });
    } catch (err: any) {
        console.error("Twilio call error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}