import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnimatedButton from './AnimatedButton';

describe('AnimatedButton', () => {
  it('renders children', () => {
    render(<AnimatedButton>Click</AnimatedButton>);
    expect(screen.getByRole('button', { name: 'Click' })).toBeInTheDocument();
  });

  it('shows loading text when loading', () => {
    render(<AnimatedButton loading loadingText="Saving...">Save</AnimatedButton>);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows success state', () => {
    render(<AnimatedButton success>Save</AnimatedButton>);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
});
