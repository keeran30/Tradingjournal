"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "./lib/supabase"
import AppLoader from "./components/AppLoader"

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }
    checkUser()
  }, [])

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
  }

  if (loading) return <AppLoader message="Welcome to TradeVault" />

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
          TradeVault
        </h1>
        <p className="text-xl mb-2 text-zinc-300 max-w-2xl">
          The AI-Powered Trading Journal That Finds Your Edge
        </p>
        <p className="text-lg mb-8 text-zinc-400 max-w-xl">
          Track trades, detect behavioral leaks, get daily pre-market protocols, and discover exactly where your edge exists.
        </p>
        
        <div className="flex gap-4 flex-wrap justify-center">
          {user ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-4 rounded-xl text-lg font-bold transition shadow-lg shadow-yellow-500/20"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push("/auth")}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-4 rounded-xl text-lg font-bold transition shadow-lg shadow-yellow-500/20"
              >
                Get Started Free
              </button>
              <button
                onClick={() => router.push("/auth")}
                className="border border-zinc-600 hover:border-zinc-400 hover:bg-zinc-800 text-white px-8 py-4 rounded-xl text-lg transition"
              >
                Sign In
              </button>
            </>
          )}
          
          <button
            onClick={scrollToFeatures}
            className="border border-zinc-600 hover:border-zinc-400 text-white px-8 py-4 rounded-xl text-lg transition"
          >
            Learn More ↓
          </button>
        </div>

        {/* Trust Indicators */}
        <div className="flex gap-8 mt-12 text-center">
          <div>
            <p className="text-3xl font-bold text-yellow-400">50</p>
            <p className="text-zinc-500 text-sm">Free Trades</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yellow-400">AI</p>
            <p className="text-zinc-500 text-sm">Powered Analytics</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yellow-400">24/7</p>
            <p className="text-zinc-500 text-sm">Access</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Why TradeVault?</h2>
        <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
          Built by traders, for traders. Every feature is designed to give you an edge in the markets.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-yellow-500/50 transition group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition">📊</div>
            <h3 className="text-xl font-bold mb-2">Track Everything</h3>
            <p className="text-zinc-400 mb-3">
              Log trades with entry/exit prices, position size, and emotional state. Support for stocks, forex, crypto, and commodities.
            </p>
            <ul className="text-sm text-zinc-500 space-y-1">
              <li>✓ Real-time P&L calculation</li>
              <li>✓ Multi-asset support</li>
              <li>✓ Emotion tracking</li>
            </ul>
          </div>

          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-yellow-500/50 transition group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition">🤖</div>
            <h3 className="text-xl font-bold mb-2">AI Analytics</h3>
            <p className="text-zinc-400 mb-3">
              Our AI analyzes your trading patterns to find hidden leaks, discover your edge, and give you a daily pre-market game plan.
            </p>
            <ul className="text-sm text-zinc-500 space-y-1">
              <li>✓ Leak Tracker (revenge, FOMO)</li>
              <li>✓ AI Trading Score</li>
              <li>✓ Pre-Market Protocol</li>
            </ul>
          </div>

          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-yellow-500/50 transition group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition">🧠</div>
            <h3 className="text-xl font-bold mb-2">Trading Psychology</h3>
            <p className="text-zinc-400 mb-3">
              Understand how your emotions impact your performance. See which mindsets produce your best and worst trades.
            </p>
            <ul className="text-sm text-zinc-500 space-y-1">
              <li>✓ Emotion-performance correlation</li>
              <li>✓ Behavioral pattern detection</li>
              <li>✓ Discipline scoring</li>
            </ul>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-yellow-500/50 transition group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition">🏆</div>
            <h3 className="text-xl font-bold mb-2">Edge Discovery</h3>
            <p className="text-zinc-400 mb-3">
              Find exactly where your edge exists. Which asset, which session, which day produces your best results.
            </p>
            <ul className="text-sm text-zinc-500 space-y-1">
              <li>✓ Best performing asset</li>
              <li>✓ Optimal trading session</li>
              <li>✓ Win rate by direction</li>
            </ul>
          </div>

          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-yellow-500/50 transition group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition">📋</div>
            <h3 className="text-xl font-bold mb-2">Pre-Market Protocol</h3>
            <p className="text-zinc-400 mb-3">
              Start every trading day with an AI-generated game plan based on your actual performance data and weaknesses.
            </p>
            <ul className="text-sm text-zinc-500 space-y-1">
              <li>✓ Position size recommendations</li>
              <li>✓ Dead zone alerts</li>
              <li>✓ Daily focus areas</li>
            </ul>
          </div>

          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-yellow-500/50 transition group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition">🔒</div>
            <h3 className="text-xl font-bold mb-2">Privacy First</h3>
            <p className="text-zinc-400 mb-3">
              Your trading data is completely private. Each user's data is isolated with enterprise-grade security.
            </p>
            <ul className="text-sm text-zinc-500 space-y-1">
              <li>✓ Row Level Security</li>
              <li>✓ Encrypted storage</li>
              <li>✓ You own your data</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
        <p className="text-zinc-400 text-center mb-12">Start free. Upgrade when you are ready for advanced analytics.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <p className="text-4xl font-bold mb-4">$0</p>
            <p className="text-zinc-400 mb-6">Perfect for getting started</p>
            <ul className="space-y-2 text-sm text-zinc-300 mb-8">
              <li>✓ 50 trade entries</li>
              <li>✓ Basic analytics</li>
              <li>✓ Emotion tracking</li>
              <li>✓ AI chat (10/day)</li>
              <li>✓ Psychology insights</li>
            </ul>
            <button onClick={() => router.push("/auth")} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition">
              Start Free
            </button>
          </div>

          <div className="bg-gradient-to-b from-yellow-900/30 to-zinc-900 p-8 rounded-2xl border border-yellow-500/30 relative">
            <span className="absolute -top-3 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">Popular</span>
            <h3 className="text-xl font-bold mb-2">Premium</h3>
            <p className="text-4xl font-bold mb-4">$9.99<span className="text-lg text-zinc-400">/month</span></p>
            <p className="text-zinc-400 mb-6">For serious traders</p>
            <ul className="space-y-2 text-sm text-zinc-300 mb-8">
              <li>✓ Unlimited trades</li>
              <li>✓ Full AI Analytics</li>
              <li>✓ Leak Tracker</li>
              <li>✓ Pre-Market Protocol</li>
              <li>✓ Edge Discovery</li>
              <li>✓ Export (HTML, CSV, TXT)</li>
              <li>✓ Unlimited AI chat</li>
              <li>✓ Priority support</li>
            </ul>
            <button onClick={() => router.push("/auth")} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold transition">
              Get Premium
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-20 px-4">
        <h2 className="text-3xl font-bold mb-4">Ready to Find Your Edge?</h2>
        <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
          Join traders who are using data-driven insights to improve their performance.
        </p>
        <button
          onClick={() => router.push("/auth")}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-10 py-4 rounded-xl text-lg font-bold transition shadow-lg shadow-yellow-500/20"
        >
          Start Journaling Free →
        </button>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-zinc-500 text-sm border-t border-zinc-800">
        <div className="flex gap-4 justify-center mb-3 flex-wrap">
          <a href="/terms" className="hover:text-zinc-300 transition">Terms of Service</a>
          <span className="text-zinc-700">·</span>
          <a href="/privacy" className="hover:text-zinc-300 transition">Privacy Policy</a>
          <span className="text-zinc-700">·</span>
          <a href="/contact" className="hover:text-zinc-300 transition">Contact Us</a>
          <span className="text-zinc-700">·</span>
          <a href="/auth" className="hover:text-zinc-300 transition">Sign In</a>
        </div>
        <p>© 2026 TradeVault. Built for traders.</p>
      </footer>
    </main>
  )
}