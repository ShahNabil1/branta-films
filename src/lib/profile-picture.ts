import { mediaUrl } from "./media";

type PictureUser = {
  user_metadata?: Record<string, unknown>;
  identities?: { provider: string; identity_data?: Record<string, unknown> }[];
};

/** A saved replacement always wins over the provider's automatic picture. */
export function profilePicture(
  profile: { avatar_url: string | null } | null,
  user: PictureUser | null,
): string | null {
  if (profile?.avatar_url?.trim()) return mediaUrl(profile.avatar_url.trim());
  const google = user?.identities?.find((identity) => identity.provider === "google")?.identity_data;
  for (const candidate of [google?.avatar_url, google?.picture, user?.user_metadata?.avatar_url, user?.user_metadata?.picture]) {
    if (typeof candidate !== "string") continue;
    const url = candidate.trim();
    if (url.startsWith("https://")) return url;
  }
  return null;
}