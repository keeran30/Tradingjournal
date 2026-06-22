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
  success: boolean; totalTrades: number; isPremium: boolean
  summary: { totalPnL: string; winRate: string; totalTrades: number; winningTrades: number; losingTrades: number }
  teasers?: { leakCount: number; message: string; preview: { winRate: number; totalPnL: string; potentialSavings: string } }
  aiScore?: number; scores?: any; coachSummary?: any; leakTracker?: any; preMarketProtocol?: any
  edge?: any; accountKillers?: any[]; behavioralAlerts?: any[]
  suggestions?: string[]; warnings?: string[]; motivation?: string; message?: string
}

export default function TradesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
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
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "upgrade" } | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [recentAssets, setRecentAssets] = useState<string[]>([])
  const [isPremium, setIsPremium] = useState(false)

  const MAX_FREE_TRADES = 50
  const defaultEmotions = ["😌 Calm","😊 Confident","🤔 Hesitant","😰 Anxious","😤 Impatient","😨 Fearful","🤑 Greedy","😓 Stressed","😎 Overconfident","🤷 Unsure","🎯 Focused","😴 Tired"]
  const allEmotions = [...defaultEmotions, ...customEmotions]

  const showNotification = (message: string, type: "success" | "error" | "upgrade") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth"); return }
      setUserId(user.id)
      setAuthChecked(true)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedEmotions = localStorage.getItem("custom_emotions")
        if (savedEmotions) setCustomEmotions(JSON.parse(savedEmotions))
        const savedAssets = localStorage.getItem("recent_assets")
        if (savedAssets) setRecentAssets(JSON.parse(savedAssets))
        const settings = localStorage.getItem("user_settings")
        if (settings) setIsPremium(JSON.parse(settings).isPremium || false)
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
      } catch (e) { setResults([]) } finally { setLoading(false) }
    }, 200)
    return () => clearTimeout(delay)
  }, [search, recentAssets])

  const fetchTrades = useCallback(async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase.from("trades").select("*").eq("user_id", userId).order("created_at", { ascending: false })
      if (error) { setTrades([]) } else { setTrades(data || []) }
    } catch (err) { setTrades([]) } finally { setPageLoading(false) }
  }, [userId])

  useEffect(() => { if (userId) fetchTrades() }, [userId, fetchTrades])

  const fetchAnalytics = useCallback(async () => {
    if (!userId) return
    setLoadingAnalytics(true)
    try {
      const saved = localStorage.getItem("user_settings")
      const premium = saved ? JSON.parse(saved).isPremium : false
      const res = await fetch(`/api/analytics?userId=${userId}&premium=${premium}`)
      const data = await res.json()
      setAnalytics(data)
    } catch (e) { console.error(e) } finally { setLoadingAnalytics(false) }
  }, [userId])

  useEffect(() => { if (activeTab === "analytics" && userId) fetchAnalytics() }, [activeTab, userId, fetchAnalytics])

  const calculatePnL = useCallback(() => {
    const e = parseFloat(entry), c = parseFloat(closePrice); let s = parseFloat(size)
    if (isNaN(e) || isNaN(c) || isNaN(s)) return 0
    if (sizeUnit === "lots") s = s * 100000
    return direction === "Buy" ? (c - e) * s : (e - c) * s
  }, [entry, closePrice, size, sizeUnit, direction])

  const saveTrade = async () => {
    if (!selectedAsset) { showNotification("Select an asset first", "error"); return }
    if (!entry || !closePrice || !size) { showNotification("Fill all fields", "error"); return }
    
    // Check free tier limit
    if (!isPremium && trades.length >= MAX_FREE_TRADES) {
      showNotification(`Free tier limit reached (${MAX_FREE_TRADES} trades). Upgrade to Premium for unlimited trades.`, "upgrade")
      return
    }

    const e = parseFloat(entry), c = parseFloat(closePrice), sz = parseFloat(size)
    if (isNaN(e) || isNaN(c) || isNaN(sz)) { showNotification("Enter valid numbers", "error"); return }
    let fs = sz; if (sizeUnit === "lots") fs = sz * 100000
    const pnl = calculatePnL()
    if (!userId) { showNotification("Please log in", "error"); return }
    const tradeData = { user_id: userId, asset: selectedAsset, direction, entry: e, close_price: c, size: fs, size_unit: sizeUnit, original_size: sz, emotion: emotion || null, pnl }
    const { error } = await supabase.from("trades").insert([tradeData])
    if (error) { showNotification(error.message, "error"); return }
    saveToRecentAssets(selectedAsset)
    showNotification("Trade saved!", "success")
    setEntry(""); setClosePrice(""); setSize(""); setEmotion("")
    fetchTrades()

    // Show upgrade prompt after 30 trades
    if (!isPremium && trades.length >= 30) {
      setTimeout(() => {
        showNotification(`You've logged ${trades.length + 1} trades. Only ${MAX_FREE_TRADES - trades.length - 1} remaining on the free tier. Upgrade to Premium for unlimited trades and AI insights.`, "upgrade")
      }, 1500)
    }
  }

  const deleteTrade = async (id: string) => {
    const { error } = await supabase.from("trades").delete().eq("id", id)
    if (error) showNotification(error.message, "error")
    else { showNotification("Deleted", "success"); fetchTrades() }
  }

  const selectAsset = (item: SearchResult) => {
    setSelectedAsset(item.symbol); setSearch(""); setResults([])
    setEntry(""); setClosePrice("")
  }

  if (!authChecked || pageLoading) return <AppLoader message="Loading Trading Journal" />

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />
      <section className="flex-1 p-4 md:p-8 overflow-y-auto">
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl font-bold shadow-lg animate-bounce max-w-md ${
            notification.type === "success" ? "bg-green-600 text-white" : 
            notification.type === "upgrade" ? "bg-gradient-to-r from-yellow-600 to-yellow-500 text-black" : 
            "bg-red-600 text-white"
          }`}>
            <p>{notification.message}</p>
            {notification.type === "upgrade" && (
              <button onClick={() => router.push("/settings")} className="mt-2 bg-black text-yellow-400 px-4 py-1 rounded-lg text-sm font-bold hover:bg-zinc-900 transition">
                Upgrade Now →
              </button>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Trading Journal</h1>
            <p className="text-zinc-400">Track, analyze & improve with AI-powered insights</p>
          </div>
          {!isPremium && (
            <div className="hidden md:block">
              <span className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg text-xs">
                Free: {trades.length}/{MAX_FREE_TRADES} trades
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-4 mb-6 border-b border-zinc-800">
          <button onClick={() => setActiveTab("journal")} className={`pb-2 px-4 font-bold ${activeTab === "journal" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-zinc-400"}`}>📝 Journal</button>
          <button onClick={() => setActiveTab("analytics")} className={`pb-2 px-4 font-bold ${activeTab === "analytics" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-zinc-400"}`}>🤖 AI Analytics</button>
        </div>

        {/* ========== JOURNAL TAB ========== */}
        {activeTab === "journal" && (
          <>
            {!isPremium && trades.length >= 40 && (
              <div className="mb-4 p-4 bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 border border-yellow-600/30 rounded-xl">
                <p className="text-yellow-400 text-sm font-bold">⚠️ Almost at the free tier limit ({trades.length}/{MAX_FREE_TRADES})</p>
                <p className="text-zinc-400 text-xs mt-1">Upgrade to Premium for unlimited trades and full AI analytics.</p>
                <button onClick={() => router.push("/settings")} className="mt-2 bg-yellow-500 text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-400 transition">Upgrade — $9.99/mo</button>
              </div>
            )}

            {selectedAsset && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-600 rounded-xl flex justify-between items-center">
                <div><span className="text-zinc-400">Selected: </span><b className="text-white text-lg">{selectedAsset}</b></div>
                <button onClick={() => { setSelectedAsset(null); setEntry(""); setClosePrice("") }} className="text-red-400 text-sm">✕ Change</button>
              </div>
            )}
            {!selectedAsset && (
              <div className="relative">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stocks, forex, crypto... (AAPL, XAUUSD, BTCUSD)" className="w-full p-4 pl-12 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none text-lg" />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xl">🔍</span>
                {search && <button onClick={() => { setSearch(""); setResults([]) }} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">✕</button>}
              </div>
            )}
            {!selectedAsset && !loading && results.length > 0 && (
              <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-zinc-800 text-xs text-zinc-500 uppercase flex justify-between"><span>Results ({results.length})</span></div>
                {results.map((item, i) => (
                  <div key={`${item.symbol}-${i}`} onClick={() => selectAsset(item)} className="flex items-center justify-between p-4 hover:bg-zinc-800 cursor-pointer border-b border-zinc-800/50">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${item.type === "crypto" ? "bg-orange-900/30 text-orange-400" : item.type === "forex" ? "bg-blue-900/30 text-blue-400" : item.exchange === "RECENT" ? "bg-yellow-900/30 text-yellow-400" : item.exchange === "CUSTOM" ? "bg-purple-900/30 text-purple-400" : "bg-green-900/30 text-green-400"}`}>{item.symbol.charAt(0)}</div>
                      <div><b className="text-white">{item.symbol}</b><span className={`ml-2 text-xs px-2 py-0.5 rounded ${item.exchange === "RECENT" ? "bg-yellow-900/50 text-yellow-400" : item.exchange === "CUSTOM" ? "bg-purple-900/50 text-purple-400" : "bg-zinc-800 text-zinc-400"}`}>{item.exchange === "RECENT" ? "Recent" : item.exchange === "CUSTOM" ? "Custom" : item.exchange}</span><p className="text-sm text-zinc-400">{item.name}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {loading && <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center"><div className="animate-spin text-3xl mb-3">🔍</div><p className="text-zinc-400">Searching markets...</p></div>}
            {!loading && search.length > 0 && results.length === 0 && (
              <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center"><p className="text-4xl mb-3">🔍</p><p className="text-zinc-400">No results for "<b>{search}</b>"</p><button onClick={() => setShowCustomModal(true)} className="text-blue-400 text-sm">+ Add "{search.toUpperCase()}"</button></div>
            )}
            {!selectedAsset && search.length === 0 && <div className="mt-4"><button onClick={() => setShowCustomModal(true)} className="text-sm text-blue-400">+ Add custom asset manually</button></div>}

            {selectedAsset && (
              <div className="mt-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-6">
                <h3 className="text-lg font-bold text-yellow-500">New Trade — {selectedAsset}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-zinc-400 text-sm mb-1">Direction</label><select value={direction} onChange={(e) => setDirection(e.target.value)} className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700"><option value="Buy">🟢 Buy (Long)</option><option value="Sell">🔴 Sell (Short)</option></select></div>
                  <div><label className="block text-zinc-400 text-sm mb-1">Entry Price</label><input type="number" step="any" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="Entry price" className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700" /></div>
                  <div><label className="block text-zinc-400 text-sm mb-1">Close Price</label><input type="number" step="any" value={closePrice} onChange={(e) => setClosePrice(e.target.value)} placeholder="Exit price" className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700" /></div>
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
                  <div className="md:col-span-2"><label className="block text-zinc-400 text-sm mb-1">Emotion</label><select value={emotion} onChange={(e) => { if (e.target.value === "___add_new___") setShowEmotionModal(true); else setEmotion(e.target.value) }} className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700"><option value="">How did you feel?</option>{allEmotions.map(e => <option key={e} value={e}>{e}</option>)}<option disabled>──────────</option><option value="___add_new___">➕ Add custom...</option></select></div>
                </div>
              </div>
            )}
            {selectedAsset && entry && closePrice && size && (
              <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex justify-between"><span className="text-zinc-400">Estimated P&L</span><span className={`text-xl font-bold ${calculatePnL() >= 0 ? "text-green-400" : "text-red-400"}`}>{calculatePnL() >= 0 ? "+" : ""}${calculatePnL().toFixed(2)}</span></div>
            )}
            {selectedAsset && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={saveTrade} className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-xl font-bold">💾 Save</button>
                <button onClick={() => { setEntry(""); setClosePrice(""); setSize(""); setEmotion("") }} className="bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-700">🔄 Clear</button>
                <button onClick={() => { setSelectedAsset(null); setEntry(""); setClosePrice(""); setSize(""); setEmotion(""); setSearch(""); setResults([]) }} className="bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-600">➕ New Asset</button>
              </div>
            )}
            <div className="mt-8 space-y-3">
              <h2 className="text-2xl font-bold">Trade History{trades.length > 0 && <span className="text-sm text-zinc-500 ml-2">({trades.length}{!isPremium && ` / ${MAX_FREE_TRADES}`})</span>}</h2>
              {trades.length === 0 && <div className="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800"><p className="text-4xl mb-4">📝</p><p className="text-zinc-400">No trades yet</p></div>}
              {trades.map(t => (
                <div key={t.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition group">
                  <div className="flex justify-between"><div className="flex items-center gap-2"><b>{t.asset}</b><span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${t.direction === "Buy" ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>{t.direction}</span></div><div className="flex items-center gap-3"><span className={`font-bold ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{t.pnl >= 0 ? "+" : ""}${t.pnl?.toFixed(2)}</span><button onClick={() => deleteTrade(t.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100">🗑️</button></div></div>
                  <p className="text-sm text-zinc-400 mt-1">Entry: ${t.entry} → Exit: ${t.close_price} • {t.original_size || t.size} {t.size_unit || ""}</p>
                  {t.emotion && <p className="text-sm text-zinc-500">🧠 {t.emotion}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ========== AI ANALYTICS TAB ========== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">🤖 AI Analytics {isPremium ? "— Premium" : "— Free"}</h2>
              <button onClick={fetchAnalytics} className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl text-sm font-bold">🔄 Refresh</button>
            </div>
            
            {loadingAnalytics ? (
              <div className="text-center py-20"><div className="animate-spin text-4xl mb-4">🤖</div><p className="text-zinc-400">Crunching your numbers...</p></div>
            ) : analytics && analytics.totalTrades > 0 ? (
              <>
                {/* Free Tier Teaser */}
                {!isPremium && analytics.teasers && (
                  <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 border border-yellow-500/30 p-5 rounded-2xl">
                    <h3 className="font-bold text-yellow-400 text-lg mb-2">🔒 Premium Features Locked</h3>
                    <p className="text-zinc-300 text-sm mb-3">{analytics.teasers.message}</p>
                    <div className="grid grid-cols-3 gap-3 text-center mb-4">
                      <div className="bg-zinc-800/50 p-3 rounded-xl">
                        <p className="text-2xl font-bold text-white">{analytics.summary.totalTrades}</p>
                        <p className="text-xs text-zinc-500">Total Trades</p>
                      </div>
                      <div className="bg-zinc-800/50 p-3 rounded-xl">
                        <p className="text-2xl font-bold text-green-400">{analytics.summary.winRate}</p>
                        <p className="text-xs text-zinc-500">Win Rate</p>
                      </div>
                      <div className="bg-zinc-800/50 p-3 rounded-xl">
                        <p className="text-2xl font-bold text-white">${analytics.summary.totalPnL}</p>
                        <p className="text-xs text-zinc-500">Total P&L</p>
                      </div>
                    </div>
                    {analytics.teasers.leakCount > 0 && (
                      <div className="bg-red-900/20 border border-red-800/30 p-3 rounded-xl mb-3">
                        <p className="text-red-400 text-sm font-bold">🔴 {analytics.teasers.leakCount} behavioral leak(s) detected</p>
                        <p className="text-zinc-400 text-xs">Upgrade to see what's costing you money</p>
                      </div>
                    )}
                    <button onClick={() => router.push("/settings")} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold transition">
                      Upgrade to Premium — $9.99/month
                    </button>
                  </div>
                )}

                {/* Premium Full Analytics */}
                {isPremium && (
                  <>
                    {/* AI Score */}
                    {analytics.aiScore && (
                      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-center">
                        <p className="text-zinc-400 text-sm mb-2">AI Trading Score</p>
                        <p className={`text-5xl font-bold ${analytics.aiScore >= 70 ? "text-green-400" : analytics.aiScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>{analytics.aiScore}/100</p>
                        {analytics.scores && (
                          <div className="grid grid-cols-5 gap-2 mt-4 text-xs">
                            {Object.entries(analytics.scores).map(([key, val]: any) => (
                              <div key={key} className="bg-zinc-800 p-2 rounded-lg"><p className="text-zinc-500">{key.replace(/([A-Z])/g, ' $1').trim()}</p><p className="font-bold text-white">{val}</p></div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Coach + Edge */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analytics.coachSummary && (
                        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-5 rounded-2xl border border-purple-500/30">
                          <p className="text-purple-300 font-bold mb-2">🥇 AI Coach</p>
                          <p className="text-sm text-zinc-300">Strongest: <b className="text-green-400">{analytics.coachSummary.strongestSkill}</b></p>
                          <p className="text-sm text-zinc-300">Weakest: <b className="text-red-400">{analytics.coachSummary.weakestSkill}</b></p>
                          <p className="text-sm text-zinc-300 mt-2">🎯 {analytics.coachSummary.highestOpportunity}</p>
                        </div>
                      )}
                      {analytics.edge && (
                        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                          <h3 className="font-bold text-yellow-400 mb-3">🏆 Edge Discovery</h3>
                          <p className="text-sm text-zinc-300">Best Asset: <b>{analytics.edge.mostProfitableAsset}</b></p>
                          <p className="text-sm text-zinc-300">Direction: <b>{analytics.edge.mostProfitableDirection}</b></p>
                          <p className="text-sm text-green-400 font-bold">+${analytics.edge.mostProfitableAssetPnL}</p>
                        </div>
                      )}
                    </div>

                    {/* Leak Tracker */}
                    {analytics.leakTracker && (
                      <div className={`p-5 rounded-2xl border ${parseFloat(analytics.leakTracker.totalLeakCost || "0") > 0 ? "bg-red-950/20 border-red-500/30" : "bg-green-950/20 border-green-500/30"}`}>
                        <h3 className="font-bold text-lg mb-2">🔴 Leak Tracker</h3>
                        <p className="text-sm text-zinc-300 mb-3">{analytics.leakTracker.summary}</p>
                        {analytics.leakTracker.leaks?.map((leak: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 bg-zinc-800/50 p-3 rounded-xl mb-2">
                            <span className="text-2xl">{leak.icon || "⚠️"}</span>
                            <div className="flex-1">
                              <div className="flex justify-between"><p className="font-bold text-sm">{leak.label}</p><p className="text-red-400 font-bold text-sm">-${leak.cost?.toFixed?.(2) || leak.cost}</p></div>
                              <p className="text-xs text-zinc-400">{leak.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pre-Market Protocol */}
                    {analytics.preMarketProtocol && (
                      <div className="bg-blue-950/20 border border-blue-500/30 p-5 rounded-2xl">
                        <h3 className="font-bold text-blue-400 mb-3">📋 Your Pre-Market Protocol</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-zinc-800/50 p-3 rounded-xl"><span className="text-zinc-500">Max Position:</span><p className="font-bold text-white">{analytics.preMarketProtocol.maxPositionSize}</p></div>
                          <div className="bg-zinc-800/50 p-3 rounded-xl"><span className="text-zinc-500">Best Setup:</span><p className="font-bold text-white">{analytics.preMarketProtocol.bestSetup}</p></div>
                          <div className="bg-zinc-800/50 p-3 rounded-xl"><span className="text-zinc-500">Dead Zones:</span><p className="font-bold text-red-400">{analytics.preMarketProtocol.deadZones}</p></div>
                          <div className="bg-zinc-800/50 p-3 rounded-xl"><span className="text-zinc-500">Discipline:</span><p className="font-bold text-white">{analytics.preMarketProtocol.disciplineScore}/100</p></div>
                        </div>
                      </div>
                    )}

                    {/* Motivation */}
                    {analytics.motivation && (
                      <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 text-center">
                        <p className="text-lg">{analytics.motivation}</p>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800">
                <p className="text-6xl mb-4">🤖</p>
                <p className="text-zinc-400 text-lg mb-2">{analytics?.message || "No trades yet"}</p>
                <button onClick={() => setActiveTab("journal")} className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold">Add Your First Trade</button>
              </div>
            )}
          </div>
        )}
      </section>

      {showCustomModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCustomModal(false)}><div className="bg-zinc-900 p-6 rounded-2xl w-96 border border-zinc-700" onClick={e => e.stopPropagation()}><h3 className="text-xl font-bold mb-4">Add Custom Asset</h3><input type="text" placeholder="Symbol" value={customSymbol} onChange={e => setCustomSymbol(e.target.value.toUpperCase())} className="w-full p-3 bg-zinc-800 rounded-xl mb-3 border border-zinc-700" autoFocus /><input type="text" placeholder="Name (optional)" value={customName} onChange={e => setCustomName(e.target.value)} className="w-full p-3 bg-zinc-800 rounded-xl mb-4 border border-zinc-700" /><div className="flex gap-3"><button onClick={() => { if(!customSymbol.trim())return; addCustomAsset(customSymbol.toUpperCase(),customName); saveToRecentAssets(customSymbol.toUpperCase()); setShowCustomModal(false); setCustomSymbol(""); setCustomName(""); showNotification("Added!","success") }} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-xl font-bold">Add</button><button onClick={() => setShowCustomModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-xl">Cancel</button></div></div></div>}

      {showEmotionModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEmotionModal(false)}><div className="bg-zinc-900 p-6 rounded-2xl w-96 border border-zinc-700" onClick={e => e.stopPropagation()}><h3 className="text-xl font-bold mb-4">Add Emotion</h3><input type="text" placeholder="e.g., Euphoric" value={customEmotion} onChange={e => setCustomEmotion(e.target.value)} className="w-full p-3 bg-zinc-800 rounded-xl mb-4 border border-zinc-700" autoFocus /><div className="flex gap-3"><button onClick={() => { if(!customEmotion.trim()||allEmotions.includes(customEmotion))return; const u=[...customEmotions,customEmotion]; setCustomEmotions(u); localStorage.setItem("custom_emotions",JSON.stringify(u)); setCustomEmotion(""); setShowEmotionModal(false); showNotification("Added!","success") }} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-xl font-bold">Add</button><button onClick={() => setShowEmotionModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-xl">Cancel</button></div></div></div>}

      <AIAssistant />
    </main>
  )
}