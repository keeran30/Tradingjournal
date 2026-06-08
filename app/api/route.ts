import { NextRequest, NextResponse } from "next/server";
import { aiRateLimiter } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // ------------------------------------------------
  // 1. Check API key
  // ------------------------------------------------
  const apiKey = process.env.GROQ_API_KEY; // change to GEMINI_API_KEY if needed
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "AI service not configured" },
      { status: 500 }
    );
  }

  // ------------------------------------------------
  // 2. Rate limiting (10 requests per minute per IP)
  // ------------------------------------------------
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success, limit, reset, remaining } = await aiRateLimiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please wait a minute." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      }
    );
  }

  // ------------------------------------------------
  // 3. Process the user message
  // ------------------------------------------------
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // ---------- DeepSeek API call ----------
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are a trading journal assistant. Provide concise, helpful insights about trading patterns, risk management, and trading psychology. Always remind the user that this is educational, not financial advice.",
          },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI provider error:", response.status, errorText);
      return NextResponse.json(
        { success: false, error: "AI service temporarily unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "I’m not sure how to respond to that.";

    return NextResponse.json({ success: true, response: reply });
  } catch (error: any) {
    console.error("Server error:", error.message);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: keep a health check endpoint
export async function GET() {
  return NextResponse.json({ success: true, message: "AI API is running" });
}