/**
 * Generate a prefixed UUID.
 */
export function generateId(prefix = ''): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

/**
 * Generate a cryptographically random API key.
 *
 * The key contains 32 random bytes represented with a base64url alphabet.
 * This provides 256 bits of random input entropy.
 */
export function generateApiKey(isTest = false): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);

  const encoded = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `im_${isTest ? 'test' : 'live'}_${encoded}`;
}

export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.slice(0, 16);
}

export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hash));
}

export async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return bytesToHex(new Uint8Array(signature));
}

export async function hashPassword(
  password: string,
  salt?: string
): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const saltBytes = salt === undefined
    ? crypto.getRandomValues(new Uint8Array(16))
    : hexToBytes(salt, 16);

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    passwordKey,
    256
  );

  return {
    hash: bytesToHex(new Uint8Array(derivedBits)),
    salt: bytesToHex(saltBytes),
  };
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  try {
    const result = await hashPassword(password, salt);
    return timingSafeEqual(result.hash, hash);
  } catch {
    return false;
  }
}

function hexToBytes(hex: string, expectedBytes: number): Uint8Array {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length !== expectedBytes * 2) {
    throw new Error('Invalid hexadecimal value');
  }

  const bytes = new Uint8Array(expectedBytes);
  for (let i = 0; i < expectedBytes; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time comparison for two strings.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let result = a.length ^ b.length;

  for (let i = 0; i < length; i += 1) {
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }

  return result === 0;
}

export function encodeCursor(data: Record<string, unknown>): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function decodeCursor<T = Record<string, unknown>>(cursor: string): T | null {
  try {
    const normalized = cursor.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

export function estimateTokens(text: string): number {
  return Math.max(0, Math.ceil(text.length / 4));
}

export function truncate(text: string, maxLength: number): string {
  if (!Number.isInteger(maxLength) || maxLength < 0) {
    throw new Error('maxLength must be a non-negative integer');
  }
  if (text.length <= maxLength) return text;
  if (maxLength <= 3) return text.slice(0, maxLength);
  return text.slice(0, maxLength - 3) + '...';
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) throw new Error('bytes must be a non-negative finite number');
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

export function formatNumber(num: number): string {
  if (!Number.isFinite(num)) throw new Error('num must be finite');
  if (Math.abs(num) >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function now(): string {
  return new Date().toISOString();
}

export function getBillingPeriod(anchorDate: Date): { start: Date; end: Date } {
  if (Number.isNaN(anchorDate.getTime())) throw new Error('anchorDate must be valid');

  const current = new Date();
  let year = current.getUTCFullYear();
  let month = current.getUTCMonth();
  const anchorDay = anchorDate.getUTCDate();

  const start = new Date(Date.UTC(year, month, Math.min(anchorDay, daysInMonth(year, month))));
  if (start > current) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }

  const periodStart = new Date(
    Date.UTC(year, month, Math.min(anchorDay, daysInMonth(year, month)))
  );
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const periodEnd = new Date(
    Date.UTC(nextYear, nextMonth, Math.min(anchorDay, daysInMonth(nextYear, nextMonth)))
  );

  return { start: periodStart, end: periodEnd };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function chunkText(text: string, maxChars = 2000, overlap = 200): string[] {
  if (!Number.isInteger(maxChars) || maxChars < 1) throw new Error('maxChars must be a positive integer');
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= maxChars) {
    throw new Error('overlap must be between 0 and maxChars - 1');
  }
  if (!text) return [];
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);

    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + maxChars / 2) {
        end = paragraphBreak + 2;
      } else {
        const sentenceBreak = text.lastIndexOf('. ', end);
        if (sentenceBreak > start + maxChars / 2) {
          end = sentenceBreak + 2;
        } else {
          const wordBreak = text.lastIndexOf(' ', end);
          if (wordBreak > start + maxChars / 2) end = wordBreak + 1;
        }
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks;
}

export async function generateChunkId(
  memoryId: string,
  chunkIndex: number,
  content: string
): Promise<string> {
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0) throw new Error('chunkIndex must be non-negative');
  const hash = await sha256(`${memoryId}:${chunkIndex}:${content}`);
  return `chunk_${hash.slice(0, 16)}`;
}

export function normalizeForEmbedding(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}
