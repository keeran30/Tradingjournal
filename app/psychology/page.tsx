"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import AIAssistant from "../components/AIAssistant";
import { supabase } from "../lib/supabase";

// ─── Types ──────────────────────────────────────────────
interface Trade {
  id: string;
  asset: string;
  direction: string;
  pnl: number;
  emotion: string | null;
  created_at: string;
}

interface EmotionStats {
  emotion: string;
  count: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
}

interface DailyMood {
  date: string;
  dominantEmotion: string;
  tradeCount: number;
  dayPnL: number;
}

interface PsychologyInsight {
  title: string;
  description: string;
  severity: "positive" | "warning" | "danger" | "info";
  icon: string;
}

// ─── Constants ───────────────────────────────────────────
const POSITIVE_EMOTIONS = [
  "Calm", "Confident", "Focused", "Patient", "Disciplined",
  "Optimistic", "Prepared", "Mindful",
];

const NEGATIVE_EMOTIONS = [
  "Anxious", "Impatient", "Fearful", "Greedy", "Stressed",
  "Overconfident", "Hesitant", "Unsure", "Tired", "Panicked",
  "Revengeful", "Desperate", "Euphoric",
];

const DISCIPLINE_TIPS = [
  {
    title: "Follow Your Trading Plan",
    description: "Write down entry/exit rules before each trade. Stick to them regardless of emotion.",
  },
  {
    title: "Practice Position Sizing",
    description: "Never risk more than 1-2% of your account on a single trade. This reduces emotional pressure.",
  },
  {
    title: "Keep a Trading Journal",
    description: "Record not just numbers, but how you felt during each trade. Patterns will emerge.",
  },
  {
    title: "Take Breaks After Losses",
    description: "After a big loss, step away for at least 15 minutes. Never revenge trade.",
  },
  {
    title: "Celebrate Process, Not Profits",
    description: "Reward yourself for following your plan, not for making money. This builds discipline.",
  },
  {
    title: "Meditate Before Trading",
    description: "5 minutes of deep breathing before your session can significantly improve decision-making.",
  },
  {
    title: "Set Daily Loss Limits",
    description: "Decide your maximum daily loss in advance. When hit, stop trading for the day.",
  },
  {
    title: "Review Weekly",
    description: "Every Sunday, review your trades and emotions. Look for patterns and areas to improve.",
  },
];

// ─── Helper Functions ────────────────────────────────────
const getEmotionEmoji = (emotion: string): string => {
  const emojiMap: Record<string, string> = {
    Calm: "😌", Confident: "😊", Focused: "🎯", Patient: "🧘",
    Disciplined: "💪", Optimistic: "🌟", Prepared: "📋", Mindful: "🧠",
    Anxious: "😰", Impatient: "😤", Fearful: "😨", Greedy: "🤑",
    Stressed: "😓", Overconfident: "😎", Hesitant: "🤔", Unsure: "🤷",
    Tired: "😴", Panicked: "😱", Revengeful: "😡", Desperate: "😩",
    Euphoric: "🤩",
  };
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (emotion.includes(key)) return emoji;
  }
  return "🧠";
};

const getQuoteOfTheDay = (): string => {
  const quotes = [
    "The market is a device for transferring money from the impatient to the patient. – Warren Buffett",
    "The key to trading success is emotional discipline. – Victor Sperandeo",
    "It's not whether you're right or wrong, but how much money you make when you're right. – George Soros",
    "The goal of a successful trader is to make the best trades. Money is secondary. – Alexander Elder",
    "Trading is 80% psychological and 20% methodological. – Mark Douglas",
    "Losers average losers. – Paul Tudor Jones",
    "The market does not beat them. They beat themselves. – Jesse Livermore",
    "Discipline is the bridge between goals and accomplishment. – Jim Rohn",
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
};

// ─── Main Component ──────────────────────────────────────
export default function PsychologyPageClient() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "emotions" | "insights" | "discipline">("overview");
  const [timeFilter, setTimeFilter] = useState<"all" | "week" | "month" | "year">("all");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ─── Fetch Trades ────────────────────────────────────
  const fetchTrades = useCallback(async () => {
    try {
      let query = supabase.from("trades").select("*").order("created_at", { ascending: false });

      if (timeFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte("created_at", weekAgo.toISOString());
      } else if (timeFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte("created_at", monthAgo.toISOString());
      } else if (timeFilter === "year") {
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        query = query.gte("created_at", yearAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error("Fetch error:", error);
      } else {
        setTrades(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch trades:", err);
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // ─── Calculations ────────────────────────────────────
  const tradesWithEmotions = trades.filter((t) => t.emotion);
  const emotionCoverage = trades.length > 0
    ? Math.round((tradesWithEmotions.length / trades.length) * 100)
    : 0;

  // Emotion breakdown
  const emotionBreakdown = (): EmotionStats[] => {
    const map: Record<string, { count: number; wins: number; totalPnL: number }> = {};

    tradesWithEmotions.forEach((t) => {
      if (!map[t.emotion!]) {
        map[t.emotion!] = { count: 0, wins: 0, totalPnL: 0 };
      }
      map[t.emotion!].count++;
      if (t.pnl > 0) map[t.emotion!].wins++;
      map[t.emotion!].totalPnL += t.pnl || 0;
    });

    return Object.entries(map)
      .map(([emotion, stats]) => ({
        emotion,
        count: stats.count,
        winRate: Math.round((stats.wins / stats.count) * 100),
        totalPnL: stats.totalPnL,
        avgPnL: stats.totalPnL / stats.count,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const emotions = emotionBreakdown();

  // Best emotion (highest win rate with minimum 2 trades)
  const bestEmotion = emotions.filter((e) => e.count >= 2).sort((a, b) => b.winRate - a.winRate)[0];

  // Worst emotion
  const worstEmotion = emotions.filter((e) => e.count >= 2).sort((a, b) => a.winRate - b.winRate)[0];

  // Most profitable emotion
  const mostProfitableEmotion = emotions.sort((a, b) => b.totalPnL - a.totalPnL)[0];

  // Emotional state score (0-100)
  const calculateEmotionalScore = (): number => {
    if (tradesWithEmotions.length === 0) return 50;

    let positiveCount = 0;
    let negativeCount = 0;

    tradesWithEmotions.forEach((t) => {
      if (POSITIVE_EMOTIONS.some((pe) => t.emotion?.includes(pe))) positiveCount++;
      if (NEGATIVE_EMOTIONS.some((ne) => t.emotion?.includes(ne))) negativeCount++;
    });

    const ratio = positiveCount / (positiveCount + negativeCount || 1);
    return Math.round(ratio * 100);
  };

  const emotionalScore = calculateEmotionalScore();

  // Daily mood tracking
  const dailyMoods = (): DailyMood[] => {
    const map: Record<string, { emotions: string[]; count: number; pnl: number }> = {};

    tradesWithEmotions.forEach((t) => {
      const date = t.created_at?.split("T")[0] || "unknown";
      if (!map[date]) map[date] = { emotions: [], count: 0, pnl: 0 };
      map[date].emotions.push(t.emotion!);
      map[date].count++;
      map[date].pnl += t.pnl || 0;
    });

    return Object.entries(map)
      .map(([date, data]) => {
        const freqMap: Record<string, number> = {};
        data.emotions.forEach((e) => (freqMap[e] = (freqMap[e] || 0) + 1));
        const dominant = Object.entries(freqMap).sort((a, b) => b[1] - a[1])[0][0];
        return { date, dominantEmotion: dominant, tradeCount: data.count, dayPnL: data.pnl };
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 14);
  };

  const moods = dailyMoods();

  // AI-generated insights
  const generateInsights = (): PsychologyInsight[] => {
    const insights: PsychologyInsight[] = [];

    if (tradesWithEmotions.length === 0) {
      insights.push({
        title: "Start Tracking Emotions",
        description: "Add emotions to your trades to unlock personalized psychology insights and patterns.",
        severity: "info",
        icon: "🎯",
      });
      return insights;
    }

    if (emotionCoverage < 50) {
      insights.push({
        title: "Low Emotion Tracking",
        description: `Only ${emotionCoverage}% of your trades have emotions logged. Track more to get better insights.`,
        severity: "warning",
        icon: "⚠️",
      });
    }

    if (bestEmotion && bestEmotion.winRate >= 70) {
      insights.push({
        title: `You Trade Best When ${bestEmotion.emotion}`,
        description: `Your win rate is ${bestEmotion.winRate}% when feeling ${bestEmotion.emotion}. Try to cultivate this mindset before trading.`,
        severity: "positive",
        icon: "🏆",
      });
    }

    if (worstEmotion && worstEmotion.winRate < 40) {
      insights.push({
        title: `Avoid Trading When ${worstEmotion.emotion}`,
        description: `Your win rate drops to ${worstEmotion.winRate}% when ${worstEmotion.emotion}. Step away and reset when you feel this way.`,
        severity: "danger",
        icon: "🚨",
      });
    }

    const negativeEmotionTrades = tradesWithEmotions.filter((t) =>
      NEGATIVE_EMOTIONS.some((ne) => t.emotion?.includes(ne))
    );
    const negativePnL = negativeEmotionTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    if (negativePnL < -100) {
      insights.push({
        title: "Negative Emotions Are Costing You",
        description: `You've lost $${Math.abs(negativePnL).toFixed(2)} when trading with negative emotions. Practice emotional awareness.`,
        severity: "warning",
        icon: "💰",
      });
    }

    if (emotionalScore >= 70) {
      insights.push({
        title: "Strong Emotional Control",
        description: `Your emotional score is ${emotionalScore}/100. You maintain composure well during trading. Keep it up!`,
        severity: "positive",
        icon: "💪",
      });
    } else if (emotionalScore < 40) {
      insights.push({
        title: "Emotional Control Needs Work",
        description: `Your emotional score is ${emotionalScore}/100. Focus on discipline exercises and pre-trade routines.`,
        severity: "warning",
        icon: "🎯",
      });
    }

    // Check for revenge trading (multiple trades same day with negative emotions after a loss)
    const tradesByDay: Record<string, Trade[]> = {};
    trades.forEach((t) => {
      const day = t.created_at?.split("T")[0] || "";
      if (!tradesByDay[day]) tradesByDay[day] = [];
      tradesByDay[day].push(t);
    });

    let revengeDays = 0;
    Object.values(tradesByDay).forEach((dayTrades) => {
      if (dayTrades.length >= 3) {
        const hasLoss = dayTrades.some((t) => t.pnl < 0);
        const hasNegativeEmotion = dayTrades.some((t) =>
          NEGATIVE_EMOTIONS.some((ne) => t.emotion?.includes(ne))
        );
        if (hasLoss && hasNegativeEmotion) revengeDays++;
      }
    });

    if (revengeDays > 0) {
      insights.push({
        title: "Revenge Trading Detected",
        description: `You've had ${revengeDays} days with signs of revenge trading. Set a daily loss limit and stick to it.`,
        severity: "danger",
        icon: "🚫",
      });
    }

    if (insights.length === 0) {
      insights.push({
        title: "Keep Building Your Journal",
        description: "Add more trades with emotions to unlock deeper psychological insights and patterns.",
        severity: "info",
        icon: "📈",
      });
    }

    return insights;
  };

  const insights = generateInsights();

  // ─── Loading State ────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">🧠</div>
          <p className="text-zinc-400 text-lg">Analyzing your trading psychology...</p>
        </div>
      </main>
    );
  }

  // ─── Render ────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />

      <section className="flex-1 p-8 overflow-y-auto">
        {/* Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${
              notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Trading Psychology</h1>
          <p className="text-zinc-400 text-lg">Understand your mindset. Master your emotions. Improve your trading.</p>
        </div>

        {/* Quote of the Day */}
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-2xl p-6 mb-8">
          <p className="text-purple-300 italic text-lg">💬 {getQuoteOfTheDay()}</p>
        </div>

        {/* Time Filter */}
        <div className="flex gap-2 mb-6">
          {(["all", "week", "month", "year"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                timeFilter === filter
                  ? "bg-yellow-500 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {filter === "all" ? "All Time" : filter === "week" ? "This Week" : filter === "month" ? "This Month" : "This Year"}
            </button>
          ))}
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 mb-8 border-b border-zinc-800 overflow-x-auto">
          {[
            { key: "overview", label: "📊 Overview", icon: "📊" },
            { key: "emotions", label: "🎭 Emotions", icon: "🎭" },
            { key: "insights", label: "💡 AI Insights", icon: "💡" },
            { key: "discipline", label: "💪 Discipline", icon: "💪" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`pb-3 px-4 font-bold transition whitespace-nowrap ${
                activeTab === tab.key
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-center">
                <p className="text-5xl mb-2">
                  {emotionalScore >= 70 ? "😊" : emotionalScore >= 40 ? "😐" : "😟"}
                </p>
                <p className="text-zinc-400 text-sm">Emotional Score</p>
                <p
                  className={`text-3xl font-bold ${
                    emotionalScore >= 70 ? "text-green-400" : emotionalScore >= 40 ? "text-yellow-400" : "text-red-400"
                  }`}
                >
                  {emotionalScore}/100
                </p>
              </div>

              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-center">
                <p className="text-5xl mb-2">📝</p>
                <p className="text-zinc-400 text-sm">Emotions Tracked</p>
                <p className="text-3xl font-bold text-white">{tradesWithEmotions.length}</p>
                <p className="text-xs text-zinc-500">{emotionCoverage}% of all trades</p>
              </div>

              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-center">
                <p className="text-5xl mb-2">{bestEmotion ? getEmotionEmoji(bestEmotion.emotion) : "🤔"}</p>
                <p className="text-zinc-400 text-sm">Best Mindset</p>
                <p className="text-xl font-bold text-green-400">{bestEmotion?.emotion || "N/A"}</p>
                {bestEmotion && <p className="text-xs text-zinc-500">{bestEmotion.winRate}% win rate</p>}
              </div>

              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-center">
                <p className="text-5xl mb-2">{worstEmotion ? getEmotionEmoji(worstEmotion.emotion) : "🤔"}</p>
                <p className="text-zinc-400 text-sm">Worst Mindset</p>
                <p className="text-xl font-bold text-red-400">{worstEmotion?.emotion || "N/A"}</p>
                {worstEmotion && <p className="text-xs text-zinc-500">{worstEmotion.winRate}% win rate</p>}
              </div>
            </div>

            {/* Emotional Score Bar */}
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-bold mb-4">Emotional Balance</h3>
              <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    emotionalScore >= 70 ? "bg-green-500" : emotionalScore >= 40 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${emotionalScore}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-zinc-500">
                <span>Poor Control</span>
                <span>Neutral</span>
                <span>Excellent Control</span>
              </div>
            </div>

            {/* Daily Mood Chart */}
            {moods.length > 0 && (
              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <h3 className="font-bold mb-4">📅 Recent Trading Days Mood</h3>
                <div className="space-y-2">
                  {moods.slice(0, 7).map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400 text-sm">{day.date}</span>
                        <span className="text-2xl">{getEmotionEmoji(day.dominantEmotion)}</span>
                        <span className="text-sm">{day.dominantEmotion}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-zinc-400">{day.tradeCount} trades</span>
                        <span className={`font-bold ${day.dayPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                          ${day.dayPnL.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── EMOTIONS TAB ─────────────────────────── */}
        {activeTab === "emotions" && (
          <div className="space-y-6">
            {emotions.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800">
                <p className="text-6xl mb-4">🎭</p>
                <p className="text-zinc-400 text-lg mb-2">No emotions tracked yet</p>
                <p className="text-zinc-500">Add emotions to your trades to see this breakdown</p>
              </div>
            ) : (
              <>
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                  <div className="grid grid-cols-6 gap-4 p-4 border-b border-zinc-800 text-zinc-400 text-sm font-semibold">
                    <div>Emotion</div>
                    <div>Trades</div>
                    <div>Win Rate</div>
                    <div>Total P&L</div>
                    <div>Avg P&L</div>
                    <div>Impact</div>
                  </div>
                  {emotions.map((e) => (
                    <div key={e.emotion} className="grid grid-cols-6 gap-4 p-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getEmotionEmoji(e.emotion)}</span>
                        <span className="font-medium">{e.emotion}</span>
                      </div>
                      <div>{e.count}</div>
                      <div className={e.winRate >= 50 ? "text-green-400" : "text-red-400"}>
                        {e.winRate}%
                      </div>
                      <div className={e.totalPnL >= 0 ? "text-green-400" : "text-red-400"}>
                        ${e.totalPnL.toFixed(2)}
                      </div>
                      <div className={e.avgPnL >= 0 ? "text-green-400" : "text-red-400"}>
                        ${e.avgPnL.toFixed(2)}
                      </div>
                      <div>
                        {e.winRate >= 60 ? (
                          <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded-lg text-xs">Positive</span>
                        ) : e.winRate >= 40 ? (
                          <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 rounded-lg text-xs">Neutral</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded-lg text-xs">Negative</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Most Profitable Emotion */}
                {mostProfitableEmotion && (
                  <div className="mt-4 bg-green-900/10 border border-green-800/30 p-4 rounded-xl">
                    <p className="text-green-400">
                      💰 Your most profitable emotion is <b>{mostProfitableEmotion.emotion}</b> with ${mostProfitableEmotion.totalPnL.toFixed(2)} total P&L.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── AI INSIGHTS TAB ──────────────────────── */}
        {activeTab === "insights" && (
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border ${
                  insight.severity === "positive"
                    ? "bg-green-900/10 border-green-800/30"
                    : insight.severity === "warning"
                    ? "bg-yellow-900/10 border-yellow-800/30"
                    : insight.severity === "danger"
                    ? "bg-red-900/10 border-red-800/30"
                    : "bg-blue-900/10 border-blue-800/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{insight.icon}</span>
                  <div>
                    <h3
                      className={`font-bold text-lg mb-1 ${
                        insight.severity === "positive"
                          ? "text-green-400"
                          : insight.severity === "warning"
                          ? "text-yellow-400"
                          : insight.severity === "danger"
                          ? "text-red-400"
                          : "text-blue-400"
                      }`}
                    >
                      {insight.title}
                    </h3>
                    <p className="text-zinc-300">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}

            {tradesWithEmotions.length > 0 && (
              <div className="bg-blue-900/10 border border-blue-800/30 p-6 rounded-2xl mt-4">
                <h3 className="font-bold text-blue-400 mb-2">🤖 Want Deeper Analysis?</h3>
                <p className="text-zinc-300 mb-3">
                  Click the AI Coach button (bottom right) and ask questions like:
                </p>
                <ul className="space-y-1 text-sm text-zinc-400">
                  <li>• "What emotions hurt my trading the most?"</li>
                  <li>• "How can I improve my trading discipline?"</li>
                  <li>• "Analyze my emotional patterns this month"</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ─── DISCIPLINE TAB ────────────────────────── */}
        {activeTab === "discipline" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DISCIPLINE_TIPS.map((tip, idx) => (
                <div key={idx} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-yellow-500/30 transition">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-500 font-bold text-lg">0{idx + 1}</span>
                    <h3 className="font-bold">{tip.title}</h3>
                  </div>
                  <p className="text-zinc-400 text-sm">{tip.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-center">
              <p className="text-4xl mb-3">🧘</p>
              <h3 className="font-bold text-lg mb-2">Pre-Trade Routine Checklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-left">
                <div className="bg-zinc-800 p-4 rounded-xl">
                  <p className="font-bold text-green-400 mb-2">✅ Mental Check</p>
                  <ul className="text-sm text-zinc-400 space-y-1">
                    <li>• Am I calm and focused?</li>
                    <li>• Have I reviewed my plan?</li>
                    <li>• Am I free from distractions?</li>
                  </ul>
                </div>
                <div className="bg-zinc-800 p-4 rounded-xl">
                  <p className="font-bold text-blue-400 mb-2">✅ Technical Check</p>
                  <ul className="text-sm text-zinc-400 space-y-1">
                    <li>• Entry/exit levels set?</li>
                    <li>• Stop loss placed?</li>
                    <li>• Position size calculated?</li>
                  </ul>
                </div>
                <div className="bg-zinc-800 p-4 rounded-xl">
                  <p className="font-bold text-yellow-400 mb-2">✅ Risk Check</p>
                  <ul className="text-sm text-zinc-400 space-y-1">
                    <li>• Within daily loss limit?</li>
                    <li>• Risk per trade 1-2%?</li>
                    <li>• No revenge trading?</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {trades.length === 0 && (
          <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800 mt-6">
            <p className="text-6xl mb-4">🧠</p>
            <p className="text-zinc-400 text-lg mb-2">No trades to analyze yet</p>
            <p className="text-zinc-500 mb-6">Add trades with emotions to unlock psychology insights</p>
            <a
              href="/trades"
              className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition inline-block"
            >
              Go to Trading Journal →
            </a>
          </div>
        )}
      </section>

      <AIAssistant />
    </main>
  );
}