# Admin rules

- People detail routes use protected functions, authenticated heartbeat observations and private security tables, not resume positions, for presence and watch time. Why: observed duration is distinct from seeking.
- View-as keeps admin identity and offers a read-only account preview, never viewer credentials. Why: avoid privilege confusion.
- Viewer accounts use `DashboardShell`/`DashboardKit`; admin uses `AdminShell`/`AdminKit` and scoped `.admin-theme` tokens, with navigation passed as data. Why: admin reference styling can change without altering viewer or public pages.
- Admin operations use shared server middleware validating `has_role` as the caller before privileged access; full-page content editors use Tiptap, sanitized on save, and protected loaders query paginated collections. Why: all CRUD paths enforce the same permissions and drafts remain visible to administrators.
- Episodes are managed only inside their series page (`EpisodesPanel` in the series editor, route `/admin/series/$id/episodes/$episodeId`); `/admin/episodes` redirects to series. Reordering uses `reorderAdminEpisodes` (two-pass renumber for the unique series+number rule). Why: owner wants episodes strictly scoped to each series.
- Ordering uses `SortableList` and reorder server functions; `ImageCropDialog` exports WebP with `ARTWORK_SPECS`. Why: stable ordering/artwork.
- Uploads use `useVideoUpload` for XHR metrics, file/verification retry and wake lock; router/unload guards protect active uploads. Why: honest progress and interruption safeguards.
