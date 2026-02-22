create table public.sessions (
                                 id uuid not null default gen_random_uuid (),
                                 user_id uuid not null,
                                 schedule_id uuid null,
                                 started_at timestamp with time zone null default now(),
                                 ended_at timestamp with time zone null,
                                 call_status text null default 'initiated'::text,
                                 transcript text null,
                                 summary_json jsonb null,
                                 mental_state jsonb null,
                                 next_questions jsonb null,
                                 vision_updates jsonb null,
                                 created_at timestamp with time zone null default now(),
                                 constraint sessions_pkey primary key (id),
                                 constraint sessions_schedule_id_fkey foreign KEY (schedule_id) references user_schedules (id) on delete set null,
                                 constraint sessions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
                                 constraint sessions_call_status_check check (
                                     (
                                         call_status = any (
                                                            array[
                                                                'initiated'::text,
                                                            'completed'::text,
                                                            'failed'::text,
                                                            'declined'::text
        ]
                                             )
                                         )
                                     )
) TABLESPACE pg_default;

create index IF not exists sessions_user_id_idx on public.sessions using btree (user_id) TABLESPACE pg_default;

create index IF not exists sessions_schedule_id_idx on public.sessions using btree (schedule_id) TABLESPACE pg_default;