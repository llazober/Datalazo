import fs from 'fs';
import path from 'path';

interface DatalazoConfig {
  resendApiKey?: string;
  senderName?: string;
  senderEmail?: string;
  agencyName?: string;
  apifyApiKey?: string;
}

export function getDatalazoConfig(): DatalazoConfig {
  try {
    const configPath = path.join(process.cwd(), 'datalazo.config.json');
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(fileContent) as DatalazoConfig;
    }
  } catch (err) {
    console.warn('Could not load datalazo.config.json, falling back to environment variables.');
  }
  return {};
}
