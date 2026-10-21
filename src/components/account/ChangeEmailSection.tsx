import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { FormAlert } from "@/components/auth/AuthLayout";
import { SmartField } from "@/components/forms/SmartField";
import { Button } from "@/components/ui/button";
import { CodeField } from "@/components/forms/CodeField";
import { Panel } from "@/components/dashboard/DashboardKit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { validateField } from "@/lib/validation";

/**
 * Email change with 6-digit codes. "Secure email change" is on in Supabase,
 * so one code goes to the current address and one to the new address.
 */
export function ChangeEmailSection() {
  const { user } = useAuth();
  const current = user?.email ?? "";
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [pending, setPending] = useState<string | null>(null);
  const [oldCode, setOldCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function request(e?: React.FormEvent) {
    e?.preventDefault();
    const target = (pending ?? newEmail).trim();
    const err =
      validateField("email", target) ??
      (target.toLowerCase() === current.toLowerCase() ? "That's already your email." : undefined);
    setEmailError(err);
    if (err || busy) return;
    setBusy(true);
    setFormError(null);
    const { error } = await supabase.auth.updateUser({ email: target });
    setBusy(false);
    if (error) {
      setFormError(
        /rate|seconds/i.test(error.message)
          ? "Please wait a minute before requesting new codes."
          : /already|registered|exists/i.test(error.message)
            ? "Another account already uses that email."
            : error.message,
      );
      return;
    }
    setOldCode("");
    setNewCode("");
    setPending(target);
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!pending || busy) return;
    if (oldCode.length !== 6 || newCode.length !== 6) {
      setFormError("Enter both 6-digit codes.");
      return;
    }
    setBusy(true);
    setFormError(null);
    const first = await supabase.auth.verifyOtp({
      email: current,
      token: oldCode,
      type: "email_change",
    });
    if (first.error) {
      setBusy(false);
      setFormError(`The code sent to ${current} is incorrect or has expired.`);
      return;
    }
    const second = await supabase.auth.verifyOtp({
      email: pending,
      token: newCode,
      type: "email_change",
    });
    if (second.error) {
      setBusy(false);
      setFormError(`The code sent to ${pending} is incorrect or has expired.`);
      return;
    }
    await supabase.auth.refreshSession();
    setBusy(false);
    setPending(null);
    setNewEmail("");
    toast.success("Email address updated");
  }

  return (
    <Panel
      title="Email address"
      description={
        <>
          You sign in with <span className="font-medium text-foreground">{current}</span>. We'll send a 6-digit code
          to your current and your new address.
        </>
      }
      delay={180}
    >

      {!pending ? (
        <form onSubmit={request} noValidate className="max-w-xl space-y-5">
          <SmartField
            id="new-email"
            label="New email address"
            type="email"
            value={newEmail}
            onValueChange={(v) => {
              setNewEmail(v);
              setFormError(null);
              if (emailError) setEmailError(validateField("email", v));
            }}
            onBlur={() => newEmail && setEmailError(validateField("email", newEmail))}
            error={emailError}
            icon={<Mail />}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="new@example.com"
            maxLength={254}
            disabled={busy}
          />
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <Button
            type="submit"
            disabled={busy || !newEmail.trim()}
          >
            {busy ? "Sending codes…" : "Send codes"}
          </Button>
        </form>
      ) : (
        <form onSubmit={confirm} noValidate className="max-w-xl space-y-6">
          <FormAlert tone="success">
            We emailed a 6-digit code to {current} and another to {pending}. Both expire in 10
            minutes.
          </FormAlert>
          <CodeField
            label={`Code sent to ${current}`}
            value={oldCode}
            onChange={setOldCode}
            disabled={busy}
          />
          <CodeField
            label={`Code sent to ${pending}`}
            value={newCode}
            onChange={setNewCode}
            disabled={busy}
          />
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <div className="flex flex-wrap items-center gap-4">
            <Button
              type="submit"
              disabled={busy || oldCode.length !== 6 || newCode.length !== 6}
              >
              {busy ? "Checking…" : "Confirm new email"}
            </Button>
            <button
              type="button"
              onClick={() => void request()}
              disabled={busy}
              className="text-small text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-primary"
            >
              Send new codes
            </button>
            <button
              type="button"
              onClick={() => {
                setPending(null);
                setFormError(null);
              }}
              disabled={busy}
              className="text-small text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-primary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Panel>
  );
}
