import { NextResponse } from 'next/server';
import Stripe from 'stripe';

type PlanConfig = {
  name: string;
  amount: number;
  stripePrice?: string;
};

const planMap: Record<string, PlanConfig> = {
  free: { name: 'Free', amount: 0 },
  pro: { name: 'Pro', amount: 99, stripePrice: process.env.STRIPE_PRO_PRICE_ID },
  business: { name: 'Business', amount: 199, stripePrice: process.env.STRIPE_BUSINESS_PRICE_ID },
};

export async function POST(req: Request) {
  try {
    const { plan, paymentMethod = 'stripe' } = await req.json();
    const normalizedPlan = String(plan || 'pro').toLowerCase();
    const planConfig = planMap[normalizedPlan] || planMap.pro;

    if (paymentMethod === 'bank' || paymentMethod === 'cash') {
      return NextResponse.json({
        success: true,
        method: paymentMethod,
        url: `/?checkout=success&plan=${normalizedPlan}&method=${paymentMethod}`,
        message:
          paymentMethod === 'bank'
            ? 'Bank transfer is selected. Please contact the sales team to receive the invoice details.'
            : 'Cash payment is selected. The team will contact you to finalize the order.',
      });
    }

    if (normalizedPlan === 'free') {
      return NextResponse.json({
        success: true,
        method: paymentMethod,
        url: `/?checkout=success&plan=${normalizedPlan}&method=${paymentMethod}`,
        message: 'Free plan selected. Your trial is ready to begin.',
      });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || !planConfig.stripePrice) {
      return NextResponse.json({
        success: true,
        method: paymentMethod,
        url: `/?checkout=success&plan=${normalizedPlan}&method=${paymentMethod}`,
        message: 'Demo checkout activated. Add your Stripe keys to enable live payments.',
      });
    }

    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: planConfig.stripePrice,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?checkout=success&plan=${normalizedPlan}&method=${paymentMethod}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?checkout=cancel&plan=${normalizedPlan}`,
      metadata: {
        plan: normalizedPlan,
        paymentMethod,
      },
      customer_email: process.env.STRIPE_CUSTOMER_EMAIL || undefined,
      locale: 'auto',
    });

    return NextResponse.json({ url: session.url, success: true, method: paymentMethod });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Checkout failed',
      },
      { status: 500 }
    );
  }
}
