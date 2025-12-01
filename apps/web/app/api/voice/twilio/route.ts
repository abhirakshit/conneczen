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


import OpenAI from "openai";
import { kaiAgent } from "@/lib/agentConfigs/kai";
import { OpenAIRealtimeSIP } from "@openai/agents/realtime";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST() {
    try {
        // Build the session config for Kai and enable SIP-friendly VAD.
        const initialConfig = await OpenAIRealtimeSIP.buildInitialConfig(kaiAgent, {
            model: "gpt-realtime",
            audio: {
                input: {
                    turnDetection: {
                        type: "semantic_vad",
                        interruptResponse: true,
                    },
                },
            },
        });

        // Create a client secret to start a SIP connection + chat session.
        const session = await openai.realtime.clientSecrets.create({
            session: initialConfig,
        });

        const token = session?.value;

        if (!token) {
            console.error("Missing ephemeral SIP token");
            return new Response("<Response><Say>Error creating SIP.</Say></Response>", {
                headers: { "Content-Type": "text/xml" },
                status: 500,
            });
        }

        const sipUri = `sip:agent@realtime.openai.com;transport=udp;rt=${token}`;
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
