export type RecoveryResult = { status: "not_found" | "sent" };

/** Only existing accounts may receive a recovery code. Failures must not look like success. */
export async function requestRecoveryCode(
  email: string,
  lookupAccount: (email: string) => Promise<boolean>,
  sendCode: (email: string) => Promise<void>,
): Promise<RecoveryResult> {
  const normalized = email.trim().toLowerCase();
  if (!(await lookupAccount(normalized))) return { status: "not_found" };
  await sendCode(normalized);
  return { status: "sent" };
}