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
    const trades: any[] = Array.isArray(await response.json()) ? await response.json() : []

    if (trades.length === 0) {
      return NextResponse.json({ success: true, totalTrades: 0, message: "No trades yet. Add some trades to see AI insights!" })
    }

    const sorted = [...trades].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const thisWeek = trades.filter((t: any) => new Date(t.created_at) >= weekAgo)
    const thisMonth = trades.filter((t: any) => new Date(t.created_at) >= monthAgo)

    // Basic stats
    const totalPnL = trades.reduce((a: number, t: any) => a + (t.pnl || 0), 0)
    const wins = trades.filter((t: any) => (t.pnl || 0) > 0).length
    const losses = trades.filter((t: any) => (t.pnl || 0) < 0).length
    const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : "0"

    // ─── SCORES ────────────────────────────────────────
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
      return Math.max(10, Math.min(100, Math.round((avgW / avgL) * 35)))
    }

    const calcConsistency = (): number => {
      if (trades.length < 3) return 50
      const days = new Set(trades.map((t: any) => (t.created_at || "").split("T")[0])).size
      const avg = trades.length / Math.max(1, days)
      if (avg > 8) return Math.max(15, 100 - (avg - 5) * 12)
      if (avg >= 1 && avg <= 3) return 85
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

    // ─── ASSET PERFORMANCE ──────────────────────────────
    const assetMap: Record<string, { pnl: number; trades: number; wins: number; losses: number; avgPnL: number; bestDay: string }> = {}
    trades.forEach((t: any) => {
      if (!assetMap[t.asset]) assetMap[t.asset] = { pnl: 0, trades: 0, wins: 0, losses: 0, avgPnL: 0, bestDay: "" }
      assetMap[t.asset].pnl += t.pnl || 0
      assetMap[t.asset].trades++
      if ((t.pnl || 0) > 0) assetMap[t.asset].wins++
      else if ((t.pnl || 0) < 0) assetMap[t.asset].losses++
      assetMap[t.asset].avgPnL = assetMap[t.asset].pnl / assetMap[t.asset].trades
    })

    // Day of week analysis
    const dayMap: Record<string, { trades: number; wins: number; pnl: number }> = {
      "Monday": { trades: 0, wins: 0, pnl: 0 },
      "Tuesday": { trades: 0, wins: 0, pnl: 0 },
      "Wednesday": { trades: 0, wins: 0, pnl: 0 },
      "Thursday": { trades: 0, wins: 0, pnl: 0 },
      "Friday": { trades: 0, wins: 0, pnl: 0 },
    }
    trades.forEach((t: any) => {
      const day = new Date(t.created_at).getDay()
      const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
      const dayName = days[day]
      if (dayMap[dayName]) {
        dayMap[dayName].trades++
        if ((t.pnl || 0) > 0) dayMap[dayName].wins++
        dayMap[dayName].pnl += t.pnl || 0
      }
    })

    // Session analysis
    const sessionMap: Record<string, { trades: number; wins: number; pnl: number }> = {
      "Asian (7PM-4AM GMT)": { trades: 0, wins: 0, pnl: 0 },
      "London (3AM-12PM GMT)": { trades: 0, wins: 0, pnl: 0 },
      "New York (8AM-5PM EST)": { trades: 0, wins: 0, pnl: 0 },
    }
    trades.forEach((t: any) => {
      const hour = new Date(t.created_at).getUTCHours()
      let session = "Asian (7PM-4AM GMT)"
      if (hour >= 7 && hour < 16) session = "London (3AM-12PM GMT)"
      else if (hour >= 12 && hour < 21) session = "New York (8AM-5PM EST)"
      sessionMap[session].trades++
      if ((t.pnl || 0) > 0) sessionMap[session].wins++
      sessionMap[session].pnl += t.pnl || 0
    })

    // Best/Worst
    const bestAssetEntry = Object.entries(assetMap).sort((a, b) => b[1].pnl - a[1].pnl)[0]
    const worstAssetEntry = Object.entries(assetMap).sort((a, b) => a[1].pnl - b[1].pnl)[0]
    const bestDay = Object.entries(dayMap).filter(([,d]) => d.trades >= 2).sort((a,b) => (b[1].wins/b[1].trades) - (a[1].wins/a[1].trades))[0]
    const bestSession = Object.entries(sessionMap).filter(([,d]) => d.trades >= 2).sort((a,b) => (b[1].wins/b[1].trades) - (a[1].wins/a[1].trades))[0]

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
        emotion, trades: d.trades,
        winRate: d.trades > 0 ? Math.round((d.wins / d.trades) * 100) : 0,
        avgPnL: d.trades > 0 ? (d.pnl / d.trades).toFixed(2) : "0",
        totalPnL: d.pnl.toFixed(2),
        verdict: d.trades > 0 ? ((d.wins / d.trades) >= 0.6 ? "Strong" : (d.wins / d.trades) >= 0.4 ? "Neutral" : "Weak") : "N/A"
      }))
      .sort((a, b) => b.trades - a.trades)

    // If free user
    if (!isPremium) {
      const hasRevenge = detectRevengeTrading(trades)
      const hasFOMO = detectFOMO(trades)
      const hasOvertrading = detectOvertrading(trades)
      const leakCount = [hasRevenge, hasFOMO, hasOvertrading].filter(Boolean).length

      return NextResponse.json({
        success: true, totalTrades: trades.length, isPremium: false,
        summary: { totalPnL: totalPnL.toFixed(2), winRate: `${winRate}%`, totalTrades: trades.length, winningTrades: wins, losingTrades: losses },
        scores: { discipline, riskManagement, consistency, emotionalControl, executionQuality },
        aiScore, emotionImpact: emotionImpact.slice(0, 5),
        teasers: {
          leakCount,
          message: leakCount > 0 
            ? `We detected ${leakCount} behavioral issue(s) in your trading. Upgrade to Premium to see exactly what's costing you money and how to fix it.`
            : "Upgrade to Premium for Leak Tracker, Edge Discovery, and Pre-Market Protocol."
        }
      })
    }

    // ─── PREMIUM: LEAK TRACKER ─────────────────────────
    const leaks: any[] = []
    
    // Revenge Trading
    let revengeCount = 0, revengeCost = 0
    for (let i = 0; i < sorted.length - 1; i++) {
      if ((sorted[i].pnl || 0) < 0 && sorted[i].asset === sorted[i + 1]?.asset) {
        const diff = new Date(sorted[i + 1].created_at).getTime() - new Date(sorted[i].created_at).getTime()
        if (diff < 300000) { revengeCount++; revengeCost += Math.abs(sorted[i + 1].pnl || 0) }
      }
    }
    if (revengeCount > 0) {
      leaks.push({
        type: "revenge", label: "Revenge Trading", icon: "😡",
        severity: revengeCount > 3 ? "Critical" : "High",
        occurrences: revengeCount, cost: revengeCost,
        description: `You re-entered the same asset within 5 minutes of a loss ${revengeCount} time(s). This is a classic revenge pattern that cost you $${revengeCost.toFixed(2)}.`,
        fix: "After any loss, step away from your screen for 15 minutes. Set a hard daily loss limit and stick to it.",
        impact: revengeCost > 500 ? "This single behavior is your biggest profit leak." : "Fixing this will noticeably improve your bottom line."
      })
    }

    // FOMO
    const fomoEmotions = ["Greedy","Euphoric","Overconfident"]
    const fomoTrades = thisMonth.filter((t: any) => fomoEmotions.some(e => (t.emotion || "").includes(e)))
    if (fomoTrades.length > 0) {
      const fomoCost = Math.abs(fomoTrades.reduce((a: number, t: any) => a + Math.min(0, t.pnl || 0), 0))
      const fomoWinRate = Math.round((fomoTrades.filter((t: any) => (t.pnl || 0) > 0).length / fomoTrades.length) * 100)
      leaks.push({
        type: "fomo", label: "FOMO Chasing", icon: "🏃",
        severity: fomoCost > 500 ? "Critical" : "High",
        occurrences: fomoTrades.length, cost: fomoCost,
        description: `${fomoTrades.length} trades driven by FOMO emotions this month. Win rate: ${fomoWinRate}%. Total cost: $${fomoCost.toFixed(2)}.`,
        fix: "Never enter a trade because you feel like you're missing out. Wait for your setup to form completely before entering.",
        impact: fomoCost > 300 ? "Eliminating FOMO could flip your P&L positive." : "FOMO is eroding your edge."
      })
    }

    // Overtrading
    const byDay: Record<string, any[]> = {}
    thisWeek.forEach((t: any) => { const d = (t.created_at||"").split("T")[0]; if (!byDay[d]) byDay[d] = []; byDay[d].push(t) })
    let overDays = 0, overCost = 0
    Object.entries(byDay).forEach(([,d]) => { if (d.length > 5) { overDays++; d.slice(5).forEach((t: any) => { overCost += Math.abs(Math.min(0, t.pnl||0)) }) } })
    if (overDays > 0) {
      leaks.push({
        type: "overtrading", label: "Overtrading", icon: "📈",
        severity: overDays > 3 ? "Critical" : "High",
        occurrences: overDays, cost: overCost,
        description: `You exceeded 5 trades/day on ${overDays} day(s) this week. Trades beyond #5 lost $${overCost.toFixed(2)}.`,
        fix: "Limit yourself to 3-5 quality setups per day. After trade #5, close your platform.",
        impact: "Quality drops significantly after 5 trades per day."
      })
    }

    const totalLeakCost = leaks.reduce((a,l) => a + l.cost, 0)

    // ─── PREMIUM: EDGE DISCOVERY ───────────────────────
    const edge = {
      bestAsset: bestAssetEntry ? {
        symbol: bestAssetEntry[0],
        pnl: bestAssetEntry[1].pnl.toFixed(2),
        trades: bestAssetEntry[1].trades,
        winRate: Math.round((bestAssetEntry[1].wins / bestAssetEntry[1].trades) * 100),
        avgPnL: bestAssetEntry[1].avgPnL.toFixed(2),
      } : null,
      worstAsset: worstAssetEntry && worstAssetEntry[0] !== bestAssetEntry?.[0] ? {
        symbol: worstAssetEntry[0],
        pnl: worstAssetEntry[1].pnl.toFixed(2),
        trades: worstAssetEntry[1].trades,
        winRate: Math.round((worstAssetEntry[1].wins / worstAssetEntry[1].trades) * 100),
      } : null,
      bestDay: bestDay ? { day: bestDay[0], winRate: Math.round((bestDay[1].wins/bestDay[1].trades)*100), trades: bestDay[1].trades, pnl: bestDay[1].pnl.toFixed(2) } : null,
      bestSession: bestSession ? { session: bestSession[0], winRate: Math.round((bestSession[1].wins/bestSession[1].trades)*100), trades: bestSession[1].trades, pnl: bestSession[1].pnl.toFixed(2) } : null,
      bestDirection: trades.filter((t:any)=>t.direction==="Buy").length > trades.filter((t:any)=>t.direction==="Sell").length ? "Long" : "Short",
      buyWinRate: trades.filter((t:any)=>t.direction==="Buy").length > 0 ? Math.round((trades.filter((t:any)=>t.direction==="Buy"&&t.pnl>0).length/trades.filter((t:any)=>t.direction==="Buy").length)*100) : 0,
      sellWinRate: trades.filter((t:any)=>t.direction==="Sell").length > 0 ? Math.round((trades.filter((t:any)=>t.direction==="Sell"&&t.pnl>0).length/trades.filter((t:any)=>t.direction==="Sell").length)*100) : 0,
      allAssets: Object.entries(assetMap).map(([sym,d]) => ({ symbol: sym, pnl: d.pnl.toFixed(2), trades: d.trades, winRate: Math.round((d.wins/d.trades)*100), avgPnL: d.avgPnL.toFixed(2) })),
      allDays: Object.entries(dayMap).map(([day,d]) => ({ day, trades: d.trades, winRate: d.trades>0?Math.round((d.wins/d.trades)*100):0, pnl: d.pnl.toFixed(2) })),
    }

    // ─── PREMIUM: PRE-MARKET PROTOCOL ──────────────────
    const preMarketProtocol = {
      disciplineScore: discipline,
      maxPositionSize: discipline < 50 ? "Reduce to 50% of normal" : discipline < 70 ? "Normal size" : "You can size up slightly",
      bestSetup: bestAssetEntry ? `${bestAssetEntry[0]} (${Math.round((bestAssetEntry[1].wins/bestAssetEntry[1].trades)*100)}% win rate)` : "N/A",
      bestTime: bestSession ? bestSession[0] : "N/A",
      bestDay: bestDay ? bestDay[0] : "N/A",
      deadZones: (() => {
        const dead: string[] = []
        Object.entries(dayMap).forEach(([day,d]) => { if (d.trades>=2 && d.pnl<0) dead.push(day) })
        return dead.length > 0 ? dead.join(", ") : "No dead zones detected"
      })(),
      rules: [
        discipline < 50 ? "Cap your position size at 50% of normal today." : null,
        bestSession ? `Your best session is ${bestSession[0]}. Prioritize trades during this window.` : null,
        totalLeakCost > 0 ? `You leaked $${totalLeakCost.toFixed(2)} from mistakes. Follow your plan strictly today.` : null,
        "Review your trading plan before opening any position.",
        "Set a daily loss limit and respect it.",
      ].filter(Boolean),
    }

    const scoresArr = [
      { name: "Trade Execution", score: executionQuality },
      { name: "Discipline", score: discipline },
      { name: "Risk Management", score: riskManagement },
      { name: "Consistency", score: consistency },
      { name: "Emotional Control", score: emotionalControl },
    ].sort((a,b) => b.score - a.score)

    return NextResponse.json({
      success: true, totalTrades: trades.length, isPremium: true,
      summary: { totalPnL: totalPnL.toFixed(2), winRate: `${winRate}%`, totalTrades: trades.length, winningTrades: wins, losingTrades: losses },
      scores: { discipline, riskManagement, consistency, emotionalControl, executionQuality },
      aiScore,
      coachSummary: { strongestSkill: scoresArr[0].name, weakestSkill: scoresArr[scoresArr.length-1].name, highestOpportunity: bestAssetEntry ? `Focus on ${bestAssetEntry[0]} during ${bestSession?.[0] || "your best session"}` : "Add more trades" },
      leakTracker: { totalLeakCost: totalLeakCost.toFixed(2), leaks, summary: totalLeakCost > 0 ? `You're leaking $${totalLeakCost.toFixed(2)} from correctable mistakes.` : "No leaks detected. Great discipline!" },
      edge,
      preMarketProtocol,
      emotionImpact,
      accountKillers: leaks.map(l => ({ name: l.label, cost: l.cost.toFixed(2), trades: l.occurrences, recommendation: l.fix, impact: l.impact })),
      behavioralAlerts: leaks.filter(l => l.severity === "Critical").map(l => ({ type: "danger", message: `${l.label} is costing you $${l.cost.toFixed(2)}. ${l.fix}`, riskLevel: "Critical" })),
      motivation: totalPnL > 0 ? "🚀 You have a clear edge. Keep refining and scaling." : aiScore > 50 ? "📈 You're close. Fix those leaks and you'll see the difference." : "🌱 Building blocks are there. Focus on consistency.",
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, totalTrades: 0, message: "Error: " + e.message })
  }
}

function detectRevengeTrading(trades: any[]): boolean {
  const s = [...trades].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  for (let i=0;i<s.length-1;i++) if ((s[i].pnl||0)<0 && s[i].asset===s[i+1]?.asset && new Date(s[i+1].created_at).getTime()-new Date(s[i].created_at).getTime()<300000) return true
  return false
}
function detectFOMO(trades: any[]): boolean { return trades.some((t:any) => ["Greedy","Euphoric","Overconfident"].some(e=>(t.emotion||"").includes(e))) }
function detectOvertrading(trades: any[]): boolean {
  const m: Record<string,number> = {}
  trades.forEach((t:any) => { const d=(t.created_at||"").split("T")[0]; m[d]=(m[d]||0)+1 })
  return Object.values(m).some(v => v > 5)
}