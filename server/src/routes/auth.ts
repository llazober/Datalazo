import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { syncInbox } from '../services/email.service';
import { listSentMessages, getMessage, extractBody } from '../services/gmail.service';
import { learnWritingStyle } from '../services/ai.service';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar',
  'profile',
  'email',
];

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || '';
        const [existing] = await db.select().from(users).where(eq(users.googleId, profile.id)).limit(1);

        let userId: string;
        if (existing) {
          await db.update(users).set({
            accessToken,
            refreshToken: refreshToken || existing.refreshToken,
            tokenExpiry: new Date(Date.now() + 3600 * 1000),
            updatedAt: new Date(),
          }).where(eq(users.id, existing.id));
          userId = existing.id;
        } else {
          const [created] = await db.insert(users).values({
            googleId: profile.id,
            email,
            name: profile.displayName || email,
            picture: profile.photos?.[0]?.value,
            accessToken,
            refreshToken,
            tokenExpiry: new Date(Date.now() + 3600 * 1000),
          }).returning({ id: users.id });
          userId = created.id;

          // One-time: learn writing style from sent mail
          setTimeout(async () => {
            try {
              const sentMsgs = await listSentMessages(userId, 30);
              const emailBodies = await Promise.all(
                sentMsgs.slice(0, 20).map(async (m) => {
                  const full = await getMessage(userId, m.id!);
                  const body = extractBody(full);
                  const subject = full.payload?.headers?.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
                  return { subject, body: body.text || body.html };
                })
              );
              await learnWritingStyle(userId, emailBodies);
              console.log(`[Auth] Writing style learned for ${email}`);
            } catch (e) {
              console.error('[Auth] Style learning error:', e);
            }
          }, 2000);
        }

        // Kick off initial inbox sync
        setTimeout(() => syncInbox(userId, 30).catch(console.error), 1000);

        done(null, { id: userId, email, name: profile.displayName, picture: profile.photos?.[0]?.value });
      } catch (e) {
        done(e as Error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    done(null, user || false);
  } catch (e) {
    done(e);
  }
});

const router = Router();

router.get('/google', passport.authenticate('google', { scope: SCOPES, accessType: 'offline', prompt: 'consent' }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.VITE_API_URL?.replace('3001','3000') || 'http://localhost:3000'}/login?error=auth_failed` }),
  (req: Request, res: Response) => {
    res.redirect(process.env.VITE_API_URL?.replace('3001','3000') || 'http://localhost:3000');
  }
);

router.get('/me', (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  const u = req.user as any;
  res.json({ id: u.id, email: u.email, name: u.name, picture: u.picture });
});

router.post('/logout', (req: Request, res: Response) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
});

export default router;
