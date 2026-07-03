'use client';

import { useState } from 'react';
import type { RawRequirement, Gender, Season, FunctionTag, Scene } from '@/types';

interface RequirementFormProps {
  onSubmit: (data: RawRequirement) => void;
  onCompareSubmit?: (data: RawRequirement) => void;
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

export default function RequirementForm({ onSubmit, onCompareSubmit, isLoading }: RequirementFormProps) {
  const [mode, setMode] = useState<'natural' | 'structured'>('natural');
  const [text, setText] = useState('');
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
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            mode === 'natural'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          自然语言输入
        </button>
        <button
          onClick={() => setMode('structured')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            mode === 'structured'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
                className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
              >
                {example.label}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="请输入你的产品需求，例如：我要做一款女款春秋轻户外冲锋衣，适合城市通勤和露营，要求防小雨、防风、不闷，零售价399元以内，首单100件。"
            rows={6}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleNaturalSubmit}
              disabled={isLoading || !text.trim()}
              className="py-3 px-6 rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:from-slate-600 disabled:to-slate-500 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? '生成中...' : '🚀 生成单方案'}
            </button>
            {onCompareSubmit && (
              <button
                onClick={() => onCompareSubmit({ text: text.trim() })}
                disabled={isLoading || !text.trim()}
                className="py-3 px-6 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:from-slate-600 disabled:to-slate-500 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? '生成中...' : '📊 生成三套方案对比'}
              </button>
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
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">直接输入想做的服装类型，系统会根据描述自动匹配</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">性别</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    formData.scenes?.includes(scene)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">风格倾向</label>
              <input
                type="text"
                value={formData.stylePreference}
                onChange={(e) => setFormData({ ...formData, stylePreference: e.target.value })}
                placeholder="城市轻户外、显瘦、日常通勤"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    formData.functions?.includes(func)
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleStructuredSubmit}
              disabled={isLoading || (!formData.category)}
              className="py-3 px-6 rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:from-slate-600 disabled:to-slate-500 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? '生成中...' : '🚀 生成单方案'}
            </button>
            {onCompareSubmit && (
              <button
                onClick={() => onCompareSubmit(formData)}
                disabled={isLoading || (!formData.category)}
                className="py-3 px-6 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:from-slate-600 disabled:to-slate-500 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? '生成中...' : '📊 生成三套方案对比'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
