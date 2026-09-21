import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";

const siteUrl = SITE_URL;
const pageUrl = `${siteUrl}/terms`;

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the Rivo Surveys Terms of Service covering accounts, surveys, rewards, prohibited conduct, third-party services, and use of the platform.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    type: "website",
    url: pageUrl,
    siteName: "Rivo Surveys",
    title: "Terms of Service",
    description:
      "Read the Rivo Surveys Terms of Service covering accounts, surveys, rewards, prohibited conduct, third-party services, and use of the platform.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service",
    description:
      "Read the Rivo Surveys Terms of Service covering accounts, surveys, rewards, prohibited conduct, third-party services, and use of the platform.",
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
