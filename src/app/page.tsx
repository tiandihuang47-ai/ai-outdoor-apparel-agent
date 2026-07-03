import Link from 'next/link';
import type { Metadata } from 'next';

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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
            🧥 AI驱动 · 小单快反研发助手
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            AI户外服饰
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">智能设计</span>
            Agent
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            面向中小户外服饰商家和服装研发团队的小单快反研发助手。
            输入产品需求，自动解析需求，推荐面料方案，生成款式结构，估算BOM成本，产出营销文案和研发方案。
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <Link
            href="/help"
            className="px-4 py-2 rounded-lg text-sm bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            📖 查看使用帮助
          </Link>
          <Link
            href="/generator"
            className="px-4 py-2 rounded-lg text-sm bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors"
          >
            🚀 立即开始
          </Link>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mb-10">
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
                className="block bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400">
                      {example.label}
                    </span>
                    <p className="text-sm text-slate-300 mt-2">{example.text}</p>
                  </div>
                  <span className="text-slate-500 group-hover:text-blue-400 transition-colors">→</span>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/generator"
            className="block w-full py-4 rounded-xl text-center font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all text-lg"
          >
            🚀 开始生成研发方案
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: '30条面料数据', desc: '冲锋衣/软壳/防晒衣' },
            { title: '15款模板', desc: '不同品类款式方案' },
            { title: 'BOM成本计算', desc: '自动核算单件成本' },
            { title: 'Markdown导出', desc: '一键生成研发方案' },
          ].map((item) => (
            <div key={item.title} className="text-center p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <div className="text-lg font-bold text-white">{item.title}</div>
              <div className="text-xs text-slate-400 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
