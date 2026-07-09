"use client"

import { useEffect, useRef, memo } from "react"

function toTradingViewSymbol(symbol: string, type: string): string {
  const s = symbol.toUpperCase()
  if (type === "crypto") return `BINANCE:${s.replace("USD", "USDT")}`
  if (type === "forex") return `FX:${s}`
  if (s === "XAUUSD") return "TVC:GOLD"
  if (s === "XAGUSD") return "TVC:SILVER"
  if (s === "USOIL") return "TVC:USOIL"
  return `NASDAQ:${s}`
}

interface Props {
  symbol: string
  type: string
}

function TradingViewChart({ symbol, type }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ""

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: toTradingViewSymbol(symbol, type),
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(9, 9, 11, 1)",
      gridColor: "rgba(39, 39, 42, 0.5)",
      allow_symbol_change: false,
      support_host: "https://www.tradingview.com",
    })
    
    container.appendChild(script)
    return () => {
      container.innerHTML = ""
    }
  }, [symbol, type])

  return (
    <div className="tradingview-widget-container rounded-xl overflow-hidden border border-zinc-800" style={{ height: 500 }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  )
}

export default memo(TradingViewChart)