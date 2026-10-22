# Branta Films roadmap

## Current request — Episode counts and runtimes
- [ ] Consistent icon-led episode counts across catalogue and dashboard
- [ ] Readable hour/minute runtimes throughout content metadata; preserve player timestamps
- [ ] Verify duration rules and mobile/desktop series presentation

## Current request — Google One Tap and post-login passkey setup
- [x] Add optional Google account suggestions using GIS and existing Supabase accounts, preserving OAuth fallback
- [x] Offer optional passkey enrollment after a fresh sign-in/confirmed signup, excluding existing keys and invite/recovery flows
- [x] Six eligibility/dismissal/nonce tests pass; public sign-in/signup browser checks pass with no runtime errors; build OK
- [ ] Enable and verify real Google One Tap — requires owner's Google OAuth web Client ID and authorized JavaScript origins; external Supabase cannot supply a managed test session
- [ ] Verify actual post-login device enrollment and saved credential — external Supabase has no managed test session; needs real supported device

## Current request — Network dependency tree and LCP
- [x] Shared first-slide selection and responsive image preload; conditional Bangla font preload on Home/Browse, preserving hashed fonts
- [x] Auth/private-only Supabase preconnect; no redundant production same-origin or speculative captcha hints; 23 tests pass, browser confirms matching server image hint and auth-only connection hint, no runtime errors, build OK
- [ ] Recheck published Lighthouse timing after owner publishes; Cloudflare-injected email-decode script remains dashboard-controlled

## Current request — DevTools CPU and account-only scope
- [x] Remove expensive package; scope blocking to /account and descendants, clearing timer/listeners on exit
- [x] 21 tests pass (scope, lifecycle, access, routes); Home/Browse/auth browser checks pass with no detector requests/errors; build OK
- [ ] Verify signed-in production account playback and new Lighthouse timing after publish — external Supabase has no managed test session; published site still needs owner deployment

## Current request — Cache lifetime warning
- [x] Diagnose live fonts: no Cache-Control; existing hashed assets return one-year immutable headers; Cloudflare API lists no accessible brantatech.com zone, so dashboard rules could not be inspected
- [x] Move all five fonts into Vite's hashed asset flow and use the same imported URL for Geist preload; Nitro's existing assets policy supplies one-year caching and changed files get new addresses
- [x] Preserve private-data isolation and existing artwork/query invalidation; no shared account/checkout/playback caching introduced
- [x] Verify all fonts including Bangla, Home/Browse/auth, desktop/mobile and 19 regression tests; build OK, no runtime errors
- [ ] Confirm live hashed font Cache-Control after owner publishes; platform-owned /~flock.js and Cloudflare email-decode TTL remain outside app control

## Current request — Lighthouse screenshots
- [x] Fix orange Sign in contrast through the shared primary foreground token
- [x] Enable production browser source maps without embedding original source contents; resolved config verifies client enabled and SSR disabled; live map delivery needs next publish
- [x] Verify desktop/mobile Sign in contrast (6.01:1 idle, 5.00:1 hover), cart and auth navigation; four regression tests pass, no runtime errors; optional not-applicable audits are not failures

## Current request — Header and Films wordmark
- [x] Research and simplify public header navigation and utilities
- [x] Visually align Films size/weight with Branta globally through BrandLogo; exact source logo font could not be identified
- [x] Verify header at 320, 393, 640, 1107 and 1280px; Browse, cart open/close and Sign in pass without runtime errors

## Current request — Cloudflare image transformations and caching
- [x] Link the new workspace Cloudflare connection
- [x] Use bounded Cloudflare artwork transformations with original-image fallback
- [x] Test transformation URLs and image-only one-year caching — 23 tests pass; desktop/mobile artwork and fallback load; build OK
- [x] Verify live transformation availability and prepare dashboard cache instructions — live transformed cover works; connection returns no accessible zones, so dashboard rules remain owner-managed

## Current request — AI-generated identity and content SEO
- [x] Connect Google Search Console freshly in the new workspace; disregard previous workspace connections
- [x] Update site identity, titles, social metadata and structured data
- [x] Persist validated optional series/episode metadata overrides and add admin controls
- [x] Apply automatic defaults and overrides to series/episode pages; keep private playback protected
- [x] Verify metadata rules, public episode SSR, sign-in destination and sitemap; build OK
- [ ] Verify actual signed-in admin save and R2 OG upload — blocked: external Supabase has no managed test session

## Current request — Payments, coupons, popups (3 phases)
- [x] Phase 1: per-episode prices, cart, purchase popup on locked episodes, checkout (bKash/Nagad/Rocket + TrxID), viewer Orders page, admin Payments approve/reject + receiving numbers
- [x] Phase 2: Panjabi-style coupon builder; series discounts migrated to auto-apply coupons; per-item auto discount, single "applied" label, server-side validation and limits
- [x] Phase 3: admin Popups (image, delay, placement, frequency, schedule, link or Purchase now → cart), multiple popups queued
- [x] 106 tests pass; public series page and cart verified in browser; build OK
- [ ] Signed-in checkout → admin approval end-to-end — blocked: external Supabase has no managed test session


## Current request — Mobile player and upload status
- [x] Fix mobile play hit targets, adjustable volume and unclipped playback settings
- [x] Add real upload bytes, percentage, speed/ETA, stage/error/retry states, navigation/close warnings and best-effort screen wake lock
- [x] 393px touch checks pass for central Play, volume 35%, settings/speed and upload metrics; 21 tests pass; build OK
- [ ] Real authenticated R2 upload and physical-device suspension check — blocked: external Supabase has no managed session; browsers cannot prevent minimising/OS suspension

## Current request — Automatic video duration and visible controls
- [x] Remove manual duration entry; derive and persist actual MP4 duration on uploads and existing saved-video inspection
- [x] Show Replace/Delete before Edit, preserving the explicit Edit requirement
- [x] Test duration rules, controls and exact public clock; browser fixture verifies Edit unlock, replacement chooser and delete confirmation
- [ ] Verify actual signed-in upload/deletion — blocked: external Supabase has no managed test session

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
