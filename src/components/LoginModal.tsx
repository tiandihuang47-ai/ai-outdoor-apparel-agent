'use client';

import { useEffect, useState } from 'react';
import GlassCard from './ui/GlassCard';
import AnimatedButton from './ui/AnimatedButton';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: (email: string) => void;
}

export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setCode('');
      setStep('email');
      setMessage(null);
      setCountdown(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email.trim() || !email.includes('@')) {
      setMessage('请输入有效邮箱');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setStep('code');
        setCountdown(60);
        setMessage(data.message || '验证码已发送');
      } else {
        setMessage(data.error || '发送失败');
      }
    } catch {
      setMessage('发送失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      setMessage('请输入验证码');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage('✅ 登录成功');
        onLogin?.(data.email);
        setTimeout(() => onClose(), 800);
      } else {
        setMessage(data.error || '验证失败');
      }
    } catch {
      setMessage('验证失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <GlassCard className="w-full max-w-md" hover={false}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">🔐 邮箱登录</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-2">邮箱地址</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={step === 'code'}
              className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50 transition-all"
            />
          </div>

          {step === 'code' && (
            <div>
              <label className="block text-sm text-slate-300 mb-2">验证码</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入 6 位验证码"
                maxLength={6}
                className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
            </div>
          )}

          {message && (
            <div
              className={`text-sm ${
                message.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {message}
            </div>
          )}

          {step === 'email' ? (
            <AnimatedButton
              onClick={handleSendCode}
              loading={loading}
              loadingText="发送中..."
              disabled={!email.trim().includes('@')}
              className="w-full py-3"
            >
              发送验证码
            </AnimatedButton>
          ) : (
            <div className="space-y-3">
              <AnimatedButton
                onClick={handleVerify}
                loading={loading}
                loadingText="验证中..."
                disabled={!code.trim()}
                className="w-full py-3"
              >
                登录
              </AnimatedButton>
              <button
                onClick={handleSendCode}
                disabled={countdown > 0 || loading}
                className="w-full text-sm text-slate-400 hover:text-cyan-300 disabled:opacity-50 disabled:hover:text-slate-400 transition-colors"
              >
                {countdown > 0 ? `${countdown} 秒后重新发送` : '重新发送验证码'}
              </button>
            </div>
          )}

          <p className="text-xs text-slate-500">
            登录后可云端同步历史记录，未登录时数据仅保存在当前设备。
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
