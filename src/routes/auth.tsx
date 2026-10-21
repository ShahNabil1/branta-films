import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { ArrowRight, Fingerprint, KeyRound, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, FormAlert, GoogleIcon } from "@/components/auth/AuthLayout";
import { SmartField } from "@/components/forms/SmartField";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { recordSignIn } from "@/lib/account.functions";
import { passkeyLoginOptions, passkeyLoginVerify } from "@/lib/passkey.functions";
import { safeRedirect, validateField } from "@/lib/validation";
import { cn } from "@/lib/utils";

const search = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — Branta Films" },
      { name: "description", content: "Sign in or create your Branta Films account with Google, email code, password or passkey." },
      { property: "og:title", content: "Sign in — Branta Films" },
      { property: "og:description", content: "Sign in to keep watching Branta Films originals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Method = "password" | "code";
const GOOGLE_FLAG = "bf_google_pending";

function AuthPage() {
  const { mode: modeParam, redirect } = Route.useSearch();
  const mode = modeParam ?? "signin";
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const target = safeRedirect(redirect, "/");

  const [method, setMethod] = useState<Method>("password");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "form" | "google" | "passkey">(null);
  const recorded = useRef(false);

  useEffect(() => {
    if (loading || !user) return;
    if (!recorded.current && sessionStorage.getItem(GOOGLE_FLAG)) {
      recorded.current = true;
      sessionStorage.removeItem(GOOGLE_FLAG);
      void recordSignIn({ data: { method: "google" } }).catch(() => undefined);
    }
    void navigate({ to: target, replace: true });
  }, [user, loading, navigate, target]);

  const fieldFor = (name: "email" | "fullName" | "password", value: string) => {
    if (name === "password") return mode === "signup" ? validateField("newPassword", value) : validateField("password", value);
    return validateField(name, value);
  };
  const change = (name: "email" | "fullName" | "password", value: string, set: (v: string) => void) => {
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
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth" + (redirect ? `?redirect=${encodeURIComponent(target)}` : ""),
      extraParams: { prompt: "select_account" },
    });
    if (result.error) {
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
      const { tokenHash } = await passkeyLoginVerify({ data: { challengeId, response: response as never } });
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
    const fields: ("email" | "fullName" | "password")[] = mode === "signup" ? ["fullName", "email", "password"] : ["email", "password"];
    if (!validate(fields)) return;
    setBusy("form");
    setFormError(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { full_name: fullName.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice(`We sent a confirmation link to ${email.trim()}. Open it to activate your account.`);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        void recordSignIn({ data: { method: "password" } }).catch(() => undefined);
        toast.success("Welcome back");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setFormError(
        /invalid login/i.test(msg)
          ? "Your email or password is incorrect."
          : /not confirmed/i.test(msg)
            ? "Please confirm your email first — check your inbox for the link."
            : /already registered/i.test(msg)
              ? "An account with this email already exists. Sign in instead."
              : msg || "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy || !validate(["email"])) return;
    setBusy("form");
    setFormError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + "/auth" },
    });
    setBusy(null);
    if (error) {
      setFormError(/rate|seconds/i.test(error.message) ? "Please wait a minute before requesting another code." : error.message);
      return;
    }
    setCodeSent(true);
    setCode("");
    setNotice(`We emailed a 6-digit code to ${email.trim()}. It expires in 10 minutes.`);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (code.length !== 6) {
      setFormError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy("form");
    setFormError(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: "email" });
    setBusy(null);
    if (error) {
      setFormError("That code is incorrect or has expired. Request a new one.");
      return;
    }
    void recordSignIn({ data: { method: "email_code" } }).catch(() => undefined);
    toast.success("Signed in");
  }

  const disabled = busy !== null;
  const isSignup = mode === "signup";

  return (
    <AuthLayout
      title={isSignup ? "Create your account" : "Welcome back"}
      subtitle={isSignup ? "Join Branta Films to start watching." : "Sign in to keep watching."}
    >
      <div className="space-y-3">
        <Button type="button" variant="outline" onClick={google} disabled={disabled} className="h-12 w-full gap-3 rounded-sm bg-surface text-base">
          <GoogleIcon /> {busy === "google" ? "Connecting to Google…" : "Continue with Google"}
        </Button>
        {!isSignup ? (
          <Button type="button" variant="outline" onClick={passkey} disabled={disabled} className="h-12 w-full gap-3 rounded-sm bg-surface text-base">
            <Fingerprint className="size-5" /> {busy === "passkey" ? "Waiting for passkey…" : "Sign in with a passkey"}
          </Button>
        ) : null}
      </div>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-eyebrow text-muted-foreground">or with email</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {!isSignup ? (
        <div className="mb-6 grid grid-cols-2 rounded-sm border border-border p-1" role="tablist" aria-label="Email sign-in method">
          {(["password", "code"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={method === m}
              onClick={() => {
                setMethod(m);
                setFormError(null);
                setNotice(null);
              }}
              className={cn(
                "rounded-sm py-2 text-sm transition-colors",
                method === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "password" ? "Password" : "Email code"}
            </button>
          ))}
        </div>
      ) : null}

      {notice ? <div className="mb-5"><FormAlert tone="success">{notice}</FormAlert></div> : null}

      {isSignup || method === "password" ? (
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
              <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
                Forgot password?
              </Link>
            </div>
          ) : null}
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <Button type="submit" disabled={disabled} className="group h-12 w-full rounded-sm text-base font-semibold">
            {busy === "form" ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
            {busy !== "form" ? <ArrowRight className="transition-transform group-hover:translate-x-1" /> : null}
          </Button>
        </form>
      ) : (
        <form onSubmit={codeSent ? verifyCode : sendCode} noValidate className="space-y-5" aria-busy={busy === "form"}>
          <SmartField
            id="email"
            label="Email"
            type="email"
            value={email}
            onValueChange={(v) => {
              change("email", v, setEmail);
              if (codeSent) setCodeSent(false);
            }}
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
          {codeSent ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">6-digit code</p>
              <InputOTP maxLength={6} value={code} onChange={(v) => setCode(v.replace(/\D/g, ""))} inputMode="numeric" autoFocus disabled={disabled}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="size-12 bg-surface font-mono text-lg" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <button type="button" onClick={() => void sendCode()} disabled={disabled} className="text-xs text-muted-foreground hover:text-primary">
                Send a new code
              </button>
            </div>
          ) : null}
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <Button type="submit" disabled={disabled} className="group h-12 w-full rounded-sm text-base font-semibold">
            {busy === "form" ? "Please wait…" : codeSent ? "Verify & sign in" : "Email me a code"}
            {busy !== "form" ? <ArrowRight className="transition-transform group-hover:translate-x-1" /> : null}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account? " : "New to Branta Films? "}
        <Link
          to="/auth"
          search={{ mode: isSignup ? "signin" : "signup", ...(redirect ? { redirect } : {}) }}
          className="font-medium text-foreground underline decoration-primary underline-offset-4 hover:text-primary"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </AuthLayout>
  );
}
