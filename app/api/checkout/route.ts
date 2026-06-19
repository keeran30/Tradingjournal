import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-06-15" as any,
})

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      client_reference_id: userId,
      line_items: [{
        price: process.env.STRIPE_PRICE_ID || "price_1234567890",
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/settings?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/settings?payment=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}