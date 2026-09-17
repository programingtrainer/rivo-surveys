import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";

const siteUrl = SITE_URL;
const pageUrl = `${siteUrl}/docs`;

export const metadata: Metadata = {
  title: "Rivo Surveys Documentation",
  description:
    "Learn how Rivo Surveys works, including accounts, paid surveys, rewards, wallet features, security, and platform policies.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    type: "website",
    url: pageUrl,
    siteName: "Rivo Surveys",
    title: "Rivo Surveys Documentation",
    description:
      "Learn how Rivo Surveys works, including accounts, paid surveys, rewards, wallet features, security, and platform policies.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rivo Surveys Documentation",
    description:
      "Learn how Rivo Surveys works, including accounts, paid surveys, rewards, wallet features, security, and platform policies.",
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
