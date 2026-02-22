create table public.goals (
                              id uuid not null default gen_random_uuid (),
                              user_id uuid not null,
                              vision_id uuid not null,
                              status public.goal_status not null default 'active'::goal_status,
                              title text not null,
                              description text null,
                              target_type text not null default 'count_per_week'::text,
                              target_value numeric null,
                              target_unit text null,
                              start_date date null,
                              end_date date null,
                              created_at timestamp with time zone not null default now(),
                              updated_at timestamp with time zone not null default now(),
                              constraint goals_pkey primary key (id),
                              constraint goals_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
                              constraint goals_vision_id_fkey foreign KEY (vision_id) references visions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists goals_user_id_idx on public.goals using btree (user_id) TABLESPACE pg_default;

create index IF not exists goals_vision_id_idx on public.goals using btree (vision_id) TABLESPACE pg_default;

create index IF not exists goals_user_id_status_idx on public.goals using btree (user_id, status) TABLESPACE pg_default;