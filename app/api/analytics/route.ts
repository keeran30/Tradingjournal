import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId")
    
    if (!userId) {
      return NextResponse.json({
        success: true,
        totalTrades: 0,
        message: "Please log in to see analytics"
      })
    }

    // Fetch only this user's trades
    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ success: false, totalTrades: 0, message: "Error fetching data" })
    }

    if (!trades || trades.length === 0) {
      return NextResponse.json({
        success: true,
        totalTrades: 0,
        message: "No trades yet. Add some trades to see AI insights!"
      })
    }

    // Calculate stats
    let totalPnL = 0, winningTrades = 0, losingTrades = 0
    trades.forEach((t: any) => {
      totalPnL += t.pnl || 0
      if (t.pnl > 0) winningTrades++
      else if (t.pnl < 0) losingTrades++
    })

    const winRate = ((winningTrades / trades.length) * 100).toFixed(1)
    const avgWin = winningTrades > 0 ? trades.filter((t: any) => t.pnl > 0).reduce((a: number, b: any) => a + b.pnl, 0) / winningTrades : 0
    const avgLoss = losingTrades > 0 ? Math.abs(trades.filter((t: any) => t.pnl < 0).reduce((a: number, b: any) => a + b.pnl, 0) / losingTrades) : 0
    const profitFactor = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "∞"
    const expectancy = ((winningTrades / trades.length) * avgWin - (losingTrades / trades.length) * avgLoss).toFixed(2)

    // Asset performance
    const assetMap: Record<string, { pnl: number; trades: number; wins: number }> = {}
    trades.forEach((t: any) => {
      if (!assetMap[t.asset]) assetMap[t.asset] = { pnl: 0, trades: 0, wins: 0 }
      assetMap[t.asset].pnl += t.pnl || 0
      assetMap[t.asset].trades++
      if (t.pnl > 0) assetMap[t.asset].wins++
    })
    const sorted = Object.entries(assetMap).sort((a, b) => b[1].pnl - a[1].pnl)
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]

    // Direction
    let buyTrades = 0, buyWins = 0, buyPnL = 0, sellTrades = 0, sellWins = 0, sellPnL = 0
    trades.forEach((t: any) => {
      if (t.direction === "Buy") { buyTrades++; buyPnL += t.pnl || 0; if (t.pnl > 0) buyWins++ }
      else { sellTrades++; sellPnL += t.pnl || 0; if (t.pnl > 0) sellWins++ }
    })

    // Streaks
    let maxWinStreak = 0, maxLossStreak = 0, ws = 0, ls = 0
    trades.slice().reverse().forEach((t: any) => {
      if (t.pnl > 0) { ws++; ls = 0; maxWinStreak = Math.max(maxWinStreak, ws) }
      else if (t.pnl < 0) { ls++; ws = 0; maxLossStreak = Math.max(maxLossStreak, ls) }
    })

    // Suggestions
    const suggestions: string[] = []
    const warnings: string[] = []
    if (parseFloat(winRate) > 60) suggestions.push("🎯 Strong win rate! Focus on consistency.")
    if (parseFloat(winRate) < 40) warnings.push("⚠️ Win rate below 40%. Review your strategy.")
    if (parseFloat(profitFactor) > 2) suggestions.push("💰 Excellent profit factor!")
    if (parseFloat(profitFactor) < 1) warnings.push("📉 Losses bigger than wins. Tighten stops.")
    if (maxWinStreak >= 3) suggestions.push(`🔥 ${maxWinStreak}-trade winning streak!`)
    if (maxLossStreak >= 3) warnings.push(`⚠️ ${maxLossStreak}-trade losing streak. Take a break.`)

    let motivation = totalPnL > 0 ? "🚀 You're profitable! Keep it up." : "🌱 Keep learning. Every trade is a lesson."

    return NextResponse.json({
      success: true,
      totalTrades: trades.length,
      summary: {
        winRate,
        winningTrades,
        losingTrades,
        totalPnl: totalPnL.toFixed(2),
        profitFactor,
        expectancy,
        maxWinStreak,
        maxLossStreak,
      },
      assets: {
        best: best ? { symbol: best[0], pnl: best[1].pnl.toFixed(2), trades: best[1].trades, winRate: ((best[1].wins / best[1].trades) * 100).toFixed(1) } : null,
        worst: worst && worst[0] !== best?.[0] ? { symbol: worst[0], pnl: worst[1].pnl.toFixed(2), trades: worst[1].trades, winRate: ((worst[1].wins / worst[1].trades) * 100).toFixed(1) } : null,
      },
      direction: {
        buyWinRate: buyTrades > 0 ? ((buyWins / buyTrades) * 100).toFixed(1) : "0",
        buyTrades, buyPnL: buyPnL.toFixed(2),
        sellWinRate: sellTrades > 0 ? ((sellWins / sellTrades) * 100).toFixed(1) : "0",
        sellTrades, sellPnL: sellPnL.toFixed(2),
      },
      suggestions,
      warnings,
      motivation,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ success: false, totalTrades: 0, message: "Error" })
  }
}