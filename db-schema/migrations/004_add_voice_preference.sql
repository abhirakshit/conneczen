-- Migration: Add voice preference to user_settings
-- This allows users to choose their preferred AI voice

ALTER TABLE public.user_settings
ADD COLUMN voice_preference text NOT NULL DEFAULT 'ash'
CHECK (voice_preference IN ('ash', 'ballad', 'coral', 'sage', 'verse'));

COMMENT ON COLUMN public.user_settings.voice_preference IS 'User preferred AI voice for realtime sessions';
