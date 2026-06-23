import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")
  const isPremium = url.searchParams.get("premium") === "true"
  
  if (!userId) return NextResponse.json({ success: false, totalTrades: 0 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  try {
    const apiUrl = `${supabaseUrl}/rest/v1/trades?select=*&user_id=eq.${userId}&order=created_at.desc`
    const response = await fetch(apiUrl, {
      headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` }
    })
    
    const data = await response.json()
    const trades: any[] = Array.isArray(data) ? data : []

    if (trades.length === 0) {
      return NextResponse.json({ 
        success: true, 
        totalTrades: 0, 
        message: "No trades yet. Add some trades to see AI insights!" 
      })
    }

    const sorted = [...trades].sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    // Basic stats
    const totalPnL = trades.reduce((a: number, t: any) => a + (t.pnl || 0), 0)
    const wins = trades.filter((t: any) => (t.pnl || 0) > 0).length
    const losses = trades.filter((t: any) => (t.pnl || 0) < 0).length
    const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : "0"

    // ─── SCORES (Fixed — no more 0/100) ───────────────
    const posEmotions = ["Calm","Confident","Focused","Patient","Disciplined","Prepared","Mindful"]
    const negEmotions = ["Fearful","Anxious","Greedy","Stressed","Panicked","Revengeful","Desperate","Euphoric","Overconfident","Impatient"]

    const calcDiscipline = (): number => {
      const withEmo = trades.filter((t: any) => t.emotion)
      if (withEmo.length === 0) return 50
      const pos = withEmo.filter((t: any) => posEmotions.some(e => (t.emotion || "").includes(e))).length
      return Math.max(10, Math.min(100, Math.round((pos / withEmo.length) * 100)))
    }

    const calcRisk = (): number => {
      const winTrades = trades.filter((t: any) => (t.pnl || 0) > 0)
      const lossTrades = trades.filter((t: any) => (t.pnl || 0) < 0)
      if (lossTrades.length === 0) return 85
      const avgW = winTrades.length > 0 ? winTrades.reduce((a: number, t: any) => a + (t.pnl || 0), 0) / winTrades.length : 0
      const avgL = Math.abs(lossTrades.reduce((a: number, t: any) => a + (t.pnl || 0), 0) / lossTrades.length)
      if (avgW === 0 || avgL === 0) return 50
      const ratio = avgW / avgL
      return Math.max(10, Math.min(100, Math.round(ratio * 35)))
    }

    const calcConsistency = (): number => {
      if (trades.length < 3) return 50
      const days = new Set(trades.map((t: any) => (t.created_at || "").split("T")[0])).size
      const avg = trades.length / Math.max(1, days)
      if (avg > 8) return Math.max(15, 100 - (avg - 5) * 12)
      if (avg >= 1 && avg <= 3) return 85
      if (avg >= 3 && avg <= 5) return 65
      return 50
    }

    const calcEmotional = (): number => {
      const withEmo = trades.filter((t: any) => t.emotion)
      if (withEmo.length === 0) return 50
      const neg = withEmo.filter((t: any) => negEmotions.some(e => (t.emotion || "").includes(e))).length
      return Math.max(10, Math.min(100, Math.round(100 - (neg / withEmo.length) * 60)))
    }

    const calcExecution = (): number => {
      if (trades.length === 0) return 50
      const w = trades.filter((t: any) => (t.pnl || 0) > 0).length
      const wr = (w / trades.length) * 100
      let score = wr
      const profTrades = trades.filter((t: any) => (t.pnl || 0) > 0)
      const lossTrades = trades.filter((t: any) => (t.pnl || 0) < 0)
      if (profTrades.length > 0 && lossTrades.length > 0) {
        const avgProf = profTrades.reduce((a: number, t: any) => a + (t.pnl || 0), 0) / profTrades.length
        const avgLs = Math.abs(lossTrades.reduce((a: number, t: any) => a + (t.pnl || 0), 0) / lossTrades.length)
        if (avgProf > avgLs) score += 10
      }
      return Math.max(10, Math.min(100, Math.round(score)))
    }

    const discipline = calcDiscipline()
    const riskManagement = calcRisk()
    const consistency = calcConsistency()
    const emotionalControl = calcEmotional()
    const executionQuality = calcExecution()
    const aiScore = Math.round((discipline + riskManagement + consistency + emotionalControl + executionQuality) / 5)

    const scoresArr = [
      { name: "Trade Execution", score: executionQuality },
      { name: "Discipline", score: discipline },
      { name: "Risk Management", score: riskManagement },
      { name: "Consistency", score: consistency },
      { name: "Emotional Control", score: emotionalControl },
    ].sort((a, b) => b.score - a.score)

    // Emotion impact
    const emotionMap: Record<string, { trades: number; wins: number; pnl: number }> = {}
    trades.filter((t: any) => t.emotion).forEach((t: any) => {
      if (!emotionMap[t.emotion]) emotionMap[t.emotion] = { trades: 0, wins: 0, pnl: 0 }
      emotionMap[t.emotion].trades++
      if ((t.pnl || 0) > 0) emotionMap[t.emotion].wins++
      emotionMap[t.emotion].pnl += t.pnl || 0
    })
    const emotionImpact = Object.entries(emotionMap)
      .map(([emotion, d]) => ({
        emotion,
        trades: d.trades,
        winRate: d.trades > 0 ? Math.round((d.wins / d.trades) * 100) : 0,
        avgPnL: d.trades > 0 ? (d.pnl / d.trades).toFixed(2) : "0",
      }))
      .sort((a, b) => b.trades - a.trades)

    // Best asset
    const assetMap: Record<string, { pnl: number; trades: number; wins: number }> = {}
    trades.forEach((t: any) => {
      if (!assetMap[t.asset]) assetMap[t.asset] = { pnl: 0, trades: 0, wins: 0 }
      assetMap[t.asset].pnl += t.pnl || 0
      assetMap[t.asset].trades++
      if ((t.pnl || 0) > 0) assetMap[t.asset].wins++
    })
    const bestAssetEntry = Object.entries(assetMap).sort((a, b) => b[1].pnl - a[1].pnl)[0]

    // If free user
    if (!isPremium) {
      const hasRevenge = detectRevengeTrading(trades)
      const hasFOMO = detectFOMO(trades)
      const leakCount = [hasRevenge, hasFOMO].filter(Boolean).length

      return NextResponse.json({
        success: true,
        totalTrades: trades.length,
        isPremium: false,
        summary: {
          totalPnL: totalPnL.toFixed(2),
          winRate: `${winRate}%`,
          totalTrades: trades.length,
          winningTrades: wins,
          losingTrades: losses,
        },
        scores: { discipline, riskManagement, consistency, emotionalControl, executionQuality },
        aiScore,
        emotionImpact: emotionImpact.slice(0, 5),
        teasers: {
          leakCount,
          message: leakCount > 0 
            ? `We found ${leakCount} behavioral pattern(s) affecting your performance. Upgrade to Premium for full Leak Tracker and AI analytics.`
            : "Upgrade to Premium for AI Score, Leak Tracker, Edge Discovery, and Pre-Market Protocol.",
        }
      })
    }

    // Premium — full analytics
    return NextResponse.json({
      success: true,
      totalTrades: trades.length,
      isPremium: true,
      summary: {
        totalPnL: totalPnL.toFixed(2),
        winRate: `${winRate}%`,
        totalTrades: trades.length,
        winningTrades: wins,
        losingTrades: losses,
      },
      scores: { discipline, riskManagement, consistency, emotionalControl, executionQuality },
      aiScore,
      coachSummary: {
        strongestSkill: scoresArr[0].name,
        weakestSkill: scoresArr[scoresArr.length - 1].name,
        highestOpportunity: bestAssetEntry 
          ? `Focus on ${bestAssetEntry[0]} trades` 
          : "Add more trades to discover your edge",
      },
      emotionImpact,
      leakTracker: buildLeakTracker(trades, sorted),
      preMarketProtocol: buildPreMarketProtocol(trades, discipline, bestAssetEntry),
      edge: {
        mostProfitableAsset: bestAssetEntry?.[0] || "N/A",
        mostProfitableAssetPnL: bestAssetEntry?.[1].pnl.toFixed(2) || "0",
        mostProfitableDirection: trades.filter((t: any) => t.direction === "Buy").length > trades.filter((t: any) => t.direction === "Sell").length ? "Long" : "Short",
        bestWinRateAsset: bestAssetEntry?.[0] || "N/A",
        bestWinRate: bestAssetEntry ? Math.round((bestAssetEntry[1].wins / bestAssetEntry[1].trades) * 100) : 0,
      },
      accountKillers: [],
      behavioralAlerts: [],
      motivation: totalPnL > 0 ? "🚀 You're profitable! Keep refining your edge." : "📈 Building consistency. Focus on your best setups.",
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, totalTrades: 0, message: "Error: " + e.message })
  }
}

function detectRevengeTrading(trades: any[]): boolean {
  const sorted = [...trades].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  for (let i = 0; i < sorted.length - 1; i++) {
    if ((sorted[i].pnl || 0) < 0 && sorted[i].asset === sorted[i + 1]?.asset) {
      const diff = new Date(sorted[i + 1].created_at).getTime() - new Date(sorted[i].created_at).getTime()
      if (diff < 180000) return true
    }
  }
  return false
}

function detectFOMO(trades: any[]): boolean {
  return trades.some((t: any) => ["Greedy","Euphoric","Overconfident"].some(e => (t.emotion || "").includes(e)))
}

function buildLeakTracker(trades: any[], sorted: any[]) {
  const leaks: any[] = []
  let revengeCount = 0, revengeCost = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    if ((sorted[i].pnl || 0) < 0 && sorted[i].asset === sorted[i + 1]?.asset) {
      const diff = new Date(sorted[i + 1].created_at).getTime() - new Date(sorted[i].created_at).getTime()
      if (diff < 180000) { revengeCount++; revengeCost += Math.abs(sorted[i + 1].pnl || 0) }
    }
  }
  if (revengeCount > 0) {
    leaks.push({ type: "revenge", label: "Revenge Trading", icon: "😡", trades: revengeCount, cost: revengeCost, description: `Re-entered same asset within 3 min of loss ${revengeCount} time(s).`, severity: revengeCost > 500 ? "high" : "medium" })
  }
  const totalLeakCost = leaks.reduce((a, l) => a + l.cost, 0)
  return { totalLeakCost: totalLeakCost.toFixed(2), leaks, summary: totalLeakCost > 0 ? `Leaks cost $${totalLeakCost.toFixed(2)}.` : "No leaks detected." }
}

function buildPreMarketProtocol(trades: any[], discipline: number, bestAsset: any) {
  return {
    disciplineScore: discipline,
    maxPositionSize: discipline < 50 ? "Half normal size" : "Normal size",
    bestSetup: bestAsset ? `${bestAsset[0]} (${Math.round((bestAsset[1].wins / bestAsset[1].trades) * 100)}% win)` : "N/A",
    deadZones: "Analyze more trades",
    restrictedAssets: "None",
    rules: [discipline < 50 ? "Cap position size at 50%" : null, "Review your plan before trading", "Set daily loss limit"].filter(Boolean),
  }
}