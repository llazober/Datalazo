import { google, calendar_v3 } from 'googleapis';
import { getGmailClient } from './gmail.service';
import { createOAuth2Client } from './gmail.service';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

async function getCalendarClient(userId: string): Promise<calendar_v3.Calendar> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.accessToken) throw new Error('Not authenticated');

  const auth = createOAuth2Client();
  auth.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
    expiry_date: user.tokenExpiry ? user.tokenExpiry.getTime() : undefined,
  });

  return google.calendar({ version: 'v3', auth });
}

export async function checkAvailability(
  userId: string,
  startTime: string,
  endTime: string
): Promise<{ available: boolean; conflictingEvents: calendar_v3.Schema$Event[] }> {
  const calendar = await getCalendarClient(userId);

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: startTime,
      timeMax: endTime,
      items: [{ id: 'primary' }],
    },
  });

  const busy = res.data.calendars?.primary?.busy || [];
  return {
    available: busy.length === 0,
    conflictingEvents: busy.map(b => ({ start: { dateTime: b.start }, end: { dateTime: b.end } })),
  };
}

export async function getUpcomingEvents(userId: string, maxResults = 10): Promise<calendar_v3.Schema$Event[]> {
  const calendar = await getCalendarClient(userId);
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return res.data.items || [];
}

export async function createEvent(
  userId: string,
  params: {
    title: string;
    startTime: string;
    endTime: string;
    attendeeEmails: string[];
    location?: string;
    description?: string;
  }
): Promise<calendar_v3.Schema$Event> {
  const calendar = await getCalendarClient(userId);
  const res = await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: 'all',
    requestBody: {
      summary: params.title,
      location: params.location,
      description: params.description,
      start: { dateTime: params.startTime, timeZone: 'America/New_York' },
      end: { dateTime: params.endTime, timeZone: 'America/New_York' },
      attendees: params.attendeeEmails.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
    conferenceDataVersion: 1,
  });
  return res.data;
}
