import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';


export async function processDocument(documentId: string, text: string) {
  try {
    console.log(`Processing document ${documentId}...`);
    
    // 1. Update status to PROCESSING
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING', content: text },
    });

    // 2. Chunking (Simple approach: ~1000 chars with overlap)
    const chunkSize = 1000;
    const overlap = 200;
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    console.log(`Split into ${chunks.length} chunks.`);

    // 3. Generate Embeddings & Save
    for (const chunkContent of chunks) {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunkContent,
      });

      const embedding = response.data[0].embedding;

      await prisma.documentChunk.create({
        data: {
          documentId,
          content: chunkContent,
          embedding: embedding as any, // Saving as JSON
        },
      });
    }

    // 4. Update status to READY
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'READY' },
    });

    console.log(`Document ${documentId} is now READY.`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error processing document ${documentId}:`, errorMessage);
    
    await prisma.document.update({
      where: { id: documentId },
      data: { status: `ERROR: ${errorMessage.slice(0, 30)}` },
    });
    throw error;
  }
}
