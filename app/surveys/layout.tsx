import type { Metadata } from "next";

const siteUrl = "https://rivo-surveys.programingtrainer2.workers.dev";
const pageUrl = `${siteUrl}/surveys`;

export const metadata: Metadata = {
  title: "Paid Online Surveys — Earn Rivo Coins",
  description:
    "Find available paid online surveys, share your opinions, and earn Rivo Coins for eligible completed research activities.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    type: "website",
    url: pageUrl,
    siteName: "Rivo Surveys",
    title: "Paid Online Surveys — Earn Rivo Coins",
    description:
      "Find available paid online surveys, share your opinions, and earn Rivo Coins for eligible completed research activities.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paid Online Surveys — Earn Rivo Coins",
    description:
      "Find available paid online surveys, share your opinions, and earn Rivo Coins for eligible completed research activities.",
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
