/**
 * Generate a prefixed ID
 */
export function generateId(prefix: string = ''): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

/**
 * Generate a secure random API key
 * Format: im_live_{32 random alphanumeric characters} or im_test_{32 chars}
 */
export function generateApiKey(isTest: boolean = false): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  const prefix = isTest ? 'im_test_' : 'im_live_';
  let key = prefix;
  for (let i = 0; i < 32; i++) {
    key += chars[bytes[i]! % chars.length];
  }
  return key;
}

/**
 * Extract the prefix from an API key (for identification)
 */
export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.slice(0, 16); // "im_live_" or "im_test_" + first 8 chars
}

/**
 * Hash a string using SHA-256
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compute HMAC-SHA256
 */
export async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * PBKDF2 password hashing with WebCrypto
 */
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const saltBytes = salt
    ? hexToBytes(salt)
    : crypto.getRandomValues(new Uint8Array(16));

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
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    256
  );

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const saltHex = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { hash: hashHex, salt: saltHex };
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const result = await hashPassword(password, salt);
  return timingSafeEqual(result.hash, hash);
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Constant-time string comparison (for security-sensitive comparisons)
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still perform comparison to maintain constant time
    let result = 0;
    const longer = a.length > b.length ? a : b;
    for (let i = 0; i < longer.length; i++) {
      result |= longer.charCodeAt(i) ^ (longer.charCodeAt(i) || 0);
    }
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Encode a cursor for pagination
 */
export function encodeCursor(data: Record<string, unknown>): string {
  const json = JSON.stringify(data);
  return btoa(json);
}

/**
 * Decode a cursor for pagination
 */
export function decodeCursor<T = Record<string, unknown>>(cursor: string): T | null {
  try {
    const json = atob(cursor);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Estimate token count (rough approximation for English text)
 * ~4 characters per token on average
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Format number with K/M/B suffix
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Get ISO timestamp for current time
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Get billing period dates for a user
 */
export function getBillingPeriod(anchorDate: Date): { start: Date; end: Date } {
  const nowDate = new Date();
  const anchor = new Date(anchorDate);

  // Find current period start
  const periodStart = new Date(anchor);
  while (periodStart <= nowDate) {
    periodStart.setMonth(periodStart.getMonth() + 1);
  }
  periodStart.setMonth(periodStart.getMonth() - 1);

  // Period end
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return { start: periodStart, end: periodEnd };
}

/**
 * Chunk text into semantic-ish chunks
 */
export function chunkText(text: string, maxChars: number = 2000, overlap: number = 200): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);

    // Try to find a natural break point (paragraph, sentence, or word boundary)
    if (end < text.length) {
      // Look for paragraph break
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + maxChars / 2) {
        end = paragraphBreak + 2;
      } else {
        // Look for sentence break
        const sentenceBreak = text.lastIndexOf('. ', end);
        if (sentenceBreak > start + maxChars / 2) {
          end = sentenceBreak + 2;
        } else {
          // Look for word break
          const wordBreak = text.lastIndexOf(' ', end);
          if (wordBreak > start + maxChars / 2) {
            end = wordBreak + 1;
          }
        }
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = Math.max(start + 1, end - overlap);
  }

  return chunks;
}

/**
 * Generate stable chunk ID based on content
 */
export async function generateChunkId(memoryId: string, chunkIndex: number, content: string): Promise<string> {
  const hash = await sha256(`${memoryId}:${chunkIndex}:${content.slice(0, 100)}`);
  return `chunk_${hash.slice(0, 16)}`;
}

/**
 * Normalize text for embedding (lowercase, trim whitespace)
 */
export function normalizeForEmbedding(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
