-- Branta Films — complete database setup (schema, security rules, functions, triggers, sample catalogue).
-- Built from drizzle/migrations 0000 + 0001 on 2026-10-21. Run once on an empty project.

create extension if not exists pgcrypto with schema extensions;

-- ===== Roles =====
create type public.app_role as enum ('admin', 'manager');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;

create policy "Users read own roles; staff read all" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));

-- ===== Profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url, updated_at) on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Read own profile or staff" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "Update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'name', ''), ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== Series =====
create table public.series (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text not null default '',
  description_html text not null default '',
  poster_url text,
  backdrop_url text,
  genres text[] not null default '{}',
  release_year int,
  maturity_rating text not null default '13+',
  price_bdt int not null default 0,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.series to anon, authenticated;
grant insert, update, delete on public.series to authenticated;
grant all on public.series to service_role;
alter table public.series enable row level security;
create policy "Published series are public" on public.series
  for select to anon, authenticated using (is_published or public.is_staff(auth.uid()));
create policy "Staff insert series" on public.series for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "Staff update series" on public.series for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "Admins delete series" on public.series for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger series_touch before update on public.series for each row execute function public.touch_updated_at();

-- ===== Episodes =====
create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series(id) on delete cascade,
  episode_number int not null,
  title text not null,
  synopsis_html text not null default '',
  duration_seconds int not null default 0,
  thumbnail_url text,
  is_free boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (series_id, episode_number)
);
create index episodes_series_idx on public.episodes(series_id, episode_number);
grant select on public.episodes to anon, authenticated;
grant insert, update, delete on public.episodes to authenticated;
grant all on public.episodes to service_role;
alter table public.episodes enable row level security;
create policy "Published episodes are public" on public.episodes
  for select to anon, authenticated using (
    public.is_staff(auth.uid())
    or (is_published and exists (select 1 from public.series s where s.id = series_id and s.is_published))
  );
create policy "Staff insert episodes" on public.episodes for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "Staff update episodes" on public.episodes for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "Admins delete episodes" on public.episodes for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger episodes_touch before update on public.episodes for each row execute function public.touch_updated_at();

-- Private storage keys: never readable from the browser.
create table public.episode_media (
  episode_id uuid primary key references public.episodes(id) on delete cascade,
  video_key text not null,
  content_type text not null default 'video/mp4',
  size_bytes bigint,
  uploaded_at timestamptz not null default now()
);
grant all on public.episode_media to service_role;
alter table public.episode_media enable row level security;

-- ===== Unlocks =====
create table public.series_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  series_id uuid not null references public.series(id) on delete cascade,
  source text not null default 'manual_payment',
  payment_id uuid,
  granted_by uuid,
  created_at timestamptz not null default now(),
  unique (user_id, series_id)
);
grant select on public.series_unlocks to authenticated;
grant all on public.series_unlocks to service_role;
alter table public.series_unlocks enable row level security;
create policy "Read own unlocks or staff" on public.series_unlocks
  for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));

-- ===== Watch progress =====
create table public.watch_progress (
  user_id uuid not null,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  series_id uuid not null references public.series(id) on delete cascade,
  position_seconds numeric not null default 0,
  duration_seconds numeric not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, episode_id)
);
create index watch_progress_recent_idx on public.watch_progress(user_id, updated_at desc);
grant select, insert, update, delete on public.watch_progress to authenticated;
grant all on public.watch_progress to service_role;
alter table public.watch_progress enable row level security;
create policy "Own progress read" on public.watch_progress for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "Own progress insert" on public.watch_progress for insert to authenticated with check (user_id = auth.uid());
create policy "Own progress update" on public.watch_progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own progress delete" on public.watch_progress for delete to authenticated using (user_id = auth.uid());

-- ===== Passkeys =====
create table public.passkey_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0,
  transports text[] not null default '{}',
  device_name text not null default 'Passkey',
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index passkey_user_idx on public.passkey_credentials(user_id);
grant select, delete on public.passkey_credentials to authenticated;
grant all on public.passkey_credentials to service_role;
alter table public.passkey_credentials enable row level security;
create policy "Own passkeys read" on public.passkey_credentials for select to authenticated using (user_id = auth.uid());
create policy "Own passkeys delete" on public.passkey_credentials for delete to authenticated using (user_id = auth.uid());

create table public.webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge text not null,
  user_id uuid,
  kind text not null check (kind in ('register', 'login')),
  expires_at timestamptz not null default now() + interval '5 minutes',
  created_at timestamptz not null default now()
);
grant all on public.webauthn_challenges to service_role;
alter table public.webauthn_challenges enable row level security;

-- ===== Password history (server-only) =====
create table public.password_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);
create index password_history_user_idx on public.password_history(user_id);
grant all on public.password_history to service_role;
alter table public.password_history enable row level security;

create or replace function public.user_has_password(_user_id uuid)
returns boolean language sql stable security definer set search_path = public, auth, extensions as $$
  select coalesce((select encrypted_password is not null and encrypted_password <> '' from auth.users where id = _user_id), false)
$$;

create or replace function public.verify_current_password(_user_id uuid, _password text)
returns boolean language sql stable security definer set search_path = public, auth, extensions as $$
  select coalesce((
    select encrypted_password <> '' and extensions.crypt(_password, encrypted_password) = encrypted_password
    from auth.users where id = _user_id
  ), false)
$$;

create or replace function public.password_is_reused(_user_id uuid, _password text)
returns boolean language sql stable security definer set search_path = public, auth, extensions as $$
  select public.verify_current_password(_user_id, _password)
    or exists (
      select 1 from public.password_history h
      where h.user_id = _user_id and extensions.crypt(_password, h.password_hash) = h.password_hash
    )
$$;

create or replace function public.snapshot_current_password(_user_id uuid)
returns void language plpgsql security definer set search_path = public, auth, extensions as $$
declare _hash text;
begin
  select encrypted_password into _hash from auth.users where id = _user_id;
  if _hash is null or _hash = '' then return; end if;
  if not exists (select 1 from public.password_history where user_id = _user_id and password_hash = _hash) then
    insert into public.password_history (user_id, password_hash) values (_user_id, _hash);
  end if;
end $$;

revoke all on function public.user_has_password(uuid) from public, anon, authenticated;
revoke all on function public.verify_current_password(uuid, text) from public, anon, authenticated;
revoke all on function public.password_is_reused(uuid, text) from public, anon, authenticated;
revoke all on function public.snapshot_current_password(uuid) from public, anon, authenticated;
grant execute on function public.user_has_password(uuid) to service_role;
grant execute on function public.verify_current_password(uuid, text) to service_role;
grant execute on function public.password_is_reused(uuid, text) to service_role;
grant execute on function public.snapshot_current_password(uuid) to service_role;


-- Sample catalogue (replace from the admin panel later).
insert into public.series (id, slug, title, tagline, description_html, poster_url, backdrop_url, genres, release_year, maturity_rating, price_bdt, is_featured, is_published, sort_order) values
('11111111-1111-4111-8111-000000000001', 'neon-rain', 'Neon Rain',
 'One night. One rooftop. A city that never forgets.',
 '<p>When a young journalist receives an anonymous tip on a stormy Dhaka night, she is pulled into a web of secrets stretching from rooftop bars to the old river docks.</p><p style="text-align: left"><strong>ঢাকার এক বৃষ্টিভেজা রাতে</strong> শুরু হয় এক রহস্যময় যাত্রা — যেখানে প্রতিটি ছাদে লুকিয়ে আছে একটি গল্প।</p>',
 'images/series/neon-rain/poster.webp', 'images/series/neon-rain/backdrop.webp', array['Thriller','Drama'], 2026, '16+', 149, true, true, 1),
('11111111-1111-4111-8111-000000000002', 'river-song', 'River Song',
 'Every current carries someone home.',
 '<p>A boatman''s son returns to his village after ten years in the city and must choose between the life he built and the family he left behind.</p><p><em>নদীর গান</em> — পরিবার, ফিরে আসা আর ক্ষমার এক কোমল গল্প।</p>',
 'images/series/river-song/poster.webp', 'images/series/river-song/backdrop.webp', array['Family','Drama'], 2025, '13+', 99, false, true, 2),
('11111111-1111-4111-8111-000000000003', 'old-town', 'Old Town',
 'The past has an address.',
 '<p>A retired detective is drawn back into the narrow lanes of Old Dhaka when a decades-old case resurfaces with a single photograph.</p><p><strong>পুরান ঢাকার অলিগলিতে</strong> লুকিয়ে থাকা এক পুরনো রহস্য।</p>',
 'images/series/old-town/poster.webp', 'images/series/old-town/backdrop.webp', array['Mystery','Crime'], 2026, '16+', 199, false, true, 3);

insert into public.episodes (id, series_id, episode_number, title, synopsis_html, duration_seconds, is_free, is_published) values
('22222222-2222-4222-8222-000000000101', '11111111-1111-4111-8111-000000000001', 1, 'The Tip', '<p>An anonymous message leads Nila to a rooftop she was never meant to find.</p>', 2580, true, true),
('22222222-2222-4222-8222-000000000102', '11111111-1111-4111-8111-000000000001', 2, 'Static', '<p>The source goes silent, and someone starts following Nila home.</p>', 2710, false, true),
('22222222-2222-4222-8222-000000000103', '11111111-1111-4111-8111-000000000001', 3, 'Docklands', '<p>The trail leads to the river, and to a name nobody wants spoken.</p>', 2890, false, true),
('22222222-2222-4222-8222-000000000201', '11111111-1111-4111-8111-000000000002', 1, 'Homecoming', '<p>Rafi steps off the launch and into a village that has changed without him.</p>', 2400, true, true),
('22222222-2222-4222-8222-000000000202', '11111111-1111-4111-8111-000000000002', 2, 'Low Tide', '<p>An old debt resurfaces, and his father refuses to talk about it.</p>', 2520, false, true),
('22222222-2222-4222-8222-000000000301', '11111111-1111-4111-8111-000000000003', 1, 'The Photograph', '<p>A faded print arrives at Inspector Kabir''s door with no return address.</p>', 3010, true, true),
('22222222-2222-4222-8222-000000000302', '11111111-1111-4111-8111-000000000003', 2, 'Lanes', '<p>Every shopkeeper in Shankhari Bazar remembers that night differently.</p>', 2760, false, true);

insert into public.episode_media (episode_id, video_key) values
('22222222-2222-4222-8222-000000000101', 'videos/series/neon-rain/e01.mp4'),
('22222222-2222-4222-8222-000000000102', 'videos/series/neon-rain/e02.mp4'),
('22222222-2222-4222-8222-000000000103', 'videos/series/neon-rain/e03.mp4'),
('22222222-2222-4222-8222-000000000201', 'videos/series/river-song/e01.mp4'),
('22222222-2222-4222-8222-000000000202', 'videos/series/river-song/e02.mp4'),
('22222222-2222-4222-8222-000000000301', 'videos/series/old-town/e01.mp4'),
('22222222-2222-4222-8222-000000000302', 'videos/series/old-town/e02.mp4');

-- ===== Storage bucket (private) =====
