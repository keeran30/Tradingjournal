import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "No userId provided" }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/trades?select=*&user_id=eq.${userId}&order=created_at.desc`,
      {
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
      }
    )

    const trades = await res.json()

    if (!Array.isArray(trades)) {
      return NextResponse.json({ error: "Invalid response from database" }, { status: 500 })
    }

    return NextResponse.json({ success: true, trades })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, asset, direction, entry, closePrice, size, sizeUnit, emotion } = body

    if (!userId || !asset || !entry || !closePrice || !size) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    const pnl = direction === "Buy" 
      ? (closePrice - entry) * size 
      : (entry - closePrice) * size

    const res = await fetch(`${supabaseUrl}/rest/v1/trades`, {
      method: "POST",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        user_id: userId,
        asset,
        direction,
        entry,
        close_price: closePrice,
        size,
        size_unit: sizeUnit || "shares",
        original_size: size,
        emotion: emotion || null,
        pnl,
      }),
    })

    const data = await res.json()
    return NextResponse.json({ success: true, trade: Array.isArray(data) ? data[0] : data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "No trade ID provided" }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  try {
    await fetch(`${supabaseUrl}/rest/v1/trades?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
      },
    })

    return NextResponse.json({ success: true, message: "Trade deleted" })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}