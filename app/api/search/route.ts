import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  
  if (query.length < 1) {
    return NextResponse.json([]);
  }

  try {
    // Fetch from Yahoo Finance or Alpha Vantage (free)
    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=10&newsCount=0`
    );
    
    const data = await response.json();
    
    // Format results like TradingView
    const results = (data.quotes || []).map((quote: any) => ({
      symbol: quote.symbol,
      name: quote.shortname || quote.longname || quote.symbol,
      exchange: quote.exchange || "",
      type: quote.quoteType || "stock",
      price: quote.regularMarketPrice || null,
      change: quote.regularMarketChangePercent || null,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    
    // Fallback: Return some default assets if API fails
    const fallbackResults = getFallbackResults(query);
    return NextResponse.json(fallbackResults);
  }
}

// Fallback data for common assets
function getFallbackResults(query: string) {
  const allAssets = [
    { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "stock" },
    { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", type: "stock" },
    { symbol: "MSFT", name: "Microsoft Corp.", exchange: "NASDAQ", type: "stock" },
    { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", type: "stock" },
    { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", type: "stock" },
    { symbol: "NVDA", name: "NVIDIA Corp.", exchange: "NASDAQ", type: "stock" },
    { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", type: "stock" },
    { symbol: "SPY", name: "SPDR S&P 500 ETF", exchange: "NYSE", type: "etf" },
    { symbol: "QQQ", name: "Invesco QQQ Trust", exchange: "NASDAQ", type: "etf" },
    { symbol: "XAUUSD", name: "Gold / US Dollar", exchange: "FOREX", type: "forex" },
    { symbol: "XAGUSD", name: "Silver / US Dollar", exchange: "FOREX", type: "forex" },
    { symbol: "EURUSD", name: "Euro / US Dollar", exchange: "FOREX", type: "forex" },
    { symbol: "GBPUSD", name: "British Pound / US Dollar", exchange: "FOREX", type: "forex" },
    { symbol: "USDJPY", name: "US Dollar / Japanese Yen", exchange: "FOREX", type: "forex" },
    { symbol: "BTCUSD", name: "Bitcoin / US Dollar", exchange: "CRYPTO", type: "crypto" },
    { symbol: "ETHUSD", name: "Ethereum / US Dollar", exchange: "CRYPTO", type: "crypto" },
    { symbol: "SOLUSD", name: "Solana / US Dollar", exchange: "CRYPTO", type: "crypto" },
    { symbol: "DOGEUSD", name: "Dogecoin / US Dollar", exchange: "CRYPTO", type: "crypto" },
  ];

  const q = query.toUpperCase();
  return allAssets.filter(
    (asset) => asset.symbol.includes(q) || asset.name.toUpperCase().includes(q)
  );
}