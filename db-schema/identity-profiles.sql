create table public.identity_profiles (
                                          id uuid not null default gen_random_uuid (),
                                          user_id uuid not null,
                                          domain public.coaching_domain not null,
                                          status public.record_status not null default 'draft'::record_status,
                                          identity_statement text null,
                                          created_at timestamp with time zone not null default now(),
                                          updated_at timestamp with time zone not null default now(),
                                          confidence_level smallint null,
                                          clarity_level smallint null,
                                          created_by public.identity_creator not null,
                                          last_confirmed_at timestamp with time zone null,
                                          constraint identity_profiles_pkey primary key (id),
                                          constraint identity_profiles_user_id_domain_key unique (user_id, domain),
                                          constraint identity_profiles_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
                                          constraint identity_profiles_clarity_level_check check (
                                              (
                                                  (clarity_level >= 1)
                                                      and (clarity_level <= 5)
                                                  )
                                              ),
                                          constraint identity_profiles_confidence_level_check check (
                                              (
                                                  (confidence_level >= 1)
                                                      and (confidence_level <= 5)
                                                  )
                                              )
) TABLESPACE pg_default;

create index IF not exists identity_profiles_user_id_idx on public.identity_profiles using btree (user_id) TABLESPACE pg_default;

create index IF not exists identity_profiles_user_id_domain_idx on public.identity_profiles using btree (user_id, domain) TABLESPACE pg_default;