"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"login" | "signup">("login")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const response = mode === "signup" 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (response.error) {
      setError(response.error.message)
    } else if (mode === "signup") {
      router.push("/dashboard")
    } else {
      router.push("/dashboard")
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-2">TradeVault</h1>
        <p className="text-zinc-400 text-center mb-8">{mode === "login" ? "Sign in" : "Create account"}</p>
        
        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
          {error && <p className="text-red-400 text-sm mb-4 bg-red-900/20 p-3 rounded-lg">{error}</p>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700" required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700" required minLength={6} />
            <button type="submit" disabled={loading} className="w-full bg-yellow-500 text-black py-3 rounded-xl font-bold">
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-6 text-zinc-400">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError("") }} className="text-yellow-500 font-bold">
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </main>
  )
}