import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

/**
 * Returns the 32-byte key from the CALENDAR_TOKEN_KEY env variable.
 * Throws at startup if not configured or wrong length.
 */
export function getCalendarKey(): Buffer {
  const raw = process.env.CALENDAR_TOKEN_KEY;
  if (!raw) {
    throw new Error('CALENDAR_TOKEN_KEY env variable is not set');
  }
  const key = Buffer.from(raw, 'hex');
  if (key.length !== 32) {
    throw new Error(
      `CALENDAR_TOKEN_KEY must be a 64-character hex string (32 bytes). Got ${key.length} bytes.`,
    );
  }
  return key;
}

/** Encrypt plaintext → base64 string (iv + ciphertext + authTag) */
export function encrypt(plaintext: string): string {
  const key = getCalendarKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString('base64');
}

/** Decrypt base64 string → plaintext */
export function decrypt(ciphertext: string): string {
  const key = getCalendarKey();
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - TAG_LEN);
  const encrypted = buf.subarray(IV_LEN, buf.length - TAG_LEN);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
