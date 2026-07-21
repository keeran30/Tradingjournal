import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "TradeVault — AI Trading Journal",
  description: "AI-powered trading journal with leak tracker, edge discovery, and pre-market protocols",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950">{children}</body>
    </html>
  )
}