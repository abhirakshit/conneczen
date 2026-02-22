// OpenAI Realtime API Types

export type CallType = "welcome" | "regular";

export type ConnectionState = "idle" | "connecting" | "connected" | "disconnected" | "error";

export interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

// Session configuration for the Realtime API
export interface RealtimeSessionConfig {
  model: string;
  voice: string;
  instructions: string;
  input_audio_format: "pcm16";
  output_audio_format: "pcm16";
  input_audio_transcription: {
    model: string;
  };
  turn_detection: {
    type: "server_vad";
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
  };
}

// Token response from our API
export interface TokenResponse {
  token: string;
  expiresAt: number;
}

// Client events (sent to OpenAI)
export type ClientEvent =
  | { type: "input_audio_buffer.append"; audio: string }
  | { type: "input_audio_buffer.commit" }
  | { type: "input_audio_buffer.clear" }
  | { type: "response.create" }
  | { type: "response.cancel" }
  | { type: "session.update"; session: Partial<RealtimeSessionConfig> };

// Server events (received from OpenAI)
export interface ServerEventBase {
  event_id: string;
}

export interface SessionCreatedEvent extends ServerEventBase {
  type: "session.created";
  session: RealtimeSessionConfig;
}

export interface SessionUpdatedEvent extends ServerEventBase {
  type: "session.updated";
  session: RealtimeSessionConfig;
}

export interface InputAudioBufferCommittedEvent extends ServerEventBase {
  type: "input_audio_buffer.committed";
  previous_item_id: string | null;
  item_id: string;
}

export interface InputAudioBufferClearedEvent extends ServerEventBase {
  type: "input_audio_buffer.cleared";
}

export interface InputAudioBufferSpeechStartedEvent extends ServerEventBase {
  type: "input_audio_buffer.speech_started";
  audio_start_ms: number;
  item_id: string;
}

export interface InputAudioBufferSpeechStoppedEvent extends ServerEventBase {
  type: "input_audio_buffer.speech_stopped";
  audio_end_ms: number;
  item_id: string;
}

export interface ConversationItemCreatedEvent extends ServerEventBase {
  type: "conversation.item.created";
  previous_item_id: string | null;
  item: ConversationItem;
}

export interface ConversationItemInputAudioTranscriptionCompletedEvent extends ServerEventBase {
  type: "conversation.item.input_audio_transcription.completed";
  item_id: string;
  content_index: number;
  transcript: string;
}

export interface ConversationItemInputAudioTranscriptionFailedEvent extends ServerEventBase {
  type: "conversation.item.input_audio_transcription.failed";
  item_id: string;
  content_index: number;
  error: { type: string; code: string; message: string };
}

export interface ResponseCreatedEvent extends ServerEventBase {
  type: "response.created";
  response: ResponseObject;
}

export interface ResponseDoneEvent extends ServerEventBase {
  type: "response.done";
  response: ResponseObject;
}

export interface ResponseOutputItemAddedEvent extends ServerEventBase {
  type: "response.output_item.added";
  response_id: string;
  output_index: number;
  item: ConversationItem;
}

export interface ResponseOutputItemDoneEvent extends ServerEventBase {
  type: "response.output_item.done";
  response_id: string;
  output_index: number;
  item: ConversationItem;
}

export interface ResponseAudioDeltaEvent extends ServerEventBase {
  type: "response.audio.delta";
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string; // base64 encoded audio
}

export interface ResponseAudioDoneEvent extends ServerEventBase {
  type: "response.audio.done";
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
}

export interface ResponseAudioTranscriptDeltaEvent extends ServerEventBase {
  type: "response.audio_transcript.delta";
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

export interface ResponseAudioTranscriptDoneEvent extends ServerEventBase {
  type: "response.audio_transcript.done";
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  transcript: string;
}

export interface ResponseFunctionCallArgumentsDoneEvent extends ServerEventBase {
  type: "response.function_call_arguments.done";
  response_id: string;
  item_id: string;
  output_index: number;
  call_id: string;
  name: string;
  arguments: string;
}

export interface ErrorEvent extends ServerEventBase {
  type: "error";
  error: {
    type: string;
    code: string;
    message: string;
    param: string | null;
    event_id: string | null;
  };
}

export type ServerEvent =
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | InputAudioBufferCommittedEvent
  | InputAudioBufferClearedEvent
  | InputAudioBufferSpeechStartedEvent
  | InputAudioBufferSpeechStoppedEvent
  | ConversationItemCreatedEvent
  | ConversationItemInputAudioTranscriptionCompletedEvent
  | ConversationItemInputAudioTranscriptionFailedEvent
  | ResponseCreatedEvent
  | ResponseDoneEvent
  | ResponseOutputItemAddedEvent
  | ResponseOutputItemDoneEvent
  | ResponseAudioDeltaEvent
  | ResponseAudioDoneEvent
  | ResponseAudioTranscriptDeltaEvent
  | ResponseAudioTranscriptDoneEvent
  | ResponseFunctionCallArgumentsDoneEvent
  | ErrorEvent;

// Conversation item types
export interface ConversationItem {
  id: string;
  object: "realtime.item";
  type: "message" | "function_call" | "function_call_output";
  status: "completed" | "in_progress" | "incomplete";
  role: "user" | "assistant" | "system";
  content: ContentPart[];
}

export interface ContentPart {
  type: "input_text" | "input_audio" | "text" | "audio";
  text?: string;
  audio?: string;
  transcript?: string;
}

export interface ResponseObject {
  id: string;
  object: "realtime.response";
  status: "completed" | "cancelled" | "failed" | "incomplete" | "in_progress";
  status_details: unknown | null;
  output: ConversationItem[];
  usage?: {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
  };
}

// Summary generation types
export interface SessionSummary {
  summary: string;
  key_themes: string[];
  mental_state: {
    overall_mood: string;
    energy_level: string;
    notable_emotions: string[];
  };
  next_questions: string[];
  insights: string[];
}
