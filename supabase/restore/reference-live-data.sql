--
-- PostgreSQL database dump
--

\restrict bqjAgpO7bpF3kpmpLSM8ZgKYiRH8GDarVuBfJAFHBswIJBTxepA18EZjdSTcNeU

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




--
-- Data for Name: series; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.series VALUES ('11111111-1111-4111-8111-000000000001', 'neon-rain', 'Neon Rain', 'One night. One rooftop. A city that never forgets.', '<p>When a young journalist receives an anonymous tip on a stormy Dhaka night, she is pulled into a web of secrets stretching from rooftop bars to the old river docks.</p><p style="text-align: left"><strong>ঢাকার এক বৃষ্টিভেজা রাতে</strong> শুরু হয় এক রহস্যময় যাত্রা — যেখানে প্রতিটি ছাদে লুকিয়ে আছে একটি গল্প।</p>', 'posters/demo/neon-rain-p.webp', 'posters/demo/neon-rain-b.webp', '{Thriller,Drama}', 2026, '16+', 149, true, true, 1, '2026-10-21 21:00:55.769358+00', '2026-10-21 21:00:55.769358+00');
INSERT INTO public.series VALUES ('11111111-1111-4111-8111-000000000002', 'river-song', 'River Song', 'Every current carries someone home.', '<p>A boatman''s son returns to his village after ten years in the city and must choose between the life he built and the family he left behind.</p><p><em>নদীর গান</em> — পরিবার, ফিরে আসা আর ক্ষমার এক কোমল গল্প।</p>', 'posters/demo/river-song-p.webp', 'posters/demo/river-song-b.webp', '{Family,Drama}', 2025, '13+', 99, false, true, 2, '2026-10-21 21:00:55.769358+00', '2026-10-21 21:00:55.769358+00');
INSERT INTO public.series VALUES ('11111111-1111-4111-8111-000000000003', 'old-town', 'Old Town', 'The past has an address.', '<p>A retired detective is drawn back into the narrow lanes of Old Dhaka when a decades-old case resurfaces with a single photograph.</p><p><strong>পুরান ঢাকার অলিগলিতে</strong> লুকিয়ে থাকা এক পুরনো রহস্য।</p>', 'posters/demo/old-town-p.webp', 'posters/demo/old-town-b.webp', '{Mystery,Crime}', 2026, '16+', 199, false, true, 3, '2026-10-21 21:00:55.769358+00', '2026-10-21 21:00:55.769358+00');


--
-- Data for Name: episodes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.episodes VALUES ('22222222-2222-4222-8222-000000000101', '11111111-1111-4111-8111-000000000001', 1, 'The Tip', '<p>An anonymous message leads Nila to a rooftop she was never meant to find.</p>', 2580, NULL, true, true, '2026-10-21 21:00:55.769358+00', '2026-10-21 21:00:55.769358+00');
INSERT INTO public.episodes VALUES ('22222222-2222-4222-8222-000000000102', '11111111-1111-4111-8111-000000000001', 2, 'Static', '<p>The source goes silent, and someone starts following Nila home.</p>', 2710, NULL, false, true, '2026-10-21 21:00:55.769358+00', '2026-10-21 21:00:55.769358+00');
INSERT INTO public.episodes VALUES ('22222222-2222-4222-8222-000000000103', '11111111-1111-4111-8111-000000000001', 3, 'Docklands', '<p>The trail leads to the river, and to a name nobody wants spoken.</p>', 2890, NULL, false, true, '2026-10-21 21:00:55.769358+00', '2026-10-21 21:00:55.769358+00');
INSERT INTO public.episodes VALUES ('22222222-2222-4222-8222-000000000201', '11111111-1111-4111-8111-000000000002', 1, 'Homecoming', '<p>Rafi steps off the launch and into a village that has changed without him.</p>', 2400, NULL, true, true, '2026-10-21 21:00:55.769358+00', '2026-10-21 21:00:55.769358+00');
INSERT INTO public.episodes VALUES ('22222222-2222-4222-8222-000000000202', '11111111-1111-4111-8111-000000000002', 2, 'Low Tide', '<p>An old debt resurfaces, and his father refuses to talk about it.</p>', 2520, NULL, false, true, '2026-10-21 21:00:55.769358+00', '2026-10-21 21:00:55.769358+00');
INSERT INTO public.episodes VALUES ('22222222-2222-4222-8222-000000000301', '11111111-1111-4111-8111-000000000003', 1, 'The Photograph', '<p>A faded print arrives at Inspector Kabir''s door with no return address.</p>', 3010, NULL, true, true, '2026-10-21 21:00:55.769358+00', '2026-10-21 21:00:55.769358+00');
INSERT INTO public.episodes VALUES ('22222222-2222-4222-8222-000000000302', '11111111-1111-4111-8111-000000000003', 2, 'Lanes', '<p>Every shopkeeper in Shankhari Bazar remembers that night differently.</p>', 2760, NULL, false, true, '2026-10-21 21:00:55.769358+00', '2026-10-21 21:00:55.769358+00');


--
-- Data for Name: episode_media; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.episode_media VALUES ('22222222-2222-4222-8222-000000000101', 'series/neon-rain/e01.mp4', 'video/mp4', NULL, '2026-10-21 21:00:55.769358+00');
INSERT INTO public.episode_media VALUES ('22222222-2222-4222-8222-000000000102', 'series/neon-rain/e02.mp4', 'video/mp4', NULL, '2026-10-21 21:00:55.769358+00');
INSERT INTO public.episode_media VALUES ('22222222-2222-4222-8222-000000000103', 'series/neon-rain/e03.mp4', 'video/mp4', NULL, '2026-10-21 21:00:55.769358+00');
INSERT INTO public.episode_media VALUES ('22222222-2222-4222-8222-000000000201', 'series/river-song/e01.mp4', 'video/mp4', NULL, '2026-10-21 21:00:55.769358+00');
INSERT INTO public.episode_media VALUES ('22222222-2222-4222-8222-000000000202', 'series/river-song/e02.mp4', 'video/mp4', NULL, '2026-10-21 21:00:55.769358+00');
INSERT INTO public.episode_media VALUES ('22222222-2222-4222-8222-000000000301', 'series/old-town/e01.mp4', 'video/mp4', NULL, '2026-10-21 21:00:55.769358+00');
INSERT INTO public.episode_media VALUES ('22222222-2222-4222-8222-000000000302', 'series/old-town/e02.mp4', 'video/mp4', NULL, '2026-10-21 21:00:55.769358+00');


--
-- Data for Name: passkey_credentials; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: password_history; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: series_unlocks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: watch_progress; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--

\unrestrict bqjAgpO7bpF3kpmpLSM8ZgKYiRH8GDarVuBfJAFHBswIJBTxepA18EZjdSTcNeU

