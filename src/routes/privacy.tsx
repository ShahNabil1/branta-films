import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/content/LegalPage";

const description = "How Branta Films, a Branta Tech service, collects, uses and protects your information.";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Privacy Policy — Branta Films" },
      { name: "description", content: description },
      { property: "og:title", content: "Privacy Policy — Branta Films" },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage
      title="Privacy Policy"
      intro={description}
      updated="21 October 2026"
      sections={[
        ["Information we collect", "We collect the information you give us when you create an account or contact us — your name, email address and profile picture — and the payment details you submit to unlock a series, such as your bKash or Nagad transaction ID and mobile number. We also keep the technical information needed to operate and secure the service, including sign-in activity, device and browser details, and IP address."],
        ["Viewing activity", "We record which episodes you watch and how far you get, so you can continue where you left off. This viewing history is linked to your account and is visible only to you and to authorised Branta Tech staff who support the service."],
        ["How we use information", "We use information to provide and secure your account, deliver the videos you are entitled to, verify payments, respond to enquiries, improve our service, prevent misuse and meet legal obligations."],
        ["Sign-in methods", "If you sign in with Google, we receive your name, email address and profile picture from Google. Passkeys stay on your device; we store only the public key needed to confirm it is you. Passwords are stored as one-way encrypted values and are never visible to anyone."],
        ["Sharing and storage", "We share information only with service providers and team members who need it to operate the service, or when required by law. Videos are kept in private storage and are delivered only through short-lived secure links. We take reasonable measures to protect stored information."],
        ["Your choices", "You may ask to access, correct or delete personal information we hold about you, subject to applicable legal and operational requirements. You can update your name and profile picture at any time from your dashboard."],
      ]}
    />
  ),
});
