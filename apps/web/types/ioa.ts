// IOA (Identity Onboarding Agent) Types

import type { TimeAvailability, RecommendedCoachType } from "./database";

// Re-export for convenience
export type { TimeAvailability, RecommendedCoachType };

// Onboarding state machine states
export type OnboardingState = "started" | "collecting" | "stalled" | "completed";

// Identity profile status (maps to RecordStatus in database)
export type IdentityStatus = "draft" | "active" | "archived";

// Identity draft data collected by IOA
export interface IdentityDraft {
  preferred_name: string | null;
  primary_struggle: string | null;
  desired_direction: string | null;
  readiness_level: number | null; // 1-5
  time_availability: TimeAvailability | null;
}

// Coach recommendation from IOA
export interface CoachRecommendation {
  coach_type: RecommendedCoachType;
  reasoning: string;
  confidence?: number; // 0-1
}

// Full identity confirmation request
export interface IdentityConfirmation {
  identity_summary: string;
  coach_recommendation: CoachRecommendation;
}

// Handoff contract from IOA to Coach (matches coach-handoff-schema.json)
export interface IOAHandoffContract {
  handoff_version: string;
  user_id: string;
  preferred_name: string;
  primary_struggle: string;
  desired_direction: string;
  readiness_level: number;
  time_availability: TimeAvailability;
  coach_recommendation: {
    coach_type: RecommendedCoachType;
    confidence: number;
  };
  flags?: string[];
  consent_acknowledged: boolean;
  created_at: string;
}

// Tool call results from IOA agent
export interface SaveIdentityDraftResult {
  success: boolean;
  action: "identity_draft_saved";
  data: Partial<IdentityDraft>;
}

export interface RequestConfirmationResult {
  success: boolean;
  action: "confirmation_requested";
  data: IdentityConfirmation;
}

export type IOAToolResult = SaveIdentityDraftResult | RequestConfirmationResult;

// IOA session state tracked on client
export interface IOASessionState {
  onboardingState: OnboardingState;
  identityDraft: IdentityDraft;
  confirmationRequested: boolean;
  identityConfirmation: IdentityConfirmation | null;
  consentAcknowledged: boolean;
}

// Initial IOA session state
export const initialIOASessionState: IOASessionState = {
  onboardingState: "started",
  identityDraft: {
    preferred_name: null,
    primary_struggle: null,
    desired_direction: null,
    readiness_level: null,
    time_availability: null,
  },
  confirmationRequested: false,
  identityConfirmation: null,
  consentAcknowledged: false,
};

// Check if identity draft has minimum required fields
export function hasMinimumIdentityFields(draft: IdentityDraft): boolean {
  return !!(
    draft.preferred_name &&
    draft.primary_struggle &&
    draft.desired_direction
  );
}

// Check if identity is ready for confirmation
export function isIdentityReadyForConfirmation(state: IOASessionState): boolean {
  return (
    hasMinimumIdentityFields(state.identityDraft) &&
    state.consentAcknowledged &&
    state.identityDraft.readiness_level !== null
  );
}
