import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ success: false, totalTrades: 0, message: "No userId" })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/trades?select=*&user_id=eq.${userId}&order=created_at.desc`,
      { headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}`, "Content-Type": "application/json" } }
    )
    const trades = Array.isArray(await response.json()) ? await response.json() : []
    
    if (!trades || trades.length === 0) {
      return NextResponse.json({ success: true, totalTrades: 0, message: "No trades yet. Start journaling to unlock AI insights!" })
    }

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentTrades = trades.filter((t: any) => new Date(t.created_at) >= thirtyDaysAgo)
    const thisWeekTrades = trades.filter((t: any) => new Date(t.created_at) >= weekAgo)
    const sortedTrades = [...trades].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    // ═══════════════════════════════════════════════
    // 1. LEAK TRACKER — Quantified Cost of Mistakes
    // ═══════════════════════════════════════════════
    interface LeakItem { type: string; label: string; icon: string; trades: number; cost: number; description: string; severity: "high" | "medium" | "low" }
    const leaks: LeakItem[] = []

    // Detect Revenge Trading: Loss followed by same asset within 3 trades
    let revengeCount = 0, revengeCost = 0
    for (let i = 0; i < sortedTrades.length - 1; i++) {
      const current = sortedTrades[i]
      const next = sortedTrades[i + 1]
      if (current.pnl < 0 && next.asset === current.asset && 
          (new Date(next.created_at).getTime() - new Date(current.created_at).getTime()) < 180000) {
        revengeCount++
        revengeCost += Math.abs(next.pnl || 0)
      }
    }
    if (revengeCount > 0) {
      leaks.push({
        type: "revenge", label: "Revenge Trading", icon: "😡",
        trades: revengeCount, cost: revengeCost,
        description: `You re-entered the same asset within 3 minutes of a loss ${revengeCount} time(s). This is a classic revenge pattern.`,
        severity: revengeCost > 500 ? "high" : revengeCost > 100 ? "medium" : "low",
      })
    }

    // Detect FOMO: Trades with Greedy/Euphoric/Overconfident emotions
    const fomoEmotions = ["Greedy", "Euphoric", "Overconfident", "FOMO"]
    const fomoTrades = thisWeekTrades.filter((t: any) => t.emotion && fomoEmotions.some(e => t.emotion?.includes(e)))
    if (fomoTrades.length > 0) {
      const fomoCost = Math.abs(fomoTrades.reduce((a: number, t: any) => a + Math.min(0, t.pnl || 0), 0))
      leaks.push({
        type: "fomo", label: "FOMO Chasing", icon: "🏃",
        trades: fomoTrades.length, cost: fomoCost,
        description: `${fomoTrades.length} trades this week were driven by FOMO emotions. These trades lost $${fomoCost.toFixed(2)}.`,
        severity: fomoCost > 500 ? "high" : fomoCost > 100 ? "medium" : "low",
      })
    }

    // Detect Overtrading: More than 5 trades in a single day
    const byDay: Record<string, any[]> = {}
    thisWeekTrades.forEach((t: any) => {
      const day = t.created_at?.split("T")[0] || ""
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(t)
    })
    let overtradingDays = 0, overtradingCost = 0
    Object.entries(byDay).forEach(([day, dayTrades]) => {
      if (dayTrades.length > 5) {
        overtradingDays++
        const excessTrades = dayTrades.slice(5)
        overtradingCost += Math.abs(excessTrades.reduce((a: number, t: any) => a + Math.min(0, t.pnl || 0), 0))
      }
    })
    if (overtradingDays > 0) {
      leaks.push({
        type: "overtrading", label: "Overtrading", icon: "📈",
        trades: overtradingDays, cost: overtradingCost,
        description: `You exceeded 5 trades/day on ${overtradingDays} day(s). Quality drops with quantity.`,
        severity: overtradingCost > 300 ? "high" : "medium",
      })
    }

    // Detect oversized positions (more than 2x average)
    const avgSize = trades.reduce((a: number, t: any) => a + (t.original_size || t.size || 0), 0) / trades.length
    const oversizedTrades = thisWeekTrades.filter((t: any) => (t.original_size || t.size) > avgSize * 2)
    if (oversizedTrades.length > 0 && avgSize > 0) {
      const oversizedCost = Math.abs(oversizedTrades.reduce((a: number, t: any) => a + Math.min(0, t.pnl || 0), 0))
      leaks.push({
        type: "oversized", label: "Over-Leveraging", icon: "🎰",
        trades: oversizedTrades.length, cost: oversizedCost,
        description: `${oversizedTrades.length} trades were 2x+ your average size. Over-leveraging magnifies losses.`,
        severity: oversizedCost > 500 ? "high" : "medium",
      })
    }

    const totalLeakCost = leaks.reduce((a, l) => a + l.cost, 0)
    const totalPnL = thisWeekTrades.reduce((a: number, t: any) => a + (t.pnl || 0), 0)
    const leakPercentage = totalPnL !== 0 ? Math.round((totalLeakCost / Math.abs(totalPnL)) * 100) : 0

    // ═══════════════════════════════════════════════
    // 2. GHOST EQUITY CURVE DATA
    // ═══════════════════════════════════════════════
    interface CurvePoint { date: string; actual: number; ghost: number }
    const equityCurve: CurvePoint[] = []
    let actualRunning = 0, ghostRunning = 0
    sortedTrades.forEach((t: any) => {
      actualRunning += t.pnl || 0
      const isLeak = (t.emotion && fomoEmotions.some(e => t.emotion?.includes(e))) || false
      if (!isLeak) ghostRunning += t.pnl || 0
      equityCurve.push({
        date: t.created_at?.split("T")[0] || "",
        actual: parseFloat(actualRunning.toFixed(2)),
        ghost: parseFloat(ghostRunning.toFixed(2)),
      })
    })

    // ═══════════════════════════════════════════════
    // 3. PRE-MARKET PROTOCOL (Daily Game Plan)
    // ═══════════════════════════════════════════════
    const discipline = (() => {
      const withEmotion = trades.filter((t: any) => t.emotion)
      if (withEmotion.length === 0) return 50
      const pos = withEmotion.filter((t: any) => ["Calm","Confident","Focused","Patient","Disciplined"].some(e => t.emotion?.includes(e))).length
      return Math.round((pos / withEmotion.length) * 100)
    })()

    const bestAsset = Object.entries(
      trades.reduce((acc: Record<string, { pnl: number; trades: number; wins: number }>, t: any) => {
        if (!acc[t.asset]) acc[t.asset] = { pnl: 0, trades: 0, wins: 0 }
        acc[t.asset].pnl += t.pnl || 0; acc[t.asset].trades++; if (t.pnl > 0) acc[t.asset].wins++
        return acc
      }, {})
    ).sort((a, b) => b[1].pnl - a[1].pnl)[0]

    // Dead zone detection
    const hourMap: Record<number, { pnl: number; trades: number }> = {}
    trades.forEach((t: any) => {
      const hour = new Date(t.created_at).getHours()
      if (!hourMap[hour]) hourMap[hour] = { pnl: 0, trades: 0 }
      hourMap[hour].pnl += t.pnl || 0; hourMap[hour].trades++
    })
    const worstHours = Object.entries(hourMap)
      .filter(([, d]) => d.trades >= 2 && d.pnl < 0)
      .sort((a, b) => a[1].pnl - b[1].pnl)
      .slice(0, 2)
      .map(([h]) => {
        const hour = parseInt(h)
        const start = hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`
        const end = hour + 1 > 12 ? `${hour - 11}:00 PM` : `${hour + 1}:00 AM`
        return `${start} – ${end}`
      })

    const preMarketProtocol = {
      disciplineScore: discipline,
      maxPositionSize: discipline < 50 ? "Half your normal size" : "Normal size",
      bestSetup: bestAsset ? `${bestAsset[0]} (${Math.round((bestAsset[1].wins / bestAsset[1].trades) * 100)}% win rate)` : "Insufficient data",
      deadZones: worstHours.length > 0 ? worstHours.join(" and ") : "No dead zones detected yet",
      restrictedAssets: leaks.filter(l => l.severity === "high").map(l => l.label).join(", ") || "None",
      rules: [
        discipline < 50 ? "Cap position size at 50% of normal" : null,
        worstHours.length > 0 ? `Avoid trading during ${worstHours[0]}` : null,
        leaks.length > 0 ? `Your discipline leaks cost you $${totalLeakCost.toFixed(2)} this week. Follow your plan.` : null,
        bestAsset ? `Prioritize ${bestAsset[0]} setups — your highest probability trade` : null,
      ].filter(Boolean),
    }

    // ═══════════════════════════════════════════════
    // SCORES & SUMMARY
    // ═══════════════════════════════════════════════
    const calcExecution = () => {
      const wins = trades.filter((t: any) => t.pnl > 0).length
      return Math.min(100, Math.round((wins / trades.length) * 100))
    }
    const calcRisk = () => {
      const wins = trades.filter((t: any) => t.pnl > 0)
      const losses = trades.filter((t: any) => t.pnl < 0)
      if (losses.length === 0) return 90
      const avgW = wins.length > 0 ? wins.reduce((a: number, t: any) => a + t.pnl, 0) / wins.length : 0
      const avgL = Math.abs(losses.reduce((a: number, t: any) => a + t.pnl, 0) / losses.length)
      return avgW === 0 ? 30 : Math.min(100, Math.round((avgW / avgL) * 30))
    }
    const calcConsistency = () => {
      if (trades.length < 5) return 50
      const days = new Set(trades.map((t: any) => t.created_at?.split("T")[0])).size
      const avg = trades.length / Math.max(1, days)
      if (avg > 5) return Math.max(20, 100 - (avg - 5) * 15)
      return avg >= 1 && avg <= 3 ? 85 : 60
    }
    const calcEmotional = () => {
      const withEmo = trades.filter((t: any) => t.emotion)
      if (withEmo.length === 0) return 50
      const neg = withEmo.filter((t: any) => ["Fearful","Anxious","Greedy","Stressed","Panicked","Revengeful"].some(e => t.emotion?.includes(e))).length
      return Math.round(100 - (neg / withEmo.length) * 50)
    }

    const executionQuality = calcExecution()
    const riskManagement = calcRisk()
    const consistency = calcConsistency()
    const emotionalControl = calcEmotional()
    const aiScore = Math.round((discipline + riskManagement + consistency + emotionalControl + executionQuality) / 5)

    const scores = { discipline, riskManagement, consistency, emotionalControl, executionQuality }
    const strongest = Object.entries(scores).sort((a, b) => b[1] - a[1])

    // Edge
    const edge = {
      mostProfitableAsset: bestAsset?.[0] || "N/A",
      mostProfitableAssetPnL: bestAsset?.[1].pnl.toFixed(2) || "0",
      mostProfitableDirection: trades.filter((t: any) => t.direction === "Buy").length > trades.filter((t: any) => t.direction === "Sell").length ? "Long" : "Short",
      bestWinRateAsset: bestAsset?.[0] || "N/A",
      bestWinRate: bestAsset ? Math.round((bestAsset[1].wins / bestAsset[1].trades) * 100) : 0,
    }

    // Killers
    const killers = leaks.map(l => ({
      name: l.label,
      cost: l.cost.toFixed(2),
      trades: l.trades,
      recommendation: l.description,
    }))

    // Alerts
    const alerts: any[] = []
    if (discipline < 40) alerts.push({ type: "warning", message: `Discipline score is ${discipline}/100. Follow your pre-market protocol strictly today.`, riskLevel: "High" })
    if (leaks.filter(l => l.severity === "high").length > 0) alerts.push({ type: "danger", message: `${leaks.filter(l => l.severity === "high").length} critical leak(s) detected this week. Review the Leak Tracker.`, riskLevel: "Critical" })

    // Motivation
    const motivation = aiScore >= 70 ? "🚀 Professional level. Your leak tracker shows you'd be up significantly without the few mistakes." :
      aiScore >= 50 ? "📈 Solid foundation. Plug those leaks and your equity curve will transform." :
      "🌱 Building blocks are there. Your ghost equity curve shows what's possible with discipline."

    return NextResponse.json({
      success: true,
      totalTrades: trades.length,
      aiScore,
      scores,
      coachSummary: {
        strongestSkill: strongest[0][0].replace(/([A-Z])/g, ' $1').trim(),
        weakestSkill: strongest[strongest.length - 1][0].replace(/([A-Z])/g, ' $1').trim(),
        fastestImprovement: "Risk Management",
        highestOpportunity: bestAsset ? `Focus on ${bestAsset[0]} trades and avoid ${leaks[0]?.label || 'mistakes'}` : "Add more trades to discover your edge",
      },
      leakTracker: {
        totalLeakCost: totalLeakCost.toFixed(2),
        leakPercentage,
        leaks,
        summary: totalLeakCost > 0
          ? `Your strategy works, but discipline leaks cost you $${totalLeakCost.toFixed(2)} this week. Plugging these would improve your net profit by ${leakPercentage}%.`
          : "No significant leaks detected this week. Great discipline!",
      },
      ghostEquity: equityCurve.slice(-30),
      preMarketProtocol,
      edge,
      accountKillers: killers,
      behavioralAlerts: alerts,
      suggestions: leaks.map(l => l.description),
      warnings: alerts.map(a => a.message),
      motivation,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, totalTrades: 0, message: "Error: " + (e.message || "Unknown") })
  }
}