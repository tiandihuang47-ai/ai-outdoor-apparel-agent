import { NextRequest, NextResponse } from 'next/server';
import { exportMarkdown } from '@/lib/exportMarkdown';
import { exportWord } from '@/lib/exportWord';
import { exportScenariosWord, exportBatchWord } from '@/lib/exportScenariosWord';
import { exportScenariosMarkdown, exportBatchMarkdown } from '@/lib/exportScenariosMarkdown';
import { exportTechPackToExcel } from '@/lib/excelExport';
import type { GenerationResult } from '@/types';

interface ScenarioPayload {
  tier: 'basic' | 'mid' | 'premium';
  tierName: string;
  targetPrice: number;
  result: GenerationResult;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const format = request.nextUrl.searchParams.get('format') || 'markdown';
    const dateStr = new Date().toISOString().slice(0, 10);

    // 三套方案对比导出
    if (body.scenarios && Array.isArray(body.scenarios) && body.scenarios.length > 0) {
      const scenarios: ScenarioPayload[] = body.scenarios;
      const category = scenarios[0]?.result.parsedRequirement.category || '服装';
      const baseName = `多套方案对比_${category}_${dateStr}`;

      if (format === 'doc') {
        const html = exportScenariosWord(scenarios);
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'application/msword; charset=utf-8',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(baseName)}.doc"`,
          },
        });
      }

      const markdown = exportScenariosMarkdown(scenarios);
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(baseName)}.md"`,
        },
      });
    }

    // 批量历史方案导出
    if (body.results && Array.isArray(body.results) && body.results.length > 0) {
      const results: GenerationResult[] = body.results;
      const baseName = `批量导出研发方案_${dateStr}`;

      if (format === 'doc') {
        const html = exportBatchWord(results);
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'application/msword; charset=utf-8',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(baseName)}.doc"`,
          },
        });
      }

      const markdown = exportBatchMarkdown(results);
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(baseName)}.md"`,
        },
      });
    }

    const result: GenerationResult = body;
    const baseName = `研发方案_${result.parsedRequirement.category}_${dateStr}`;

    if (format === 'techpack') {
      if (!result.techPack) {
        return NextResponse.json({ error: '该方案没有 Tech Pack 数据' }, { status: 400 });
      }

      const buffer = exportTechPackToExcel(result.techPack);
      const techPackBaseName = `TechPack_${result.parsedRequirement.category}_${dateStr}`;
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(techPackBaseName)}.xlsx"`,
        },
      });
    }

    if (format === 'doc') {
      const html = exportWord(result);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'application/msword; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(baseName)}.doc"`,
        },
      });
    }

    const markdown = exportMarkdown(result);
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(baseName)}.md"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: '导出失败，请重试' },
      { status: 500 }
    );
  }
}
