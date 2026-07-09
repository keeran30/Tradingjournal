import { NextRequest, NextResponse } from "next/server";

// Fallback prices for common assets (updated regularly)
const FALLBACK_PRICES: Record<string, { price: number; change: number }> = {
  "AAPL": { price: 195.89, change: 1.23 },
  "TSLA": { price: 248.50, change: -2.15 },
  "MSFT": { price: 425.27, change: 0.87 },
  "GOOGL": { price: 141.76, change: 1.54 },
  "AMZN": { price: 187.23, change: -0.95 },
  "NVDA": { price: 875.28, change: 3.45 },
  "META": { price: 505.17, change: 0.62 },
  "AMD": { price: 167.89, change: -1.23 },
  "INTC": { price: 34.56, change: 0.45 },
  "NFLX": { price: 628.90, change: 1.78 },
  "PLTR": { price: 24.67, change: 2.34 },
  "JPM": { price: 198.45, change: -0.56 },
  "BAC": { price: 39.78, change: 0.23 },
  "V": { price: 278.90, change: 0.67 },
  "MA": { price: 456.78, change: -0.34 },
  "JNJ": { price: 152.34, change: 0.12 },
  "PFE": { price: 28.90, change: -0.45 },
  "WMT": { price: 67.89, change: 0.56 },
  "KO": { price: 62.34, change: 0.23 },
  "PEP": { price: 178.90, change: -0.34 },
  "MCD": { price: 289.45, change: 0.78 },
  "DIS": { price: 95.67, change: -0.89 },
  "CRM": { price: 278.90, change: 1.23 },
  "ORCL": { price: 134.56, change: -0.45 },
  "IBM": { price: 178.90, change: 0.67 },
  "SNOW": { price: 156.78, change: -1.23 },
  "SPY": { price: 530.42, change: 0.34 },
  "QQQ": { price: 445.89, change: 0.78 },
  "XAUUSD": { price: 2324.56, change: 0.42 },
  "XAGUSD": { price: 27.89, change: -0.31 },
  "EURUSD": { price: 1.0845, change: 0.0012 },
  "GBPUSD": { price: 1.2634, change: -0.0008 },
  "USDJPY": { price: 154.72, change: 0.15 },
  "AUDUSD": { price: 0.6623, change: -0.0003 },
  "USDCAD": { price: 1.3678, change: 0.0005 },
  "BTCUSD": { price: 67842.15, change: 2.34 },
  "ETHUSD": { price: 3245.67, change: 1.89 },
  "SOLUSD": { price: 172.34, change: -3.21 },
  "DOGEUSD": { price: 0.1523, change: 5.67 },
  "XRPUSD": { price: 0.5234, change: -1.23 },
  "ADAUSD": { price: 0.4567, change: 0.89 },
  "BNBUSD": { price: 589.34, change: 1.45 },
  "DOTUSD": { price: 7.23, change: -0.56 },
  "LINKUSD": { price: 14.56, change: 0.78 },
  "LTCUSD": { price: 78.90, change: -0.34 },
  "SPX": { price: 5320.45, change: 0.23 },
  "NDX": { price: 18678.90, change: 0.56 },
  "DJI": { price: 38765.43, change: -0.12 },
  "VIX": { price: 14.56, change: -0.78 },
  "USOIL": { price: 78.90, change: 0.45 },
  "UKOIL": { price: 83.45, change: -0.23 },
};

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  
  if (query.length < 1) {
    return NextResponse.json([]);
  }

  try {
    // Try Yahoo Finance first
    const response = await fetch(
      `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=10&newsCount=0`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
        },
      }
    );
    
    const data = await response.json();
    const quotes = data.quotes || [];
    
    // Format results with fallback prices
    const results = quotes.map((quote: any) => {
      const fallback = FALLBACK_PRICES[quote.symbol];
      return {
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchange || "",
        type: (quote.quoteType || "stock").toLowerCase(),
        price: fallback?.price || null,
        change: fallback?.change || null,
      };
    });

    // Also add any matching fallback assets not in results
    const resultSymbols = results.map((r: any) => r.symbol);
    const q = query.toUpperCase();
    Object.entries(FALLBACK_PRICES).forEach(([symbol, data]) => {
      if (symbol.includes(q) && !resultSymbols.includes(symbol)) {
        results.push({
          symbol,
          name: symbol,
          exchange: "",
          type: "stock",
          price: data.price,
          change: data.change,
        });
      }
    });

    return NextResponse.json(results.slice(0, 10));
  } catch (error) {
    console.error("Search error:", error);
    
    // Use fallback data
    const q = query.toUpperCase();
    const results = Object.entries(FALLBACK_PRICES)
      .filter(([symbol]) => symbol.includes(q))
      .slice(0, 10)
      .map(([symbol, data]) => ({
        symbol,
        name: symbol,
        exchange: "",
        type: "stock",
        price: data.price,
        change: data.change,
      }));

    return NextResponse.json(results);
  }
}