import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";

const siteUrl = SITE_URL;
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
