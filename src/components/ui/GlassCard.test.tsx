import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GlassCard from './GlassCard';

describe('GlassCard', () => {
  it('renders children', () => {
    render(<GlassCard>Hello</GlassCard>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<GlassCard className="custom-class">Content</GlassCard>);
    expect(screen.getByText('Content')).toHaveClass('custom-class');
  });

  it('supports hover lift effect by default', () => {
    render(<GlassCard>Card</GlassCard>);
    expect(screen.getByText('Card')).toHaveClass('hover:-translate-y-0.5');
  });
});
