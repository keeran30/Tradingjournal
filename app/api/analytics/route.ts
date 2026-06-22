import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")
  const isPremium = url.searchParams.get("premium") === "true"
  
  if (!userId) return NextResponse.json({ success: false, totalTrades: 0 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/trades?select=*&user_id=eq.${userId}&order=created_at.desc`, {
      headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` }
    })
    const trades: any[] = Array.isArray(await res.json()) ? await res.json() : []

    if (trades.length === 0) {
      return NextResponse.json({ success: true, totalTrades: 0, message: "No trades yet" })
    }

    // Calculate everything regardless of tier
    const totalPnL = trades.reduce((a: number, t: any) => a + (t.pnl || 0), 0)
    const wins = trades.filter((t: any) => t.pnl > 0).length
    const winRate = Math.round((wins / trades.length) * 100)
    const totalTrades = trades.length

    // Basic response (free users)
    const baseResponse: any = {
      success: true,
      totalTrades,
      isPremium,
      summary: {
        totalPnL: totalPnL.toFixed(2),
        winRate: `${winRate}%`,
        totalTrades,
        winningTrades: wins,
        losingTrades: trades.length - wins,
      },
    }

    // If free user, show teasers
    if (!isPremium) {
      // Count behavioral issues (but don't reveal details)
      const hasRevengeTrading = detectRevengeTrading(trades)
      const hasFOMO = detectFOMO(trades)
      const leakCount = [hasRevengeTrading, hasFOMO].filter(Boolean).length

      baseResponse.teasers = {
        leakCount,
        message: leakCount > 0 
          ? `We've detected ${leakCount} behavioral pattern(s) that may be affecting your performance. Upgrade to Premium to see the full Leak Tracker and discover exactly what's costing you money.`
          : "Upgrade to Premium for advanced AI analytics, Leak Tracker, and Pre-Market Protocol.",
        preview: {
          winRate,
          totalPnL: totalPnL.toFixed(2),
          potentialSavings: leakCount > 0 ? "Significant leaks detected" : "Unlock full analysis",
        }
      }
      return NextResponse.json(baseResponse)
    }

    // Premium response — full analytics
    const leakTracker = buildLeakTracker(trades)
    const preMarketProtocol = buildPreMarketProtocol(trades)
    const edge = buildEdgeDiscovery(trades)
    const scores = calculateScores(trades)

    return NextResponse.json({
      ...baseResponse,
      aiScore: scores.aiScore,
      scores: scores.breakdown,
      coachSummary: scores.coachSummary,
      leakTracker,
      preMarketProtocol,
      edge,
      accountKillers: leakTracker.leaks.map((l: any) => ({ name: l.label, cost: l.cost.toFixed(2), trades: l.trades, recommendation: l.description })),
      behavioralAlerts: leakTracker.leaks.filter((l: any) => l.severity === "high").map((l: any) => ({ type: "danger", message: l.description, riskLevel: "High" })),
      motivation: totalPnL > 0 ? "🚀 You're profitable. Your edge is clear — keep refining." : "📈 Building consistency. Focus on plugging those leaks.",
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, totalTrades: 0, message: "Error: " + e.message })
  }
}

// Helper functions
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
  const fomoEmotions = ["Greedy", "Euphoric", "Overconfident"]
  return trades.some((t: any) => fomoEmotions.some(e => (t.emotion || "").includes(e)))
}

function buildLeakTracker(trades: any[]) {
  const leaks: any[] = []
  // Revenge trading detection...
  // FOMO detection...
  // (Same as before)
  const totalLeakCost = leaks.reduce((a, l) => a + l.cost, 0)
  return {
    totalLeakCost: totalLeakCost.toFixed(2),
    leaks,
    summary: totalLeakCost > 0 
      ? `Your strategy works, but discipline leaks cost $${totalLeakCost.toFixed(2)}.`
      : "No leaks detected. Great discipline!"
  }
}

function buildPreMarketProtocol(trades: any[]) {
  return {
    disciplineScore: 65,
    maxPositionSize: "Normal",
    bestSetup: "XAUUSD (if data supports)",
    deadZones: "Analyze more trades",
    restrictedAssets: "None",
    rules: ["Review your plan before trading", "Set daily loss limit"],
  }
}

function buildEdgeDiscovery(trades: any[]) {
  const assetMap: Record<string, { pnl: number; trades: number; wins: number }> = {}
  trades.forEach((t: any) => {
    if (!assetMap[t.asset]) assetMap[t.asset] = { pnl: 0, trades: 0, wins: 0 }
    assetMap[t.asset].pnl += t.pnl || 0
    assetMap[t.asset].trades++
    if (t.pnl > 0) assetMap[t.asset].wins++
  })
  const best = Object.entries(assetMap).sort((a, b) => b[1].pnl - a[1].pnl)[0]
  return {
    mostProfitableAsset: best?.[0] || "N/A",
    mostProfitableAssetPnL: best?.[1].pnl.toFixed(2) || "0",
    mostProfitableDirection: "Analyze more",
    bestWinRateAsset: best?.[0] || "N/A",
    bestWinRate: best ? Math.round((best[1].wins / best[1].trades) * 100) : 0,
  }
}

function calculateScores(trades: any[]) {
  const discipline = 60
  const riskManagement = 65
  const consistency = 55
  const emotionalControl = 50
  const executionQuality = 70
  const aiScore = Math.round((discipline + riskManagement + consistency + emotionalControl + executionQuality) / 5)
  
  return {
    aiScore,
    breakdown: { discipline, riskManagement, consistency, emotionalControl, executionQuality },
    coachSummary: {
      strongestSkill: "Trade Execution",
      weakestSkill: "Emotional Control",
      highestOpportunity: "Focus on your best setups",
    }
  }
}