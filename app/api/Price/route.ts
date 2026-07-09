// app/api/Price/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getLiveQuote } from "../../lib/market-data"

// Last-resort static fallback if all live sources fail
const FALLBACK: Record<string, number> = {
  "AAPL": 195.89, "TSLA": 248.50, "MSFT": 445.80, "GOOGL": 175.20,
  "AMZN": 192.40, "NVDA": 920.15, "META": 520.30,
  "XAUUSD": 2415.80, "EURUSD": 1.0845, "BTCUSD": 69500,
}

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").toUpperCase()
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 })
  }

  const live = await getLiveQuote(symbol)
  if (live) {
    return NextResponse.json(live)
  }

  if (FALLBACK[symbol]) {
    return NextResponse.json({ symbol, price: FALLBACK[symbol], change: 0, changePercent: 0, source: "fallback" })
  }

  return NextResponse.json({ symbol, price: null, source: "fallback" })
}