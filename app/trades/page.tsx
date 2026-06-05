// /app/trades/page.tsx
"use client"

import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"
import { addCustomAsset } from "../data/assets"
import AIAssistant from "../components/AIAssistant"

export default function TradesPage() {
  // Asset search states
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)

  // Trade form states
  const [direction, setDirection] = useState("Buy")
  const [entry, setEntry] = useState("")
  const [closePrice, setClosePrice] = useState("")
  const [size, setSize] = useState("")
  const [emotion, setEmotion] = useState("")
  const [sizeUnit, setSizeUnit] = useState<"shares" | "lots" | "coins">("shares")

  // Trades list
  const [trades, setTrades] = useState<any[]>([])

  // Tab state
  const [activeTab, setActiveTab] = useState<"journal" | "analytics">("journal")
  const [analytics, setAnalytics] = useState<any>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  // Custom asset modal states
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customSymbol, setCustomSymbol] = useState("")
  const [customName, setCustomName] = useState("")

  // Emotion dropdown states
  const [showEmotionModal, setShowEmotionModal] = useState(false)
  const [customEmotion, setCustomEmotion] = useState("")
  const [customEmotions, setCustomEmotions] = useState<string[]>([])

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

  // Load custom emotions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('custom_emotions')
    if (saved) {
      try {
        setCustomEmotions(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // Helper function to determine asset type
  const getAssetType = (symbol: string): "stock" | "forex" | "crypto" | "commodity" => {
    const forexSymbols = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD", "XAUUSD", "XAGUSD", "XAUGBP", "XAGEUR"]
    const cryptoSymbols = ["BTCUSD", "ETHUSD", "SOLUSD", "DOGEUSD", "XRPUSD", "ADAUSD"]
    
    if (forexSymbols.includes(symbol)) return "forex"
    if (cryptoSymbols.includes(symbol)) return "crypto"
    return "stock"
  }

  // Auto-set size unit when asset is selected
  useEffect(() => {
    if (selectedAsset) {
      const type = getAssetType(selectedAsset)
      if (type === "forex") setSizeUnit("lots")
      else if (type === "crypto") setSizeUnit("coins")
      else setSizeUnit("shares")
    }
  }, [selectedAsset])

  // SEARCH ASSETS
  useEffect(() => {
    const fetchAssets = async () => {
      if (search.length < 1) {
        setResults([])
        return
      }

      setLoading(true)

      try {
        const res = await fetch(`/api/search?q=${search}`)
        const data = await res.json()
        
        if (data && Array.isArray(data)) {
          setResults(data)
        } else {
          console.warn("Search API did not return an array:", data)
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

  // FETCH TRADES
  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error(error)
        setTrades([])
      } else {
        setTrades(data || [])
      }
    } catch (err) {
      console.error(err)
      setTrades([])
    }
  }

  useEffect(() => {
    fetchTrades()
  }, [])

  // FETCH ANALYTICS
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true)
    try {
      const res = await fetch("/api/analytics")
      const data = await res.json()
      console.log("Analytics data:", data)
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
  const calculatePnL = () => {
    const e = parseFloat(entry)
    const c = parseFloat(closePrice)
    let s = parseFloat(size)

    if (isNaN(e) || isNaN(c) || isNaN(s)) return 0

    if (sizeUnit === "lots") {
      s = s * 100000
    }

    const diff = direction === "Buy" ? (c - e) : (e - c)
    return diff * s
  }

  // SAVE TRADE
  const saveTrade = async () => {
    if (!selectedAsset) {
      alert("Select an asset first")
      return
    }
    
    if (!entry || !closePrice || !size) {
      alert("Fill all trade fields")
      return
    }

    const entryNum = parseFloat(entry)
    const closeNum = parseFloat(closePrice)
    const sizeNum = parseFloat(size)

    if (isNaN(entryNum) || isNaN(closeNum) || isNaN(sizeNum)) {
      alert("Please enter valid numbers")
      return
    }

    let finalSize = sizeNum
    if (sizeUnit === "lots") {
      finalSize = sizeNum * 100000
    }

    const pnl = calculatePnL()
    
    const tradeData = {
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
        console.error(error)
        alert(`Error: ${error.message}`)
      } else {
        alert("Trade saved!")
        setEntry("")
        setClosePrice("")
        setSize("")
        setEmotion("")
        fetchTrades()
      }
    } catch (err) {
      console.error(err)
      alert("Failed to save trade")
    }
  }

  const handleAddCustomAsset = () => {
    if (!customSymbol.trim()) {
      alert("Please enter a symbol")
      return
    }
    
    const added = addCustomAsset(customSymbol, customName)
    
    if (added) {
      alert(`✅ "${customSymbol.toUpperCase()}" added!`)
      setShowCustomModal(false)
      setCustomSymbol("")
      setCustomName("")
    } else {
      alert(`❌ "${customSymbol.toUpperCase()}" already exists`)
    }
  }

  const handleAddCustomEmotion = () => {
    if (!customEmotion.trim()) {
      alert("Please enter an emotion")
      return
    }
    
    if (allEmotions.includes(customEmotion)) {
      alert("Emotion already exists")
      return
    }
    
    const updated = [...customEmotions, customEmotion]
    setCustomEmotions(updated)
    localStorage.setItem('custom_emotions', JSON.stringify(updated))
    setCustomEmotion("")
    setShowEmotionModal(false)
    alert(`✅ "${customEmotion}" added`)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />
      <section className="flex-1 p-8">
        <h1 className="text-4xl font-bold mb-2">Trading Journal</h1>
        <p className="text-zinc-400 mb-6">Professional trade tracking system with AI insights</p>

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
            📝 Trading Journal
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
              <div className="mb-4 p-4 bg-green-900/20 border border-green-600 rounded-xl">
                🔒 Locked Asset: <b>{selectedAsset}</b>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="ml-4 text-sm text-red-400 hover:text-red-300"
                >
                  Change
                </button>
              </div>
            )}

            {/* SEARCH INPUT */}
            {!selectedAsset && (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search TSLA, XAUUSD, BTCUSD..."
                className="w-full p-4 bg-zinc-900 border border-zinc-700 rounded-xl"
              />
            )}

            {/* SEARCH RESULTS */}
            {!selectedAsset && (
              <div className="mt-4 space-y-3">
                {loading && <p className="text-zinc-400">Searching...</p>}
                
                {!loading && results && results.length === 0 && search.length > 0 && (
                  <p className="text-zinc-500 text-center py-4">No assets found. Try a different symbol or add manually below.</p>
                )}
                
                {!loading && results && results.length > 0 && (
                  <>
                    {results.map((item, index) => (
                      <div
                        key={`${item.symbol}-${index}`}
                        onClick={() => {
                          setSelectedAsset(item.symbol)
                          setSearch("")
                          setResults([])
                        }}
                        className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-800"
                      >
                        <b>{item.symbol}</b>
                        <p className="text-sm text-zinc-400">{item.description || item.name}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ADD CUSTOM ASSET BUTTON */}
            {!selectedAsset && (
              <div className="mt-4">
                <button
                  onClick={() => setShowCustomModal(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  + Can't find an asset? Add it manually
                </button>
              </div>
            )}

            {/* TRADE FORM */}
            {selectedAsset && (
              <div className="mt-6 space-y-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="p-4 bg-zinc-800 rounded-xl"
                  >
                    <option>Buy</option>
                    <option>Sell</option>
                  </select>

                  <input
                    placeholder="Entry Price"
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    className="p-4 bg-zinc-800 rounded-xl"
                  />

                  <input
                    placeholder="Close Price"
                    value={closePrice}
                    onChange={(e) => setClosePrice(e.target.value)}
                    className="p-4 bg-zinc-800 rounded-xl"
                  />

                  <div className="space-y-2">
                    <div className="flex gap-3">
                      <input
                        placeholder={sizeUnit === "lots" ? "Lots (1 lot = 100,000 units)" : 
                                   sizeUnit === "coins" ? "Number of coins" : 
                                   "Number of shares"}
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="flex-1 p-4 bg-zinc-800 rounded-xl"
                      />
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSizeUnit("shares")}
                          className={`px-4 rounded-xl font-bold transition ${
                            sizeUnit === "shares" 
                              ? "bg-yellow-500 text-black" 
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          Shares
                        </button>
                        <button
                          onClick={() => setSizeUnit("lots")}
                          className={`px-4 rounded-xl font-bold transition ${
                            sizeUnit === "lots" 
                              ? "bg-yellow-500 text-black" 
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          Lots
                        </button>
                        <button
                          onClick={() => setSizeUnit("coins")}
                          className={`px-4 rounded-xl font-bold transition ${
                            sizeUnit === "coins" 
                              ? "bg-yellow-500 text-black" 
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          Coins
                        </button>
                      </div>
                    </div>
                    {size && (
                      <p className="text-xs text-zinc-500">
                        {sizeUnit === "lots" && `📊 Position size: ${parseFloat(size) * 100000} units`}
                        {sizeUnit === "shares" && `📈 Position size: ${size} shares`}
                        {sizeUnit === "coins" && `🪙 Position size: ${size} coins`}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <select
                      value={emotion}
                      onChange={(e) => {
                        if (e.target.value === "___add_new___") {
                          setShowEmotionModal(true)
                        } else {
                          setEmotion(e.target.value)
                        }
                      }}
                      className="w-full p-4 bg-zinc-800 rounded-xl cursor-pointer"
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
            {selectedAsset && (
              <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex justify-between">
                <span>Estimated PnL</span>
                <span className={calculatePnL() >= 0 ? "text-green-400" : "text-red-400"}>
                  ${calculatePnL().toFixed(2)}
                </span>
              </div>
            )}

            {/* SAVE BUTTON */}
            {selectedAsset && (
              <button
                onClick={saveTrade}
                className="mt-4 bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
              >
                Save Trade
              </button>
            )}

            {/* TRADE HISTORY */}
            <div className="mt-8 space-y-3">
              <h2 className="text-2xl font-bold mb-4">Trade History</h2>
              {trades.length === 0 && (
                <p className="text-zinc-500 text-center py-8">No trades yet. Start by adding one above!</p>
              )}
              {trades.map((t) => (
                <div key={t.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <div className="flex justify-between">
                    <b>{t.asset}</b>
                    <span className={t.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                      ${t.pnl?.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    {t.direction} | Entry: ${t.entry} | Close: ${t.close_price} | Size: {t.original_size || t.size} {t.size_unit || ""}
                  </p>
                  {t.emotion && <p className="text-sm text-zinc-500">Emotion: {t.emotion}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ========== AI ANALYTICS TAB ========== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Refresh Button */}
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
                {/* Motivation Message */}
                {analytics.motivation && (
                  <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-xl border border-purple-500/30">
                    <p className="text-purple-300 text-center font-medium">{analytics.motivation}</p>
                  </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-400 text-sm">Win Rate</p>
                    <p className={`text-3xl font-bold ${parseFloat(analytics.summary.winRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {analytics.summary.winRate}%
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{analytics.summary.winningTrades}W / {analytics.summary.losingTrades}L</p>
                  </div>
                  
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-400 text-sm">Total PnL</p>
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
                    <p className="text-zinc-400 text-sm">Expectancy/Trade</p>
                    <p className={`text-2xl font-bold ${parseFloat(analytics.summary.expectancy) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${analytics.summary.expectancy}
                    </p>
                  </div>
                </div>

                {/* Best/Worst Assets */}
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

                {/* Direction Analysis */}
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

                {/* Streaks */}
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

                {/* AI SUGGESTIONS */}
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
              <div className="text-center py-20 bg-zinc-900 rounded-2xl">
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-zinc-400 mb-4">
                  {analytics?.message || "No trades yet. Add some trades to see AI insights!"}
                </p>
                <p className="text-sm text-zinc-500 mb-4">
                  Total trades found: {analytics?.totalTrades || 0}
                </p>
                <button
                  onClick={() => setActiveTab("journal")}
                  className="bg-yellow-500 text-black px-6 py-2 rounded-xl font-bold"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-2xl w-96 border border-zinc-700">
            <h3 className="text-xl font-bold mb-4">Add Custom Asset</h3>
            <input
              type="text"
              placeholder="Symbol (e.g., XAUUSD)"
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
              className="w-full p-3 bg-zinc-800 rounded-xl mb-3 border border-zinc-700 focus:border-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full p-3 bg-zinc-800 rounded-xl mb-4 border border-zinc-700 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-zinc-500 mb-4">
              Tip: You can add any symbol including forex, crypto, or custom instruments
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-2xl w-96 border border-zinc-700">
            <h3 className="text-xl font-bold mb-4">Add Custom Emotion</h3>
            <input
              type="text"
              placeholder="e.g., Euphoric, Panicked, Patient"
              value={customEmotion}
              onChange={(e) => setCustomEmotion(e.target.value)}
              className="w-full p-3 bg-zinc-800 rounded-xl mb-4 border border-zinc-700 focus:border-blue-500 outline-none"
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

      {/* REAL AI ASSISTANT - DeepSeek Powered */}
      <AIAssistant />
    </main>
  )
}