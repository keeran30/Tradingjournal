import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  
  if (!userId) {
    return NextResponse.json({ success: false, totalTrades: 0, message: "No userId" })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/trades?select=*&user_id=eq.${userId}&order=created_at.desc`,
      {
        headers: { 
          "apikey": serviceKey, 
          "Authorization": `Bearer ${serviceKey}`, 
          "Content-Type": "application/json" 
        },
      }
    )
    
    const data = await res.json()
    
    // Handle both array and object responses
    const trades = Array.isArray(data) ? data : (data.trades || data.data || [])
    
    if (!trades || trades.length === 0) {
      return NextResponse.json({ 
        success: true, 
        totalTrades: 0, 
        message: "No trades yet. Start journaling to see insights!" 
      })
    }

    // Calculate stats
    let totalPnL = 0, wins = 0, losses = 0
    const assetMap: Record<string, { pnl: number; trades: number; wins: number }> = {}
    
    for (const t of trades) {
      const pnl = t.pnl || 0
      totalPnL += pnl
      if (pnl > 0) wins++
      else if (pnl < 0) losses++
      
      const asset = t.asset || "Unknown"
      if (!assetMap[asset]) assetMap[asset] = { pnl: 0, trades: 0, wins: 0 }
      assetMap[asset].pnl += pnl
      assetMap[asset].trades++
      if (pnl > 0) assetMap[asset].wins++
    }

    const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : "0"
    const sortedAssets = Object.entries(assetMap).sort((a, b) => b[1].pnl - a[1].pnl)
    
    const suggestions: string[] = []
    const wr = parseFloat(winRate)
    if (wr > 60) suggestions.push(`Strong ${winRate}% win rate — focus on scaling up.`)
    else if (wr > 45) suggestions.push(`${winRate}% win rate — work on risk-reward ratio.`)
    else if (trades.length > 0) suggestions.push(`${winRate}% win rate — review your entry strategy.`)

    if (totalPnL > 0) suggestions.push(`Total profit: +$${totalPnL.toFixed(2)} — keep doing what works!`)
    else if (totalPnL < 0) suggestions.push(`Total loss: -$${Math.abs(totalPnL).toFixed(2)} — cut losers faster.`)

    return NextResponse.json({
      success: true,
      totalTrades: trades.length,
      summary: {
        winRate,
        winningTrades: wins,
        losingTrades: losses,
        totalPnl: totalPnL.toFixed(2),
        profitFactor: "1.0",
        expectancy: "0.00",
        maxWinStreak: 0,
        maxLossStreak: 0,
        avgWin: wins > 0 ? (trades.filter((t: any) => t.pnl > 0).reduce((a: number, t: any) => a + t.pnl, 0) / wins).toFixed(2) : "0",
        avgLoss: losses > 0 ? Math.abs(trades.filter((t: any) => t.pnl < 0).reduce((a: number, t: any) => a + t.pnl, 0) / losses).toFixed(2) : "0",
      },
      assets: {
        best: sortedAssets[0] ? { 
          symbol: sortedAssets[0][0], 
          pnl: sortedAssets[0][1].pnl.toFixed(2), 
          trades: sortedAssets[0][1].trades, 
          winRate: ((sortedAssets[0][1].wins / sortedAssets[0][1].trades) * 100).toFixed(1) 
        } : null,
        worst: null,
        all: sortedAssets.map(([sym, d]) => ({ 
          symbol: sym, 
          pnl: d.pnl.toFixed(2), 
          trades: d.trades, 
          winRate: ((d.wins / d.trades) * 100).toFixed(1) 
        })),
      },
      emotions: { best: null, worst: null },
      direction: { buyWinRate: "0", buyTrades: 0, buyPnL: "0", sellWinRate: "0", sellTrades: 0, sellPnL: "0" },
      whatIf: { 
        ifCutLossesEarlier: "Trade more to unlock", 
        ifLetWinnersRun: "Trade more to unlock", 
        ifNoEmotionTrades: "Trade more to unlock", 
        ifOnlyBestAsset: "Trade more to unlock", 
        ifOnlyBestSession: "Trade more to unlock" 
      },
      risk: { avgTradesPerDay: "0", largestWin: "0", largestLoss: "0", consecutiveWins: 0, consecutiveLosses: 0 },
      suggestions,
      warnings: [],
      motivation: totalPnL > 0 ? "🚀 You're profitable! Keep going." : "🌱 Keep learning. Every trade is a lesson.",
    })
  } catch (e: any) {
    return NextResponse.json({ 
      success: false, 
      totalTrades: 0, 
      message: "Error: " + (e.message || "Unknown error") 
    })
  }
}