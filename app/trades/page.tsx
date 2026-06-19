"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"
import { addCustomAsset, getCustomAssets } from "../data/assets"
import AIAssistant from "../components/AIAssistant"
import AppLoader from "../components/AppLoader"

interface Trade {
  id: string; asset: string; direction: string; entry: number; close_price: number
  size: number; size_unit?: string; original_size?: number; emotion?: string; pnl: number; created_at: string
}

interface SearchResult {
  symbol: string; name: string; exchange: string; type: string; price: number | null; change: number | null
}

interface AnalyticsData {
  totalTrades: number
  summary: { winRate: string; winningTrades: number; losingTrades: number; totalPnl: string; profitFactor: string; expectancy: string; maxWinStreak: number; maxLossStreak: number }
  assets: { best: { symbol: string; pnl: string; trades: number; winRate: string } | null; worst: { symbol: string; pnl: string; trades: number; winRate: string } | null }
  direction: { buyWinRate: string; buyTrades: number; buyPnL: string; sellWinRate: string; sellTrades: number; sellPnL: string }
  suggestions: string[]; warnings: string[]; motivation: string; message?: string
}

export default function TradesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [selectedAssetData, setSelectedAssetData] = useState<SearchResult | null>(null)
  const [direction, setDirection] = useState("Buy")
  const [entry, setEntry] = useState("")
  const [closePrice, setClosePrice] = useState("")
  const [size, setSize] = useState("")
  const [emotion, setEmotion] = useState("")
  const [sizeUnit, setSizeUnit] = useState<"shares" | "lots" | "coins">("shares")
  const [trades, setTrades] = useState<Trade[]>([])
  const [activeTab, setActiveTab] = useState<"journal" | "analytics">("journal")
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customSymbol, setCustomSymbol] = useState("")
  const [customName, setCustomName] = useState("")
  const [showEmotionModal, setShowEmotionModal] = useState(false)
  const [customEmotion, setCustomEmotion] = useState("")
  const [customEmotions, setCustomEmotions] = useState<string[]>([])
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [recentAssets, setRecentAssets] = useState<string[]>([])

  const defaultEmotions = ["😌 Calm","😊 Confident","🤔 Hesitant","😰 Anxious","😤 Impatient","😨 Fearful","🤑 Greedy","😓 Stressed","😎 Overconfident","🤷 Unsure","🎯 Focused","😴 Tired"]
  const allEmotions = [...defaultEmotions, ...customEmotions]

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type }); setTimeout(() => setNotification(null), 3000)
  }

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth") } else { setUserId(user.id) }
      setAuthChecked(true)
    }; checkAuth()
  }, [router])

  // Load saved data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("custom_emotions")
      if (saved) { try { setCustomEmotions(JSON.parse(saved)) } catch (e) {} }
      const savedAssets = localStorage.getItem("recent_assets")
      if (savedAssets) { try { setRecentAssets(JSON.parse(savedAssets)) } catch (e) {} }
    }
  }, [])

  const saveToRecentAssets = (symbol: string) => {
    const updated = [symbol, ...recentAssets.filter(a => a !== symbol)].slice(0, 20)
    setRecentAssets(updated)
    if (typeof window !== "undefined") localStorage.setItem("recent_assets", JSON.stringify(updated))
  }

  const getAssetType = useCallback((symbol: string): "stock" | "forex" | "crypto" | "commodity" => {
    const forexSymbols = ["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","USDCHF","NZDUSD","XAUUSD","XAGUSD","XAUGBP","XAGEUR"]
    const cryptoSymbols = ["BTCUSD","ETHUSD","SOLUSD","DOGEUSD","XRPUSD","ADAUSD"]
    if (forexSymbols.includes(symbol.toUpperCase())) return "forex"
    if (cryptoSymbols.includes(symbol.toUpperCase())) return "crypto"
    return "stock"
  }, [])

  useEffect(() => {
    if (selectedAsset) {
      const type = getAssetType(selectedAsset)
      if (type === "forex") setSizeUnit("lots")
      else if (type === "crypto") setSizeUnit("coins")
      else setSizeUnit("shares")
    }
  }, [selectedAsset, getAssetType])

  // Search assets
  useEffect(() => {
    const fetchAssets = async () => {
      if (search.length < 1) { setResults([]); return }
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`)
        const apiResults = await res.json()
        const apiData = Array.isArray(apiResults) ? apiResults : []
        const customAssets = getCustomAssets()
        const matchingCustom = customAssets.filter(a => a.symbol.toUpperCase().includes(search.toUpperCase())).map(a => ({ symbol: a.symbol, name: a.name || a.symbol, exchange: "CUSTOM", type: a.type, price: null, change: null }))
        const matchingRecent = recentAssets.filter(a => a.toUpperCase().includes(search.toUpperCase())).filter(a => !apiData.find((r: SearchResult) => r.symbol === a)).filter(a => !matchingCustom.find((r: any) => r.symbol === a)).map(a => ({ symbol: a, name: a, exchange: "RECENT", type: getAssetType(a), price: null, change: null }))
        setResults([...apiData, ...matchingRecent, ...matchingCustom])
      } catch (error) { setResults([]) } finally { setLoading(false) }
    }
    const delay = setTimeout(fetchAssets, 200)
    return () => clearTimeout(delay)
  }, [search, recentAssets])

  // Fetch trades for current user
  const fetchTrades = useCallback(async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase.from("trades").select("*").eq("user_id", userId).order("created_at", { ascending: false })
      if (error) { setTrades([]) } else { setTrades(data || []) }
    } catch (err) { setTrades([]) } finally { setPageLoading(false) }
  }, [userId])

  useEffect(() => { if (userId) fetchTrades() }, [userId, fetchTrades])

  // Fetch analytics with auth token
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setAnalytics({ totalTrades: 0, message: "Please log in to see analytics" } as any)
        setLoadingAnalytics(false)
        return
      }
      const res = await fetch("/api/analytics", {
        headers: { "Authorization": `Bearer ${session.access_token}`, "Content-Type": "application/json" }
      })
      const data = await res.json()
      setAnalytics(data)
    } catch (error) { console.error("Failed to fetch analytics:", error) }
    finally { setLoadingAnalytics(false) }
  }

  useEffect(() => { if (activeTab === "analytics") fetchAnalytics() }, [activeTab])

  // P&L Calculation
  const calculatePnL = useCallback(() => {
    const e = parseFloat(entry), c = parseFloat(closePrice); let s = parseFloat(size)
    if (isNaN(e) || isNaN(c) || isNaN(s)) return 0
    if (sizeUnit === "lots") s = s * 100000
    return direction === "Buy" ? (c - e) * s : (e - c) * s
  }, [entry, closePrice, size, sizeUnit, direction])

  // Save trade
  const saveTrade = async () => {
    if (!selectedAsset) { showNotification("Select an asset first", "error"); return }
    if (!entry || !closePrice || !size) { showNotification("Fill all trade fields", "error"); return }
    const entryNum = parseFloat(entry), closeNum = parseFloat(closePrice), sizeNum = parseFloat(size)
    if (isNaN(entryNum) || isNaN(closeNum) || isNaN(sizeNum)) { showNotification("Enter valid numbers", "error"); return }
    let finalSize = sizeNum; if (sizeUnit === "lots") finalSize = sizeNum * 100000
    const pnl = calculatePnL()
    if (!userId) { showNotification("You must be logged in", "error"); return }
    try {
      const { error } = await supabase.from("trades").insert([{ user_id: userId, asset: selectedAsset, direction, entry: entryNum, close_price: closeNum, size: finalSize, size_unit: sizeUnit, original_size: sizeNum, emotion: emotion || null, pnl }])
      if (error) { showNotification(`Error: ${error.message}`, "error") }
      else { saveToRecentAssets(selectedAsset); showNotification("Trade saved!", "success"); setEntry(""); setClosePrice(""); setSize(""); setEmotion(""); fetchTrades() }
    } catch (err) { showNotification("Failed to save trade", "error") }
  }

  // Delete trade
  const deleteTrade = async (id: string) => {
    try {
      const { error } = await supabase.from("trades").delete().eq("id", id)
      if (error) showNotification(`Error: ${error.message}`, "error")
      else { showNotification("Trade deleted", "success"); fetchTrades() }
    } catch (err) { showNotification("Failed to delete", "error") }
  }

  // Add custom asset
  const handleAddCustomAsset = () => {
    if (!customSymbol.trim()) { showNotification("Enter a symbol", "error"); return }
    const added = addCustomAsset(customSymbol.toUpperCase(), customName)
    if (added) { saveToRecentAssets(customSymbol.toUpperCase()); showNotification(`"${customSymbol.toUpperCase()}" added!`, "success"); setShowCustomModal(false); setCustomSymbol(""); setCustomName("") }
    else { showNotification(`"${customSymbol.toUpperCase()}" already in your custom list`, "error") }
  }

  // Add custom emotion
  const handleAddCustomEmotion = () => {
    if (!customEmotion.trim()) { showNotification("Enter an emotion", "error"); return }
    if (allEmotions.includes(customEmotion)) { showNotification("Already exists", "error"); return }
    const updated = [...customEmotions, customEmotion]; setCustomEmotions(updated)
    if (typeof window !== "undefined") localStorage.setItem("custom_emotions", JSON.stringify(updated))
    setCustomEmotion(""); setShowEmotionModal(false); showNotification(`"${customEmotion}" added`, "success")
  }

  // Select asset from search - auto-fill prices
  const selectAsset = (item: SearchResult) => {
    setSelectedAsset(item.symbol); setSelectedAssetData(item); setSearch(""); setResults([])
    if (item.price) {
      setEntry(item.price.toString())
      const assetType = getAssetType(item.symbol)
      if (assetType === "forex") setClosePrice((item.price + 0.0005).toFixed(5))
      else if (assetType === "crypto") setClosePrice((item.price + 50).toFixed(2))
      else setClosePrice((item.price + 5).toFixed(2))
    } else { setEntry(""); setClosePrice("") }
  }

  // Loading state
  if (!authChecked || pageLoading) return <AppLoader message="Loading Trading Journal" />

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />
      <section className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Notification */}
        {notification && <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl font-bold shadow-lg transition-all animate-bounce ${notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>{notification.message}</div>}

        <h1 className="text-3xl md:text-4xl font-bold mb-2">Trading Journal</h1>
        <p className="text-zinc-400 mb-6">Track your trades with real-time market data</p>

        {/* Tab Switcher */}
        <div className="flex gap-4 mb-6 border-b border-zinc-800">
          <button onClick={() => setActiveTab("journal")} className={`pb-2 px-4 font-bold transition ${activeTab === "journal" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-zinc-400 hover:text-white"}`}>📝 Trade Journal</button>
          <button onClick={() => setActiveTab("analytics")} className={`pb-2 px-4 font-bold transition ${activeTab === "analytics" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-zinc-400 hover:text-white"}`}>🤖 AI Analytics</button>
        </div>

        {/* ========== JOURNAL TAB ========== */}
        {activeTab === "journal" && (
          <>
            {/* Selected Asset Banner */}
            {selectedAsset && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-600 rounded-xl flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">Selected:</span>
                  <b className="text-white text-lg">{selectedAsset}</b>
                  {selectedAssetData?.price && <span className="text-sm text-green-400 font-semibold">Live: ${selectedAssetData.price.toFixed(2)}</span>}
                </div>
                <button onClick={() => { setSelectedAsset(null); setSelectedAssetData(null); setEntry(""); setClosePrice("") }} className="text-sm text-red-400 hover:text-red-300 transition">✕ Change</button>
              </div>
            )}

            {/* Search Input */}
            {!selectedAsset && (
              <div className="relative">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type 2-3 letters to search... (TSLA, AAPL, BTCUSD)" className="w-full p-4 pl-12 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition text-lg" autoComplete="off" />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xl">🔍</span>
                {search && <button onClick={() => { setSearch(""); setResults([]) }} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition">✕</button>}
              </div>
            )}

            {/* Search Results */}
            {!selectedAsset && !loading && results.length > 0 && (
              <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider flex justify-between"><span>Results ({results.length})</span><span className="text-zinc-600">Click to select</span></div>
                {results.map((item, index) => (
                  <div key={`${item.symbol}-${index}`} onClick={() => selectAsset(item)} className="flex items-center justify-between p-4 hover:bg-zinc-800 cursor-pointer transition border-b border-zinc-800/50 last:border-b-0 group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${item.type === "crypto" ? "bg-orange-900/30 text-orange-400" : item.type === "forex" ? "bg-blue-900/30 text-blue-400" : item.exchange === "RECENT" ? "bg-yellow-900/30 text-yellow-400" : item.exchange === "CUSTOM" ? "bg-purple-900/30 text-purple-400" : "bg-green-900/30 text-green-400"}`}>{item.symbol.charAt(0)}</div>
                      <div>
                        <div className="flex items-center gap-2"><b className="text-white group-hover:text-yellow-400 transition">{item.symbol}</b><span className={`text-xs px-2 py-0.5 rounded ${item.exchange === "RECENT" ? "bg-yellow-900/50 text-yellow-400" : item.exchange === "CUSTOM" ? "bg-purple-900/50 text-purple-400" : "bg-zinc-800 text-zinc-400"}`}>{item.exchange === "RECENT" ? "Recent" : item.exchange === "CUSTOM" ? "Custom" : item.exchange}</span></div>
                        <p className="text-sm text-zinc-400">{item.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {item.price && <p className="text-white font-semibold">${item.price.toFixed(2)}</p>}
                      {item.change !== null && item.change !== undefined && <p className={`text-sm font-medium ${item.change >= 0 ? "text-green-400" : "text-red-400"}`}>{item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading State */}
            {loading && <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center"><div className="animate-spin text-3xl mb-3">🔍</div><p className="text-zinc-400">Searching markets...</p></div>}

            {/* No Results */}
            {!loading && search.length > 0 && results.length === 0 && (
              <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center">
                <p className="text-4xl mb-3">🔍</p><p className="text-zinc-400 mb-2">No results for "<b className="text-white">{search}</b>"</p>
                <button onClick={() => setShowCustomModal(true)} className="text-blue-400 hover:text-blue-300 text-sm transition">+ Add "{search.toUpperCase()}" as custom asset</button>
              </div>
            )}

            {/* Add Custom Asset Button */}
            {!selectedAsset && search.length === 0 && (
              <div className="mt-4"><button onClick={() => setShowCustomModal(true)} className="text-sm text-blue-400 hover:text-blue-300 transition">+ Add custom asset manually</button></div>
            )}

            {/* Trade Form */}
            {selectedAsset && (
              <div className="mt-6 space-y-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <h3 className="text-lg font-bold text-yellow-500 mb-2">New Trade — {selectedAsset}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-zinc-400 text-sm mb-1">Direction</label>
                    <select value={direction} onChange={(e) => setDirection(e.target.value)} className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none">
                      <option value="Buy">🟢 Buy (Long)</option><option value="Sell">🔴 Sell (Short)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-sm mb-1">
                      Entry Price
                      {selectedAssetData?.price && <span className="text-green-400 text-xs ml-2">← Live: ${selectedAssetData.price.toFixed(2)}</span>}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={entry}
                      onChange={(e) => setEntry(e.target.value)}
                      placeholder={selectedAssetData?.price ? `Market: ${selectedAssetData.price.toFixed(2)}` : "Entry price"}
                      className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-sm mb-1">
                      Close Price
                      {entry && !closePrice && <span className="text-zinc-500 text-xs ml-2">(Suggested: ${(parseFloat(entry) + 5).toFixed(2)})</span>}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={closePrice}
                      onChange={(e) => setClosePrice(e.target.value)}
                      placeholder={entry ? `Suggested: ${(parseFloat(entry) + 5).toFixed(2)}` : "Exit price"}
                      className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-sm mb-1">Size</label>
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        <input
                          type="number"
                          step="any"
                          placeholder={sizeUnit === "lots" ? "Number of lots" : sizeUnit === "coins" ? "Number of coins" : "Number of shares"}
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                          className="flex-1 p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none"
                        />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setSizeUnit("shares")} className={`px-3 rounded-xl font-bold text-sm transition ${sizeUnit === "shares" ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>Shares</button>
                          <button type="button" onClick={() => setSizeUnit("lots")} className={`px-3 rounded-xl font-bold text-sm transition ${sizeUnit === "lots" ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>Lots</button>
                          <button type="button" onClick={() => setSizeUnit("coins")} className={`px-3 rounded-xl font-bold text-sm transition ${sizeUnit === "coins" ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>Coins</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-zinc-400 text-sm mb-1">Emotion (optional)</label>
                    <select value={emotion} onChange={(e) => { if (e.target.value === "___add_new___") setShowEmotionModal(true); else setEmotion(e.target.value) }} className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none cursor-pointer">
                      <option value="">Select your emotion...</option>
                      {allEmotions.map((e) => (<option key={e} value={e}>{e}</option>))}
                      <option disabled>──────────</option>
                      <option value="___add_new___">➕ Add custom emotion...</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* P&L Display */}
            {selectedAsset && entry && closePrice && size && (
              <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex justify-between items-center">
                <span className="text-zinc-400">Estimated P&L</span>
                <span className={`text-xl font-bold ${calculatePnL() >= 0 ? "text-green-400" : "text-red-400"}`}>{calculatePnL() >= 0 ? "+" : ""}${calculatePnL().toFixed(2)}</span>
              </div>
            )}

            {/* Action Buttons */}
            {selectedAsset && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={saveTrade} className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-xl font-bold transition">💾 Save Trade</button>
                <button onClick={() => { setEntry(""); setClosePrice(""); setSize(""); setEmotion("") }} className="bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-700 transition">🔄 Clear Form</button>
                <button onClick={() => { setSelectedAsset(null); setSelectedAssetData(null); setEntry(""); setClosePrice(""); setSize(""); setEmotion(""); setSearch(""); setResults([]) }} className="bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-600 transition">➕ New Asset</button>
              </div>
            )}

            {/* Trade History */}
            <div className="mt-8 space-y-3">
              <h2 className="text-2xl font-bold mb-4">Trade History{trades.length > 0 && <span className="text-sm text-zinc-500 ml-2 font-normal">({trades.length} trades)</span>}</h2>
              {trades.length === 0 && <div className="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800"><p className="text-4xl mb-4">📝</p><p className="text-zinc-400 mb-2">No trades yet</p><p className="text-zinc-500 text-sm">Search for an asset above to get started</p></div>}
              {trades.map((t) => (
                <div key={t.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-wrap"><b className="text-lg">{t.asset}</b><span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${t.direction === "Buy" ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>{t.direction.toUpperCase()}</span></div>
                    <div className="flex items-center gap-3"><span className={`text-lg font-bold ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{t.pnl >= 0 ? "+" : ""}${t.pnl?.toFixed(2)}</span><button onClick={() => deleteTrade(t.id)} className="text-zinc-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100" title="Delete trade">🗑️</button></div>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">Entry: ${t.entry} → Exit: ${t.close_price} • Size: {t.original_size || t.size} {t.size_unit || ""}</p>
                  {t.emotion && <p className="text-sm text-zinc-500 mt-1">🧠 {t.emotion}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ========== AI ANALYTICS TAB ========== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex justify-end"><button onClick={fetchAnalytics} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition">🔄 Refresh Analytics</button></div>
            {loadingAnalytics ? (
              <div className="text-center py-20"><div className="animate-spin text-4xl mb-4">🤖</div><p className="text-zinc-400">Analyzing your trading patterns...</p></div>
            ) : analytics && analytics.totalTrades > 0 ? (
              <>
                {analytics.motivation && <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-xl border border-purple-500/30"><p className="text-purple-300 text-center font-medium">{analytics.motivation}</p></div>}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800"><p className="text-zinc-400 text-sm">Win Rate</p><p className={`text-3xl font-bold ${parseFloat(analytics.summary.winRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>{analytics.summary.winRate}%</p><p className="text-xs text-zinc-500 mt-1">{analytics.summary.winningTrades}W / {analytics.summary.losingTrades}L</p></div>
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800"><p className="text-zinc-400 text-sm">Total P&L</p><p className={`text-3xl font-bold ${parseFloat(analytics.summary.totalPnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>${analytics.summary.totalPnl}</p></div>
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800"><p className="text-zinc-400 text-sm">Profit Factor</p><p className={`text-3xl font-bold ${parseFloat(analytics.summary.profitFactor) >= 1.5 ? 'text-green-400' : 'text-yellow-400'}`}>{analytics.summary.profitFactor}</p></div>
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800"><p className="text-zinc-400 text-sm">Expectancy</p><p className={`text-2xl font-bold ${parseFloat(analytics.summary.expectancy) >= 0 ? 'text-green-400' : 'text-red-400'}`}>${analytics.summary.expectancy}</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-green-800/30"><h3 className="font-bold text-green-400 mb-3">🏆 Best Performer</h3>{analytics.assets.best ? <><p className="text-2xl font-bold">{analytics.assets.best.symbol}</p><p className="text-green-400 text-lg">+${analytics.assets.best.pnl}</p><p className="text-sm text-zinc-400">{analytics.assets.best.winRate}% win rate ({analytics.assets.best.trades} trades)</p></> : <p className="text-zinc-500">No data yet</p>}</div>
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-red-800/30"><h3 className="font-bold text-red-400 mb-3">⚠️ Needs Improvement</h3>{analytics.assets.worst ? <><p className="text-2xl font-bold">{analytics.assets.worst.symbol}</p><p className="text-red-400 text-lg">${analytics.assets.worst.pnl}</p><p className="text-sm text-zinc-400">{analytics.assets.worst.winRate}% win rate ({analytics.assets.worst.trades} trades)</p></> : <p className="text-zinc-500">All assets profitable!</p>}</div>
                </div>
                {analytics.suggestions && analytics.suggestions.length > 0 && (
                  <div className="bg-blue-950/30 border border-blue-800/50 p-6 rounded-2xl"><h3 className="font-bold text-blue-400 mb-3">💡 AI Insights</h3><ul className="space-y-2">{analytics.suggestions.map((s: string, idx: number) => (<li key={idx} className="text-zinc-300 text-sm flex items-start gap-2"><span className="text-blue-400 mt-0.5">▶</span>{s}</li>))}</ul></div>
                )}
                {analytics.warnings && analytics.warnings.length > 0 && (
                  <div className="bg-red-950/20 border border-red-800/30 p-6 rounded-2xl"><h3 className="font-bold text-red-400 mb-3">⚠️ Warnings</h3><ul className="space-y-2">{analytics.warnings.map((w: string, idx: number) => (<li key={idx} className="text-zinc-300 text-sm flex items-start gap-2"><span className="text-red-400 mt-0.5">⚠</span>{w}</li>))}</ul></div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800"><div className="text-6xl mb-4">🤖</div><p className="text-zinc-400 mb-4">{analytics?.message || "No trades yet. Add some trades to see AI insights!"}</p><button onClick={() => setActiveTab("journal")} className="bg-yellow-500 text-black px-6 py-2 rounded-xl font-bold hover:bg-yellow-400 transition">Add Your First Trade</button></div>
            )}
          </div>
        )}
      </section>

      {/* Custom Asset Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCustomModal(false)}>
          <div className="bg-zinc-900 p-6 rounded-2xl w-96 border border-zinc-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Add Custom Asset</h3>
            <input type="text" placeholder="Symbol (e.g., XAUUSD)" value={customSymbol} onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())} className="w-full p-3 bg-zinc-800 rounded-xl mb-3 border border-zinc-700 focus:border-blue-500 outline-none" autoFocus />
            <input type="text" placeholder="Name (optional)" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full p-3 bg-zinc-800 rounded-xl mb-4 border border-zinc-700 focus:border-blue-500 outline-none" />
            <p className="text-xs text-zinc-500 mb-4">Custom assets appear in your search history for quick access</p>
            <div className="flex gap-3"><button onClick={handleAddCustomAsset} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-xl font-bold transition">Add Asset</button><button onClick={() => setShowCustomModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-xl transition">Cancel</button></div>
          </div>
        </div>
      )}

      {/* Custom Emotion Modal */}
      {showEmotionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEmotionModal(false)}>
          <div className="bg-zinc-900 p-6 rounded-2xl w-96 border border-zinc-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Add Custom Emotion</h3>
            <input type="text" placeholder="e.g., Euphoric, Panicked, Patient" value={customEmotion} onChange={(e) => setCustomEmotion(e.target.value)} className="w-full p-3 bg-zinc-800 rounded-xl mb-4 border border-zinc-700 focus:border-blue-500 outline-none" autoFocus />
            <div className="flex gap-3"><button onClick={handleAddCustomEmotion} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-xl font-bold transition">Add Emotion</button><button onClick={() => setShowEmotionModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-xl transition">Cancel</button></div>
          </div>
        </div>
      )}

      <AIAssistant />
    </main>
  )
}