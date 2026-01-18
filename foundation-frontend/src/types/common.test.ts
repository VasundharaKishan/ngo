import { describe, it, expect } from 'vitest';
import type { JsonConfig } from './common';

describe('types/common', () => {
  it('allows JsonConfig shape', () => {
    const config: JsonConfig = { title: 'Hello', enabled: true, items: [{ label: 'One' }] };
    expect(config.title).toBe('Hello');
  });
});
