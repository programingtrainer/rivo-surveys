import { SITE_URL } from "@/lib/config";
export default function StructuredData() {
  const siteUrl = SITE_URL;
  const safeJsonLd = (value: unknown) =>
    JSON.stringify(value).replace(/</g, "\\u003c");

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: "Rivo Surveys",
    description:
      "Rivo Surveys helps you complete online surveys, share your opinions, and earn rewards.",
    inLanguage: "en",
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Rivo Surveys",
    url: siteUrl,
    description:
      "Online survey rewards platform where users can complete surveys and earn Rivo Coins.",
  };

  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${siteUrl}/#application`,
    name: "Rivo Surveys",
    url: siteUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Complete paid online surveys, earn Rivo Coins, and redeem your rewards.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(websiteSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(organizationSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(webApplicationSchema),
        }}
      />
    </>
  );
}
