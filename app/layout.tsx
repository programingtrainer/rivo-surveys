import type { Metadata } from "next";
import "./globals.css";
import PageTransition from "./PageTransition";
import LiveRefresh from "./LiveRefresh";

export const metadata: Metadata = {
  title: "Rivo Surveys",
  description: "Complete surveys, earn rewards, and get paid.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <LiveRefresh />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
