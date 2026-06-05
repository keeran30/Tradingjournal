// /app/data/assets.ts

export interface Asset {
  symbol: string
  name: string
  type: string
  exchange?: string
}

// Your main asset list
export const ASSETS: Asset[] = [
  // ========== STOCKS ==========
  { symbol: "AAPL", name: "Apple Inc.", type: "stock", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "stock", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "stock", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms Inc.", type: "stock", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc.", type: "stock", exchange: "NASDAQ" },
  { symbol: "AMD", name: "Advanced Micro Devices", type: "stock", exchange: "NASDAQ" },
  { symbol: "INTC", name: "Intel Corporation", type: "stock", exchange: "NASDAQ" },
  { symbol: "NFLX", name: "Netflix Inc.", type: "stock", exchange: "NASDAQ" },
  { symbol: "PLTR", name: "Palantir Technologies", type: "stock", exchange: "NYSE" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", type: "stock", exchange: "NYSE" },
  { symbol: "BAC", name: "Bank of America", type: "stock", exchange: "NYSE" },
  { symbol: "WFC", name: "Wells Fargo & Co.", type: "stock", exchange: "NYSE" },
  { symbol: "GS", name: "Goldman Sachs Group", type: "stock", exchange: "NYSE" },
  { symbol: "V", name: "Visa Inc.", type: "stock", exchange: "NYSE" },
  { symbol: "MA", name: "Mastercard Inc.", type: "stock", exchange: "NYSE" },
  { symbol: "JNJ", name: "Johnson & Johnson", type: "stock", exchange: "NYSE" },
  { symbol: "PFE", name: "Pfizer Inc.", type: "stock", exchange: "NYSE" },
  { symbol: "UNH", name: "UnitedHealth Group", type: "stock", exchange: "NYSE" },
  { symbol: "WMT", name: "Walmart Inc.", type: "stock", exchange: "NYSE" },
  { symbol: "PG", name: "Procter & Gamble", type: "stock", exchange: "NYSE" },
  { symbol: "KO", name: "Coca-Cola Company", type: "stock", exchange: "NYSE" },
  { symbol: "PEP", name: "PepsiCo Inc.", type: "stock", exchange: "NASDAQ" },
  { symbol: "MCD", name: "McDonald's Corp", type: "stock", exchange: "NYSE" },
  { symbol: "DIS", name: "Walt Disney Co", type: "stock", exchange: "NYSE" },
  { symbol: "CRM", name: "Salesforce Inc.", type: "stock", exchange: "NYSE" },
  { symbol: "ORCL", name: "Oracle Corporation", type: "stock", exchange: "NYSE" },
  { symbol: "IBM", name: "IBM Corporation", type: "stock", exchange: "NYSE" },
  { symbol: "SNOW", name: "Snowflake Inc.", type: "stock", exchange: "NYSE" },
  
  // ========== FOREX ==========
  { symbol: "EURUSD", name: "Euro / US Dollar", type: "forex" },
  { symbol: "GBPUSD", name: "British Pound / US Dollar", type: "forex" },
  { symbol: "USDJPY", name: "US Dollar / Japanese Yen", type: "forex" },
  { symbol: "AUDUSD", name: "Australian Dollar / US Dollar", type: "forex" },
  { symbol: "USDCAD", name: "US Dollar / Canadian Dollar", type: "forex" },
  { symbol: "USDCHF", name: "US Dollar / Swiss Franc", type: "forex" },
  { symbol: "NZDUSD", name: "New Zealand Dollar / US Dollar", type: "forex" },
  { symbol: "EURGBP", name: "Euro / British Pound", type: "forex" },
  { symbol: "EURJPY", name: "Euro / Japanese Yen", type: "forex" },
  { symbol: "GBPJPY", name: "British Pound / Japanese Yen", type: "forex" },
  { symbol: "AUDJPY", name: "Australian Dollar / Japanese Yen", type: "forex" },
  { symbol: "CHFJPY", name: "Swiss Franc / Japanese Yen", type: "forex" },
  { symbol: "EURCHF", name: "Euro / Swiss Franc", type: "forex" },
  { symbol: "GBPCHF", name: "British Pound / Swiss Franc", type: "forex" },
  { symbol: "CADJPY", name: "Canadian Dollar / Japanese Yen", type: "forex" },
  { symbol: "NZDCAD", name: "New Zealand Dollar / Canadian Dollar", type: "forex" },
  { symbol: "AUDNZD", name: "Australian Dollar / New Zealand Dollar", type: "forex" },
  { symbol: "EURCAD", name: "Euro / Canadian Dollar", type: "forex" },
  { symbol: "GBPAUD", name: "British Pound / Australian Dollar", type: "forex" },
  
  // ========== COMMODITIES (GOLD, SILVER, OIL) ==========
  { symbol: "XAUUSD", name: "Gold / US Dollar", type: "commodity" },
  { symbol: "XAGUSD", name: "Silver / US Dollar", type: "commodity" },
  { symbol: "XAUGBP", name: "Gold / British Pound", type: "commodity" },
  { symbol: "XAGEUR", name: "Silver / Euro", type: "commodity" },
  { symbol: "USOIL", name: "US Oil (WTI)", type: "commodity" },
  { symbol: "UKOIL", name: "Brent Oil", type: "commodity" },
  { symbol: "XPTUSD", name: "Platinum / US Dollar", type: "commodity" },
  { symbol: "XPDUSD", name: "Palladium / US Dollar", type: "commodity" },
  { symbol: "XCUUSD", name: "Copper / US Dollar", type: "commodity" },
  
  // ========== CRYPTO ==========
  { symbol: "BTCUSD", name: "Bitcoin", type: "crypto" },
  { symbol: "ETHUSD", name: "Ethereum", type: "crypto" },
  { symbol: "SOLUSD", name: "Solana", type: "crypto" },
  { symbol: "BNBUSD", name: "Binance Coin", type: "crypto" },
  { symbol: "XRPUSD", name: "Ripple", type: "crypto" },
  { symbol: "ADAUSD", name: "Cardano", type: "crypto" },
  { symbol: "DOGEUSD", name: "Dogecoin", type: "crypto" },
  { symbol: "DOTUSD", name: "Polkadot", type: "crypto" },
  { symbol: "MATICUSD", name: "Polygon", type: "crypto" },
  { symbol: "SHIBUSD", name: "Shiba Inu", type: "crypto" },
  { symbol: "LINKUSD", name: "Chainlink", type: "crypto" },
  { symbol: "AVAXUSD", name: "Avalanche", type: "crypto" },
  { symbol: "UNIUSD", name: "Uniswap", type: "crypto" },
  { symbol: "ATOMUSD", name: "Cosmos", type: "crypto" },
  { symbol: "LTCUSD", name: "Litecoin", type: "crypto" },
  { symbol: "ETCUSD", name: "Ethereum Classic", type: "crypto" },
  { symbol: "XLMUSD", name: "Stellar", type: "crypto" },
  { symbol: "BCHUSD", name: "Bitcoin Cash", type: "crypto" },
  { symbol: "ALGOUSD", name: "Algorand", type: "crypto" },
  { symbol: "VETUSD", name: "VeChain", type: "crypto" },
  
  // ========== INDICES ==========
  { symbol: "SPX", name: "S&P 500", type: "index", exchange: "NYSE" },
  { symbol: "NDX", name: "Nasdaq 100", type: "index", exchange: "NASDAQ" },
  { symbol: "DJI", name: "Dow Jones Industrial Average", type: "index", exchange: "NYSE" },
  { symbol: "RUT", name: "Russell 2000", type: "index", exchange: "NYSE" },
  { symbol: "FTSE", name: "FTSE 100", type: "index", exchange: "LSE" },
  { symbol: "DAX", name: "German DAX", type: "index", exchange: "XETRA" },
  { symbol: "CAC", name: "CAC 40", type: "index", exchange: "EURONEXT" },
  { symbol: "NIKKEI", name: "Nikkei 225", type: "index", exchange: "JPX" },
  { symbol: "HSI", name: "Hang Seng Index", type: "index", exchange: "HKEX" },
  { symbol: "ASX200", name: "S&P/ASX 200", type: "index", exchange: "ASX" },
  { symbol: "VIX", name: "CBOE Volatility Index", type: "index", exchange: "CBOE" },
]

// Custom assets storage (user-added assets)
let customAssets: Asset[] = []

// Load custom assets from localStorage (only in browser)
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('custom_assets')
  if (saved) {
    try {
      customAssets = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load custom assets', e)
      customAssets = []
    }
  }
}

// Search function - combines main assets + custom assets
export function searchAssets(query: string): Asset[] {
  if (!query || query.length < 1) {
    return []
  }
  
  const lowerQuery = query.toLowerCase()
  const allAssets = [...ASSETS, ...customAssets]
  
  const results = allAssets.filter(asset => 
    asset.symbol.toLowerCase().includes(lowerQuery) ||
    asset.name.toLowerCase().includes(lowerQuery)
  )
  
  return results.slice(0, 50)
}

// Add custom asset
export function addCustomAsset(symbol: string, name: string, type: string = 'custom'): boolean {
  const upperSymbol = symbol.toUpperCase()
  
  // Check if already exists in main assets or custom assets
  const allAssets = [...ASSETS, ...customAssets]
  if (allAssets.some(a => a.symbol === upperSymbol)) {
    return false
  }
  
  const newAsset: Asset = { 
    symbol: upperSymbol, 
    name: name || upperSymbol, 
    type 
  }
  
  customAssets.push(newAsset)
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('custom_assets', JSON.stringify(customAssets))
  }
  
  return true
}

// Get all custom assets
export function getCustomAssets(): Asset[] {
  return customAssets
}

// Delete custom asset
export function deleteCustomAsset(symbol: string): boolean {
  const index = customAssets.findIndex(a => a.symbol === symbol)
  if (index !== -1) {
    customAssets.splice(index, 1)
    if (typeof window !== 'undefined') {
      localStorage.setItem('custom_assets', JSON.stringify(customAssets))
    }
    return true
  }
  return false
}

// Get asset by symbol
export function getAssetBySymbol(symbol: string): Asset | undefined {
  const allAssets = [...ASSETS, ...customAssets]
  return allAssets.find(a => a.symbol === symbol)
}

// Get all assets (for debugging)
export function getAllAssets(): Asset[] {
  return [...ASSETS, ...customAssets]
}