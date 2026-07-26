import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const clients = await prisma.client.findMany();
  console.log(`Found ${clients.length} clients in database:`);
  for (const c of clients) {
    console.log(`- ID: ${c.id} | Name: "${c.name}" | Company: "${c.company}"`);
  }

  // Add default mappings under parentName "VRT Services" for Toirak's Group Homes Inc and D'Payano Barber Shop
  const mappingsToAdd = [
    { parentName: 'VRT Services', clientName: "Toirak's Group Homes Inc" },
    { parentName: 'VRT Services', clientName: "D'Payano Barber Shop" },
  ];

  for (const m of mappingsToAdd) {
    const result = await prisma.parentClientMap.upsert({
      where: {
        parentName_clientName: {
          parentName: m.parentName,
          clientName: m.clientName,
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        parentName: m.parentName,
        clientName: m.clientName,
      },
    });
    console.log(`Upserted mapping: ID ${result.id} | Parent: "${result.parentName}" -> Client: "${result.clientName}"`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error adding parent mappings:', err);
  process.exit(1);
});
