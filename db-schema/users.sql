create table public.users (
                              id uuid not null default gen_random_uuid (),
                              name text not null,
                              email text null,
                              phone text null,
                              profile_image text null,
                              created_at timestamp without time zone null default now(),
                              country_code text null,
                              iso_code text null,
                              status public.user_status not null default 'usr.active'::user_status,
                              delete_reason text null,
                              constraint users_pkey primary key (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists users_email_unique on public.users using btree (email) TABLESPACE pg_default
    where
    (
    (email is not null)
    and (email <> ''::text)
    );

create unique INDEX IF not exists users_phone_unique on public.users using btree (phone) TABLESPACE pg_default
    where
    (
    (phone is not null)
    and (phone <> ''::text)
    );