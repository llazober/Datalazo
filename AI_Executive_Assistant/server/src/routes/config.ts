import { Router, Request, Response } from 'express';
import { db } from '../db';
import { apiConfig, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const ALLOWED_KEYS = ['openai_api_key', 'google_client_id', 'google_client_secret', 'google_cloud_project_id'];

// ── Get config keys (values masked) ──────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const configs = await db.select().from(apiConfig).where(eq(apiConfig.userId, userId));

    const masked = configs.map(c => ({
      key: c.key,
      value: c.value ? `${'*'.repeat(Math.max(0, c.value.length - 6))}${c.value.slice(-6)}` : '',
      hasValue: !!c.value,
      updatedAt: c.updatedAt,
    }));

    res.json({ configs: masked });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Update a config key ────────────────────────────────────
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const key = String(req.params.key);
    const { value } = req.body;

    if (!ALLOWED_KEYS.includes(key)) {
      return res.status(400).json({ error: 'Invalid config key' });
    }
    if (!value?.trim()) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const existing = await db.select().from(apiConfig)
      .where(and(eq(apiConfig.userId, userId), eq(apiConfig.key, key))).limit(1);

    if (existing.length > 0) {
      await db.update(apiConfig)
        .set({ value: value.trim(), updatedAt: new Date() })
        .where(and(eq(apiConfig.userId, userId), eq(apiConfig.key, key)));
    } else {
      await db.insert(apiConfig).values({ userId, key, value: value.trim() });
    }

    // If updating OpenAI key, update env var in memory
    if (key === 'openai_api_key') {
      process.env.OPENAI_API_KEY = value.trim();
    }

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Get user preferences ──────────────────────────────────
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    res.json({ preferences: user?.preferences || {} });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Update user preferences ───────────────────────────────
router.put('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { preferences } = req.body;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const merged = { ...(user?.preferences as any || {}), ...preferences };
    await db.update(users).set({ preferences: merged, updatedAt: new Date() }).where(eq(users.id, userId));
    res.json({ success: true, preferences: merged });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
