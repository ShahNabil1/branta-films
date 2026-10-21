# Branta Films roadmap

## Phase 1 — Foundation (done)
- [x] Branta Tech dark theme, logo, favicon, Geist + SolaimanLipi/Kalpurush fonts
- [x] DevToolsShield (production only)
- [x] Home, browse, series pages with sample catalogue
- [x] Sign-in: Google, email code, email + password, passkey; forgot/reset password
- [x] Inputs: validation, Caps Lock, typing-language indicator, show/hide password
- [x] Password change: current required, no reuse of current/previous passwords
- [x] Secure playback: private R2 + short-lived signed links after access check
- [x] Branded player, progress saved every 10 s + on pause, Continue Watching
- [x] User dashboard with independent sidebar (overview, library, profile, security)
- [x] Privacy Policy + Terms of Service
- [x] Cinematic streaming redesign: rotating hero, trending + category rows, glass nav/cards/footer
- [ ] First admin account — waiting for owner's admin email
- [ ] Branded sign-in emails from films.brantatech.com showing the 6-digit code — waiting for owner to set up the email domain; owner sets code expiry to 600 s in Auth settings → One-time codes

## Backend move
- [x] Full backup kit saved (supabase/restore)
- [x] Restored on owner's own Supabase (schema, catalogue, posters, bucket)
- [ ] Google sign-in — owner will enable + configure Google provider later (redirect URLs already set)
- [x] All images moved to R2 (images/series, images/avatars); Supabase bucket removed

## Phase 2 — Admin panel
- [ ] Admin shell (independent sidebar, no layout shift), staff-only
- [ ] Series & episode create/edit as full pages, Word-style rich text editor
- [ ] Direct-to-R2 multipart video upload with live progress
- [ ] Poster/backdrop upload
- [ ] Staff/Manager section: invite/create (no self sign-up) — invite email must redirect to /set-password (page done)
- [ ] Users + staff lists, activity history, one-click impersonation with amber exit banner

## Phase 3 — Payments
- [ ] bKash/Nagad manual payment (TrxID + phone, unique TrxID), admin approve → unlock
- [ ] Gateway-ready webhook architecture
