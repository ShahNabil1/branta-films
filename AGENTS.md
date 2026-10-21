<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture rules

- Video files live only in private Cloudflare R2; `episode_media.video_key` is service-role only and links are issued by `getPlaybackSource` after `decidePlayback` (src/lib/access.ts). Why: no client can ever learn a permanent video address.
- Playback access rules live in one pure function (`decidePlayback`) with tests. Why: one place to change who can watch what.
- All files (images and videos) live only in the private R2 bucket; Supabase Storage is not used. Images sit under `images/` (series/, episodes/, avatars/) and are proxied by `/api/public/media/*` (prefix + extension allow-list); videos sit under `videos/` and are never proxied. Why: owner wants every file in R2, and videos must stay behind access checks.
- Roles are in `user_roles` (`admin`, `manager`); `is_staff()` / `has_role()` gate RLS. Viewers have no role row. Why: avoids privilege escalation via profile edits.
- Password changes and resets go through server functions that check `password_is_reused` (current + `password_history`). Why: users must never reuse old passwords.
- Passkey sign-in verifies with @simplewebauthn on the server, then returns a one-time magic-link token hash the browser exchanges via `verifyOtp`. Why: Cloud Auth has no native passkey provider.
- Admin-authored HTML is sanitised with `sanitizeRichText` (xss allow-list) both when rendering on server and client. Why: identical rendering, no script injection.
- Modals use `BrandedDialog`/`ConfirmDialog` (close only via X or explicit action); never native confirm/alert. Why: owner's UX rule.
- DevToolsShield wraps the app in `__root.tsx` and is inert on localhost, Lovable preview hosts and iframes. Why: friction only in production.
- Viewer-facing catalogue UI is built from `MediaRow` (snap-scroll rows), `SeriesCard` (hover preview) and `HeroCarousel` (its CSS progress animation drives auto-advance, so pause = paused animation); glass/cinema effects are `@utility` classes in `src/styles.css`. Why: one place for row, hover and glass behaviour across pages.
- Design system mirrors the brantatech-com project: typography scale/motion are `@utility` classes in `src/styles.css`, `:root` is the dark palette and the `.light` class re-themes a subtree to the warm light palette; page primitives (`SiteContainer`, `Eyebrow`) live in `src/components/layout/primitives.tsx`; shadcn `Button` is the pill button. Why: one place to keep every page on the reference design.
- Every dashboard (viewer account, admin panel) renders inside `DashboardShell` (src/components/dashboard) with sections passed as data, and builds pages from `DashboardKit` (`PageHeader`, `Panel`, `StatTile`, `Chip`). Why: identical sidebar/drawer/switcher behaviour across dashboards.
- Backend is the owner's own Supabase project (not Lovable Cloud); OAuth (Google) uses `supabase.auth.signInWithOAuth` directly, never the Lovable broker, and providers/redirect URLs are configured in the Supabase dashboard. Why: the Lovable broker only serves Cloud projects.
- Staff invites land on `/set-password` (AuthProvider routes any fresh `invite` session there; `completeInvite` requires an invite `amr` < 24h and no existing password), then the user signs out and signs in with email + password. Staff-section invites must pass `redirectTo: <origin>/set-password`. Why: invite is the only link-based auth email; all others use 6-digit codes.
