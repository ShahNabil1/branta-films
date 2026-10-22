# Branta Films roadmap

## Current request — Audience and staff management
- [ ] Replace Users/Staff lists with presence, viewing, free/paid and avatar summaries
- [ ] Add account detail pages, security/session controls, watch history and series access
- [ ] Track first/last source, devices, trusted IP and available location; enforce identifier blocks
- [ ] Add audited account administration and safe view-as account preview
- [ ] Validate permissions, presence rules and public/administration layouts

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
- [ ] Users + staff lists, activity history, one-click impersonation with amber exit banner

## Phase 3 — Payments
- [ ] bKash/Nagad manual payment (TrxID + phone, unique TrxID), admin approve → unlock
- [ ] Gateway-ready webhook architecture
