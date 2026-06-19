import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) return NextResponse.json({ success: false, totalTrades: 0, message: "No userId" })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/trades?select=*&user_id=eq.${userId}&order=created_at.desc`,
      {
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
      }
    )

    const trades = await response.json()
    
    if (!trades || trades.length === 0) {
      return NextResponse.json({ success: true, totalTrades: 0, message: "No trades yet" })
    }

    let totalPnL = 0, wins = 0, losses = 0
    trades.forEach((t: any) => { totalPnL += t.pnl || 0; if (t.pnl > 0) wins++; else if (t.pnl < 0) losses++ })

    return NextResponse.json({
      success: true,
      totalTrades: trades.length,
      summary: {
        winRate: ((wins / trades.length) * 100).toFixed(1),
        winningTrades: wins,
        losingTrades: losses,
        totalPnl: totalPnL.toFixed(2),
        profitFactor: "0",
        expectancy: "0",
        maxWinStreak: 0,
        maxLossStreak: 0,
      },
      assets: { best: null, worst: null },
      direction: { buyWinRate: "0", buyTrades: 0, buyPnL: "0", sellWinRate: "0", sellTrades: 0, sellPnL: "0" },
      suggestions: [],
      warnings: [],
      motivation: totalPnL > 0 ? "Profitable!" : "Keep learning!",
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, totalTrades: 0, message: "Error: " + e.message })
  }
}