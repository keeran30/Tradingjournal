import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  
  if (!userId) {
    return NextResponse.json({ success: true, totalTrades: 0, message: "No user ID provided" })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  )

  const { data: trades, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error || !trades || trades.length === 0) {
    return NextResponse.json({ success: true, totalTrades: 0, message: "No trades yet" })
  }

  // Quick stats
  let totalPnL = 0, wins = 0, losses = 0
  trades.forEach((t: any) => { totalPnL += t.pnl || 0; if (t.pnl > 0) wins++; else if (t.pnl < 0) losses++ })
  
  const winRate = ((wins / trades.length) * 100).toFixed(1)
  const avgWin = wins > 0 ? trades.filter((t: any) => t.pnl > 0).reduce((a: number, b: any) => a + b.pnl, 0) / wins : 0
  const avgLoss = losses > 0 ? Math.abs(trades.filter((t: any) => t.pnl < 0).reduce((a: number, b: any) => a + b.pnl, 0) / losses) : 0
  const profitFactor = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "∞"

  // Best asset
  const assetMap: Record<string, { pnl: number; trades: number; wins: number }> = {}
  trades.forEach((t: any) => {
    if (!assetMap[t.asset]) assetMap[t.asset] = { pnl: 0, trades: 0, wins: 0 }
    assetMap[t.asset].pnl += t.pnl || 0; assetMap[t.asset].trades++; if (t.pnl > 0) assetMap[t.asset].wins++
  })
  const sorted = Object.entries(assetMap).sort((a, b) => b[1].pnl - a[1].pnl)
  const best = sorted[0]

  const suggestions: string[] = []
  if (parseFloat(winRate) > 60) suggestions.push("Strong win rate - keep it up!")
  if (parseFloat(winRate) < 40) suggestions.push("Review your strategy - win rate below 40%")
  if (parseFloat(profitFactor) > 2) suggestions.push("Excellent profit factor!")
  if (parseFloat(profitFactor) < 1) suggestions.push("Losses bigger than wins - tighten stops")

  return NextResponse.json({
    success: true,
    totalTrades: trades.length,
    summary: { winRate, winningTrades: wins, losingTrades: losses, totalPnl: totalPnL.toFixed(2), profitFactor, expectancy: "0", maxWinStreak: 0, maxLossStreak: 0 },
    assets: { best: best ? { symbol: best[0], pnl: best[1].pnl.toFixed(2), trades: best[1].trades, winRate: ((best[1].wins / best[1].trades) * 100).toFixed(1) } : null, worst: null },
    direction: { buyWinRate: "0", buyTrades: 0, buyPnL: "0", sellWinRate: "0", sellTrades: 0, sellPnL: "0" },
    suggestions, warnings: [], motivation: totalPnL > 0 ? "You're profitable!" : "Keep learning!"
  })
}