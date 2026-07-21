"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { useRouter, usePathname } from "next/navigation"

export default function Sidebar() {
  const [user, setUser] = useState<any>(undefined)
  const [isPremium, setIsPremium] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null)
      if (data.user) setIsPremium(JSON.parse(localStorage.getItem("user_settings") || "{}").isPremium || false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null))
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("user_settings")
    router.replace("/")
  }

  const publicPages = ["/", "/auth", "/auth/reset", "/terms", "/privacy", "/contact", "/about"]
  if (publicPages.includes(pathname)) return null
  if (user === undefined || user === null) return null

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col gap-4 min-h-screen">
      <Link href="/" className="text-xl font-bold text-yellow-500 mb-4">TradeVault</Link>
      <Link href="/dashboard" className="text-zinc-300 hover:text-white transition">📊 Dashboard</Link>
      <Link href="/trades" className="text-zinc-300 hover:text-white transition">💼 Trades</Link>
      <Link href="/psychology" className="text-zinc-300 hover:text-white transition">🧠 Psychology</Link>
      <Link href="/settings" className="text-zinc-300 hover:text-white transition">⚙️ Settings</Link>
      <Link href="/contact" className="text-zinc-300 hover:text-white transition">📧 Contact</Link>
      <div className="mt-auto border-t border-zinc-800 pt-4">
        <p className="text-sm text-zinc-400 truncate">{user.email}</p>
        {isPremium && <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold">Premium</span>}
        <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 transition w-full text-left mt-2">🚪 Sign Out</button>
      </div>
    </aside>
  )
}