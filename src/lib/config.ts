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
      const config = JSON.parse(fileContent) as DatalazoConfig;
      
      // Defensively strip out placeholder templates to allow environment fallback
      if (config.apifyApiKey && (config.apifyApiKey.includes('YOUR_APIFY_API_KEY_HERE') || config.apifyApiKey === '')) {
        delete config.apifyApiKey;
      }
      if (config.resendApiKey && (config.resendApiKey.includes('YOUR_RESEND_API_KEY_HERE') || config.resendApiKey === '')) {
        delete config.resendApiKey;
      }

      return config;
    }
  } catch (err) {
    console.warn('Could not load datalazo.config.json, falling back to environment variables.');
  }
  return {};
}
