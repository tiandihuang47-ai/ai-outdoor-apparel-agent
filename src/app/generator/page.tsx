'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RequirementForm from '@/components/RequirementForm';
import ResultPanel from '@/components/ResultPanel';
import ScenarioComparePanel from '@/components/ScenarioComparePanel';
import HistoryPanel from '@/components/HistoryPanel';
import SettingsModal from '@/components/SettingsModal';
import LoginModal from '@/components/LoginModal';
import UserMenu from '@/components/UserMenu';
import TechPackPanel from '@/components/TechPackPanel';
import GlassCard from '@/components/ui/GlassCard';
import StepWizard from '@/components/ui/StepWizard';
import AnimatedButton from '@/components/ui/AnimatedButton';
import {
  saveSingleResult,
  saveCompareResults,
  setHistoryBackend,
  localHistory,
  cloudHistory,
  type ScenarioHistoryItem,
  type HistoryItem,
} from '@/lib/historyStorage';
import { loadSharedPlan } from '@/lib/shareStorage';
import type { GenerationResult, RawRequirement, ParsedRequirement } from '@/types';

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
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showTechPack, setShowTechPack] = useState(false);

  const presetText = searchParams.get('text');
  const shareId = searchParams.get('share');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn && data.email) {
          setUserEmail(data.email);
          setHistoryBackend(cloudHistory);
        } else {
          setUserEmail(null);
          setHistoryBackend(localHistory);
        }
      })
      .catch(() => {
        setUserEmail(null);
        setHistoryBackend(localHistory);
      })
      .finally(() => setUserLoading(false));
  }, []);

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

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setHistoryBackend(cloudHistory);
  };

  const handleLogout = () => {
    setUserEmail(null);
    setHistoryBackend(localHistory);
  };

  const syncLocalToCloud = async () => {
    const localItems = localHistory.getHistory();
    if (localItems.length === 0) return;

    try {
      const cloudItems = await cloudHistory.getHistory();
      const merged = [...localItems, ...cloudItems];
      const deduped = merged.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
      );
      const sorted = deduped.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
      await cloudHistory.saveHistory(sorted);
      localHistory.saveHistory([]);
      window.dispatchEvent(new StorageEvent('storage'));
    } catch (err) {
      console.error('Sync local to cloud failed:', err);
      alert('同步失败，请重试');
    }
  };

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
      await saveSingleResult(generatedResult);
      window.dispatchEvent(new StorageEvent('storage'));
      setCurrentStep(LOADING_STEPS.length - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const parsedRequirementToRaw = (parsed: ParsedRequirement): RawRequirement => ({
    category: parsed.category,
    gender: parsed.gender,
    ageRange: parsed.ageRange,
    scenes: parsed.scenes,
    season: parsed.season,
    targetPrice: parsed.targetPrice,
    orderQuantity: parsed.orderQuantity,
    functions: parsed.functionPriorities,
    stylePreference: parsed.stylePositioning,
    notes: parsed.styleKeywords?.length ? `款式关键词：${parsed.styleKeywords.join('、')}` : '',
  });

  const handleImageAnalyzed = (parsed: ParsedRequirement) => {
    const raw = parsedRequirementToRaw(parsed);
    handleSubmit(raw);
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
      await saveCompareResults(responseData.scenarios as ScenarioHistoryItem[]);
      window.dispatchEvent(new StorageEvent('storage'));
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

  const stepIndex = isLoading
    ? Math.min(currentStep, 1)
    : result || scenarios.length > 0
    ? 2
    : shareLoading || shareError
    ? 2
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <GlassCard className="mb-6" hover={false}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                ← 首页
              </Link>
              <h1 className="text-lg font-semibold text-white">AI 户外服饰智能设计</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/help">
                <AnimatedButton variant="secondary" className="px-4 py-2 text-sm">
                  ❓ 帮助
                </AnimatedButton>
              </Link>
              <AnimatedButton
                variant="secondary"
                className="px-4 py-2 text-sm"
                onClick={() => setIsSettingsOpen(true)}
              >
                ⚙️ 配置
              </AnimatedButton>
              {!userLoading && (
                <UserMenu
                  email={userEmail}
                  onLoginClick={() => setIsLoginOpen(true)}
                  onLogout={handleLogout}
                />
              )}
            </div>
          </div>
          <StepWizard
            steps={['输入需求', '生成方案', '查看结果', '导出分享']}
            currentStep={stepIndex}
          />
        </GlassCard>

        <div className="flex flex-col lg:flex-row gap-6 h-full">
          <div className="w-full lg:w-[420px] flex-shrink-0 space-y-6">
            <div className="sticky top-6 space-y-6">
              <GlassCard>
                <h2 className="text-lg font-semibold text-white mb-6">📝 需求输入</h2>
                <RequirementForm
                  onSubmit={handleSubmit}
                  onCompareSubmit={handleCompareSubmit}
                  onImageAnalyzed={handleImageAnalyzed}
                  isLoading={isLoading}
                />
              </GlassCard>
              <HistoryPanel
                onSelect={handleHistorySelect}
                onCompare={handleHistoryCompare}
                userEmail={userEmail}
                onSyncLocal={syncLocalToCloud}
                onViewTechPack={(item) => {
                  if (item.type === 'single') {
                    setResult(item.data as GenerationResult);
                    setScenarios([]);
                    setShowTechPack(true);
                  }
                }}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {isLoading && (
              <GlassCard className="mb-6" hover={false}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-500 border-t-transparent"></div>
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
                            ? 'bg-emerald-500 text-white'
                            : i === currentStep
                            ? 'bg-cyan-500 text-white animate-pulse'
                            : 'bg-slate-700 text-slate-500'
                        }`}
                      >
                        {i < currentStep ? '✓' : i + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {shareLoading && (
              <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-cyan-500 border-t-transparent mb-4"></div>
                <p className="text-slate-300">正在加载分享的方案...</p>
              </div>
            )}

            {shareError && (
              <GlassCard className="flex flex-col items-center justify-center min-h-[50vh] text-center" hover={false}>
                <div className="text-6xl mb-4">🔗</div>
                <h2 className="text-xl font-semibold text-white mb-2">分享链接已失效</h2>
                <p className="text-slate-400 max-w-sm mb-6">
                  该链接已过期、已被删除，或对应的方案不存在。分享链接有效期为 30 天，请让对方重新生成分享链接。
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <AnimatedButton
                    variant="secondary"
                    onClick={() => router.push('/')}
                  >
                    返回首页
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => router.push('/generator')}
                  >
                    重新输入需求
                  </AnimatedButton>
                </div>
              </GlassCard>
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
              <ResultPanel result={result} onViewTechPack={() => setShowTechPack(true)} />
            )}

            {showTechPack && result && (
              <GlassCard className="mb-6" hover={false}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">📋 Tech Pack（技术工艺单）</h2>
                  <button
                    onClick={() => setShowTechPack(false)}
                    className="text-sm text-slate-400 hover:text-white"
                  >
                    收起
                  </button>
                </div>
                <TechPackPanel techPack={result.techPack} />
              </GlassCard>
            )}
          </div>

          <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
          <LoginModal
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
            onLogin={handleLogin}
          />
        </div>
      </div>
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
