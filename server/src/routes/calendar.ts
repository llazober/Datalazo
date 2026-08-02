import { Router, Request, Response } from 'express';
import { checkAvailability, getUpcomingEvents, createEvent } from '../services/calendar.service';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/events', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const events = await getUpcomingEvents(userId, 10);
    res.json({ events });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/check-availability', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { startTime, endTime } = req.body;
    const result = await checkAvailability(userId, startTime, endTime);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/events', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { title, startTime, endTime, attendeeEmails, location, description } = req.body;
    const event = await createEvent(userId, { title, startTime, endTime, attendeeEmails, location, description });
    res.json({ event });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
