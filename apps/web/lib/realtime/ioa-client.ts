// IOA (Identity Onboarding Agent) Realtime Client
// Extends base realtime client with IOA-specific tool handling

import type {
  TranscriptEntry,
  ServerEvent,
  ConnectionState,
  ResponseFunctionCallArgumentsDoneEvent,
} from "@conneczen/types";
import type {
  IdentityDraft,
  IdentityConfirmation,
} from "@conneczen/types";
import {
  float32ToPcm16,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  pcm16ToFloat32,
  resampleAudio,
} from "./audio-utils";

export interface IOAClientCallbacks {
  onConnectionStateChange?: (state: ConnectionState) => void;
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
  onAudioData?: (audioData: Float32Array) => void;
  onAiSpeakingChange?: (isSpeaking: boolean) => void;
  onError?: (error: Error) => void;
  // IOA-specific callbacks
  onIdentityDraftUpdate?: (draft: Partial<IdentityDraft>) => void;
  onConfirmationRequested?: (confirmation: IdentityConfirmation) => void;
  onToolCall?: (toolName: string, args: unknown) => void;
}

interface FunctionCallItem {
  call_id: string;
  name: string;
  arguments: string;
}

export class IOARealtimeClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private connectionState: ConnectionState = "idle";
  private transcript: TranscriptEntry[] = [];
  private callbacks: IOAClientCallbacks;
  private currentAssistantText: string = "";
  private audioQueue: ArrayBuffer[] = [];
  private isPlayingAudio: boolean = false;
  private inputSampleRate: number = 48000;
  private outputSampleRate: number = 24000;
  private pendingFunctionCalls: Map<string, FunctionCallItem> = new Map();

  constructor(callbacks: IOAClientCallbacks = {}) {
    this.callbacks = callbacks;
  }

  private setConnectionState(state: ConnectionState) {
    this.connectionState = state;
    this.callbacks.onConnectionStateChange?.(state);
  }

  private setAiSpeaking(isSpeaking: boolean) {
    this.callbacks.onAiSpeakingChange?.(isSpeaking);
  }

  /**
   * Connect to OpenAI Realtime API with IOA configuration
   */
  async connect(token: string, mediaStream: MediaStream): Promise<void> {
    if (this.ws) {
      throw new Error("Already connected");
    }

    this.setConnectionState("connecting");
    this.mediaStream = mediaStream;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(
          "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
          [
            "realtime",
            `openai-insecure-api-key.${token}`,
            "openai-beta.realtime-v1",
          ]
        );

        this.ws.onopen = () => {
          console.log("IOA WebSocket connected");
          this.setConnectionState("connected");
          this.setupAudioCapture();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (error) => {
          console.error("IOA WebSocket error:", error);
          this.setConnectionState("error");
          this.callbacks.onError?.(new Error("WebSocket connection failed"));
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log("IOA WebSocket closed:", event.code, event.reason);
          this.setConnectionState("disconnected");
          this.cleanup();
        };
      } catch (error) {
        this.setConnectionState("error");
        reject(error);
      }
    });
  }

  private setupAudioCapture() {
    if (!this.mediaStream) return;

    this.audioContext = new AudioContext();
    this.inputSampleRate = this.audioContext.sampleRate;

    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

    const bufferSize = 4096;
    this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    this.processorNode.onaudioprocess = (event) => {
      if (this.connectionState !== "connected") return;

      const inputData = event.inputBuffer.getChannelData(0);
      const resampledData = resampleAudio(
        inputData,
        this.inputSampleRate,
        this.outputSampleRate
      );

      const pcm16Buffer = float32ToPcm16(resampledData);
      this.sendAudio(pcm16Buffer);
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);
  }

  private sendAudio(pcm16Buffer: ArrayBuffer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const base64Audio = arrayBufferToBase64(pcm16Buffer);

    this.ws.send(
      JSON.stringify({
        type: "input_audio_buffer.append",
        audio: base64Audio,
      })
    );
  }

  /**
   * Handle incoming WebSocket messages including tool calls
   */
  private handleMessage(event: MessageEvent) {
    try {
      const data: ServerEvent = JSON.parse(event.data);

      switch (data.type) {
        case "session.created":
          console.log("IOA Session created");
          break;

        case "input_audio_buffer.speech_started":
          this.stopAudioPlayback();
          break;

        case "conversation.item.input_audio_transcription.completed":
          this.addTranscriptEntry("user", data.transcript);
          break;

        case "response.audio.delta":
          this.setAiSpeaking(true);
          this.queueAudioForPlayback(data.delta);
          break;

        case "response.audio_transcript.delta":
          this.currentAssistantText += data.delta;
          break;

        case "response.audio_transcript.done":
          if (data.transcript) {
            this.addTranscriptEntry("assistant", data.transcript);
          }
          this.currentAssistantText = "";
          break;

        case "response.done":
          this.setAiSpeaking(false);
          // Process any function calls in the response
          this.processFunctionCalls(data.response);
          break;

        case "response.function_call_arguments.done":
          // Handle function call completion
          this.handleFunctionCallDone(data);
          break;

        case "error":
          console.error("IOA Realtime API error:", data.error);
          this.callbacks.onError?.(new Error(data.error.message));
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Error parsing IOA message:", error);
    }
  }

  /**
   * Process function calls from response
   */
  private processFunctionCalls(response: unknown) {
    if (!response || typeof response !== "object") return;

    const resp = response as { output?: Array<{ type: string; call_id?: string; name?: string; arguments?: string }> };
    if (!resp.output) return;

    for (const item of resp.output) {
      if (item.type === "function_call" && item.call_id && item.name) {
        this.handleFunctionCall(item.call_id, item.name, item.arguments || "{}");
      }
    }
  }

  /**
   * Handle function call completion event
   */
  private handleFunctionCallDone(data: ResponseFunctionCallArgumentsDoneEvent) {
    this.handleFunctionCall(data.call_id, data.name, data.arguments);
  }

  /**
   * Handle IOA tool calls
   */
  private handleFunctionCall(callId: string, name: string, argsJson: string) {
    try {
      const args = JSON.parse(argsJson);

      console.log(`IOA Tool call: ${name}`, args);
      this.callbacks.onToolCall?.(name, args);

      if (name === "save_identity_draft") {
        // Notify about identity draft update
        const draft: Partial<IdentityDraft> = {
          preferred_name: args.preferred_name || undefined,
          primary_struggle: args.primary_struggle || undefined,
          desired_direction: args.desired_direction || undefined,
          readiness_level: args.readiness_level || undefined,
          time_availability: args.time_availability || undefined,
        };
        this.callbacks.onIdentityDraftUpdate?.(draft);

        // Send function result back to the agent
        this.sendFunctionResult(callId, {
          success: true,
          action: "identity_draft_saved",
          data: draft,
        });
      } else if (name === "request_confirmation") {
        // Notify about confirmation request
        const confirmation: IdentityConfirmation = {
          identity_summary: args.identity_summary,
          coach_recommendation: args.coach_recommendation,
        };
        this.callbacks.onConfirmationRequested?.(confirmation);

        // Send function result back to the agent
        this.sendFunctionResult(callId, {
          success: true,
          action: "confirmation_requested",
          data: confirmation,
        });
      }
    } catch (error) {
      console.error("Error handling function call:", error);
      this.sendFunctionResult(callId, {
        success: false,
        error: "Failed to process function call",
      });
    }
  }

  /**
   * Send function result back to the agent
   */
  private sendFunctionResult(callId: string, result: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(result),
        },
      })
    );

    // Trigger response generation after function result
    this.ws.send(
      JSON.stringify({
        type: "response.create",
      })
    );
  }

  private addTranscriptEntry(role: "user" | "assistant", text: string) {
    const entry: TranscriptEntry = {
      role,
      text,
      timestamp: Date.now(),
    };
    this.transcript.push(entry);
    this.callbacks.onTranscriptUpdate?.([...this.transcript]);
  }

  private queueAudioForPlayback(base64Audio: string) {
    const audioBuffer = base64ToArrayBuffer(base64Audio);
    this.audioQueue.push(audioBuffer);

    if (!this.isPlayingAudio) {
      this.playNextAudio();
    }
  }

  private async playNextAudio() {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      return;
    }

    this.isPlayingAudio = true;

    const playbackContext = new AudioContext({ sampleRate: this.outputSampleRate });

    while (this.audioQueue.length > 0) {
      const pcm16Buffer = this.audioQueue.shift()!;
      const float32 = pcm16ToFloat32(pcm16Buffer);

      this.callbacks.onAudioData?.(float32);

      const audioBuffer = playbackContext.createBuffer(
        1,
        float32.length,
        this.outputSampleRate
      );
      audioBuffer.getChannelData(0).set(float32);

      const source = playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(playbackContext.destination);

      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
        source.start();
      });
    }

    this.isPlayingAudio = false;
    await playbackContext.close();
  }

  private stopAudioPlayback() {
    this.audioQueue = [];
    this.isPlayingAudio = false;
    this.setAiSpeaking(false);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "response.cancel" }));
    }
  }

  getTranscript(): TranscriptEntry[] {
    return [...this.transcript];
  }

  getFormattedTranscript(): string {
    return this.transcript
      .map((entry) => `${entry.role === "user" ? "User" : "IOA"}: ${entry.text}`)
      .join("\n\n");
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.audioQueue = [];
    this.isPlayingAudio = false;
    this.ws = null;
    this.pendingFunctionCalls.clear();
  }
}
