"use client"

import { useRouter } from "next/navigation"
import Sidebar from "../components/Sidebar"

export default function AboutPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />
      
      <section className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            About TradeVault
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Built by traders, for traders. We believe data-driven insights are the key to consistent profitability.
          </p>
        </div>

        {/* Mission */}
        <div className="max-w-4xl mx-auto space-y-20">
          <section className="text-center">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-zinc-300 text-lg leading-relaxed max-w-3xl mx-auto">
              TradeVault was built to solve a problem every trader faces: understanding what actually works and what doesn&apos;t. 
              Most traders rely on gut feeling. We replace gut feeling with cold, hard data. Our AI analyzes your trades, 
              finds hidden behavioral patterns, and tells you exactly what&apos;s costing you money — and how to fix it.
            </p>
          </section>

          {/* What Makes Us Different */}
          <section>
            <h2 className="text-3xl font-bold text-center mb-10">What Makes TradeVault Different</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: "🔴",
                  title: "Leak Tracker",
                  description: "We don't just show you stats. We detect revenge trading, FOMO entries, and overtrading — and put a dollar amount on what they're costing you.",
                },
                {
                  icon: "👻",
                  title: "Ghost Equity Curve",
                  description: "See what your account would look like if you simply followed your rules. The gap between reality and potential is your greatest motivator.",
                },
                {
                  icon: "📋",
                  title: "Pre-Market Protocol",
                  description: "Every trading day starts with an AI-generated game plan based on your actual weaknesses — not generic advice.",
                },
                {
                  icon: "🏆",
                  title: "Edge Discovery",
                  description: "We find exactly where your edge exists — which asset, which session, which day produces your best results.",
                },
                {
                  icon: "🧠",
                  title: "Psychology First",
                  description: "Trading is 80% psychology. We track your emotions with every trade and correlate them to your P&L.",
                },
                {
                  icon: "🔒",
                  title: "Privacy by Design",
                  description: "Your data is completely isolated with Row Level Security. You own your data. Period.",
                },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-yellow-500/30 transition group">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-400 transition">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Who Is This For */}
          <section>
            <h2 className="text-3xl font-bold text-center mb-10">Who Is TradeVault For?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {[
                {
                  title: "Day Traders",
                  description: "Track every scalp and momentum trade. See which sessions you dominate and which you should skip.",
                },
                {
                  title: "Swing Traders",
                  description: "Log multi-day positions. Analyze hold times, drawdown patterns, and optimal exit strategies.",
                },
                {
                  title: "Forex & Crypto Traders",
                  description: "Full support for forex pairs, crypto, commodities, and indices. One journal for all your markets.",
                },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                  <h3 className="text-xl font-bold mb-3 text-yellow-400">{item.title}</h3>
                  <p className="text-zinc-400 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Stack */}
          <section className="text-center">
            <h2 className="text-3xl font-bold mb-6">Built With Modern Technology</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {["Next.js 16", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL", "Stripe", "Groq AI", "Vercel", "TradingView"].map(tech => (
                <span key={tech} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-sm font-medium border border-zinc-700">
                  {tech}
                </span>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center pb-16">
            <h2 className="text-3xl font-bold mb-4">Ready to Find Your Edge?</h2>
            <p className="text-zinc-400 mb-8">Start free. Upgrade when you&apos;re ready for advanced analytics.</p>
            <button
              onClick={() => router.push("/auth")}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-10 py-4 rounded-xl text-lg font-bold transition shadow-lg shadow-yellow-500/20"
            >
              Start Journaling Free →
            </button>
          </section>
        </div>
      </section>
    </main>
  )
}