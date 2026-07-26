import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const clientsToAdd = [
    {
      name: "Toirak's Group Homes Inc",
      company: "Toirak's Group Homes Inc",
      email: "info@toirakgrouphomes.com",
      services: "Accounting & Tax Services",
    },
    {
      name: "D'Payano Barber Shop",
      company: "D'Payano Barber Shop",
      email: "info@dpayanobarbershop.com",
      services: "Accounting & Tax Services",
    },
  ];

  for (const c of clientsToAdd) {
    const existing = await prisma.client.findFirst({
      where: {
        OR: [
          { company: { equals: c.company, mode: 'insensitive' } },
          { name: { equals: c.name, mode: 'insensitive' } },
          { email: { equals: c.email, mode: 'insensitive' } }
        ]
      }
    });

    if (!existing) {
      const created = await prisma.client.create({
        data: {
          name: c.name,
          company: c.company,
          email: c.email,
          services: c.services,
        }
      });
      console.log(`Created Client: ID ${created.id} | Name: "${created.name}" | Company: "${created.company}"`);
    } else {
      console.log(`Client already exists: ID ${existing.id} | Company: "${existing.company}"`);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error adding clients:', err);
  process.exit(1);
});
