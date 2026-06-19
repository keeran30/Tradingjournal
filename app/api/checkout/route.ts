import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json()
    const priceId = process.env.STRIPE_PRICE_ID

    if (!priceId) {
      return NextResponse.json({ error: "Price ID not configured" }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      client_reference_id: userId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      payment_intent_data: {
        statement_descriptor: "TRADEVAULT 1010",
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?payment=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error("Stripe error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}