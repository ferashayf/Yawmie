import type { ComponentChildren } from 'preact';
import { useApp } from './app-context';
import { Icon } from './Icon';

const isDark = (theme: string) => theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);

// ☀︎/☾, ع/EN and the gear (✕ on Settings), at the top of every screen.
function TopButtons() {
  const { state, t, tab, go, update } = useApp();
  const dark = isDark(state.settings.theme);
  const setSetting = (patch: Partial<typeof state.settings>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  return (
    <div class="top-btns">
      <button class="round glass" aria-label={dark ? t.dayMode : t.nightMode} title={dark ? t.dayMode : t.nightMode} onClick={() => setSetting({ theme: dark ? 'light' : 'dark' })}>
        <Icon name={dark ? 'sun' : 'moon'} />
      </button>
      <button class="round glass" aria-label="Switch language" onClick={() => setSetting({ lang: state.settings.lang === 'ar' ? 'en' : 'ar' })}>
        {state.settings.lang === 'ar' ? 'EN' : 'ع'}
      </button>
      {tab === 'settings' ? (
        <button class="round glass" aria-label={t.close} onClick={() => go('today')}><Icon name="close" /></button>
      ) : (
        <button class="round glass" aria-label={t.more} title={t.more} onClick={() => go('settings')}><Icon name="gear" /></button>
      )}
    </div>
  );
}

export function Header({ title, sub, start }: { title: ComponentChildren; sub?: ComponentChildren; start?: ComponentChildren }) {
  return (
    <header class="top">
      <div class="toolbar">{start}<TopButtons /></div>
      {sub && <div class="eyebrow num">{sub}</div>}
      <h1>{title}</h1>
    </header>
  );
}
