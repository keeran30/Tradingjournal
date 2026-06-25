"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    
    if (result.error) {
      setError(result.error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center">Reset Password</h1>
        <p className="text-zinc-400 text-center mb-8">Enter your email to receive a reset link</p>
        
        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
          {sent ? (
            <div className="text-center">
              <p className="text-green-400 text-lg mb-4">Check your email!</p>
              <p className="text-zinc-400 text-sm">We have sent a password reset link to {email}</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {error && <div className="bg-red-900/30 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">{error}</div>}
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none" required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold transition disabled:opacity-50">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
        
        <p className="text-center mt-4">
          <a href="/auth" className="text-zinc-500 hover:text-zinc-300 text-sm">Back to login</a>
        </p>
      </div>
    </main>
  )
}