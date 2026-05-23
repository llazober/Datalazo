import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

export async function POST(req: Request) {
  try {
    const { clientId, amount, serviceName, billingInterval } = await req.json();

    if (!clientId || !amount || !serviceName) {
      return NextResponse.json({ error: 'Missing required checkout details' }, { status: 400 });
    }

    // 1. Fetch client details
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 2. Create Stripe Customer if not already exists
    let stripeCustomerId = client.stripeCustomerId;
    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: client.email,
        name: client.name,
        phone: client.phone || undefined,
        metadata: {
          clientId: client.id
        }
      });
      stripeCustomerId = stripeCustomer.id;
      
      // Update database
      await prisma.client.update({
        where: { id: client.id },
        data: { stripeCustomerId }
      });
    }

    // 3. Create a temporary product and price for the subscription
    const product = await stripe.products.create({
      name: serviceName,
      metadata: {
        clientId: client.id
      }
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      currency: 'usd',
      recurring: {
        interval: billingInterval || 'month', // 'month' or 'year'
      },
    });

    // 4. Create Checkout Session
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/clients?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/dashboard/clients?success=false`,
      metadata: {
        clientId: client.id,
        amount: amount,
        services: serviceName,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
