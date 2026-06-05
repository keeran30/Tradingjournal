"use client"

import Link from "next/link"
import {
  LayoutDashboard,
  CandlestickChart,
  Brain,
  Settings
} from "lucide-react"

export default function Sidebar() {
  return (
    <aside className="w-full md:w-64 bg-zinc-900 border-r border-zinc-800 p-6">

      <h1 className="text-2xl font-bold mb-10 text-yellow-400">
        TradeVault
      </h1>

      <nav className="space-y-4">

        <Link
          href="/dashboard"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800 transition"
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/trades"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800 transition"
        >
          <CandlestickChart size={20} />
          <span>Trades</span>
        </Link>

        <Link
          href="/psychology"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800 transition"
        >
          <Brain size={20} />
          <span>Psychology</span>
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800 transition"
        >
          <Settings size={20} />
          <span>Settings</span>
        </Link>

      </nav>

    </aside>
  )
}