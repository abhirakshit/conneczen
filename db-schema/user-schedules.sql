create table public.user_schedules (
                                       id uuid not null default gen_random_uuid (),
                                       user_id uuid not null,
                                       schedule_type text not null,
                                       call_time_local time without time zone not null,
                                       call_time_utc time without time zone not null,
                                       timezone text not null,
                                       active boolean null default true,
                                       created_at timestamp with time zone null default now(),
                                       updated_at timestamp with time zone null default now(),
                                       constraint user_schedules_pkey primary key (id),
                                       constraint user_schedules_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
                                       constraint user_schedules_schedule_type_check check (
                                           (
                                               schedule_type = any (
                                                                    array['morning'::text, 'evening'::text, 'custom'::text]
                                                   )
                                               )
                                           )
) TABLESPACE pg_default;

create index IF not exists user_schedules_user_id_idx on public.user_schedules using btree (user_id) TABLESPACE pg_default;