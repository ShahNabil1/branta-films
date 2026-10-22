--
-- PostgreSQL database dump
--

\restrict myB1nGGujmf5kNVV9Mu2n2Buh0nRlCN8PkzFnXUOfwKR3HWaRaEphScIJnYQFWg

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = off;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET escape_string_warning = off;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'manager'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;


--
-- Name: is_staff(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_staff(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;


--
-- Name: password_is_reused(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.password_is_reused(_user_id uuid, _password text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'extensions'
    AS $$
  select public.verify_current_password(_user_id, _password)
    or exists (
      select 1 from public.password_history h
      where h.user_id = _user_id and extensions.crypt(_password, h.password_hash) = h.password_hash
    )
$$;


--
-- Name: snapshot_current_password(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.snapshot_current_password(_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'extensions'
    AS $$
declare _hash text;
begin
  select encrypted_password into _hash from auth.users where id = _user_id;
  if _hash is null or _hash = '' then return; end if;
  if not exists (select 1 from public.password_history where user_id = _user_id and password_hash = _hash) then
    insert into public.password_history (user_id, password_hash) values (_user_id, _hash);
  end if;
end $$;


--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin new.updated_at = now(); return new; end $$;


--
-- Name: user_has_password(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_password(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'extensions'
    AS $$
  select coalesce((select encrypted_password is not null and encrypted_password <> '' from auth.users where id = _user_id), false)
$$;


--
-- Name: verify_current_password(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_current_password(_user_id uuid, _password text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'extensions'
    AS $$
  select coalesce((
    select encrypted_password <> '' and extensions.crypt(_password, encrypted_password) = encrypted_password
    from auth.users where id = _user_id
  ), false)
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;


--
-- Name: episode_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.episode_media (
    episode_id uuid NOT NULL,
    video_key text NOT NULL,
    content_type text DEFAULT 'video/mp4'::text NOT NULL,
    size_bytes bigint,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: episodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.episodes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    series_id uuid NOT NULL,
    episode_number integer NOT NULL,
    title text NOT NULL,
    synopsis_html text DEFAULT ''::text NOT NULL,
    duration_seconds integer DEFAULT 0 NOT NULL,
    thumbnail_url text,
    is_free boolean DEFAULT false NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: passkey_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.passkey_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id text NOT NULL,
    public_key text NOT NULL,
    counter bigint DEFAULT 0 NOT NULL,
    transports text[] DEFAULT '{}'::text[] NOT NULL,
    device_name text DEFAULT 'Passkey'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: password_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text DEFAULT ''::text NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: series; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.series (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    tagline text DEFAULT ''::text NOT NULL,
    description_html text DEFAULT ''::text NOT NULL,
    poster_url text,
    backdrop_url text,
    genres text[] DEFAULT '{}'::text[] NOT NULL,
    release_year integer,
    maturity_rating text DEFAULT '13+'::text NOT NULL,
    price_bdt integer DEFAULT 0 NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: series_unlocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.series_unlocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    series_id uuid NOT NULL,
    source text DEFAULT 'manual_payment'::text NOT NULL,
    payment_id uuid,
    granted_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: watch_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.watch_progress (
    user_id uuid NOT NULL,
    episode_id uuid NOT NULL,
    series_id uuid NOT NULL,
    position_seconds numeric DEFAULT 0 NOT NULL,
    duration_seconds numeric DEFAULT 0 NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: webauthn_challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    challenge text NOT NULL,
    user_id uuid,
    kind text NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:05:00'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT webauthn_challenges_kind_check CHECK ((kind = ANY (ARRAY['register'::text, 'login'::text])))
);



--
-- Name: episode_media episode_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episode_media
    ADD CONSTRAINT episode_media_pkey PRIMARY KEY (episode_id);


--
-- Name: episodes episodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_pkey PRIMARY KEY (id);


--
-- Name: episodes episodes_series_id_episode_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_series_id_episode_number_key UNIQUE (series_id, episode_number);


--
-- Name: passkey_credentials passkey_credentials_credential_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.passkey_credentials
    ADD CONSTRAINT passkey_credentials_credential_id_key UNIQUE (credential_id);


--
-- Name: passkey_credentials passkey_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.passkey_credentials
    ADD CONSTRAINT passkey_credentials_pkey PRIMARY KEY (id);


--
-- Name: password_history password_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_history
    ADD CONSTRAINT password_history_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: series series_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_pkey PRIMARY KEY (id);


--
-- Name: series series_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_slug_key UNIQUE (slug);


--
-- Name: series_unlocks series_unlocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.series_unlocks
    ADD CONSTRAINT series_unlocks_pkey PRIMARY KEY (id);


--
-- Name: series_unlocks series_unlocks_user_id_series_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.series_unlocks
    ADD CONSTRAINT series_unlocks_user_id_series_id_key UNIQUE (user_id, series_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: watch_progress watch_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.watch_progress
    ADD CONSTRAINT watch_progress_pkey PRIMARY KEY (user_id, episode_id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);



--
-- Name: episodes_series_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX episodes_series_idx ON public.episodes USING btree (series_id, episode_number);


--
-- Name: passkey_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX passkey_user_idx ON public.passkey_credentials USING btree (user_id);


--
-- Name: password_history_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_history_user_idx ON public.password_history USING btree (user_id);


--
-- Name: watch_progress_recent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX watch_progress_recent_idx ON public.watch_progress USING btree (user_id, updated_at DESC);


--
-- Name: episodes episodes_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER episodes_touch BEFORE UPDATE ON public.episodes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: profiles profiles_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: series series_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER series_touch BEFORE UPDATE ON public.series FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: episode_media episode_media_episode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episode_media
    ADD CONSTRAINT episode_media_episode_id_fkey FOREIGN KEY (episode_id) REFERENCES public.episodes(id) ON DELETE CASCADE;


--
-- Name: episodes episodes_series_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_series_id_fkey FOREIGN KEY (series_id) REFERENCES public.series(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: series_unlocks series_unlocks_series_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.series_unlocks
    ADD CONSTRAINT series_unlocks_series_id_fkey FOREIGN KEY (series_id) REFERENCES public.series(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: watch_progress watch_progress_episode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.watch_progress
    ADD CONSTRAINT watch_progress_episode_id_fkey FOREIGN KEY (episode_id) REFERENCES public.episodes(id) ON DELETE CASCADE;


--
-- Name: watch_progress watch_progress_series_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.watch_progress
    ADD CONSTRAINT watch_progress_series_id_fkey FOREIGN KEY (series_id) REFERENCES public.series(id) ON DELETE CASCADE;


--
-- Name: episodes Admins delete episodes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins delete episodes" ON public.episodes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: series Admins delete series; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins delete series" ON public.series FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));



--
-- Name: passkey_credentials Own passkeys delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Own passkeys delete" ON public.passkey_credentials FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: passkey_credentials Own passkeys read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Own passkeys read" ON public.passkey_credentials FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: watch_progress Own progress delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Own progress delete" ON public.watch_progress FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: watch_progress Own progress insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Own progress insert" ON public.watch_progress FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: watch_progress Own progress read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Own progress read" ON public.watch_progress FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.is_staff(auth.uid())));


--
-- Name: watch_progress Own progress update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Own progress update" ON public.watch_progress FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: episodes Published episodes are public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published episodes are public" ON public.episodes FOR SELECT TO authenticated, anon USING ((public.is_staff(auth.uid()) OR (is_published AND (EXISTS ( SELECT 1
   FROM public.series s
  WHERE ((s.id = episodes.series_id) AND s.is_published))))));


--
-- Name: series Published series are public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published series are public" ON public.series FOR SELECT TO authenticated, anon USING ((is_published OR public.is_staff(auth.uid())));


--
-- Name: profiles Read own profile or staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Read own profile or staff" ON public.profiles FOR SELECT TO authenticated USING (((id = auth.uid()) OR public.is_staff(auth.uid())));


--
-- Name: series_unlocks Read own unlocks or staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Read own unlocks or staff" ON public.series_unlocks FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.is_staff(auth.uid())));


--
-- Name: episodes Staff insert episodes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff insert episodes" ON public.episodes FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));


--
-- Name: series Staff insert series; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff insert series" ON public.series FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));


--
-- Name: episodes Staff update episodes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff update episodes" ON public.episodes FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));


--
-- Name: series Staff update series; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff update series" ON public.series FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));


--
-- Name: profiles Update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- Name: user_roles Users read own roles; staff read all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own roles; staff read all" ON public.user_roles FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.is_staff(auth.uid())));



--
-- Name: episode_media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.episode_media ENABLE ROW LEVEL SECURITY;

--
-- Name: episodes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

--
-- Name: passkey_credentials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.passkey_credentials ENABLE ROW LEVEL SECURITY;

--
-- Name: password_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: series; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

--
-- Name: series_unlocks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.series_unlocks ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: watch_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: webauthn_challenges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict myB1nGGujmf5kNVV9Mu2n2Buh0nRlCN8PkzFnXUOfwKR3HWaRaEphScIJnYQFWg

