// Audio utilities for OpenAI Realtime API
// Handles conversion between browser audio formats and PCM16

/**
 * Convert Float32Array audio data to PCM16 ArrayBuffer
 * Browser audio is typically Float32 in range [-1, 1]
 * OpenAI expects PCM16 (16-bit signed integers)
 */
export function float32ToPcm16(float32Array: Float32Array): ArrayBuffer {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp to [-1, 1] range
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to 16-bit signed integer
    pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return pcm16.buffer;
}

/**
 * Convert PCM16 ArrayBuffer to Float32Array for playback
 */
export function pcm16ToFloat32(pcm16Buffer: ArrayBuffer): Float32Array {
  const pcm16 = new Int16Array(pcm16Buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    // Convert from 16-bit signed integer to float [-1, 1]
    float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
  }
  return float32;
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Resample audio data from one sample rate to another
 * Uses linear interpolation for simplicity
 */
export function resampleAudio(
  inputData: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number
): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return inputData;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.round(inputData.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
    const fraction = srcIndex - srcIndexFloor;

    // Linear interpolation
    output[i] = inputData[srcIndexFloor] * (1 - fraction) + inputData[srcIndexCeil] * fraction;
  }

  return output;
}

/**
 * Create an AudioContext at the specified sample rate
 * OpenAI Realtime API uses 24kHz
 */
export function createAudioContext(sampleRate: number = 24000): AudioContext {
  return new AudioContext({ sampleRate });
}

/**
 * Play PCM16 audio data through an AudioContext
 */
export async function playPcm16Audio(
  audioContext: AudioContext,
  pcm16Buffer: ArrayBuffer,
  onEnded?: () => void
): Promise<AudioBufferSourceNode> {
  const float32 = pcm16ToFloat32(pcm16Buffer);
  const audioBuffer = audioContext.createBuffer(1, float32.length, audioContext.sampleRate);
  audioBuffer.getChannelData(0).set(float32);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);

  if (onEnded) {
    source.onended = onEnded;
  }

  source.start();
  return source;
}

/**
 * Audio worklet processor code for capturing microphone input
 * This runs in the audio thread for better performance
 */
export const audioWorkletProcessorCode = `
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2400; // 100ms at 24kHz
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const inputChannel = input[0];

    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bufferIndex++] = inputChannel[i];

      if (this.bufferIndex >= this.bufferSize) {
        // Send buffer to main thread
        this.port.postMessage({
          type: 'audio',
          buffer: this.buffer.slice()
        });
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
`;

/**
 * Calculate audio level from Float32Array (for visualization)
 * Returns a value between 0 and 1
 */
export function calculateAudioLevel(float32Array: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < float32Array.length; i++) {
    sum += Math.abs(float32Array[i]);
  }
  const average = sum / float32Array.length;
  // Normalize to 0-1 range (typical speech is around 0.1-0.3)
  return Math.min(1, average * 3);
}
