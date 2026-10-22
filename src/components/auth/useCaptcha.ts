import { useRef, useState } from "react";
import type { TurnstileHandle } from "./Turnstile";
import { isCaptchaRequired } from "@/lib/captcha";

export function useCaptcha() {
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [required, setRequired] = useState(false);
  const captchaRef = useRef<TurnstileHandle>(null);
  function checkError(error: unknown) {
    const needed = isCaptchaRequired(error);
    setRequired(needed);
    return needed;
  }
  return { captcha, setCaptcha, required, captchaRef, checkError };
}