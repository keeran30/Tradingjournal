"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "../components/Sidebar"
import AIAssistant from "../components/AIAssistant"
import { supabase } from "../lib/supabase"
import AppLoader from "../components/AppLoader"

interface Trade {
  id: string; pnl: number; asset: string; direction: string; emotion: string | null; created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/auth")
        return
      }
      setUserId(user.id)
      fetchTrades(user.id)
    }
    init()
  }, [router])

  const fetchTrades = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })

      if (error) { setTrades([]) } else { setTrades(data || []) }
    } catch (err) {
      setTrades([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <AppLoader message="Loading Dashboard" />

  const totalTrades = trades.length
  const winningTrades = trades.filter((t) => t.pnl > 0).length
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : "0"
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />
      <section className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-zinc-400 mb-10">Trading performance overview.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-zinc-400 text-sm mb-2">Total Trades</h2>
            <p className="text-4xl font-bold">{totalTrades}</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-zinc-400 text-sm mb-2">Win Rate</h2>
            <p className={`text-4xl font-bold ${parseFloat(winRate) >= 50 ? "text-green-400" : "text-red-400"}`}>
              {winRate}%
            </p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-zinc-400 text-sm mb-2">Total P&L</h2>
            <p className={`text-4xl font-bold ${totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${totalPnL.toFixed(2)}
            </p>
          </div>
        </div>

        {totalTrades === 0 && (
          <div className="text-center py-16 mt-8 bg-zinc-900 rounded-2xl border border-zinc-800">
            <p className="text-6xl mb-4">📊</p>
            <p className="text-zinc-400 mb-4 text-lg">No trades yet!</p>
            <a href="/trades" className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition inline-block">
              Go to Trading Journal →
            </a>
          </div>
        )}
      </section>
      <AIAssistant />
    </main>
  )
}