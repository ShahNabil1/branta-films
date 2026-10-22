import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, FormAlert, authLinkCls } from "@/components/auth/AuthLayout";
import { CodeField } from "@/components/forms/CodeField";
import { SmartField } from "@/components/forms/SmartField";
import { Button } from "@/components/ui/button";
import { Turnstile } from "@/components/auth/Turnstile";
import { useCaptcha } from "@/components/auth/useCaptcha";
import { supabase } from "@/integrations/supabase/client";
import { completePasswordReset } from "@/lib/account.functions";
import { sendPasswordRecoveryCode } from "@/lib/password-recovery.functions";
import { validateField, validateNewPassword } from "@/lib/validation";

export const Route = createFileRoute("/forgot-password")({
  staticData: { sitemap: false },
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Reset your password — Branta Films" },
      {
        name: "description",
        content: "Get a 6-digit code by email and choose a new Branta Films password.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Reset your password — Branta Films" },
      {
        property: "og:description",
        content: "Get a 6-digit code by email and choose a new Branta Films password.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

type Step = "email" | "code" | "password";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwErrors, setPwErrors] = useState<{
    pw?: string | undefined;
    confirm?: string | undefined;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { captcha, setCaptcha, required: captchaRequired, captchaRef, checkError: checkCaptchaError } = useCaptcha();

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    const err = validateField("email", email);
    setEmailError(err);
    if (err || busy) return;
    setBusy(true);
    setFormError(null);
    setNotice(null);
    try {
      const result = await sendPasswordRecoveryCode({ data: { email: email.trim(), captchaToken: captcha ?? undefined } });
      if (result.status === "not_found") {
        setStep("email");
        setCode("");
        setFormError("No account exists with this email address.");
        return;
      }
      setCode("");
      setStep("code");
      setNotice(`We emailed a 6-digit code to ${email.trim()}. It expires in 10 minutes.`);
    } catch (error) {
      if (checkCaptchaError(error)) { setFormError("Complete the security check, then request your code again."); return; }
      setFormError(error instanceof Error ? error.message : "Could not send your reset code. Please try again.");
    } finally {
      setBusy(false);
      captchaRef.current?.reset();
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (code.length !== 6) {
      setFormError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    setFormError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "recovery",
    });
    setBusy(false);
    if (error) {
      setFormError("That code is incorrect or has expired. Request a new one.");
      return;
    }
    setNotice(null);
    setStep("password");
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    const next = {
      pw: validateNewPassword(pw),
      confirm: pw !== confirm ? "Passwords don't match." : undefined,
    };
    setPwErrors(next);
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

  const titles: Record<Step, [string, string]> = {
    email: ["Forgot your password?", "Enter your email and we'll send you a 6-digit code."],
    code: ["Enter your code", `Type the 6-digit code we sent to ${email.trim()}.`],
    password: ["Choose a new password", "It must differ from your current and previous passwords."],
  };

  return (
    <AuthLayout eyebrow={`Reset password · Step ${step === "email" ? 1 : step === "code" ? 2 : 3} of 3`} title={titles[step][0]} subtitle={titles[step][1]}>
      {notice ? (
        <div className="mb-5">
          <FormAlert tone="success">{notice}</FormAlert>
        </div>
      ) : null}

      {step === "email" ? (
        <form onSubmit={sendCode} noValidate className="space-y-5">
          <SmartField
            id="email"
            label="Email"
            type="email"
            value={email}
            onValueChange={(v) => {
              setEmail(v);
              setFormError(null);
              if (emailError) setEmailError(validateField("email", v));
            }}
            onBlur={() => setEmailError(validateField("email", email))}
            error={emailError}
            icon={<Mail />}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@example.com"
            maxLength={254}
            disabled={busy}
          />
          {captchaRequired ? <Turnstile key="email" ref={captchaRef} onToken={setCaptcha} action="recover" /> : null}
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <Button
            type="submit"
            disabled={busy}
            size="lg" className="w-full"
          >
            {busy ? "Sending…" : "Send code"}
            {!busy ? (
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            ) : null}
          </Button>
        </form>
      ) : null}

      {step === "code" ? (
        <form onSubmit={verifyCode} noValidate className="space-y-5">
          <div>
            <CodeField value={code} onChange={setCode} disabled={busy} autoFocus />
            <div className="text-small mt-3 flex gap-5 text-muted-foreground">
              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={busy}
                className="underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-primary"
              >
                Send a new code
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setNotice(null);
                  setFormError(null);
                }}
                disabled={busy}
                className="underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-primary"
              >
                Use a different email
              </button>
            </div>
          </div>
          {captchaRequired ? <Turnstile key="resend" ref={captchaRef} onToken={setCaptcha} action="recover_resend" /> : null}
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <Button
            type="submit"
            disabled={busy || code.length !== 6}
            size="lg" className="w-full"
          >
            {busy ? "Checking…" : "Verify code"}
            {!busy ? (
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            ) : null}
          </Button>
        </form>
      ) : null}

      {step === "password" ? (
        <form onSubmit={savePassword} noValidate className="space-y-5">
          <SmartField
            id="new-password"
            label="New password"
            password
            value={pw}
            onValueChange={setPw}
            error={pwErrors.pw}
            icon={<KeyRound />}
            autoComplete="new-password"
            hint="At least 8 characters, including a letter and a number."
            disabled={busy}
          />
          <SmartField
            id="confirm-password"
            label="Confirm new password"
            password
            value={confirm}
            onValueChange={setConfirm}
            error={pwErrors.confirm}
            icon={<KeyRound />}
            autoComplete="new-password"
            disabled={busy}
          />
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <Button
            type="submit"
            disabled={busy || !pw || !confirm}
            size="lg" className="w-full"
          >
            {busy ? "Saving…" : "Update password"}
          </Button>
        </form>
      ) : null}

      {step !== "password" ? (
        <p className="text-small mt-6 text-center text-muted-foreground">
          <Link
            to="/auth"
            className={authLinkCls}
          >
            Back to sign in
          </Link>
        </p>
      ) : null}
    </AuthLayout>
  );
}
