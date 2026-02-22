// OpenAI Realtime WebSocket Client

import type {
  TranscriptEntry,
  ServerEvent,
  ConnectionState,
} from "@conneczen/types";
import {
  float32ToPcm16,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  pcm16ToFloat32,
  resampleAudio,
} from "./audio-utils";

export interface RealtimeClientCallbacks {
  onConnectionStateChange?: (state: ConnectionState) => void;
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
  onAudioData?: (audioData: Float32Array) => void;
  onAiSpeakingChange?: (isSpeaking: boolean) => void;
  onError?: (error: Error) => void;
}

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private connectionState: ConnectionState = "idle";
  private transcript: TranscriptEntry[] = [];
  private callbacks: RealtimeClientCallbacks;
  private currentAssistantText: string = "";
  private audioQueue: ArrayBuffer[] = [];
  private isPlayingAudio: boolean = false;
  private inputSampleRate: number = 48000;
  private outputSampleRate: number = 24000;

  constructor(callbacks: RealtimeClientCallbacks = {}) {
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
   * Connect to OpenAI Realtime API with ephemeral token
   */
  async connect(token: string, mediaStream: MediaStream): Promise<void> {
    if (this.ws) {
      throw new Error("Already connected");
    }

    this.setConnectionState("connecting");
    this.mediaStream = mediaStream;

    return new Promise((resolve, reject) => {
      try {
        // Connect to OpenAI Realtime API
        this.ws = new WebSocket(
          "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
          [
            "realtime",
            `openai-insecure-api-key.${token}`,
            "openai-beta.realtime-v1",
          ]
        );

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.setConnectionState("connected");
          this.setupAudioCapture();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.setConnectionState("error");
          this.callbacks.onError?.(new Error("WebSocket connection failed"));
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log("WebSocket closed:", event.code, event.reason);
          this.setConnectionState("disconnected");
          this.cleanup();
        };
      } catch (error) {
        this.setConnectionState("error");
        reject(error);
      }
    });
  }

  /**
   * Set up audio capture from microphone
   */
  private setupAudioCapture() {
    if (!this.mediaStream) return;

    // Create AudioContext - use device sample rate for input
    this.audioContext = new AudioContext();
    this.inputSampleRate = this.audioContext.sampleRate;

    // Create source from microphone stream
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Use ScriptProcessorNode for audio processing
    // Note: This is deprecated but widely supported. AudioWorklet is more complex to set up.
    const bufferSize = 4096;
    this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    this.processorNode.onaudioprocess = (event) => {
      if (this.connectionState !== "connected") return;

      const inputData = event.inputBuffer.getChannelData(0);

      // Resample from device sample rate to 24kHz
      const resampledData = resampleAudio(
        inputData,
        this.inputSampleRate,
        this.outputSampleRate
      );

      // Convert to PCM16 and send
      const pcm16Buffer = float32ToPcm16(resampledData);
      this.sendAudio(pcm16Buffer);
    };

    // Connect the audio graph
    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);
  }

  /**
   * Send audio data to OpenAI
   */
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
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent) {
    try {
      const data: ServerEvent = JSON.parse(event.data);

      switch (data.type) {
        case "session.created":
          console.log("Session created");
          break;

        case "input_audio_buffer.speech_started":
          // User started speaking - stop AI audio playback
          this.stopAudioPlayback();
          break;

        case "conversation.item.input_audio_transcription.completed":
          // User's speech was transcribed
          this.addTranscriptEntry("user", data.transcript);
          break;

        case "response.audio.delta":
          // Received audio chunk from AI
          this.setAiSpeaking(true);
          this.queueAudioForPlayback(data.delta);
          break;

        case "response.audio.done":
          // AI finished this audio segment
          break;

        case "response.audio_transcript.delta":
          // AI's speech being transcribed (streaming)
          this.currentAssistantText += data.delta;
          break;

        case "response.audio_transcript.done":
          // AI's speech transcription complete
          if (data.transcript) {
            this.addTranscriptEntry("assistant", data.transcript);
          }
          this.currentAssistantText = "";
          break;

        case "response.done":
          // Response complete
          this.setAiSpeaking(false);
          break;

        case "error":
          console.error("Realtime API error:", data.error);
          this.callbacks.onError?.(new Error(data.error.message));
          break;

        default:
          // Other events we don't need to handle
          break;
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  }

  /**
   * Add a transcript entry
   */
  private addTranscriptEntry(role: "user" | "assistant", text: string) {
    const entry: TranscriptEntry = {
      role,
      text,
      timestamp: Date.now(),
    };
    this.transcript.push(entry);
    this.callbacks.onTranscriptUpdate?.([...this.transcript]);
  }

  /**
   * Queue audio for playback
   */
  private queueAudioForPlayback(base64Audio: string) {
    const audioBuffer = base64ToArrayBuffer(base64Audio);
    this.audioQueue.push(audioBuffer);

    if (!this.isPlayingAudio) {
      this.playNextAudio();
    }
  }

  /**
   * Play next audio chunk from queue
   */
  private async playNextAudio() {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      return;
    }

    this.isPlayingAudio = true;

    // Create playback context at 24kHz (OpenAI output format)
    const playbackContext = new AudioContext({ sampleRate: this.outputSampleRate });

    while (this.audioQueue.length > 0) {
      const pcm16Buffer = this.audioQueue.shift()!;
      const float32 = pcm16ToFloat32(pcm16Buffer);

      // Notify about AI audio for visualization
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

      // Wait for this chunk to finish playing
      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
        source.start();
      });
    }

    this.isPlayingAudio = false;
    await playbackContext.close();
  }

  /**
   * Stop audio playback (when user interrupts)
   */
  private stopAudioPlayback() {
    this.audioQueue = [];
    this.isPlayingAudio = false;
    this.setAiSpeaking(false);

    // Send cancel to stop AI response
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "response.cancel" }));
    }
  }

  /**
   * Get current transcript
   */
  getTranscript(): TranscriptEntry[] {
    return [...this.transcript];
  }

  /**
   * Get formatted transcript as string
   */
  getFormattedTranscript(): string {
    return this.transcript
      .map((entry) => `${entry.role === "user" ? "User" : "AI"}: ${entry.text}`)
      .join("\n\n");
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.cleanup();
  }

  /**
   * Cleanup all resources
   */
  private cleanup() {
    // Stop audio processing
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

    // Clear audio queue
    this.audioQueue = [];
    this.isPlayingAudio = false;

    // Clear WebSocket
    this.ws = null;
  }
}
