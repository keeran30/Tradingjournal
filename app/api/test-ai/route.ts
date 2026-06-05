import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { message, trades } = await req.json();
    
    // Build context from trades if provided
    let contextPrompt = message;
    if (trades && trades.length > 0) {
      const tradeSummary = trades.map((t: any) => 
        `${t.symbol}: ${t.type} - P&L: $${t.profit}`
      ).join('\n');
      
      contextPrompt = `As a trading journal assistant, analyze these trades:\n${tradeSummary}\n\nUser question: ${message}`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "You are a helpful trading journal assistant. Help users analyze their trades, identify patterns, and improve their trading. Always remind them this is not financial advice." }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'll help analyze trading patterns and provide insights while being clear that this is educational, not financial advice." }],
        },
      ],
    });

    const result = await chat.sendMessage(contextPrompt);
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({ success: true, response: text });
    
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ 
      error: "Failed to process chat message",
      details: error.message 
    }, { status: 500 });
  }
}