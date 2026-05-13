const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const docs = await prisma.document.findMany();
  const chunks = await prisma.documentChunk.count();
  console.log('DOCS:', JSON.stringify(docs, null, 2));
  console.log('CHUNKS:', chunks);
  process.exit(0);
}

check();
