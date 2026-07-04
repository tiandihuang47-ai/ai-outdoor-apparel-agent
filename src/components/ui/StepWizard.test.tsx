import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StepWizard from './StepWizard';

const steps = ['输入需求', '生成方案', '查看结果', '导出分享'];

describe('StepWizard', () => {
  it('renders all steps', () => {
    render(<StepWizard steps={steps} currentStep={0} />);
    steps.forEach((step) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });

  it('highlights current step', () => {
    render(<StepWizard steps={steps} currentStep={1} />);
    const active = screen.getByText('生成方案').closest('li');
    expect(active).toHaveClass('text-cyan-400');
  });

  it('marks completed steps', () => {
    render(<StepWizard steps={steps} currentStep={2} />);
    const completed = screen.getByText('输入需求').closest('li');
    expect(completed).toHaveClass('text-emerald-400');
  });
});
