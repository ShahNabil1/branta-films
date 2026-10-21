-- Storage rules for the private "media" bucket (served through the app).
create policy "Users manage own avatar files" on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and name like 'avatars/' || auth.uid()::text || '/%')
  with check (bucket_id = 'media' and name like 'avatars/' || auth.uid()::text || '/%');

create policy "Staff manage poster files" on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and name like 'posters/%' and public.is_staff(auth.uid()))
  with check (bucket_id = 'media' and name like 'posters/%' and public.is_staff(auth.uid()));

-- Sample catalogue (replace from the admin panel later).
insert into public.series (id, slug, title, tagline, description_html, poster_url, backdrop_url, genres, release_year, maturity_rating, price_bdt, is_featured, is_published, sort_order) values
('11111111-1111-4111-8111-000000000001', 'neon-rain', 'Neon Rain',
 'One night. One rooftop. A city that never forgets.',
 '<p>When a young journalist receives an anonymous tip on a stormy Dhaka night, she is pulled into a web of secrets stretching from rooftop bars to the old river docks.</p><p style="text-align: left"><strong>ঢাকার এক বৃষ্টিভেজা রাতে</strong> শুরু হয় এক রহস্যময় যাত্রা — যেখানে প্রতিটি ছাদে লুকিয়ে আছে একটি গল্প।</p>',
 'posters/demo/neon-rain-p.webp', 'posters/demo/neon-rain-b.webp', array['Thriller','Drama'], 2026, '16+', 149, true, true, 1),
('11111111-1111-4111-8111-000000000002', 'river-song', 'River Song',
 'Every current carries someone home.',
 '<p>A boatman''s son returns to his village after ten years in the city and must choose between the life he built and the family he left behind.</p><p><em>নদীর গান</em> — পরিবার, ফিরে আসা আর ক্ষমার এক কোমল গল্প।</p>',
 'posters/demo/river-song-p.webp', 'posters/demo/river-song-b.webp', array['Family','Drama'], 2025, '13+', 99, false, true, 2),
('11111111-1111-4111-8111-000000000003', 'old-town', 'Old Town',
 'The past has an address.',
 '<p>A retired detective is drawn back into the narrow lanes of Old Dhaka when a decades-old case resurfaces with a single photograph.</p><p><strong>পুরান ঢাকার অলিগলিতে</strong> লুকিয়ে থাকা এক পুরনো রহস্য।</p>',
 'posters/demo/old-town-p.webp', 'posters/demo/old-town-b.webp', array['Mystery','Crime'], 2026, '16+', 199, false, true, 3);

insert into public.episodes (id, series_id, episode_number, title, synopsis_html, duration_seconds, is_free, is_published) values
('22222222-2222-4222-8222-000000000101', '11111111-1111-4111-8111-000000000001', 1, 'The Tip', '<p>An anonymous message leads Nila to a rooftop she was never meant to find.</p>', 2580, true, true),
('22222222-2222-4222-8222-000000000102', '11111111-1111-4111-8111-000000000001', 2, 'Static', '<p>The source goes silent, and someone starts following Nila home.</p>', 2710, false, true),
('22222222-2222-4222-8222-000000000103', '11111111-1111-4111-8111-000000000001', 3, 'Docklands', '<p>The trail leads to the river, and to a name nobody wants spoken.</p>', 2890, false, true),
('22222222-2222-4222-8222-000000000201', '11111111-1111-4111-8111-000000000002', 1, 'Homecoming', '<p>Rafi steps off the launch and into a village that has changed without him.</p>', 2400, true, true),
('22222222-2222-4222-8222-000000000202', '11111111-1111-4111-8111-000000000002', 2, 'Low Tide', '<p>An old debt resurfaces, and his father refuses to talk about it.</p>', 2520, false, true),
('22222222-2222-4222-8222-000000000301', '11111111-1111-4111-8111-000000000003', 1, 'The Photograph', '<p>A faded print arrives at Inspector Kabir''s door with no return address.</p>', 3010, true, true),
('22222222-2222-4222-8222-000000000302', '11111111-1111-4111-8111-000000000003', 2, 'Lanes', '<p>Every shopkeeper in Shankhari Bazar remembers that night differently.</p>', 2760, false, true);

insert into public.episode_media (episode_id, video_key) values
('22222222-2222-4222-8222-000000000101', 'series/neon-rain/e01.mp4'),
('22222222-2222-4222-8222-000000000102', 'series/neon-rain/e02.mp4'),
('22222222-2222-4222-8222-000000000103', 'series/neon-rain/e03.mp4'),
('22222222-2222-4222-8222-000000000201', 'series/river-song/e01.mp4'),
('22222222-2222-4222-8222-000000000202', 'series/river-song/e02.mp4'),
('22222222-2222-4222-8222-000000000301', 'series/old-town/e01.mp4'),
('22222222-2222-4222-8222-000000000302', 'series/old-town/e02.mp4');
