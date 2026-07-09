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
        success: true, totalTrades: 0, 
        message: "No trades yet. Add some trades to see AI insights!" 
      })
    }

    const totalPnL = trades.reduce((a: number, t: any) => a + (t.pnl || 0), 0)
    const wins = trades.filter((t: any) => (t.pnl || 0) > 0).length
    const losses = trades.filter((t: any) => (t.pnl || 0) < 0).length
    const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : "0"

    // Scores
    const posEmotions = ["Calm","Confident","Focused","Patient","Disciplined"]
    const negEmotions = ["Fearful","Anxious","Greedy","Stressed","Panicked","Revengeful"]
    
    const discipline = calcScore(trades, posEmotions, negEmotions, "discipline")
    const riskManagement = calcScore(trades, posEmotions, negEmotions, "risk")
    const consistency = calcScore(trades, posEmotions, negEmotions, "consistency")
    const emotionalControl = calcScore(trades, posEmotions, negEmotions, "emotional")
    const executionQuality = calcScore(trades, posEmotions, negEmotions, "execution")
    const aiScore = Math.round((discipline + riskManagement + consistency + emotionalControl + executionQuality) / 5)

    const baseResponse = {
      success: true,
      totalTrades: trades.length,
      isPremium,
      summary: { totalPnL: totalPnL.toFixed(2), winRate: `${winRate}%`, totalTrades: trades.length, winningTrades: wins, losingTrades: losses },
      scores: { discipline, riskManagement, consistency, emotionalControl, executionQuality },
      aiScore,
      emotionImpact: getEmotionImpact(trades),
    }

    if (!isPremium) {
      return NextResponse.json({
        ...baseResponse,
        teasers: {
          leakCount: detectLeaks(trades),
          message: "Upgrade to Premium for Leak Tracker, Edge Discovery, and Pre-Market Protocol."
        }
      })
    }

    return NextResponse.json({
      ...baseResponse,
      coachSummary: {
        strongestSkill: "Trade Execution",
        weakestSkill: "Emotional Control",
        highestOpportunity: "Focus on your best setups"
      },
      leakTracker: buildLeakTracker(trades),
      edge: buildEdge(trades),
      preMarketProtocol: buildProtocol(trades, discipline),
      accountKillers: [],
      behavioralAlerts: [],
      motivation: totalPnL > 0 ? "You are profitable. Keep going!" : "Keep building consistency.",
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, totalTrades: 0, message: "Error: " + e.message })
  }
}

function calcScore(trades: any[], pos: string[], neg: string[], type: string): number {
  const withEmo = trades.filter((t: any) => t.emotion)
  if (withEmo.length === 0) return 50
  const posCount = withEmo.filter((t: any) => pos.some(e => (t.emotion || "").includes(e))).length
  return Math.max(10, Math.min(100, Math.round((posCount / withEmo.length) * 100)))
}

function detectLeaks(trades: any[]): number {
  let count = 0
  const sorted = [...trades].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  for (let i = 0; i < sorted.length - 1; i++) {
    if ((sorted[i].pnl || 0) < 0 && sorted[i].asset === sorted[i + 1]?.asset) {
      const diff = new Date(sorted[i + 1].created_at).getTime() - new Date(sorted[i].created_at).getTime()
      if (diff < 300000) count++
    }
  }
  return count
}

function getEmotionImpact(trades: any[]) {
  const map: Record<string, { trades: number; wins: number; pnl: number }> = {}
  trades.filter((t: any) => t.emotion).forEach((t: any) => {
    if (!map[t.emotion]) map[t.emotion] = { trades: 0, wins: 0, pnl: 0 }
    map[t.emotion].trades++; if ((t.pnl || 0) > 0) map[t.emotion].wins++; map[t.emotion].pnl += t.pnl || 0
  })
  return Object.entries(map).map(([emotion, d]) => ({
    emotion, trades: d.trades,
    winRate: Math.round((d.wins / d.trades) * 100),
    avgPnL: (d.pnl / d.trades).toFixed(2),
  })).sort((a, b) => b.trades - a.trades).slice(0, 5)
}

function buildLeakTracker(trades: any[]) {
  const leaks: any[] = []
  const sorted = [...trades].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  let cost = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    if ((sorted[i].pnl || 0) < 0 && sorted[i].asset === sorted[i + 1]?.asset) {
      const diff = new Date(sorted[i + 1].created_at).getTime() - new Date(sorted[i].created_at).getTime()
      if (diff < 300000) { cost += Math.abs(sorted[i + 1].pnl || 0); leaks.push({ label: "Revenge Trade", cost: Math.abs(sorted[i + 1].pnl || 0), description: "Re-entered same asset after loss" }) }
    }
  }
  return { totalLeakCost: cost.toFixed(2), leaks: leaks.slice(0, 5), summary: cost > 0 ? `Leaks cost $${cost.toFixed(2)}` : "No leaks" }
}

function buildEdge(trades: any[]) {
  const map: Record<string, { pnl: number; trades: number; wins: number }> = {}
  trades.forEach((t: any) => {
    if (!map[t.asset]) map[t.asset] = { pnl: 0, trades: 0, wins: 0 }
    map[t.asset].pnl += t.pnl || 0; map[t.asset].trades++; if ((t.pnl || 0) > 0) map[t.asset].wins++
  })
  const best = Object.entries(map).sort((a, b) => b[1].pnl - a[1].pnl)[0]
  return {
    mostProfitableAsset: best?.[0] || "N/A",
    mostProfitableAssetPnL: best?.[1].pnl.toFixed(2) || "0",
    mostProfitableDirection: "N/A",
    bestWinRateAsset: best?.[0] || "N/A",
    bestWinRate: best ? Math.round((best[1].wins / best[1].trades) * 100) : 0,
  }
}

function buildProtocol(trades: any[], discipline: number) {
  return {
    disciplineScore: discipline,
    maxPositionSize: discipline < 50 ? "Half normal" : "Normal",
    bestSetup: "N/A",
    deadZones: "N/A",
    rules: ["Follow your trading plan", "Set daily loss limit"],
  }
}