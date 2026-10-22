import { createServerFn, createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { requireAccountAccess } from "./security-middleware";
import { assertOtherAccount } from "./admin-rules";
import { sanitizeRichText } from "./rich-text";

const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireAccountAccess])
  .server(async ({ next, context }) => {
    const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error || !data) throw new Error("Administrator access required.");
    return next();
  });

const id = z.string().uuid();
const seriesSchema = z.object({
  id: id.optional(), title: z.string().trim().min(1).max(200), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  tagline: z.string().max(500), description_html: z.string().max(100000), genres: z.array(z.string().trim().min(1).max(50)).max(20),
  release_year: z.number().int().min(1900).max(2200).nullable(), maturity_rating: z.string().min(1).max(20),
  price_bdt: z.number().int().min(0), discount_price_bdt: z.number().int().min(0).nullable(), sort_order: z.number().int(), is_featured: z.boolean(), is_published: z.boolean(),
  poster_url: z.string().startsWith("images/series/").nullable(), backdrop_url: z.string().startsWith("images/series/").nullable(),
});
const seriesWithRules = seriesSchema.refine((s) => s.discount_price_bdt == null || s.discount_price_bdt < s.price_bdt, { message: "Discounted price must be lower than the regular price.", path: ["discount_price_bdt"] });
const episodeSchema = z.object({
  id: id.optional(), series_id: id, title: z.string().trim().min(1).max(200), episode_number: z.number().int().min(1),
  synopsis_html: z.string().max(100000), duration_seconds: z.number().int().min(0), is_free: z.boolean(), is_published: z.boolean(),
  thumbnail_url: z.string().startsWith("images/episodes/").nullable(),
});

/** Admin-only previews include drafts; never return the permanent R2 key. */
export const getAdminEpisodeMedia = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ episodeId: id }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: episode, error: episodeError } = await context.supabase.from("episodes")
      .select("id, thumbnail_url").eq("id", data.episodeId).single();
    if (episodeError || !episode) throw new Error("Episode not found.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: media, error } = await supabaseAdmin.from("episode_media")
      .select("video_key, content_type, size_bytes").eq("episode_id", episode.id).maybeSingle();
    if (error) throw new Error("Could not read saved video.");
    const base = { thumbnail: episode.thumbnail_url, sizeBytes: media?.size_bytes ?? null, contentType: media?.content_type ?? null };
    if (!media) return { ...base, status: "empty" as const, source: null };
    const { r2ObjectExists, presignR2Get } = await import("./r2.server");
    const { PLAYBACK_LINK_TTL_SECONDS } = await import("./access");
    if (!(await r2ObjectExists(media.video_key))) return { ...base, status: "missing" as const, source: null };
    return { ...base, status: "ready" as const, source: { url: await presignR2Get(media.video_key, PLAYBACK_LINK_TTL_SECONDS), expiresAt: Date.now() + PLAYBACK_LINK_TTL_SECONDS * 1000 } };
  });

export const getAdminOverview = createServerFn({ method: "POST" }).middleware([requireAdmin]).handler(async ({ context }) => {
  const sb = context.supabase;
  // Paginate mutable collections rather than silently losing rows at Supabase's 1000-row limit.
  async function all<T>(read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
    const rows: T[] = [];
    for (let from = 0; ; from += 500) {
      const { data, error } = await read(from, from + 499);
      if (error) throw new Error(error.message);
      rows.push(...(data ?? []));
      if ((data?.length ?? 0) < 500) return rows;
    }
  }
  const [series, episodes, users, roles, unlocks, activity] = await Promise.all([
    all((a, b) => sb.from("series").select("*").order("sort_order").order("created_at").order("id").range(a, b)),
    all((a, b) => sb.from("episodes").select("*").order("series_id").order("episode_number").range(a, b)),
    all((a, b) => sb.from("profiles").select("*").order("created_at").order("id").range(a, b)),
    all((a, b) => sb.from("user_roles").select("*").order("id").range(a, b)),
    all((a, b) => sb.from("series_unlocks").select("*").order("id").range(a, b)),
    sb.from("activity_log").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  if (activity.error) throw new Error(activity.error.message);
  return { series, episodes, users, roles, unlocks, activity: activity.data ?? [] };
});

export const saveAdminSeries = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => seriesWithRules.parse(input)).handler(async ({ data, context }) => {
    const { id: rowId, ...values } = data;
    values.description_html = sanitizeRichText(values.description_html);
    const query = rowId ? context.supabase.from("series").update(values).eq("id", rowId) : context.supabase.from("series").insert(values);
    const { data: row, error } = await query.select("id").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const saveAdminEpisode = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => episodeSchema.parse(input)).handler(async ({ data, context }) => {
    const { id: rowId, ...values } = data;
    values.synopsis_html = sanitizeRichText(values.synopsis_html);
    const query = rowId ? context.supabase.from("episodes").update(values).eq("id", rowId) : context.supabase.from("episodes").insert(values);
    const { data: row, error } = await query.select("id").single();
    if (error) throw new Error(error.message);
    return row;
  });

/** Renumbers a series' episodes in the given order (1..n). Two passes avoid the unique (series, number) clash. */
export const reorderAdminEpisodes = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ series_id: id, ids: z.array(id).min(1).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    for (const [pass, sign] of [[0, -1], [1, 1]] as const) {
      void pass;
      for (const [i, episodeId] of data.ids.entries()) {
        const { error } = await context.supabase.from("episodes").update({ episode_number: sign * (i + 1) }).eq("id", episodeId).eq("series_id", data.series_id);
        if (error) throw new Error(error.message);
      }
    }
    return { ok: true };
  });

export const deleteAdminContent = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ id, kind: z.enum(["series", "episodes"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from(data.kind).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveAdminUser = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ id, full_name: z.string().trim().min(1).max(100), role: z.enum(["viewer", "manager", "admin"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: existing, error: roleError } = await context.supabase.from("user_roles").select("role").eq("user_id", data.id);
    if (roleError) throw new Error(roleError.message);
    const currentRole = existing?.some((r) => r.role === "admin") ? "admin" : existing?.some((r) => r.role === "manager") ? "manager" : "viewer";
    if (currentRole !== data.role) assertOtherAccount(context.userId, data.id);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { error } = await sb.from("profiles").update({ full_name: data.full_name }).eq("id", data.id);
    if (error) throw new Error(error.message);
    if (currentRole !== data.role) {
      // Add the replacement before removing the old role, so a failed write cannot remove all access.
      if (data.role !== "viewer") {
        const { error: addError } = await sb.from("user_roles").upsert({ user_id: data.id, role: data.role }, { onConflict: "user_id,role" });
        if (addError) throw new Error(addError.message);
      }
      const remove = sb.from("user_roles").delete().eq("user_id", data.id);
      const { error: removeError } = await (data.role === "viewer" ? remove : remove.neq("role", data.role));
      if (removeError) throw new Error(removeError.message);
    }
    const { logActivityAs } = await import("./request-meta.server");
    await logActivityAs(data.id, "admin_account_updated", { role: data.role }, context.userId);
    return { ok: true };
  });

export const deleteAdminUser = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ id }).parse(input)).handler(async ({ data, context }) => {
    assertOtherAccount(context.userId, data.id);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { logActivityAs } = await import("./request-meta.server");
    await logActivityAs(data.id, "admin_account_deletion_requested", {}, context.userId);
    const { error } = await sb.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const inviteAdminStaff = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ email: z.string().trim().email().max(254), full_name: z.string().trim().min(1).max(100), role: z.enum(["manager", "admin"]) }).parse(input))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const origin = new URL(getRequest().url).origin;
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { data: invited, error } = await sb.auth.admin.inviteUserByEmail(data.email, { redirectTo: `${origin}/set-password`, data: { full_name: data.full_name } });
    if (error || !invited.user) throw new Error(error?.message ?? "Could not invite this account.");
    const { error: roleError } = await sb.from("user_roles").upsert({ user_id: invited.user.id, role: data.role }, { onConflict: "user_id,role" });
    if (roleError) throw new Error("Invite sent, but role assignment failed. Set the role from Users before they sign in.");
    return { ok: true };
  });

export const manageAdminUnlock = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ user_id: id, series_id: id, revoke: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    if (data.revoke) {
      const { error } = await sb.from("series_unlocks").delete().eq("user_id", data.user_id).eq("series_id", data.series_id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb.from("series_unlocks").upsert({ user_id: data.user_id, series_id: data.series_id, source: "admin", granted_by: context.userId }, { onConflict: "user_id,series_id" });
      if (error) throw new Error(error.message);
    }
    const { logActivityAs } = await import("./request-meta.server");
    await logActivityAs(data.user_id, data.revoke ? "admin_series_revoked" : "admin_series_activated", { series_id: data.series_id }, context.userId);
    return { ok: true };
  });

export const uploadAdminImage = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ kind: z.enum(["series", "episodes"]), id, slot: z.enum(["poster", "backdrop", "thumbnail"]), contentType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64: z.string().max(14000000) }).parse(input))
  .handler(async ({ data }) => {
    const { r2PutObject } = await import("./r2.server");
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[data.contentType];
    const key = `images/${data.kind}/${data.id}/${data.slot}-${crypto.randomUUID()}.${ext}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    await r2PutObject(key, bytes.buffer, data.contentType);
    return { key };
  });

export const prepareAdminVideo = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ episodeId: id }).parse(input)).handler(async ({ data, context }) => {
    const { data: episode, error } = await context.supabase.from("episodes").select("id").eq("id", data.episodeId).single();
    if (error || !episode) throw new Error("Save the episode before uploading a video.");
    const key = `videos/episodes/${episode.id}/${crypto.randomUUID()}.mp4`;
    const { presignR2Put } = await import("./r2.server");
    return { key, url: await presignR2Put(key, 3600) };
  });

export const finishAdminVideo = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ episodeId: id, key: z.string(), size: z.number().int().positive() }).parse(input))
  .handler(async ({ data }) => {
    if (!new RegExp(`^videos/episodes/${data.episodeId}/[a-f0-9-]+\\.mp4$`).test(data.key)) throw new Error("Invalid upload.");
    const { r2ObjectExists } = await import("./r2.server");
    if (!(await r2ObjectExists(data.key))) throw new Error("Video upload has not completed.");
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { error } = await sb.from("episode_media").upsert({ episode_id: data.episodeId, video_key: data.key, size_bytes: data.size, content_type: "video/mp4" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
/** Saves the series display order: position i gets sort_order i * 10. */
export const reorderAdminSeries = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ ids: z.array(id).min(1).max(1000) }).parse(input))
  .handler(async ({ data, context }) => {
    for (const [i, seriesId] of data.ids.entries()) {
      const { error } = await context.supabase.from("series").update({ sort_order: i * 10 }).eq("id", seriesId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
