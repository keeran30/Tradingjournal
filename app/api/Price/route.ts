import { NextRequest, NextResponse } from "next/server"

// Fallback prices - updated regularly
const FALLBACK: Record<string, number> = {
  "AAPL": 195.89, "TSLA": 248.50, "MSFT": 445.80, "GOOGL": 175.20,
  "AMZN": 192.40, "NVDA": 920.15, "META": 520.30, "AMD": 167.89,
  "INTC": 34.56, "NFLX": 628.90, "PLTR": 24.67, "JPM": 198.45,
  "BAC": 39.78, "V": 278.90, "MA": 456.78, "JNJ": 152.34,
  "PFE": 28.90, "WMT": 67.89, "KO": 62.34, "PEP": 178.90,
  "MCD": 289.45, "DIS": 95.67, "CRM": 278.90, "ORCL": 134.56,
  "IBM": 178.90, "SNOW": 156.78, "SPY": 530.42, "QQQ": 445.89,
  "XAUUSD": 2415.80, "XAGUSD": 29.45, "EURUSD": 1.0845,
  "GBPUSD": 1.2634, "USDJPY": 157.30, "AUDUSD": 0.6623,
  "USDCAD": 1.3678, "BTCUSD": 69500, "ETHUSD": 3450.25,
  "SOLUSD": 172.34, "DOGEUSD": 0.1523, "XRPUSD": 0.5234,
  "ADAUSD": 0.4567, "BNBUSD": 589.34, "DOTUSD": 7.23,
  "LINKUSD": 14.56, "LTCUSD": 78.90, "USOIL": 78.90,
  "UKOIL": 83.45, "SPX": 5320.45, "NDX": 18678, "DJI": 38765,
  "VIX": 14.56,
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || ""
  const upper = symbol.toUpperCase()
  
  try {
    // Try Yahoo Finance
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(3000),
      }
    )
    
    if (res.ok) {
      const data = await res.json()
      const meta = data?.chart?.result?.[0]?.meta
      if (meta?.regularMarketPrice) {
        return NextResponse.json({
          symbol: meta.symbol,
          price: meta.regularMarketPrice,
          change: meta.regularMarketPrice - meta.previousClose,
        })
      }
    }
  } catch (e) {
    // Fallback
  }
  
  // Use fallback
  if (FALLBACK[upper]) {
    return NextResponse.json({ symbol: upper, price: FALLBACK[upper], change: 0 })
  }
  
  return NextResponse.json({ symbol: upper, price: null })
}