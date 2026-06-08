"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
          TradeVault
        </h1>
        <p className="text-xl mb-2 text-zinc-300 max-w-2xl">
          The smart trading journal powered by AI
        </p>
        <p className="text-lg mb-8 text-zinc-400 max-w-xl">
          Track your trades, analyze patterns, and get personalized insights to become a better trader.
        </p>
        
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-4 rounded-xl text-lg font-bold transition"
          >
            Get Started Free
          </button>
          <a
            href="#features"
            className="border border-zinc-600 hover:border-zinc-400 text-white px-8 py-4 rounded-xl text-lg transition"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why TradeVault?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Track Everything</h3>
            <p className="text-zinc-400">
              Log your trades with entry/exit prices, position size, emotions, and notes. All in one place.
            </p>
          </div>

          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">AI Coach</h3>
            <p className="text-zinc-400">
              Get personalized insights, pattern detection, and trading psychology tips from your AI assistant.
            </p>
          </div>

          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold mb-2">Analytics</h3>
            <p className="text-zinc-400">
              See your win rate, profit factor, best performing assets, and detailed performance charts.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-zinc-500 text-sm border-t border-zinc-800">
        © 2026 TradeVault. Built for traders.
      </footer>
    </main>
  );
}