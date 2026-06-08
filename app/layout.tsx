import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeVault – AI Trading Journal",
  description:
    "Track, analyze, and improve your trades with AI-powered insights. Free trading journal for stocks, forex, and crypto traders.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "TradeVault – AI Trading Journal",
    description:
      "Track, analyze, and improve your trades with AI-powered insights.",
    url: "https://tradingjournal-beryl-zeta.vercel.app",
    siteName: "TradeVault",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TradeVault – AI Trading Journal",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeVault – AI Trading Journal",
    description:
      "Track, analyze, and improve your trades with AI-powered insights.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}