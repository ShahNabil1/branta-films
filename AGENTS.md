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

- People detail routes use protected functions, authenticated heartbeat observations and private security tables, not resume positions, for presence and watch time. Why: observed duration is distinct from seeking.
- Shared account-access middleware and restrictive RLS enforce bans/revoked sessions; browser fingerprints are best-effort. Why: UI-only checks cannot secure playback.
- View-as keeps admin identity and offers an audited read-only account preview, never viewer credentials. Why: avoid privilege confusion.

- Prebundle all Tiptap editor packages at startup and reject outdated Vite optimizer requests with `optimizeDeps.ignoreOutdatedRequests: false`. Why: late editor discovery invalidates in-flight module URLs, while mixing dependency generations crashes React hooks.

- Private R2 video keys stay service-role only. Viewer links use `getPlaybackSource`/`decidePlayback`; admin previews use role-verified `getAdminEpisodeMedia`, short-lived links and no watch-history writes. Why: private previews are not viewing activity.
- Playback uses tested `decidePlayback` as one source of truth.
- All files (images and videos) live only in the private R2 bucket; Supabase Storage is not used. Images sit under `images/` (series/, episodes/, avatars/) and are proxied by `/api/public/media/*` (prefix + extension allow-list); videos sit under `videos/` and are never proxied. Why: owner wants every file in R2, and videos must stay behind access checks.
- Roles are in `user_roles` (`admin`, `manager`); `is_staff()` / `has_role()` gate RLS. Viewers have no role row. Why: avoids privilege escalation via profile edits.
- Password changes and resets go through server functions that check `password_is_reused` (current + `password_history`). Why: users must never reuse old passwords.
- Recovery requests use a public server function that checks the exact email via profiles and verifies the Auth account before sending; only an existence status is returned. Why: absent accounts must not advance to code entry, and privileged account details stay server-only.
- Passkey sign-in verifies with @simplewebauthn on the server, then returns a one-time magic-link token hash the browser exchanges via `verifyOtp`. Why: Cloud Auth has no native passkey provider.
- Admin-authored HTML is sanitised with `sanitizeRichText` (xss allow-list) both when rendering on server and client. Why: identical rendering, no script injection.
- Modals use `BrandedDialog`/`ConfirmDialog` (close only via X or explicit action); never native confirm/alert. Why: owner's UX rule.
- DevToolsShield wraps the app in `__root.tsx` and is inert on localhost, Lovable preview hosts and iframes. Why: friction only in production.
- Catalogue uses MediaRow/SeriesCard/HeroCarousel; watch uses EpisodeCarousel for shared styling and touch navigation.
- Video changes queue old keys privately; admin operations drain the queue, retaining failed R2 deletes for retry. Why: no orphaned videos.
- Avatars use `profilePicture`, saved images first; protected people reads resolve Auth pictures for private-safe consistency.
- Series metadata uses tested `series-metadata.ts` defaults.
- Players own dark tokens and absolute sizing; HLS loads dynamically, MP4 stays original. Why: light themes cannot obscure playback.
- Design system mirrors the brantatech-com project: typography scale/motion are `@utility` classes in `src/styles.css`, `:root` is the dark palette and the `.light` class re-themes a subtree to the warm light palette; page primitives (`SiteContainer`, `Eyebrow`) live in `src/components/layout/primitives.tsx`; shadcn `Button` is the pill button. Why: one place to keep every page on the reference design.
- Viewer accounts use `DashboardShell`/`DashboardKit`; admin uses `AdminShell`/`AdminKit` and scoped `.admin-theme` tokens, with navigation passed as data. Why: admin reference styling can change without altering viewer or public pages.
- Admin operations use shared server middleware validating `has_role` as the caller before privileged access; full-page content editors use Tiptap, sanitized on save, and protected loaders query paginated collections. Why: all CRUD paths enforce the same permissions and drafts remain visible to administrators.
- Backend is the owner's own Supabase project (not Lovable Cloud); OAuth (Google) uses `supabase.auth.signInWithOAuth` directly, never the Lovable broker, and providers/redirect URLs are configured in the Supabase dashboard. Why: the Lovable broker only serves Cloud projects.
- Staff invites land on `/set-password` (AuthProvider routes any fresh `invite` session there; `completeInvite` requires an invite `amr` < 24h and no existing password), then the user signs out and signs in with email + password. Staff-section invites must pass `redirectTo: <origin>/set-password`. Why: invite is the only link-based auth email; all others use 6-digit codes.
- Episodes are managed only inside their series page (`EpisodesPanel` in the series editor, route `/admin/series/$id/episodes/$episodeId`); `/admin/episodes` redirects to series. Reordering uses `reorderAdminEpisodes` (two-pass renumber for the unique series+number rule). Why: owner wants episodes strictly scoped to each series.
- Auth attempts omit absent captcha tokens and render Turnstile only after Supabase requests captcha; recovery uses a publishable client. Invite password setting relies on verified invite auth, not a fake captcha gate. Why: public Auth settings omit the captcha toggle; Supabase alone enforces it.
- Admin ordering is drag-and-drop via `SortableList` (@dnd-kit; series persist `sort_order` via `reorderAdminSeries`, episodes renumber via `reorderAdminEpisodes`); artwork uploads go through `ImageCropDialog`, exporting WebP at sizes in `ARTWORK_SPECS` (src/lib/artwork.ts). Why: no manual order numbers, and every image fits its frame on all screens.
- Series pricing goes through `seriesPrice` (src/lib/pricing.ts) and `PriceTag`; `discount_price_bdt` is optional and must be below `price_bdt` (DB check + server validation). Why: one rule decides what a viewer pays everywhere.
