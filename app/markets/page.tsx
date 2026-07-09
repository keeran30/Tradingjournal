"use client"

import { useState, useEffect } from "react"
import Sidebar from "../components/Sidebar"
import TradingViewChart from "../components/TradingViewChart"
import { ASSETS } from "../data/assets"

interface AssetType {
  symbol: string
  name: string
  type: string
  exchange?: string
}

export default function MarketsPage() {
  const [selected, setSelected] = useState<AssetType>(ASSETS[0])
  const [query, setQuery] = useState("")
  const [quote, setQuote] = useState<{ price: number; changePercent: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/price?symbol=${selected.symbol}`)
        const data = await res.json()
        if (!cancelled && data.price) {
          setQuote(data)
        }
      } catch (e) {
        console.error("Failed to fetch quote:", e)
      }
    }
    fetchQuote()
    const interval = setInterval(fetchQuote, 10000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [selected])

  const filtered = query
    ? ASSETS.filter(a => a.symbol.toUpperCase().includes(query.toUpperCase()) || a.name.toUpperCase().includes(query.toUpperCase())).slice(0, 8)
    : []

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{selected.symbol}</h1>
            <p className="text-zinc-400 text-sm">{selected.name}</p>
          </div>
          {quote?.price && (
            <div className="text-right">
              <p className="text-3xl font-bold">${quote.price.toLocaleString()}</p>
              <p className={quote.changePercent >= 0 ? "text-green-400" : "text-red-400"}>
                {quote.changePercent >= 0 ? "+" : ""}{quote.changePercent?.toFixed(2)}%
              </p>
            </div>
          )}
        </div>

        <div className="relative mb-6 max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search asset..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm"
          />
          {filtered.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden z-10">
              {filtered.map(a => (
                <button
                  key={a.symbol}
                  onClick={() => { setSelected(a); setQuery("") }}
                  className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm"
                >
                  {a.symbol} — {a.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <TradingViewChart symbol={selected.symbol} type={selected.type} />
      </main>
    </div>
  )
}