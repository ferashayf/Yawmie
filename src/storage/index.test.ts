import { describe, expect, it } from 'vitest';
import { openStorage } from './index';

describe('openStorage', () => {
  it('website mode opens phone storage', async () => {
    const r = await openStorage();
    expect(r.ok).toBe(true);
  });
});
