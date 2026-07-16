import { NextResponse } from "next/server"

const attempts: Record<string, { count: number; resetAt: number }> = {}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  const now = Date.now()
  
  if (!attempts[ip] || now > attempts[ip].resetAt) {
    attempts[ip] = { count: 1, resetAt: now + 900000 }
    return NextResponse.json({ allowed: true, remaining: 4 })
  }
  
  if (attempts[ip].count >= 5) {
    const minutesLeft = Math.ceil((attempts[ip].resetAt - now) / 60000)
    return NextResponse.json({ allowed: false, minutesLeft })
  }
  
  attempts[ip].count++
  return NextResponse.json({ allowed: true, remaining: 5 - attempts[ip].count })
}