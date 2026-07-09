// app/lib/market-data.ts

const FINNHUB_KEY = process.env.FINNHUB_API_KEY

export interface LiveQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  source: string
}

async function getStockQuote(symbol: string): Promise<LiveQuote | null> {
  if (!FINNHUB_KEY) return null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    
    if (!res.ok) return null
    const data = await res.json()
    if (!data.c) return null
    return {
      symbol,
      price: data.c,
      change: data.d || 0,
      changePercent: data.dp || 0,
      source: "finnhub",
    }
  } catch {
    return null
  }
}

async function getCryptoQuote(symbol: string): Promise<LiveQuote | null> {
  const binanceSymbol = symbol.replace(/USD$/, "USDT")
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    
    if (!res.ok) return null
    const data = await res.json()
    if (!data.lastPrice) return null
    return {
      symbol,
      price: parseFloat(data.lastPrice),
      change: parseFloat(data.priceChange || "0"),
      changePercent: parseFloat(data.priceChangePercent || "0"),
      source: "binance",
    }
  } catch {
    return null
  }
}

async function getForexQuote(symbol: string): Promise<LiveQuote | null> {
  if (!FINNHUB_KEY) return null
  const base = symbol.slice(0, 3)
  const quote = symbol.slice(3, 6)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    
    const res = await fetch(
      `https://finnhub.io/api/v1/forex/rates?base=${base}&token=${FINNHUB_KEY}`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    
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
}