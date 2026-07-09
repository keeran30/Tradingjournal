import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://tradevault.pro"),
  title: "TradeVault — AI Trading Journal & Analytics",
  description: "Track, analyze, and improve your trades with AI-powered insights. Free trading journal for stocks, forex, and crypto traders.",
  openGraph: {
    title: "TradeVault — AI Trading Journal",
    description: "Track, analyze, and improve your trades with AI-powered insights.",
    url: "https://tradevault.pro",
    siteName: "TradeVault",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeVault — AI Trading Journal",
    description: "Track, analyze, and improve your trades with AI-powered insights.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}