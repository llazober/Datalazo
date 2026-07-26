import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingRules = await prisma.clientTransactionHistory.findMany({
    where: {
      clientName: { contains: 'Toirak', mode: 'insensitive' }
    }
  });

  console.log(`Found ${existingRules.length} existing rules for Toirak in DB:`);
  for (const r of existingRules) {
    console.log(`ID: ${r.id} | Client: ${r.clientName} | Pattern: ${r.pattern} | Acct: ${r.accountNumber} | Name: ${r.accountName}`);
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
