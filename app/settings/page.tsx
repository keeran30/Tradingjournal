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

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth"); return }
      setUser(user)
      setEmail(user.email || "")
      
      // Load saved preferences
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

  const saveSettings = () => {
    setSaving(true)
    const settings = { fullName, tradingStyle, experience, dailyLossLimit, riskPerTrade, isPremium }
    localStorage.setItem("user_settings", JSON.stringify(settings))
    setTimeout(() => {
      setSaving(false)
      setMessage("Settings saved successfully!")
      setTimeout(() => setMessage(""), 3000)
    }, 500)
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This cannot be undone. All your trades will be permanently deleted.")
    if (!confirmed) return
    
    try {
      // Delete all trades
      await supabase.from("trades").delete().eq("user_id", user.id)
      // Sign out
      await supabase.auth.signOut()
      router.push("/")
    } catch (e) {
      alert("Error deleting account. Please try again.")
    }
  }

  const handleUpgrade = () => {
    setIsPremium(true)
    const settings = { fullName, tradingStyle, experience, dailyLossLimit, riskPerTrade, isPremium: true }
    localStorage.setItem("user_settings", JSON.stringify(settings))
    setMessage("Upgraded to Premium! 🎉")
    setTimeout(() => setMessage(""), 3000)
  }

  if (loading) return <AppLoader message="Loading Settings" />

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />
      <section className="flex-1 p-4 md:p-8 overflow-y-auto">
        {message && (
          <div className="fixed top-4 right-4 z-50 px-6 py-3 rounded-xl font-bold shadow-lg bg-green-600 text-white animate-bounce">
            {message}
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold mb-2">Settings</h1>
        <p className="text-zinc-400 mb-8">Manage your account and trading preferences</p>

        {/* Section Tabs */}
        <div className="flex gap-2 mb-8 border-b border-zinc-800 overflow-x-auto pb-1">
          {[
            { key: "profile", label: "👤 Profile" },
            { key: "preferences", label: "⚙️ Preferences" },
            { key: "subscription", label: "💎 Subscription" },
            { key: "danger", label: "⚠️ Danger Zone" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key as any)}
              className={`pb-3 px-4 font-semibold text-sm whitespace-nowrap transition ${activeSection === tab.key ? "text-yellow-500 border-b-2 border-yellow-500" : "text-zinc-400 hover:text-white"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── PROFILE ─────────────────────────── */}
        {activeSection === "profile" && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-bold text-lg mb-4">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-zinc-400 text-sm mb-1">Email</label>
                  <input type="email" value={email} disabled className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 text-zinc-500 cursor-not-allowed" />
                  <p className="text-xs text-zinc-600 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-zinc-400 text-sm mb-1">Full Name</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-sm mb-1">Trading Style</label>
                  <select value={tradingStyle} onChange={(e) => setTradingStyle(e.target.value)} className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none">
                    <option value="">Select style...</option>
                    <option value="day_trader">Day Trader</option>
                    <option value="swing_trader">Swing Trader</option>
                    <option value="scalper">Scalper</option>
                    <option value="position_trader">Position Trader</option>
                    <option value="algo_trader">Algo Trader</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-sm mb-1">Experience Level</label>
                  <select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none">
                    <option value="">Select experience...</option>
                    <option value="beginner">Beginner (0-1 year)</option>
                    <option value="intermediate">Intermediate (1-3 years)</option>
                    <option value="advanced">Advanced (3-5 years)</option>
                    <option value="professional">Professional (5+ years)</option>
                  </select>
                </div>
              </div>
            </div>
            <button onClick={saveSettings} disabled={saving} className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-xl font-bold transition disabled:opacity-50">
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        )}

        {/* ─── PREFERENCES ─────────────────────── */}
        {activeSection === "preferences" && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-bold text-lg mb-4">Trading Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-zinc-400 text-sm mb-1">Daily Loss Limit ($)</label>
                  <input type="number" value={dailyLossLimit} onChange={(e) => setDailyLossLimit(e.target.value)} placeholder="e.g., 500" className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none" />
                  <p className="text-xs text-zinc-500 mt-1">Stop trading when you hit this limit</p>
                </div>
                <div>
                  <label className="block text-zinc-400 text-sm mb-1">Risk Per Trade (%)</label>
                  <input type="number" value={riskPerTrade} onChange={(e) => setRiskPerTrade(e.target.value)} placeholder="e.g., 2" className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none" />
                  <p className="text-xs text-zinc-500 mt-1">Recommended: 1-2% of account per trade</p>
                </div>
              </div>
            </div>
            <button onClick={saveSettings} disabled={saving} className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-xl font-bold transition disabled:opacity-50">
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        )}

        {/* ─── SUBSCRIPTION ────────────────────── */}
        {activeSection === "subscription" && (
          <div className="space-y-6 max-w-3xl">
            <div className={`p-6 rounded-2xl border ${isPremium ? "bg-yellow-900/20 border-yellow-500/30" : "bg-zinc-900 border-zinc-800"}`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-lg">{isPremium ? "💎 Premium Member" : "🆓 Free Plan"}</h3>
                  <p className="text-zinc-400 text-sm">{isPremium ? "You have full access to all features" : "Upgrade to unlock advanced features"}</p>
                </div>
                {isPremium ? (
                  <span className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold text-sm">Active</span>
                ) : (
                  <button onClick={handleUpgrade} className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold transition">
                    Upgrade to Premium — $9.99/month
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { feature: "Unlimited Trades", free: "100 trades", premium: "Unlimited", icon: "📊" },
                { feature: "AI Analytics", free: "Basic", premium: "Advanced + Leak Tracker", icon: "🤖" },
                { feature: "Export Reports", free: "CSV only", premium: "CSV, PDF, JSON", icon: "📥" },
                { feature: "Pre-Market Protocol", free: "Not included", premium: "Daily AI game plan", icon: "📋" },
                { feature: "Ghost Equity Curve", free: "Not included", premium: "Full visual analysis", icon: "👻" },
                { feature: "Priority Support", free: "Community", premium: "Direct chat support", icon: "💬" },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                  <p className="text-lg mb-2">{item.icon} {item.feature}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Free: {item.free}</span>
                    <span className="text-yellow-400 font-bold">Premium: {item.premium}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── DANGER ZONE ─────────────────────── */}
        {activeSection === "danger" && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-red-950/20 border border-red-500/30 p-6 rounded-2xl">
              <h3 className="font-bold text-red-400 text-lg mb-2">⚠️ Danger Zone</h3>
              <p className="text-zinc-400 text-sm mb-4">Once you delete your account, there is no going back. All your data will be permanently removed.</p>
              <button onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition">
                Delete My Account
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}