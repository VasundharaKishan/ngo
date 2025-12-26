import { fireEvent, render, screen, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import { ToastProvider, useToast } from './ToastProvider';

function TestComponent() {
  const showToast = useToast();
  return (
    <button onClick={() => showToast('Saved!', 'success')} aria-label="trigger-toast">
      Trigger
    </button>
  );
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('shows a toast message when triggered', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByLabelText('trigger-toast'));
    });

    expect(screen.getByText('Saved!')).toBeInTheDocument();

    act(() => {
      vi.runAllTimers();
    });
  });

  it('auto-dismisses a toast after timeout', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByLabelText('trigger-toast'));
      vi.advanceTimersByTime(4100);
    });

    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });
});
