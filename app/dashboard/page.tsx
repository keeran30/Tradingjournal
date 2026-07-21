"use client"

import { useState, useEffect } from "react"
import Sidebar from "../components/Sidebar"
import AIAssistant from "../components/AIAssistant"
import { supabase } from "../lib/supabase"

export default function DashboardPage() {
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) window.location.href = "/auth"
      else loadTrades(user.id)
    })
  }, [])

  const loadTrades = async (uid: string) => {
    const { data } = await supabase.from("trades").select("*").eq("user_id", uid).order("created_at", { ascending: false })
    setTrades(data || [])
    setLoading(false)
  }

  if (loading) return <main className="min-h-screen bg-zinc-950"></main>

  const wins = trades.filter(t => t.pnl > 0).length
  const pnl = trades.reduce((s, t) => s + (t.pnl || 0), 0)

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex">
      <Sidebar />
      <section className="flex-1 p-8">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <p className="text-zinc-400 text-sm">Total Trades</p>
            <p className="text-4xl font-bold">{trades.length}</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <p className="text-zinc-400 text-sm">Win Rate</p>
            <p className="text-4xl font-bold text-green-400">{trades.length > 0 ? ((wins/trades.length)*100).toFixed(1) : 0}%</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <p className="text-zinc-400 text-sm">Total P&L</p>
            <p className={`text-4xl font-bold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>${pnl.toFixed(2)}</p>
          </div>
        </div>
      </section>
      <AIAssistant />
    </main>
  )
}