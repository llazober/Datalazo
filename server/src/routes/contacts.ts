import { Router, Request, Response } from 'express';
import { db } from '../db';
import { contacts } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const result = await db.select().from(contacts).where(eq(contacts.userId, userId)).orderBy(desc(contacts.emailCount));
  res.json({ contacts: result });
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const contactId = String(req.params.id);
    const { preferredGreeting, preferredClosing, communicationStyle, typicalResponseLength, notes } = req.body;
    await db.update(contacts)
      .set({ preferredGreeting, preferredClosing, communicationStyle, typicalResponseLength, notes, updatedAt: new Date() })
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
