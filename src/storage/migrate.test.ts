import { describe, expect, it } from 'vitest';
import { emptyState } from '../model/empty';
import { migrate } from './migrate';

describe('migrate', () => {
  it('returns an equal state for the current version', () => {
    expect(migrate(emptyState())).toEqual(emptyState());
  });

  it('fills missing optional settings with defaults', () => {
    const old = { ...emptyState(), settings: { lang: 'en' } };
    expect(migrate(old).settings).toEqual({ ...emptyState().settings, lang: 'en' });
  });
});
