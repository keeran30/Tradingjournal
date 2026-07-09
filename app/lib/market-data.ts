// app/lib/market-data.ts
// Central place for all live market data. Swap providers here without touching routes/components.

const FINNHUB_KEY = process.env.FINNHUB_API_KEY

export interface LiveQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  source: "finnhub" | "binance" | "fallback"
}

// ---- STOCKS (Finnhub — free tier covers US equities well) ----
async function getStockQuote(symbol: string): Promise<LiveQuote | null> {
  if (!FINNHUB_KEY) return null
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`,
      { signal: AbortSignal.timeout(4000), next: { revalidate: 5 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data.c) return null // c = current price
    return {
      symbol,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      source: "finnhub",
    }
  } catch {
    return null
  }
}

// ---- CRYPTO (Binance public API — free, no key, genuinely real-time) ----
async function getCryptoQuote(symbol: string): Promise<LiveQuote | null> {
  // expects symbols like BTCUSD -> BTCUSDT on Binance
  const binanceSymbol = symbol.replace(/USD$/, "USDT")
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
      { signal: AbortSignal.timeout(4000), next: { revalidate: 5 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data.lastPrice) return null
    return {
      symbol,
      price: parseFloat(data.lastPrice),
      change: parseFloat(data.priceChange),
      changePercent: parseFloat(data.priceChangePercent),
      source: "binance",
    }
  } catch {
    return null
  }
}

// ---- FOREX (Finnhub forex rates — free tier) ----
async function getForexQuote(symbol: string): Promise<LiveQuote | null> {
  if (!FINNHUB_KEY) return null
  const base = symbol.slice(0, 3)
  const quote = symbol.slice(3, 6)
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/forex/rates?base=${base}&token=${FINNHUB_KEY}`,
      { signal: AbortSignal.timeout(4000), next: { revalidate: 30 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const price = data?.quote?.[quote]
    if (!price) return null
    return { symbol, price, change: 0, changePercent: 0, source: "finnhub" }
  } catch {
    return null
  }
}

const CRYPTO_SYMBOLS = new Set(["BTCUSD", "ETHUSD", "SOLUSD", "DOGEUSD", "XRPUSD", "ADAUSD", "BNBUSD", "DOTUSD", "LINKUSD", "LTCUSD"])
const FOREX_SYMBOLS = new Set(["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD"])

export async function getLiveQuote(symbol: string): Promise<LiveQuote | null> {
  const upper = symbol.toUpperCase()
  if (CRYPTO_SYMBOLS.has(upper)) return getCryptoQuote(upper)
  if (FOREX_SYMBOLS.has(upper)) return getForexQuote(upper)
  return getStockQuote(upper)
  // Note: gold (XAUUSD), oil, and futures need a paid feed (Finnhub's commodity
  // data is behind their paid tier). Flagging this honestly rather than faking
  // coverage — see the note at the end of this response for options there.
}