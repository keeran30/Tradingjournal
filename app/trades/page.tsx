"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"
import { addCustomAsset } from "../data/assets"
import AIAssistant from "../components/AIAssistant"
import AppLoader from "../components/AppLoader"

// Types
interface Trade {
  id: string
  asset: string
  direction: string
  entry: number
  close_price: number
  size: number
  size_unit?: string
  original_size?: number
  emotion?: string
  pnl: number
  created_at: string
}

interface SearchResult {
  symbol: string
  name: string
  exchange: string
  type: string
  price: number | null
  change: number | null
}

interface AnalyticsData {
  totalTrades: number
  summary: {
    winRate: string
    winningTrades: number
    losingTrades: number
    totalPnl: string
    profitFactor: string
    expectancy: string
    maxWinStreak: number
    maxLossStreak: number
  }
  assets: {
    best: { symbol: string; pnl: string; trades: number; winRate: string } | null
    worst: { symbol: string; pnl: string; trades: number; winRate: string } | null
  }
  direction: {
    buyWinRate: string
    buyTrades: number
    buyPnL: string
    sellWinRate: string
    sellTrades: number
    sellPnL: string
  }
  suggestions: string[]
  motivation: string
  message?: string
}

export default function TradesPage() {
  const router = useRouter()
  
  // Auth state
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  
  // Asset search states
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [selectedAssetData, setSelectedAssetData] = useState<SearchResult | null>(null)

  // Trade form states
  const [direction, setDirection] = useState("Buy")
  const [entry, setEntry] = useState("")
  const [closePrice, setClosePrice] = useState("")
  const [size, setSize] = useState("")
  const [emotion, setEmotion] = useState("")
  const [sizeUnit, setSizeUnit] = useState<"shares" | "lots" | "coins">("shares")

  // Trades list
  const [trades, setTrades] = useState<Trade[]>([])

  // Tab state
  const [activeTab, setActiveTab] = useState<"journal" | "analytics">("journal")
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  // Custom asset modal states
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customSymbol, setCustomSymbol] = useState("")
  const [customName, setCustomName] = useState("")

  // Emotion dropdown states
  const [showEmotionModal, setShowEmotionModal] = useState(false)
  const [customEmotion, setCustomEmotion] = useState("")
  const [customEmotions, setCustomEmotions] = useState<string[]>([])

  // Notification state
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // Page loading state
  const [pageLoading, setPageLoading] = useState(true)

  const defaultEmotions = [
    "😌 Calm",
    "😊 Confident",
    "🤔 Hesitant",
    "😰 Anxious",
    "😤 Impatient",
    "😨 Fearful",
    "🤑 Greedy",
    "😓 Stressed",
    "😎 Overconfident",
    "🤷 Unsure",
    "🎯 Focused",
    "😴 Tired",
  ]

  const allEmotions = [...defaultEmotions, ...customEmotions]

  // Show notification helper
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth")
      } else {
        setUserId(user.id)
      }
      setAuthChecked(true)
    }
    checkAuth()
  }, [router])

  // Load custom emotions from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("custom_emotions")
      if (saved) {
        try {
          setCustomEmotions(JSON.parse(saved))
        } catch (e) {
          console.error("Failed to parse custom emotions:", e)
        }
      }
    }
  }, [])

  // Helper function to determine asset type
  const getAssetType = useCallback((symbol: string): "stock" | "forex" | "crypto" | "commodity" => {
    const forexSymbols = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD", "XAUUSD", "XAGUSD", "XAUGBP", "XAGEUR"]
    const cryptoSymbols = ["BTCUSD", "ETHUSD", "SOLUSD", "DOGEUSD", "XRPUSD", "ADAUSD"]
    
    if (forexSymbols.includes(symbol.toUpperCase())) return "forex"
    if (cryptoSymbols.includes(symbol.toUpperCase())) return "crypto"
    return "stock"
  }, [])

  // Auto-set size unit when asset is selected
  useEffect(() => {
    if (selectedAsset) {
      const type = getAssetType(selectedAsset)
      if (type === "forex") setSizeUnit("lots")
      else if (type === "crypto") setSizeUnit("coins")
      else setSizeUnit("shares")
    }
  }, [selectedAsset, getAssetType])

  // SEARCH ASSETS
  useEffect(() => {
    const fetchAssets = async () => {
      if (search.length < 1) {
        setResults([])
        return
      }

      setLoading(true)

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`)
        const data = await res.json()
        
        if (data && Array.isArray(data)) {
          setResults(data)
        } else {
          setResults([])
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const delay = setTimeout(fetchAssets, 300)
    return () => clearTimeout(delay)
  }, [search])

  // FETCH TRADES - Only current user's trades
  const fetchTrades = useCallback(async () => {
    if (!userId) return
    
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Fetch trades error:", error)
        setTrades([])
      } else {
        setTrades(data || [])
      }
    } catch (err) {
      console.error("Failed to fetch trades:", err)
      setTrades([])
    } finally {
      setPageLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchTrades()
    }
  }, [userId, fetchTrades])

  // FETCH ANALYTICS
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true)
    try {
      const res = await fetch("/api/analytics")
      const data = await res.json()
      setAnalytics(data)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics()
    }
  }, [activeTab])

  // PNL CALCULATION
  const calculatePnL = useCallback(() => {
    const e = parseFloat(entry)
    const c = parseFloat(closePrice)
    let s = parseFloat(size)

    if (isNaN(e) || isNaN(c) || isNaN(s)) return 0

    if (sizeUnit === "lots") {
      s = s * 100000
    }

    const diff = direction === "Buy" ? (c - e) : (e - c)
    return diff * s
  }, [entry, closePrice, size, sizeUnit, direction])

  // SAVE TRADE - With user_id
  const saveTrade = async () => {
    if (!selectedAsset) {
      showNotification("Please select an asset first", "error")
      return
    }
    
    if (!entry || !closePrice || !size) {
      showNotification("Please fill in all trade fields", "error")
      return
    }

    const entryNum = parseFloat(entry)
    const closeNum = parseFloat(closePrice)
    const sizeNum = parseFloat(size)

    if (isNaN(entryNum) || isNaN(closeNum) || isNaN(sizeNum)) {
      showNotification("Please enter valid numbers", "error")
      return
    }

    let finalSize = sizeNum
    if (sizeUnit === "lots") {
      finalSize = sizeNum * 100000
    }

    const pnl = calculatePnL()
    
    if (!userId) {
      showNotification("You must be logged in to save trades", "error")
      return
    }

    const tradeData = {
      user_id: userId,
      asset: selectedAsset,
      direction,
      entry: entryNum,
      close_price: closeNum,
      size: finalSize,
      size_unit: sizeUnit,
      original_size: sizeNum,
      emotion: emotion || null,
      pnl,
    }

    try {
      const { error } = await supabase.from("trades").insert([tradeData])

      if (error) {
        console.error("Save trade error:", error)
        showNotification(`Error: ${error.message}`, "error")
      } else {
        showNotification("Trade saved successfully!", "success")
        setEntry("")
        setClosePrice("")
        setSize("")
        setEmotion("")
        fetchTrades()
      }
    } catch (err) {
      console.error("Failed to save trade:", err)
      showNotification("Failed to save trade", "error")
    }
  }

  // DELETE TRADE
  const deleteTrade = async (id: string) => {
    try {
      const { error } = await supabase.from("trades").delete().eq("id", id)
      if (error) {
        showNotification(`Error: ${error.message}`, "error")
      } else {
        showNotification("Trade deleted", "success")
        fetchTrades()
      }
    } catch (err) {
      console.error("Failed to delete trade:", err)
      showNotification("Failed to delete trade", "error")
    }
  }

  // ADD CUSTOM ASSET
  const handleAddCustomAsset = () => {
    if (!customSymbol.trim()) {
      showNotification("Please enter a symbol", "error")
      return
    }
    
    const added = addCustomAsset(customSymbol.toUpperCase(), customName)
    
    if (added) {
      showNotification(`"${customSymbol.toUpperCase()}" added!`, "success")
      setShowCustomModal(false)
      setCustomSymbol("")
      setCustomName("")
    } else {
      showNotification(`"${customSymbol.toUpperCase()}" already exists`, "error")
    }
  }

  // ADD CUSTOM EMOTION
  const handleAddCustomEmotion = () => {
    if (!customEmotion.trim()) {
      showNotification("Please enter an emotion", "error")
      return
    }
    
    if (allEmotions.includes(customEmotion)) {
      showNotification("Emotion already exists", "error")
      return
    }
    
    const updated = [...customEmotions, customEmotion]
    setCustomEmotions(updated)
    if (typeof window !== "undefined") {
      localStorage.setItem("custom_emotions", JSON.stringify(updated))
    }
    setCustomEmotion("")
    setShowEmotionModal(false)
    showNotification(`"${customEmotion}" added`, "success")
  }

  // Select asset from search - auto-fill entry price
  const selectAsset = (item: SearchResult) => {
    setSelectedAsset(item.symbol)
    setSelectedAssetData(item)
    setSearch("")
    setResults([])
    
    // Auto-fill entry price with current market price
    if (item.price) {
      setEntry(item.price.toString())
    }
  }

  // Show loader while checking auth and loading data
  if (!authChecked || pageLoading) {
    return <AppLoader message="Loading Trading Journal" />
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />
      
      <section className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl font-bold shadow-lg transition-all animate-bounce ${
            notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}>
            {notification.message}
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold mb-2">Trading Journal</h1>
        <p className="text-zinc-400 mb-6">Track your trades with real-time market data</p>

        {/* TAB SWITCHER */}
        <div className="flex gap-4 mb-6 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("journal")}
            className={`pb-2 px-4 font-bold transition ${
              activeTab === "journal" 
                ? "text-yellow-500 border-b-2 border-yellow-500" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            📝 Trade Journal
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-2 px-4 font-bold transition ${
              activeTab === "analytics" 
                ? "text-yellow-500 border-b-2 border-yellow-500" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            🤖 AI Analytics
          </button>
        </div>

        {/* ========== JOURNAL TAB ========== */}
        {activeTab === "journal" && (
          <>
            {/* SELECTED ASSET */}
            {selectedAsset && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-600 rounded-xl flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">Selected:</span>
                  <b className="text-white text-lg">{selectedAsset}</b>
                  {selectedAssetData?.price && (
                    <span className={`text-sm font-semibold ${(selectedAssetData.change || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ${selectedAssetData.price.toFixed(2)}
                      {selectedAssetData.change !== null && (
                        <span className="ml-1">
                          ({(selectedAssetData.change || 0) >= 0 ? "+" : ""}{selectedAssetData.change?.toFixed(2)}%)
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedAsset(null)
                    setSelectedAssetData(null)
                    setEntry("")
                  }}
                  className="text-sm text-red-400 hover:text-red-300 transition"
                >
                  ✕ Change Asset
                </button>
              </div>
            )}

            {/* SEARCH INPUT */}
            {!selectedAsset && (
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for any asset... (TSLA, AAPL, BTCUSD, XAUUSD)"
                  className="w-full p-4 pl-12 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition text-lg"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xl">🔍</span>
                {search && (
                  <button
                    onClick={() => { setSearch(""); setResults([]) }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* SEARCH RESULTS - TradingView Style */}
            {!selectedAsset && !loading && results && results.length > 0 && (
              <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider flex justify-between">
                  <span>Search Results ({results.length})</span>
                  <span className="text-zinc-600">Click to select</span>
                </div>
                {results.map((item, index) => (
                  <div
                    key={`${item.symbol}-${index}`}
                    onClick={() => selectAsset(item)}
                    className="flex items-center justify-between p-4 hover:bg-zinc-800 cursor-pointer transition border-b border-zinc-800/50 last:border-b-0 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                        item.type === "crypto" ? "bg-orange-900/30 text-orange-400" :
                        item.type === "forex" ? "bg-blue-900/30 text-blue-400" :
                        "bg-green-900/30 text-green-400"
                      }`}>
                        {item.symbol.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <b className="text-white group-hover:text-yellow-400 transition">{item.symbol}</b>
                          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {item.exchange}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400">{item.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {item.price && (
                        <p className="text-white font-semibold">${item.price.toFixed(2)}</p>
                      )}
                      {item.change !== null && item.change !== undefined && (
                        <p className={`text-sm font-medium ${item.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%
                        </p>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.type === "stock" ? "bg-green-900/50 text-green-400" :
                        item.type === "forex" ? "bg-blue-900/50 text-blue-400" :
                        item.type === "crypto" ? "bg-orange-900/50 text-orange-400" :
                        "bg-zinc-800 text-zinc-400"
                      }`}>
                        {item.type?.toUpperCase() || "ASSET"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center">
                <div className="animate-spin text-3xl mb-3">🔍</div>
                <p className="text-zinc-400">Searching markets...</p>
              </div>
            )}

            {/* No Results State */}
            {!loading && results && results.length === 0 && search.length > 0 && (
              <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-zinc-400 mb-2">No results for "<b className="text-white">{search}</b>"</p>
                <p className="text-sm text-zinc-500 mb-3">Try a different symbol or add it manually</p>
                <button
                  onClick={() => setShowCustomModal(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm transition"
                >
                  + Add Custom Asset
                </button>
              </div>
            )}

            {/* ADD CUSTOM ASSET BUTTON */}
            {!selectedAsset && search.length === 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowCustomModal(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  + Can't find your asset? Add it manually
                </button>
              </div>
            )}

            {/* TRADE FORM */}
            {selectedAsset && (
              <div className="mt-6 space-y-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <h3 className="text-lg font-bold text-yellow-500 mb-2">
                  New Trade — {selectedAsset}
                  {selectedAssetData?.price && (
                    <span className="text-sm font-normal text-zinc-400 ml-2">
                      Current: ${selectedAssetData.price.toFixed(2)}
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-zinc-400 text-sm mb-1">Direction</label>
                    <select
                      value={direction}
                      onChange={(e) => setDirection(e.target.value)}
                      className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none"
                    >
                      <option value="Buy">🟢 Buy (Long)</option>
                      <option value="Sell">🔴 Sell (Short)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-sm mb-1">
                      Entry Price
                      {entry && selectedAssetData?.price && (
                        <span className="text-xs text-zinc-500 ml-2">
                          (Market: ${selectedAssetData.price.toFixed(2)})
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder={selectedAssetData?.price ? `Market price: ${selectedAssetData.price.toFixed(2)}` : "Entry price"}
                      value={entry}
                      onChange={(e) => setEntry(e.target.value)}
                      className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-sm mb-1">Exit Price</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Your exit price"
                      value={closePrice}
                      onChange={(e) => setClosePrice(e.target.value)}
                      className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-sm mb-1">Position Size</label>
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        <input
                          type="number"
                          step="any"
                          placeholder={sizeUnit === "lots" ? "Number of lots" : 
                                       sizeUnit === "coins" ? "Number of coins" : 
                                       "Number of shares"}
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                          className="flex-1 p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none"
                        />
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSizeUnit("shares")}
                            className={`px-3 rounded-xl font-bold text-sm transition ${
                              sizeUnit === "shares" 
                                ? "bg-yellow-500 text-black" 
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            }`}
                          >
                            Shares
                          </button>
                          <button
                            type="button"
                            onClick={() => setSizeUnit("lots")}
                            className={`px-3 rounded-xl font-bold text-sm transition ${
                              sizeUnit === "lots" 
                                ? "bg-yellow-500 text-black" 
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            }`}
                          >
                            Lots
                          </button>
                          <button
                            type="button"
                            onClick={() => setSizeUnit("coins")}
                            className={`px-3 rounded-xl font-bold text-sm transition ${
                              sizeUnit === "coins" 
                                ? "bg-yellow-500 text-black" 
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            }`}
                          >
                            Coins
                          </button>
                        </div>
                      </div>
                      {size && (
                        <p className="text-xs text-zinc-500">
                          {sizeUnit === "lots" && `📊 Total: ${(parseFloat(size) * 100000).toLocaleString()} units`}
                          {sizeUnit === "shares" && `📈 Total: ${parseFloat(size).toLocaleString()} shares`}
                          {sizeUnit === "coins" && `🪙 Total: ${parseFloat(size).toLocaleString()} coins`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-zinc-400 text-sm mb-1">How did you feel? (optional)</label>
                    <select
                      value={emotion}
                      onChange={(e) => {
                        if (e.target.value === "___add_new___") {
                          setShowEmotionModal(true)
                        } else {
                          setEmotion(e.target.value)
                        }
                      }}
                      className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none cursor-pointer"
                    >
                      <option value="">Select your emotion...</option>
                      {allEmotions.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                      <option disabled>──────────</option>
                      <option value="___add_new___">➕ Add custom emotion...</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* PNL DISPLAY */}
            {selectedAsset && entry && closePrice && size && (
              <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex justify-between items-center">
                <span className="text-zinc-400">Estimated Profit / Loss</span>
                <span className={`text-xl font-bold ${calculatePnL() >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {calculatePnL() >= 0 ? "+" : ""}${calculatePnL().toFixed(2)}
                </span>
              </div>
            )}

            {/* BUTTONS */}
            {selectedAsset && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={saveTrade}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-xl font-bold transition"
                >
                  💾 Save Trade
                </button>
                <button
                  onClick={() => {
                    setEntry("")
                    setClosePrice("")
                    setSize("")
                    setEmotion("")
                  }}
                  className="bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-700 transition"
                >
                  🔄 Clear Form
                </button>
                <button
                  onClick={() => {
                    setSelectedAsset(null)
                    setSelectedAssetData(null)
                    setEntry("")
                    setClosePrice("")
                    setSize("")
                    setEmotion("")
                    setSearch("")
                    setResults([])
                  }}
                  className="bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-600 transition"
                >
                  ➕ Pick Different Asset
                </button>
              </div>
            )}

            {/* TRADE HISTORY */}
            <div className="mt-8 space-y-3">
              <h2 className="text-2xl font-bold mb-4">
                Your Trade History
                {trades.length > 0 && <span className="text-sm text-zinc-500 ml-2 font-normal">({trades.length} trades)</span>}
              </h2>
              {trades.length === 0 && (
                <div className="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <p className="text-4xl mb-4">📝</p>
                  <p className="text-zinc-400 mb-2">No trades recorded yet</p>
                  <p className="text-zinc-500 text-sm">Search for an asset above to get started</p>
                </div>
              )}
              {trades.map((t) => (
                <div key={t.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      <b className="text-lg">{t.asset}</b>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                        t.direction === "Buy" ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"
                      }`}>
                        {t.direction.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {t.pnl >= 0 ? "+" : ""}${t.pnl?.toFixed(2)}
                      </span>
                      <button
                        onClick={() => deleteTrade(t.id)}
                        className="text-zinc-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                        title="Delete trade"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    Entry: ${t.entry} → Exit: ${t.close_price} • Size: {t.original_size || t.size} {t.size_unit || ""}
                  </p>
                  {t.emotion && (
                    <p className="text-sm text-zinc-500 mt-1">🧠 Felt: {t.emotion}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ========== AI ANALYTICS TAB ========== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={fetchAnalytics}
                className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition"
              >
                🔄 Refresh Analytics
              </button>
            </div>

            {loadingAnalytics ? (
              <div className="text-center py-20">
                <div className="animate-spin text-4xl mb-4">🤖</div>
                <p className="text-zinc-400">Analyzing your trading patterns...</p>
              </div>
            ) : analytics && analytics.totalTrades > 0 ? (
              <>
                {analytics.motivation && (
                  <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-xl border border-purple-500/30">
                    <p className="text-purple-300 text-center font-medium">{analytics.motivation}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-400 text-sm">Win Rate</p>
                    <p className={`text-3xl font-bold ${parseFloat(analytics.summary.winRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {analytics.summary.winRate}%
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{analytics.summary.winningTrades}W / {analytics.summary.losingTrades}L</p>
                  </div>
                  
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-400 text-sm">Total P&L</p>
                    <p className={`text-3xl font-bold ${parseFloat(analytics.summary.totalPnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${analytics.summary.totalPnl}
                    </p>
                  </div>
                  
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-400 text-sm">Profit Factor</p>
                    <p className={`text-3xl font-bold ${parseFloat(analytics.summary.profitFactor) >= 1.5 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {analytics.summary.profitFactor}
                    </p>
                    <p className="text-xs text-zinc-500">Win/Loss Ratio</p>
                  </div>
                  
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-400 text-sm">Expectancy</p>
                    <p className={`text-2xl font-bold ${parseFloat(analytics.summary.expectancy) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${analytics.summary.expectancy}
                    </p>
                    <p className="text-xs text-zinc-500">Per trade</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-green-800/30">
                    <h3 className="font-bold text-green-400 mb-3">🏆 Best Performer</h3>
                    {analytics.assets.best ? (
                      <>
                        <p className="text-2xl font-bold">{analytics.assets.best.symbol}</p>
                        <p className="text-green-400 text-lg">+${analytics.assets.best.pnl}</p>
                        <p className="text-sm text-zinc-400">{analytics.assets.best.winRate}% win rate ({analytics.assets.best.trades} trades)</p>
                      </>
                    ) : (
                      <p className="text-zinc-500">No data yet</p>
                    )}
                  </div>
                  
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-red-800/30">
                    <h3 className="font-bold text-red-400 mb-3">⚠️ Needs Improvement</h3>
                    {analytics.assets.worst && analytics.assets.worst.symbol !== analytics.assets.best?.symbol ? (
                      <>
                        <p className="text-2xl font-bold">{analytics.assets.worst.symbol}</p>
                        <p className="text-red-400 text-lg">${analytics.assets.worst.pnl}</p>
                        <p className="text-sm text-zinc-400">{analytics.assets.worst.winRate}% win rate ({analytics.assets.worst.trades} trades)</p>
                      </>
                    ) : (
                      <p className="text-zinc-500">All assets are profitable!</p>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                  <h3 className="font-bold mb-4">📈 Direction Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-900/10 rounded-xl">
                      <p className="text-green-400 font-bold">BUY</p>
                      <p className={`text-2xl font-bold ${parseFloat(analytics.direction.buyWinRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {analytics.direction.buyWinRate}%
                      </p>
                      <p className="text-sm text-zinc-400">{analytics.direction.buyTrades} trades</p>
                      <p className={`text-sm ${parseFloat(analytics.direction.buyPnL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${analytics.direction.buyPnL}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-red-900/10 rounded-xl">
                      <p className="text-red-400 font-bold">SELL</p>
                      <p className={`text-2xl font-bold ${parseFloat(analytics.direction.sellWinRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {analytics.direction.sellWinRate}%
                      </p>
                      <p className="text-sm text-zinc-400">{analytics.direction.sellTrades} trades</p>
                      <p className={`text-sm ${parseFloat(analytics.direction.sellPnL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${analytics.direction.sellPnL}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900 p-4 rounded-xl border border-green-800/30 text-center">
                    <p className="text-sm text-zinc-400">🔥 Best Win Streak</p>
                    <p className="text-2xl font-bold text-green-400">{analytics.summary.maxWinStreak} trades</p>
                  </div>
                  <div className="bg-zinc-900 p-4 rounded-xl border border-red-800/30 text-center">
                    <p className="text-sm text-zinc-400">💀 Worst Loss Streak</p>
                    <p className="text-2xl font-bold text-red-400">{analytics.summary.maxLossStreak} trades</p>
                  </div>
                </div>

                {analytics.suggestions && analytics.suggestions.length > 0 && (
                  <div className="bg-blue-950/30 border border-blue-800/50 p-6 rounded-2xl">
                    <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                      💡 AI Trading Coach Insights
                    </h3>
                    <ul className="space-y-2">
                      {analytics.suggestions.map((suggestion: string, idx: number) => (
                        <li key={idx} className="text-zinc-300 text-sm flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">▶</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800">
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-zinc-400 mb-4">
                  {analytics?.message || "No trades yet. Add some trades to see AI insights!"}
                </p>
                <button
                  onClick={() => setActiveTab("journal")}
                  className="bg-yellow-500 text-black px-6 py-2 rounded-xl font-bold hover:bg-yellow-400 transition"
                >
                  Add Your First Trade
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* CUSTOM ASSET MODAL */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCustomModal(false)}>
          <div className="bg-zinc-900 p-6 rounded-2xl w-96 border border-zinc-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Add Custom Asset</h3>
            <input
              type="text"
              placeholder="Symbol (e.g., XAUUSD)"
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
              className="w-full p-3 bg-zinc-800 rounded-xl mb-3 border border-zinc-700 focus:border-blue-500 outline-none"
              autoFocus
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full p-3 bg-zinc-800 rounded-xl mb-4 border border-zinc-700 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-zinc-500 mb-4">
              You can add stocks, forex pairs, crypto, or any custom instrument
            </p>
            <div className="flex gap-3">
              <button onClick={handleAddCustomAsset} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-xl font-bold transition">
                Add Asset
              </button>
              <button onClick={() => setShowCustomModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-xl transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM EMOTION MODAL */}
      {showEmotionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEmotionModal(false)}>
          <div className="bg-zinc-900 p-6 rounded-2xl w-96 border border-zinc-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Add Custom Emotion</h3>
            <input
              type="text"
              placeholder="e.g., Euphoric, Panicked, Patient"
              value={customEmotion}
              onChange={(e) => setCustomEmotion(e.target.value)}
              className="w-full p-3 bg-zinc-800 rounded-xl mb-4 border border-zinc-700 focus:border-blue-500 outline-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={handleAddCustomEmotion} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-xl font-bold transition">
                Add Emotion
              </button>
              <button onClick={() => setShowEmotionModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-xl transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI ASSISTANT */}
      <AIAssistant />
    </main>
  )
}