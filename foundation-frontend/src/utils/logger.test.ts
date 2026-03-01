import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('error always logs with context prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('TestComponent', 'something failed', { detail: 42 });
    expect(spy).toHaveBeenCalledWith('[TestComponent]', 'something failed', { detail: 42 });
  });

  it('error logs without prefix when context is undefined', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error(undefined, 'raw error');
    expect(spy).toHaveBeenCalledWith('raw error');
  });

  it('warn logs in dev mode', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('Test', 'a warning');
    expect(spy).toHaveBeenCalledWith('[Test]', 'a warning');
  });
});
