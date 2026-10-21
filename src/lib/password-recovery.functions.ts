import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Public recovery action: deliberately returns only existence, never account details. */
export const sendPasswordRecoveryCode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ email: z.string().trim().email().max(254) }).parse(input))
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
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email);
        if (!error) return;
        if (error.status === 429 || /rate|seconds/i.test(error.message)) {
          throw new Error("Please wait a minute before requesting another code.");
        }
        throw new Error("Could not send your reset code. Please try again.");
      },
    );
  });