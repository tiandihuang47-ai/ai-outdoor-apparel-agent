'use client';

import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { saveSharedPlan, EXPIRE_DAYS } from '@/lib/shareStorage';
import type { GenerationResult } from '@/types';

interface ScenarioData {
  tier: 'basic' | 'mid' | 'premium';
  tierName: string;
  targetPrice: number;
  result: GenerationResult;
}

interface ShareButtonProps {
  result?: GenerationResult;
  scenarios?: ScenarioData[];
  variant?: 'default' | 'compact';
}

type ShareErrorReason = 'no-data' | 'storage' | 'qr' | 'unknown';

type ShareStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success' }
  | { type: 'error'; reason: ShareErrorReason; message: string };

export default function ShareButton({ result, scenarios, variant = 'default' }: ShareButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<ShareStatus>({ type: 'idle' });
  const [copyWarning, setCopyWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateData = (): boolean => {
    if (scenarios && scenarios.length > 0) return true;
    if (result) return true;
    return false;
  };

  const generateShareUrl = (): string => {
    if (scenarios && scenarios.length > 0) {
      const id = saveSharedPlan({ type: 'compare', data: scenarios });
      return `${window.location.origin}/generator?share=${id}`;
    }
    if (result) {
      const id = saveSharedPlan({ type: 'single', data: result });
      return `${window.location.origin}/generator?share=${id}`;
    }
    throw new Error('没有可分享的方案，请先生成方案');
  };

  const classifyError = (err: unknown): ShareStatus => {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('没有可分享的方案')) {
      return { type: 'error', reason: 'no-data', message };
    }
    if (message.includes('localStorage') || message.includes('本地存储') || message.includes('隐私') || message.includes('无痕')) {
      return { type: 'error', reason: 'storage', message };
    }
    if (message.includes('QR') || message.includes('二维码') || message.includes('qrcode')) {
      return { type: 'error', reason: 'qr', message };
    }
    return { type: 'error', reason: 'unknown', message: message || '生成分享链接失败，请重试' };
  };

  const openShareModal = async () => {
    setModalOpen(true);
    setStatus({ type: 'loading' });
    setCopied(false);
    setCopyWarning(null);
    setShareUrl('');
    setQrDataUrl('');

    if (!validateData()) {
      setStatus({ type: 'error', reason: 'no-data', message: '没有可分享的方案，请先生成方案' });
      return;
    }

    try {
      const url = generateShareUrl();
      setShareUrl(url);

      const dataUrl = await QRCode.toDataURL(url, {
        width: 240,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
      setStatus({ type: 'success' });

      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        setCopyWarning('自动复制失败，请手动复制链接或扫码分享');
      }
    } catch (err) {
      setStatus(classifyError(err));
    }
  };

  const getShareContent = (): { title: string; text: string } => {
    if (scenarios && scenarios.length > 0) {
      const first = scenarios[0].result;
      return {
        title: `${first.parsedRequirement.category} 多套方案对比`,
        text: first.summary,
      };
    }
    if (result) {
      return {
        title: result.marketingCopy.title,
        text: result.summary,
      };
    }
    return { title: 'AI 户外服饰研发方案', text: '' };
  };

  const handleNativeShare = async () => {
    if (!shareUrl || !navigator.share) return;

    const { title, text } = getShareContent();
    try {
      await navigator.share({
        title,
        text,
        url: shareUrl,
      });
    } catch (err) {
      // 用户取消分享不视为错误
      if (err instanceof Error && err.name === 'AbortError') return;
      setCopyWarning('系统分享调用失败，请使用复制链接或扫码分享');
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setCopyWarning(null);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      handleSelectAll();
      setCopyWarning('当前浏览器不支持自动复制，已全选链接，请按 Ctrl+C / Cmd+C 手动复制');
    }
  };

  const handleSelectAll = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      inputRef.current.setSelectionRange(0, 99999);
    }
  };

  useEffect(() => {
    if (modalOpen && inputRef.current && shareUrl) {
      inputRef.current.select();
    }
  }, [modalOpen, shareUrl]);

  const getErrorAction = (reason: ShareErrorReason) => {
    switch (reason) {
      case 'no-data':
        return { text: '知道了', action: () => setModalOpen(false) };
      case 'storage':
        return { text: '重试', action: openShareModal };
      case 'qr':
      case 'unknown':
      default:
        return { text: '重试', action: openShareModal };
    }
  };

  const buttonText = copied ? '✅ 链接已复制' : '🔗 复制分享链接';

  const shareModal = modalOpen && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setModalOpen(false);
      }}
    >
      <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">分享方案</h3>
          <button
            onClick={() => setModalOpen(false)}
            className="text-slate-400 hover:text-white text-xl leading-none"
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        {status.type === 'loading' ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-3"></div>
            <p className="text-sm text-slate-400">正在生成分享链接...</p>
          </div>
        ) : status.type === 'error' ? (
          <div className="text-center py-6">
            <div className="text-red-400 text-sm mb-4 space-y-1">
              <p className="font-medium">分享失败</p>
              <p>{status.message}</p>
            </div>
            {status.reason === 'storage' && (
              <p className="text-xs text-slate-400 mb-4">
                请检查浏览器是否禁用了本地存储，或关闭了隐私/无痕模式后重试。
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={getErrorAction(status.reason).action}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
              >
                {getErrorAction(status.reason).text}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm"
              >
                关闭
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {status.type === 'success' && (
              <div className="text-sm text-emerald-400 bg-emerald-900/20 border border-emerald-500/30 rounded-lg px-3 py-2 text-center">
                ✅ 链接已保存至本地浏览器，有效期 {EXPIRE_DAYS} 天
              </div>
            )}

            {qrDataUrl && (
              <div className="flex justify-center">
                <div className="bg-white p-2 rounded-xl">
                  <img src={qrDataUrl} alt="分享二维码" className="w-48 h-48 rounded-lg" />
                </div>
              </div>
            )}

            <p className="text-sm text-slate-300 text-center">微信扫码或复制链接分享</p>

            {'share' in navigator && typeof navigator.share === 'function' && (
              <button
                onClick={handleNativeShare}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-2"
              >
                📤 调用系统分享
              </button>
            )}

            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                readOnly
                value={shareUrl}
                onClick={handleSelectAll}
                className="flex-1 min-w-0 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleCopyLink}
                className="shrink-0 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>

            {copyWarning && (
              <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-500/30 rounded-lg px-3 py-2">
                ⚠️ {copyWarning}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={openShareModal}
          className="w-full py-2 rounded-lg text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 transition-colors"
        >
          {buttonText}
        </button>
        {shareModal}
      </>
    );
  }

  return (
    <>
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white mb-3">🔗 分享方案</h3>
        <p className="text-sm text-slate-400 mb-4">生成二维码或链接，分享到微信或其他平台。</p>
        <button
          onClick={openShareModal}
          className="w-full py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 transition-all"
        >
          生成分享二维码
        </button>
      </div>
      {shareModal}
    </>
  );
}
