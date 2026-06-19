import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) return NextResponse.json({ success: false, totalTrades: 0, message: "No userId" })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/trades?select=*&user_id=eq.${userId}&order=created_at.desc`, {
      headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    })
    const trades = await res.json()
    if (!trades || trades.length === 0) return NextResponse.json({ success: true, totalTrades: 0, message: "No trades yet. Start journaling to unlock AI insights!" })

    let totalPnL = 0, wins = 0, losses = 0
    const assetMap: Record<string, { pnl: number; trades: number; wins: number }> = {}
    const emotionMap: Record<string, { pnl: number; trades: number; wins: number }> = {}
    let buyPnL = 0, buyWins = 0, buyTrades = 0, sellPnL = 0, sellWins = 0, sellTrades = 0
    let largestWin = -Infinity, largestLoss = Infinity

    trades.forEach((t: any) => {
      totalPnL += t.pnl || 0
      if (t.pnl > 0) { wins++; if (t.pnl > largestWin) largestWin = t.pnl }
      else if (t.pnl < 0) { losses++; if (t.pnl < largestLoss) largestLoss = t.pnl }
      
      if (!assetMap[t.asset]) assetMap[t.asset] = { pnl: 0, trades: 0, wins: 0 }
      assetMap[t.asset].pnl += t.pnl || 0; assetMap[t.asset].trades++; if (t.pnl > 0) assetMap[t.asset].wins++
      
      if (t.emotion) {
        if (!emotionMap[t.emotion]) emotionMap[t.emotion] = { pnl: 0, trades: 0, wins: 0 }
        emotionMap[t.emotion].pnl += t.pnl || 0; emotionMap[t.emotion].trades++; if (t.pnl > 0) emotionMap[t.emotion].wins++
      }
      
      if (t.direction === "Buy") { buyTrades++; buyPnL += t.pnl || 0; if (t.pnl > 0) buyWins++ }
      else { sellTrades++; sellPnL += t.pnl || 0; if (t.pnl > 0) sellWins++ }
    })

    const winRate = ((wins / trades.length) * 100).toFixed(1)
    const avgWin = wins > 0 ? trades.filter((t: any) => t.pnl > 0).reduce((a: number, b: any) => a + b.pnl, 0) / wins : 0
    const avgLoss = losses > 0 ? Math.abs(trades.filter((t: any) => t.pnl < 0).reduce((a: number, b: any) => a + b.pnl, 0) / losses) : 0
    const profitFactor = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "∞"
    const expectancy = ((parseFloat(winRate) / 100) * avgWin - ((100 - parseFloat(winRate)) / 100) * avgLoss).toFixed(2)

    const sortedAssets = Object.entries(assetMap).sort((a, b) => b[1].pnl - a[1].pnl)
    const sortedEmotions = Object.entries(emotionMap).filter(([, d]) => d.trades >= 2).sort((a, b) => (b[1].wins / b[1].trades) - (a[1].wins / a[1].trades))

    const ifCutLossesEarlier = `+$${(trades.filter((t: any) => t.pnl < 0).reduce((a: number, b: any) => a + Math.abs(b.pnl) * 0.5, 0)).toFixed(2)} if you cut losses at 50%`
    const ifLetWinnersRun = `+$${(trades.filter((t: any) => t.pnl > 0).reduce((a: number, b: any) => a + b.pnl * 0.3, 0)).toFixed(2)} if winners ran 30% longer`
    const ifNoEmotionTrades = `+$${(trades.filter((t: any) => t.emotion && (t.emotion.includes("Fearful") || t.emotion.includes("Anxious") || t.emotion.includes("Greedy"))).reduce((a: number, b: any) => a + Math.abs(b.pnl || 0), 0)).toFixed(2)} by avoiding emotional trades`
    const ifOnlyBestAsset = sortedAssets[0] ? `+$${sortedAssets[0][1].pnl.toFixed(2)} if only trading ${sortedAssets[0][0]}` : "N/A"

    const suggestions: string[] = []
    const warnings: string[] = []
    
    if (parseFloat(winRate) > 60) suggestions.push(`Strong ${winRate}% win rate! Focus on scaling up gradually.`)
    else if (parseFloat(winRate) > 45) suggestions.push(`Decent ${winRate}% win rate. Improve your risk-reward ratio.`)
    else warnings.push(`Win rate is ${winRate}%. Review your strategy and consider paper trading.`)

    if (avgLoss > avgWin) warnings.push(`Avg loss ($${avgLoss.toFixed(2)}) > avg win ($${avgWin.toFixed(2)}). Tighten stops.`)
    else suggestions.push(`Good risk management: wins ($${avgWin.toFixed(2)}) > losses ($${avgLoss.toFixed(2)}).`)

    if (sortedEmotions.length > 0) {
      const best = sortedEmotions[0]
      suggestions.push(`Best mindset: "${best[0]}" (${((best[1].wins / best[1].trades) * 100).toFixed(0)}% win). Cultivate this before trading.`)
    }

    let motivation = ""
    if (totalPnL > 100) motivation = "🚀 You're consistently profitable! Scale your proven strategy."
    else if (totalPnL > 0) motivation = "📈 You're in the green. Small improvements compound into big gains."
    else if (parseFloat(winRate) > 50) motivation = "💪 Good win rate but losses outweigh wins. Cut losers faster."
    else motivation = "🌱 Every pro trader started here. Review, adapt, grow."

    return NextResponse.json({
      success: true,
      totalTrades: trades.length,
      summary: { winRate, winningTrades: wins, losingTrades: losses, totalPnl: totalPnL.toFixed(2), profitFactor, expectancy, maxWinStreak: 0, maxLossStreak: 0, avgWin: avgWin.toFixed(2), avgLoss: avgLoss.toFixed(2) },
      assets: {
        best: sortedAssets[0] ? { symbol: sortedAssets[0][0], pnl: sortedAssets[0][1].pnl.toFixed(2), trades: sortedAssets[0][1].trades, winRate: ((sortedAssets[0][1].wins / sortedAssets[0][1].trades) * 100).toFixed(1) } : null,
        worst: sortedAssets[sortedAssets.length - 1] ? { symbol: sortedAssets[sortedAssets.length - 1][0], pnl: sortedAssets[sortedAssets.length - 1][1].pnl.toFixed(2), trades: sortedAssets[sortedAssets.length - 1][1].trades, winRate: ((sortedAssets[sortedAssets.length - 1][1].wins / sortedAssets[sortedAssets.length - 1][1].trades) * 100).toFixed(1) } : null,
        all: sortedAssets.map(([sym, d]) => ({ symbol: sym, pnl: d.pnl.toFixed(2), trades: d.trades, winRate: ((d.wins / d.trades) * 100).toFixed(1) })),
      },
      emotions: {
        best: sortedEmotions[0] ? { emotion: sortedEmotions[0][0], winRate: ((sortedEmotions[0][1].wins / sortedEmotions[0][1].trades) * 100).toFixed(1), pnl: sortedEmotions[0][1].pnl.toFixed(2) } : null,
        worst: sortedEmotions[sortedEmotions.length - 1] ? { emotion: sortedEmotions[sortedEmotions.length - 1][0], winRate: ((sortedEmotions[sortedEmotions.length - 1][1].wins / sortedEmotions[sortedEmotions.length - 1][1].trades) * 100).toFixed(1), pnl: sortedEmotions[sortedEmotions.length - 1][1].pnl.toFixed(2) } : null,
      },
      direction: { buyWinRate: buyTrades > 0 ? ((buyWins / buyTrades) * 100).toFixed(1) : "0", buyTrades, buyPnL: buyPnL.toFixed(2), sellWinRate: sellTrades > 0 ? ((sellWins / sellTrades) * 100).toFixed(1) : "0", sellTrades, sellPnL: sellPnL.toFixed(2) },
      whatIf: { ifCutLossesEarlier, ifLetWinnersRun, ifNoEmotionTrades, ifOnlyBestAsset, ifOnlyBestSession: "Add more trades to unlock" },
      risk: { avgTradesPerDay: (trades.length / Math.max(1, new Set(trades.map((t: any) => t.created_at?.split("T")[0])).size)).toFixed(1), largestWin: largestWin > -Infinity ? largestWin.toFixed(2) : "0", largestLoss: largestLoss < Infinity ? largestLoss.toFixed(2) : "0", consecutiveWins: 0, consecutiveLosses: 0 },
      suggestions,
      warnings,
      motivation,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, totalTrades: 0, message: "Error: " + e.message })
  }
}