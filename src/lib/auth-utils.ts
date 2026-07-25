import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { NextRequest } from 'next/server';

const SESSION_SECRET = process.env.SESSION_SECRET || 'datalazo-client-secret-key-change-in-prod-2026';

/**
 * Extract the accurate client IP address from a request, handling proxies and headers
 */
export function getClientIp(req: NextRequest | Request): string {
  // 1. Cloudflare header
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) {
    return cfIp.trim();
  }

  // 2. Standard x-forwarded-for header (first IP in chain)
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  // 3. Nginx / Vercel real IP header
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp && xRealIp.trim()) {
    return xRealIp.trim();
  }

  // 4. Request ip property if attached by edge or middleware
  const requestWithIp = req as { ip?: string };
  if (requestWithIp.ip && typeof requestWithIp.ip === 'string') {
    return requestWithIp.ip.trim();
  }

  return '127.0.0.1';
}

/**
 * Extract the host (subdomain / domain) from request headers
 */
export function getClientHost(req: NextRequest | Request): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  return host.split(':')[0].toLowerCase();
}

/**
 * Determine the root cookie domain for *.datalazo.net wildcard support
 */
export function getCookieDomain(req: NextRequest | Request): string | undefined {
  const host = getClientHost(req);
  if (host.endsWith('datalazo.net')) {
    return '.datalazo.net';
  }
  return undefined;
}

/**
 * Hash a password using scrypt and a random salt
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hashedPassword = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hashedPassword}`;
}

/**
 * Verify a password against a stored scrypt hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, key] = parts;
    const hashedBuffer = scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    return timingSafeEqual(hashedBuffer, keyBuffer);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Sign a payload with HMAC-SHA256
 */
export function signPayload(payload: string): string {
  const hmac = createHmac('sha256', SESSION_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return `${payload}.${signature}`;
}

/**
 * Verify a signed payload and return the original value if valid
 */
export function verifySignedPayload(signed: string): string | null {
  try {
    const parts = signed.split('.');
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    
    const hmac = createHmac('sha256', SESSION_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedSigBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (sigBuffer.length === expectedSigBuffer.length && timingSafeEqual(sigBuffer, expectedSigBuffer)) {
      return payload;
    }
  } catch (error) {
    console.error('Session verification error:', error);
  }
  return null;
}
