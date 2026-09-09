import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding initial recurring billing schedules & invoices for existing clients...');

  const clients = await prisma.client.findMany({ take: 5 });
  if (clients.length === 0) {
    console.log('No clients found in Client table. Skipping demo billing seed.');
    return;
  }

  for (let i = 0; i < clients.length; i++) {
    const c = clients[i];
    const existingSched = await prisma.customerBillingSchedule.findFirst({
      where: { clientId: c.id }
    });

    if (!existingSched) {
      const amount = (i + 1) * 350.0;
      const day = (i * 5) + 1;
      const sched = await prisma.customerBillingSchedule.create({
        data: {
          clientId: c.id,
          billingAmount: amount,
          billingDay: day > 28 ? 28 : day,
          description: 'Monthly Advisory, Bookkeeping & Software Retainer',
          autoSend: true,
          paymentTermsDays: 15,
          status: 'Active'
        }
      });
      console.log(`Created Recurring Schedule for Client "${c.company || c.name}": $${amount}/mo on Day ${sched.billingDay}`);

      // Create an initial invoice
      const invNumber = `INV-2026-100${i + 1}`;
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 15);

      await prisma.customerInvoice.create({
        data: {
          invoiceNumber: invNumber,
          clientId: c.id,
          scheduleId: sched.id,
          amount: amount,
          taxAmount: 0.0,
          totalAmount: amount,
          status: i === 0 ? 'PAID' : 'SENT',
          paidAt: i === 0 ? today : null,
          paymentMethod: i === 0 ? 'ACH / Bank Transfer' : null,
          issueDate: today,
          dueDate: dueDate,
          description: 'Monthly Advisory, Bookkeeping & Software Retainer'
        }
      });
      console.log(`Created Initial Invoice ${invNumber} for Client "${c.company || c.name}"`);
    } else {
      console.log(`Schedule already exists for Client "${c.company || c.name}".`);
    }
  }

  console.log('Demo billing seeding completed.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error seeding demo billing data:', err);
  process.exit(1);
});
