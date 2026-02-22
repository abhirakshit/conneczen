create table public.visions (
                                id uuid not null default gen_random_uuid (),
                                user_id uuid not null,
                                identity_profile_id uuid null,
                                domain public.coaching_domain not null,
                                status public.record_status not null default 'draft'::record_status,
                                title text not null,
                                narrative text null,
                                created_at timestamp with time zone not null default now(),
                                updated_at timestamp with time zone not null default now(),
                                constraint visions_pkey primary key (id),
                                constraint visions_identity_profile_id_fkey foreign KEY (identity_profile_id) references identity_profiles (id) on delete set null,
                                constraint visions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists visions_user_id_idx on public.visions using btree (user_id) TABLESPACE pg_default;

create index IF not exists visions_user_id_domain_idx on public.visions using btree (user_id, domain) TABLESPACE pg_default;