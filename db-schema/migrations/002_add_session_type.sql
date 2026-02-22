-- Migration: Add session_type column to sessions table
-- Purpose: Distinguish IOA sessions from regular reflection sessions

-- Add session_type column with check constraint
ALTER TABLE public.sessions
ADD COLUMN session_type text NOT NULL DEFAULT 'regular'
CHECK (session_type IN ('ioa', 'regular'));

-- Add index for efficient queries by session type
CREATE INDEX IF NOT EXISTS sessions_user_id_type_idx
ON public.sessions USING btree (user_id, session_type);

-- Comment for documentation
COMMENT ON COLUMN public.sessions.session_type IS 'Type of session: ioa (identity onboarding) or regular (reflection)';
