import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "No API key configured" },
      { status: 500 }
    );
  }

  try {
    const { message, tradeContext } = await req.json();

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `You are an expert trading journal assistant and coach.
You have access to the user's real trade data and analyze it to give personalized advice.
When trade data is provided, reference specific trades, symbols, dates, and numbers.
Focus on: entry/exit timing, risk/reward ratio, emotional patterns, win rate, and improvement areas.
Keep responses concise — use bullet points where helpful.
Always end with one actionable improvement tip.
Note: This is educational analysis, not financial advice.`,
          },
          {
            role: "user",
            content: tradeContext
              ? `Here is my trade data:\n${JSON.stringify(tradeContext, null, 2)}\n\nMy question: ${message}`
              : message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "Groq API request failed");
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      response: data.choices[0].message.content,
    });
  } catch (error: any) {
    console.error("Groq API error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: "Trading Journal AI ready" });
}