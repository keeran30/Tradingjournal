"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import AIAssistant from "../components/AIAssistant";
import { supabase } from "../lib/supabase";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

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
  bestDay: string;
  worstDay: string;
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
  type: "revenge_trading" | "overtrading" | "hesitation" | "overconfidence" | "tilting";
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

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

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
  { quote: "It's not whether you're right or wrong that's important, but how much money you make when you're right and how much you lose when you're wrong.", author: "George Soros" },
  { quote: "The goal of a successful trader is to make the best trades. Money is secondary.", author: "Alexander Elder" },
  { quote: "Trading is 80% psychological and 20% methodological.", author: "Mark Douglas" },
  { quote: "Losers average losers.", author: "Paul Tudor Jones" },
  { quote: "The market does not beat them. They beat themselves.", author: "Jesse Livermore" },
  { quote: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { quote: "The most important quality for an investor is temperament, not intellect.", author: "Warren Buffett" },
  { quote: "In trading, you have to be defensive and aggressive at the same time. If you are not aggressive, you are not going to make money, and if you are not defensive, you are not going to keep it.", author: "Ray Dalio" },
  { quote: "The best traders have no ego. You have to swallow your pride and get out of the losses.", author: "Tom Baldwin" },
  { quote: "Successful trading is about finding a few good setups and exploiting them. It's not about being right all the time.", author: "Paul Tudor Jones" },
];

const DISCIPLINE_EXERCISES = [
  {
    title: "Pre-Trade Meditation",
    duration: "5 min",
    description: "Close your eyes, take 10 deep breaths, and visualize your trading plan before opening any positions.",
    frequency: "Before every session",
    difficulty: "Easy",
    icon: "🧘",
  },
  {
    title: "Emotion Journaling",
    duration: "3 min",
    description: "After each trade, write one sentence about how you felt and whether it affected your decision.",
    frequency: "After every trade",
    difficulty: "Easy",
    icon: "📝",
  },
  {
    title: "The 15-Minute Rule",
    duration: "15 min",
    description: "After a loss, step away from your screen for 15 minutes. No charts, no analysis, just reset.",
    frequency: "After losses",
    difficulty: "Medium",
    icon: "⏰",
  },
  {
    title: "Daily Loss Limit",
    duration: "Instant",
    description: "Set a maximum daily loss amount. When hit, stop trading immediately regardless of how you feel.",
    frequency: "Daily",
    difficulty: "Hard",
    icon: "🛑",
  },
  {
    title: "Weekly Review Ritual",
    duration: "30 min",
    description: "Every weekend, review all your trades. Categorize them by emotion and identify patterns.",
    frequency: "Weekly",
    difficulty: "Medium",
    icon: "📊",
  },
  {
    title: "Gratitude Practice",
    duration: "2 min",
    description: "Before trading, name 3 things you're grateful for. This shifts your mindset from scarcity to abundance.",
    frequency: "Daily",
    difficulty: "Easy",
    icon: "🙏",
  },
  {
    title: "Position Sizing Discipline",
    duration: "Ongoing",
    description: "Never risk more than 1-2% of your account on any single trade. Use a position size calculator.",
    frequency: "Every trade",
    difficulty: "Hard",
    icon: "📏",
  },
  {
    title: "Victory Log",
    duration: "5 min",
    description: "At day's end, write down 3 things you did well, regardless of P&L. Celebrate process over outcome.",
    frequency: "Daily",
    difficulty: "Easy",
    icon: "🏆",
  },
];

const PRE_TRADE_CHECKLIST = [
  { id: "mental", label: "Mental State", items: [
    "I am calm and not emotionally charged",
    "I have no distractions around me",
    "I am well-rested and alert",
    "I am not thinking about previous losses",
  ]},
  { id: "technical", label: "Technical Check", items: [
    "I have identified clear entry and exit levels",
    "My stop loss is placed",
    "My take profit target is set",
    "I have checked for upcoming news events",
  ]},
  { id: "risk", label: "Risk Management", items: [
    "My position size is within 1-2% risk",
    "I am not exceeding my daily loss limit",
    "I have a plan for if the trade goes against me",
    "This trade fits my overall strategy",
  ]},
];

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function PsychologyPageClient() {
  // ─── State ──────────────────────────────────────────
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
  const [dailyQuote, setDailyQuote] = useState(getRandomQuote());

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ─── Load Data ──────────────────────────────────────
  useEffect(() => {
    const savedChecklist = localStorage.getItem("psych_checklist");
    if (savedChecklist) setChecklistItems(JSON.parse(savedChecklist));

    const savedGoals = localStorage.getItem("psych_goals");
    if (savedGoals) setGoals(JSON.parse(savedGoals));

    const savedNotes = localStorage.getItem("psych_notes");
    if (savedNotes) setMoodNotes(JSON.parse(savedNotes));
  }, []);

  // ─── Fetch Trades ───────────────────────────────────
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

  // ═════════════════════════════════════════════════════
  // COMPUTED DATA
  // ═════════════════════════════════════════════════════

  const tradesWithEmotions = useMemo(() => trades.filter((t) => t.emotion), [trades]);
  const emotionCoverage = trades.length > 0 ? Math.round((tradesWithEmotions.length / trades.length) * 100) : 0;

  // Emotion Stats
  const emotionStats = useMemo((): EmotionStats[] => {
    const map: Record<string, { count: number; wins: number; losses: number; totalPnL: number; days: string[]; totalRiskReward: number }> = {};
    tradesWithEmotions.forEach((t) => {
      if (!map[t.emotion!]) map[t.emotion!] = { count: 0, wins: 0, losses: 0, totalPnL: 0, days: [], totalRiskReward: 0 };
      map[t.emotion!].count++;
      if (t.pnl > 0) map[t.emotion!].wins++;
      else map[t.emotion!].losses++;
      map[t.emotion!].totalPnL += t.pnl || 0;
      map[t.emotion!].days.push(t.created_at?.split("T")[0] || "");
      const risk = (t.entry - t.close_price) * t.size;
      if (risk !== 0) map[t.emotion!].totalRiskReward += (t.pnl || 0) / Math.abs(risk);
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
        bestDay: data.days.sort()[0] || "N/A",
        worstDay: data.days.sort().reverse()[0] || "N/A",
        riskRewardRatio: data.totalRiskReward / data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [tradesWithEmotions]);

  // Emotional Score
  const emotionalScore = useMemo(() => {
    if (tradesWithEmotions.length === 0) return 50;
    let positive = 0, negative = 0;
    tradesWithEmotions.forEach((t) => {
      if (getEmotionCategory(t.emotion!) === "positive") positive++;
      else if (getEmotionCategory(t.emotion!) === "negative") negative++;
    });
    return Math.round((positive / (positive + negative || 1)) * 100);
  }, [tradesWithEmotions]);

  // Daily Moods
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

  // Behavioral Patterns
  const behavioralPatterns = useMemo((): BehavioralPattern[] => {
    const patterns: BehavioralPattern[] = [];
    if (trades.length === 0) return patterns;

    // Revenge Trading: 3+ trades in a day after a loss with negative emotions
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
        label: "Revenge Trading",
        description: `Detected on ${revengeDays} day(s). You tend to trade more after losses with negative emotions.`,
        severity: revengeDays > 3 ? "high" : revengeDays > 1 ? "medium" : "low",
        occurrences: revengeDays,
        icon: "😡",
        recommendation: "Set a strict daily loss limit and step away for 15 minutes after any loss.",
      });
    }

    // Overtrading: 5+ trades in a single day
    let overtradingDays = 0;
    Object.values(byDay).forEach((dayTrades) => {
      if (dayTrades.length >= 5) overtradingDays++;
    });
    if (overtradingDays > 0) {
      patterns.push({
        type: "overtrading",
        label: "Overtrading",
        description: `You traded 5+ times on ${overtradingDays} day(s). Quality over quantity matters.`,
        severity: overtradingDays > 5 ? "high" : "medium",
        occurrences: overtradingDays,
        icon: "📈",
        recommendation: "Limit yourself to 3-5 high-quality setups per day maximum.",
      });
    }

    // Hesitation: Trades with "Hesitant" or "Unsure" emotion
    const hesitationTrades = tradesWithEmotions.filter((t) => 
      t.emotion?.includes("Hesitant") || t.emotion?.includes("Unsure")
    );
    if (hesitationTrades.length > 0) {
      const hesitationWinRate = Math.round((hesitationTrades.filter((t) => t.pnl > 0).length / hesitationTrades.length) * 100);
      patterns.push({
        type: "hesitation",
        label: "Hesitation Pattern",
        description: `${hesitationTrades.length} trades made with hesitation. Win rate: ${hesitationWinRate}%.`,
        severity: hesitationWinRate < 40 ? "high" : "medium",
        occurrences: hesitationTrades.length,
        icon: "🤔",
        recommendation: "When unsure, skip the trade. There will always be another opportunity.",
      });
    }

    // Overconfidence: High win rate followed by larger losses
    const overconfidentTrades = tradesWithEmotions.filter((t) => t.emotion?.includes("Overconfident"));
    if (overconfidentTrades.length > 0) {
      const avgLoss = overconfidentTrades.filter((t) => t.pnl < 0).reduce((s, t) => s + Math.abs(t.pnl), 0) / (overconfidentTrades.filter((t) => t.pnl < 0).length || 1);
      patterns.push({
        type: "overconfidence",
        label: "Overconfidence Risk",
        description: `${overconfidentTrades.length} overconfident trades. Average loss: $${avgLoss.toFixed(2)}.`,
        severity: avgLoss > 100 ? "high" : "medium",
        occurrences: overconfidentTrades.length,
        icon: "😎",
        recommendation: "After a big win, reduce position size by 50% for the next trade.",
      });
    }

    return patterns;
  }, [trades, tradesWithEmotions]);

  // Session Analysis
  const sessionAnalysis = useMemo((): SessionAnalysis[] => {
    const sessions: Record<string, Trade[]> = {
      "Morning (6AM-12PM)": [],
      "Afternoon (12PM-5PM)": [],
      "Evening (5PM-10PM)": [],
      "Late Night (10PM-6AM)": [],
    };
    tradesWithEmotions.forEach((t) => {
      const hour = new Date(t.created_at).getHours();
      if (hour >= 6 && hour < 12) sessions["Morning (6AM-12PM)"].push(t);
      else if (hour >= 12 && hour < 17) sessions["Afternoon (12PM-5PM)"].push(t);
      else if (hour >= 17 && hour < 22) sessions["Evening (5PM-10PM)"].push(t);
      else sessions["Late Night (10PM-6AM)"].push(t);
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

  // Weekly Report
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
        const dominant = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
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

  // Add improvement trend to weekly reports
  const reportsWithTrend = useMemo(() => {
    return weeklyReports.map((report, idx) => {
      if (idx < weeklyReports.length - 1) {
        const prev = weeklyReports[idx + 1];
        const improvement = report.emotionalScore - prev.emotionalScore;
        report.improvement = improvement > 0 ? `↑${improvement}%` : improvement < 0 ? `↓${Math.abs(improvement)}%` : "→0%";
      } else {
        report.improvement = "Baseline";
      }
      return report;
    });
  }, [weeklyReports]);

  // ─── Goal Functions ─────────────────────────────────
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
    showNotification("Goal added successfully!", "success");
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

  // ─── Checklist Functions ────────────────────────────
  const toggleChecklistItem = (item: string) => {
    const updated = { ...checklistItems, [item]: !checklistItems[item] };
    setChecklistItems(updated);
    localStorage.setItem("psych_checklist", JSON.stringify(updated));
  };

  const resetChecklist = () => {
    setChecklistItems({});
    localStorage.removeItem("psych_checklist");
  };

  const checklistProgress = Object.values(checklistItems).filter(Boolean).length;
  const checklistTotal = PRE_TRADE_CHECKLIST.reduce((sum, cat) => sum + cat.items.length, 0);

  // ─── Mood Notes ─────────────────────────────────────
  const saveMoodNote = () => {
    if (!moodNote.trim()) return;
    const newNote = { date: new Date().toISOString().split("T")[0], note: moodNote };
    const updated = [newNote, ...moodNotes].slice(0, 50);
    setMoodNotes(updated);
    localStorage.setItem("psych_notes", JSON.stringify(updated));
    setMoodNote("");
    showNotification("Mood note saved!", "success");
  };

  // ─── Export Report ──────────────────────────────────
  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      timeFilter,
      emotionalScore,
      emotionCoverage,
      totalTrades: trades.length,
      emotionStats,
      behavioralPatterns,
      sessionAnalysis,
      weeklyReports: reportsWithTrend,
      goals,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trading-psychology-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    showNotification("Report downloaded!", "success");
  };

  // ═════════════════════════════════════════════════════
  // RENDER: Loading
  // ═════════════════════════════════════════════════════
  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce text-6xl mb-6">🧠</div>
          <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse rounded-full" style={{ width: "60%" }} />
          </div>
          <p className="text-zinc-400 mt-4 text-lg">Analyzing your trading psychology...</p>
        </div>
      </main>
    );
  }

  // ═════════════════════════════════════════════════════
  // RENDER: Main
  // ═════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />

      <section className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* ─── Notification ──────────────────────────── */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl font-bold shadow-2xl transition-all animate-bounce ${
            notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}>
            {notification.message}
          </div>
        )}

        {/* ─── Header ────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-1">Trading Psychology</h1>
              <p className="text-zinc-400">Master your mindset. Improve your performance.</p>
            </div>
            <button
              onClick={exportReport}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 w-fit"
            >
              📥 Export Report
            </button>
          </div>
        </div>

        {/* ─── Quote ─────────────────────────────────── */}
        <div className="bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20 border border-purple-500/20 rounded-2xl p-5 mb-6">
          <p className="text-purple-300 italic text-base md:text-lg">
            💬 "{dailyQuote.quote}"
          </p>
          <p className="text-purple-400/60 text-sm mt-1">— {dailyQuote.author}</p>
        </div>

        {/* ─── Time Filter ───────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["all", "week", "month", "quarter"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                timeFilter === filter
                  ? "bg-yellow-500 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {filter === "all" ? "All Time" : filter === "week" ? "This Week" : filter === "month" ? "This Month" : "This Quarter"}
            </button>
          ))}
        </div>

        {/* ─── Tab Navigation ────────────────────────── */}
        <div className="flex gap-3 mb-8 border-b border-zinc-800 overflow-x-auto pb-1">
          {[
            { key: "overview", label: "📊 Overview" },
            { key: "emotions", label: "🎭 Emotions" },
            { key: "patterns", label: "🔍 Patterns" },
            { key: "sessions", label: "⏰ Sessions" },
            { key: "checklist", label: "✅ Checklist" },
            { key: "goals", label: "🎯 Goals" },
            { key: "report", label: "📋 Report" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`pb-3 px-3 font-bold transition whitespace-nowrap text-sm md:text-base ${
                activeTab === tab.key
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════
            OVERVIEW TAB
        ═══════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Score Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                {
                  label: "Emotional Score",
                  value: `${emotionalScore}/100`,
                  emoji: emotionalScore >= 70 ? "😊" : emotionalScore >= 40 ? "😐" : "😟",
                  color: emotionalScore >= 70 ? "text-green-400" : emotionalScore >= 40 ? "text-yellow-400" : "text-red-400",
                  sub: emotionalScore >= 70 ? "Strong control" : emotionalScore >= 40 ? "Moderate" : "Needs work",
                },
                {
                  label: "Emotions Tracked",
                  value: tradesWithEmotions.length.toString(),
                  emoji: "📝",
                  color: "text-white",
                  sub: `${emotionCoverage}% coverage`,
                },
                {
                  label: "Patterns Found",
                  value: behavioralPatterns.length.toString(),
                  emoji: "🔍",
                  color: behavioralPatterns.length > 0 ? "text-yellow-400" : "text-green-400",
                  sub: behavioralPatterns.length > 0 ? "Needs attention" : "All clear",
                },
                {
                  label: "Best Mindset",
                  value: emotionStats[0]?.emotion || "N/A",
                  emoji: emotionStats[0]?.emoji || "🤔",
                  color: "text-green-400",
                  sub: emotionStats[0] ? `${emotionStats[0].winRate}% win rate` : "",
                },
              ].map((card, i) => (
                <div key={i} className="bg-zinc-900 p-4 md:p-6 rounded-2xl border border-zinc-800 text-center hover:border-zinc-700 transition">
                  <p className="text-3xl md:text-4xl mb-2">{card.emoji}</p>
                  <p className="text-zinc-400 text-xs md:text-sm">{card.label}</p>
                  <p className={`text-xl md:text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                  {card.sub && <p className="text-xs text-zinc-500 mt-1">{card.sub}</p>}
                </div>
              ))}
            </div>

            {/* Emotional Balance Bar */}
            <div className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-bold mb-4 text-sm md:text-base">Emotional Balance</h3>
              <div className="w-full bg-zinc-800 rounded-full h-5 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    emotionalScore >= 70 ? "bg-gradient-to-r from-green-500 to-green-400" : 
                    emotionalScore >= 40 ? "bg-gradient-to-r from-yellow-500 to-yellow-400" : 
                    "bg-gradient-to-r from-red-500 to-red-400"
                  }`}
                  style={{ width: `${emotionalScore}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                  {emotionalScore}%
                </span>
              </div>
              <div className="flex justify-between mt-2 text-xs text-zinc-500">
                <span>Poor Control</span>
                <span>Neutral</span>
                <span>Excellent Control</span>
              </div>
            </div>

            {/* Quick Insights */}
            {behavioralPatterns.length > 0 && (
              <div className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800">
                <h3 className="font-bold mb-4 text-sm md:text-base">⚠️ Behavioral Alerts</h3>
                <div className="space-y-3">
                  {behavioralPatterns.filter(p => p.severity === "high").map((p, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-red-900/10 border border-red-800/30 rounded-xl">
                      <span className="text-2xl">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-red-400 text-sm">{p.label}</p>
                        <p className="text-zinc-400 text-xs mt-0.5">{p.description}</p>
                      </div>
                    </div>
                  ))}
                  {behavioralPatterns.filter(p => p.severity !== "high").slice(0, 2).map((p, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-yellow-900/10 border border-yellow-800/30 rounded-xl">
                      <span className="text-2xl">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-yellow-400 text-sm">{p.label}</p>
                        <p className="text-zinc-400 text-xs mt-0.5">{p.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Daily Moods */}
            {dailyMoods.length > 0 && (
              <div className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800">
                <h3 className="font-bold mb-4 text-sm md:text-base">📅 Recent Trading Days</h3>
                <div className="space-y-2">
                  {dailyMoods.slice(0, 5).map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-xl flex-wrap gap-2">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <span className="text-zinc-500 text-xs md:text-sm whitespace-nowrap">{day.date} ({day.dayName.slice(0,3)})</span>
                        <span className="text-xl md:text-2xl">{day.emotionEmoji}</span>
                        <span className="text-xs md:text-sm truncate">{day.dominantEmotion}</span>
                      </div>
                      <div className="flex items-center gap-3 md:gap-4">
                        <span className="text-xs text-zinc-500">{day.tradeCount} trades</span>
                        <span className="text-xs text-zinc-500">{day.winRate}% win</span>
                        <span className={`font-bold text-sm ${day.dayPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                          ${day.dayPnL.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mood Journal */}
            <div className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-bold mb-3 text-sm md:text-base">📝 Quick Mood Journal</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="How are you feeling about your trading today?"
                  className="flex-1 p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none text-sm"
                  onKeyDown={(e) => e.key === "Enter" && saveMoodNote()}
                />
                <button
                  onClick={saveMoodNote}
                  className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold hover:bg-yellow-400 transition text-sm"
                >
                  Save
                </button>
              </div>
              {moodNotes.length > 0 && (
                <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                  {moodNotes.slice(0, 3).map((note, i) => (
                    <p key={i} className="text-xs text-zinc-400 bg-zinc-800/50 p-2 rounded-lg">
                      <span className="text-zinc-500">{note.date}:</span> {note.note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            EMOTIONS TAB
        ═══════════════════════════════════════════════════ */}
        {activeTab === "emotions" && (
          <div className="space-y-6">
            {emotionStats.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800">
                <p className="text-6xl mb-4">🎭</p>
                <p className="text-zinc-400 text-lg mb-2">No emotions tracked yet</p>
                <p className="text-zinc-500 text-sm mb-4">Add emotions to your trades to unlock this analysis</p>
                <a href="/trades" className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition inline-block text-sm">
                  Go to Trading Journal →
                </a>
              </div>
            ) : (
              <>
                {/* Best/Worst Emotion Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    const best = emotionStats.filter(e => e.count >= 2).sort((a, b) => b.winRate - a.winRate)[0];
                    const worst = emotionStats.filter(e => e.count >= 2).sort((a, b) => a.winRate - b.winRate)[0];
                    return (
                      <>
                        {best && (
                          <div className="bg-green-900/10 border border-green-800/30 p-4 md:p-6 rounded-2xl">
                            <p className="text-green-400 font-bold text-sm mb-2">🏆 Best Mindset</p>
                            <p className="text-3xl mb-1">{best.emoji}</p>
                            <p className="text-xl font-bold text-white">{best.emotion}</p>
                            <p className="text-green-400 text-lg font-bold">{best.winRate}% win rate</p>
                            <p className="text-zinc-400 text-xs mt-1">${best.totalPnL.toFixed(2)} total P&L</p>
                          </div>
                        )}
                        {worst && (
                          <div className="bg-red-900/10 border border-red-800/30 p-4 md:p-6 rounded-2xl">
                            <p className="text-red-400 font-bold text-sm mb-2">⚠️ Worst Mindset</p>
                            <p className="text-3xl mb-1">{worst.emoji}</p>
                            <p className="text-xl font-bold text-white">{worst.emotion}</p>
                            <p className="text-red-400 text-lg font-bold">{worst.winRate}% win rate</p>
                            <p className="text-zinc-400 text-xs mt-1">${worst.totalPnL.toFixed(2)} total P&L</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Emotion Table */}
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                      <div className="grid grid-cols-8 gap-2 p-4 border-b border-zinc-800 text-zinc-400 text-xs font-semibold">
                        <div>Emotion</div>
                        <div className="text-center">Trades</div>
                        <div className="text-center">Wins</div>
                        <div className="text-center">Losses</div>
                        <div className="text-center">Win Rate</div>
                        <div className="text-center">Total P&L</div>
                        <div className="text-center">Avg P&L</div>
                        <div className="text-center">Risk/Reward</div>
                      </div>
                      {emotionStats.map((e) => (
                        <div key={e.emotion} className="grid grid-cols-8 gap-2 p-3 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg flex-shrink-0">{e.emoji}</span>
                            <span className="font-medium truncate">{e.emotion}</span>
                          </div>
                          <div className="text-center">{e.count}</div>
                          <div className="text-center text-green-400">{e.wins}</div>
                          <div className="text-center text-red-400">{e.losses}</div>
                          <div className={`text-center font-bold ${e.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>
                            {e.winRate}%
                          </div>
                          <div className={`text-center font-bold ${e.totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                            ${e.totalPnL.toFixed(2)}
                          </div>
                          <div className={`text-center ${e.avgPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                            ${e.avgPnL.toFixed(2)}
                          </div>
                          <div className={`text-center ${e.riskRewardRatio >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {e.riskRewardRatio.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Emotion Distribution Visual */}
                <div className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800">
                  <h3 className="font-bold mb-4 text-sm md:text-base">Emotion Distribution</h3>
                  <div className="space-y-2">
                    {emotionStats.slice(0, 8).map((e) => (
                      <div key={e.emotion} className="flex items-center gap-3">
                        <span className="text-lg w-8">{e.emoji}</span>
                        <span className="text-xs text-zinc-400 w-16 truncate">{e.emotion}</span>
                        <div className="flex-1 bg-zinc-800 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              e.winRate >= 60 ? "bg-green-500" : e.winRate >= 40 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${Math.max((e.count / emotionStats[0]?.count) * 100, 5)}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500 w-8 text-right">{e.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            PATTERNS TAB
        ═══════════════════════════════════════════════════ */}
        {activeTab === "patterns" && (
          <div className="space-y-4">
            {behavioralPatterns.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800">
                <p className="text-6xl mb-4">🎉</p>
                <p className="text-green-400 text-lg font-bold mb-2">No Negative Patterns Detected!</p>
                <p className="text-zinc-400 text-sm">Your trading behavior looks healthy. Keep it up!</p>
              </div>
            ) : (
              behavioralPatterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className={`p-5 md:p-6 rounded-2xl border ${
                    pattern.severity === "high"
                      ? "bg-red-900/10 border-red-800/30"
                      : pattern.severity === "medium"
                      ? "bg-yellow-900/10 border-yellow-800/30"
                      : "bg-blue-900/10 border-blue-800/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl flex-shrink-0">{pattern.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`font-bold text-lg ${
                          pattern.severity === "high" ? "text-red-400" : pattern.severity === "medium" ? "text-yellow-400" : "text-blue-400"
                        }`}>
                          {pattern.label}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          pattern.severity === "high"
                            ? "bg-red-900/50 text-red-400"
                            : pattern.severity === "medium"
                            ? "bg-yellow-900/50 text-yellow-400"
                            : "bg-blue-900/50 text-blue-400"
                        }`}>
                          {pattern.severity.toUpperCase()} SEVERITY
                        </span>
                      </div>
                      <p className="text-zinc-300 text-sm mb-2">{pattern.description}</p>
                      <p className="text-xs text-zinc-500 mb-3">Occurrences: {pattern.occurrences}</p>
                      <div className="bg-zinc-800/50 p-3 rounded-xl">
                        <p className="text-green-400 text-xs font-bold mb-1">💡 Recommendation</p>
                        <p className="text-zinc-300 text-sm">{pattern.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* AI Coach Prompt */}
            {behavioralPatterns.length > 0 && (
              <div className="bg-blue-900/10 border border-blue-800/30 p-5 rounded-2xl text-center">
                <p className="text-blue-400 font-bold mb-2">🤖 Want Deeper Analysis?</p>
                <p className="text-zinc-400 text-sm">
                  Click the AI Coach button (bottom right) and ask: "Analyze my behavioral patterns and give me an improvement plan"
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            SESSIONS TAB
        ═══════════════════════════════════════════════════ */}
        {activeTab === "sessions" && (
          <div className="space-y-6">
            {sessionAnalysis.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800">
                <p className="text-6xl mb-4">⏰</p>
                <p className="text-zinc-400 text-lg mb-2">No session data yet</p>
                <p className="text-zinc-500 text-sm">Add more trades with emotions to see session breakdowns</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessionAnalysis.map((session) => (
                    <div
                      key={session.session}
                      className={`bg-zinc-900 p-5 md:p-6 rounded-2xl border ${
                        session.totalPnL >= 0 ? "border-green-800/30" : "border-red-800/30"
                      }`}
                    >
                      <h3 className="font-bold text-sm md:text-base mb-3">{session.session}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-zinc-400 text-xs">Trades</p>
                          <p className="text-xl font-bold">{session.trades}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-xs">Win Rate</p>
                          <p className={`text-xl font-bold ${session.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>
                            {session.winRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-xs">Total P&L</p>
                          <p className={`text-xl font-bold ${session.totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                            ${session.totalPnL.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-xs">Emotion Score</p>
                          <p className={`text-xl font-bold ${session.avgEmotionScore >= 60 ? "text-green-400" : session.avgEmotionScore >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                            {session.avgEmotionScore}/100
                          </p>
                        </div>
                      </div>
                      {/* Best session indicator */}
                      {session.totalPnL === Math.max(...sessionAnalysis.map(s => s.totalPnL)) && session.totalPnL > 0 && (
                        <p className="text-green-400 text-xs mt-3 flex items-center gap-1">⭐ Your best performing session</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Session Recommendation */}
                {(() => {
                  const best = sessionAnalysis.sort((a, b) => b.totalPnL - a.totalPnL)[0];
                  const worst = sessionAnalysis.sort((a, b) => a.totalPnL - b.totalPnL)[0];
                  return (
                    <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                      <h3 className="font-bold mb-3 text-sm">💡 Session Insights</h3>
                      {best && (
                        <p className="text-green-400 text-sm mb-2">
                          🟢 You perform best during <b>{best.session}</b> with ${best.totalPnL.toFixed(2)} P&L and {best.winRate}% win rate.
                        </p>
                      )}
                      {worst && worst.session !== best?.session && (
                        <p className="text-red-400 text-sm">
                          🔴 You struggle most during <b>{worst.session}</b> with ${worst.totalPnL.toFixed(2)} P&L. Consider reducing size or avoiding trading during this time.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            CHECKLIST TAB
        ═══════════════════════════════════════════════════ */}
        {activeTab === "checklist" && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800 text-center">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-zinc-400 text-sm mb-1">Pre-Trade Readiness</p>
              <p className="text-3xl font-bold text-yellow-400">{checklistProgress}/{checklistTotal}</p>
              <div className="w-full bg-zinc-800 rounded-full h-3 mt-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${(checklistProgress / checklistTotal) * 100}%` }}
                />
              </div>
              <button
                onClick={resetChecklist}
                className="text-xs text-zinc-500 hover:text-zinc-300 mt-3 transition"
              >
                Reset Checklist
              </button>
            </div>

            {/* Checklist Categories */}
            {PRE_TRADE_CHECKLIST.map((category) => (
              <div key={category.id} className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800">
                <h3 className="font-bold mb-4 text-sm md:text-base">
                  {category.id === "mental" ? "🧠" : category.id === "technical" ? "📊" : "🛡️"} {category.label}
                </h3>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <label
                      key={item}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                        checklistItems[item] ? "bg-green-900/20 border border-green-800/30" : "bg-zinc-800/50 border border-transparent hover:bg-zinc-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!checklistItems[item]}
                        onChange={() => toggleChecklistItem(item)}
                        className="w-5 h-5 rounded accent-yellow-500 cursor-pointer flex-shrink-0"
                      />
                      <span className={`text-sm ${checklistItems[item] ? "text-green-400 line-through" : "text-zinc-300"}`}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            GOALS TAB
        ═══════════════════════════════════════════════════ */}
        {activeTab === "goals" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">🎯 Psychology Goals</h2>
              <button
                onClick={() => setShowGoalForm(!showGoalForm)}
                className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-yellow-400 transition"
              >
                {showGoalForm ? "✕ Cancel" : "+ Add Goal"}
              </button>
            </div>

            {/* Goal Form */}
            {showGoalForm && (
              <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3">
                <input
                  type="text"
                  placeholder="Goal title (e.g., Reduce revenge trading)"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none text-sm"
                />
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Target"
                    value={newGoal.target || ""}
                    onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) || 0 })}
                    className="flex-1 p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none text-sm"
                  />
                  <select
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    className="p-3 bg-zinc-800 rounded-xl border border-zinc-700 text-sm"
                  >
                    <option value="%">%</option>
                    <option value="days">Days</option>
                    <option value="trades">Trades</option>
                    <option value="$">$</option>
                  </select>
                </div>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none text-sm"
                />
                <button
                  onClick={addGoal}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-bold text-sm transition"
                >
                  Save Goal
                </button>
              </div>
            )}

            {/* Goals List */}
            {goals.length === 0 && !showGoalForm ? (
              <div className="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800">
                <p className="text-5xl mb-4">🎯</p>
                <p className="text-zinc-400 mb-2">No goals set yet</p>
                <p className="text-zinc-500 text-sm">Set psychology goals to track your improvement</p>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-5 rounded-2xl border transition ${
                      goal.completed ? "bg-green-900/10 border-green-800/30" : "bg-zinc-900 border-zinc-800"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className={`font-bold ${goal.completed ? "text-green-400 line-through" : "text-white"}`}>
                          {goal.title}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Target: {goal.target}{goal.unit} {goal.deadline ? `· Due: ${goal.deadline}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="text-zinc-600 hover:text-red-400 transition text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          goal.completed ? "bg-green-500" : "bg-yellow-500"
                        }`}
                        style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-zinc-500">{goal.current}/{goal.target}{goal.unit}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateGoalProgress(goal.id, 1)}
                          className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded-lg transition"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => updateGoalProgress(goal.id, 5)}
                          className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded-lg transition"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                    {goal.completed && (
                      <p className="text-green-400 text-xs mt-2 font-bold">🎉 Goal Achieved!</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            REPORT TAB
        ═══════════════════════════════════════════════════ */}
        {activeTab === "report" && (
          <div className="space-y-6">
            <div className="bg-zinc-900 p-5 md:p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-bold mb-4 text-sm md:text-base">📋 Weekly Psychology Reports</h3>
              {reportsWithTrend.length === 0 ? (
                <p className="text-zinc-500 text-sm">No data available for the selected period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    <div className="grid grid-cols-7 gap-2 p-3 border-b border-zinc-800 text-zinc-400 text-xs font-semibold">
                      <div>Week</div>
                      <div className="text-center">Trades</div>
                      <div className="text-center">Win Rate</div>
                      <div className="text-center">P&L</div>
                      <div className="text-center">Dominant Emotion</div>
                      <div className="text-center">Emotion Score</div>
                      <div className="text-center">Trend</div>
                    </div>
                    {reportsWithTrend.map((report, idx) => (
                      <div key={idx} className="grid grid-cols-7 gap-2 p-3 border-b border-zinc-800/50 text-sm hover:bg-zinc-800/30 transition">
                        <div className="text-zinc-400">{report.weekStart}</div>
                        <div className="text-center">{report.trades}</div>
                        <div className={`text-center ${report.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>
                          {report.winRate}%
                        </div>
                        <div className={`text-center font-bold ${report.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                          ${report.pnl.toFixed(2)}
                        </div>
                        <div className="text-center">{report.dominantEmotion}</div>
                        <div className={`text-center ${report.emotionalScore >= 60 ? "text-green-400" : "text-yellow-400"}`}>
                          {report.emotionalScore}/100
                        </div>
                        <div className={`text-center font-bold ${
                          report.improvement.startsWith("↑") ? "text-green-400" : 
                          report.improvement.startsWith("↓") ? "text-red-400" : 
                          "text-zinc-500"
                        }`}>
                          {report.improvement}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Export Button */}
            <div className="text-center">
              <button
                onClick={exportReport}
                className="bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition inline-flex items-center gap-2"
              >
                📥 Download Full Psychology Report
              </button>
              <p className="text-xs text-zinc-500 mt-2">Downloads as JSON — import into any analysis tool</p>
            </div>
          </div>
        )}

        {/* ─── Empty State ────────────────────────────── */}
        {trades.length === 0 && (
          <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800 mt-6">
            <p className="text-6xl mb-4">🧠</p>
            <p className="text-zinc-400 text-lg mb-2">No trades to analyze yet</p>
            <p className="text-zinc-500 text-sm mb-6">Add trades with emotions to unlock all psychology features</p>
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