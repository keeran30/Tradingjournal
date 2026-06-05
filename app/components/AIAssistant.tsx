"use client";

import { useState, useRef, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Trade {
  symbol: string;
  side: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  date: string;
  emotion?: string;
  notes?: string;
}

interface AIAssistantProps {
  trades?: Trade[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildTradeContext(trades: Trade[]) {
  if (!trades || trades.length === 0) return null;

  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winners = trades.filter((t) => t.pnl > 0);
  const losers = trades.filter((t) => t.pnl < 0);
  const winRate = ((winners.length / trades.length) * 100).toFixed(1);
  const avgWin =
    winners.length > 0
      ? (winners.reduce((s, t) => s + t.pnl, 0) / winners.length).toFixed(2)
      : "0";
  const avgLoss =
    losers.length > 0
      ? (losers.reduce((s, t) => s + t.pnl, 0) / losers.length).toFixed(2)
      : "0";
  const symbols = [...new Set(trades.map((t) => t.symbol))];
  const emotions = trades
    .filter((t) => t.emotion)
    .map((t) => t.emotion as string);
  const emotionCounts = emotions.reduce<Record<string, number>>((acc, e) => {
    acc[e] = (acc[e] || 0) + 1;
    return acc;
  }, {});

  return {
    summary: {
      totalTrades: trades.length,
      totalPnL: totalPnL.toFixed(2),
      winRate: winRate + "%",
      avgWin,
      avgLoss,
      symbols,
      emotionBreakdown: emotionCounts,
    },
    recentTrades: trades.slice(-20), // last 20 trades for context window
  };
}

// ── Markdown-lite renderer ────────────────────────────────────────────────────
// Converts **bold**, bullet lines, and newlines into JSX safely.

function RenderMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Bullet point
        if (line.startsWith("• ") || line.startsWith("- ")) {
          const text = line.slice(2);
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-yellow-400 mt-0.5 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: boldify(text) }} />
            </div>
          );
        }
        // Empty line = spacer
        if (line.trim() === "") return <div key={i} className="h-1" />;
        // Normal line
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: boldify(line) }} />
        );
      })}
    </div>
  );
}

function boldify(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

// ── Quick-prompt chips ────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "How am I doing overall?",
  "What's my best symbol?",
  "What emotions hurt my trading?",
  "Give me personalised advice",
  "Analyse my recent trades",
  "What's my risk/reward ratio?",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AIAssistant({ trades = [] }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Hi! I'm your AI Trading Coach. I analyse your actual trade data in real-time.\n\nAsk me anything about your trading performance!\n\n💬 **Try asking:**\n• How am I doing overall?\n• Analyse my TSLA trades\n• How's my gold performance?\n• What emotions hurt my trading?\n• Give me personalised advice",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText ?? input).trim();
    if (!userMessage || isLoading) return;

    setInput("");
    setShowChips(false);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          tradeContext: buildTradeContext(trades),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || "AI service unavailable. Please try again later."
        );
      }

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error: any) {
      console.error("AI error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${error.message ?? "Something went wrong. Please try again."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleChipClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Chat cleared! Ask me anything about your trades. 💬",
      },
    ]);
    setShowChips(true);
  };

  return (
    <>
      {/* ── Floating trigger button ── */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black rounded-full p-4 shadow-lg transition-all z-40 flex items-center gap-2"
        aria-label="Open AI Trading Coach"
      >
        <span className="text-2xl">🤖</span>
        <span className="font-bold hidden md:inline">AI Coach</span>
        {trades.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            ✓
          </span>
        )}
      </button>

      {/* ── Modal backdrop ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          {/* ── Chat panel ── */}
          <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl w-full max-w-2xl h-[620px] flex flex-col border border-yellow-500/30 shadow-2xl">

            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-yellow-500/30">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="text-3xl">🤖</span>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-white">
                    AI Trading Coach
                  </h2>
                  <p className="text-xs text-yellow-500/70">
                    {trades.length > 0
                      ? `Loaded ${trades.length} trades • Real-time analysis`
                      : "No trade data loaded yet"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearChat}
                  className="text-zinc-400 hover:text-white transition text-sm px-2 py-1 rounded hover:bg-zinc-800"
                  title="Clear chat"
                >
                  🗑️
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-400 hover:text-white transition text-2xl w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-800"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <span className="text-xl mr-2 mt-1 shrink-0">🤖</span>
                  )}
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-br-sm font-medium"
                        : "bg-zinc-800/50 text-white rounded-bl-sm border border-zinc-700"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <RenderMessage content={msg.content} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {/* Loading dots */}
              {isLoading && (
                <div className="flex justify-start items-end gap-2">
                  <span className="text-xl">🤖</span>
                  <div className="bg-zinc-800/50 text-white rounded-bl-sm border border-zinc-700 p-4 rounded-2xl">
                    <div className="flex gap-1.5">
                      <span
                        className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick-prompt chips */}
            {showChips && messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleChipClick(prompt)}
                    disabled={isLoading}
                    className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-yellow-500/20 hover:border-yellow-500/50 text-zinc-300 hover:text-white px-3 py-1.5 rounded-full transition disabled:opacity-40"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <form
              onSubmit={handleFormSubmit}
              className="p-4 border-t border-yellow-500/30 bg-zinc-900/50"
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your trades..."
                  className="flex-1 p-3 bg-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 text-white placeholder-zinc-500 text-sm"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black px-5 py-3 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? "..." : "Send"}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-2 text-center">
                💡 Analyses your actual trade data • Educational use only, not
                financial advice
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}