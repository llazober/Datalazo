import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'datalazo-client-secret-key-change-in-prod-2026';

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
