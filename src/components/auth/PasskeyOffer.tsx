import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Fingerprint } from "lucide-react";
import { BrandedDialog } from "@/components/ui/branded-dialog";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/auth/AuthLayout";
import { useAuth } from "@/lib/auth";
import { shouldOfferPasskey } from "@/lib/quick-sign-in";
import { passkeyRegisterOptions, passkeyRegisterVerify } from "@/lib/passkey.functions";
import { supabase } from "@/integrations/supabase/client";

export function PasskeyOffer() {
  const { user, loading } = useAuth();
  const pathname = useLocation({ select: location => location.pathname });
  const getOptions = useServerFn(passkeyRegisterOptions);
  const verify = useServerFn(passkeyRegisterVerify);
  const queryClient = useQueryClient();
  const [supported, setSupported] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eligiblePage = pathname.startsWith("/account") || pathname.startsWith("/admin");
  const { data: keys } = useQuery({
    queryKey: ["passkeys", user?.id],
    enabled: Boolean(user) && !loading && eligiblePage && supported,
    queryFn: async () => {
      const { data, error } = await supabase.from("passkey_credentials")
        .select("id, device_name, created_at, last_used_at").order("created_at");
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    setSupported(window.isSecureContext && typeof PublicKeyCredential !== "undefined");
  }, []);
  useEffect(() => {
    if (!user || loading || !eligiblePage || !keys) { setOpen(false); return; }
    try {
      const fresh = sessionStorage.getItem("branta-passkey-offer") === user.id;
      const dismissedAt = Number(localStorage.getItem(`branta-passkey-dismissed:${user.id}`) || 0);
      if (shouldOfferPasskey({ freshSignIn: fresh, supported, keyCount: keys.length, dismissedAt, now: Date.now() })) {
        setError(null);
        setOpen(true);
      }
      sessionStorage.removeItem("branta-passkey-offer");
    } catch { /* Storage restrictions must never interrupt sign-in. */ }
  }, [user?.id, loading, eligiblePage, keys, supported]);

  function dismiss() {
    if (busy) return;
    if (user) {
      try { localStorage.setItem(`branta-passkey-dismissed:${user.id}`, String(Date.now())); } catch { /* Optional. */ }
    }
    setOpen(false);
  }
  async function create() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { startRegistration } = await import("@simplewebauthn/browser");
      const { challengeId, optionsJson } = await getOptions();
      const response = await startRegistration({ optionsJSON: JSON.parse(optionsJson) });
      await verify({ data: { challengeId, response: response as never, deviceName: "Passkey" } });
      await queryClient.invalidateQueries({ queryKey: ["passkeys"] });
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(/NotAllowed|abort|cancel/i.test(message)
        ? "Setup was cancelled. You can try again or choose Not now."
        : "Could not save your passkey. Try again or add it later in Sign-in & security.");
    } finally { setBusy(false); }
  }
  return (
    <BrandedDialog open={open} onClose={dismiss} title="Sign in faster with a passkey"
      description="Use your fingerprint, face or device PIN next time — no password to remember.">
      <div className="space-y-5">
        <Fingerprint className="size-10 text-primary" aria-hidden />
        <p className="text-small text-muted-foreground">Your device will ask you to confirm. You can still sign in with Google or your password.</p>
        {error ? <FormAlert>{error}</FormAlert> : null}
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={dismiss} disabled={busy}>Not now</Button>
          <Button onClick={() => void create()} disabled={busy}><Fingerprint />{busy ? "Waiting for your device…" : "Create passkey"}</Button>
        </div>
      </div>
    </BrandedDialog>
  );
}