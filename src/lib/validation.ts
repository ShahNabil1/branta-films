import { z } from "zod";

export type AuthField = "email" | "password" | "fullName" | "newPassword" | "confirmPassword" | "currentPassword";

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export const fieldSchemas = {
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .max(254, "Email must be no longer than 254 characters.")
    .regex(/^[\x21-\x7E]+$/, "Use English characters without spaces in your email.")
    .email("Enter a valid email, such as name@example.com."),
  // Never trim passwords: existing credentials must stay intact.
  password: z.string().min(1, "Enter your password."),
  newPassword: z
    .string()
    .min(PASSWORD_MIN, `Password must contain at least ${PASSWORD_MIN} characters.`)
    .max(PASSWORD_MAX, `Password must be no longer than ${PASSWORD_MAX} characters.`)
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/\d/, "Include at least one number."),
  fullName: z.string().trim().min(2, "Enter your full name.").max(100, "Name must be no longer than 100 characters."),
};

export function validateField(field: keyof typeof fieldSchemas, value: string): string | undefined {
  const result = fieldSchemas[field].safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

/** New password must be valid and must not equal the current password. */
export function validateNewPassword(newPassword: string, currentPassword?: string): string | undefined {
  const base = validateField("newPassword", newPassword);
  if (base) return base;
  if (currentPassword && newPassword === currentPassword) {
    return "New password must be different from your current password.";
  }
  return undefined;
}

export const PASSWORD_REUSED_MESSAGE = "New password must be different from your current and previous passwords.";

/** Accept only same-origin relative paths as post-login destinations. */
export function safeRedirect(target: unknown, fallback = "/"): string {
  if (typeof target !== "string") return fallback;
  if (!target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) return fallback;
  return target;
}

/** Detects the script of the most recent letter typed: Bangla or English. */
export function detectTypingLanguage(value: string): "bn" | "en" | null {
  for (let i = value.length - 1; i >= 0; i--) {
    const ch = value[i]!;
    if (/[\u0980-\u09FF]/.test(ch)) return "bn";
    if (/[A-Za-z]/.test(ch)) return "en";
  }
  return null;
}
