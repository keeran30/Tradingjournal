"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { useRouter } from "next/navigation"

export default function Sidebar() {
  const [user, setUser] = useState<any>(null)
  const [isPremium, setIsPremium] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      const saved = localStorage.getItem("user_settings")
      if (saved) {
        try { setIsPremium(JSON.parse(saved).isPremium || false) } catch (e) {}
      }
    }
    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => { authListener.subscription.unsubscribe() }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("user_settings")
    router.push("/")
    router.refresh()
  }

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col gap-4 min-h-screen">
      <Link href="/" className="text-xl font-bold text-yellow-500 mb-4 hover:text-yellow-400 transition">
        TradeVault
      </Link>

      <Link href="/dashboard" className="text-zinc-300 hover:text-white transition flex items-center gap-2">
        📊 Dashboard
      </Link>
      <Link href="/markets" className="text-zinc-300 hover:text-white transition flex items-center gap-2">
  📈 Markets
</Link>
      <Link href="/trades" className="text-zinc-300 hover:text-white transition flex items-center gap-2">
        💼 Trades
      </Link>
      <Link href="/psychology" className="text-zinc-300 hover:text-white transition flex items-center gap-2">
        🧠 Psychology
      </Link>
      <Link href="/settings" className="text-zinc-300 hover:text-white transition flex items-center gap-2">
        ⚙️ Settings
      </Link>
      <Link href="/contact" className="text-zinc-300 hover:text-white transition flex items-center gap-2">
        📧 Contact
      </Link>
      

      <div className="mt-auto border-t border-zinc-800 pt-4 space-y-2">
        {user ? (
          <>
            <p className="text-sm text-zinc-400 truncate">{user.email}</p>
            {isPremium && (
              <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold">Premium</span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-300 transition w-full text-left"
            >
              🚪 Sign Out
            </button>
          </>
        ) : (
          <Link href="/auth" className="text-yellow-500 hover:text-yellow-400 transition font-bold">
            Sign In →
          </Link>
        )}
      </div>
    </aside>
  )
}