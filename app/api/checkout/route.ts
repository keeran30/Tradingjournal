import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  
  if (!stripeKey) {
    return NextResponse.json({ 
      error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY to continue." 
    }, { status: 500 })
  }

  return NextResponse.json({ 
    message: "Stripe checkout ready" 
  })
}