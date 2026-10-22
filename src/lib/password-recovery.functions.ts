import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Public recovery action: deliberately returns only existence, never account details. */
export const sendPasswordRecoveryCode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ email: z.string().trim().email().max(254), captchaToken: z.string().min(1).max(4096).optional() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requestRecoveryCode } = await import("./password-recovery");
    return requestRecoveryCode(
      data.email,
      async (email) => {
        // Escape ILIKE wildcards so only the exact, case-insensitive email can match.
        const pattern = email.replace(/[\\%_]/g, "\\$&");
        const { data: profile, error } = await supabaseAdmin
          .from("profiles").select("id").ilike("email", pattern).maybeSingle();
        if (error) throw new Error("Could not check your account. Please try again.");
        if (!profile) return false;
        const { data: account, error: accountError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        if (accountError) throw new Error("Could not check your account. Please try again.");
        return account.user?.email?.toLowerCase() === email;
      },
      async (email) => {
        // Publishable client so Supabase Attack Protection verifies the Turnstile token
        // (service-role requests skip the captcha check).
        const { createClient } = await import("@supabase/supabase-js");
        const key = (process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"])!;
        const publicClient = createClient((process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"])!, key, {
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
          global: { fetch: (input, init) => {
            const h = new Headers(init?.headers);
            if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
            h.set("apikey", key);
            return fetch(input, { ...init, headers: h });
          } },
        });
        const { error } = await publicClient.auth.resetPasswordForEmail(email, data.captchaToken ? { captchaToken: data.captchaToken } : {});
        if (error && /captcha/i.test(error.message)) throw new Error("The security check failed. Please try it again.");
        if (!error) return;
        if (error.status === 429 || /rate|seconds/i.test(error.message)) {
          throw new Error("Please wait a minute before requesting another code.");
        }
        throw new Error("Could not send your reset code. Please try again.");
      },
    );
  });