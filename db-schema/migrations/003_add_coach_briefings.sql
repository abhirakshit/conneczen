-- Migration: Add coach_briefings table
-- Purpose: Store analyst-generated briefings for coaching sessions

CREATE TABLE public.coach_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Analysis metadata
  sessions_analyzed uuid[] NOT NULL,           -- Array of session IDs reviewed
  analysis_date timestamp with time zone NOT NULL DEFAULT now(),

  -- Briefing content (full structured analysis)
  briefing_json jsonb NOT NULL,

  -- Key extracted fields for quick access and filtering
  suggested_opening text,                      -- How coach should start the session
  risk_level text NOT NULL DEFAULT 'none' CHECK (risk_level IN ('none', 'low', 'moderate', 'high')),
  primary_theme text,                          -- Main focus area identified

  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for finding latest briefing per user
CREATE INDEX coach_briefings_user_id_idx
ON public.coach_briefings USING btree (user_id);

-- Index for time-based queries (e.g., recent briefings)
CREATE INDEX coach_briefings_analysis_date_idx
ON public.coach_briefings USING btree (analysis_date DESC);

-- Index for risk monitoring
CREATE INDEX coach_briefings_risk_level_idx
ON public.coach_briefings USING btree (risk_level)
WHERE risk_level != 'none';

-- Comment for documentation
COMMENT ON TABLE public.coach_briefings IS 'AI-generated briefings from the Analyst Agent to guide coaching sessions';
COMMENT ON COLUMN public.coach_briefings.sessions_analyzed IS 'Array of session UUIDs that were analyzed to generate this briefing';
COMMENT ON COLUMN public.coach_briefings.briefing_json IS 'Full AnalystBriefing JSON with themes, observations, recommendations';
COMMENT ON COLUMN public.coach_briefings.risk_level IS 'Extracted risk level for monitoring dashboard';
