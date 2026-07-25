import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { NextRequest } from 'next/server';

const SESSION_SECRET = process.env.SESSION_SECRET || 'datalazo-client-secret-key-change-in-prod-2026';

/**
 * Helper to check if an IP address is a private/internal network IP (e.g. 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.0.0.1)
 */
function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const cleanIp = ip.trim().replace(/^::ffff:/, '');
  if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp.toLowerCase() === 'localhost') return true;

  // IPv4 Private Ranges:
  // 10.0.0.0 - 10.255.255.255 (10.0.0.0/8)
  // 172.16.0.0 - 172.31.255.255 (172.16.0.0/12)
  // 192.168.0.0 - 192.168.255.255 (192.168.0.0/16)
  // 169.254.0.0 - 169.254.255.255 (Link-local)
  const parts = cleanIp.split('.').map(Number);
  if (parts.length === 4 && parts.every(p => !isNaN(p))) {
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 127) return true;
  }
  return false;
}

/**
 * Extract the accurate public client IP address from a request, filtering out private proxy IPs
 */
export function getClientIp(req: NextRequest | Request): string {
  const candidateIps: string[] = [];

  // 1. Cloudflare & Akamai headers
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) candidateIps.push(cfIp);

  const trueClientIp = req.headers.get('true-client-ip');
  if (trueClientIp) candidateIps.push(trueClientIp);

  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) candidateIps.push(xRealIp);

  const xClientIp = req.headers.get('x-client-ip');
  if (xClientIp) candidateIps.push(xClientIp);

  const xClusterClientIp = req.headers.get('x-cluster-client-ip');
  if (xClusterClientIp) candidateIps.push(xClusterClientIp);

  // 2. Standard X-Forwarded-For header chain
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const list = xForwardedFor.split(',').map(s => s.trim());
    candidateIps.push(...list);
  }

  // 3. Request object ip property if attached by edge or middleware
  const requestWithIp = req as { ip?: string };
  if (requestWithIp.ip && typeof requestWithIp.ip === 'string') {
    candidateIps.push(requestWithIp.ip);
  }

  // Find the first non-private public IP address
  for (const rawIp of candidateIps) {
    const cleaned = rawIp.trim().replace(/^::ffff:/, '');
    if (cleaned && !isPrivateIp(cleaned)) {
      return cleaned;
    }
  }

  // Fallback: If all candidates are private IPs (e.g. local dev / internal VPC testing), return the first non-empty candidate
  for (const rawIp of candidateIps) {
    const cleaned = rawIp.trim().replace(/^::ffff:/, '');
    if (cleaned) return cleaned;
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
