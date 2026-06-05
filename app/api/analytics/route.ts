// /app/api/analytics/route.ts
import { NextResponse } from "next/server"
import { supabase } from "@/app/lib/supabase"

export async function GET() {
  try {
    console.log("=== AI ANALYTICS STARTED ===")
    
    // Fetch all trades
    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ 
        success: false,
        error: error.message,
        totalTrades: 0 
      })
    }

    console.log(`Found ${trades?.length || 0} trades`)

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
    
    let bestAsset = { symbol: "", pnl: -Infinity, winRate: 0 }
    let worstAsset = { symbol: "", pnl: Infinity, winRate: 0 }
    
    Object.keys(assetPnL).forEach(asset => {
      const data = assetPnL[asset]
      const winRateAsset = (data.wins / data.trades) * 100
      if (data.pnl > bestAsset.pnl) {
        bestAsset = { symbol: asset, pnl: data.pnl, winRate: winRateAsset }
      }
      if (data.pnl < worstAsset.pnl) {
        worstAsset = { symbol: asset, pnl: data.pnl, winRate: winRateAsset }
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
    
    let bestEmotion = { name: "", winRate: 0, pnl: 0 }
    let worstEmotion = { name: "", winRate: 100, pnl: 0 }
    
    Object.keys(emotionStats).forEach(emotion => {
      const winRate = (emotionStats[emotion].wins / emotionStats[emotion].total) * 100
      if (winRate > bestEmotion.winRate) {
        bestEmotion = { name: emotion, winRate, pnl: emotionStats[emotion].pnl }
      }
      if (winRate < worstEmotion.winRate) {
        worstEmotion = { name: emotion, winRate, pnl: emotionStats[emotion].pnl }
      }
    })
    
    // ========== DIRECTION ANALYSIS ==========
    let buyTrades = 0
    let buyWins = 0
    let buyPnL = 0
    let sellTrades = 0
    let sellWins = 0
    let sellPnL = 0
    
    trades.forEach(trade => {
      if (trade.direction === "Buy") {
        buyTrades++
        buyPnL += trade.pnl || 0
        if (trade.pnl > 0) buyWins++
      } else if (trade.direction === "Sell") {
        sellTrades++
        sellPnL += trade.pnl || 0
        if (trade.pnl > 0) sellWins++
      }
    })
    
    const buyWinRate = buyTrades > 0 ? (buyWins / buyTrades) * 100 : 0
    const sellWinRate = sellTrades > 0 ? (sellWins / sellTrades) * 100 : 0
    
    // ========== TIME-BASED ANALYSIS ==========
    const tradesByDay: { [key: string]: number } = {}
    trades.forEach(trade => {
      if (trade.created_at) {
        const date = new Date(trade.created_at).toLocaleDateString()
        tradesByDay[date] = (tradesByDay[date] || 0) + 1
      }
    })
    const avgTradesPerDay = Object.keys(tradesByDay).length > 0 
      ? Object.values(tradesByDay).reduce((a, b) => a + b, 0) / Object.keys(tradesByDay).length 
      : 0
    
    // ========== STREAK ANALYSIS ==========
    let currentWinStreak = 0
    let maxWinStreak = 0
    let currentLossStreak = 0
    let maxLossStreak = 0
    
    trades.slice().reverse().forEach(trade => {
      if (trade.pnl > 0) {
        currentWinStreak++
        currentLossStreak = 0
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak)
      } else if (trade.pnl < 0) {
        currentLossStreak++
        currentWinStreak = 0
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak)
      }
    })
    
    // ========== GOLD PERFORMANCE ==========
    const goldTrades = trades.filter(t => t.asset === "XAUUSD")
    let goldPnL = 0
    let goldWins = 0
    goldTrades.forEach(trade => {
      goldPnL += trade.pnl || 0
      if (trade.pnl > 0) goldWins++
    })
    const goldWinRate = goldTrades.length > 0 ? (goldWins / goldTrades.length) * 100 : 0
    
    // ========== RISK METRICS ==========
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0
    const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss
    
    // ========== AI SUGGESTIONS (ENHANCED) ==========
    const suggestions = []
    const warnings = []
    const tips = []
    
    // Win Rate Suggestions
    if (winRate < 35) {
      warnings.push("⚠️ CRITICAL: Your win rate is below 35%. Stop trading and review your strategy immediately.")
    } else if (winRate < 45) {
      warnings.push("⚠️ Your win rate is below 45%. Consider reducing position sizes until you improve.")
    } else if (winRate > 65) {
      suggestions.push("🎯 EXCELLENT: Your win rate exceeds 65%. Consider scaling up carefully.")
    } else if (winRate > 55) {
      suggestions.push("📈 GOOD: Your win rate is above 55%. Small improvements could make you highly profitable.")
    }
    
    // Profit Factor Suggestions
    if (profitFactor > 2) {
      suggestions.push(`💰 EXCELLENT: Your profit factor is ${profitFactor.toFixed(2)} (you make $${profitFactor.toFixed(2)} for every $1 lost).`)
    } else if (profitFactor > 1.5) {
      suggestions.push(`📊 GOOD: Your profit factor is ${profitFactor.toFixed(2)}. Focus on maintaining this edge.`)
    } else if (profitFactor < 1) {
      warnings.push(`📉 WARNING: Your profit factor is ${profitFactor.toFixed(2)} (you lose more than you make). Review your exit strategy.`)
    }
    
    // Expectancy
    if (expectancy > 0) {
      suggestions.push(`💡 Each trade averages $${expectancy.toFixed(2)} profit. With 100 trades, you'd make ~$${(expectancy * 100).toFixed(0)}.`)
    } else if (expectancy < 0) {
      warnings.push(`💡 Each trade averages -$${Math.abs(expectancy).toFixed(2)} loss. You need a strategy change.`)
    }
    
    // Asset Performance
    if (bestAsset.pnl > 0) {
      suggestions.push(`🏆 Your best asset is ${bestAsset.symbol} with +$${bestAsset.pnl.toFixed(2)} profit (${bestAsset.winRate.toFixed(0)}% win rate).`)
    }
    
    if (worstAsset.pnl < 0 && worstAsset.symbol !== bestAsset.symbol) {
      warnings.push(`❌ Your worst asset is ${worstAsset.symbol} with -$${Math.abs(worstAsset.pnl).toFixed(2)} loss (${worstAsset.winRate.toFixed(0)}% win rate). Consider avoiding this instrument.`)
    }
    
    // Emotional Analysis
    if (bestEmotion.name) {
      suggestions.push(`😊 You trade best when feeling "${bestEmotion.name}" (${bestEmotion.winRate.toFixed(0)}% win rate, +$${bestEmotion.pnl.toFixed(2)}).`)
    }
    
    if (worstEmotion.name && worstEmotion.name !== bestEmotion.name && worstEmotion.winRate < 40) {
      warnings.push(`😰 Avoid trading when feeling "${worstEmotion.name}" - only ${worstEmotion.winRate.toFixed(0)}% win rate ($${worstEmotion.pnl.toFixed(2)} loss).`)
    }
    
    // Direction Bias
    if (buyTrades > 0 && sellTrades > 0) {
      if (buyWinRate > sellWinRate + 20) {
        suggestions.push(`📈 You perform much better on BUY trades (${buyWinRate.toFixed(0)}%) than SELL (${sellWinRate.toFixed(0)}%). Focus on buying opportunities.`)
      } else if (sellWinRate > buyWinRate + 20) {
        suggestions.push(`📉 You perform much better on SELL trades (${sellWinRate.toFixed(0)}%) than BUY (${buyWinRate.toFixed(0)}%). Focus on selling opportunities.`)
      }
    }
    
    // Overtrading
    if (avgTradesPerDay > 5) {
      warnings.push(`⚠️ You're trading ${avgTradesPerDay.toFixed(1)} times per day on average. Quality over quantity reduces emotional decisions.`)
    } else if (avgTradesPerDay > 3) {
      tips.push(`📊 You average ${avgTradesPerDay.toFixed(1)} trades per day. Consider if each trade meets your criteria.`)
    }
    
    // Streaks
    if (maxWinStreak >= 5) {
      suggestions.push(`🔥 You had a ${maxWinStreak}-trade winning streak! Identify what worked and repeat it.`)
    }
    if (maxLossStreak >= 3) {
      warnings.push(`⚠️ You had a ${maxLossStreak}-trade losing streak. Take a break after 2 consecutive losses.`)
    }
    
    // Gold Specific
    if (goldTrades.length > 0) {
      if (goldWinRate > 65) {
        suggestions.push(`🥇 GOLD EXPERT: Your XAUUSD trades have ${goldWinRate.toFixed(0)}% win rate! You have a clear edge in gold trading.`)
      } else if (goldWinRate < 40) {
        warnings.push(`🥇 Your Gold (XAUUSD) win rate is ${goldWinRate.toFixed(0)}%. Consider demo trading gold before using real capital.`)
      } else if (goldTrades.length > 5) {
        tips.push(`🥇 You've made ${goldTrades.length} gold trades. ${goldWinRate > 50 ? 'Keep refining' : 'Review'} your gold strategy.`)
      }
    }
    
    // Risk Management
    if (avgLoss > avgWin && avgLoss > 0) {
      warnings.push(`🔴 Your average loss ($${avgLoss.toFixed(2)}) is larger than average win ($${avgWin.toFixed(2)}). Use tighter stop losses.`)
    } else if (avgWin > avgLoss * 2) {
      suggestions.push(`✅ Your average win ($${avgWin.toFixed(2)}) is ${(avgWin / avgLoss).toFixed(1)}x your average loss. Great risk-reward ratio!`)
    }
    
    // Break-even trades
    if (breakEvenTrades > trades.length * 0.2) {
      tips.push(`🎯 ${breakEvenTrades} of your trades were break-even. Small adjustments could turn these into winners.`)
    }
    
    // Total PnL Trend
    if (totalPnL > 1000) {
      suggestions.push(`💰 Total profit: $${totalPnL.toFixed(2)}. Track your progress weekly to maintain consistency.`)
    } else if (totalPnL < -500) {
      warnings.push(`💸 Total loss: $${Math.abs(totalPnL).toFixed(2)}. Consider paper trading until profitable.`)
    }
    
    // General tips if no specific warnings
    if (warnings.length === 0 && suggestions.length < 3) {
      tips.push("📝 Keep journaling every trade - data is your path to consistency.")
      tips.push("🎯 Set daily loss limits to protect your capital.")
      tips.push("📊 Review your trades weekly to identify patterns.")
    }
    
    // Add motivational message
    let motivation = ""
    if (totalPnL > 0 && winRate > 50) {
      motivation = "🚀 You're on the right track! Consistency is key to long-term success."
    } else if (totalPnL > 0) {
      motivation = "📈 Profitable but room for improvement. Focus on your winning setups."
    } else if (winRate > 50) {
      motivation = "💪 Your win rate is good but losses are bigger than wins. Work on risk management."
    } else {
      motivation = "🌱 Every professional trader started here. Review, adapt, and improve."
    }

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
        best: bestAsset.symbol ? { 
          symbol: bestAsset.symbol, 
          pnl: bestAsset.pnl.toFixed(2), 
          winRate: bestAsset.winRate.toFixed(1),
          trades: assetPnL[bestAsset.symbol]?.trades || 0
        } : null,
        worst: worstAsset.symbol ? { 
          symbol: worstAsset.symbol, 
          pnl: worstAsset.pnl.toFixed(2), 
          winRate: worstAsset.winRate.toFixed(1),
          trades: assetPnL[worstAsset.symbol]?.trades || 0
        } : null,
      },
      emotions: {
        best: bestEmotion.name ? { 
          emotion: bestEmotion.name, 
          winRate: bestEmotion.winRate.toFixed(1), 
          pnl: bestEmotion.pnl.toFixed(2),
          trades: emotionStats[bestEmotion.name]?.total || 0
        } : null,
        worst: worstEmotion.name ? { 
          emotion: worstEmotion.name, 
          winRate: worstEmotion.winRate.toFixed(1), 
          pnl: worstEmotion.pnl.toFixed(2),
          trades: emotionStats[worstEmotion.name]?.total || 0
        } : null,
      },
      direction: {
        buyWinRate: buyWinRate.toFixed(1),
        sellWinRate: sellWinRate.toFixed(1),
        buyTrades,
        sellTrades,
        buyPnL: buyPnL.toFixed(2),
        sellPnL: sellPnL.toFixed(2),
      },
      gold: goldTrades.length > 0 ? {
        totalTrades: goldTrades.length,
        winRate: goldWinRate.toFixed(1),
        totalPnl: goldPnL.toFixed(2),
      } : null,
      risk: {
        avgTradesPerDay: avgTradesPerDay.toFixed(1),
        profitFactor: profitFactor.toFixed(2),
        expectancy: expectancy.toFixed(2),
      },
      suggestions,
      warnings,
      tips,
      motivation,
    }

    console.log("Analytics ready:", responseData.summary)
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