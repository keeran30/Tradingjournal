"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.replace("/dashboard")
        return
      }
      setReady(true)
    })
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage("Check your email to verify your account.")
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.replace("/dashboard")
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" }
    })
  }

  if (!ready) return null

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{isSignUp ? "Create Account" : "Welcome Back"}</h1>
          <p className="text-zinc-400">{isSignUp ? "Start your trading journey" : "Sign in to your journal"}</p>
        </div>
        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
          {error && <div className="bg-red-900/30 text-red-400 p-4 rounded-xl mb-4 text-sm">{error}</div>}
          {message && <div className="bg-green-900/30 text-green-400 p-4 rounded-xl mb-4 text-sm">{message}</div>}
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 outline-none" required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 outline-none" required />
            <button type="submit" disabled={loading} className="w-full bg-yellow-500 text-black py-3 rounded-xl font-bold">{loading ? "Wait..." : isSignUp ? "Create Account" : "Sign In"}</button>
          </form>
          <div className="mt-4">
            <div className="relative mb-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-700"></div></div><div className="relative flex justify-center text-sm"><span className="px-4 bg-zinc-900 text-zinc-400">or</span></div></div>
            <button onClick={handleGoogleLogin} className="w-full bg-white hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-3 border border-gray-300">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
        <p className="text-center mt-6">{isSignUp ? "Have account?" : "New?"} <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage("") }} className="text-yellow-500 font-bold">{isSignUp ? "Sign In" : "Sign Up"}</button></p>
      </div>
    </main>
  )
}