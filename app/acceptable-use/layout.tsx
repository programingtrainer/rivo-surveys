import type { Metadata } from "next";

const siteUrl = "https://rivo-surveys.programingtrainer2.workers.dev";
const pageUrl = `${siteUrl}/acceptable-use`;

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description:
    "Review the rules for responsible use of Rivo Surveys, including survey integrity, account security, automation, fraud prevention, and prohibited activity.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    type: "website",
    url: pageUrl,
    siteName: "Rivo Surveys",
    title: "Acceptable Use Policy",
    description:
      "Review the rules for responsible use of Rivo Surveys, including survey integrity, account security, automation, fraud prevention, and prohibited activity.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Acceptable Use Policy",
    description:
      "Review the rules for responsible use of Rivo Surveys, including survey integrity, account security, automation, fraud prevention, and prohibited activity.",
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
