# Branta Films roadmap

## Current request — Automatic video duration and visible controls
- [ ] Remove manual duration entry; derive and persist actual MP4 duration for uploads and existing saved videos
- [ ] Show Replace/Delete before Edit, preserving the explicit Edit requirement
- [ ] Test duration rules, controls and public duration display; authenticated verification depends on external Supabase session

## Current request — Remove Activity
- [x] Right-align overview numbers on small devices
- [x] Remove Activity displays/page, logging and stored records; preserve watch/security records
- [x] Verify removal with 29 passing tests and isolated 393px layout; live admin account verification unavailable on external Supabase

## Current request — Player and R2 lifecycle
- [x] Fix admin player sizing/contrast; add explicit Replace/Delete in Edit mode
- [x] Queue superseded/deleted video keys atomically; delete from R2 and retain failures for retry on admin episode visits/manual retry
- [x] Lifecycle tests pass; isolated browser confirms visible video, play, settings and mobile layout
- [ ] Actual signed-in replacement/deletion check — blocked: external Supabase has no managed test session

## Current request — Saved episode media
- [x] Show persisted video preview and metadata when reopening an episode; refresh after replacement
- [x] Distinguish missing thumbnail from missing video and preserve saved artwork; actual episode has video but null thumbnail
- [x] Test saved media, missing files, absent thumbnail and admin-only access; explain automatic multi-resolution encoding
- [ ] Verify actual signed-in editor playback — blocked: external Supabase has no managed test session

## Current request — Series metadata controls
- [x] Larger multiline tagline, genre dropdown with individual + additions/removal, maturity dropdown
- [x] Editable current-year default for new series; preserve existing years
- [x] Six metadata rule tests pass; preview build OK
- [ ] Verify signed-in editor save end-to-end — blocked: external Supabase supplies no managed test session

## Current request — Supabase-controlled Turnstile
- [x] Allow tokenless auth when Supabase captcha is off; show Turnstile when Supabase requests it
- [x] Apply to signup, password login and code resend/recovery; remove artificial invite-password gate
- [x] Seven captcha/recovery tests pass; browser verifies captcha-required and disabled response transitions; hosted Auth currently returns captcha_failed; build OK

## Current request — Colourful controls and avatar
- [x] Give selected navigation and catalogue actions colourful idle/hover states and playful tap motion
- [x] Share uploaded/Google avatar selection across header and profile with replacement priority
- [x] Four avatar-rule tests pass; colourful hover and Browse navigation verified in browser, no runtime errors, build OK
- [ ] Verify real Google sign-in and avatar replacement end-to-end — blocked: external Supabase supplies no managed test session

## Current request — Watch experience
- [x] Polish buttons, thumbnail episode carousel and suggested series
- [x] Advanced speed, touch seeking and fullscreen landscape request where supported
- [x] Add browser-only HLS adaptive/manual controls and identify source limitations
- [ ] Enable real 360p/480p/720p/1080p playback — blocked: current uploads contain only one MP4; needs encoded renditions and authorized manifests/segments
- [x] Validate rules and isolated playback interactions on mobile/desktop: speed, both touch seek directions, carousel and fullscreen pass; build OK
- [ ] Verify signed-in R2 playback end-to-end and physical-device rotation — blocked: external Supabase has no managed session; physical browser orientation restrictions cannot be verified in desktop emulation

## Current request — Audience and staff management
- [x] Replace Users/Staff lists with presence, viewing, free/paid and avatar summaries
- [x] Add account detail pages, security/session controls, watch history and series access
- [x] Track first/last source, devices, trusted IP and available location; enforce identifier blocks
- [x] Add audited account administration and safe read-only view-as account preview
- [ ] Validate authenticated administration controls and layouts — blocked: external Supabase supplies no managed test session. Rule tests and signed-out access checks pass.

## Current request — Panjabi Shop BD admin design
- [x] Adapt reference sidebar and top bar for admin only
- [x] Redesign overview, record lists and full-page editors
- [x] Verify desktop/mobile layout with a temporary fixture, collapse/drawer, search and editor save state; permission tests pass. Live authenticated CRUD remains blocked by external Supabase session access as noted below.

## Current request — Owner administration
- [x] Assign requested existing account the admin role
- [x] Admin login destination and protected dashboard
- [x] Series and episode full-page CRUD, artwork upload and direct R2 video controls
- [x] User/staff access controls, invites, activity and unlock management
- [ ] Real signed-in CRUD and video upload verification — blocked: external Supabase provides no managed test session; R2 browser upload also needs allowed-origin CORS

## Phase 1 — Foundation (done)
- [x] Branta Tech dark theme, logo, favicon, Geist + SolaimanLipi/Kalpurush fonts
- [x] DevToolsShield (production only)
- [x] Home, browse, series pages with sample catalogue
- [x] Sign-in: Google, email + password, passkey; forgot password with 6-digit code
- [x] Inputs: validation, Caps Lock, typing-language indicator, show/hide password
- [x] Password change: current required, no reuse of current/previous passwords
- [x] Secure playback: private R2 + short-lived signed links after access check
- [x] Branded player, progress saved every 10 s + on pause, Continue Watching
- [x] User dashboard with independent sidebar (overview, library, profile, security)
- [x] Privacy Policy + Terms of Service
- [x] Cinematic streaming redesign: rotating hero, trending + category rows
- [x] Full redesign on brantatech-com design (type, colours, pill buttons, header/footer, sign-in, legal, security screen); account dashboard on Upoharkabbo /admin layout; all Branta Hub styling removed
- [x] First admin account assigned
- [ ] Branded sign-in emails from films.brantatech.com showing the 6-digit code — waiting for owner to set up the email domain; owner sets code expiry to 600 s in Auth settings → One-time codes

## Backend move
- [x] Full backup kit saved (supabase/restore)
- [x] Restored on owner's own Supabase (schema, catalogue, posters, bucket)
- [ ] Google sign-in — owner will enable + configure Google provider later (redirect URLs already set)
- [x] All images moved to R2 (images/series, images/avatars); Supabase bucket removed

## Phase 2 — Admin panel
- [x] Admin panel pages inside the shared dashboard shell, admin-only full controls
- [x] Series & episode create/edit as full pages, Word-style rich text editor
- [ ] Direct-to-R2 multipart video upload with live progress
- [x] Poster/backdrop upload
- [x] Staff/Manager section: invite and role management (no self sign-up) — invite email redirects to /set-password
- [x] Users + staff lists, activity history, read-only account preview with amber exit banner

## Phase 3 — Payments
- [ ] bKash/Nagad manual payment (TrxID + phone, unique TrxID), admin approve → unlock
- [ ] Gateway-ready webhook architecture
