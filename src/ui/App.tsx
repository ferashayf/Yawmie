import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { strings } from '../i18n';
import { features, mode } from '../mode';
import { emptyState } from '../model/empty';
import type { AppState } from '../model/types';
import { openStorage } from '../storage';
import { requestPersist } from '../storage/persist';
import { AppContext, type App as AppValue, type Tab } from './app-context';
import { CantSave } from './CantSave';
import { startClock, type Clock } from './clock';
import { Dock } from './Dock';
import { Placeholder } from './screens/Placeholder';
import { createStore, type Store } from './store';
import { Toast } from './Toast';
import { drawWaves } from './waves';

const TOAST_MS = 4000;
type Boot = { kind: 'loading' } | { kind: 'cant'; reason: 'signedOut' | 'notAllowed' } | { kind: 'ready'; store: Store };
type ToastState = { text: string; undo?: () => void; action?: { label: string; run: () => void } } | null;

function applyLook(s: AppState) {
  const r = document.documentElement;
  if (s.settings.theme === 'system') delete r.dataset.theme;
  else r.dataset.theme = s.settings.theme;
  r.lang = s.settings.lang;
  r.dir = s.settings.lang === 'ar' ? 'rtl' : 'ltr';
  r.classList.toggle('large', s.settings.textSize === 'large');
}

export function App() {
  const [boot, setBoot] = useState<Boot>({ kind: 'loading' });
  useEffect(() => {
    void (async () => {
      const opened = await openStorage();
      if (!opened.ok) return setBoot({ kind: 'cant', reason: opened.reason });
      const saved = await opened.adapter.load();
      const store = createStore(saved ?? emptyState(), opened.adapter, () => window.dispatchEvent(new CustomEvent('yawmie:savefailed')));
      if (features.dataSafety) void requestPersist();
      setBoot({ kind: 'ready', store });
    })();
  }, []);
  if (boot.kind === 'loading') return null;
  if (boot.kind === 'cant') return <CantSave reason={boot.reason} lang={navigator.language.startsWith('ar') ? 'ar' : 'en'} />;
  return <Shell store={boot.store} />;
}

function Shell({ store }: { store: Store }) {
  const [state, setState] = useState(store.get());
  const [clock, setClock] = useState<Clock>({ today: '', now: '' });
  const [tab, setTab] = useState<Tab>('today');
  const [toast, setToast] = useState<ToastState>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const t = strings(state.settings.lang);

  const showToast = (next: ToastState) => {
    setToast(next);
    clearTimeout(toastTimer.current);
    if (next && !next.action) toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS);
  };

  useEffect(() => store.subscribe(setState), [store]);
  useEffect(() => startClock(setClock), []);
  useEffect(() => {
    applyLook(state);
    if (canvas.current) drawWaves(canvas.current);
  }, [state.settings.theme, state.settings.lang, state.settings.textSize]);
  useEffect(() => {
    const redraw = () => canvas.current && drawWaves(canvas.current);
    const failed = () => showToast({ text: strings(store.get().settings.lang).saveFailed });
    window.addEventListener('resize', redraw);
    window.addEventListener('yawmie:savefailed', failed);
    if (mode === 'website') void import('./pwa').then((m) => m.watchForUpdate((apply) => showToast({ text: t.updateAvailable, action: { label: t.updateNow, run: apply } })));
    return () => {
      window.removeEventListener('resize', redraw);
      window.removeEventListener('yawmie:savefailed', failed);
    };
  }, []);

  const app: AppValue = useMemo(
    () => ({
      state,
      today: clock.today,
      now: clock.now,
      features,
      t,
      tab,
      go: setTab,
      update(fn, note) {
        const before = store.get();
        store.update(fn);
        if (note) showToast({ text: note.text, undo: note.undo ? () => { store.update(() => before); setToast(null); } : undefined });
      },
    }),
    [state, clock, tab, t],
  );

  if (!clock.today) return null;
  return (
    <AppContext.Provider value={app}>
      <div class="stage">
        <div class="phone">
          <canvas ref={canvas} id="waves" aria-hidden="true" />
          <main class="screen"><Placeholder tab={tab} /></main>
          <Dock onBuddy={() => {}} />
          {toast && <Toast text={toast.text} onUndo={toast.undo} action={toast.action} />}
        </div>
      </div>
    </AppContext.Provider>
  );
}
