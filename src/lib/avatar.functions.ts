import { createServerFn } from "@tanstack/react-start";
import { requireAccountAccess } from "./security-middleware";
import { AVATAR_TYPES, MAX_AVATAR_BYTES } from "./media";

/** Stores the signed-in user's profile picture in R2 under images/avatars/<userId>/. */
export const uploadAvatar = createServerFn({ method: "POST" })
  .middleware([requireAccountAccess])
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("Choose an image to upload.");
    const file = input.get("file");
    if (!(file instanceof File)) throw new Error("Choose an image to upload.");
    if (!(file.type in AVATAR_TYPES)) throw new Error("Use a PNG, JPG or WebP image.");
    if (file.size > MAX_AVATAR_BYTES) throw new Error("Image must be 2 MB or smaller.");
    return file;
  })
  .handler(async ({ data: file, context }) => {
    const { r2PutObject, r2DeleteObject } = await import("./r2.server");
    const ext = AVATAR_TYPES[file.type as keyof typeof AVATAR_TYPES];
    const prefix = `images/avatars/${context.userId}/`;
    const key = `${prefix}${Date.now()}.${ext}`;

    const { data: before } = await context.supabase.from("profiles").select("avatar_url").eq("id", context.userId).maybeSingle();
    await r2PutObject(key, await file.arrayBuffer(), file.type);
    const { error } = await context.supabase.from("profiles").update({ avatar_url: key }).eq("id", context.userId);
    if (error) {
      await r2DeleteObject(key);
      throw new Error("Could not save your picture. Please try again.");
    }
    const old = before?.avatar_url;
    if (old?.startsWith(prefix)) await r2DeleteObject(old).catch(() => undefined);
    return { avatarUrl: key };
  });
