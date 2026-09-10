import type { Metadata } from "next";

const siteUrl = "https://rivo-surveys.programingtrainer2.workers.dev";
const pageUrl = `${siteUrl}/docs/getting-started`;

export const metadata: Metadata = {
  title: "Getting Started with Rivo Surveys",
  description:
    "Learn how to create your Rivo Surveys account, find available surveys, complete surveys honestly, earn rewards, and keep your account secure.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    type: "website",
    url: pageUrl,
    siteName: "Rivo Surveys",
    title: "Getting Started with Rivo Surveys",
    description:
      "Learn how to create your Rivo Surveys account, find available surveys, complete surveys honestly, earn rewards, and keep your account secure.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Getting Started with Rivo Surveys",
    description:
      "Learn how to create your Rivo Surveys account, find available surveys, complete surveys honestly, earn rewards, and keep your account secure.",
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
