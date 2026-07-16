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
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [attemptsLeft, setAttemptsLeft] = useState(5)
  const [blocked, setBlocked] = useState(false)
  const [blockTimer, setBlockTimer] = useState(0)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) { router.push("/dashboard") }
      setCheckingAuth(false)
    }
    checkUser()
  }, [router])

  // Block timer countdown
  useEffect(() => {
    if (blocked && blockTimer > 0) {
      const timer = setInterval(() => {
        setBlockTimer(prev => {
          if (prev <= 1) { setBlocked(false); return 0 }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [blocked, blockTimer])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (blocked) {
      setError(`Too many attempts. Please wait ${Math.ceil(blockTimer / 60)} minutes.`)
      return
    }

    setLoading(true)
    setError("")
    setMessage("")

    try {
      if (isSignUp) {
        const result = await supabase.auth.signUp({ email, password })
        if (result.error) throw result.error
        setMessage("Account created! Please check your email to verify your account.")
        setAttemptsLeft(5)
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password })
        if (result.error) {
          const newAttempts = attemptsLeft - 1
          setAttemptsLeft(newAttempts)
          
          if (newAttempts <= 0) {
            setBlocked(true)
            setBlockTimer(900) // 15 minutes
            throw new Error("Too many failed attempts. Account locked for 15 minutes.")
          }
          throw result.error
        }
        setAttemptsLeft(5)
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const result = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (result.error) setError(result.error.message)
  }

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-zinc-400">
            {isSignUp ? "Start your trading journey" : "Sign in to your trading journal"}
          </p>
        </div>

        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
          {error && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 p-4 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-900/30 border border-green-500/30 text-green-400 p-4 rounded-xl mb-4 text-sm">
              {message}
            </div>
          )}
          {!blocked && attemptsLeft < 5 && attemptsLeft > 0 && (
            <div className="bg-yellow-900/30 border border-yellow-500/30 text-yellow-400 p-3 rounded-xl mb-4 text-xs">
              {attemptsLeft} login attempt{attemptsLeft > 1 ? "s" : ""} remaining
            </div>
          )}
          {blocked && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 p-4 rounded-xl mb-4 text-sm">
              Account temporarily locked. Please wait {Math.ceil(blockTimer / 60)} minute{Math.ceil(blockTimer / 60) > 1 ? "s" : ""}.
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none" required disabled={blocked} />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none" required disabled={blocked} />
            </div>
            <button type="submit" disabled={loading || blocked} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded-xl font-bold transition disabled:opacity-50">
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-4">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-700"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-zinc-900 text-zinc-400">or</span></div>
            </div>
            <button onClick={handleGoogleLogin} className="w-full bg-white hover:bg-gray-100 text-black py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
              🚀 Continue with Google
            </button>
          </div>
        </div>

        <p className="text-center text-zinc-400 mt-6">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); setAttemptsLeft(5); setBlocked(false) }} className="text-yellow-500 hover:text-yellow-400 font-bold transition">
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
        <p className="text-center mt-4">
          <a href="/auth/reset" className="text-zinc-500 hover:text-zinc-300 text-sm transition">Forgot password?</a>
        </p>
        <p className="text-center mt-2">
          <a href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition">← Back to home</a>
        </p>
      </div>
    </main>
  )
}