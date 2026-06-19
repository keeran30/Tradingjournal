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
  size: number; size_unit?: string; original_size?: number; emotion?: string; pnl: number; created_at: string; user_id: string
}

interface SearchResult {
  symbol: string; name: string; exchange: string; type: string; price: number | null; change: number | null
}

interface AnalyticsData {
  success: boolean; totalTrades: number
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

  // Check auth - get user on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth"); return }
      setUserId(user.id)
      setAuthChecked(true)
    }
    checkAuth()
  }, [router])

  // Load saved data
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedEmotions = localStorage.getItem("custom_emotions")
        if (savedEmotions) setCustomEmotions(JSON.parse(savedEmotions))
        const savedAssets = localStorage.getItem("recent_assets")
        if (savedAssets) setRecentAssets(JSON.parse(savedAssets))
      } catch (e) {}
    }
  }, [])

  const saveToRecentAssets = (symbol: string) => {
    const updated = [symbol, ...recentAssets.filter(a => a !== symbol)].slice(0, 20)
    setRecentAssets(updated)
    localStorage.setItem("recent_assets", JSON.stringify(updated))
  }

  const getAssetType = useCallback((symbol: string): string => {
    const forex = ["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","USDCHF","NZDUSD","XAUUSD","XAGUSD","XAUGBP","XAGEUR"]
    const crypto = ["BTCUSD","ETHUSD","SOLUSD","DOGEUSD","XRPUSD","ADAUSD"]
    if (forex.includes(symbol.toUpperCase())) return "forex"
    if (crypto.includes(symbol.toUpperCase())) return "crypto"
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
    if (search.length < 1) { setResults([]); return }
    setLoading(true)
    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`)
        const apiResults = await res.json()
        const apiData = Array.isArray(apiResults) ? apiResults : []
        const customs = getCustomAssets().filter(a => a.symbol.toUpperCase().includes(search.toUpperCase())).map(a => ({ symbol: a.symbol, name: a.name || a.symbol, exchange: "CUSTOM", type: a.type, price: null, change: null }))
        const recents = recentAssets.filter(a => a.toUpperCase().includes(search.toUpperCase())).filter(a => !apiData.find((r: any) => r.symbol === a) && !customs.find((r: any) => r.symbol === a)).map(a => ({ symbol: a, name: a, exchange: "RECENT", type: getAssetType(a), price: null, change: null }))
        setResults([...apiData, ...recents, ...customs])
      } catch (e) { setResults([]) }
      finally { setLoading(false) }
    }, 200)
    return () => clearTimeout(delay)
  }, [search, recentAssets])

  // Fetch trades for current user
  const fetchTrades = useCallback(async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase.from("trades").select("*").eq("user_id", userId).order("created_at", { ascending: false })
      if (error) { console.error("Fetch error:", error); setTrades([]) }
      else { setTrades(data || []) }
    } catch (err) { setTrades([]) }
    finally { setPageLoading(false) }
  }, [userId])

  useEffect(() => {
    if (userId) fetchTrades()
  }, [userId, fetchTrades])

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    if (!userId) return
    setLoadingAnalytics(true)
    try {
      const res = await fetch(`/api/analytics?userId=${userId}`)
      const data = await res.json()
      setAnalytics(data)
    } catch (e) { console.error(e) }
    finally { setLoadingAnalytics(false) }
  }, [userId])

  useEffect(() => {
    if (activeTab === "analytics" && userId) fetchAnalytics()
  }, [activeTab, userId, fetchAnalytics])

  const calculatePnL = useCallback(() => {
    const e = parseFloat(entry), c = parseFloat(closePrice); let s = parseFloat(size)
    if (isNaN(e) || isNaN(c) || isNaN(s)) return 0
    if (sizeUnit === "lots") s = s * 100000
    return direction === "Buy" ? (c - e) * s : (e - c) * s
  }, [entry, closePrice, size, sizeUnit, direction])

  // Save trade
  const saveTrade = async () => {
    if (!selectedAsset) { showNotification("Select an asset first", "error"); return }
    if (!entry || !closePrice || !size) { showNotification("Fill all fields", "error"); return }
    const e = parseFloat(entry), c = parseFloat(closePrice), sz = parseFloat(size)
    if (isNaN(e) || isNaN(c) || isNaN(sz)) { showNotification("Enter valid numbers", "error"); return }
    let fs = sz; if (sizeUnit === "lots") fs = sz * 100000
    const pnl = calculatePnL()
    if (!userId) { showNotification("Please log in", "error"); return }

    const tradeData = {
      user_id: userId,
      asset: selectedAsset,
      direction,
      entry: e,
      close_price: c,
      size: fs,
      size_unit: sizeUnit,
      original_size: sz,
      emotion: emotion || null,
      pnl,
    }

    const { error } = await supabase.from("trades").insert([tradeData])
    if (error) { showNotification(error.message, "error"); return }
    
    saveToRecentAssets(selectedAsset)
    showNotification("Trade saved!", "success")
    setEntry(""); setClosePrice(""); setSize(""); setEmotion("")
    fetchTrades()
  }

  // Delete trade
  const deleteTrade = async (id: string) => {
    const { error } = await supabase.from("trades").delete().eq("id", id)
    if (error) showNotification(error.message, "error")
    else { showNotification("Deleted", "success"); fetchTrades() }
  }

  // Select asset
  const selectAsset = async (item: SearchResult) => {
    setSelectedAsset(item.symbol)
    setSelectedAssetData(item)
    setSearch(""); setResults([])
    
    if (item.price) {
      setEntry(item.price.toString())
      const t = getAssetType(item.symbol)
      if (t === "forex") setClosePrice((item.price + 0.0005).toFixed(5))
      else if (t === "crypto") setClosePrice((item.price + 50).toFixed(2))
      else setClosePrice((item.price + 5).toFixed(2))
    }
  }

  if (!authChecked || pageLoading) return <AppLoader message="Loading Trading Journal" />

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />
      <section className="flex-1 p-4 md:p-8 overflow-y-auto">
        {notification && <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl font-bold shadow-lg ${notification.type === "success" ? "bg-green-600" : "bg-red-600"}`}>{notification.message}</div>}

        <h1 className="text-3xl md:text-4xl font-bold mb-2">Trading Journal</h1>
        <p className="text-zinc-400 mb-6">Track your trades with real-time market data</p>

        <div className="flex gap-4 mb-6 border-b border-zinc-800">
          <button onClick={() => setActiveTab("journal")} className={`pb-2 px-4 font-bold ${activeTab === "journal" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-zinc-400"}`}>📝 Trade Journal</button>
          <button onClick={() => setActiveTab("analytics")} className={`pb-2 px-4 font-bold ${activeTab === "analytics" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-zinc-400"}`}>🤖 AI Analytics</button>
        </div>

        {activeTab === "journal" && (
          <>
            {selectedAsset && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-600 rounded-xl flex justify-between items-center">
                <div><span className="text-zinc-400">Selected: </span><b className="text-white text-lg">{selectedAsset}</b>{selectedAssetData?.price && <span className="text-green-400 ml-2">${selectedAssetData.price.toFixed(2)}</span>}</div>
                <button onClick={() => { setSelectedAsset(null); setSelectedAssetData(null); setEntry(""); setClosePrice("") }} className="text-red-400 text-sm">✕ Change</button>
              </div>
            )}

            {!selectedAsset && (
              <div className="relative">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type 2-3 letters to search... (TSLA, AAPL, BTCUSD)" className="w-full p-4 pl-12 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none text-lg" />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xl">🔍</span>
                {search && <button onClick={() => { setSearch(""); setResults([]) }} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">✕</button>}
              </div>
            )}

            {!selectedAsset && !loading && results.length > 0 && (
              <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-zinc-800 text-xs text-zinc-500 uppercase flex justify-between"><span>Results ({results.length})</span></div>
                {results.map((item, i) => (
                  <div key={`${item.symbol}-${i}`} onClick={() => selectAsset(item)} className="flex items-center justify-between p-4 hover:bg-zinc-800 cursor-pointer border-b border-zinc-800/50 last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${item.type === "crypto" ? "bg-orange-900/30 text-orange-400" : item.type === "forex" ? "bg-blue-900/30 text-blue-400" : item.exchange === "RECENT" ? "bg-yellow-900/30 text-yellow-400" : item.exchange === "CUSTOM" ? "bg-purple-900/30 text-purple-400" : "bg-green-900/30 text-green-400"}`}>{item.symbol.charAt(0)}</div>
                      <div>
                        <div className="flex items-center gap-2"><b className="text-white">{item.symbol}</b><span className={`text-xs px-2 py-0.5 rounded ${item.exchange === "RECENT" ? "bg-yellow-900/50 text-yellow-400" : item.exchange === "CUSTOM" ? "bg-purple-900/50 text-purple-400" : "bg-zinc-800 text-zinc-400"}`}>{item.exchange === "RECENT" ? "Recent" : item.exchange === "CUSTOM" ? "Custom" : item.exchange}</span></div>
                        <p className="text-sm text-zinc-400">{item.name}</p>
                      </div>
                    </div>
                    <div className="text-right">{item.price && <p className="text-white font-semibold">${item.price.toFixed(2)}</p>}{item.change !== null && item.change !== undefined && <p className={`text-sm ${item.change >= 0 ? "text-green-400" : "text-red-400"}`}>{item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%</p>}</div>
                  </div>
                ))}
              </div>
            )}

            {loading && <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center"><div className="animate-spin text-3xl mb-3">🔍</div><p className="text-zinc-400">Searching...</p></div>}

            {!loading && search.length > 0 && results.length === 0 && (
              <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center"><p className="text-4xl mb-3">🔍</p><p className="text-zinc-400 mb-2">No results for "<b>{search}</b>"</p><button onClick={() => setShowCustomModal(true)} className="text-blue-400 text-sm">+ Add "{search.toUpperCase()}"</button></div>
            )}

            {!selectedAsset && search.length === 0 && (
              <div className="mt-4"><button onClick={() => setShowCustomModal(true)} className="text-sm text-blue-400">+ Add custom asset</button></div>
            )}

            {selectedAsset && (
              <div className="mt-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-6">
                <h3 className="text-lg font-bold text-yellow-500">New Trade — {selectedAsset}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-zinc-400 text-sm mb-1">Direction</label><select value={direction} onChange={(e) => setDirection(e.target.value)} className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700"><option value="Buy">🟢 Buy</option><option value="Sell">🔴 Sell</option></select></div>
                  <div><label className="block text-zinc-400 text-sm mb-1">Entry Price</label><input type="number" step="any" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder={selectedAssetData?.price ? `Market: ${selectedAssetData.price.toFixed(2)}` : "Entry price"} className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700" /></div>
                  <div><label className="block text-zinc-400 text-sm mb-1">Close Price</label><input type="number" step="any" value={closePrice} onChange={(e) => setClosePrice(e.target.value)} placeholder={entry ? `Suggested: ${(parseFloat(entry) + 5).toFixed(2)}` : "Exit price"} className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700" /></div>
                  <div>
                    <label className="block text-zinc-400 text-sm mb-1">Size</label>
                    <div className="flex gap-3">
                      <input type="number" step="any" value={size} onChange={(e) => setSize(e.target.value)} placeholder={sizeUnit === "lots" ? "Lots" : sizeUnit === "coins" ? "Coins" : "Shares"} className="flex-1 p-4 bg-zinc-800 rounded-xl border border-zinc-700" />
                      <div className="flex gap-2">
                        <button onClick={() => setSizeUnit("shares")} className={`px-3 rounded-xl text-sm font-bold ${sizeUnit === "shares" ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-400"}`}>Shares</button>
                        <button onClick={() => setSizeUnit("lots")} className={`px-3 rounded-xl text-sm font-bold ${sizeUnit === "lots" ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-400"}`}>Lots</button>
                        <button onClick={() => setSizeUnit("coins")} className={`px-3 rounded-xl text-sm font-bold ${sizeUnit === "coins" ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-400"}`}>Coins</button>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2"><label className="block text-zinc-400 text-sm mb-1">Emotion</label><select value={emotion} onChange={(e) => { if (e.target.value === "___add_new___") setShowEmotionModal(true); else setEmotion(e.target.value) }} className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700"><option value="">Select emotion...</option>{allEmotions.map(e => <option key={e} value={e}>{e}</option>)}<option disabled>──────────</option><option value="___add_new___">➕ Add custom...</option></select></div>
                </div>
              </div>
            )}

            {selectedAsset && entry && closePrice && size && (
              <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex justify-between"><span className="text-zinc-400">Estimated P&L</span><span className={`text-xl font-bold ${calculatePnL() >= 0 ? "text-green-400" : "text-red-400"}`}>{calculatePnL() >= 0 ? "+" : ""}${calculatePnL().toFixed(2)}</span></div>
            )}

            {selectedAsset && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={saveTrade} className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-xl font-bold">💾 Save Trade</button>
                <button onClick={() => { setEntry(""); setClosePrice(""); setSize(""); setEmotion("") }} className="bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-700">🔄 Clear</button>
                <button onClick={() => { setSelectedAsset(null); setSelectedAssetData(null); setEntry(""); setClosePrice(""); setSize(""); setEmotion(""); setSearch(""); setResults([]) }} className="bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-600">➕ New Asset</button>
              </div>
            )}

            <div className="mt-8 space-y-3">
              <h2 className="text-2xl font-bold">Trade History{trades.length > 0 && <span className="text-sm text-zinc-500 ml-2">({trades.length})</span>}</h2>
              {trades.length === 0 && <div className="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800"><p className="text-4xl mb-4">📝</p><p className="text-zinc-400">No trades yet</p></div>}
              {trades.map(t => (
                <div key={t.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition group">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2"><b className="text-lg">{t.asset}</b><span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${t.direction === "Buy" ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>{t.direction.toUpperCase()}</span></div>
                    <div className="flex items-center gap-3"><span className={`text-lg font-bold ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{t.pnl >= 0 ? "+" : ""}${t.pnl?.toFixed(2)}</span><button onClick={() => deleteTrade(t.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100">🗑️</button></div>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">Entry: ${t.entry} → Exit: ${t.close_price} • {t.original_size || t.size} {t.size_unit || ""}</p>
                  {t.emotion && <p className="text-sm text-zinc-500">🧠 {t.emotion}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-xl font-bold">📊 Analytics</h2><button onClick={fetchAnalytics} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-sm">🔄 Refresh</button></div>
            {loadingAnalytics ? <div className="text-center py-20"><div className="animate-spin text-4xl mb-4">🤖</div><p className="text-zinc-400">Analyzing...</p></div>
            : analytics && analytics.totalTrades > 0 ? <>
              {analytics.motivation && <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-xl"><p className="text-purple-300 text-center">{analytics.motivation}</p></div>}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800"><p className="text-zinc-400 text-sm">Win Rate</p><p className={`text-3xl font-bold ${parseFloat(analytics.summary.winRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>{analytics.summary.winRate}%</p></div>
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800"><p className="text-zinc-400 text-sm">Total P&L</p><p className={`text-3xl font-bold ${parseFloat(analytics.summary.totalPnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>${analytics.summary.totalPnl}</p></div>
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800"><p className="text-zinc-400 text-sm">Profit Factor</p><p className="text-3xl font-bold text-yellow-400">{analytics.summary.profitFactor}</p></div>
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800"><p className="text-zinc-400 text-sm">Expectancy</p><p className="text-2xl font-bold text-green-400">${analytics.summary.expectancy}</p></div>
              </div>
              {analytics.assets.best && <div className="bg-zinc-900 p-6 rounded-2xl border border-green-800/30"><h3 className="text-green-400 font-bold">🏆 Best: {analytics.assets.best.symbol}</h3><p className="text-green-400">+${analytics.assets.best.pnl} ({analytics.assets.best.winRate}% win)</p></div>}
              {analytics.suggestions && analytics.suggestions.length > 0 && <div className="bg-blue-950/30 border border-blue-800/50 p-6 rounded-2xl"><h3 className="text-blue-400 font-bold mb-3">💡 AI Insights</h3><ul className="space-y-2">{analytics.suggestions.map((s, i) => <li key={i} className="text-zinc-300 text-sm">▶ {s}</li>)}</ul></div>}
              {analytics.warnings && analytics.warnings.length > 0 && <div className="bg-red-950/20 border border-red-800/30 p-6 rounded-2xl"><h3 className="text-red-400 font-bold mb-3">⚠️ Warnings</h3><ul className="space-y-2">{analytics.warnings.map((w, i) => <li key={i} className="text-zinc-300 text-sm">⚠ {w}</li>)}</ul></div>}
            </> : <div className="text-center py-20 bg-zinc-900 rounded-2xl"><p className="text-6xl mb-4">🤖</p><p className="text-zinc-400">{analytics?.message || "Add trades to see insights!"}</p><button onClick={() => setActiveTab("journal")} className="mt-4 bg-yellow-500 text-black px-6 py-2 rounded-xl font-bold">Add Trade</button></div>}
          </div>
        )}
      </section>

      {showCustomModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCustomModal(false)}><div className="bg-zinc-900 p-6 rounded-2xl w-96 border border-zinc-700" onClick={e => e.stopPropagation()}><h3 className="text-xl font-bold mb-4">Add Custom Asset</h3><input type="text" placeholder="Symbol" value={customSymbol} onChange={e => setCustomSymbol(e.target.value.toUpperCase())} className="w-full p-3 bg-zinc-800 rounded-xl mb-3 border border-zinc-700" autoFocus /><input type="text" placeholder="Name (optional)" value={customName} onChange={e => setCustomName(e.target.value)} className="w-full p-3 bg-zinc-800 rounded-xl mb-4 border border-zinc-700" /><div className="flex gap-3"><button onClick={() => { if (!customSymbol.trim()) return; addCustomAsset(customSymbol.toUpperCase(), customName); saveToRecentAssets(customSymbol.toUpperCase()); setShowCustomModal(false); setCustomSymbol(""); setCustomName(""); showNotification("Added!", "success") }} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-xl font-bold">Add</button><button onClick={() => setShowCustomModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-xl">Cancel</button></div></div></div>}

      {showEmotionModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEmotionModal(false)}><div className="bg-zinc-900 p-6 rounded-2xl w-96 border border-zinc-700" onClick={e => e.stopPropagation()}><h3 className="text-xl font-bold mb-4">Add Emotion</h3><input type="text" placeholder="e.g., Euphoric" value={customEmotion} onChange={e => setCustomEmotion(e.target.value)} className="w-full p-3 bg-zinc-800 rounded-xl mb-4 border border-zinc-700" autoFocus /><div className="flex gap-3"><button onClick={() => { if (!customEmotion.trim() || allEmotions.includes(customEmotion)) return; const u = [...customEmotions, customEmotion]; setCustomEmotions(u); localStorage.setItem("custom_emotions", JSON.stringify(u)); setCustomEmotion(""); setShowEmotionModal(false); showNotification("Added!", "success") }} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-xl font-bold">Add</button><button onClick={() => setShowEmotionModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-xl">Cancel</button></div></div></div>}

      <AIAssistant />
    </main>
  )
}