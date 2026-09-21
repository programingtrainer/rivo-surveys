import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";

const siteUrl = SITE_URL;
const pageUrl = `${siteUrl}/rewards-policy`;

export const metadata: Metadata = {
  title: "Survey & Rewards Policy",
  description:
    "Learn about survey availability, eligibility, quality controls, reward amounts, reward reversals, wallet balances, and prohibited reward activity.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    type: "website",
    url: pageUrl,
    siteName: "Rivo Surveys",
    title: "Survey & Rewards Policy",
    description:
      "Learn about survey availability, eligibility, quality controls, reward amounts, reward reversals, wallet balances, and prohibited reward activity.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Survey & Rewards Policy",
    description:
      "Learn about survey availability, eligibility, quality controls, reward amounts, reward reversals, wallet balances, and prohibited reward activity.",
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
