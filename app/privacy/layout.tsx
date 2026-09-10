import type { Metadata } from "next";

const siteUrl = "https://rivo-surveys.programingtrainer2.workers.dev";
const pageUrl = `${siteUrl}/privacy`;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Rivo Surveys may collect, use, protect, retain, and disclose information when you use the platform and its services.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    type: "website",
    url: pageUrl,
    siteName: "Rivo Surveys",
    title: "Privacy Policy",
    description:
      "Learn how Rivo Surveys may collect, use, protect, retain, and disclose information when you use the platform and its services.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy",
    description:
      "Learn how Rivo Surveys may collect, use, protect, retain, and disclose information when you use the platform and its services.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
