import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export interface UserSession {
  email: string;
}

const COOKIE_NAME = 'ai-outdoor-session';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET 未配置');
  }
  const encoded = new TextEncoder().encode(secret);
  return new Uint8Array(encoded);
}

export async function createSession(email: string): Promise<void> {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.email !== 'string') return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function getUserKey(email: string): string {
  return `user:${email.toLowerCase().trim()}`;
}
