import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, FormAlert } from "@/components/auth/AuthLayout";
import { SmartField } from "@/components/forms/SmartField";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { completePasswordReset } from "@/lib/account.functions";
import { validateNewPassword } from "@/lib/validation";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Branta Films" },
      { name: "description", content: "Set a new password for your Branta Films account." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Choose a new password — Branta Films" },
      { property: "og:description", content: "Set a new password for your Branta Films account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ pw?: string | undefined; confirm?: string | undefined }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && isRecovery)) setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else if (!isRecovery) setReady(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = {
      pw: validateNewPassword(pw),
      confirm: pw !== confirm ? "Passwords don't match." : undefined,
    };
    setErrors(next);
    if (next.pw || next.confirm || busy) return;
    setBusy(true);
    setFormError(null);
    try {
      await completePasswordReset({ data: { newPassword: pw } });
      toast.success("Password updated");
      await navigate({ to: "/account", replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not update your password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="It must differ from your current and previous passwords.">
      {ready === false ? (
        <div className="space-y-4">
          <FormAlert>This reset link is invalid or has expired.</FormAlert>
          <Link to="/forgot-password" className="text-sm text-foreground underline decoration-primary underline-offset-4 hover:text-primary">
            Request a new link
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <SmartField id="new-password" label="New password" password value={pw} onValueChange={setPw} error={errors.pw} icon={<KeyRound />} autoComplete="new-password" hint="At least 8 characters, including a letter and a number." disabled={busy || !ready} />
          <SmartField id="confirm-password" label="Confirm new password" password value={confirm} onValueChange={setConfirm} error={errors.confirm} icon={<KeyRound />} autoComplete="new-password" disabled={busy || !ready} />
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <Button type="submit" disabled={busy || !ready || !pw || !confirm} className="h-12 w-full rounded-sm text-base font-semibold">
            {busy ? "Saving…" : "Update password"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
