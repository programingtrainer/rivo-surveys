import type { Metadata, Viewport } from "next";
import "./globals.css";
import PageTransition from "./PageTransition";
import LiveRefresh from "./LiveRefresh";
import StructuredData from "./StructuredData";

const siteUrl = "https://rivo-surveys.programingtrainer2.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Rivo Surveys — Paid Surveys Online",
    template: "%s | Rivo Surveys",
  },

  description:
    "Rivo Surveys helps you earn rewards by completing online surveys. Find paid surveys, share your opinions, and earn Rivo Coins.",

  keywords: [
    "paid surveys",
    "paid surveys online",
    "online surveys",
    "surveys for money",
    "earn money from surveys",
    "survey rewards",
    "make money online",
    "Rivo Surveys",
  ],

  applicationName: "Rivo Surveys",

  authors: [
    {
      name: "Rivo Surveys",
      url: siteUrl,
    },
  ],

  creator: "Rivo Surveys",
  publisher: "Rivo Surveys",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Rivo Surveys",
    title: "Rivo Surveys — Paid Surveys Online",
    description:
      "Complete online surveys, share your opinions, and earn rewards with Rivo Surveys.",
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Rivo Surveys — Paid Surveys Online",
    description:
      "Complete online surveys, share your opinions, and earn rewards with Rivo Surveys.",
  },

  category: "business",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <StructuredData />
        <LiveRefresh />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
