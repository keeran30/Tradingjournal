"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../lib/supabase"

export default function AuthPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    if (!email.trim()) {
      setMessage("Please enter your email address.")
      return false
    }

    if (!password) {
      setMessage("Please enter your password.")
      return false
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.")
      return false
    }

    return true
  }

  const signUp = async () => {
    if (!validateForm()) return

    setLoading(true)
    setMessage("Creating your account...")

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setMessage(`Sign-up error: ${error.message}`)
        return
      }

      if (data.session) {
        setMessage("Account created successfully.")
        router.replace("/dashboard")
        router.refresh()
        return
      }

      setMessage(
        "Account created. Please check your email and confirm your account."
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Unexpected error: ${error.message}`
          : "An unexpected error occurred."
      )
    } finally {
      setLoading(false)
    }
  }

  const signIn = async () => {
    if (!validateForm()) return

    setLoading(true)
    setMessage("Signing in...")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setMessage(`Sign-in error: ${error.message}`)
        return
      }

      if (!data.session) {
        setMessage("Sign-in succeeded, but no session was created.")
        return
      }

      setMessage("Signed in successfully.")
      router.replace("/dashboard")
      router.refresh()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Unexpected error: ${error.message}`
          : "An unexpected error occurred."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-2">
          TradeVault
        </h1>

        <p className="text-zinc-400 text-center mb-8">
          Sign in or create an account
        </p>

        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            autoComplete="email"
            disabled={loading}
            className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 outline-none focus:border-yellow-500 disabled:opacity-50"
          />

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            disabled={loading}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !loading) {
                void signIn()
              }
            }}
            className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 outline-none focus:border-yellow-500 disabled:opacity-50"
          />

          <button
            type="button"
            onClick={() => void signUp()}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait..." : "Sign Up"}
          </button>

          <button
            type="button"
            onClick={() => void signIn()}
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait..." : "Sign In"}
          </button>

          {message && (
            <p className="text-yellow-300 text-sm bg-yellow-900/20 border border-yellow-900/40 p-3 rounded-lg">
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}