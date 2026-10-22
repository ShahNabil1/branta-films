import { createFileRoute, redirect } from "@tanstack/react-router";
// Episodes are managed inside each series; keep the old address working.
export const Route = createFileRoute("/_authenticated/admin/episodes/")({
  beforeLoad: () => { throw redirect({ to: "/admin/series", replace: true }); },
});
