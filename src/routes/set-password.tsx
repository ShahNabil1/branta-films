import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, FormAlert, authLinkCls } from "@/components/auth/AuthLayout";
import { SmartField } from "@/components/forms/SmartField";
import { Button } from "@/components/ui/button";
import { Turnstile, type TurnstileHandle } from "@/components/auth/Turnstile";
import { supabase } from "@/integrations/supabase/client";
import { completeInvite } from "@/lib/account.functions";
import { amrFromAccessToken, isFreshInviteSession } from "@/lib/invite";
import { validateNewPassword } from "@/lib/validation";

export const Route = createFileRoute("/set-password")({
  head: () => ({
    meta: [
      { title: "Set your password — Branta Films" },
      {
        name: "description",
        content: "Accept your Branta Films staff invite and choose a password.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Set your password — Branta Films" },
      {
        property: "og:description",
        content: "Accept your Branta Films staff invite and choose a password.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SetPasswordPage,
});

function SetPasswordPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ready" | "invalid">("checking");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ pw?: string | undefined; confirm?: string | undefined }>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const check = (token: string | undefined, mail: string | undefined) => {
      if (token && isFreshInviteSession(amrFromAccessToken(token), Date.now() / 1000)) {
        setEmail(mail ?? "");
        setState("ready");
        return true;
      }
      return false;
    };
    // The invite link signs the person in from the address bar; wait briefly for that.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      check(s?.access_token, s?.user.email);
    });
    const timer = window.setTimeout(() => {
      void supabase.auth.getSession().then(({ data }) => {
        if (!check(data.session?.access_token, data.session?.user.email)) setState("invalid");
      });
    }, 1500);
    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  const [captcha, setCaptcha] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileHandle>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = {
      pw: validateNewPassword(pw),
      confirm: pw !== confirm ? "Passwords don't match." : undefined,
    };
    setErrors(next);
    if (next.pw || next.confirm || busy) return;
    if (!captcha) { setFormError("Please complete the security check."); return; }
    setBusy(true);
    setFormError(null);
    try {
      await completeInvite({ data: { newPassword: pw } });
      await supabase.auth.signOut();
      toast.success("Password set. Sign in with your email and new password.");
      await navigate({ to: "/auth", replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not set your password.");
      captchaRef.current?.reset();
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Team invite"
      title="Set your password"
      subtitle="Welcome to the Branta Films team. Choose a password to finish setting up your account."
    >
      {state === "invalid" ? (
        <div className="space-y-4">
          <FormAlert>
            This invite link is invalid or has expired. Ask an admin to send you a new invite.
          </FormAlert>
          <Link
            to="/auth"
            className={`text-small ${authLinkCls}`}
          >
            Go to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5" aria-busy={busy}>
          <SmartField
            id="invite-email"
            label="Email"
            type="email"
            value={email}
            onValueChange={() => undefined}
            icon={<Mail />}
            readOnly
            disabled
          />
          <SmartField
            id="new-password"
            label="New password"
            password
            value={pw}
            onValueChange={setPw}
            error={errors.pw}
            icon={<KeyRound />}
            autoComplete="new-password"
            hint="At least 8 characters, including a letter and a number."
            disabled={busy || state !== "ready"}
          />
          <SmartField
            id="confirm-password"
            label="Confirm new password"
            password
            value={confirm}
            onValueChange={setConfirm}
            error={errors.confirm}
            icon={<KeyRound />}
            autoComplete="new-password"
            disabled={busy || state !== "ready"}
          />
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <Button
            type="submit"
            disabled={busy || state !== "ready" || !pw || !confirm}
            size="lg" className="w-full"
          >
            {state === "checking" ? "Checking your invite…" : busy ? "Saving…" : "Set password"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
