import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { ArrowRight, Fingerprint, KeyRound, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, FormAlert, GoogleIcon, OrDivider, authLinkCls } from "@/components/auth/AuthLayout";
import { CodeField } from "@/components/forms/CodeField";
import { SmartField } from "@/components/forms/SmartField";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { recordSignIn } from "@/lib/account.functions";
import { passkeyLoginOptions, passkeyLoginVerify } from "@/lib/passkey.functions";
import { safeRedirect, validateField } from "@/lib/validation";
import { loginDestination } from "@/lib/admin-rules";
import { amrFromAccessToken, isFreshInviteSession } from "@/lib/invite";

const search = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — Branta Films" },
      {
        name: "description",
        content:
          "Sign in or create your Branta Films account with Google, password or passkey.",
      },
      { property: "og:title", content: "Sign in — Branta Films" },
      { property: "og:description", content: "Sign in to keep watching Branta Films originals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const GOOGLE_FLAG = "bf_google_pending";

function AuthPage() {
  const { mode: modeParam, redirect } = Route.useSearch();
  const mode = modeParam ?? "signin";
  const navigate = useNavigate();
  const { user, loading, roles, session } = useAuth();
  const target = safeRedirect(redirect, "/");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  /** Set after sign-up: the email waiting for its 6-digit confirmation code. */
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "form" | "google" | "passkey">(null);
  const recorded = useRef(false);

  useEffect(() => {
    if (loading || !user) return;
    if (session && isFreshInviteSession(amrFromAccessToken(session.access_token), Date.now() / 1000)) return;
    if (!recorded.current && sessionStorage.getItem(GOOGLE_FLAG)) {
      recorded.current = true;
      sessionStorage.removeItem(GOOGLE_FLAG);
      void recordSignIn({ data: { method: "google" } }).catch(() => undefined);
    }
    void navigate({ to: loginDestination(roles, target), replace: true });
  }, [user, loading, roles, session, navigate, target]);

  const fieldFor = (name: "email" | "fullName" | "password", value: string) => {
    if (name === "password")
      return mode === "signup"
        ? validateField("newPassword", value)
        : validateField("password", value);
    return validateField(name, value);
  };
  const change = (
    name: "email" | "fullName" | "password",
    value: string,
    set: (v: string) => void,
  ) => {
    set(value);
    setFormError(null);
    if (touched[name]) setErrors((e) => ({ ...e, [name]: fieldFor(name, value) }));
  };
  const blur = (name: "email" | "fullName" | "password", value: string) => {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((e) => ({ ...e, [name]: fieldFor(name, value) }));
  };

  function validate(fields: ("email" | "fullName" | "password")[]) {
    const values = { email, fullName, password };
    const next: Record<string, string | undefined> = {};
    for (const f of fields) next[f] = fieldFor(f, values[f]);
    setErrors(next);
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));
    const first = fields.find((f) => next[f]);
    if (first) document.getElementById(first)?.focus();
    return !first;
  }

  async function google() {
    setBusy("google");
    setFormError(null);
    sessionStorage.setItem(GOOGLE_FLAG, "1");
    // Google sign-in goes straight through the project's own Supabase Auth.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          window.location.origin +
          "/auth" +
          (redirect ? `?redirect=${encodeURIComponent(target)}` : ""),
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      sessionStorage.removeItem(GOOGLE_FLAG);
      setBusy(null);
      setFormError("Google sign-in didn't complete. Please try again.");
    }
  }

  async function passkey() {
    setBusy("passkey");
    setFormError(null);
    try {
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const { challengeId, optionsJson } = await passkeyLoginOptions();
      const response = await startAuthentication({ optionsJSON: JSON.parse(optionsJson) });
      const { tokenHash } = await passkeyLoginVerify({
        data: { challengeId, response: response as never },
      });
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
      if (error) throw error;
      toast.success("Signed in with passkey");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setFormError(
        /NotAllowed|abort|cancel/i.test(msg)
          ? "Passkey request was cancelled."
          : "No passkey found for this device. Sign in another way, then add a passkey from your account.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const fields: ("email" | "fullName" | "password")[] =
      mode === "signup" ? ["fullName", "email", "password"] : ["email", "password"];
    if (!validate(fields)) return;
    setBusy("form");
    setFormError(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth",
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCode("");
          setConfirmEmail(email.trim());
          setNotice(`We emailed a 6-digit code to ${email.trim()}. It expires in 10 minutes.`);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          if (/not confirmed/i.test(error.message)) {
            // Account exists but was never confirmed: send a fresh code and ask for it.
            await supabase.auth.resend({ type: "signup", email: email.trim() });
            setCode("");
            setConfirmEmail(email.trim());
            setNotice(
              `Your email isn't confirmed yet. We emailed a 6-digit code to ${email.trim()}.`,
            );
            return;
          }
          throw error;
        }
        void recordSignIn({ data: { method: "password" } }).catch(() => undefined);
        toast.success("Welcome back");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setFormError(
        /invalid login/i.test(msg)
          ? "Your email or password is incorrect."
          : /not confirmed/i.test(msg)
            ? "Please confirm your email first."
            : /already registered/i.test(msg)
              ? "An account with this email already exists. Sign in instead."
              : msg || "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function resendConfirmCode() {
    if (busy || !confirmEmail) return;
    setBusy("form");
    setFormError(null);
    const { error } = await supabase.auth.resend({ type: "signup", email: confirmEmail });
    setBusy(null);
    if (error) {
      setFormError(
        /rate|seconds/i.test(error.message)
          ? "Please wait a minute before requesting another code."
          : error.message,
      );
      return;
    }
    setCode("");
    setNotice(`We emailed a new 6-digit code to ${confirmEmail}.`);
  }

  async function verifyConfirmCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !confirmEmail) return;
    if (code.length !== 6) {
      setFormError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy("form");
    setFormError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: confirmEmail,
      token: code,
      type: "signup",
    });
    setBusy(null);
    if (error) {
      setFormError("That code is incorrect or has expired. Request a new one.");
      return;
    }
    void recordSignIn({ data: { method: "password" } }).catch(() => undefined);
    toast.success("Account confirmed");
  }

  const disabled = busy !== null;
  const isSignup = mode === "signup";

  if (confirmEmail) {
    return (
      <AuthLayout
        eyebrow="One last step"
        title="Confirm your email"
        subtitle={`Enter the 6-digit code we sent to ${confirmEmail}.`}
      >
        {notice ? (
          <div className="mb-5">
            <FormAlert tone="success">{notice}</FormAlert>
          </div>
        ) : null}
        <form
          onSubmit={verifyConfirmCode}
          noValidate
          className="space-y-5"
          aria-busy={busy === "form"}
        >
          <div>
            <CodeField value={code} onChange={setCode} disabled={disabled} autoFocus />
            <button
              type="button"
              onClick={() => void resendConfirmCode()}
              disabled={disabled}
              className="text-small mt-3 text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-primary"
            >
              Send a new code
            </button>
          </div>
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <Button
            type="submit"
            disabled={disabled || code.length !== 6}
            size="lg" className="w-full"
          >
            {busy === "form" ? "Please wait…" : "Confirm & continue"}
            {busy !== "form" ? (
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            ) : null}
          </Button>
        </form>
        <p className="text-small mt-6 text-center text-muted-foreground">
          <button
            type="button"
            onClick={() => {
              setConfirmEmail(null);
              setNotice(null);
              setFormError(null);
              setCode("");
            }}
            className={authLinkCls}
          >
            Use a different email
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow={isSignup ? "New to Branta Films" : "Welcome back"}
      title={isSignup ? "Create account" : "Sign in"}
      subtitle={
        isSignup
          ? "Join Branta Films and start every series free with episode one."
          : "Pick up where you left off — your progress is saved on every device."
      }
    >
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={google}
          disabled={disabled}
          size="lg" className="w-full gap-3"
        >
          <GoogleIcon /> {busy === "google" ? "Connecting to Google…" : "Continue with Google"}
        </Button>
        {!isSignup ? (
          <Button
            type="button"
            variant="outline"
            onClick={passkey}
            disabled={disabled}
            size="lg" className="w-full gap-3"
          >
            <Fingerprint className="size-5" />{" "}
            {busy === "passkey" ? "Waiting for passkey…" : "Sign in with a passkey"}
          </Button>
        ) : null}
      </div>

      <OrDivider label="or with email" />

      {notice ? (
        <div className="mb-5">
          <FormAlert tone="success">{notice}</FormAlert>
        </div>
      ) : null}

      <form onSubmit={submitPassword} noValidate className="space-y-5" aria-busy={busy === "form"}>
        {isSignup ? (
          <SmartField
            id="fullName"
            label="Full name"
            value={fullName}
            onValueChange={(v) => change("fullName", v, setFullName)}
            onBlur={() => blur("fullName", fullName)}
            error={errors["fullName"]}
            icon={<UserRound />}
            autoComplete="name"
            placeholder="Your full name"
            maxLength={100}
            disabled={disabled}
          />
        ) : null}
        <SmartField
          id="email"
          label="Email"
          type="email"
          value={email}
          onValueChange={(v) => change("email", v, setEmail)}
          onBlur={() => blur("email", email)}
          error={errors["email"]}
          icon={<Mail />}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="name@example.com"
          maxLength={254}
          disabled={disabled}
        />
        <SmartField
          id="password"
          label="Password"
          password
          value={password}
          onValueChange={(v) => change("password", v, setPassword)}
          onBlur={() => blur("password", password)}
          error={errors["password"]}
          icon={<KeyRound />}
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder={isSignup ? "At least 8 characters, with a number" : "Your password"}
          maxLength={72}
          disabled={disabled}
        />
        {!isSignup ? (
          <div className="-mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-small text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-primary"
            >
              Forgot password?
            </Link>
          </div>
        ) : null}
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        <Button
          type="submit"
          disabled={disabled}
          size="lg" className="w-full"
        >
          {busy === "form" ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          {busy !== "form" ? (
            <ArrowRight className="transition-transform group-hover:translate-x-1" />
          ) : null}
        </Button>
      </form>

      <p className="text-small mt-6 text-center text-muted-foreground">
        {isSignup ? "Already have an account? " : "New to Branta Films? "}
        <Link
          to="/auth"
          search={{ mode: isSignup ? "signin" : "signup", ...(redirect ? { redirect } : {}) }}
          className={authLinkCls}
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </AuthLayout>
  );
}
