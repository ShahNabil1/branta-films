import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail } from "lucide-react";
import { AuthLayout, FormAlert } from "@/components/auth/AuthLayout";
import { SmartField } from "@/components/forms/SmartField";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { validateField } from "@/lib/validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Branta Films" },
      { name: "description", content: "Get a secure link to reset your Branta Films password." },
      { property: "og:title", content: "Reset your password — Branta Films" },
      { property: "og:description", content: "Get a secure link to reset your Branta Films password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateField("email", email);
    setError(err);
    if (err || busy) return;
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    setSent(true);
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send you a secure reset link.">
      {sent ? (
        <FormAlert tone="success">If an account exists for {email.trim()}, a reset link is on its way. The link works once.</FormAlert>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <SmartField
            id="email"
            label="Email"
            type="email"
            value={email}
            onValueChange={(v) => {
              setEmail(v);
              if (error) setError(validateField("email", v));
            }}
            onBlur={() => setError(validateField("email", email))}
            error={error}
            icon={<Mail />}
            autoComplete="email"
            placeholder="name@example.com"
            disabled={busy}
          />
          <Button type="submit" disabled={busy} className="h-12 w-full rounded-sm text-base font-semibold">
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/auth" className="text-foreground underline decoration-primary underline-offset-4 hover:text-primary">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
