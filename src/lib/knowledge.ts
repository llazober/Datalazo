import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function searchKnowledge(query: string) {
  try {
    // 1. Embed the query
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const queryEmbedding = response.data[0].embedding;

    // 2. Fetch all chunks
    const chunks = await prisma.documentChunk.findMany({
      include: { document: true }
    });

    // 3. Similarity check
    const similarity = (vecA: any, vecB: any) => {
      if (!Array.isArray(vecA) || !Array.isArray(vecB)) return 0;
      const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
      const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
      const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
      if (magA === 0 || magB === 0) return 0;
      return dotProduct / (magA * magB);
    };

    const results = chunks
      .map(chunk => {
        const chunkEmbedding = Array.isArray(chunk.embedding) ? chunk.embedding : [];
        const score = similarity(queryEmbedding, chunkEmbedding);
        const lowerQuery = query.toLowerCase();
        const lowerContent = chunk.content.toLowerCase();
        const triggerWords = ['price', 'cost', 'fee', 'package', 'service', 'bot', 'ai', 'setup', 'cuanto', 'precio', 'costo'];
        const hasTrigger = triggerWords.some(word => lowerQuery.includes(word) && lowerContent.includes(word));
        
        return {
          content: chunk.content,
          documentName: chunk.document.name,
          score: hasTrigger ? Math.max(score, 0.8) : score 
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter(r => r.score > 0.15);

    if (results.length === 0) return null;

    return results.map(r => `[From ${r.documentName}]: ${r.content}`).join('\n\n---\n\n');
  } catch (error) {
    console.error('Knowledge Search Error:', error);
    return null;
  }
}
