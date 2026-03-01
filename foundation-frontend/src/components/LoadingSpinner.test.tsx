import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<LoadingSpinner text="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });

  it('renders without text when text prop is not provided', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.loading-spinner-text')).toBeNull();
  });

  it('applies small size class', () => {
    const { container } = render(<LoadingSpinner size="small" />);
    expect(container.querySelector('.loading-spinner-small')).toBeInTheDocument();
  });

  it('applies large size class', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    expect(container.querySelector('.loading-spinner-large')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="my-custom-class" />);
    expect(container.querySelector('.my-custom-class')).toBeInTheDocument();
  });
});
