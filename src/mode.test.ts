import { describe, expect, it } from 'vitest';
import { ARTIFACT_REMINDERS, featuresFor, mode } from './mode';

describe('mode', () => {
  it('features follow mode: website shows everything', () => {
    expect(featuresFor('website')).toEqual({ dataSafety: true, importBackup: true, mic: true, reminders: true });
  });

  it('features follow mode: artifact hides data safety, import, mic and reminders', () => {
    expect(featuresFor('artifact')).toEqual({ dataSafety: false, importBackup: false, mic: false, reminders: ARTIFACT_REMINDERS });
    expect(ARTIFACT_REMINDERS).toBe(false);
  });

  it('tests run as the website app', () => {
    expect(mode).toBe('website');
  });
});
