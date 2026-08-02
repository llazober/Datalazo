import { Router, Request, Response } from 'express';
import { db } from '../db';
import { automationRules } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const rules = await db.select().from(automationRules).where(eq(automationRules.userId, userId));
  res.json({ rules });
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { name, description, triggerType, triggerValue, action, actionValue, requiresConfirmation } = req.body;
    const [rule] = await db.insert(automationRules).values({
      userId, name, description, triggerType, triggerValue, action,
      actionValue, requiresConfirmation: requiresConfirmation || false,
    }).returning();
    res.json({ rule });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const id = String(req.params.id);
    const { isActive, name, description, triggerType, triggerValue, action, actionValue } = req.body;
    await db.update(automationRules)
      .set({ isActive, name, description, triggerType, triggerValue, action, actionValue, updatedAt: new Date() })
      .where(and(eq(automationRules.id, id), eq(automationRules.userId, userId)));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const id = String(req.params.id);
    await db.delete(automationRules)
      .where(and(eq(automationRules.id, id), eq(automationRules.userId, userId)));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
