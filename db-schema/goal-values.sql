create table public.goal_values (
                                    id uuid not null default gen_random_uuid (),
                                    goal_id uuid not null,
                                    value_id uuid not null,
                                    created_at timestamp with time zone not null default now(),
                                    constraint goal_values_pkey primary key (id),
                                    constraint goal_values_goal_id_value_id_key unique (goal_id, value_id),
                                    constraint goal_values_goal_id_fkey foreign KEY (goal_id) references goals (id) on delete CASCADE,
                                    constraint goal_values_value_id_fkey foreign KEY (value_id) references values_catalog (id) on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists goal_values_goal_id_idx on public.goal_values using btree (goal_id) TABLESPACE pg_default;