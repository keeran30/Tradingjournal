import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "AI service not configured" },
      { status: 500 }
    );
  }

  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
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
      console.error("Groq error:", response.status, errorText);
      return NextResponse.json(
        { success: false, error: "AI service temporarily unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "I'm not sure how to respond to that.";

    return NextResponse.json({ success: true, response: reply });
  } catch (error: any) {
    console.error("Server error:", error.message);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: "AI API is running" });
}