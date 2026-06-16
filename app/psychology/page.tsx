"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import AIAssistant from "../components/AIAssistant";
import { supabase } from "../lib/supabase";
import AppLoader from "../components/AppLoader";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface Trade {
  id: string;
  asset: string;
  direction: string;
  entry: number;
  close_price: number;
  size: number;
  pnl: number;
  emotion: string | null;
  created_at: string;
}

interface EmotionStats {
  emotion: string;
  emoji: string;
  count: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
  riskRewardRatio: number;
}

interface DailyMood {
  date: string;
  dayName: string;
  dominantEmotion: string;
  emotionEmoji: string;
  tradeCount: number;
  dayPnL: number;
  winRate: number;
}

interface BehavioralPattern {
  type: string;
  label: string;
  description: string;
  severity: "high" | "medium" | "low";
  occurrences: number;
  icon: string;
  recommendation: string;
}

interface SessionAnalysis {
  session: string;
  trades: number;
  winRate: number;
  totalPnL: number;
  avgEmotionScore: number;
}

interface WeeklyReport {
  weekStart: string;
  trades: number;
  winRate: number;
  pnl: number;
  dominantEmotion: string;
  emotionalScore: number;
  improvement: string;
}

interface PsychologyGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  completed: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const POSITIVE_EMOTIONS = [
  "Calm", "Confident", "Focused", "Patient", "Disciplined",
  "Optimistic", "Prepared", "Mindful", "Grateful", "Motivated",
];

const NEGATIVE_EMOTIONS = [
  "Anxious", "Impatient", "Fearful", "Greedy", "Stressed",
  "Overconfident", "Hesitant", "Unsure", "Tired", "Panicked",
  "Revengeful", "Desperate", "Euphoric", "Frustrated", "Angry",
];

const EMOTION_EMOJI_MAP: Record<string, string> = {
  Calm: "😌", Confident: "😊", Focused: "🎯", Patient: "🧘",
  Disciplined: "💪", Optimistic: "🌟", Prepared: "📋", Mindful: "🧠",
  Grateful: "🙏", Motivated: "🔥",
  Anxious: "😰", Impatient: "😤", Fearful: "😨", Greedy: "🤑",
  Stressed: "😓", Overconfident: "😎", Hesitant: "🤔", Unsure: "🤷",
  Tired: "😴", Panicked: "😱", Revengeful: "😡", Desperate: "😩",
  Euphoric: "🤩", Frustrated: "😤", Angry: "🤬",
};

const TRADING_QUOTES = [
  { quote: "The market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { quote: "The key to trading success is emotional discipline. If intelligence were the key, there would be a lot more people making money trading.", author: "Victor Sperandeo" },
  { quote: "It is not whether you are right or wrong that is important, but how much money you make when you are right and how much you lose when you are wrong.", author: "George Soros" },
  { quote: "The goal of a successful trader is to make the best trades. Money is secondary.", author: "Alexander Elder" },
  { quote: "Trading is 80% psychological and 20% methodological.", author: "Mark Douglas" },
  { quote: "Losers average losers.", author: "Paul Tudor Jones" },
  { quote: "The market does not beat them. They beat themselves.", author: "Jesse Livermore" },
  { quote: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { quote: "The most important quality for an investor is temperament, not intellect.", author: "Warren Buffett" },
  { quote: "In trading, you have to be defensive and aggressive at the same time. If you are not aggressive, you are not going to make money, and if you are not defensive, you are not going to keep it.", author: "Ray Dalio" },
  { quote: "The best traders have no ego. You have to swallow your pride and get out of the losses.", author: "Tom Baldwin" },
  { quote: "Successful trading is about finding a few good setups and exploiting them. It is not about being right all the time.", author: "Paul Tudor Jones" },
];

const PRE_TRADE_CHECKLIST = [
  {
    id: "mental",
    label: "Psychological Readiness",
    items: [
      "I am in a calm and balanced emotional state",
      "My trading environment is free from distractions",
      "I am adequately rested and mentally alert",
      "I have fully processed previous trading outcomes and am not carrying forward emotional baggage",
    ],
  },
  {
    id: "technical",
    label: "Technical Preparation",
    items: [
      "I have clearly identified entry and exit levels with supporting rationale",
      "Stop-loss orders are properly configured and placed",
      "Take-profit targets are established based on technical analysis",
      "I have reviewed the economic calendar for scheduled news events that may impact my positions",
    ],
  },
  {
    id: "risk",
    label: "Risk Management Verification",
    items: [
      "Position size is calculated and confirmed within my 1-2% risk parameters",
      "I have not exceeded my predetermined daily loss limit",
      "I have a clearly defined contingency plan for adverse price movement",
      "This trade aligns with my documented trading strategy and edge",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function getEmotionEmoji(emotion: string): string {
  for (const [key, emoji] of Object.entries(EMOTION_EMOJI_MAP)) {
    if (emotion.includes(key)) return emoji;
  }
  return "🧠";
}

function getEmotionCategory(emotion: string): "positive" | "negative" | "neutral" {
  if (POSITIVE_EMOTIONS.some((e) => emotion.includes(e))) return "positive";
  if (NEGATIVE_EMOTIONS.some((e) => emotion.includes(e))) return "negative";
  return "neutral";
}

function getDayName(dateStr: string): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(dateStr).getDay()];
}

function getRandomQuote() {
  return TRADING_QUOTES[Math.floor(Math.random() * TRADING_QUOTES.length)];
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function PsychologyPageClient() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "emotions" | "patterns" | "sessions" | "checklist" | "goals" | "report">("overview");
  const [timeFilter, setTimeFilter] = useState<"all" | "week" | "month" | "quarter">("all");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [checklistItems, setChecklistItems] = useState<Record<string, boolean>>({});
  const [goals, setGoals] = useState<PsychologyGoal[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", target: 0, unit: "%", deadline: "" });
  const [moodNote, setMoodNote] = useState("");
  const [moodNotes, setMoodNotes] = useState<{ date: string; note: string }[]>([]);
  const [dailyQuote] = useState(getRandomQuote());

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedChecklist = localStorage.getItem("psych_checklist");
      if (savedChecklist) setChecklistItems(JSON.parse(savedChecklist));
      const savedGoals = localStorage.getItem("psych_goals");
      if (savedGoals) setGoals(JSON.parse(savedGoals));
      const savedNotes = localStorage.getItem("psych_notes");
      if (savedNotes) setMoodNotes(JSON.parse(savedNotes));
    }
  }, []);

  const fetchTrades = useCallback(async () => {
    try {
      let query = supabase.from("trades").select("*").order("created_at", { ascending: false });
      const now = new Date();
      if (timeFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte("created_at", weekAgo.toISOString());
      } else if (timeFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte("created_at", monthAgo.toISOString());
      } else if (timeFilter === "quarter") {
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        query = query.gte("created_at", quarterAgo.toISOString());
      }
      const { data, error } = await query;
      if (error) console.error("Fetch error:", error);
      else setTrades(data || []);
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const tradesWithEmotions = useMemo(() => trades.filter((t) => t.emotion), [trades]);
  const emotionCoverage = trades.length > 0 ? Math.round((tradesWithEmotions.length / trades.length) * 100) : 0;

  const emotionStats = useMemo((): EmotionStats[] => {
    const map: Record<string, { count: number; wins: number; losses: number; totalPnL: number; totalRiskReward: number }> = {};
    tradesWithEmotions.forEach((t) => {
      if (!map[t.emotion!]) map[t.emotion!] = { count: 0, wins: 0, losses: 0, totalPnL: 0, totalRiskReward: 0 };
      map[t.emotion!].count++;
      if (t.pnl > 0) map[t.emotion!].wins++;
      else map[t.emotion!].losses++;
      map[t.emotion!].totalPnL += t.pnl || 0;
      const risk = Math.abs((t.entry - t.close_price) * t.size);
      if (risk > 0) map[t.emotion!].totalRiskReward += (t.pnl || 0) / risk;
    });
    return Object.entries(map)
      .map(([emotion, data]) => ({
        emotion,
        emoji: getEmotionEmoji(emotion),
        count: data.count,
        wins: data.wins,
        losses: data.losses,
        winRate: Math.round((data.wins / data.count) * 100),
        totalPnL: data.totalPnL,
        avgPnL: data.totalPnL / data.count,
        riskRewardRatio: data.totalRiskReward / data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [tradesWithEmotions]);

  const emotionalScore = useMemo(() => {
    if (tradesWithEmotions.length === 0) return 50;
    let positive = 0, negative = 0;
    tradesWithEmotions.forEach((t) => {
      if (getEmotionCategory(t.emotion!) === "positive") positive++;
      else if (getEmotionCategory(t.emotion!) === "negative") negative++;
    });
    return Math.round((positive / (positive + negative || 1)) * 100);
  }, [tradesWithEmotions]);

  const dailyMoods = useMemo((): DailyMood[] => {
    const map: Record<string, { emotions: string[]; trades: Trade[] }> = {};
    tradesWithEmotions.forEach((t) => {
      const date = t.created_at?.split("T")[0] || "";
      if (!map[date]) map[date] = { emotions: [], trades: [] };
      map[date].emotions.push(t.emotion!);
      map[date].trades.push(t);
    });
    return Object.entries(map)
      .map(([date, data]) => {
        const freq: Record<string, number> = {};
        data.emotions.forEach((e) => (freq[e] = (freq[e] || 0) + 1));
        const dominant = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
        const wins = data.trades.filter((t) => t.pnl > 0).length;
        return {
          date,
          dayName: getDayName(date),
          dominantEmotion: dominant,
          emotionEmoji: getEmotionEmoji(dominant),
          tradeCount: data.trades.length,
          dayPnL: data.trades.reduce((s, t) => s + (t.pnl || 0), 0),
          winRate: Math.round((wins / data.trades.length) * 100),
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [tradesWithEmotions]);

  const behavioralPatterns = useMemo((): BehavioralPattern[] => {
    const patterns: BehavioralPattern[] = [];
    if (trades.length === 0) return patterns;
    const byDay: Record<string, Trade[]> = {};
    trades.forEach((t) => {
      const day = t.created_at?.split("T")[0] || "";
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(t);
    });
    let revengeDays = 0;
    Object.values(byDay).forEach((dayTrades) => {
      if (dayTrades.length >= 3) {
        const hasLoss = dayTrades.some((t) => t.pnl < 0);
        const hasNegative = dayTrades.some((t) => t.emotion && getEmotionCategory(t.emotion) === "negative");
        if (hasLoss && hasNegative) revengeDays++;
      }
    });
    if (revengeDays > 0) {
      patterns.push({
        type: "revenge_trading",
        label: "Revenge Trading Pattern",
        description: `Detected on ${revengeDays} trading day(s). Following a loss, you tend to increase trading frequency while experiencing negative emotional states. This behavior compounds losses and impairs decision-making quality.`,
        severity: revengeDays > 3 ? "high" : revengeDays > 1 ? "medium" : "low",
        occurrences: revengeDays,
        icon: "😡",
        recommendation: "Implement a strict daily loss limit. After any loss exceeding your threshold, step away from your trading terminal for a minimum of fifteen minutes to allow complete emotional reset before considering any additional positions.",
      });
    }
    let overtradingDays = 0;
    Object.values(byDay).forEach((dayTrades) => {
      if (dayTrades.length >= 5) overtradingDays++;
    });
    if (overtradingDays > 0) {
      patterns.push({
        type: "overtrading",
        label: "Excessive Trading Frequency",
        description: `You executed five or more trades on ${overtradingDays} day(s). Elevated trade frequency often correlates with reduced trade quality and increased transaction costs.`,
        severity: overtradingDays > 5 ? "high" : "medium",
        occurrences: overtradingDays,
        icon: "📈",
        recommendation: "Establish a maximum daily trade limit of three to five high-conviction setups. Quality of execution should take precedence over quantity of trades placed.",
      });
    }
    const hesitationTrades = tradesWithEmotions.filter((t) => 
      t.emotion?.includes("Hesitant") || t.emotion?.includes("Unsure")
    );
    if (hesitationTrades.length > 0) {
      const hWinRate = Math.round((hesitationTrades.filter((t) => t.pnl > 0).length / hesitationTrades.length) * 100);
      patterns.push({
        type: "hesitation",
        label: "Decision Paralysis Pattern",
        description: `${hesitationTrades.length} trades were executed while experiencing hesitation or uncertainty. Win rate under these conditions: ${hWinRate}%. Trading without conviction typically leads to suboptimal entry and exit execution.`,
        severity: hWinRate < 40 ? "high" : "medium",
        occurrences: hesitationTrades.length,
        icon: "🤔",
        recommendation: "When experiencing uncertainty about a trade setup, exercise patience and wait for higher-conviction opportunities. The market will always present additional setups; capital preservation is paramount.",
      });
    }
    const overconfidentTrades = tradesWithEmotions.filter((t) => t.emotion?.includes("Overconfident"));
    if (overconfidentTrades.length > 0) {
      const avgLoss = overconfidentTrades.filter((t) => t.pnl < 0).reduce((s, t) => s + Math.abs(t.pnl), 0) / (overconfidentTrades.filter((t) => t.pnl < 0).length || 1);
      patterns.push({
        type: "overconfidence",
        label: "Overconfidence Risk Factor",
        description: `${overconfidentTrades.length} trades placed while experiencing elevated confidence levels. Average loss during these trades: $${avgLoss.toFixed(2)}. Overconfidence frequently leads to increased position sizing and relaxed risk management standards.`,
        severity: avgLoss > 100 ? "high" : "medium",
        occurrences: overconfidentTrades.length,
        icon: "😎",
        recommendation: "Following a significant winning trade, consider reducing position size by fifty percent for the subsequent trade. This counter-cyclical approach helps mitigate the risk of overconfidence-driven losses.",
      });
    }
    return patterns;
  }, [trades, tradesWithEmotions]);

  const sessionAnalysis = useMemo((): SessionAnalysis[] => {
    const sessions: Record<string, Trade[]> = {
      "Morning (06:00–12:00)": [],
      "Afternoon (12:00–17:00)": [],
      "Evening (17:00–22:00)": [],
      "Late Night (22:00–06:00)": [],
    };
    tradesWithEmotions.forEach((t) => {
      const hour = new Date(t.created_at).getHours();
      if (hour >= 6 && hour < 12) sessions["Morning (06:00–12:00)"].push(t);
      else if (hour >= 12 && hour < 17) sessions["Afternoon (12:00–17:00)"].push(t);
      else if (hour >= 17 && hour < 22) sessions["Evening (17:00–22:00)"].push(t);
      else sessions["Late Night (22:00–06:00)"].push(t);
    });
    return Object.entries(sessions)
      .filter(([, t]) => t.length > 0)
      .map(([session, trades]) => {
        const wins = trades.filter((t) => t.pnl > 0).length;
        const posCount = trades.filter((t) => getEmotionCategory(t.emotion!) === "positive").length;
        return {
          session,
          trades: trades.length,
          winRate: Math.round((wins / trades.length) * 100),
          totalPnL: trades.reduce((s, t) => s + (t.pnl || 0), 0),
          avgEmotionScore: Math.round((posCount / trades.length) * 100),
        };
      });
  }, [tradesWithEmotions]);

  const weeklyReports = useMemo((): WeeklyReport[] => {
    const weeks: Record<string, Trade[]> = {};
    trades.forEach((t) => {
      const weekStart = getWeekStart(new Date(t.created_at));
      if (!weeks[weekStart]) weeks[weekStart] = [];
      weeks[weekStart].push(t);
    });
    return Object.entries(weeks)
      .map(([weekStart, weekTrades]) => {
        const wins = weekTrades.filter((t) => t.pnl > 0).length;
        const withEmotions = weekTrades.filter((t) => t.emotion);
        const freq: Record<string, number> = {};
        withEmotions.forEach((t) => (freq[t.emotion!] = (freq[t.emotion!] || 0) + 1));
        const dominant = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "None Recorded";
        const posCount = withEmotions.filter((t) => getEmotionCategory(t.emotion!) === "positive").length;
        return {
          weekStart,
          trades: weekTrades.length,
          winRate: Math.round((wins / weekTrades.length) * 100),
          pnl: weekTrades.reduce((s, t) => s + (t.pnl || 0), 0),
          dominantEmotion: dominant,
          emotionalScore: withEmotions.length > 0 ? Math.round((posCount / withEmotions.length) * 100) : 50,
          improvement: "",
        };
      })
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
      .slice(0, 8);
  }, [trades]);

  const reportsWithTrend = useMemo(() => {
    return weeklyReports.map((report, idx) => {
      if (idx < weeklyReports.length - 1) {
        const prev = weeklyReports[idx + 1];
        const improvement = report.emotionalScore - prev.emotionalScore;
        report.improvement = improvement > 0 ? `↑ ${improvement}%` : improvement < 0 ? `↓ ${Math.abs(improvement)}%` : "No Change";
      } else {
        report.improvement = "Baseline";
      }
      return report;
    });
  }, [weeklyReports]);

  const addGoal = () => {
    if (!newGoal.title || !newGoal.target) return;
    const goal: PsychologyGoal = {
      id: Date.now().toString(),
      title: newGoal.title,
      target: newGoal.target,
      current: 0,
      unit: newGoal.unit,
      deadline: newGoal.deadline,
      completed: false,
    };
    const updated = [...goals, goal];
    setGoals(updated);
    localStorage.setItem("psych_goals", JSON.stringify(updated));
    setShowGoalForm(false);
    setNewGoal({ title: "", target: 0, unit: "%", deadline: "" });
    showNotification("Goal added successfully", "success");
  };

  const updateGoalProgress = (id: string, increment: number) => {
    const updated = goals.map((g) => {
      if (g.id === id) {
        const newCurrent = Math.min(g.current + increment, g.target);
        return { ...g, current: newCurrent, completed: newCurrent >= g.target };
      }
      return g;
    });
    setGoals(updated);
    localStorage.setItem("psych_goals", JSON.stringify(updated));
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    localStorage.setItem("psych_goals", JSON.stringify(updated));
  };

  const toggleChecklistItem = (item: string) => {
    const updated = { ...checklistItems, [item]: !checklistItems[item] };
    setChecklistItems(updated);
    localStorage.setItem("psych_checklist", JSON.stringify(updated));
  };

  const resetChecklist = () => {
    setChecklistItems({});
    localStorage.removeItem("psych_checklist");
    showNotification("Checklist reset successfully", "success");
  };

  const checklistProgress = Object.values(checklistItems).filter(Boolean).length;
  const checklistTotal = PRE_TRADE_CHECKLIST.reduce((sum, cat) => sum + cat.items.length, 0);

  const saveMoodNote = () => {
    if (!moodNote.trim()) return;
    const newNote = { date: new Date().toISOString().split("T")[0], note: moodNote.trim() };
    const updated = [newNote, ...moodNotes].slice(0, 50);
    setMoodNotes(updated);
    localStorage.setItem("psych_notes", JSON.stringify(updated));
    setMoodNote("");
    showNotification("Journal entry saved", "success");
  };

  const exportReport = () => {
    const reportDate = formatDate(new Date().toISOString());
    const timeFilterLabel = timeFilter === "all" ? "All Time" : timeFilter === "week" ? "Past 7 Days" : timeFilter === "month" ? "Past 30 Days" : "Past 90 Days";

    const reportContent = `================================================================================
                    TRADING PSYCHOLOGY & BEHAVIORAL ANALYSIS REPORT
                               TradeVault Analytics
================================================================================

GENERATED: ${reportDate}
REPORTING PERIOD: ${timeFilterLabel}
TOTAL TRADES ANALYZED: ${trades.length}
TRADES WITH EMOTIONAL DATA: ${tradesWithEmotions.length} (${emotionCoverage}% coverage)

================================================================================
SECTION 1: EXECUTIVE SUMMARY
================================================================================

Emotional Control Score: ${emotionalScore}/100
  ${emotionalScore >= 70 ? "Assessment: Strong emotional discipline demonstrated. Trading decisions appear well-regulated." :
    emotionalScore >= 40 ? "Assessment: Moderate emotional control. Some improvement opportunities identified." :
    "Assessment: Significant emotional control challenges detected. Structured intervention recommended."}

Behavioral Patterns Detected: ${behavioralPatterns.length}
  ${behavioralPatterns.length === 0 ? "No negative behavioral patterns identified during this period." :
    behavioralPatterns.filter(p => p.severity === "high").length > 0 ? "High-severity patterns require immediate attention." :
    "Patterns identified are manageable with consistent effort."}

================================================================================
SECTION 2: EMOTIONAL STATE BREAKDOWN
================================================================================

${emotionStats.length > 0 ? emotionStats.map((e, i) => 
`${i + 1}. ${e.emotion} ${e.emoji}
   Occurrences: ${e.count} trades
   Win Rate: ${e.winRate}%
   Total Profit/Loss: $${e.totalPnL.toFixed(2)}
   Average P&L per Trade: $${e.avgPnL.toFixed(2)}
   Risk/Reward Ratio: ${e.riskRewardRatio.toFixed(2)}`
).join("\n\n") : "No emotional data recorded during this period."}

================================================================================
SECTION 3: BEHAVIORAL PATTERN ANALYSIS
================================================================================

${behavioralPatterns.length > 0 ? behavioralPatterns.map((p, i) =>
`PATTERN ${i + 1}: ${p.label}
Severity Level: ${p.severity.toUpperCase()}
Occurrences: ${p.occurrences}
Description: ${p.description}
Recommendation: ${p.recommendation}`
).join("\n\n") : "No significant behavioral patterns detected. Trading discipline appears satisfactory."}

================================================================================
SECTION 4: TRADING SESSION PERFORMANCE
================================================================================

${sessionAnalysis.length > 0 ? sessionAnalysis.map((s) =>
`${s.session}
  Total Trades: ${s.trades}
  Win Rate: ${s.winRate}%
  Net Profit/Loss: $${s.totalPnL.toFixed(2)}
  Emotional Stability Score: ${s.avgEmotionScore}/100`
).join("\n\n") : "Insufficient session data available for analysis."}

================================================================================
SECTION 5: WEEKLY PSYCHOLOGICAL TREND
================================================================================

${reportsWithTrend.length > 0 ? reportsWithTrend.map((r) =>
`Week Beginning ${r.weekStart}:
  Trades: ${r.trades} | Win Rate: ${r.winRate}% | P&L: $${r.pnl.toFixed(2)}
  Dominant Emotional State: ${r.dominantEmotion}
  Emotional Score: ${r.emotionalScore}/100 | Trend: ${r.improvement}`
).join("\n\n") : "Insufficient weekly data available for trend analysis."}

================================================================================
SECTION 6: ACTIVE GOALS & PROGRESS
================================================================================

${goals.length > 0 ? goals.map((g) =>
`Goal: ${g.title}
  Target: ${g.target}${g.unit} | Current Progress: ${g.current}${g.unit}
  Status: ${g.completed ? "COMPLETED" : "IN PROGRESS"}
  Deadline: ${g.deadline || "No deadline specified"}`
).join("\n\n") : "No active goals. Consider setting measurable psychology goals to track improvement."}

================================================================================
SECTION 7: PRE-TRADE CHECKLIST STATUS
================================================================================

Checklist Completion: ${checklistProgress}/${checklistTotal} items verified (${Math.round((checklistProgress/checklistTotal)*100)}%)

${PRE_TRADE_CHECKLIST.map(cat => 
`${cat.label}:
${cat.items.map(item => `  [${checklistItems[item] ? '✓' : ' '}] ${item}`).join("\n")}`
).join("\n\n")}

================================================================================
                        END OF PSYCHOLOGY REPORT
         Generated by TradeVault — Professional Trading Analytics
================================================================================
`;

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TradeVault_Psychology_Report_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Professional report downloaded successfully", "success");
  };

  // ═════════════════════════════════════════════════════════
  // RENDER: Loading State
  // ═════════════════════════════════════════════════════════
  if (loading) {
    return <AppLoader message="Analyzing Trading Psychology" />;
  }

  // ═════════════════════════════════════════════════════════
  // RENDER: Main Content
  // ═════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />

      <section className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Notification Toast */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl font-semibold shadow-2xl transition-all duration-300 ${
            notification.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">Trading Psychology</h1>
              <p className="text-zinc-400 text-sm md:text-base font-light">Behavioral Analytics & Emotional Intelligence Suite</p>
            </div>
            <button onClick={exportReport} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 w-fit border border-zinc-700 hover:border-zinc-500">
              <span className="text-lg">📥</span> Export Professional Report
            </button>
          </div>

          {/* Daily Quote */}
          <div className="bg-gradient-to-r from-purple-950/40 via-blue-950/40 to-purple-950/40 border border-purple-500/20 rounded-2xl p-5 mb-6 backdrop-blur-sm">
            <p className="text-purple-300 italic text-base md:text-lg font-light leading-relaxed">&ldquo;{dailyQuote.quote}&rdquo;</p>
            <p className="text-purple-400/60 text-sm mt-2 font-medium">— {dailyQuote.author}</p>
          </div>
        </div>

        {/* TIME FILTER BUTTONS */}
        <div className="mb-8">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3 font-semibold">Reporting Period</p>
          <div className="flex gap-3 flex-wrap">
            {[
              { key: "all", label: "All Time", icon: "📅" },
              { key: "week", label: "This Week", icon: "📆" },
              { key: "month", label: "This Month", icon: "📊" },
              { key: "quarter", label: "This Quarter", icon: "📈" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setTimeFilter(filter.key as typeof timeFilter)}
                className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                  timeFilter === filter.key
                    ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-105"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800 hover:border-zinc-600"
                }`}
              >
                <span>{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex gap-1 md:gap-2 mb-8 border-b border-zinc-800 overflow-x-auto pb-1">
          {[
            { key: "overview", label: "Overview", icon: "📊" },
            { key: "emotions", label: "Emotions", icon: "🎭" },
            { key: "patterns", label: "Patterns", icon: "🔍" },
            { key: "sessions", label: "Sessions", icon: "⏰" },
            { key: "checklist", label: "Checklist", icon: "✅" },
            { key: "goals", label: "Goals", icon: "🎯" },
            { key: "report", label: "Report", icon: "📋" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`pb-3 px-3 md:px-4 font-semibold transition-all duration-200 whitespace-nowrap text-sm flex items-center gap-1.5 ${
                activeTab === tab.key ? "text-yellow-500 border-b-2 border-yellow-500" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span className="hidden sm:inline">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: "Emotional Score", value: `${emotionalScore}/100`, color: emotionalScore >= 70 ? "text-emerald-400" : emotionalScore >= 40 ? "text-amber-400" : "text-red-400", bg: emotionalScore >= 70 ? "bg-emerald-500/10 border-emerald-500/20" : emotionalScore >= 40 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20", sub: emotionalScore >= 70 ? "Strong Control" : emotionalScore >= 40 ? "Moderate Control" : "Needs Attention" },
                { label: "Emotions Tracked", value: tradesWithEmotions.length.toString(), color: "text-white", bg: "bg-blue-500/10 border-blue-500/20", sub: `${emotionCoverage}% Coverage` },
                { label: "Patterns Detected", value: behavioralPatterns.length.toString(), color: behavioralPatterns.length > 0 ? "text-amber-400" : "text-emerald-400", bg: behavioralPatterns.length > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20", sub: behavioralPatterns.length > 0 ? "Review Required" : "All Clear" },
                { label: "Best Performance State", value: emotionStats[0]?.emotion || "N/A", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", sub: emotionStats[0] ? `${emotionStats[0].winRate}% Win Rate` : "No Data" },
              ].map((card, i) => (
                <div key={i} className={`${card.bg} p-4 md:p-5 rounded-2xl border text-center hover:scale-[1.02] transition-transform duration-200`}>
                  <p className={`text-2xl md:text-3xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-zinc-400 text-xs mt-1.5 font-medium">{card.label}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Emotional Balance Bar */}
            <div className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-semibold mb-4 text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span>Emotional Balance Index</h3>
              <div className="w-full bg-zinc-800 rounded-full h-6 overflow-hidden relative">
                <div className={`h-full rounded-full transition-all duration-700 ease-out ${emotionalScore >= 70 ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : emotionalScore >= 40 ? "bg-gradient-to-r from-amber-600 to-amber-400" : "bg-gradient-to-r from-red-600 to-red-400"}`} style={{ width: `${emotionalScore}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">{emotionalScore}/100</span>
              </div>
              <div className="flex justify-between mt-3 text-xs text-zinc-500 font-medium">
                <span>0 — Poor Control</span><span>50 — Neutral</span><span>100 — Excellent Control</span>
              </div>
            </div>

            {/* Behavioral Alerts */}
            {behavioralPatterns.filter(p => p.severity === "high").length > 0 && (
              <div className="bg-red-950/20 border border-red-500/20 p-5 rounded-2xl">
                <h3 className="font-semibold text-red-400 mb-3 text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>Critical Behavioral Alerts</h3>
                <div className="space-y-2">
                  {behavioralPatterns.filter(p => p.severity === "high").map((p, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-red-900/10 border border-red-800/30 rounded-xl">
                      <span className="text-xl flex-shrink-0">{p.icon}</span>
                      <div className="min-w-0"><p className="font-semibold text-red-400 text-sm">{p.label}</p><p className="text-zinc-400 text-xs mt-0.5 line-clamp-2">{p.description}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Daily Moods */}
            {dailyMoods.length > 0 && (
              <div className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800">
                <h3 className="font-semibold mb-4 text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Recent Trading Day Analysis</h3>
                <div className="space-y-2">
                  {dailyMoods.slice(0, 5).map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-xl flex-wrap gap-2 hover:bg-zinc-800/60 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-zinc-500 text-xs font-medium whitespace-nowrap">{day.date} <span className="text-zinc-600">({day.dayName.slice(0, 3)})</span></span>
                        <span className="text-xl flex-shrink-0">{day.emotionEmoji}</span>
                        <span className="text-xs text-zinc-300 font-medium truncate">{day.dominantEmotion}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-zinc-500">{day.tradeCount} trades</span>
                        <span className={`text-xs font-semibold ${day.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>{day.winRate}% win</span>
                        <span className={`text-sm font-bold ${day.dayPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>{day.dayPnL >= 0 ? "+" : ""}${day.dayPnL.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mood Journal */}
            <div className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-violet-500"></span>Trading Psychology Journal</h3>
              <div className="flex gap-2">
                <input type="text" value={moodNote} onChange={(e) => setMoodNote(e.target.value)} placeholder="Document your current trading mindset or emotional state..." className="flex-1 p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none text-sm placeholder:text-zinc-500 transition-colors" onKeyDown={(e) => e.key === "Enter" && saveMoodNote()} />
                <button onClick={saveMoodNote} className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex-shrink-0">Save Entry</button>
              </div>
              {moodNotes.length > 0 && (
                <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto">
                  {moodNotes.slice(0, 3).map((note, i) => (
                    <p key={i} className="text-xs text-zinc-400 bg-zinc-800/50 p-2.5 rounded-lg leading-relaxed"><span className="text-zinc-500 font-medium">{note.date}:</span> {note.note}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ EMOTIONS TAB ═══════════════ */}
        {activeTab === "emotions" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {emotionStats.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800">
                <p className="text-6xl mb-6">🎭</p>
                <p className="text-zinc-300 text-lg font-semibold mb-2">No Emotional Data Available</p>
                <p className="text-zinc-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">Begin logging your emotional state with each trade to unlock comprehensive behavioral analytics and performance correlations.</p>
                <a href="/trades" className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 inline-block">Start Journaling Trades →</a>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    const best = emotionStats.filter(e => e.count >= 2).sort((a, b) => b.winRate - a.winRate)[0];
                    const worst = emotionStats.filter(e => e.count >= 2).sort((a, b) => a.winRate - b.winRate)[0];
                    return (
                      <>
                        {best && (
                          <div className="bg-emerald-950/20 border border-emerald-500/20 p-5 md:p-6 rounded-2xl">
                            <p className="text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-3">Optimal Performance State</p>
                            <p className="text-4xl mb-2">{best.emoji}</p>
                            <p className="text-xl font-bold text-white mb-1">{best.emotion}</p>
                            <p className="text-emerald-400 text-2xl font-bold">{best.winRate}% Win Rate</p>
                            <p className="text-zinc-400 text-sm mt-1">${best.totalPnL.toFixed(2)} Total Profit & Loss</p>
                          </div>
                        )}
                        {worst && (
                          <div className="bg-red-950/20 border border-red-500/20 p-5 md:p-6 rounded-2xl">
                            <p className="text-red-400 font-semibold text-xs uppercase tracking-wider mb-3">Challenging Performance State</p>
                            <p className="text-4xl mb-2">{worst.emoji}</p>
                            <p className="text-xl font-bold text-white mb-1">{worst.emotion}</p>
                            <p className="text-red-400 text-2xl font-bold">{worst.winRate}% Win Rate</p>
                            <p className="text-zinc-400 text-sm mt-1">${worst.totalPnL.toFixed(2)} Total Profit & Loss</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[750px]">
                      <div className="grid grid-cols-8 gap-3 p-4 border-b border-zinc-800 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                        <div>Emotional State</div><div className="text-center">Frequency</div><div className="text-center">Wins</div><div className="text-center">Losses</div><div className="text-center">Win Rate</div><div className="text-center">Total P&L</div><div className="text-center">Avg P&L</div><div className="text-center">Risk/Reward</div>
                      </div>
                      {emotionStats.map((e) => (
                        <div key={e.emotion} className="grid grid-cols-8 gap-3 p-3.5 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors text-sm">
                          <div className="flex items-center gap-2.5 min-w-0"><span className="text-lg flex-shrink-0">{e.emoji}</span><span className="font-medium text-white truncate">{e.emotion}</span></div>
                          <div className="text-center text-zinc-300 font-medium">{e.count}</div>
                          <div className="text-center text-emerald-400 font-medium">{e.wins}</div>
                          <div className="text-center text-red-400 font-medium">{e.losses}</div>
                          <div className={`text-center font-bold ${e.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>{e.winRate}%</div>
                          <div className={`text-center font-bold ${e.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>${e.totalPnL.toFixed(2)}</div>
                          <div className={`text-center font-medium ${e.avgPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>${e.avgPnL.toFixed(2)}</div>
                          <div className={`text-center font-medium ${e.riskRewardRatio >= 0 ? "text-emerald-400" : "text-red-400"}`}>{e.riskRewardRatio.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800">
                  <h3 className="font-semibold mb-5 text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-violet-500"></span>Emotional State Distribution</h3>
                  <div className="space-y-3">
                    {emotionStats.slice(0, 8).map((e) => (
                      <div key={e.emotion} className="flex items-center gap-3">
                        <span className="text-lg w-8 flex-shrink-0">{e.emoji}</span>
                        <span className="text-xs text-zinc-400 w-20 truncate font-medium">{e.emotion}</span>
                        <div className="flex-1 bg-zinc-800 rounded-full h-4 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${e.winRate >= 60 ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : e.winRate >= 40 ? "bg-gradient-to-r from-amber-600 to-amber-400" : "bg-gradient-to-r from-red-600 to-red-400"}`} style={{ width: `${Math.max((e.count / emotionStats[0]?.count) * 100, 8)}%` }} />
                        </div>
                        <span className="text-xs text-zinc-500 w-10 text-right font-medium">{e.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════ PATTERNS TAB ═══════════════ */}
        {activeTab === "patterns" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {behavioralPatterns.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800">
                <p className="text-6xl mb-6">🎉</p>
                <p className="text-emerald-400 text-lg font-bold mb-2">No Negative Behavioral Patterns Detected</p>
                <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">Your trading psychology appears well-regulated during this period. Continue maintaining disciplined practices.</p>
              </div>
            ) : (
              <>
                {behavioralPatterns.map((pattern, idx) => (
                  <div key={idx} className={`p-5 md:p-6 rounded-2xl border transition-all duration-200 ${pattern.severity === "high" ? "bg-red-950/20 border-red-500/20 hover:border-red-500/40" : pattern.severity === "medium" ? "bg-amber-950/20 border-amber-500/20 hover:border-amber-500/40" : "bg-blue-950/20 border-blue-500/20 hover:border-blue-500/40"}`}>
                    <div className="flex items-start gap-4">
                      <span className="text-3xl flex-shrink-0">{pattern.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className={`font-bold text-base ${pattern.severity === "high" ? "text-red-400" : pattern.severity === "medium" ? "text-amber-400" : "text-blue-400"}`}>{pattern.label}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${pattern.severity === "high" ? "bg-red-900/50 text-red-400" : pattern.severity === "medium" ? "bg-amber-900/50 text-amber-400" : "bg-blue-900/50 text-blue-400"}`}>{pattern.severity} Severity</span>
                        </div>
                        <p className="text-zinc-300 text-sm leading-relaxed mb-3">{pattern.description}</p>
                        <p className="text-xs text-zinc-500 mb-3 font-medium">Occurrences Recorded: <span className="text-white">{pattern.occurrences}</span></p>
                        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                          <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Recommended Action</p>
                          <p className="text-zinc-300 text-sm leading-relaxed">{pattern.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bg-blue-950/20 border border-blue-500/20 p-5 rounded-2xl text-center">
                  <p className="text-blue-400 font-semibold mb-2">Request Deeper Analysis</p>
                  <p className="text-zinc-400 text-sm">Use the AI Coach (bottom right) and ask: &ldquo;Analyze my behavioral patterns and provide a structured improvement plan&rdquo;</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════ SESSIONS TAB ═══════════════ */}
        {activeTab === "sessions" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {sessionAnalysis.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800">
                <p className="text-6xl mb-6">⏰</p>
                <p className="text-zinc-300 text-lg font-semibold mb-2">Insufficient Session Data</p>
                <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">Additional trades with emotional data are required to perform meaningful trading session analysis.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessionAnalysis.map((session) => {
                    const isBest = session.totalPnL === Math.max(...sessionAnalysis.map(s => s.totalPnL)) && session.totalPnL > 0;
                    return (
                      <div key={session.session} className={`p-5 md:p-6 rounded-2xl border transition-all duration-200 ${isBest ? "bg-emerald-950/20 border-emerald-500/30" : session.totalPnL >= 0 ? "bg-zinc-900 border-zinc-800" : "bg-red-950/10 border-red-500/20"}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-sm">{session.session}</h3>
                          {isBest && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Optimal Session</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><p className="text-zinc-500 text-xs mb-1">Total Trades</p><p className="text-xl font-bold">{session.trades}</p></div>
                          <div><p className="text-zinc-500 text-xs mb-1">Win Rate</p><p className={`text-xl font-bold ${session.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>{session.winRate}%</p></div>
                          <div><p className="text-zinc-500 text-xs mb-1">Net P&L</p><p className={`text-xl font-bold ${session.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>${session.totalPnL.toFixed(2)}</p></div>
                          <div><p className="text-zinc-500 text-xs mb-1">Emotional Stability</p><p className={`text-xl font-bold ${session.avgEmotionScore >= 60 ? "text-emerald-400" : session.avgEmotionScore >= 40 ? "text-amber-400" : "text-red-400"}`}>{session.avgEmotionScore}/100</p></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const best = [...sessionAnalysis].sort((a, b) => b.totalPnL - a.totalPnL)[0];
                  const worst = [...sessionAnalysis].sort((a, b) => a.totalPnL - b.totalPnL)[0];
                  return (
                    <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                      <h3 className="font-semibold mb-3 text-sm">Session Optimization Insights</h3>
                      {best && <p className="text-emerald-400 text-sm mb-2 leading-relaxed">Your performance peaks during <span className="font-bold">{best.session}</span> with ${best.totalPnL.toFixed(2)} net profit and a {best.winRate}% win rate. Consider allocating higher conviction trades to this window.</p>}
                      {worst && worst.session !== best?.session && <p className="text-red-400 text-sm leading-relaxed">Performance declines during <span className="font-bold">{worst.session}</span> with ${worst.totalPnL.toFixed(2)} net result. Evaluate whether reducing position size or avoiding trading during this period would improve overall outcomes.</p>}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ═══════════════ CHECKLIST TAB ═══════════════ */}
        {activeTab === "checklist" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800 text-center">
              <p className="text-5xl mb-3">✅</p>
              <p className="text-zinc-400 text-sm mb-1 font-medium">Pre-Trade Readiness Assessment</p>
              <p className="text-3xl font-bold text-yellow-400">{checklistProgress}/{checklistTotal}</p>
              <div className="w-full bg-zinc-800 rounded-full h-3 mt-4 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(checklistProgress / checklistTotal) * 100}%` }} />
              </div>
              <p className="text-xs text-zinc-500 mt-2">{Math.round((checklistProgress / checklistTotal) * 100)}% Complete</p>
              <button onClick={resetChecklist} className="text-xs text-zinc-500 hover:text-zinc-300 mt-3 transition-colors underline underline-offset-2">Reset All Items</button>
            </div>
            {PRE_TRADE_CHECKLIST.map((category) => (
              <div key={category.id} className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800">
                <h3 className="font-semibold mb-4 text-sm flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${category.id === "mental" ? "bg-purple-500" : category.id === "technical" ? "bg-blue-500" : "bg-emerald-500"}`}></span>{category.label}</h3>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <label key={item} className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-200 ${checklistItems[item] ? "bg-emerald-950/20 border border-emerald-500/30" : "bg-zinc-800/50 border border-transparent hover:bg-zinc-800 hover:border-zinc-700"}`}>
                      <input type="checkbox" checked={!!checklistItems[item]} onChange={() => toggleChecklistItem(item)} className="w-5 h-5 rounded accent-yellow-500 cursor-pointer flex-shrink-0" />
                      <span className={`text-sm leading-relaxed ${checklistItems[item] ? "text-emerald-400 line-through decoration-emerald-500/50" : "text-zinc-300"}`}>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════ GOALS TAB ═══════════════ */}
        {activeTab === "goals" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Psychology Development Goals</h2>
              <button onClick={() => setShowGoalForm(!showGoalForm)} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${showGoalForm ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-yellow-500 hover:bg-yellow-400 text-black"}`}>{showGoalForm ? "✕ Cancel" : "+ Create Goal"}</button>
            </div>
            {showGoalForm && (
              <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3">
                <input type="text" placeholder="Goal Title (e.g., Eliminate Revenge Trading)" value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none text-sm placeholder:text-zinc-500 transition-colors" />
                <div className="flex gap-3">
                  <input type="number" placeholder="Target Value" value={newGoal.target || ""} onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) || 0 })} className="flex-1 p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none text-sm placeholder:text-zinc-500 transition-colors" />
                  <select value={newGoal.unit} onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })} className="p-3 bg-zinc-800 rounded-xl border border-zinc-700 text-sm font-medium"><option value="%">Percentage</option><option value="days">Days</option><option value="trades">Trades</option><option value="$">Dollars</option></select>
                </div>
                <input type="date" value={newGoal.deadline} onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })} className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none text-sm text-zinc-300 transition-colors" />
                <button onClick={addGoal} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-200">Create Psychology Goal</button>
              </div>
            )}
            {goals.length === 0 && !showGoalForm ? (
              <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800">
                <p className="text-5xl mb-4">🎯</p>
                <p className="text-zinc-300 font-semibold mb-2">No Goals Established</p>
                <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">Setting measurable psychology goals provides structure and accountability for your trading discipline journey.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <div key={goal.id} className={`p-5 rounded-2xl border transition-all duration-200 ${goal.completed ? "bg-emerald-950/20 border-emerald-500/30" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className={`font-bold ${goal.completed ? "text-emerald-400 line-through decoration-emerald-500/50" : "text-white"}`}>{goal.title}</h3>
                        <p className="text-xs text-zinc-500 mt-1">Target: {goal.target}{goal.unit}{goal.deadline ? ` • Deadline: ${formatDate(goal.deadline)}` : ""}</p>
                      </div>
                      <button onClick={() => deleteGoal(goal.id)} className="text-zinc-600 hover:text-red-400 transition-colors text-sm flex-shrink-0" title="Delete Goal">🗑️</button>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden mb-2">
                      <div className={`h-full rounded-full transition-all duration-500 ${goal.completed ? "bg-emerald-500" : "bg-yellow-500"}`} style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500 font-medium">Progress: {goal.current}/{goal.target}{goal.unit} ({Math.round((goal.current / goal.target) * 100)}%)</span>
                      {!goal.completed && (
                        <div className="flex gap-1.5">
                          <button onClick={() => updateGoalProgress(goal.id, 1)} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg transition-colors font-medium">+1</button>
                          <button onClick={() => updateGoalProgress(goal.id, 5)} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg transition-colors font-medium">+5</button>
                        </div>
                      )}
                    </div>
                    {goal.completed && <p className="text-emerald-400 text-xs mt-3 font-bold uppercase tracking-wider">Goal Successfully Achieved</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ REPORT TAB ═══════════════ */}
        {activeTab === "report" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-semibold mb-4 text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Weekly Psychological Performance Summary</h3>
              {reportsWithTrend.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-8">Insufficient data available for the selected reporting period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[650px]">
                    <div className="grid grid-cols-7 gap-3 p-3 border-b border-zinc-800 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                      <div>Week Beginning</div><div className="text-center">Trades</div><div className="text-center">Win Rate</div><div className="text-center">Net P&L</div><div className="text-center">Dominant Emotion</div><div className="text-center">Emotional Score</div><div className="text-center">Trend</div>
                    </div>
                    {reportsWithTrend.map((report, idx) => (
                      <div key={idx} className="grid grid-cols-7 gap-3 p-3 border-b border-zinc-800/50 text-sm hover:bg-zinc-800/30 transition-colors">
                        <div className="text-zinc-400 font-medium">{report.weekStart}</div>
                        <div className="text-center text-zinc-300">{report.trades}</div>
                        <div className={`text-center font-semibold ${report.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>{report.winRate}%</div>
                        <div className={`text-center font-bold ${report.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{report.pnl >= 0 ? "+" : ""}${report.pnl.toFixed(2)}</div>
                        <div className="text-center text-zinc-300">{report.dominantEmotion}</div>
                        <div className={`text-center font-semibold ${report.emotionalScore >= 60 ? "text-emerald-400" : "text-amber-400"}`}>{report.emotionalScore}/100</div>
                        <div className={`text-center font-bold ${report.improvement.includes("↑") ? "text-emerald-400" : report.improvement.includes("↓") ? "text-red-400" : "text-zinc-500"}`}>{report.improvement}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="text-center pb-8">
              <button onClick={exportReport} className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 inline-flex items-center gap-2 shadow-lg shadow-yellow-500/20">
                <span className="text-lg">📥</span> Download Comprehensive Psychology Report
              </button>
              <p className="text-xs text-zinc-500 mt-3 font-light">Professional plain-text format — compatible with all analysis platforms</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {trades.length === 0 && (
          <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800 mt-6">
            <p className="text-6xl mb-6">🧠</p>
            <p className="text-zinc-300 text-lg font-semibold mb-2">Begin Your Psychology Journey</p>
            <p className="text-zinc-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">Start logging trades with emotional context to unlock the complete Trading Psychology Suite including behavioral pattern detection, session analysis, and personalized improvement recommendations.</p>
            <a href="/trades" className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 inline-block shadow-lg shadow-yellow-500/20">Start Journaling Trades →</a>
          </div>
        )}
      </section>

      <AIAssistant />
    </main>
  );
}