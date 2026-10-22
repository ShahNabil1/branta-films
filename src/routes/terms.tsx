import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/content/LegalPage";

const description = "The terms that apply when you use Branta Films, the AI-generated web-series streaming service by Branta Tech.";

export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Terms of Service — Branta Films" },
      { name: "description", content: description },
      { property: "og:title", content: "Terms of Service — Branta Films" },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://films.brantatech.com/terms" },
    ],
    links: [{ rel: "canonical", href: "https://films.brantatech.com/terms" }],
  }),
  component: () => (
    <LegalPage
      title="Terms of Service"
      intro={description}
      updated="21 October 2026"
      sections={[
        ["Using Branta Films", "You may use Branta Films for lawful, personal viewing. You must not interfere with its operation, security or availability, or attempt to access content you have not unlocked."],
        ["Your account", "You are responsible for keeping your sign-in details safe and for activity under your account. Accounts are personal and must not be shared or resold."],
        ["Free and paid content", "Some episodes are free for signed-in members. Other episodes require unlocking the full series. Prices are shown in Bangladeshi Taka on each series page before you pay."],
        ["Payments and unlocking", "Payments made through bKash or Nagad are verified by our team. A series unlocks once your transaction ID is confirmed. Each transaction ID can be used only once. If a payment cannot be verified, the series stays locked and we will contact you."],
        ["Intellectual property", "The Branta Tech and Branta Films names, website design and all series, episodes and artwork are protected by applicable intellectual-property laws. Recording, downloading, copying, redistributing or publicly screening any content is not allowed."],
        ["Third-party services", "The service relies on third-party providers, including Google sign-in and mobile payment services. Their availability and practices are governed by their own terms."],
        ["Changes", "We may update these terms when the service changes. The latest version will appear on this page with its update date."],
      ]}
    />
  ),
});
