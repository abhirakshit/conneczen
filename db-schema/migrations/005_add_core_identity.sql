-- Migration: Add core_identity table
-- Purpose: Store unified identity synthesis across domains, initialized by IOA

-- Enum for time availability
CREATE TYPE public.time_availability AS ENUM ('low', 'medium', 'high');

-- Enum for recommended coach types
CREATE TYPE public.recommended_coach_type AS ENUM (
  'foundational',
  'health',
  'addiction',
  'focus',
  'relationships',
  'career'
);

CREATE TABLE public.core_identity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- IOA-collected fields (from IdentityDraft)
  preferred_name text NOT NULL,
  primary_struggle text NOT NULL,
  desired_direction text NOT NULL,
  readiness_level smallint CHECK (readiness_level BETWEEN 1 AND 5),
  time_availability time_availability,

  -- Coach recommendation from IOA
  recommended_coach recommended_coach_type,
  coach_confidence numeric(3,2) CHECK (coach_confidence BETWEEN 0 AND 1),

  -- Synthesis fields (updated by Analyst Agent over time)
  values_summary text,                    -- Core values distilled from sessions
  life_stage text,                        -- e.g., "career transition", "new parent"
  primary_domain coaching_domain,         -- Which domain is most active
  overall_clarity smallint CHECK (overall_clarity BETWEEN 1 AND 5),

  -- Flags from IOA (e.g., "crisis_risk", "low_engagement")
  flags text[],

  -- Status tracking
  status record_status NOT NULL DEFAULT 'draft',
  confirmed_at timestamp with time zone,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- One core_identity per user (enforced by UNIQUE on user_id)
CREATE INDEX core_identity_user_id_idx
ON public.core_identity USING btree (user_id);

-- Find users by recommended coach type (for routing)
CREATE INDEX core_identity_recommended_coach_idx
ON public.core_identity USING btree (recommended_coach)
WHERE status = 'active';

-- Find users with flags (for monitoring)
CREATE INDEX core_identity_flags_idx
ON public.core_identity USING gin (flags)
WHERE flags IS NOT NULL AND array_length(flags, 1) > 0;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_core_identity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER core_identity_updated_at_trigger
BEFORE UPDATE ON public.core_identity
FOR EACH ROW
EXECUTE FUNCTION update_core_identity_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.core_identity IS 'Unified identity synthesis per user, initialized by IOA and refined by Analyst';
COMMENT ON COLUMN public.core_identity.primary_struggle IS 'The main challenge/struggle the user wants to address';
COMMENT ON COLUMN public.core_identity.desired_direction IS 'Where the user wants to go / who they want to become';
COMMENT ON COLUMN public.core_identity.readiness_level IS 'Self-reported readiness for change (1-5)';
COMMENT ON COLUMN public.core_identity.values_summary IS 'Core values distilled from sessions by Analyst Agent';
COMMENT ON COLUMN public.core_identity.primary_domain IS 'The domain receiving most focus, updated by Analyst';
COMMENT ON COLUMN public.core_identity.flags IS 'Risk/attention flags set by IOA or Analyst';
