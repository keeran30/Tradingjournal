"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"
import AppLoader from "../components/AppLoader"

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [tradingStyle, setTradingStyle] = useState("")
  const [experience, setExperience] = useState("")
  const [dailyLossLimit, setDailyLossLimit] = useState("")
  const [riskPerTrade, setRiskPerTrade] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [activeSection, setActiveSection] = useState<"profile" | "preferences" | "subscription" | "danger">("profile")
  const [isPremium, setIsPremium] = useState(false)
  const [promoCode, setPromoCode] = useState("")

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth"); return }
      setUser(user)
      setEmail(user.email || "")
      const saved = localStorage.getItem("user_settings")
      if (saved) {
        try {
          const settings = JSON.parse(saved)
          setFullName(settings.fullName || "")
          setTradingStyle(settings.tradingStyle || "")
          setExperience(settings.experience || "")
          setDailyLossLimit(settings.dailyLossLimit || "")
          setRiskPerTrade(settings.riskPerTrade || "")
          setIsPremium(settings.isPremium || false)
        } catch (e) {}
      }
      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("payment") === "success") {
        setIsPremium(true)
        updatePremiumStatus(true)
        setMessage("Payment successful! Welcome to Premium")
        setTimeout(() => setMessage(""), 5000)
        window.history.replaceState({}, "", "/settings")
      }
    }
  }, [])

  const updatePremiumStatus = (premium: boolean) => {
    const saved = localStorage.getItem("user_settings")
    const settings = saved ? JSON.parse(saved) : {}
    settings.isPremium = premium
    localStorage.setItem("user_settings", JSON.stringify(settings))
    setIsPremium(premium)
  }

  const saveSettings = () => {
    setSaving(true)
    const settings = { fullName, tradingStyle, experience, dailyLossLimit, riskPerTrade, isPremium }
    localStorage.setItem("user_settings", JSON.stringify(settings))
    setTimeout(() => {
      setSaving(false)
      setMessage("Settings saved!")
      setTimeout(() => setMessage(""), 3000)
    }, 500)
  }

  // Developer promo code
  const handlePromoCode = () => {
    if (promoCode === "DEV2024" || promoCode === "tradevault_dev") {
      updatePremiumStatus(true)
      setMessage("Developer access granted! Premium unlocked.")
      setTimeout(() => setMessage(""), 3000)
      setPromoCode("")
    } else if (promoCode === "DEV_RESET") {
      updatePremiumStatus(false)
      setMessage("Premium reset. Back to free tier.")
      setTimeout(() => setMessage(""), 3000)
      setPromoCode("")
    } else if (promoCode) {
      setMessage("Invalid code")
      setTimeout(() => setMessage(""), 2000)
      setPromoCode("")
    }
  }

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, email: user?.email }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert("Error: " + (data.error || "Try again"))
    } catch (e) {
      alert("Something went wrong")
    }
  }

  const handleCancelSubscription = () => {
    if (!window.confirm("Cancel Premium subscription?")) return
    updatePremiumStatus(false)
    setMessage("Subscription cancelled")
    setTimeout(() => setMessage(""), 4000)
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account? This cannot be undone.")) return
    try {
      await supabase.from("trades").delete().eq("user_id", user.id)
      await supabase.auth.signOut()
      router.push("/")
    } catch (e) {
      alert("Error. Please try again.")
    }
  }

  if (loading) return <AppLoader message="Loading Settings" />

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />
      <section className="flex-1 p-4 md:p-8 overflow-y-auto">
        {message && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl font-bold shadow-lg animate-bounce ${
            message.includes("success") || message.includes("Welcome") || message.includes("Developer") ? "bg-green-600 text-white" : 
            message.includes("cancelled") || message.includes("Invalid") ? "bg-yellow-600 text-white" : "bg-blue-600 text-white"
          }`}>
            {message}
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold mb-2">Settings</h1>
        <p className="text-zinc-400 mb-8">Manage your account and trading preferences</p>

        {/* Developer Promo - Hidden in plain sight */}
        <div className="mb-6 flex gap-2 opacity-50 hover:opacity-100 transition">
          <input 
            type="text" 
            value={promoCode} 
            onChange={(e) => setPromoCode(e.target.value)} 
            placeholder="Promo code" 
            className="w-40 p-2 bg-zinc-800 rounded-lg border border-zinc-700 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handlePromoCode()}
          />
          <button onClick={handlePromoCode} className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1 rounded-lg text-xs">Apply</button>
        </div>

        <div className="flex gap-2 mb-8 border-b border-zinc-800 overflow-x-auto pb-1">
          {[
            { key: "profile", label: "Profile" },
            { key: "preferences", label: "Preferences" },
            { key: "subscription", label: "Subscription" },
            { key: "danger", label: "Danger Zone" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveSection(tab.key as any)} className={`pb-3 px-4 font-semibold text-sm whitespace-nowrap transition ${activeSection === tab.key ? "text-yellow-500 border-b-2 border-yellow-500" : "text-zinc-400 hover:text-white"}`}>{tab.label}</button>
          ))}
        </div>

        {activeSection === "profile" && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-bold text-lg mb-4">Account Information</h3>
              <div className="space-y-4">
                <div><label className="block text-zinc-400 text-sm mb-1">Email</label><input type="email" value={email} disabled className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 text-zinc-500 cursor-not-allowed" /></div>
                <div><label className="block text-zinc-400 text-sm mb-1">Full Name</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none" /></div>
                <div><label className="block text-zinc-400 text-sm mb-1">Trading Style</label><select value={tradingStyle} onChange={(e) => setTradingStyle(e.target.value)} className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none"><option value="">Select style...</option><option value="day_trader">Day Trader</option><option value="swing_trader">Swing Trader</option><option value="scalper">Scalper</option><option value="position_trader">Position Trader</option></select></div>
                <div><label className="block text-zinc-400 text-sm mb-1">Experience</label><select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none"><option value="">Select experience...</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="professional">Professional</option></select></div>
              </div>
            </div>
            <button onClick={saveSettings} disabled={saving} className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-xl font-bold transition">{saving ? "Saving..." : "Save Profile"}</button>
          </div>
        )}

        {activeSection === "preferences" && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-bold text-lg mb-4">Trading Preferences</h3>
              <div className="space-y-4">
                <div><label className="block text-zinc-400 text-sm mb-1">Daily Loss Limit ($)</label><input type="number" value={dailyLossLimit} onChange={(e) => setDailyLossLimit(e.target.value)} placeholder="500" className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none" /></div>
                <div><label className="block text-zinc-400 text-sm mb-1">Risk Per Trade (%)</label><input type="number" value={riskPerTrade} onChange={(e) => setRiskPerTrade(e.target.value)} placeholder="2" className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none" /></div>
              </div>
            </div>
            <button onClick={saveSettings} disabled={saving} className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-xl font-bold transition">{saving ? "Saving..." : "Save Preferences"}</button>
          </div>
        )}

        {activeSection === "subscription" && (
          <div className="space-y-6 max-w-3xl">
            <div className={`p-6 rounded-2xl border ${isPremium ? "bg-yellow-900/20 border-yellow-500/30" : "bg-zinc-900 border-zinc-800"}`}>
              <div className="flex justify-between items-center">
                <div><h3 className="font-bold text-lg">{isPremium ? "Premium Member" : "Free Plan"}</h3><p className="text-zinc-400 text-sm">{isPremium ? "Full access to all features" : "Upgrade for advanced analytics"}</p></div>
                {isPremium ? (
                  <div className="flex gap-2"><span className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold text-sm">Active</span><button onClick={handleCancelSubscription} className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl text-sm">Cancel</button></div>
                ) : (
                  <button onClick={handleUpgrade} className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold transition">Upgrade — $9.99/month</button>
                )}
              </div>
            </div>
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-bold text-lg mb-4">Plan Comparison</h3>
              <div className="space-y-3">
                {[
                  { feature: "Trade Entries", free: "50 trades", premium: "Unlimited" },
                  { feature: "AI Analytics", free: "Basic", premium: "Advanced" },
                  { feature: "Leak Tracker", free: "Not included", premium: "Full detection" },
                  { feature: "Edge Discovery", free: "Not included", premium: "Best asset/session" },
                  { feature: "Export Reports", free: "TXT only", premium: "PDF, CSV, TXT" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between p-3 bg-zinc-800/40 rounded-xl"><span className="text-sm">{item.feature}</span><div className="flex gap-4 text-sm"><span className="text-zinc-500">{item.free}</span><span className="text-yellow-400 font-bold">{item.premium}</span></div></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === "danger" && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-red-950/20 border border-red-500/30 p-6 rounded-2xl">
              <h3 className="font-bold text-red-400 text-lg mb-2">Delete Account</h3>
              <p className="text-zinc-400 text-sm mb-4">This permanently deletes all your trades and data.</p>
              <button onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition">Delete My Account</button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}