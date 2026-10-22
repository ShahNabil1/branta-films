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

- Browser builds emit source maps without source contents; server maps stay private. Why: safe production diagnostics.

- BrandLogo styles all shared logos. Why: consistent Branta image and Films wordmark.

- Local phone fields use BdPhoneInput and its normalizer. Why: consistent Bangla-digit conversion.

- Bundle fonts as hashed assets; preload the same imported URL. Why: one-year caching with automatic invalidation on file changes.

Subdirectories have their own `AGENTS.md`; read it before changing files there.

- Shared account-access middleware and restrictive RLS enforce bans/revoked sessions; browser fingerprints are best-effort. Why: UI-only checks cannot secure playback.
- Prebundle Tiptap and header Tooltip packages at startup; keep `optimizeDeps.ignoreOutdatedRequests: false`. Why: late discovery mixes React optimizer generations and crashes hooks.
- Private R2 video keys stay service-role only; tested `decidePlayback` is the single playback rule. Viewer links use `getPlaybackSource`/`decidePlayback`; admin previews use role-verified `getAdminEpisodeMedia`, short-lived links and no watch-history writes. Why: private previews are not viewing activity.
- All files (images and videos) live only in the private R2 bucket; Supabase Storage is not used. Images sit under `images/` (series/, episodes/, avatars/) and are proxied by `/api/public/media/*` (prefix + extension allow-list); videos sit under `videos/` and are never proxied. Why: owner wants every file in R2, and videos must stay behind access checks.
- Roles are in `user_roles` (`admin`, `manager`); `is_staff()` / `has_role()` gate RLS. Viewers have no role row. Why: avoids privilege escalation via profile edits.
- Password changes and resets go through server functions that check `password_is_reused` (current + `password_history`). Why: users must never reuse old passwords.
- Recovery requests use a public server function that checks the exact email via profiles and verifies the Auth account before sending; only an existence status is returned. Why: absent accounts must not advance to code entry, and privileged account details stay server-only.
- Passkey sign-in verifies with @simplewebauthn on the server, then returns a one-time magic-link token hash the browser exchanges via `verifyOtp`. Why: Cloud Auth has no native passkey provider.
- Admin-authored HTML is sanitised with `sanitizeRichText` (xss allow-list) both when rendering on server and client. Why: identical rendering, no script injection.
- Modals use `BrandedDialog`/`ConfirmDialog` (close only via X or explicit action); never native confirm/alert. Why: owner's UX rule.
- DevToolsShield (in `__root.tsx`) is inert on localhost, preview hosts and iframes. Why: production-only friction.
- Catalogue uses MediaRow/SeriesCard/HeroCarousel; watch uses EpisodeCarousel for shared styling and touch navigation.
- Video changes queue old keys privately; admin operations drain the queue, retaining failed R2 deletes for retry. Why: no orphaned videos.
- Avatars use `profilePicture`, saved images first; protected people reads resolve Auth pictures for private-safe consistency.
- Content SEO uses content-seo defaults plus nullable admin overrides; public episode details never return playback media. Why: shareable SSR metadata without weakening viewing access. Durations use Mediabunny private MP4 reads, never form input.
- Player menus/volume stay inside the player, never dialogs; dynamic HLS. Why: works in fullscreen.
- Design system mirrors the brantatech-com project: typography scale/motion are `@utility` classes in `src/styles.css`, `:root` is the dark palette and the `.light` class re-themes a subtree to the warm light palette; page primitives (`SiteContainer`, `Eyebrow`) live in `src/components/layout/primitives.tsx`; shadcn `Button` is the pill button. Why: one place to keep every page on the reference design.
- Backend is the owner's own Supabase project (not Lovable Cloud); OAuth (Google) uses `supabase.auth.signInWithOAuth` directly, never the Lovable broker, and providers/redirect URLs are configured in the Supabase dashboard. Why: the Lovable broker only serves Cloud projects.
- Staff invites land on `/set-password` (AuthProvider routes any fresh `invite` session there; `completeInvite` requires an invite `amr` < 24h and no existing password), then the user signs out and signs in with email + password. Staff-section invites must pass `redirectTo: <origin>/set-password`. Why: invite is the only link-based auth email; all others use 6-digit codes.
- Auth attempts omit absent captcha tokens and render Turnstile only after Supabase requests captcha; recovery uses a publishable client. Invite password setting relies on verified invite auth, not a fake captcha gate. Why: public Auth settings omit the captcha toggle; Supabase alone enforces it.
- Discounts exist only as coupons (`coupons`/`coupon_targets`); `auto_apply` coupons drive sale prices. `quoteCart` (src/lib/cart-pricing.ts, tested) prices carts — best single offer per line, never stacked, never whole-cart for targeted offers — and `placeOrder` re-runs it server-side from DB values. Catalogue `discount_price_bdt` is computed, not stored. Why: one rule decides what a viewer pays; browsers can't set prices.
- Manual payments create `orders`/`order_items`; only admin `reviewAdminOrder` writes `series_unlocks`/`episode_unlocks`. Playback allows series OR episode unlock. Why: unlocks only after verification.
- Popups live in `popups` (R2 `images/popups/`), rendered by `PopupRunner` in `__root` using `popup-schedule` areas; they close only via [X] or their action. Why: admin-scheduled, one at a time.
- Every route sets `staticData.sitemap`; `/sitemap.xml` derives static pages from the router and adds published series. Why: the sitemap tracks pages automatically.
- Catalogue artwork uses ArtworkImage with bounded Cloudflare widths and original fallback; uploads keep new object keys, avatars keep shorter caching. Why: controls transformation usage and prevents stale replacement images without caching private playback.
