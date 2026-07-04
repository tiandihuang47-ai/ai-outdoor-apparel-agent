import { kv } from '@vercel/kv';

export { kv };

export function codeKey(email: string): string {
  return `auth:code:${email.toLowerCase().trim()}`;
}

export function historyKey(email: string): string {
  return `history:${email.toLowerCase().trim()}`;
}

export async function saveCode(email: string, code: string): Promise<void> {
  await kv.set(codeKey(email), code, { ex: 60 * 10 });
}

export async function getCode(email: string): Promise<string | null> {
  return kv.get(codeKey(email));
}

export async function deleteCode(email: string): Promise<void> {
  await kv.del(codeKey(email));
}
