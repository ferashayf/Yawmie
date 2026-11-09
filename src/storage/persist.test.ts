import { afterEach, describe, expect, it, vi } from 'vitest';
import { isProtected, isStandalone, requestPersist } from './persist';

afterEach(() => vi.unstubAllGlobals());

describe('persist', () => {
  it('Protected when the iPhone said yes this session, even if persisted() still says false', async () => {
    vi.stubGlobal('navigator', { storage: { persist: async () => true, persisted: async () => false } });
    expect(await requestPersist()).toBe(true);
    expect(await isProtected()).toBe(true);
  });

  it('no storage API → not protected, no crash', async () => {
    vi.stubGlobal('navigator', {});
    expect(await requestPersist()).toBe(false);
  });

  it('isStandalone reads display-mode', () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(display-mode: standalone)' }));
    expect(isStandalone()).toBe(true);
  });
});
