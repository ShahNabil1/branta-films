# Branta Films backend restore kit

Pre-migration snapshot from 2026-10-21. See the current Supabase migrations for later schema changes.

## Contents

| File | What it is |
| --- | --- |
| `branta-full-setup.sql` | Everything in one script: 11 tables, enum `app_role`, RLS policies, grants, functions (`has_role`, `is_staff`, password-reuse checks), triggers (incl. `on_auth_user_created` on `auth.users`), sample catalogue (3 series, 7 episodes, 7 video keys). Run once on an empty project. |
| `r2/images/series/<slug>/*.webp` | The 6 poster/backdrop images, laid out exactly as in the R2 bucket `branta-films`. Supabase Storage is not used. |
| `reference-live-schema.sql` | `pg_dump --schema-only` of the live `public` schema (for verification only). |
| `reference-live-data.sql` | `pg_dump --data-only` of the live `public` schema (identical to the seed in the setup script). |

At snapshot time there were no user accounts, profiles, unlocks, watch progress or passkeys, so nothing user-related is lost.

## Restore order on the new Supabase project

1. Run `branta-full-setup.sql` (agent migration, or Supabase SQL editor).
2. Upload `r2/` to the R2 bucket `branta-films` keeping the same folders (`images/series/<slug>/poster.webp`, `backdrop.webp`). Videos go in `videos/series/<slug>/e01.mp4` …
3. Secrets the app needs (re-enter; values are not exported): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`. `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` come from the Supabase connection.
4. Enable Email and Google in Supabase Auth. Configure the email templates for 6-digit codes and set the Site URL to `https://films.brantatech.com`. Allow the app's `/auth` and `/set-password` redirect URLs on the environments you operate. Keep self-sign-up enabled for viewer accounts.
5. Create the first admin: sign up, then insert a row into `public.user_roles (user_id, role) values ('<uuid>', 'admin')`.
