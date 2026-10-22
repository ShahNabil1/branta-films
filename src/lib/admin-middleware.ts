import { createMiddleware } from "@tanstack/react-start";
import { requireAccountAccess } from "./security-middleware";

/** Verifies the caller is an administrator before any privileged work. */
export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireAccountAccess])
  .server(async ({ next, context }) => {
    const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error || !data) throw new Error("Administrator access required.");
    return next();
  });
