# AI Executive Email Assistant

## Prerequisites
- Node.js 18+
- PostgreSQL (Datalazo database must exist)
- Google Cloud Project with Gmail API + Calendar API enabled
- OpenAI API key

## Quick Start

### 1. Configure PostgreSQL
Make sure the `Datalazo` database exists. The app will auto-create the `email_assistant` schema.

Update `.env` with your PostgreSQL credentials:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/Datalazo
```

### 2. Install dependencies
```bash
npm install          # root (concurrently)
npm install --prefix server
npm install --prefix client
```

### 3. Run database migrations
```bash
cd server
npm run db:push
```

### 4. Start development servers
```bash
npm run dev
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

### 5. Gmail Push Notifications (Optional)
For instant email push instead of 2-minute polling:
1. Create a Google Cloud Pub/Sub topic named `gmail-push-notifications`
2. Set `GOOGLE_CLOUD_PROJECT_ID` in `.env`
3. Expose `/webhooks/gmail-push` publicly (use ngrok in dev):
   ```bash
   ngrok http 3001
   ```
4. Add the ngrok URL as a Pub/Sub push subscription endpoint

## Architecture
```
client/ (React + Vite, port 3000)
server/ (Node.js + Express, port 3001)
  └── src/
      ├── db/          - Drizzle ORM schema (email_assistant schema)
      ├── routes/      - API endpoints
      ├── services/    - Gmail, OpenAI, Calendar
      └── middleware/  - Auth
```

## Voice Commands
Say any of these while the app is open:
- *"Summarize"* — hear a 1-2 sentence email summary
- *"Reply"* — start composing a reply
- *"Tell them [your message]"* — draft a professional reply
- *"Send"* / *"Yes"* — confirm sending
- *"Archive"* / *"Delete"* — manage emails
- *"Read the full email"* — hear the complete email
- *"Next email"* — navigate inbox

## Settings
Visit `/settings` to manage:
- API keys (change OpenAI key, etc.)
- Automation rules (auto-archive newsletters, etc.)
- Contact preferences (greeting/closing per contact)
- Voice preferences (speed, signature, greeting style)
