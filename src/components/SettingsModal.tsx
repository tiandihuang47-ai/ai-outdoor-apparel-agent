'use client';

import { useEffect, useState } from 'react';

type Provider = 'mock' | 'openai' | 'deepseek' | 'qwen';

interface SettingsData {
  provider: Provider;
  keys: Record<Provider, string>;
  imageApiKey: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDER_OPTIONS: { value: Provider; label: string }[] = [
  { value: 'mock', label: 'Mock（模拟模式，不消耗 API）' },
  { value: 'openai', label: 'OpenAI（GPT-4o-mini）' },
  { value: 'deepseek', label: 'DeepSeek（deepseek-chat）' },
  { value: 'qwen', label: '通义千问（qwen-plus）' },
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<SettingsData>({
    provider: 'mock',
    keys: { mock: '', openai: '', deepseek: '', qwen: '' },
    imageApiKey: '',
  });
  const [apiKey, setApiKey] = useState('');
  const [imageKeyInput, setImageKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: SettingsData) => {
        setSettings(data);
        setApiKey('');
        setImageKeyInput('');
      })
      .catch(() => setMessage('读取配置失败'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings.provider,
          apiKey: apiKey.trim(),
          keys: settings.keys,
          imageApiKey: imageKeyInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSettings(data);
        setApiKey('');
        setMessage('✅ 配置已保存');
      } else {
        setMessage(data.error || '保存失败');
      }
    } catch {
      setMessage('保存失败，请检查网络');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">⚙️ AI 接口配置</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-slate-300 text-center py-8">读取配置中...</div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-slate-300 mb-2">当前 AI 厂商</label>
              <select
                value={settings.provider}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, provider: e.target.value as Provider }))
                }
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {PROVIDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {settings.provider !== 'mock' && (
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  {PROVIDER_OPTIONS.find((p) => p.value === settings.provider)?.label.split('（')[0]} API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={settings.keys[settings.provider] ? '已保存，留空则保持原 Key' : '请输入 API Key'}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {settings.keys[settings.provider] && (
                  <p className="text-xs text-slate-400 mt-1">
                    已保存：{settings.keys[settings.provider]}
                  </p>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-slate-700">
              <label className="block text-sm text-slate-300 mb-2">阿里云 DashScope 生图 API Key（可选）</label>
              <input
                type="password"
                value={imageKeyInput}
                onChange={(e) => setImageKeyInput(e.target.value)}
                placeholder={settings.imageApiKey ? '已保存，留空则保持原 Key' : '请输入 DashScope API Key'}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {settings.imageApiKey && (
                <p className="text-xs text-slate-400 mt-1">
                  已保存：{settings.imageApiKey}
                </p>
              )}
            </div>

            {settings.provider === 'mock' && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-200">
                Mock 模式不会调用真实 AI，适合测试功能和体验流程。
              </div>
            )}

            {message && (
              <div
                className={`text-sm ${message.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}
              >
                {message}
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存配置'}
              </button>
            </div>

            <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
              <p className="mb-1">还没 Key？可以去这里申请：</p>
              <div className="space-y-1">
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-400 hover:underline"
                >
                  OpenAI API Keys
                </a>
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-400 hover:underline"
                >
                  DeepSeek 开放平台
                </a>
                <a
                  href="https://dashscope.console.aliyun.com/apiKey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-400 hover:underline"
                >
                  阿里云 DashScope
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
