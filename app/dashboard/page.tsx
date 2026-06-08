"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import dynamic from "next/dynamic";

// Dynamically import AIAssistant to avoid SSR issues
const AIAssistant = dynamic(() => import("../components/AIAssistant"), {
  ssr: false,
});

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />

      <section className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>

        <p className="text-zinc-400 mb-10">Trading performance overview.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-zinc-400 text-sm mb-2">Total Trades</h2>
            <p className="text-4xl font-bold">0</p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-zinc-400 text-sm mb-2">Win Rate</h2>
            <p className="text-4xl font-bold text-green-400">0%</p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-zinc-400 text-sm mb-2">Discipline Score</h2>
            <p className="text-4xl font-bold text-yellow-400">0</p>
          </div>
        </div>

        {/* Only render AI chat after page is mounted */}
        {mounted && <AIAssistant />}
      </section>
    </main>
  );
}