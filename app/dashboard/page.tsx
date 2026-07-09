"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import AIAssistant from "../components/AIAssistant";
import { supabase } from "../lib/supabase";
import AppLoader from "../components/AppLoader";

interface Trade {
  id: string;
  pnl: number;
  asset: string;
  direction: string;
  emotion: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Check auth and fetch trades
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setUserId(user.id);
      fetchTrades(user.id);
    };
    init();
  }, [router]);

  const fetchTrades = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch error:", error);
        setTrades([]);
      } else {
        setTrades(data || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch trades:", err);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.pnl > 0).length;
  const losingTrades = trades.filter((t) => t.pnl < 0).length;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : "0";
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  const calculateDisciplineScore = () => {
    if (trades.length === 0) return 0;
    const positiveEmotions = ["Calm", "Confident", "Focused", "Patient"];
    const negativeEmotions = ["Anxious", "Impatient", "Fearful", "Greedy", "Stressed", "Overconfident"];
    let score = 50;
    trades.forEach((trade) => {
      if (!trade.emotion) return;
      if (positiveEmotions.some((e) => trade.emotion?.includes(e))) score += 2;
      if (negativeEmotions.some((e) => trade.emotion?.includes(e))) score -= 3;
      if (trade.pnl > 0 && positiveEmotions.some((e) => trade.emotion?.includes(e))) score += 1;
    });
    return Math.max(0, Math.min(100, score));
  };

  const disciplineScore = calculateDisciplineScore();

  const assetPerformance: Record<string, number> = {};
  trades.forEach((t) => {
    if (!assetPerformance[t.asset]) assetPerformance[t.asset] = 0;
    assetPerformance[t.asset] += (t.pnl || 0);
  });

  const sortedAssets = Object.entries(assetPerformance).sort((a, b) => b[1] - a[1]);
  const bestAsset = sortedAssets[0];
  const worstAsset = sortedAssets[sortedAssets.length - 1];
  const recentTrades = trades.slice(0, 5);

  let currentStreak = 0;
  let bestStreak = 0;
  for (const trade of trades) {
    if (trade.pnl > 0) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  const avgPnL = totalTrades > 0 ? (totalPnL / totalTrades).toFixed(2) : "0";
  const today = new Date().toISOString().split("T")[0];
  const todayTrades = trades.filter((t) => t.created_at?.startsWith(today));
  const todayPnL = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  if (loading) {
    return <AppLoader message="Loading Dashboard" />;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />

      <section className="flex-1 p-8 overflow-y-auto">
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${
            notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}>
            {notification.message}
          </div>
        )}

        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-zinc-400 mb-10">Trading performance overview.</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition">
            <h2 className="text-zinc-400 text-sm mb-2">Total Trades</h2>
            <p className="text-4xl font-bold">{totalTrades}</p>
            {totalTrades > 0 && <p className="text-xs text-zinc-500 mt-1">{winningTrades}W / {losingTrades}L</p>}
          </div>
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition">
            <h2 className="text-zinc-400 text-sm mb-2">Win Rate</h2>
            <p className={`text-4xl font-bold ${parseFloat(winRate) >= 50 ? "text-green-400" : "text-red-400"}`}>
              {winRate}%
            </p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition">
            <h2 className="text-zinc-400 text-sm mb-2">Total P&L</h2>
            <p className={`text-4xl font-bold ${totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${totalPnL.toFixed(2)}
            </p>
            {totalTrades > 0 && <p className="text-xs text-zinc-500 mt-1">Avg: ${avgPnL}/trade</p>}
          </div>
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition">
            <h2 className="text-zinc-400 text-sm mb-2">Discipline Score</h2>
            <p className={`text-4xl font-bold ${
              disciplineScore >= 70 ? "text-green-400" : disciplineScore >= 40 ? "text-yellow-400" : "text-red-400"
            }`}>
              {disciplineScore}
            </p>
          </div>
        </div>

        {totalTrades > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <h3 className="text-zinc-400 text-sm">Today's Trades</h3>
              <p className="text-2xl font-bold">{todayTrades.length}</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <h3 className="text-zinc-400 text-sm">Today's P&L</h3>
              <p className={`text-2xl font-bold ${todayPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                ${todayPnL.toFixed(2)}
              </p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <h3 className="text-zinc-400 text-sm">Best Streak</h3>
              <p className="text-2xl font-bold text-yellow-400">{bestStreak}W</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <h3 className="text-zinc-400 text-sm">Avg P&L</h3>
              <p className={`text-2xl font-bold ${parseFloat(avgPnL) >= 0 ? "text-green-400" : "text-red-400"}`}>
                ${avgPnL}
              </p>
            </div>
          </div>
        )}

        {totalTrades > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-green-800/30">
              <h3 className="text-zinc-400 text-sm mb-2">🏆 Best Performing Asset</h3>
              {bestAsset ? (
                <>
                  <p className="text-2xl font-bold">{bestAsset[0]}</p>
                  <p className={`text-lg ${bestAsset[1] >= 0 ? "text-green-400" : "text-red-400"}`}>
                    ${bestAsset[1].toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="text-zinc-500">No data</p>
              )}
            </div>
            <div className="bg-zinc-900 p-6 rounded-2xl border border-red-800/30">
              <h3 className="text-zinc-400 text-sm mb-2">⚠️ Worst Performing Asset</h3>
              {worstAsset && worstAsset[0] !== bestAsset?.[0] ? (
                <>
                  <p className="text-2xl font-bold">{worstAsset[0]}</p>
                  <p className={`text-lg ${worstAsset[1] >= 0 ? "text-green-400" : "text-red-400"}`}>
                    ${worstAsset[1].toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="text-zinc-500">All assets profitable!</p>
              )}
            </div>
          </div>
        )}

        {recentTrades.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">📋 Recent Trades</h2>
            <div className="space-y-2">
              {recentTrades.map((trade) => (
                <div key={trade.id} className="flex justify-between items-center p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition">
                  <div className="flex items-center gap-3">
                    <b className="text-lg">{trade.asset}</b>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      trade.direction === "Buy" ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"
                    }`}>
                      {trade.direction?.toUpperCase()}
                    </span>
                    {trade.emotion && <span className="text-sm text-zinc-500">🧠 {trade.emotion}</span>}
                  </div>
                  <span className={`font-bold text-lg ${trade.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {trade.pnl >= 0 ? "+" : ""}{trade.pnl?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalTrades === 0 && (
          <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800">
            <p className="text-6xl mb-4">📊</p>
            <p className="text-zinc-400 mb-4 text-lg">No trades yet!</p>
            <p className="text-zinc-500 mb-6">Start adding trades to see your performance dashboard.</p>
            <a href="/trades" className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition inline-block">
              Go to Trading Journal →
            </a>
          </div>
        )}
      </section>

      <AIAssistant />
    </main>
  );
}