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
    
    const data = await response.json()
    const trades = Array.isArray(data) ? data : []

    if (!trades || trades.length === 0) {
      return NextResponse.json({
        success: true,
        totalTrades: 0,
        message: "No trades yet. Start journaling to unlock AI insights!",
      })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentTrades = trades.filter((t: any) => new Date(t.created_at) >= thirtyDaysAgo)
    const oldTrades = trades.filter((t: any) => new Date(t.created_at) < thirtyDaysAgo)
    const sortedTrades = [...trades].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    // AI Trading Score
    const positiveEmotions = ["Calm", "Confident", "Focused", "Patient", "Disciplined", "Prepared", "Mindful"]
    const negativeEmotions = ["Fearful", "Anxious", "Greedy", "Stressed", "Panicked", "Revengeful", "Desperate", "Euphoric"]

    const calcDiscipline = () => {
      const withEmotion = trades.filter((t: any) => t.emotion)
      if (withEmotion.length === 0) return 50
      const pos = withEmotion.filter((t: any) => positiveEmotions.some(e => t.emotion?.includes(e))).length
      return Math.round((pos / withEmotion.length) * 100)
    }

    const calcRisk = () => {
      const wins = trades.filter((t: any) => t.pnl > 0)
      const losses = trades.filter((t: any) => t.pnl < 0)
      if (losses.length === 0) return 90
      const avgW = wins.length > 0 ? wins.reduce((a: number, t: any) => a + t.pnl, 0) / wins.length : 0
      const avgL = Math.abs(losses.reduce((a: number, t: any) => a + t.pnl, 0) / losses.length)
      if (avgW === 0) return 30
      return Math.min(100, Math.round((avgW / avgL) * 30))
    }

    const calcConsistency = () => {
      if (trades.length < 5) return 50
      const daysCount = new Set(trades.map((t: any) => t.created_at?.split("T")[0])).size
      const avg = trades.length / Math.max(1, daysCount)
      if (avg > 5) return Math.max(20, 100 - (avg - 5) * 15)
      if (avg >= 1 && avg <= 3) return 85
      return 60
    }

    const calcEmotional = () => {
      const withEmotion = trades.filter((t: any) => t.emotion)
      if (withEmotion.length === 0) return 50
      const neg = withEmotion.filter((t: any) => negativeEmotions.some(e => t.emotion?.includes(e))).length
      return Math.round(100 - (neg / withEmotion.length) * 50)
    }

    const calcExecution = () => {
      const wins = trades.filter((t: any) => t.pnl > 0).length
      const wr = (wins / trades.length) * 100
      return Math.min(100, Math.round(wr))
    }

    const discipline = calcDiscipline()
    const riskManagement = calcRisk()
    const consistency = calcConsistency()
    const emotionalControl = calcEmotional()
    const executionQuality = calcExecution()
    const aiScore = Math.round((discipline + riskManagement + consistency + emotionalControl + executionQuality) / 5)

    // Best conditions
    const assetMap: Record<string, { trades: number; wins: number; pnl: number }> = {}
    trades.forEach((t: any) => {
      if (!assetMap[t.asset]) assetMap[t.asset] = { trades: 0, wins: 0, pnl: 0 }
      assetMap[t.asset].trades++
      if (t.pnl > 0) assetMap[t.asset].wins++
      assetMap[t.asset].pnl += t.pnl || 0
    })
    const bestAsset = Object.entries(assetMap).sort((a, b) => b[1].pnl - a[1].pnl)[0]

    // Emotion impact
    const emMap: Record<string, { trades: number; wins: number; pnl: number }> = {}
    trades.filter((t: any) => t.emotion).forEach((t: any) => {
      if (!emMap[t.emotion]) emMap[t.emotion] = { trades: 0, wins: 0, pnl: 0 }
      emMap[t.emotion].trades++
      if (t.pnl > 0) emMap[t.emotion].wins++
      emMap[t.emotion].pnl += t.pnl || 0
    })

    const emotionImpact = Object.entries(emMap)
      .map(([emotion, d]) => ({
        emotion,
        trades: d.trades,
        winRate: Math.round((d.wins / d.trades) * 100),
        avgPnL: (d.pnl / d.trades).toFixed(2),
        totalPnL: d.pnl.toFixed(2),
      }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 6)

    // Killers
    const killers: any[] = []
    const revengeTrades = trades.filter((t: any) => t.emotion && (t.emotion.includes("Revengeful") || t.emotion.includes("Angry")))
    if (revengeTrades.length > 0) {
      killers.push({
        name: "Revenge Trading",
        cost: Math.abs(revengeTrades.reduce((a: number, t: any) => a + (t.pnl || 0), 0)).toFixed(2),
        trades: revengeTrades.length,
        recommendation: "Stop trading for 30 minutes after any loss.",
      })
    }

    // Momentum
    const momentum = {
      executionQuality: recentTrades.length > 0 && oldTrades.length > 0
        ? Math.round((recentTrades.filter((t: any) => t.pnl > 0).length / recentTrades.length) * 100 - (oldTrades.filter((t: any) => t.pnl > 0).length / oldTrades.length) * 100)
        : 0,
      riskManagement: 0,
      discipline: 0,
      profitability: recentTrades.length > 0 ? recentTrades.reduce((a: number, t: any) => a + (t.pnl || 0), 0).toFixed(2) : "0",
    }

    // Risk
    let peak = 0, maxDD = 0, running = 0
    sortedTrades.forEach((t: any) => { running += t.pnl || 0; peak = Math.max(peak, running); maxDD = Math.max(maxDD, peak - running) })
    const riskIntel = {
      rating: maxDD < 100 ? "Good" : "Moderate",
      maxDrawdown: maxDD.toFixed(2),
      avgRiskPerTrade: trades.filter((t: any) => t.pnl < 0).length > 0
        ? Math.abs(trades.filter((t: any) => t.pnl < 0).reduce((a: number, t: any) => a + t.pnl, 0) / trades.filter((t: any) => t.pnl < 0).length).toFixed(2)
        : "0",
      recommendation: "Risk levels acceptable",
    }

    // Alerts
    const alerts: any[] = []
    const daysCount = new Set(trades.map((t: any) => t.created_at?.split("T")[0])).size
    const avgPerDay = trades.length / Math.max(1, daysCount)
    if (avgPerDay > 5) alerts.push({ type: "warning", message: `You average ${avgPerDay.toFixed(1)} trades/day. Quality drops after 5.`, riskLevel: "High" })

    // Coach summary
    const scores = [
      { name: "Trade Execution", score: executionQuality },
      { name: "Discipline", score: discipline },
      { name: "Risk Management", score: riskManagement },
      { name: "Consistency", score: consistency },
      { name: "Emotional Control", score: emotionalControl },
    ].sort((a, b) => b.score - a.score)

    const coachSummary = {
      strongestSkill: scores[0].name,
      weakestSkill: scores[scores.length - 1].name,
      fastestImprovement: "Execution Quality",
      highestOpportunity: bestAsset ? `Focus on ${bestAsset[0]} trades` : "Add more trades",
    }

    // Edge
    const edge = {
      mostProfitableAsset: bestAsset?.[0] || "N/A",
      mostProfitableAssetPnL: bestAsset?.[1].pnl.toFixed(2) || "0",
      mostProfitableTime: "Analyze more trades",
      mostProfitableDirection: trades.filter((t: any) => t.direction === "Buy").length > trades.filter((t: any) => t.direction === "Sell").length ? "Long" : "Short",
      bestWinRateAsset: bestAsset?.[0] || "N/A",
      bestWinRate: bestAsset ? Math.round((bestAsset[1].wins / bestAsset[1].trades) * 100) : 0,
      averageRR: "0",
    }

    const totalPnL = trades.reduce((a: number, t: any) => a + (t.pnl || 0), 0)

    return NextResponse.json({
      success: true,
      totalTrades: trades.length,
      aiScore,
      scores: { discipline, riskManagement, consistency, emotionalControl, executionQuality },
      coachSummary,
      hiddenPatterns: [],
      bestConditions: {
        bestAsset: bestAsset?.[0] || "N/A",
        bestAssetWinRate: bestAsset ? Math.round((bestAsset[1].wins / bestAsset[1].trades) * 100) : 0,
        bestSession: "Analyze more trades",
        bestDay: "Analyze more trades",
        bestDirection: edge.mostProfitableDirection,
      },
      edge,
      accountKillers: killers,
      emotionalImpact: emotionImpact,
      performanceMomentum: momentum,
      riskIntelligence: riskIntel,
      behavioralAlerts: alerts,
      suggestions: [`Your AI Trading Score is ${aiScore}/100. Focus on improving ${coachSummary.weakestSkill}.`],
      warnings: alerts.map(a => a.message),
      motivation: aiScore >= 70 ? "🚀 Professional level trading. Keep refining." : aiScore >= 50 ? "📈 Solid foundation. Level up your weakest area." : "🌱 Building blocks are there. Stay consistent.",
    })
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      totalTrades: 0,
      message: "Error: " + (e.message || "Unknown error"),
    })
  }
}