import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getDatalazoConfig } from '@/lib/config';

export async function POST(req: Request) {
  const config = getDatalazoConfig();
  const stripe = new Stripe(config.stripeSecretKey || process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    const webhookSecret = config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || '';
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Stripe Webhook Signature Verification Failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clientId = session.metadata?.clientId;
        const stripeSubId = session.subscription as string;
        const stripeCustomerId = session.customer as string;
        const recurringAmount = session.metadata?.amount ? parseFloat(session.metadata.amount) : undefined;
        const services = session.metadata?.services;

        if (clientId) {
          await prisma.client.update({
            where: { id: clientId },
            data: {
              stripeSubId,
              stripeCustomerId,
              stripeStatus: 'active',
              recurringAmount,
              services: services || undefined
            }
          });
          console.log(`Stripe Webhook: Client ${clientId} subscribed successfully.`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubId = subscription.id;
        const stripeStatus = subscription.status;

        // Try to update client with this subscription
        const client = await prisma.client.findFirst({
          where: { stripeSubId }
        });

        if (client) {
          await prisma.client.update({
            where: { id: client.id },
            data: { stripeStatus }
          });
          console.log(`Stripe Webhook: Client ${client.id} subscription status updated to ${stripeStatus}.`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubId = subscription.id;

        const client = await prisma.client.findFirst({
          where: { stripeSubId }
        });

        if (client) {
          await prisma.client.update({
            where: { id: client.id },
            data: { stripeStatus: 'canceled' }
          });
          console.log(`Stripe Webhook: Client ${client.id} subscription was canceled.`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const stripeSubId = invoice.subscription as string;
        const amountPaid = invoice.amount_paid / 100; // Convert cents to dollars

        if (stripeSubId) {
          const client = await prisma.client.findFirst({
            where: { stripeSubId }
          });

          if (client) {
            await prisma.client.update({
              where: { id: client.id },
              data: {
                totalPayment: {
                  increment: amountPaid
                },
                paymentDate: new Date()
              }
            });
            console.log(`Stripe Webhook: Client ${client.id} payment of $${amountPaid} succeeded. Total payment updated.`);
          }
        }
        break;
      }

      default:
        console.log(`Stripe Webhook: Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe Webhook Execution Error:', error);
    return NextResponse.json({ error: 'Internal Webhook Handler Error' }, { status: 500 });
  }
}
