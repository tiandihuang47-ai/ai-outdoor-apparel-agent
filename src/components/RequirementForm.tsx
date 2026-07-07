'use client';

import { useState } from 'react';
import type { RawRequirement, Gender, Season, FunctionTag, Scene, ParsedRequirement } from '@/types';
import AnimatedButton from '@/components/ui/AnimatedButton';
import ImageUploader from './ImageUploader';

interface RequirementFormProps {
  onSubmit: (data: RawRequirement) => void;
  onCompareSubmit?: (data: RawRequirement) => void;
  onImageAnalyzed?: (parsed: ParsedRequirement) => void;
  isLoading: boolean;
}

const EXAMPLE_REQUIREMENTS = [
  {
    label: '示例1：女款冲锋衣',
    text: '我要做一款女款春秋轻户外冲锋衣，适合城市通勤和露营，要求防小雨、防风、不闷，零售价399元以内，首单100件。',
  },
  {
    label: '示例2：男款软壳外套',
    text: '我要做一款男款软壳外套，适合秋冬徒步和骑行，要求保暖、防风、弹力，零售价599元以内，首单300件。',
  },
  {
    label: '示例3：女款防晒衣',
    text: '我要做一款女款夏季轻薄防晒衣，适合通勤和旅游，要求UPF50+防晒、透气、轻量，零售价199元以内，首单500件。',
  },
];

const GENDER_OPTIONS: Gender[] = ['女款', '男款', '中性'];
const SEASON_OPTIONS: Season[] = ['春秋', '夏季', '冬季'];
const SCENE_OPTIONS: Scene[] = ['通勤', '露营', '徒步', '骑行'];
const FUNCTION_OPTIONS: FunctionTag[] = ['防水', '防泼水', '防风', '透湿', '轻量', '防晒', '保暖', '弹力'];

export default function RequirementForm({ onSubmit, onCompareSubmit, onImageAnalyzed, isLoading }: RequirementFormProps) {
  const [mode, setMode] = useState<'natural' | 'structured'>('natural');
  const [text, setText] = useState('');
  const [analysisDescription, setAnalysisDescription] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [autoGenerating, setAutoGenerating] = useState(false);

  const applyAnalysisToForm = (parsed: ParsedRequirement) => {
    setFormData((prev) => ({
      ...prev,
      category: parsed.category || prev.category,
      gender: parsed.gender || prev.gender,
      ageRange: parsed.ageRange || prev.ageRange,
      scenes: parsed.scenes?.length ? parsed.scenes : prev.scenes,
      season: parsed.season || prev.season,
      targetPrice: parsed.targetPrice || prev.targetPrice,
      orderQuantity: parsed.orderQuantity || prev.orderQuantity,
      functions: parsed.functionPriorities?.length ? parsed.functionPriorities : prev.functions,
      stylePreference: parsed.stylePositioning || prev.stylePreference,
    }));

    const keywordText = parsed.styleKeywords?.length ? `，款式关键词：${parsed.styleKeywords.join('、')}` : '';
    const newText = `根据图片分析：${parsed.category}，${parsed.gender}，${parsed.season}，适用场景${parsed.scenes?.join('、')}，风格定位${parsed.stylePositioning}${keywordText}。`;
    setText(newText);
  };
  const [formData, setFormData] = useState<RawRequirement>({
    category: '冲锋衣',
    gender: '女款',
    ageRange: '25-40岁',
    scenes: ['通勤'],
    season: '春秋',
    targetPrice: 399,
    orderQuantity: 100,
    functions: ['防风', '防泼水', '透湿'],
    stylePreference: '城市轻户外',
    notes: '',
  });

  const handleFillExample = (example: (typeof EXAMPLE_REQUIREMENTS)[0]) => {
    setText(example.text);
    setMode('natural');
  };

  const handleNaturalSubmit = () => {
    if (!text.trim()) return;
    onSubmit({ text: text.trim() });
  };

  const handleStructuredSubmit = () => {
    onSubmit(formData);
  };

  const toggleScene = (scene: Scene) => {
    setFormData((prev) => ({
      ...prev,
      scenes: prev.scenes?.includes(scene)
        ? prev.scenes.filter((s) => s !== scene)
        : [...(prev.scenes || []), scene],
    }));
  };

  const toggleFunction = (func: FunctionTag) => {
    setFormData((prev) => ({
      ...prev,
      functions: prev.functions?.includes(func)
        ? prev.functions.filter((f) => f !== func)
        : [...(prev.functions || []), func],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('natural')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
            mode === 'natural'
              ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:border-slate-500'
          }`}
        >
          自然语言输入
        </button>
        <button
          onClick={() => setMode('structured')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
            mode === 'structured'
              ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:border-slate-500'
          }`}
        >
          结构化表单
        </button>
      </div>

      {mode === 'natural' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-slate-400 pt-1">示例需求：</span>
            {EXAMPLE_REQUIREMENTS.map((example) => (
              <button
                key={example.label}
                onClick={() => handleFillExample(example)}
                className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:border-slate-500 hover:text-white transition-all"
              >
                {example.label}
              </button>
            ))}
          </div>

          <ImageUploader
            onAnalyzed={(data) => {
              setAnalysisError(null);
              setAnalysisDescription(data.description);
              setAutoGenerating(!!onImageAnalyzed);
              applyAnalysisToForm(data.parsedRequirement);
              onImageAnalyzed?.(data.parsedRequirement);
            }}
            onError={(message) => {
              setAnalysisError(message);
              setAnalysisDescription(null);
            }}
            disabled={isLoading}
          />

          {analysisDescription && (
            <div className="text-sm text-cyan-300 bg-cyan-900/20 border border-cyan-500/30 rounded-lg px-3 py-2">
              ✨ 图片识别：{analysisDescription}
              {autoGenerating && '，已根据图片信息开始生成方案...'}
            </div>
          )}

          {analysisError && (
            <div className="text-sm text-red-300 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
              ⚠️ {analysisError}
            </div>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="请输入你的产品需求，例如：我要做一款女款春秋轻户外冲锋衣，适合城市通勤和露营，要求防小雨、防风、不闷，零售价399元以内，首单100件。"
            rows={6}
            className="w-full bg-slate-900/80 border border-slate-600 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 resize-none transition-all"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatedButton
              onClick={handleNaturalSubmit}
              loading={isLoading}
              loadingText="生成中..."
              disabled={!text.trim()}
              className="w-full py-3"
            >
              🚀 生成单方案
            </AnimatedButton>
            {onCompareSubmit && (
              <AnimatedButton
                onClick={() => onCompareSubmit({ text: text.trim() })}
                loading={isLoading}
                loadingText="生成中..."
                disabled={!text.trim()}
                variant="purple"
                className="w-full py-3"
              >
                📊 生成三套方案对比
              </AnimatedButton>
            )}
          </div>
        </div>
      )}

      {mode === 'structured' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">产品品类</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="例如：冲锋衣、连衣裙、羽绒服、牛仔裤"
              className="w-full bg-slate-900/80 border border-slate-600 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
            <p className="text-xs text-slate-500 mt-1">直接输入想做的服装类型，系统会根据描述自动匹配</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">性别</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="w-full bg-slate-900/80 border border-slate-600 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              >
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">年龄段</label>
              <input
                type="text"
                value={formData.ageRange}
                onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-600 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">使用场景</label>
            <div className="flex flex-wrap gap-2">
              {SCENE_OPTIONS.map((scene) => (
                <button
                  key={scene}
                  onClick={() => toggleScene(scene)}
                  className={`px-3 py-1.5 rounded-xl text-sm transition-all ${
                    formData.scenes?.includes(scene)
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  {scene}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">季节</label>
              <select
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value as Season })}
                className="w-full bg-slate-900/80 border border-slate-600 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              >
                {SEASON_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">价格带</label>
              <input
                type="number"
                value={formData.targetPrice}
                onChange={(e) => setFormData({ ...formData, targetPrice: Number(e.target.value) })}
                className="w-full bg-slate-900/80 border border-slate-600 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">订单量</label>
              <input
                type="number"
                value={formData.orderQuantity}
                onChange={(e) => setFormData({ ...formData, orderQuantity: Number(e.target.value) })}
                className="w-full bg-slate-900/80 border border-slate-600 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">风格倾向</label>
              <input
                type="text"
                value={formData.stylePreference}
                onChange={(e) => setFormData({ ...formData, stylePreference: e.target.value })}
                placeholder="城市轻户外、显瘦、日常通勤"
                className="w-full bg-slate-900/80 border border-slate-600 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">核心功能</label>
            <div className="flex flex-wrap gap-2">
              {FUNCTION_OPTIONS.map((func) => (
                <button
                  key={func}
                  onClick={() => toggleFunction(func)}
                  className={`px-3 py-1.5 rounded-xl text-sm transition-all ${
                    formData.functions?.includes(func)
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  {func}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">备注（可选）</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="其他补充说明"
              rows={3}
              className="w-full bg-slate-900/80 border border-slate-600 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatedButton
              onClick={handleStructuredSubmit}
              loading={isLoading}
              loadingText="生成中..."
              disabled={!formData.category}
              className="w-full py-3"
            >
              🚀 生成单方案
            </AnimatedButton>
            {onCompareSubmit && (
              <AnimatedButton
                onClick={() => onCompareSubmit(formData)}
                loading={isLoading}
                loadingText="生成中..."
                disabled={!formData.category}
                variant="purple"
                className="w-full py-3"
              >
                📊 生成三套方案对比
              </AnimatedButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
