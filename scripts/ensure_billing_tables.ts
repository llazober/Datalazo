import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Ensuring CustomerBillingSchedule and CustomerInvoice tables exist in PostgreSQL...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CustomerBillingSchedule" (
        "id" TEXT PRIMARY KEY,
        "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
        "billingAmount" DOUBLE PRECISION NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'USD',
        "billingDay" INTEGER NOT NULL,
        "description" TEXT NOT NULL,
        "autoSend" BOOLEAN NOT NULL DEFAULT true,
        "paymentTermsDays" INTEGER NOT NULL DEFAULT 15,
        "status" TEXT NOT NULL DEFAULT 'Active',
        "lastBilledAt" TIMESTAMP(3),
        "nextBillingDate" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CustomerInvoice" (
        "id" TEXT PRIMARY KEY,
        "invoiceNumber" TEXT UNIQUE NOT NULL,
        "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
        "scheduleId" TEXT REFERENCES "CustomerBillingSchedule"("id") ON DELETE SET NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        "totalAmount" DOUBLE PRECISION NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'SENT',
        "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dueDate" TIMESTAMP(3) NOT NULL,
        "paidAt" TIMESTAMP(3),
        "paymentMethod" TEXT,
        "transactionRef" TEXT,
        "notes" TEXT,
        "description" TEXT,
        "itemsJson" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomerBillingSchedule_clientId_idx" ON "CustomerBillingSchedule"("clientId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomerBillingSchedule_billingDay_idx" ON "CustomerBillingSchedule"("billingDay");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomerBillingSchedule_status_idx" ON "CustomerBillingSchedule"("status");`);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomerInvoice_clientId_idx" ON "CustomerInvoice"("clientId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomerInvoice_status_idx" ON "CustomerInvoice"("status");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomerInvoice_scheduleId_idx" ON "CustomerInvoice"("scheduleId");`);

  console.log('Successfully initialized CustomerBillingSchedule and CustomerInvoice tables in PostgreSQL database.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error creating billing tables:', err);
  process.exit(1);
});
