import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")
  const format = url.searchParams.get("format") || "txt"
  const isPremium = url.searchParams.get("premium") === "true"

  if (!isPremium && format === "pdf") {
    return NextResponse.json({ error: "PDF export is a Premium feature. Upgrade to access." }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  const res = await fetch(`${supabaseUrl}/rest/v1/trades?select=*&user_id=eq.${userId}&order=created_at.desc`, {
    headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` }
  })
  const trades = await res.json()

  if (!trades || trades.length === 0) {
    return NextResponse.json({ error: "No trades to export" }, { status: 400 })
  }

  const totalPnL = trades.reduce((a: number, t: any) => a + (t.pnl || 0), 0)
  const wins = trades.filter((t: any) => t.pnl > 0).length
  const winRate = ((wins / trades.length) * 100).toFixed(1)

  if (format === "txt") {
    let txt = "TRADEVAULT EXPORT REPORT\n"
    txt += "========================\n\n"
    txt += `Generated: ${new Date().toISOString()}\n`
    txt += `Total Trades: ${trades.length}\n`
    txt += `Win Rate: ${winRate}%\n`
    txt += `Total P&L: $${totalPnL.toFixed(2)}\n\n`
    txt += "TRADE DETAILS:\n"
    txt += "-------------\n"
    trades.forEach((t: any, i: number) => {
      txt += `${i + 1}. ${t.asset} | ${t.direction} | Entry: $${t.entry} | Exit: $${t.close_price} | P&L: $${(t.pnl || 0).toFixed(2)} | ${t.created_at}\n`
    })

    return new NextResponse(txt, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="tradevault-export-${new Date().toISOString().split("T")[0]}.txt"`,
      },
    })
  }

  if (format === "csv") {
    let csv = "Asset,Direction,Entry,Exit,Size,P&L,Emotion,Date\n"
    trades.forEach((t: any) => {
      csv += `${t.asset},${t.direction},${t.entry},${t.close_price},${t.original_size || t.size},${(t.pnl || 0).toFixed(2)},${t.emotion || ""},${t.created_at}\n`
    })

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="tradevault-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 })
}