// export async function POST() {
//     try {
//         // 1. Create SIP session with OpenAI
//         const session = await fetch(
//             `${process.env.NEXT_PUBLIC_BASE_URL}/api/session`,
//             { method: "GET" }
//         ).then((r) => r.json());
//
//         // console.log("Session", session);
//         const token = session?.value;
//
//         if (!token) {
//             console.error("ERROR: No ephemeral key returned by OpenAI");
//             return new Response(
//                 `<Response><Say>Unable to connect to Conneczen coach.</Say></Response>`,
//                 { headers: { "Content-Type": "text/xml" }, status: 500 }
//             );
//         }
//
//         // 2. Build SIP URI for Twilio
//         const sipUri = `sip:agent@realtime.openai.com;transport=udp;rt=${token}`;
//
//         // 3. TwiML to connect Twilio → OpenAI Realtime SIP
//         const twiml = `
//                               <Response>
//                                 <Dial>
//                                   <Sip>${sipUri}</Sip>
//                                 </Dial>
//                               </Response>
//                             `.trim();
//
//         return new Response(twiml, {
//             headers: { "Content-Type": "text/xml" },
//         });
//     } catch (error) {
//         console.error("Twilio SIP Routing Error:", error);
//         return new Response(
//             `<Response><Say>Error connecting to Conneczen.</Say></Response>`,
//             { headers: { "Content-Type": "text/xml" }, status: 500 }
//         );
//     }
// }


import { NextResponse } from "next/server";
import { kaiAgent } from "@/lib/agentConfigs/kai";
import { OpenAIRealtimeSIP } from "@openai/agents/realtime";

export async function POST() {
    try {
        // 1. Build initial config for Kai
        const initialConfig = await OpenAIRealtimeSIP.buildInitialConfig(
            kaiAgent,
            {
                model: "gpt-realtime",
                config: {
                    audio: {
                        input: {
                            turnDetection: {
                                type: "semantic_vad",
                                interruptResponse: true,
                            },
                        },
                    },
                },
            }
        );

        // 2. Create the SIP session with OpenAI
        const sessionResp = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            // body: JSON.stringify({
            //     model: "gpt-4o-realtime-preview-2024-12-17",
            //     modalities: ["audio"],
            //     commands: ["sip"],
            //     voice: "alloy",
            //     instructions: kaiAgent.instructions, // <<< reuse Kai
            // }),
            body: JSON.stringify(initialConfig),
        });

        console.log("Session", sessionResp);
        // const token = session?.value;
        //
        // if (!token) {
        //     console.error("ERROR: No ephemeral key returned by OpenAI");
        //     return new Response(
        //         `<Response><Say>Unable to connect to Conneczen coach.</Say></Response>`,
        //         { headers: { "Content-Type": "text/xml" }, status: 500 }
        //     );
        // }
        // const sessionResp = await fetch(
        //     "https://api.openai.com/v1/realtime/sessions",
        //     {
        //         method: "POST",
        //         headers: {
        //             Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        //             "Content-Type": "application/json",
        //         },
        //         body: JSON.stringify(initialConfig),
        //     }
        // );

        // if (!sessionResp.ok) {
        //     const err = await sessionResp.text();
        //     console.error("Failed to create session:", err);
        //     return new Response("<Response><Say>Session error.</Say></Response>", {
        //         headers: { "Content-Type": "text/xml" },
        //         status: 500,
        //     });
        // }

        const session = await sessionResp.json();
        const token = session?.value;

        if (!token) {
            console.error("Missing ephemeral SIP token");
            return new Response("<Response><Say>Error creating SIP.</Say></Response>", {
                headers: { "Content-Type": "text/xml" },
                status: 500,
            });
        }

        // 3. Build SIP URI
        const sipUri = `sip:agent@realtime.openai.com;transport=udp;rt=${token}`;

        // 4. Return TwiML to Twilio
        const twiml = `
      <Response>
        <Dial>
          <Sip>${sipUri}</Sip>
        </Dial>
      </Response>
    `.trim();

        return new Response(twiml, {
            headers: { "Content-Type": "text/xml" },
        });

    } catch (err) {
        console.error("Twilio SIP Error:", err);
        return new Response("<Response><Say>Error.</Say></Response>", {
            headers: { "Content-Type": "text/xml" },
            status: 500,
        });
    }
}