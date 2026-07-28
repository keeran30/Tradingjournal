"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const signUp = async () => {
    setMessage("Signing up...")
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) setMessage("Error: " + error.message)
    else {
      setMessage("User created! Now signing in...")
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) setMessage("Login error: " + loginError.message)
      else if (loginData.session) window.location.href = "/dashboard"
      else setMessage("No session: " + JSON.stringify(loginData))
    }
  }

  const signIn = async () => {
    setMessage("Signing in...")
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage("Error: " + error.message)
    else if (data.session) window.location.href = "/dashboard"
    else setMessage("No session: " + JSON.stringify(data))
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-2">TradeVault</h1>
        <p className="text-zinc-400 text-center mb-8">Sign in or create account</p>
        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700" />
          <button onClick={signUp} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">Sign Up</button>
          <button onClick={signIn} className="w-full bg-yellow-500 text-black py-3 rounded-xl font-bold">Sign In</button>
          {message && <p className="text-yellow-400 text-xs bg-yellow-900/20 p-3 rounded-lg">{message}</p>}
        </div>
      </div>
    </main>
  )
}