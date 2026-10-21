import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PASSWORD_REUSED_MESSAGE, validateNewPassword } from "./validation";

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

async function applyNewPassword(userId: string, newPassword: string) {
  const sb = await admin();
  const { data: reused, error: reuseErr } = await sb.rpc("password_is_reused", { _user_id: userId, _password: newPassword });
  if (reuseErr) throw new Error("Could not check your password. Please try again.");
  if (reused) throw new Error(PASSWORD_REUSED_MESSAGE);
  await sb.rpc("snapshot_current_password", { _user_id: userId });
  const { error } = await sb.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) throw new Error(error.message);
}

export const getSecurityOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await admin();
    const [{ data: hasPassword }, { data: userRes }] = await Promise.all([
      sb.rpc("user_has_password", { _user_id: context.userId }),
      sb.auth.admin.getUserById(context.userId),
    ]);
    const providers = Array.from(new Set((userRes?.user?.identities ?? []).map((i) => i.provider)));
    return { hasPassword: Boolean(hasPassword), providers };
  });

/** Signed-in password change: current password required (unless none was ever set). */
export const changePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ currentPassword: z.string().max(200).optional(), newPassword: z.string().max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const invalid = validateNewPassword(data.newPassword, data.currentPassword);
    if (invalid) throw new Error(invalid);
    const sb = await admin();
    const { data: hasPassword } = await sb.rpc("user_has_password", { _user_id: context.userId });
    if (hasPassword) {
      if (!data.currentPassword) throw new Error("Enter your current password.");
      const { data: ok } = await sb.rpc("verify_current_password", {
        _user_id: context.userId,
        _password: data.currentPassword,
      });
      if (!ok) throw new Error("Your current password is incorrect.");
    }
    await applyNewPassword(context.userId, data.newPassword);
    const { logActivityAs } = await import("./request-meta.server");
    await logActivityAs(context.userId, hasPassword ? "password_changed" : "password_set");
    return { ok: true };
  });

/** Password reset after the emailed 6-digit recovery code (recovery session only, within 15 minutes). */
export const completePasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ newPassword: z.string().max(200) }).parse(input))
  .handler(async ({ data, context }) => {
    const amr = ((context.claims as { amr?: { method: string; timestamp: number }[] }).amr ?? []).find(
      (m) => m.method === "recovery" || m.method === "otp",
    );
    if (!amr || Date.now() / 1000 - amr.timestamp > 15 * 60) {
      throw new Error("This reset code has expired. Request a new one.");
    }
    const invalid = validateNewPassword(data.newPassword);
    if (invalid) throw new Error(invalid);
    await applyNewPassword(context.userId, data.newPassword);
    const { logActivityAs } = await import("./request-meta.server");
    await logActivityAs(context.userId, "password_reset");
    return { ok: true };
  });

/** Invited staff choose their first password (invite session only, account must have no password yet). */
export const completeInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ newPassword: z.string().max(200) }).parse(input))
  .handler(async ({ data, context }) => {
    const { isFreshInviteSession } = await import("./invite");
    const amr = (context.claims as { amr?: { method: string; timestamp: number }[] }).amr ?? [];
    if (!isFreshInviteSession(amr, Date.now() / 1000)) {
      throw new Error("This invite link has expired. Ask an admin to send a new one.");
    }
    const invalid = validateNewPassword(data.newPassword);
    if (invalid) throw new Error(invalid);
    const sb = await admin();
    const { data: hasPassword } = await sb.rpc("user_has_password", { _user_id: context.userId });
    if (hasPassword) throw new Error("Your password is already set. Sign in with your email and password.");
    await applyNewPassword(context.userId, data.newPassword);
    const { logActivityAs } = await import("./request-meta.server");
    await logActivityAs(context.userId, "invite_accepted");
    return { ok: true };
  });

export const recordSignIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ method: z.string().max(30) }).parse(input))
  .handler(async ({ data, context }) => {
    const { logActivityAs } = await import("./request-meta.server");
    await logActivityAs(context.userId, "sign_in", { method: data.method });
    return { ok: true };
  });
