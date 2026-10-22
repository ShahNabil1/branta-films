import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAccountAccess } from "./security-middleware";

const RP_NAME = "Branta Films";

async function rpFromRequest() {
  const { requestMeta } = await import("./request-meta.server");
  const origin = requestMeta().origin;
  if (!origin) throw new Error("Unable to determine the site address.");
  return { origin, rpID: new URL(origin).hostname };
}

export const passkeyRegisterOptions = createServerFn({ method: "POST" })
  .middleware([requireAccountAccess])
  .handler(async ({ context }) => {
    const { generateRegistrationOptions } = await import("@simplewebauthn/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { rpID } = await rpFromRequest();
    const email = (context.claims as { email?: string }).email ?? "member";

    const { data: existing } = await supabaseAdmin
      .from("passkey_credentials")
      .select("credential_id, transports")
      .eq("user_id", context.userId);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userName: email,
      userDisplayName: email,
      userID: new TextEncoder().encode(context.userId),
      attestationType: "none",
      excludeCredentials: (existing ?? []).map((c) => ({
        id: c.credential_id,
        transports: c.transports as AuthenticatorTransport[] as never,
      })),
      authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
    });

    const { data: row, error } = await supabaseAdmin
      .from("webauthn_challenges")
      .insert({ challenge: options.challenge, user_id: context.userId, kind: "register" })
      .select("id")
      .single();
    if (error) throw new Error("Could not start passkey setup.");
    return { challengeId: row.id, optionsJson: JSON.stringify(options) };
  });

export const passkeyRegisterVerify = createServerFn({ method: "POST" })
  .middleware([requireAccountAccess])
  .inputValidator((input: unknown) =>
    z
      .object({
        challengeId: z.string().uuid(),
        response: z.record(z.unknown()),
        deviceName: z.string().trim().min(1).max(60).default("Passkey"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
    const { isoBase64URL } = await import("@simplewebauthn/server/helpers");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { origin, rpID } = await rpFromRequest();

    const { data: challenge } = await supabaseAdmin
      .from("webauthn_challenges")
      .delete()
      .eq("id", data.challengeId)
      .eq("user_id", context.userId)
      .eq("kind", "register")
      .gt("expires_at", new Date().toISOString())
      .select("challenge")
      .maybeSingle();
    if (!challenge) throw new Error("Passkey setup expired. Please try again.");

    const verification = await verifyRegistrationResponse({
      response: data.response as never,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });
    if (!verification.verified || !verification.registrationInfo) throw new Error("Passkey could not be verified.");

    const cred = verification.registrationInfo.credential;
    const { error } = await supabaseAdmin.from("passkey_credentials").insert({
      user_id: context.userId,
      credential_id: cred.id,
      public_key: isoBase64URL.fromBuffer(cred.publicKey),
      counter: cred.counter,
      transports: cred.transports ?? [],
      device_name: data.deviceName,
    });
    if (error) throw new Error("This passkey is already registered.");
    return { ok: true };
  });

export const passkeyLoginOptions = createServerFn({ method: "POST" }).handler(async () => {
  const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { rpID } = await rpFromRequest();
  await supabaseAdmin.from("webauthn_challenges").delete().lt("expires_at", new Date().toISOString());
  const options = await generateAuthenticationOptions({ rpID, userVerification: "preferred", allowCredentials: [] });
  const { data: row, error } = await supabaseAdmin
    .from("webauthn_challenges")
    .insert({ challenge: options.challenge, kind: "login" })
    .select("id")
    .single();
  if (error) throw new Error("Could not start passkey sign-in.");
  return { challengeId: row.id, optionsJson: JSON.stringify(options) };
});

/** Verifies a passkey assertion and returns a one-time token the browser exchanges for a session. */
export const passkeyLoginVerify = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ challengeId: z.string().uuid(), response: z.record(z.unknown()) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { verifyAuthenticationResponse } = await import("@simplewebauthn/server");
    const { isoBase64URL } = await import("@simplewebauthn/server/helpers");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { origin, rpID } = await rpFromRequest();
    const fail = () => {
      throw new Error("Passkey sign-in failed. Try again or use another method.");
    };

    const { data: challenge } = await supabaseAdmin
      .from("webauthn_challenges")
      .delete()
      .eq("id", data.challengeId)
      .eq("kind", "login")
      .gt("expires_at", new Date().toISOString())
      .select("challenge")
      .maybeSingle();
    if (!challenge) return fail();

    const credentialId = typeof data.response["id"] === "string" ? (data.response["id"] as string) : "";
    const { data: cred } = await supabaseAdmin
      .from("passkey_credentials")
      .select("id, user_id, credential_id, public_key, counter, transports")
      .eq("credential_id", credentialId)
      .maybeSingle();
    if (!cred) return fail();

    const verification = await verifyAuthenticationResponse({
      response: data.response as never,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: cred.credential_id,
        publicKey: isoBase64URL.toBuffer(cred.public_key),
        counter: Number(cred.counter),
        transports: cred.transports as never,
      },
      requireUserVerification: false,
    });
    if (!verification.verified) fail();

    await supabaseAdmin
      .from("passkey_credentials")
      .update({ counter: verification.authenticationInfo.newCounter, last_used_at: new Date().toISOString() })
      .eq("id", cred.id);

    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(cred.user_id);
    const { ensureAccountAccess } = await import("./security.server");
    await ensureAccountAccess(cred.user_id, {});
    const email = userRes?.user?.email;
    if (!email) return fail();
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email: email });
    if (error || !link?.properties?.hashed_token) return fail();

    return { tokenHash: link.properties.hashed_token as string };
  });
