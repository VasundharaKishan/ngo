import { describe, expect, it, vi, beforeEach } from 'vitest';

// Keep render mock accessible for assertions
const renderMock = vi.fn();

vi.mock('react-dom/client', () => {
  const createRootMock = vi.fn(() => ({ render: renderMock }));
  return { __esModule: true, createRoot: createRootMock };
});

describe('main entrypoint', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    renderMock.mockClear();
  });

  it('bootstraps the React app at #root', async () => {
    vi.resetModules();
    const { createRoot } = await import('react-dom/client');
    await import('./main');

    const root = document.getElementById('root');
    expect(createRoot).toHaveBeenCalledWith(root);
    expect(renderMock).toHaveBeenCalledTimes(1);
  });
});
