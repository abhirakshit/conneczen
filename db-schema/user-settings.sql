create table public.user_settings (
                                      id uuid not null default gen_random_uuid (),
                                      user_id uuid not null,
                                      full_name text null,
                                      coach_type public.coach_type not null default 'mindfulness'::coach_type,
                                      language text null default 'en'::text,
                                      timezone text null,
                                      transcripts_enabled boolean null default true,
                                      created_at timestamp with time zone null default now(),
                                      updated_at timestamp with time zone null default now(),
                                      onboarding_completed boolean null default false,
                                      disclaimer_accepted_at timestamp with time zone null,
                                      privacy_acknowledged_at timestamp with time zone null,
                                      constraint user_settings_pkey primary key (id),
                                      constraint user_settings_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
                                      constraint user_settings_language_check check ((language = any (array['en'::text, 'hi'::text])))
) TABLESPACE pg_default;

create unique INDEX IF not exists user_settings_user_id_idx on public.user_settings using btree (user_id) TABLESPACE pg_default;

create index IF not exists user_settings_onboarding_idx on public.user_settings using btree (user_id) TABLESPACE pg_default
    where
    (onboarding_completed = false);