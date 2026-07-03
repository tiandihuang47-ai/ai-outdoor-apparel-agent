import type { ParsedRequirement, StyleTemplate } from '@/types';
import templatesData from '@/data/styleTemplates.json';

export function selectStyleTemplate(requirement: ParsedRequirement): StyleTemplate {
  const templates = templatesData as StyleTemplate[];

  const relevantTemplates = templates.filter((t) => {
    if (t.category !== requirement.category) return false;
    if (t.gender !== requirement.gender && t.gender !== '中性' && requirement.gender !== '中性') return false;
    return true;
  });

  if (relevantTemplates.length === 0) {
    const categoryTemplates = templates.filter((t) => t.category === requirement.category);
    if (categoryTemplates.length > 0) {
      return categoryTemplates[0];
    }
    // Fallback: use a generic template adapted to the requested category
    return createFallbackTemplate(templates[0], requirement);
  }

  const scored = relevantTemplates.map((template) => {
    let score = 0;

    const sceneMatch = requirement.scenes.filter((s) => template.scenes.includes(s)).length;
    score += sceneMatch * 30;

    if (template.gender === requirement.gender) score += 25;

    const priceInRange =
      requirement.targetPrice >= template.suitablePriceRange.min &&
      requirement.targetPrice <= template.suitablePriceRange.max;
    if (priceInRange) score += 20;

    const seasonMatch = template.season === requirement.season;
    if (seasonMatch) score += 15;

    if (requirement.quickResponseRequired && template.productionDifficulty === '低') {
      score += 10;
    }

    if (requirement.styleKeywords) {
      for (const keyword of requirement.styleKeywords) {
        const combinedText = `${template.name} ${template.silhouette} ${template.length}`;
        if (combinedText.includes(keyword)) {
          score += 15;
        }
      }
    }

    return { template, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].template;
}

function createFallbackTemplate(baseTemplate: StyleTemplate, requirement: ParsedRequirement): StyleTemplate {
  return {
    ...baseTemplate,
    id: 'fallback_template',
    name: `${requirement.category}通用款式模板`,
    category: requirement.category,
    designReason: `系统暂未收录「${requirement.category}」的专属款式模板，以下为基于通用户外服装的参考方案，建议后续补充该品类的专业模板。`,
    riskNotes: `当前使用的是通用款式模板，实际生产时请根据${requirement.category}的工艺特点调整。`,
  };
}
