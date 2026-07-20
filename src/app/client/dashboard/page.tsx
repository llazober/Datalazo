import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifySignedPayload } from '@/lib/auth-utils';
import ClientDashboardView from '@/components/ClientDashboardView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ClientDashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('client_session');

  if (!sessionCookie) {
    redirect('/client-login');
  }

  const payloadStr = verifySignedPayload(sessionCookie.value);
  if (!payloadStr) {
    redirect('/client-login');
  }

  const session = JSON.parse(payloadStr);
  const userId = session.userId;

  if (!userId) {
    redirect('/client-login');
  }

  // Fetch client user data and the associated client and invoices
  const user = await prisma.clientUser.findUnique({
    where: { id: userId },
    include: {
      client: {
        include: {
          users: {
            select: {
              username: true,
              termsAccepted: true,
              termsAcceptedAt: true,
              termsAcceptedIp: true,
            }
          }
        }
      }
    }
  });

  if (!user || !user.client) {
    redirect('/client-login');
  }

  // Fetch invoices for this specific client
  const invoices = await prisma.invoice.findMany({
    where: { clientId: user.client.id },
    orderBy: { createdAt: 'desc' }
  });

  // Serialize dates for the Client Component
  const serializedUser = {
    id: user.id,
    username: user.username,
    termsAccepted: user.termsAccepted,
    termsAcceptedAt: user.termsAcceptedAt ? user.termsAcceptedAt.toISOString() : null,
    termsAcceptedIp: user.termsAcceptedIp,
    monthlyUsageActual: user.monthlyUsageActual,
    monthlyUsagePrevious: user.monthlyUsagePrevious,
    clientId: user.clientId,
    client: {
      id: user.client.id,
      name: user.client.name,
      company: user.client.company,
      email: user.client.email,
      users: user.client.users.map(u => ({
        username: u.username,
        termsAccepted: u.termsAccepted,
        termsAcceptedAt: u.termsAcceptedAt ? u.termsAcceptedAt.toISOString() : null,
        termsAcceptedIp: u.termsAcceptedIp,
      }))
    }
  };

  const serializedInvoices = invoices.map(invoice => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount,
    status: invoice.status,
    createdAt: invoice.createdAt.toISOString(),
    items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items
  }));

  return (
    <ClientDashboardView 
      initialUser={serializedUser} 
      invoices={serializedInvoices} 
    />
  );
}
