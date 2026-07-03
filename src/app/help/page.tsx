import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '使用帮助 | AI户外服饰智能设计Agent',
  description: '快速上手指南，了解如何用自然语言生成服装研发方案',
};

const SECTIONS = [
  {
    id: 'intro',
    title: '产品简介',
    icon: '🧥',
    content: `AI户外服饰智能设计Agent 是面向中小户外服饰商家和服装研发团队的小单快反研发助手。

你只需用自然语言描述想要做的产品，例如："女款春秋冲锋衣，适合通勤和露营，零售价399元以内"，系统就会自动完成需求解析、面料推荐、款式生成、BOM成本核算、营销文案和风险提醒，输出一份完整的研发方案。`,
  },
  {
    id: 'quickstart',
    title: '快速开始',
    icon: '🚀',
    content: `1. 点击首页示例需求，或直接点击"开始生成研发方案"
2. 在输入框中用自然语言描述你的产品需求
3. 点击"生成单方案"或"生成三套方案对比"
4. 等待 5-15 秒，查看右侧自动生成的研发方案

支持的描述维度包括：品类、性别、年龄、场景、季节、价格、订单量、功能优先级等。`,
  },
  {
    id: 'input',
    title: '如何描述需求',
    icon: '📝',
    content: `需求越具体，方案越精准。建议包含以下信息：

• 品类：冲锋衣、软壳外套、防晒衣、羽绒服、T恤、卫衣、连衣裙、牛仔裤、袜子、帽子等
• 性别/人群：女款、男款、中性、25-35岁都市白领
• 场景：通勤、露营、徒步、骑行、跑步、旅游
• 季节：春季、夏季、秋冬、四季
• 价格：零售价预算，如 399元以内
• 订单量：首单数量，如 100件、500件
• 功能：防水、防风、透湿、防晒、保暖、轻量、弹力

示例："男款秋冬软壳外套，适合徒步和骑行，要求防风、保暖、弹力，零售价599元以内，首单300件。"`,
  },
  {
    id: 'result',
    title: '结果解读',
    icon: '📋',
    content: `生成的研发方案包含以下模块：

• 需求解析：把自然语言转化为结构化参数
• 面料推荐：提供 A/B/C 三套面料方案，含成分、克重、价格、供应商等信息
• 款式设计：版型、衣长、帽子、门襟、口袋、袖口等结构建议
• BOM成本：面料、辅料、工费、损耗、打样摊销等明细
• 营销文案：商品标题、核心卖点、抖音口播稿、详情页文案、直播间话术
• 风险提醒：成本、面料、生产、宣传等风险提示
• AI效果图：可选摄影、线稿、3D三种风格生成产品效果图`,
  },
  {
    id: 'compare',
    title: '多方案对比',
    icon: '📊',
    content: `一次生成基础版/中端版/高端版三套方案，并排展示面料、款式、成本、利润，方便老板或客户做决策。

你也可以在历史记录中，点击"对比模式"，勾选 2-3 个历史单方案，一键对比。`,
  },
  {
    id: 'history',
    title: '历史记录与收藏',
    icon: '📜',
    content: `每次生成的方案会自动保存到历史记录中。你可以：

• 按品类筛选历史方案
• 搜索标题或品类
• 点击"☆ 收藏"只查看收藏方案
• 点击历史记录重新加载查看
• 在历史记录中删除不需要的方案`,
  },
  {
    id: 'copy',
    title: '文案换一换与编辑',
    icon: '🔄',
    content: `在营销文案模块中：

• "换一换"：基于当前方案重新 AI 生成一组新文案，可选择默认、高端、年轻三种语气
• "⭐ 收藏"：把当前喜欢的文案保存到本地收藏夹
• "收藏夹"：查看和管理所有收藏的文案
• "编辑"：鼠标悬停在核心卖点上会出现"编辑"按钮，点击可修改单条卖点`,
  },
  {
    id: 'image',
    title: 'AI效果图',
    icon: '🎨',
    content: `在单方案结果中，点击"生成效果图"可以根据当前方案生成产品设计图。

支持三种风格：
• 摄影：白底产品摄影效果，最接近电商主图
• 线稿：服装线稿图，适合设计手稿
• 3D：立体渲染效果图

使用前请先在右上角"配置"中填写阿里云 DashScope API Key。`,
  },
  {
    id: 'export',
    title: '导出与分享',
    icon: '📤',
    content: `• 导出：单方案支持导出 Markdown 或 Word；三套方案对比支持导出 Word
• 分享：点击"分享"按钮生成二维码和链接，可分享给微信同事或客户查看
• 分享链接有效期 30 天，数据保存在本地浏览器`,
  },
  {
    id: 'settings',
    title: 'API配置',
    icon: '⚙️',
    content: `点击页面右上角"配置"按钮，可设置：

• DeepSeek / 通义千问 API Key：用于自然语言解析、面料推荐、营销文案生成
• 阿里云 DashScope API Key：用于 AI 效果图生成

系统会优先使用真实 AI API；未配置时会自动回退到本地规则模板。`,
  },
  {
    id: 'faq',
    title: '常见问题',
    icon: '❓',
    content: `Q：为什么生成的面料推荐里有时会出现"通用参考面料"？
A：说明当前品类的专属面料数据还在补充中，系统会用规则筛选出的通用面料作为参考。

Q：AI 效果图为什么显示"未配置 Key"？
A：请先在"配置"中填写阿里云 DashScope API Key。

Q：历史记录会保存在哪里？
A：历史记录、收藏的文案和分享链接都保存在浏览器本地（localStorage），不会上传到服务器。

Q：可以批量导出多个方案吗？
A：目前支持单方案导出和三套方案对比导出，后续会支持历史记录批量导出。`,
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">📖 使用帮助</h1>
            <p className="text-slate-400 mt-2">快速上手 AI户外服饰智能设计Agent</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            ← 返回首页
          </Link>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">目录</h2>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-900/70 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {section.icon} {section.title}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 scroll-mt-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>{section.icon}</span>
                {section.title}
              </h2>
              <div className="text-slate-300 text-sm leading-7 whitespace-pre-line">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/generator"
            className="inline-block px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all text-lg"
          >
            🚀 开始生成研发方案
          </Link>
        </div>
      </div>
    </main>
  );
}
