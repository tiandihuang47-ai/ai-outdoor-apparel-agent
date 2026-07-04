import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export interface SendCodeResult {
  success: boolean;
  message: string;
  code?: string;
}

export async function sendVerificationCode(
  email: string,
  code: string
): Promise<SendCodeResult> {
  if (!resend) {
    const msg = `测试模式：验证码为 ${code}（未配置 RESEND_API_KEY，请在 Vercel 环境变量中配置以真实发送邮件）`;
    console.log(`[TEST MODE] ${email}: ${code}`);
    return { success: true, message: msg, code };
  }

  try {
    const { error } = await resend.emails.send({
      from: 'AI户外服饰 <noreply@yourdomain.com>',
      to: email,
      subject: '您的登录验证码',
      html: `<p>您的验证码是：<strong>${code}</strong></p><p>10 分钟内有效，请勿泄露给他人。</p>`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, message: '验证码已发送，请查收邮件' };
  } catch (error) {
    const message = error instanceof Error ? error.message : '发送失败';
    return { success: false, message };
  }
}
