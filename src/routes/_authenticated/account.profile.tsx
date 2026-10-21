import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Camera, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { SmartField } from "@/components/forms/SmartField";
import { UserAvatar } from "@/components/site/UserMenu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { validateField } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/account/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Branta Films" },
      { name: "description", content: "Update your name and profile picture." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Profile — Branta Films" },
      { property: "og:description", content: "Update your name and profile picture." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function ProfilePage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState<null | "save" | "avatar">(null);

  useEffect(() => {
    if (profile) setName(profile.full_name);
  }, [profile]);

  const original = profile?.full_name ?? "";
  const dirty = name.trim() !== original.trim();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const err = validateField("fullName", name);
    setError(err);
    if (err || !dirty || !user) return;
    setBusy("save");
    const { error: dbErr } = await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", user.id);
    setBusy(null);
    if (dbErr) {
      toast.error("Could not save your name.");
      return;
    }
    toast.success("Profile saved");
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      toast.error("Use a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be 2 MB or smaller.");
      return;
    }
    setBusy("avatar");
    const ext = file.type.split("/")[1]!.replace("jpeg", "jpg");
    const path = `avatars/${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      setBusy(null);
      toast.error("Upload failed. Please try again.");
      return;
    }
    const old = profile?.avatar_url;
    await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
    if (old?.startsWith(`avatars/${user.id}/`)) await supabase.storage.from("media").remove([old]);
    setBusy(null);
    toast.success("Profile picture updated");
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  }

  return (
    <div className="max-w-xl">
      <p className="text-eyebrow text-primary">Account</p>
      <h1 className="mt-3 text-h2">Profile</h1>

      <section className="mt-10 flex items-center gap-5">
        <UserAvatar size="size-20" />
        <div>
          <Button type="button" variant="outline" className="rounded-sm bg-transparent" disabled={busy !== null} onClick={() => fileRef.current?.click()}>
            <Camera /> {busy === "avatar" ? "Uploading…" : "Change picture"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">PNG, JPG or WebP, up to 2 MB.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void uploadAvatar(f);
            }}
          />
        </div>
      </section>

      <form onSubmit={save} noValidate className="mt-10 space-y-6">
        <SmartField
          id="full-name"
          label="Full name"
          value={name}
          onValueChange={(v) => {
            setName(v);
            if (error) setError(validateField("fullName", v));
          }}
          onBlur={() => setError(validateField("fullName", name))}
          error={error}
          icon={<UserRound />}
          maxLength={100}
          autoComplete="name"
          disabled={busy === "save"}
        />
        <SmartField id="email" label="Email address" type="email" value={user?.email ?? ""} onValueChange={() => undefined} icon={<Mail />} readOnly disabled hint="Your sign-in email can't be changed here." />
        <Button type="submit" disabled={!dirty || busy !== null} className="h-11 rounded-sm px-6">
          {busy === "save" ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
