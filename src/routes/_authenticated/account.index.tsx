import { createFileRoute, Link } from "@tanstack/react-router";
import { ContinueWatching } from "@/components/catalog/ContinueWatching";
import { displayName, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/account/")({
  head: () => ({
    meta: [
      { title: "My dashboard — Branta Films" },
      { name: "description", content: "Your Branta Films dashboard: continue watching and manage your account." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "My dashboard — Branta Films" },
      { property: "og:description", content: "Continue watching and manage your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountOverview,
});

function AccountOverview() {
  const { profile, user } = useAuth();
  return (
    <div className="space-y-12">
      <div>
        <p className="text-eyebrow text-primary">Dashboard</p>
        <h1 className="mt-3 text-h2">Hi, {displayName(profile, user)}</h1>
      </div>
      <ContinueWatching
        emptyText="Nothing in progress yet. Start an episode and it will appear here."
      />
      <div className="rounded-md border border-border bg-surface p-6">
        <h2 className="font-medium">Find something new</h2>
        <p className="mt-1 text-sm text-muted-foreground">Every series starts with a free first episode.</p>
        <Link to="/browse" className="mt-4 inline-block text-sm text-primary hover:underline">
          Browse series →
        </Link>
      </div>
    </div>
  );
}
