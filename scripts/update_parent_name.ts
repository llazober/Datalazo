import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Updating ClientChartOfAccounts parentName to "VRT Services"...');
  const coaResult = await prisma.clientChartOfAccounts.updateMany({
    data: {
      parentName: 'VRT Services',
    },
  });
  console.log(`Updated ${coaResult.count} ClientChartOfAccounts records.`);

  console.log('Updating ClientTransactionHistory parentName to "VRT Services"...');
  const historyResult = await prisma.clientTransactionHistory.updateMany({
    data: {
      parentName: 'VRT Services',
    },
  });
  console.log(`Updated ${historyResult.count} ClientTransactionHistory records.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error updating parentName:', err);
  process.exit(1);
});
