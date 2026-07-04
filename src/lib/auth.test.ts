/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSession, getSession, clearSession, getUserKey } from './auth';

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_SECRET = 'test-secret-must-be-at-least-32-characters-long';
  });

  it('createSession 设置 cookie', async () => {
    await createSession('test@example.com');

    expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
    const [name, token, options] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe('ai-outdoor-session');
    expect(typeof token).toBe('string');
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe('/');
  });

  it('getSession 从 cookie 解析出邮箱', async () => {
    await createSession('test@example.com');
    const token = mockCookieStore.set.mock.calls[0][1];
    mockCookieStore.get.mockReturnValue({ value: token });

    const session = await getSession();
    expect(session).toEqual({ email: 'test@example.com' });
  });

  it('getSession 无 cookie 返回 null', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const session = await getSession();
    expect(session).toBeNull();
  });

  it('getSession 无效 token 返回 null', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'invalid-token' });
    const session = await getSession();
    expect(session).toBeNull();
  });

  it('clearSession 删除 cookie', async () => {
    await clearSession();
    expect(mockCookieStore.delete).toHaveBeenCalledWith('ai-outdoor-session');
  });

  it('getUserKey 返回小写格式化 key', () => {
    expect(getUserKey('Test@Example.com ')).toBe('user:test@example.com');
  });

  it('AUTH_SECRET 未配置时抛出错误', async () => {
    delete process.env.AUTH_SECRET;
    await expect(createSession('test@example.com')).rejects.toThrow('AUTH_SECRET 未配置');
  });
});
