"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import AIAssistant from "../components/AIAssistant";
import { supabase } from "../lib/supabase";

interface Trade {
  id: string;
  pnl: number;
  asset: string;
  direction: string;
  emotion: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: false });

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
  };

  // Calculate stats from real trades
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.pnl > 0).length;
  const losingTrades = trades.filter((t) => t.pnl < 0).length;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : "0";
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  // Calculate discipline score based on emotions
  const calculateDisciplineScore = () => {
    if (trades.length === 0) return 0;
    
    const positiveEmotions = ["😌 Calm", "😊 Confident", "🎯 Focused", "Patient"];
    const negativeEmotions = ["😰 Anxious", "😤 Impatient", "😨 Fearful", "🤑 Greedy", "😓 Stressed", "😎 Overconfident"];
    
    let score = 50; // Start at neutral
    
    trades.forEach((trade) => {
      if (!trade.emotion) return;
      
      if (positiveEmotions.some((e) => trade.emotion?.includes(e))) {
        score += 2;
      }
      if (negativeEmotions.some((e) => trade.emotion?.includes(e))) {
        score -= 3;
      }
      
      // Bonus for profitable trades with good emotions
      if (trade.pnl > 0 && positiveEmotions.some((e) => trade.emotion?.includes(e))) {
        score += 1;
      }
    });
    
    return Math.max(0, Math.min(100, score));
  };

  const disciplineScore = calculateDisciplineScore();

  // Best performing asset
  const assetPerformance: Record<string, number> = {};
  trades.forEach((t) => {
    assetPerformance[t.asset] = (assetPerformance[t.asset] || 0) + (t.pnl || 0);
  });
  
  const bestAsset = Object.entries(assetPerformance).sort((a, b) => b[1] - a[1])[0];

  // Recent trades (last 5)
  const recentTrades = trades.slice(0, 5);

  // Win streak
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

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📊</div>
          <p className="text-zinc-400">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />

      <section className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-zinc-400 mb-10">Trading performance overview.</p>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-zinc-400 text-sm mb-2">Total Trades</h2>
            <p className="text-4xl font-bold">{totalTrades}</p>
            {totalTrades > 0 && (
              <p className="text-xs text-zinc-500 mt-1">
                {winningTrades}W / {losingTrades}L
              </p>
            )}
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-zinc-400 text-sm mb-2">Win Rate</h2>
            <p className={`text-4xl font-bold ${parseFloat(winRate) >= 50 ? "text-green-400" : "text-red-400"}`}>
              {winRate}%
            </p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-zinc-400 text-sm mb-2">Total P&L</h2>
            <p className={`text-4xl font-bold ${totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${totalPnL.toFixed(2)}
            </p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-zinc-400 text-sm mb-2">Discipline Score</h2>
            <p className={`text-4xl font-bold ${
              disciplineScore >= 70 ? "text-green-400" : 
              disciplineScore >= 40 ? "text-yellow-400" : 
              "text-red-400"
            }`}>
              {disciplineScore}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {disciplineScore >= 70 ? "Great discipline!" : 
               disciplineScore >= 40 ? "Room to improve" : 
               "Needs attention"}
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        {totalTrades > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Best Asset */}
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

            {/* Win Streak */}
            <div className="bg-zinc-900 p-6 rounded-2xl border border-yellow-800/30">
              <h3 className="text-zinc-400 text-sm mb-2">🔥 Best Win Streak</h3>
              <p className="text-4xl font-bold text-yellow-400">{bestStreak}</p>
              <p className="text-xs text-zinc-500 mt-1">consecutive wins</p>
            </div>
          </div>
        )}

        {/* Recent Trades */}
        {recentTrades.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Recent Trades</h2>
            <div className="space-y-2">
              {recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex justify-between items-center p-3 bg-zinc-900 border border-zinc-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <b>{trade.asset}</b>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      trade.direction === "Buy" ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"
                    }`}>
                      {trade.direction?.toUpperCase()}
                    </span>
                    {trade.emotion && (
                      <span className="text-sm text-zinc-500">{trade.emotion}</span>
                    )}
                  </div>
                  <span className={`font-bold ${trade.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                    ${trade.pnl?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalTrades === 0 && (
          <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800">
            <p className="text-6xl mb-4">📊</p>
            <p className="text-zinc-400 mb-4 text-lg">No trades yet!</p>
            <p className="text-zinc-500 mb-6">Start adding trades to see your performance dashboard.</p>
            <a
              href="/trades"
              className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition inline-block"
            >
              Go to Trading Journal
            </a>
          </div>
        )}
      </section>

      <AIAssistant />
    </main>
  );
}