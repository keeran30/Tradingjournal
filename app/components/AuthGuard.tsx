"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "../lib/supabase"
import AppLoader from "./AppLoader"

const PUBLIC_PAGES = ["/", "/auth", "/auth/reset", "/terms", "/privacy", "/contact", "/about"]

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    // Don't check auth on public pages
    if (PUBLIC_PAGES.includes(pathname)) {
      setReady(true)
      return
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/auth")
      } else {
        setAuthenticated(true)
      }
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setAuthenticated(false)
        if (!PUBLIC_PAGES.includes(pathname)) {
          router.replace("/auth")
        }
      }
      if (event === "SIGNED_IN" && session) {
        setAuthenticated(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router])

  // Public pages - show immediately
  if (PUBLIC_PAGES.includes(pathname)) {
    return <>{children}</>
  }

  // Protected pages - show nothing until auth check done
  if (!ready) return null

  // Not authenticated - show nothing (redirect happening)
  if (!authenticated) return null

  return <>{children}</>
}