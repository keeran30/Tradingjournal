// /app/api/analytics/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

export async function GET(req: NextRequest) {
  try {
    console.log("=== AI ANALYTICS STARTED ===")
    
    // Get user from auth header
    const authHeader = req.headers.get("authorization")
    let userId = null

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "")
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id
    }

    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    }

    if (!userId) {
      return NextResponse.json({
        success: true,
        totalTrades: 0,
        message: "Please log in to see analytics"
      })
    }

    // Fetch only this user's trades
    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ 
        success: false,
        error: error.message,
        totalTrades: 0 
      })
    }

    console.log(`Found ${trades?.length || 0} trades for user ${userId}`)

    if (!trades || trades.length === 0) {
      return NextResponse.json({
        success: true,
        totalTrades: 0,
        message: "No trades yet. Add some trades to see AI insights!"
      })
    }

    // ========== BASIC STATS ==========
    let totalPnL = 0
    let winningTrades = 0
    let losingTrades = 0
    let breakEvenTrades = 0
    
    trades.forEach(trade => {
      totalPnL += trade.pnl || 0
      if (trade.pnl > 0) winningTrades++
      else if (trade.pnl < 0) losingTrades++
      else breakEvenTrades++
    })
    
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0
    const avgWin = winningTrades > 0 ? trades.filter(t => t.pnl > 0).reduce((a, b) => a + (b.pnl || 0), 0) / winningTrades : 0
    const avgLoss = losingTrades > 0 ? Math.abs(trades.filter(t => t.pnl < 0).reduce((a, b) => a + (b.pnl || 0), 0) / losingTrades) : 0
    
    // ========== ASSET PERFORMANCE ==========
    const assetPnL: { [key: string]: { pnl: number; trades: number; wins: number; losses: number } } = {}
    trades.forEach(trade => {
      const asset = trade.asset
      if (!assetPnL[asset]) {
        assetPnL[asset] = { pnl: 0, trades: 0, wins: 0, losses: 0 }
      }
      assetPnL[asset].pnl += trade.pnl || 0
      assetPnL[asset].trades++
      if (trade.pnl > 0) assetPnL[asset].wins++
      if (trade.pnl < 0) assetPnL[asset].losses++
    })
    
    let bestAsset = { symbol: "", pnl: -Infinity, winRate: 0, trades: 0 }
    let worstAsset = { symbol: "", pnl: Infinity, winRate: 0, trades: 0 }
    
    Object.keys(assetPnL).forEach(asset => {
      const data = assetPnL[asset]
      const winRateAsset = (data.wins / data.trades) * 100
      if (data.pnl > bestAsset.pnl) {
        bestAsset = { symbol: asset, pnl: data.pnl, winRate: winRateAsset, trades: data.trades }
      }
      if (data.pnl < worstAsset.pnl) {
        worstAsset = { symbol: asset, pnl: data.pnl, winRate: winRateAsset, trades: data.trades }
      }
    })
    
    // ========== EMOTIONAL ANALYSIS ==========
    const emotionStats: { [key: string]: { wins: number; total: number; pnl: number } } = {}
    trades.forEach(trade => {
      const emotion = trade.emotion
      if (emotion && emotion !== "") {
        if (!emotionStats[emotion]) {
          emotionStats[emotion] = { wins: 0, total: 0, pnl: 0 }
        }
        emotionStats[emotion].total++
        emotionStats[emotion].pnl += trade.pnl || 0
        if (trade.pnl > 0) emotionStats[emotion].wins++
      }
    })
    
    let bestEmotion = { name: "", winRate: 0, pnl: 0, trades: 0 }
    let worstEmotion = { name: "", winRate: 100, pnl: 0, trades: 0 }
    
    Object.keys(emotionStats).forEach(emotion => {
      const wr = (emotionStats[emotion].wins / emotionStats[emotion].total) * 100
      if (wr > bestEmotion.winRate || (wr === bestEmotion.winRate && emotionStats[emotion].pnl > bestEmotion.pnl)) {
        bestEmotion = { name: emotion, winRate: wr, pnl: emotionStats[emotion].pnl, trades: emotionStats[emotion].total }
      }
      if (wr < worstEmotion.winRate) {
        worstEmotion = { name: emotion, winRate: wr, pnl: emotionStats[emotion].pnl, trades: emotionStats[emotion].total }
      }
    })
    
    // ========== DIRECTION ANALYSIS ==========
    let buyTrades = 0, buyWins = 0, buyPnL = 0
    let sellTrades = 0, sellWins = 0, sellPnL = 0
    
    trades.forEach(trade => {
      if (trade.direction === "Buy") {
        buyTrades++; buyPnL += trade.pnl || 0
        if (trade.pnl > 0) buyWins++
      } else if (trade.direction === "Sell") {
        sellTrades++; sellPnL += trade.pnl || 0
        if (trade.pnl > 0) sellWins++
      }
    })
    
    const buyWinRate = buyTrades > 0 ? (buyWins / buyTrades) * 100 : 0
    const sellWinRate = sellTrades > 0 ? (sellWins / sellTrades) * 100 : 0
    
    // ========== STREAK ANALYSIS ==========
    let currentWinStreak = 0, maxWinStreak = 0
    let currentLossStreak = 0, maxLossStreak = 0
    
    trades.slice().reverse().forEach(trade => {
      if (trade.pnl > 0) {
        currentWinStreak++; currentLossStreak = 0
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak)
      } else if (trade.pnl < 0) {
        currentLossStreak++; currentWinStreak = 0
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak)
      }
    })
    
    // ========== RISK METRICS ==========
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 999 : 0)
    const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss
    
    // ========== TIME ANALYSIS ==========
    const tradesByDay: { [key: string]: number } = {}
    trades.forEach(trade => {
      if (trade.created_at) {
        const date = new Date(trade.created_at).toLocaleDateString()
        tradesByDay[date] = (tradesByDay[date] || 0) + 1
      }
    })
    const totalDays = Object.keys(tradesByDay).length
    const avgTradesPerDay = totalDays > 0 ? trades.length / totalDays : 0
    
    // ========== AI SUGGESTIONS ==========
    const suggestions: string[] = []
    const warnings: string[] = []
    
    if (winRate < 35) warnings.push("⚠️ Your win rate is below 35%. Review your entry strategy and reduce trade frequency.")
    else if (winRate < 45) warnings.push("⚠️ Win rate below 45%. Consider smaller position sizes until you improve.")
    else if (winRate > 65) suggestions.push("🎯 Excellent win rate! Consider scaling up carefully.")
    
    if (profitFactor > 2) suggestions.push(`💰 Strong profit factor of ${profitFactor.toFixed(2)} — you make $${profitFactor.toFixed(2)} for every $1 lost.`)
    else if (profitFactor < 1) warnings.push(`📉 Profit factor below 1.0 — losses are bigger than wins. Review your exit strategy.`)
    
    if (expectancy > 0) suggestions.push(`💡 Positive expectancy: +$${expectancy.toFixed(2)} per trade on average.`)
    else if (expectancy < 0) warnings.push(`💡 Negative expectancy: -$${Math.abs(expectancy).toFixed(2)} per trade. You need a strategy change.`)
    
    if (bestAsset.symbol && bestAsset.pnl > 0) suggestions.push(`🏆 Best asset: ${bestAsset.symbol} (+$${bestAsset.pnl.toFixed(2)}, ${bestAsset.winRate.toFixed(0)}% win rate)`)
    if (worstAsset.symbol && worstAsset.pnl < 0 && worstAsset.symbol !== bestAsset.symbol) warnings.push(`❌ Worst asset: ${worstAsset.symbol} (-$${Math.abs(worstAsset.pnl).toFixed(2)}, ${worstAsset.winRate.toFixed(0)}% win rate)`)
    
    if (bestEmotion.name && bestEmotion.trades >= 2) suggestions.push(`😊 Best mindset: "${bestEmotion.name}" (${bestEmotion.winRate.toFixed(0)}% win rate)`)
    if (worstEmotion.name && worstEmotion.trades >= 2 && worstEmotion.name !== bestEmotion.name && worstEmotion.winRate < 50) warnings.push(`😰 Worst mindset: "${worstEmotion.name}" (${worstEmotion.winRate.toFixed(0)}% win rate)`)
    
    if (buyTrades > 0 && sellTrades > 0) {
      if (buyWinRate > sellWinRate + 20) suggestions.push(`📈 Better at BUY (${buyWinRate.toFixed(0)}%) than SELL (${sellWinRate.toFixed(0)}%). Focus on longs.`)
      else if (sellWinRate > buyWinRate + 20) suggestions.push(`📉 Better at SELL (${sellWinRate.toFixed(0)}%) than BUY (${buyWinRate.toFixed(0)}%). Focus on shorts.`)
    }
    
    if (avgTradesPerDay > 5) warnings.push(`⚠️ Trading ${avgTradesPerDay.toFixed(1)} times/day. Quality over quantity reduces emotional decisions.`)
    if (maxWinStreak >= 5) suggestions.push(`🔥 ${maxWinStreak}-trade winning streak! Identify what worked.`)
    if (maxLossStreak >= 3) warnings.push(`⚠️ ${maxLossStreak}-trade losing streak. Step away after 2 consecutive losses.`)
    if (avgLoss > avgWin && avgLoss > 0) warnings.push(`🔴 Avg loss ($${avgLoss.toFixed(2)}) > avg win ($${avgWin.toFixed(2)}). Tighten stop losses.`)
    
    let motivation = ""
    if (totalPnL > 0 && winRate > 50) motivation = "🚀 You're on track! Consistency is key to long-term success."
    else if (totalPnL > 0) motivation = "📈 Profitable but room for improvement. Focus on winning setups."
    else if (winRate > 50) motivation = "💪 Good win rate but losses are bigger. Work on risk management."
    else motivation = "🌱 Every professional trader started here. Review, adapt, improve."

    const responseData = {
      success: true,
      totalTrades: trades.length,
      summary: {
        totalTrades: trades.length,
        winningTrades,
        losingTrades,
        breakEvenTrades,
        winRate: winRate.toFixed(1),
        totalPnl: totalPnL.toFixed(2),
        avgWin: avgWin.toFixed(2),
        avgLoss: avgLoss.toFixed(2),
        profitFactor: profitFactor.toFixed(2),
        expectancy: expectancy.toFixed(2),
        maxWinStreak,
        maxLossStreak,
      },
      assets: {
        best: bestAsset.symbol ? { symbol: bestAsset.symbol, pnl: bestAsset.pnl.toFixed(2), winRate: bestAsset.winRate.toFixed(1), trades: bestAsset.trades } : null,
        worst: worstAsset.symbol && worstAsset.symbol !== bestAsset.symbol ? { symbol: worstAsset.symbol, pnl: worstAsset.pnl.toFixed(2), winRate: worstAsset.winRate.toFixed(1), trades: worstAsset.trades } : null,
      },
      emotions: {
        best: bestEmotion.name ? { emotion: bestEmotion.name, winRate: bestEmotion.winRate.toFixed(1), pnl: bestEmotion.pnl.toFixed(2), trades: bestEmotion.trades } : null,
        worst: worstEmotion.name && worstEmotion.name !== bestEmotion.name ? { emotion: worstEmotion.name, winRate: worstEmotion.winRate.toFixed(1), pnl: worstEmotion.pnl.toFixed(2), trades: worstEmotion.trades } : null,
      },
      direction: {
        buyWinRate: buyWinRate.toFixed(1),
        sellWinRate: sellWinRate.toFixed(1),
        buyTrades,
        sellTrades,
        buyPnL: buyPnL.toFixed(2),
        sellPnL: sellPnL.toFixed(2),
      },
      risk: {
        avgTradesPerDay: avgTradesPerDay.toFixed(1),
        profitFactor: profitFactor.toFixed(2),
        expectancy: expectancy.toFixed(2),
      },
      suggestions,
      warnings,
      motivation,
    }

    console.log("Analytics ready")
    return NextResponse.json(responseData)

  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to load analytics",
      totalTrades: 0 
    })
  }
}