import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")
  
  if (!userId) {
    return NextResponse.json({ success: false, totalTrades: 0, message: "No userId provided" })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  try {
    const apiUrl = `${supabaseUrl}/rest/v1/trades?select=*&user_id=eq.${userId}&order=created_at.desc`
    
    const res = await fetch(apiUrl, {
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json"
      }
    })
    
    const data = await res.json()
    const trades: any[] = Array.isArray(data) ? data : []

    if (trades.length === 0) {
      return NextResponse.json({
        success: true,
        totalTrades: 0,
        message: "No trades yet. Start journaling to unlock AI insights!"
      })
    }

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisWeek: any[] = trades.filter((t: any) => new Date(t.created_at) >= weekAgo)
    const sorted: any[] = [...trades].sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    // ─── SCORES ────────────────────────────────────────
    const posEmotions = ["Calm","Confident","Focused","Patient","Disciplined","Prepared","Mindful"]
    const negEmotions = ["Fearful","Anxious","Greedy","Stressed","Panicked","Revengeful","Desperate","Euphoric","Overconfident"]

    const calcDiscipline = (): number => {
      const withEmo = trades.filter((t: any) => t.emotion)
      if (withEmo.length === 0) return 50
      const pos = withEmo.filter((t: any) => posEmotions.some(e => (t.emotion || "").includes(e))).length
      return Math.round((pos / withEmo.length) * 100)
    }

    const calcRisk = (): number => {
      const wins = trades.filter((t: any) => t.pnl > 0)
      const losses = trades.filter((t: any) => t.pnl < 0)
      if (losses.length === 0) return 90
      const avgW = wins.length > 0 ? wins.reduce((a: number, t: any) => a + t.pnl, 0) / wins.length : 0
      const avgL = Math.abs(losses.reduce((a: number, t: any) => a + t.pnl, 0) / losses.length)
      if (avgW === 0) return 30
      return Math.min(100, Math.round((avgW / avgL) * 30))
    }

    const calcConsistency = (): number => {
      if (trades.length < 5) return 50
      const days = new Set(trades.map((t: any) => (t.created_at || "").split("T")[0])).size
      const avg = trades.length / Math.max(1, days)
      if (avg > 5) return Math.max(20, 100 - (avg - 5) * 15)
      if (avg >= 1 && avg <= 3) return 85
      return 60
    }

    const calcEmotional = (): number => {
      const withEmo = trades.filter((t: any) => t.emotion)
      if (withEmo.length === 0) return 50
      const neg = withEmo.filter((t: any) => negEmotions.some(e => (t.emotion || "").includes(e))).length
      return Math.round(100 - (neg / withEmo.length) * 50)
    }

    const calcExecution = (): number => {
      const wins = trades.filter((t: any) => t.pnl > 0).length
      return Math.min(100, Math.round((wins / trades.length) * 100))
    }

    const discipline = calcDiscipline()
    const riskManagement = calcRisk()
    const consistency = calcConsistency()
    const emotionalControl = calcEmotional()
    const executionQuality = calcExecution()
    const aiScore = Math.round((discipline + riskManagement + consistency + emotionalControl + executionQuality) / 5)

    // ─── LEAK TRACKER ──────────────────────────────────
    interface LeakItem {
      type: string; label: string; icon: string
      trades: number; cost: number; description: string; severity: string
    }
    const leaks: LeakItem[] = []

    // Revenge trading
    let revengeCount = 0, revengeCost = 0
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i + 1]
      if ((a.pnl || 0) < 0 && a.asset === b.asset) {
        const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (diff < 180000) {
          revengeCount++
          revengeCost += Math.abs(b.pnl || 0)
        }
      }
    }
    if (revengeCount > 0) {
      leaks.push({
        type: "revenge", label: "Revenge Trading", icon: "😡",
        trades: revengeCount, cost: revengeCost,
        description: `Re-entered same asset within 3 min of a loss ${revengeCount} time(s).`,
        severity: revengeCost > 500 ? "high" : revengeCost > 100 ? "medium" : "low"
      })
    }

    // FOMO
    const fomoEmotions = ["Greedy","Euphoric","Overconfident"]
    const fomoTrades = thisWeek.filter((t: any) => fomoEmotions.some(e => (t.emotion || "").includes(e)))
    if (fomoTrades.length > 0) {
      const cost = Math.abs(fomoTrades.reduce((a: number, t: any) => a + Math.min(0, t.pnl || 0), 0))
      leaks.push({
        type: "fomo", label: "FOMO Chasing", icon: "🏃",
        trades: fomoTrades.length, cost,
        description: `${fomoTrades.length} FOMO-driven trades this week lost $${cost.toFixed(2)}.`,
        severity: cost > 500 ? "high" : cost > 100 ? "medium" : "low"
      })
    }

    // Overtrading
    const byDay: Record<string, any[]> = {}
    thisWeek.forEach((t: any) => {
      const day = (t.created_at || "").split("T")[0]
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(t)
    })
    let overDays = 0, overCost = 0
    Object.entries(byDay).forEach(([, dayTrades]) => {
      if (dayTrades.length > 5) {
        overDays++
        dayTrades.slice(5).forEach((t: any) => { overCost += Math.abs(Math.min(0, t.pnl || 0)) })
      }
    })
    if (overDays > 0) {
      leaks.push({
        type: "overtrading", label: "Overtrading", icon: "📈",
        trades: overDays, cost: overCost,
        description: `Exceeded 5 trades on ${overDays} day(s). Quality drops with quantity.`,
        severity: overCost > 300 ? "high" : "medium"
      })
    }

    const totalLeakCost = leaks.reduce((a, l) => a + l.cost, 0)
    const weekPnL = thisWeek.reduce((a: number, t: any) => a + (t.pnl || 0), 0)
    const leakPct = weekPnL !== 0 ? Math.round((totalLeakCost / Math.abs(weekPnL)) * 100) : 0

    // ─── BEST ASSET ────────────────────────────────────
    const assetMap: Record<string, { pnl: number; trades: number; wins: number }> = {}
    trades.forEach((t: any) => {
      const a = t.asset || "Unknown"
      if (!assetMap[a]) assetMap[a] = { pnl: 0, trades: 0, wins: 0 }
      assetMap[a].pnl += t.pnl || 0
      assetMap[a].trades++
      if ((t.pnl || 0) > 0) assetMap[a].wins++
    })
    
    const assetEntries: Array<[string, { pnl: number; trades: number; wins: number }]> = Object.entries(assetMap)
    assetEntries.sort((a, b) => b[1].pnl - a[1].pnl)
    const bestAssetEntry = assetEntries[0]

    // ─── DEAD ZONES ────────────────────────────────────
    const hourMap: Record<number, { pnl: number; trades: number }> = {}
    trades.forEach((t: any) => {
      const h = new Date(t.created_at).getHours()
      if (!hourMap[h]) hourMap[h] = { pnl: 0, trades: 0 }
      hourMap[h].pnl += t.pnl || 0
      hourMap[h].trades++
    })
    const worstHours = Object.entries(hourMap)
      .filter(([, d]) => d.trades >= 2 && d.pnl < 0)
      .sort((a, b) => a[1].pnl - b[1].pnl)
      .slice(0, 2)
      .map(([h]) => {
        const hr = parseInt(h)
        return hr > 12 ? `${hr - 12}:00 PM` : `${hr}:00 AM`
      })

    // ─── PRE-MARKET PROTOCOL ───────────────────────────
    const preMarketRules: string[] = []
    if (discipline < 50) preMarketRules.push("Cap position size at 50% of normal")
    if (worstHours.length > 0) preMarketRules.push(`Avoid trading during ${worstHours[0]}`)
    if (totalLeakCost > 0) preMarketRules.push(`Discipline leaks cost $${totalLeakCost.toFixed(2)} this week. Follow your plan.`)
    if (bestAssetEntry) preMarketRules.push(`Prioritize ${bestAssetEntry[0]} setups — your highest probability trade`)

    const preMarketProtocol = {
      disciplineScore: discipline,
      maxPositionSize: discipline < 50 ? "Half your normal size" : "Normal size",
      bestSetup: bestAssetEntry 
        ? `${bestAssetEntry[0]} (${Math.round((bestAssetEntry[1].wins / bestAssetEntry[1].trades) * 100)}% win rate)` 
        : "Insufficient data",
      deadZones: worstHours.length > 0 ? worstHours.join(" and ") : "No dead zones detected",
      restrictedAssets: leaks.filter(l => l.severity === "high").map(l => l.label).join(", ") || "None",
      rules: preMarketRules,
    }

    // ─── COACH SUMMARY ─────────────────────────────────
    const scoresArr = [
      { name: "Trade Execution", score: executionQuality },
      { name: "Discipline", score: discipline },
      { name: "Risk Management", score: riskManagement },
      { name: "Consistency", score: consistency },
      { name: "Emotional Control", score: emotionalControl },
    ].sort((a, b) => b.score - a.score)

    const coachSummary = {
      strongestSkill: scoresArr[0].name,
      weakestSkill: scoresArr[scoresArr.length - 1].name,
      fastestImprovement: "Execution Quality",
      highestOpportunity: bestAssetEntry 
        ? `Focus on ${bestAssetEntry[0]} trades and avoid ${leaks[0]?.label || "mistakes"}` 
        : "Add more trades to discover your edge",
    }

    // ─── EDGE ──────────────────────────────────────────
    const edge = {
      mostProfitableAsset: bestAssetEntry?.[0] || "N/A",
      mostProfitableAssetPnL: bestAssetEntry?.[1].pnl.toFixed(2) || "0",
      mostProfitableDirection: trades.filter((t: any) => t.direction === "Buy").length > trades.filter((t: any) => t.direction === "Sell").length ? "Long" : "Short",
      bestWinRateAsset: bestAssetEntry?.[0] || "N/A",
      bestWinRate: bestAssetEntry ? Math.round((bestAssetEntry[1].wins / bestAssetEntry[1].trades) * 100) : 0,
    }

    // ─── ALERTS ────────────────────────────────────────
    const alerts: any[] = []
    if (discipline < 40) alerts.push({ type: "warning", message: `Discipline score is ${discipline}/100. Follow your pre-market protocol.`, riskLevel: "High" })
    if (leaks.filter(l => l.severity === "high").length > 0) alerts.push({ type: "danger", message: `${leaks.filter(l => l.severity === "high").length} critical leak(s) detected. Review above.`, riskLevel: "Critical" })

    // ─── MOTIVATION ────────────────────────────────────
    let motivation = ""
    if (aiScore >= 70) motivation = "🚀 Professional level. Plug those small leaks and you're golden."
    else if (aiScore >= 50) motivation = "📈 Solid foundation. Your ghost equity shows what's possible with discipline."
    else motivation = "🌱 Building blocks are there. Focus on consistency and emotional control."

    return NextResponse.json({
      success: true,
      totalTrades: trades.length,
      aiScore,
      scores: { discipline, riskManagement, consistency, emotionalControl, executionQuality },
      coachSummary,
      leakTracker: {
        totalLeakCost: totalLeakCost.toFixed(2),
        leakPercentage: leakPct,
        leaks,
        summary: totalLeakCost > 0
          ? `Your strategy works, but discipline leaks cost $${totalLeakCost.toFixed(2)} this week. Plugging these would improve your net profit by ${leakPct}%.`
          : "No significant leaks detected this week. Great discipline!",
      },
      preMarketProtocol,
      edge,
      accountKillers: leaks.map(l => ({
        name: l.label,
        cost: l.cost.toFixed(2),
        trades: l.trades,
        recommendation: l.description,
      })),
      behavioralAlerts: alerts,
      suggestions: leaks.map(l => l.description),
      warnings: alerts.map(a => a.message),
      motivation,
    })

  } catch (e: any) {
    return NextResponse.json({
      success: false,
      totalTrades: 0,
      message: "Error: " + (e.message || "Unknown error"),
    })
  }
}