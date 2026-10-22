import { useRef, useState } from "react";
import type { TurnstileHandle } from "./Turnstile";
import { isCaptchaRequired } from "@/lib/captcha";

export function useCaptcha() {
  const [captcha, setCaptcha] = useState<string | null>(null);
  // Turnstile is enabled in Supabase, so the widget is always shown and its token sent.
  const [required] = useState(true);
  const captchaRef = useRef<TurnstileHandle>(null);
  function checkError(error: unknown) {
    return isCaptchaRequired(error);
  }
  return { captcha, setCaptcha, required, captchaRef, checkError };
}