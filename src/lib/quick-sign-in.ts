export const PASSKEY_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

export function shouldOfferPasskey(input: {
  freshSignIn: boolean;
  supported: boolean;
  keyCount: number;
  dismissedAt: number;
  now: number;
}) {
  return input.freshSignIn && input.supported && input.keyCount === 0 &&
    (input.dismissedAt === 0 || input.now - input.dismissedAt >= PASSKEY_SNOOZE_MS);
}

/** Google receives the hash; Supabase verifies the original nonce against it. */
export async function googleNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return { raw, hashed: Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("") };
}