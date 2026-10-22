import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { googleNonce } from "@/lib/quick-sign-in";

type GoogleIdentity = {
  initialize: (options: {
    client_id: string;
    nonce: string;
    use_fedcm_for_prompt: boolean;
    auto_select: boolean;
    callback: (response: { credential: string }) => void;
  }) => void;
  prompt: () => void;
  cancel: () => void;
};

function identity() {
  return (window as Window & { google?: { accounts?: { id?: GoogleIdentity } } }).google?.accounts?.id;
}

/** Optional enhancement: the existing OAuth button remains available everywhere. */
export function GoogleOneTap({ enabled, onError }: { enabled: boolean; onError: (message: string) => void }) {
  useEffect(() => {
    const clientId = import.meta.env['VITE_GOOGLE_CLIENT_ID'] as string | undefined;
    if (!enabled || !clientId || window.self !== window.top) return;
    let cancelled = false;
    let exchanging = false;
    const scriptId = "branta-google-identity";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    const start = async () => {
      const api = identity();
      if (!api) return;
      const nonce = await googleNonce();
      if (cancelled) return;
      api.initialize({
        client_id: clientId,
        nonce: nonce.hashed,
        use_fedcm_for_prompt: true,
        auto_select: false,
        callback: response => {
          if (cancelled || exchanging) return;
          exchanging = true;
          void supabase.auth.signInWithIdToken({ provider: "google", token: response.credential, nonce: nonce.raw })
            .then(({ error }) => {
              if (!cancelled && error) onError("Google sign-in didn't complete. Please use Continue with Google or try again.");
            })
            .catch(() => {
              if (!cancelled) onError("Google sign-in didn't complete. Please try again.");
            })
            .finally(() => { exchanging = false; });
        },
      });
      api.prompt();
    };
    const loaded = () => { void start().catch(() => { /* OAuth remains available. */ }); };
    if (identity()) loaded();
    else {
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.head.append(script);
      }
      script.addEventListener("load", loaded);
    }
    return () => {
      cancelled = true;
      script?.removeEventListener("load", loaded);
      identity()?.cancel();
    };
  }, [enabled, onError]);
  return null;
}