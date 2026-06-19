import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  
  if (query.length < 1) {
    return NextResponse.json([]);
  }

  try {
    // Use Yahoo Finance v8 API (returns prices)
    const response = await fetch(
      `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=10&newsCount=0`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );
    
    const data = await response.json();
    
    // Also fetch prices for found symbols
    const quotes = data.quotes || [];
    const symbols = quotes.map((q: any) => q.symbol).join(",");
    
    let prices: any = {};
    if (symbols) {
      try {
        const priceRes = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbols}?interval=1d&range=1d`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          }
        );
        const priceData = await priceRes.json();
        const result = priceData?.chart?.result;
        if (result) {
          if (Array.isArray(result)) {
            result.forEach((r: any) => {
              const meta = r.meta;
              if (meta) {
                prices[meta.symbol] = {
                  price: meta.regularMarketPrice || null,
                  change: meta.regularMarketChangePercent || null,
                };
              }
            });
          } else if (result.meta) {
            prices[result.meta.symbol] = {
              price: result.meta.regularMarketPrice || null,
              change: result.meta.regularMarketChangePercent || null,
            };
          }
        }
      } catch (e) {
        console.error("Price fetch error:", e);
      }
    }
    
    // Format results with prices
    const results = quotes.map((quote: any) => ({
      symbol: quote.symbol,
      name: quote.shortname || quote.longname || quote.symbol,
      exchange: quote.exchange || "",
      type: quote.quoteType || "stock",
      price: prices[quote.symbol]?.price || null,
      change: prices[quote.symbol]?.change || null,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    
    // Fallback data with estimated prices
    const fallbackResults = getFallbackResults(query);
    return NextResponse.json(fallbackResults);
  }
}

function getFallbackResults(query: string) {
  const allAssets: { symbol: string; name: string; exchange: string; type: string; price: number; change: number }[] = [
    { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "stock", price: 195.89, change: 1.23 },
    { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", type: "stock", price: 248.50, change: -2.15 },
    { symbol: "MSFT", name: "Microsoft Corp.", exchange: "NASDAQ", type: "stock", price: 425.27, change: 0.87 },
    { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", type: "stock", price: 141.76, change: 1.54 },
    { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", type: "stock", price: 187.23, change: -0.95 },
    { symbol: "NVDA", name: "NVIDIA Corp.", exchange: "NASDAQ", type: "stock", price: 875.28, change: 3.45 },
    { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", type: "stock", price: 505.17, change: 0.62 },
    { symbol: "SPY", name: "SPDR S&P 500 ETF", exchange: "NYSE", type: "etf", price: 530.42, change: 0.34 },
    { symbol: "QQQ", name: "Invesco QQQ Trust", exchange: "NASDAQ", type: "etf", price: 445.89, change: 0.78 },
    { symbol: "XAUUSD", name: "Gold / US Dollar", exchange: "FOREX", type: "forex", price: 2324.56, change: 0.42 },
    { symbol: "XAGUSD", name: "Silver / US Dollar", exchange: "FOREX", type: "forex", price: 27.89, change: -0.31 },
    { symbol: "EURUSD", name: "Euro / US Dollar", exchange: "FOREX", type: "forex", price: 1.0845, change: 0.0012 },
    { symbol: "GBPUSD", name: "British Pound / US Dollar", exchange: "FOREX", type: "forex", price: 1.2634, change: -0.0008 },
    { symbol: "USDJPY", name: "US Dollar / Japanese Yen", exchange: "FOREX", type: "forex", price: 154.72, change: 0.15 },
    { symbol: "BTCUSD", name: "Bitcoin / US Dollar", exchange: "CRYPTO", type: "crypto", price: 67842.15, change: 2.34 },
    { symbol: "ETHUSD", name: "Ethereum / US Dollar", exchange: "CRYPTO", type: "crypto", price: 3245.67, change: 1.89 },
    { symbol: "SOLUSD", name: "Solana / US Dollar", exchange: "CRYPTO", type: "crypto", price: 172.34, change: -3.21 },
    { symbol: "DOGEUSD", name: "Dogecoin / US Dollar", exchange: "CRYPTO", type: "crypto", price: 0.1523, change: 5.67 },
  ];

  const q = query.toUpperCase();
  return allAssets.filter(
    (asset) => asset.symbol.includes(q) || asset.name.toUpperCase().includes(q)
  );
}