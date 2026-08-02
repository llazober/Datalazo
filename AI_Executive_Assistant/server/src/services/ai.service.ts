import OpenAI from 'openai';
import { db } from '../db';
import { styleMemory, contacts, conversationContext, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { ChatMessage, EmailCategory, EmailPriority } from '../db/schema';

let _openai: OpenAI | null = null;

export function getOpenAIClient(apiKey?: string): OpenAI {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OpenAI API key not configured');
  if (!_openai || apiKey) {
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

const EXECUTIVE_ASSISTANT_SYSTEM_PROMPT = `You are a highly efficient AI Executive Email Assistant.
Your purpose is to help your boss process emails completely hands-free through natural voice commands.

PERSONALITY: Professional, concise, friendly, efficient, proactive, organized.
Never produce long explanations unless requested. Speak naturally as if you were a human executive assistant.

SPEECH STYLE:
- Keep responses under 20 seconds when spoken (roughly 60-80 words).
- Only expand if the user asks.
- Use natural spoken language, not formal written language.
- Avoid AI clichés like "Certainly!", "Of course!", "Absolutely!".
- Never start a response with a filler word.

SAFETY RULES:
- Never invent facts, dates, prices, commitments, or availability.
- If information is missing, ask the user.
- Always confirm before executing: send, delete, archive, forward.
- Never send an email without explicit approval unless an automation rule exists.

WRITING STYLE FOR DRAFTS:
- Write like a professional business executive.
- Prefer clear, direct sentences. Avoid unnecessary words.
- Avoid overly enthusiastic language.
- Mirror the user's typical writing style as learned from their history.`;

export interface EmailAnalysis {
  category: EmailCategory;
  priority: EmailPriority;
  summary: string;
  hasMeetingRequest: boolean;
  meetingDetails?: {
    proposedTime?: string;
    duration?: number;
    location?: string;
  };
  suggestedActions: string[];
}

export async function analyzeEmail(
  from: string,
  subject: string,
  body: string,
  userId: string
): Promise<EmailAnalysis> {
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `${EXECUTIVE_ASSISTANT_SYSTEM_PROMPT}

Analyze the following email and return a JSON object with these exact fields:
{
  "category": one of ["Customer","Vendor","Accounting","Banking","Personal","Internal","Marketing","Newsletter","Spam","Unknown"],
  "priority": one of ["Critical","High","Medium","Low"],
  "summary": "One or two sentence spoken summary. Start with 'New email from [sender name]...'",
  "hasMeetingRequest": boolean,
  "meetingDetails": { "proposedTime": "string or null", "duration": number in minutes or null, "location": "string or null" },
  "suggestedActions": ["array of 3-5 suggested action strings like Reply, Archive, Schedule meeting, etc."]
}`,
      },
      {
        role: 'user',
        content: `From: ${from}\nSubject: ${subject}\n\n${body.substring(0, 3000)}`,
      },
    ],
  });

  const text = response.choices[0].message.content || '{}';
  try {
    return JSON.parse(text) as EmailAnalysis;
  } catch {
    return {
      category: 'Unknown',
      priority: 'Medium',
      summary: `New email from ${from} about "${subject}".`,
      hasMeetingRequest: false,
      suggestedActions: ['Reply', 'Archive', 'Ignore'],
    };
  }
}

export async function generateReply(
  originalEmail: { from: string; subject: string; body: string },
  userInstruction: string,
  userId: string
): Promise<string> {
  const openai = getOpenAIClient();

  // Fetch style memory and contact preferences
  const [styleSamples, contactPrefs] = await Promise.all([
    db.select().from(styleMemory).where(eq(styleMemory.userId, userId)).limit(10),
    db.select().from(contacts).where(eq(contacts.userId, userId)).limit(50),
  ]);

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const contact = contactPrefs.find(c => originalEmail.from.includes(c.email));

  const styleContext = styleSamples.length > 0
    ? `\nUSER'S WRITING STYLE SAMPLES:\n${styleSamples.slice(0, 3).map(s => s.content).join('\n---\n')}`
    : '';

  const contactContext = contact
    ? `\nCONTACT PREFERENCES for ${contact.email}:
- Greeting: ${contact.preferredGreeting}
- Closing: ${contact.preferredClosing}
- Style: ${contact.communicationStyle}
- Length: ${contact.typicalResponseLength}`
    : '';

  const prefs = user?.preferences as any;
  const sigContext = prefs?.defaultSignature
    ? `\nUSER'S SIGNATURE:\n${prefs.defaultSignature}`
    : '';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: `${EXECUTIVE_ASSISTANT_SYSTEM_PROMPT}
${styleContext}${contactContext}${sigContext}

Generate ONLY the email body text. Do not include Subject:, To:, or From: headers.
Do not include any explanation. Just the email body ready to send.
Match the user's writing style. Keep it professional and concise.
Do not invent facts. Base the reply ONLY on what the user instructed.`,
      },
      {
        role: 'user',
        content: `ORIGINAL EMAIL:\nFrom: ${originalEmail.from}\nSubject: ${originalEmail.subject}\n\n${originalEmail.body.substring(0, 2000)}

USER'S INSTRUCTION: ${userInstruction}

Write the reply email body:`,
      },
    ],
  });

  return response.choices[0].message.content?.trim() || '';
}

export async function processVoiceCommand(
  transcript: string,
  currentEmailContext: {
    emailId?: string;
    from?: string;
    subject?: string;
    summary?: string;
  },
  sessionHistory: ChatMessage[],
  userId: string
): Promise<{
  response: string;
  action?: {
    type: string;
    params?: Record<string, unknown>;
  };
}> {
  const openai = getOpenAIClient();

  const contextStr = currentEmailContext.emailId
    ? `CURRENT EMAIL CONTEXT:\n- From: ${currentEmailContext.from}\n- Subject: ${currentEmailContext.subject}\n- Summary: ${currentEmailContext.summary}`
    : 'No email currently selected.';

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `${EXECUTIVE_ASSISTANT_SYSTEM_PROMPT}

${contextStr}

You are processing a voice command from your boss. Respond naturally (as if spoken) AND return a JSON action if needed.

Return ONLY a JSON object with this structure:
{
  "response": "Your spoken response (short, natural, conversational)",
  "action": {
    "type": "one of: read_email|summarize|reply|forward|archive|delete|star|mark_unread|next_email|previous_email|schedule_meeting|search|ignore|draft_reply|none",
    "params": {}
  }
}

Action types:
- reply: ask user what to say
- draft_reply: user provided the content, draft it now
- forward: params.to = email address
- archive: archive current email
- delete: delete current email
- mark_unread: mark as unread
- star: star the email
- read_email: read the full email body
- summarize: re-summarize the email
- next_email: move to next email
- previous_email: move to previous
- schedule_meeting: check calendar and create meeting
- search: params.query = search terms
- ignore: do nothing`,
    },
    ...sessionHistory.slice(-6).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: transcript },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    response_format: { type: 'json_object' },
    messages,
  });

  const text = response.choices[0].message.content || '{}';
  try {
    return JSON.parse(text);
  } catch {
    return {
      response: "I didn't quite catch that. Could you please repeat your command?",
      action: { type: 'none' },
    };
  }
}

export async function learnWritingStyle(userId: string, sentEmails: Array<{ subject: string; body: string }>): Promise<string> {
  const openai = getOpenAIClient();

  const emailSamples = sentEmails.slice(0, 20).map(e => `Subject: ${e.subject}\n\n${e.body}`).join('\n\n---\n\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: `Analyze these sent emails and extract a concise writing style profile. 
Return a JSON with these fields:
{
  "tone": "formal/semi-formal/casual",
  "averageLength": "short/medium/long",
  "commonGreetings": ["list"],
  "commonClosings": ["list"],
  "characteristics": ["3-5 distinctive style traits"],
  "avoidances": ["things this person never does in emails"],
  "styleGuide": "2-3 sentence summary of how to write like this person"
}`,
      },
      { role: 'user', content: emailSamples },
    ],
    response_format: { type: 'json_object' },
  });

  const styleProfile = response.choices[0].message.content || '{}';

  // Save style samples to DB
  await Promise.all(
    sentEmails.slice(0, 10).map(e =>
      db.insert(styleMemory).values({
        userId,
        sampleType: 'sent_email',
        content: `Subject: ${e.subject}\n\n${e.body.substring(0, 500)}`,
      }).onConflictDoNothing()
    )
  );

  // Update user's style profile
  await db.update(users)
    .set({ styleProfile: JSON.parse(styleProfile), updatedAt: new Date() })
    .where(eq(users.id, userId));

  return styleProfile;
}

export async function updateConversationContext(
  userId: string,
  userMessage: string,
  assistantResponse: string,
  currentEmailId?: string
): Promise<void> {
  const newMessage: ChatMessage = { role: 'user', content: userMessage, timestamp: new Date().toISOString() };
  const newResponse: ChatMessage = { role: 'assistant', content: assistantResponse, timestamp: new Date().toISOString() };

  const [existing] = await db.select().from(conversationContext).where(eq(conversationContext.userId, userId)).limit(1);

  if (existing) {
    const messages = [...(existing.sessionMessages as ChatMessage[] || []), newMessage, newResponse].slice(-20);
    await db.update(conversationContext)
      .set({ sessionMessages: messages, currentEmailId: currentEmailId || existing.currentEmailId, updatedAt: new Date() })
      .where(eq(conversationContext.userId, userId));
  } else {
    await db.insert(conversationContext).values({
      userId,
      currentEmailId,
      sessionMessages: [newMessage, newResponse],
    });
  }
}
