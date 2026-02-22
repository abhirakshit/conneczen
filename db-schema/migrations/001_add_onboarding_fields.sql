-- Migration: Add onboarding tracking fields to user_settings
-- Run this in Supabase SQL Editor

-- Add onboarding tracking columns to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS disclaimer_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS privacy_acknowledged_at timestamp with time zone;

-- Create index for quick onboarding status lookups
CREATE INDEX IF NOT EXISTS user_settings_onboarding_idx
ON public.user_settings (user_id)
WHERE onboarding_completed = false;

-- Comment for documentation
COMMENT ON COLUMN public.user_settings.onboarding_completed IS 'Whether user has completed the onboarding flow';
COMMENT ON COLUMN public.user_settings.disclaimer_accepted_at IS 'Timestamp when user accepted the "not therapy" disclaimer';
COMMENT ON COLUMN public.user_settings.privacy_acknowledged_at IS 'Timestamp when user acknowledged the privacy policy';
