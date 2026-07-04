import Link from 'next/link';
import type { Metadata } from 'next';
import GlassCard from '@/components/ui/GlassCard';
import StepWizard from '@/components/ui/StepWizard';
import AnimatedButton from '@/components/ui/AnimatedButton';

export const metadata: Metadata = {
  title: 'AI户外服饰智能设计Agent',
  description: '面向中小户外服饰商家的小单快反研发助手',
};

const EXAMPLE_REQUIREMENTS = [
  {
    label: '女款春秋冲锋衣',
    text: '我要做一款女款春秋轻户外冲锋衣，适合城市通勤和露营，要求防小雨、防风、不闷，零售价399元以内，首单100件。',
  },
  {
    label: '男款软壳外套',
    text: '我要做一款男款软壳外套，适合秋冬徒步和骑行，要求保暖、防风、弹力，零售价599元以内，首单300件。',
  },
  {
    label: '女款防晒衣',
    text: '我要做一款女款夏季轻薄防晒衣，适合通勤和旅游，要求UPF50+防晒、透气、轻量，零售价199元以内，首单500件。',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <GlassCard className="text-center mb-8 glow" glow>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-6">
            🧥 AI驱动 · 小单快反研发助手
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            AI户外服饰
            <span className="gradient-text">智能设计</span>
            Agent
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            面向中小户外服饰商家和服装研发团队的小单快反研发助手。
            输入产品需求，自动解析需求，推荐面料方案，生成款式结构，估算BOM成本，产出营销文案和研发方案。
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/generator">
              <AnimatedButton className="px-8 py-3.5 text-lg">
                🚀 立即开始
              </AnimatedButton>
            </Link>
            <Link href="/help">
              <AnimatedButton variant="secondary" className="px-6 py-3.5 text-lg">
                📖 使用帮助
              </AnimatedButton>
            </Link>
          </div>
        </GlassCard>

        <StepWizard
          steps={['输入需求', '生成方案', '查看结果', '导出分享']}
          currentStep={0}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-12">
          <GlassCard>
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold mb-2">智能款式设计</h3>
            <p className="text-sm text-slate-400">
              基于品类与定位自动生成专业设计方案
            </p>
          </GlassCard>
          <GlassCard>
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold mb-2">成本与面料分析</h3>
            <p className="text-sm text-slate-400">
              自动拆解 BOM、推荐面料、预估成本
            </p>
          </GlassCard>
          <GlassCard>
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="text-lg font-semibold mb-2">营销与风控</h3>
            <p className="text-sm text-slate-400">
              生成营销文案并提示设计与供应链风险
            </p>
          </GlassCard>
        </div>

        <GlassCard>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">支持的产品品类</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <div className="text-3xl mb-2">🏔️</div>
              <h3 className="font-semibold text-white">冲锋衣</h3>
              <p className="text-sm text-slate-400 mt-1">户外功能性核心品类，展示防水、防风、透湿能力</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <div className="text-3xl mb-2">🧥</div>
              <h3 className="font-semibold text-white">软壳外套</h3>
              <p className="text-sm text-slate-400 mt-1">展示防风、弹力、保暖之间的取舍与平衡</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <div className="text-3xl mb-2">☀️</div>
              <h3 className="font-semibold text-white">防晒衣</h3>
              <p className="text-sm text-slate-400 mt-1">低成本小单快反，适合展示快速反应能力</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-slate-200 mb-4">试试示例需求</h2>
          <div className="space-y-3 mb-6">
            {EXAMPLE_REQUIREMENTS.map((example) => (
              <Link
                key={example.label}
                href={`/generator?text=${encodeURIComponent(example.text)}`}
                className="block bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300">
                      {example.label}
                    </span>
                    <p className="text-sm text-slate-300 mt-2">{example.text}</p>
                  </div>
                  <span className="text-slate-500 group-hover:text-cyan-400 transition-colors">→</span>
                </div>
              </Link>
            ))}
          </div>

          <Link href="/generator">
            <AnimatedButton className="w-full py-4 text-lg">
              🚀 开始生成研发方案
            </AnimatedButton>
          </Link>
        </GlassCard>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { title: '30+ 面料数据', desc: '冲锋衣/软壳/防晒衣' },
            { title: '79+ 模板', desc: '不同品类款式方案' },
            { title: 'BOM成本计算', desc: '自动核算单件成本' },
            { title: 'Markdown导出', desc: '一键生成研发方案' },
          ].map((item) => (
            <GlassCard key={item.title} hover={false} className="p-4 text-center">
              <div className="text-lg font-bold text-white">{item.title}</div>
              <div className="text-xs text-slate-400 mt-1">{item.desc}</div>
            </GlassCard>
          ))}
        </div>
      </div>
    </main>
  );
}
