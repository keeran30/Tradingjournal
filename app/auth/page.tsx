"use client"

import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [ready, setReady] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(5)
  const [blocked, setBlocked] = useState(false)
  const [blockTimer, setBlockTimer] = useState(0)

  useEffect(() => {
    // Check for error from Google callback
    const params = new URLSearchParams(window.location.search)
    if (params.get("error") === "google_login_failed") {
      setError("Google login failed. Please try again or use email/password.")
      window.history.replaceState({}, "", "/auth")
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        window.location.href = "/dashboard"
      } else {
        setReady(true)
      }
    })
  }, [])

  useEffect(() => {
    if (blocked && blockTimer > 0) {
      const t = setInterval(() => {
        setBlockTimer(p => { if (p <= 1) { setBlocked(false); setAttemptsLeft(5); return 0 } return p - 1 })
      }, 1000)
      return () => clearInterval(t)
    }
  }, [blocked, blockTimer])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (blocked) { setError(`Locked. Wait ${Math.ceil(blockTimer / 60)} min.`); return }
    setLoading(true); setError(""); setMessage("")
    try {
      if (isSignUp) {
        const r = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" }
        })
        if (r.error) throw r.error
        setMessage("Check your email to verify your account.")
      } else {
        const r = await supabase.auth.signInWithPassword({ email, password })
        if (r.error) {
          const left = attemptsLeft - 1; setAttemptsLeft(left)
          if (left <= 0) { setBlocked(true); setBlockTimer(900); throw new Error("Locked for 15 min.") }
          throw r.error
        }
        window.location.href = "/dashboard"
      }
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleGoogleLogin = async () => {
    if (blocked) return

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) setError(error.message)
  }

  if (!ready) return null

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{isSignUp ? "Create Account" : "Welcome Back"}</h1>
          <p className="text-zinc-400">{isSignUp ? "Start your trading journey" : "Sign in"}</p>
        </div>
        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
          {error && <div className="bg-red-900/30 border border-red-500/30 text-red-400 p-4 rounded-xl mb-4 text-sm">{error}</div>}
          {message && <div className="bg-green-900/30 border border-green-500/30 text-green-400 p-4 rounded-xl mb-4 text-sm">{message}</div>}
          {!blocked && attemptsLeft < 5 && <div className="bg-yellow-900/30 border border-yellow-500/30 text-yellow-400 p-3 rounded-xl mb-4 text-xs">{attemptsLeft} attempt{attemptsLeft > 1 ? "s" : ""} left</div>}
          {blocked && <div className="bg-red-900/30 text-red-400 p-4 rounded-xl mb-4 text-sm">Locked. {Math.ceil(blockTimer / 60)} min</div>}

          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700" required disabled={blocked} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700" required disabled={blocked} />
            <button type="submit" disabled={loading || blocked} className="w-full bg-yellow-500 text-black py-3 rounded-xl font-bold">{loading ? "Wait..." : isSignUp ? "Create Account" : "Sign In"}</button>
          </form>

          <div className="mt-4">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-700"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-zinc-900 text-zinc-400">or</span></div>
            </div>
            <button
              onClick={handleGoogleLogin}
              disabled={blocked}
              className="w-full bg-white hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-3 border border-gray-300 disabled:opacity-50"
            >
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