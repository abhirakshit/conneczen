export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum types matching Supabase
export type UserStatus = "usr.active" | "usr.inactive" | "usr.deleted";
export type CoachType = "mindfulness" | "productivity" | "wellness";
export type CoachingDomain = "career" | "relationships" | "health" | "purpose" | "finance";
export type RecordStatus = "draft" | "active" | "archived";
export type GoalStatus = "active" | "completed" | "paused" | "abandoned";
export type IdentityCreator = "user" | "ai" | "collaborative";
export type CallStatus = "initiated" | "completed" | "failed" | "declined";
export type SessionType = "ioa" | "regular";
export type ScheduleType = "morning" | "evening" | "custom";
export type RiskLevel = "none" | "low" | "moderate" | "high";
export type ThemeTrajectory = "improving" | "stable" | "worsening";
export type VoicePreference = "ash" | "ballad" | "coral" | "sage" | "verse";
export type TimeAvailability = "low" | "medium" | "high";
export type RecommendedCoachType = "foundational" | "health" | "addiction" | "focus" | "relationships" | "career";

// Analyst briefing structure (output from Analyst Agent)
export interface AnalystBriefing {
  suggested_opening: string;
  key_themes: {
    theme: string;
    frequency: number;
    trajectory: ThemeTrajectory;
  }[];
  progress_observations: string[];
  areas_to_explore: {
    topic: string;
    reason: string;
    approach: string;
  }[];
  risk_indicators: {
    level: RiskLevel;
    observations: string[];
    recommended_action: string;
  };
  recommended_approach: {
    tone: string;
    pacing: string;
    frameworks: string[];
  };
  continuity_notes: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          profile_image: string | null;
          country_code: string | null;
          iso_code: string | null;
          status: UserStatus;
          delete_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          profile_image?: string | null;
          country_code?: string | null;
          iso_code?: string | null;
          status?: UserStatus;
          delete_reason?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          profile_image?: string | null;
          country_code?: string | null;
          iso_code?: string | null;
          status?: UserStatus;
          delete_reason?: string | null;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          coach_type: CoachType;
          language: "en" | "hi";
          timezone: string | null;
          transcripts_enabled: boolean;
          onboarding_completed: boolean;
          disclaimer_accepted_at: string | null;
          privacy_acknowledged_at: string | null;
          voice_preference: VoicePreference;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          coach_type?: CoachType;
          language?: "en" | "hi";
          timezone?: string | null;
          transcripts_enabled?: boolean;
          onboarding_completed?: boolean;
          disclaimer_accepted_at?: string | null;
          privacy_acknowledged_at?: string | null;
          voice_preference?: VoicePreference;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          coach_type?: CoachType;
          language?: "en" | "hi";
          timezone?: string | null;
          transcripts_enabled?: boolean;
          onboarding_completed?: boolean;
          disclaimer_accepted_at?: string | null;
          privacy_acknowledged_at?: string | null;
          voice_preference?: VoicePreference;
          updated_at?: string;
        };
      };
      user_schedules: {
        Row: {
          id: string;
          user_id: string;
          schedule_type: ScheduleType;
          call_time_local: string; // TIME format HH:MM:SS
          call_time_utc: string; // TIME format HH:MM:SS
          timezone: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          schedule_type: ScheduleType;
          call_time_local: string;
          call_time_utc: string;
          timezone: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          schedule_type?: ScheduleType;
          call_time_local?: string;
          call_time_utc?: string;
          timezone?: string;
          active?: boolean;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          schedule_id: string | null;
          session_type: SessionType;
          started_at: string;
          ended_at: string | null;
          call_status: CallStatus;
          transcript: string | null;
          summary_json: Json | null;
          mental_state: Json | null;
          next_questions: Json | null;
          vision_updates: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          schedule_id?: string | null;
          session_type?: SessionType;
          started_at?: string;
          ended_at?: string | null;
          call_status?: CallStatus;
          transcript?: string | null;
          summary_json?: Json | null;
          mental_state?: Json | null;
          next_questions?: Json | null;
          vision_updates?: Json | null;
          created_at?: string;
        };
        Update: {
          session_type?: SessionType;
          ended_at?: string | null;
          call_status?: CallStatus;
          transcript?: string | null;
          summary_json?: Json | null;
          mental_state?: Json | null;
          next_questions?: Json | null;
          vision_updates?: Json | null;
        };
      };
      identity_profiles: {
        Row: {
          id: string;
          user_id: string;
          domain: CoachingDomain;
          status: RecordStatus;
          identity_statement: string | null;
          confidence_level: number | null; // 1-5
          clarity_level: number | null; // 1-5
          created_by: IdentityCreator;
          last_confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          domain: CoachingDomain;
          status?: RecordStatus;
          identity_statement?: string | null;
          confidence_level?: number | null;
          clarity_level?: number | null;
          created_by: IdentityCreator;
          last_confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: RecordStatus;
          identity_statement?: string | null;
          confidence_level?: number | null;
          clarity_level?: number | null;
          last_confirmed_at?: string | null;
          updated_at?: string;
        };
      };
      visions: {
        Row: {
          id: string;
          user_id: string;
          identity_profile_id: string | null;
          domain: CoachingDomain;
          status: RecordStatus;
          title: string;
          narrative: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          identity_profile_id?: string | null;
          domain: CoachingDomain;
          status?: RecordStatus;
          title: string;
          narrative?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          identity_profile_id?: string | null;
          status?: RecordStatus;
          title?: string;
          narrative?: string | null;
          updated_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          vision_id: string;
          status: GoalStatus;
          title: string;
          description: string | null;
          target_type: string;
          target_value: number | null;
          target_unit: string | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vision_id: string;
          status?: GoalStatus;
          title: string;
          description?: string | null;
          target_type?: string;
          target_value?: number | null;
          target_unit?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: GoalStatus;
          title?: string;
          description?: string | null;
          target_type?: string;
          target_value?: number | null;
          target_unit?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          updated_at?: string;
        };
      };
      goal_values: {
        Row: {
          id: string;
          goal_id: string;
          value_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          value_id: string;
          created_at?: string;
        };
        Update: never;
      };
      coach_briefings: {
        Row: {
          id: string;
          user_id: string;
          sessions_analyzed: string[]; // Array of session UUIDs
          analysis_date: string;
          briefing_json: AnalystBriefing;
          suggested_opening: string | null;
          risk_level: RiskLevel;
          primary_theme: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sessions_analyzed: string[];
          analysis_date?: string;
          briefing_json: AnalystBriefing;
          suggested_opening?: string | null;
          risk_level?: RiskLevel;
          primary_theme?: string | null;
          created_at?: string;
        };
        Update: {
          briefing_json?: AnalystBriefing;
          suggested_opening?: string | null;
          risk_level?: RiskLevel;
          primary_theme?: string | null;
        };
      };
      core_identity: {
        Row: {
          id: string;
          user_id: string;
          preferred_name: string;
          primary_struggle: string;
          desired_direction: string;
          readiness_level: number | null; // 1-5
          time_availability: TimeAvailability | null;
          recommended_coach: RecommendedCoachType | null;
          coach_confidence: number | null; // 0-1
          values_summary: string | null;
          life_stage: string | null;
          primary_domain: CoachingDomain | null;
          overall_clarity: number | null; // 1-5
          flags: string[] | null;
          status: RecordStatus;
          confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          preferred_name: string;
          primary_struggle: string;
          desired_direction: string;
          readiness_level?: number | null;
          time_availability?: TimeAvailability | null;
          recommended_coach?: RecommendedCoachType | null;
          coach_confidence?: number | null;
          values_summary?: string | null;
          life_stage?: string | null;
          primary_domain?: CoachingDomain | null;
          overall_clarity?: number | null;
          flags?: string[] | null;
          status?: RecordStatus;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          preferred_name?: string;
          primary_struggle?: string;
          desired_direction?: string;
          readiness_level?: number | null;
          time_availability?: TimeAvailability | null;
          recommended_coach?: RecommendedCoachType | null;
          coach_confidence?: number | null;
          values_summary?: string | null;
          life_stage?: string | null;
          primary_domain?: CoachingDomain | null;
          overall_clarity?: number | null;
          flags?: string[] | null;
          status?: RecordStatus;
          confirmed_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_status: UserStatus;
      coach_type: CoachType;
      coaching_domain: CoachingDomain;
      record_status: RecordStatus;
      goal_status: GoalStatus;
      identity_creator: IdentityCreator;
      call_status: CallStatus;
      session_type: SessionType;
      schedule_type: ScheduleType;
      risk_level: RiskLevel;
      time_availability: TimeAvailability;
      recommended_coach_type: RecommendedCoachType;
    };
  };
}

// Convenience type exports
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
export type UserSchedule = Database["public"]["Tables"]["user_schedules"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type IdentityProfile = Database["public"]["Tables"]["identity_profiles"]["Row"];
export type Vision = Database["public"]["Tables"]["visions"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type CoachBriefing = Database["public"]["Tables"]["coach_briefings"]["Row"];
export type CoreIdentity = Database["public"]["Tables"]["core_identity"]["Row"];

// Combined user profile (user + settings + active schedule)
export type UserProfile = User & {
  settings: UserSettings | null;
  schedule: UserSchedule | null;
};
