"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";

interface Trade {
  id: string;
  symbol: string;
  type: "buy" | "sell";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  profitLoss: number;
  notes: string;
  date: string;
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    symbol: "",
    type: "buy" as "buy" | "sell",
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const qty = parseFloat(form.quantity);
    const profitLoss = form.type === "buy" 
      ? (exit - entry) * qty 
      : (entry - exit) * qty;

    const newTrade: Trade = {
      id: Date.now().toString(),
      symbol: form.symbol.toUpperCase(),
      type: form.type,
      entryPrice: entry,
      exitPrice: exit,
      quantity: qty,
      profitLoss: profitLoss,
      notes: form.notes,
      date: new Date().toISOString().split("T")[0],
    };

    setTrades([newTrade, ...trades]);
    setForm({ symbol: "", type: "buy", entryPrice: "", exitPrice: "", quantity: "", notes: "" });
    setShowForm(false);
  };

  const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
  const winCount = trades.filter(t => t.profitLoss > 0).length;
  const winRate = trades.length > 0 ? ((winCount / trades.length) * 100).toFixed(1) : "0";

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />

      <section className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Trades</h1>
            <p className="text-zinc-400">Manage your trading journal entries.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-xl font-bold transition"
          >
            {showForm ? "✕ Cancel" : "+ Add Trade"}
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <p className="text-zinc-400 text-sm">Total Trades</p>
            <p className="text-2xl font-bold">{trades.length}</p>
          </div>
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <p className="text-zinc-400 text-sm">Win Rate</p>
            <p className="text-2xl font-bold text-green-400">{winRate}%</p>
          </div>
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <p className="text-zinc-400 text-sm">Total P&L</p>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${totalPnL.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Add Trade Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 mb-8">
            <h2 className="text-xl font-bold mb-4">New Trade</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Symbol</label>
                <input
                  type="text"
                  placeholder="AAPL, TSLA..."
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  className="w-full bg-zinc-800 text-white rounded-xl px-4 py-2 border border-zinc-700 focus:border-yellow-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "buy" | "sell" })}
                  className="w-full bg-zinc-800 text-white rounded-xl px-4 py-2 border border-zinc-700 focus:border-yellow-500 outline-none"
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Quantity</label>
                <input
                  type="number"
                  placeholder="100"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full bg-zinc-800 text-white rounded-xl px-4 py-2 border border-zinc-700 focus:border-yellow-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Entry Price</label>
                <input
                  type="number"
                  placeholder="150.00"
                  value={form.entryPrice}
                  onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
                  className="w-full bg-zinc-800 text-white rounded-xl px-4 py-2 border border-zinc-700 focus:border-yellow-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Exit Price</label>
                <input
                  type="number"
                  placeholder="155.00"
                  value={form.exitPrice}
                  onChange={(e) => setForm({ ...form, exitPrice: e.target.value })}
                  className="w-full bg-zinc-800 text-white rounded-xl px-4 py-2 border border-zinc-700 focus:border-yellow-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Trade reason..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-zinc-800 text-white rounded-xl px-4 py-2 border border-zinc-700 focus:border-yellow-500 outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold transition"
            >
              Save Trade
            </button>
          </form>
        )}

        {/* Trades List */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="grid grid-cols-7 gap-4 p-4 border-b border-zinc-800 text-zinc-400 text-sm font-semibold">
            <div>Date</div>
            <div>Symbol</div>
            <div>Type</div>
            <div>Entry</div>
            <div>Exit</div>
            <div>Qty</div>
            <div>P&L</div>
          </div>
          
          {trades.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No trades yet. Click "+ Add Trade" to get started.
            </div>
          ) : (
            trades.map((trade) => (
              <div
                key={trade.id}
                className="grid grid-cols-7 gap-4 p-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition"
              >
                <div className="text-zinc-400">{trade.date}</div>
                <div className="font-semibold">{trade.symbol}</div>
                <div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    trade.type === "buy" ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"
                  }`}>
                    {trade.type.toUpperCase()}
                  </span>
                </div>
                <div>${trade.entryPrice}</div>
                <div>${trade.exitPrice}</div>
                <div>{trade.quantity}</div>
                <div className={`font-bold ${trade.profitLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
                  ${trade.profitLoss.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}