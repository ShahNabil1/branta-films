import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Fingerprint, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SmartField } from "@/components/forms/SmartField";
import { FormAlert } from "@/components/auth/AuthLayout";
import { ConfirmDialog } from "@/components/ui/branded-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { changePassword, getSecurityOverview } from "@/lib/account.functions";
import { passkeyRegisterOptions, passkeyRegisterVerify } from "@/lib/passkey.functions";
import { validateNewPassword } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/account/security")({
  head: () => ({
    meta: [
      { title: "Sign-in & security — Branta Films" },
      { name: "description", content: "Manage your password, passkeys and connected sign-in methods." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Sign-in & security — Branta Films" },
      { property: "og:description", content: "Manage your password, passkeys and connected sign-in methods." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SecurityPage,
});

const PROVIDER_LABEL: Record<string, string> = { email: "Email & password", google: "Google" };

function SecurityPage() {
  const getOverview = useServerFn(getSecurityOverview);
  const { data: overview, refetch } = useQuery({ queryKey: ["security-overview"], queryFn: () => getOverview() });

  return (
    <div className="max-w-2xl space-y-14">
      <div>
        <p className="text-eyebrow text-primary">Account</p>
        <h1 className="mt-3 text-h2">Sign-in & security</h1>
      </div>

      <section>
        <h2 className="text-h3">Connected sign-in methods</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Signing in with Google using the same email opens this same account. You can also connect Google here.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {(overview?.providers ?? []).map((p) => (
            <span key={p} className="rounded-sm border border-border bg-surface px-3 py-1.5 text-sm">
              {PROVIDER_LABEL[p] ?? p}
            </span>
          ))}
          {overview && !overview.providers.includes("google") ? <ConnectGoogleButton /> : null}
        </div>
      </section>

      <PasswordSection hasPassword={overview?.hasPassword ?? true} onDone={() => void refetch()} />
      <PasskeySection />
    </div>
  );
}

function PasswordSection({ hasPassword, onDone }: { hasPassword: boolean; onDone: () => void }) {
  const change = useServerFn(changePassword);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = Boolean(next || confirm || current);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = {
      current: hasPassword && !current ? "Enter your current password." : undefined,
      next: validateNewPassword(next, hasPassword ? current : undefined),
      confirm: next !== confirm ? "Passwords don't match." : undefined,
    };
    setErrors(errs);
    if (errs.current || errs.next || errs.confirm || busy) return;
    setBusy(true);
    setFormError(null);
    try {
      await change({ data: { currentPassword: hasPassword ? current : undefined, newPassword: next } });
      toast.success(hasPassword ? "Password changed" : "Password set");
      setCurrent("");
      setNext("");
      setConfirm("");
      onDone();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not change your password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 className="text-h3">{hasPassword ? "Change password" : "Set a password"}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Your new password must differ from your current and previous passwords.</p>
      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        {hasPassword ? (
          <SmartField id="current-password" label="Current password" password value={current} onValueChange={setCurrent} error={errors["current"]} icon={<KeyRound />} autoComplete="current-password" disabled={busy} />
        ) : null}
        <SmartField id="new-password" label="New password" password value={next} onValueChange={setNext} error={errors["next"]} icon={<KeyRound />} autoComplete="new-password" hint="At least 8 characters, including a letter and a number." disabled={busy} />
        <SmartField id="confirm-password" label="Confirm new password" password value={confirm} onValueChange={setConfirm} error={errors["confirm"]} icon={<KeyRound />} autoComplete="new-password" disabled={busy} />
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        <Button type="submit" disabled={!dirty || busy} className="h-11 rounded-sm px-6">
          {busy ? "Saving…" : hasPassword ? "Change password" : "Set password"}
        </Button>
      </form>
    </section>
  );
}

function PasskeySection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const getOptions = useServerFn(passkeyRegisterOptions);
  const verify = useServerFn(passkeyRegisterVerify);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const { data: keys } = useQuery({
    queryKey: ["passkeys", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase.from("passkey_credentials").select("id, device_name, created_at, last_used_at").order("created_at");
      return data ?? [];
    },
  });

  async function add() {
    setBusy(true);
    try {
      const { startRegistration } = await import("@simplewebauthn/browser");
      const { challengeId, optionsJson } = await getOptions();
      const response = await startRegistration({ optionsJSON: JSON.parse(optionsJson) });
      const ua = navigator.userAgent;
      const deviceName = /iPhone|iPad/.test(ua) ? "iPhone / iPad" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows PC" : "Passkey";
      await verify({ data: { challengeId, response: response as never, deviceName } });
      toast.success("Passkey added");
      await queryClient.invalidateQueries({ queryKey: ["passkeys"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(/NotAllowed|abort|cancel/i.test(msg) ? "Passkey setup was cancelled." : msg || "Could not add a passkey.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!removing) return;
    setRemoveBusy(true);
    await supabase.from("passkey_credentials").delete().eq("id", removing.id);
    setRemoveBusy(false);
    setRemoving(null);
    toast.success("Passkey removed");
    await queryClient.invalidateQueries({ queryKey: ["passkeys"] });
  }

  return (
    <section>
      <h2 className="text-h3">Passkeys</h2>
      <p className="mt-2 text-sm text-muted-foreground">Sign in with your fingerprint, face or device PIN — no password needed.</p>
      <ul className="mt-6 divide-y divide-border rounded-md border border-border">
        {(keys ?? []).map((k) => (
          <li key={k.id} className="flex items-center gap-4 px-4 py-3">
            <Fingerprint className="size-5 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{k.device_name}</p>
              <p className="font-mono text-xs text-muted-foreground">
                Added {new Date(k.created_at).toLocaleDateString("en-GB")}
                {k.last_used_at ? ` · last used ${new Date(k.last_used_at).toLocaleDateString("en-GB")}` : ""}
              </p>
            </div>
            <Button variant="ghost" size="icon" aria-label={`Remove ${k.device_name}`} onClick={() => setRemoving({ id: k.id, name: k.device_name })}>
              <Trash2 />
            </Button>
          </li>
        ))}
        {!keys?.length ? <li className="px-4 py-4 text-sm text-muted-foreground">No passkeys yet.</li> : null}
      </ul>
      <Button type="button" variant="outline" className="mt-4 rounded-sm bg-transparent" onClick={add} disabled={busy}>
        <Fingerprint /> {busy ? "Waiting for your device…" : "Add a passkey"}
      </Button>
      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={() => void remove()}
        title="Remove this passkey?"
        description={`You won't be able to sign in with "${removing?.name ?? ""}" anymore.`}
        confirmLabel="Remove passkey"
        destructive
        busy={removeBusy}
      />
    </section>
  );
}
