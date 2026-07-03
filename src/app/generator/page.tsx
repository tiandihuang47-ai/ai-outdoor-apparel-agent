'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RequirementForm from '@/components/RequirementForm';
import ResultPanel from '@/components/ResultPanel';
import ScenarioComparePanel from '@/components/ScenarioComparePanel';
import HistoryPanel from '@/components/HistoryPanel';
import SettingsModal from '@/components/SettingsModal';
import {
  saveSingleResult,
  saveCompareResults,
  type ScenarioHistoryItem,
  type HistoryItem,
} from '@/lib/historyStorage';
import { loadSharedPlan } from '@/lib/shareStorage';
import type { GenerationResult, RawRequirement } from '@/types';

interface HistoryScenario {
  tier: 'basic' | 'mid' | 'premium';
  tierName: string;
  targetPrice: number;
  result: GenerationResult;
}

interface Scenario {
  tier: 'basic' | 'mid' | 'premium';
  tierName: string;
  targetPrice: number;
  result: GenerationResult;
}

const LOADING_STEPS = [
  '正在解析需求',
  '正在匹配面料',
  '正在生成款式方案',
  '正在核算成本',
  '正在生成营销文案',
  '正在检查风险',
  '生成完成',
];

function GeneratorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState(false);

  const presetText = searchParams.get('text');
  const shareId = searchParams.get('share');

  useEffect(() => {
    if (shareId) {
      setShareLoading(true);
      setShareError(false);
      setError(null);

      const timer = setTimeout(() => {
        const plan = loadSharedPlan(shareId);
        if (plan) {
          if (plan.type === 'single') {
            setResult(plan.data as GenerationResult);
            setScenarios([]);
          } else {
            setScenarios(plan.data as Scenario[]);
            setResult(null);
          }
        } else {
          setShareError(true);
        }
        setShareLoading(false);
      }, 600);

      return () => clearTimeout(timer);
    }

    if (presetText) {
      handleSubmit({ text: presetText });
    }
  }, [shareId, presetText]);

  const handleSubmit = async (data: RawRequirement) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setScenarios([]);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < LOADING_STEPS.length - 2) return prev + 1;
        return prev;
      });
    }, 800);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: data.text,
          formData: data.text ? undefined : data,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || '生成失败');
      }

      const generatedResult: GenerationResult = await response.json();
      setResult(generatedResult);
      saveSingleResult(generatedResult);
      setCurrentStep(LOADING_STEPS.length - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const handleCompareSubmit = async (data: RawRequirement) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setScenarios([]);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < LOADING_STEPS.length - 2) return prev + 1;
        return prev;
      });
    }, 800);

    try {
      const response = await fetch('/api/generate-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: data.text,
          formData: data.text ? undefined : data,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || '生成失败');
      }

      const responseData = await response.json();
      setScenarios(responseData.scenarios);
      saveCompareResults(responseData.scenarios as ScenarioHistoryItem[]);
      setCurrentStep(LOADING_STEPS.length - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setError(null);
    setCurrentStep(-1);
    if (item.type === 'single') {
      setResult(item.data as GenerationResult);
      setScenarios([]);
    } else {
      setScenarios(item.data as Scenario[]);
      setResult(null);
    }
  };

  const handleHistoryCompare = (historyScenarios: HistoryScenario[]) => {
    setError(null);
    setCurrentStep(-1);
    setResult(null);
    setScenarios(historyScenarios as Scenario[]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="w-full lg:w-[420px] flex-shrink-0 space-y-6">
        <div className="sticky top-6 space-y-6">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">📝 需求输入</h2>
              <div className="flex items-center gap-2">
                <Link
                  href="/help"
                  className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  ❓ 帮助
                </Link>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-sm px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                >
                  ⚙️ 配置
                </button>
              </div>
            </div>
            <RequirementForm
              onSubmit={handleSubmit}
              onCompareSubmit={handleCompareSubmit}
              isLoading={isLoading}
            />
          </div>
          <HistoryPanel onSelect={handleHistorySelect} onCompare={handleHistoryCompare} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {isLoading && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-slate-300">正在生成研发方案...</span>
            </div>
            <div className="space-y-2">
              {LOADING_STEPS.map((step, i) => (
                <div
                  key={step}
                  className={`flex items-center gap-3 text-sm transition-colors ${
                    i <= currentStep ? 'text-slate-200' : 'text-slate-600'
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      i < currentStep
                        ? 'bg-green-600 text-white'
                        : i === currentStep
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    {i < currentStep ? '✓' : i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {shareLoading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-slate-300">正在加载分享的方案...</p>
          </div>
        )}

        {shareError && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-xl font-semibold text-white mb-2">分享链接已失效</h2>
            <p className="text-slate-400 max-w-sm mb-6">
              该链接已过期、已被删除，或对应的方案不存在。分享链接有效期为 30 天，请让对方重新生成分享链接。
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => router.push('/')}
                className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
              >
                返回首页
              </button>
              <button
                onClick={() => router.push('/generator')}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                重新输入需求
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm text-red-300 underline mt-2"
            >
              关闭
            </button>
          </div>
        )}

        {!isLoading && !shareLoading && !shareError && !error && scenarios.length > 0 && (
          <ScenarioComparePanel
            scenarios={scenarios}
            onReset={() => {
              setScenarios([]);
              setResult(null);
            }}
          />
        )}

        {!isLoading && !shareLoading && !shareError && !error && scenarios.length === 0 && (
          <ResultPanel result={result} />
        )}
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function GeneratorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      }
    >
      <GeneratorContent />
    </Suspense>
  );
}
