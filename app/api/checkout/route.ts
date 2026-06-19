import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const stripeKey = process.env.SECRET_KEY_STRIPE || process.env.RESTRICTED_KEY_STRIPE_PAYMENT || ""
    const priceId = process.env.STRIPE_PAYMENT_PRODUCT_ID || ""
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tradingjournal-flax.vercel.app"
    
    if (!stripeKey) {
      return NextResponse.json({ error: "Stripe key not found" }, { status: 500 })
    }

    if (!priceId) {
      return NextResponse.json({ error: "Price ID not found" }, { status: 500 })
    }

    const { userId, email } = await request.json()

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${stripeKey}`, 
        "Content-Type": "application/x-www-form-urlencoded" 
      },
      body: new URLSearchParams({
        "payment_method_types[]": "card",
        "mode": "subscription",
        "customer_email": email || "",
        "client_reference_id": userId || "",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        "success_url": `${siteUrl}/settings?payment=success`,
        "cancel_url": `${siteUrl}/settings?payment=cancelled`,
      }).toString(),
    })

    const session = await res.json()
    
    if (session.url) {
      return NextResponse.json({ url: session.url })
    }
    
    return NextResponse.json({ error: session.error?.message || "Stripe error" }, { status: 500 })
    
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}