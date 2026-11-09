import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { strings } from '../i18n';
import { features, mode } from '../mode';
import { emptyState } from '../model/empty';
import type { AppState } from '../model/types';
import { openStorage } from '../storage';
import { requestPersist } from '../storage/persist';
import { finishItem } from '../logic/recurrence';
import { AppContext, type App as AppValue, type SheetRequest, type Tab } from './app-context';
import { CantSave } from './CantSave';
import { startClock, type Clock } from './clock';
import { Dock } from './Dock';
import { Placeholder } from './screens/Placeholder';
import { Today } from './screens/Today';
import { Plan } from './screens/Plan';
import { BlockPage } from './screens/BlockPage';
import { Focus } from './Focus';
import { AreaSheet } from './sheets/AreaSheet';
import { DetailsSheet } from './sheets/DetailsSheet';
import { ReviewSheet } from './sheets/ReviewSheet';
import { Tasks } from './screens/Tasks';
import { Money } from './screens/Money';
import { BillSheet, PasteSheet, SpendSheet } from './sheets/MoneySheets';
import { ChatSheet, type ChatMsg } from './sheets/ChatSheet';
import { Bubble } from './Bubble';
import { parseAll } from '../logic/parser';
import type { PlanView } from './app-context';
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
  const [sheet, setSheet] = useState<SheetRequest | null>(null);
  const [page, setPage] = useState<SheetRequest | null>(null); // the block page, under any sheet
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [bubble, setBubble] = useState(true);
  const [plan, setPlanView] = useState<PlanView>({ day: '', week: 0, area: 'all', editing: false });
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

  const app: AppValue = useMemo<AppValue>(
    () => ({
      state,
      today: clock.today,
      now: clock.now,
      features,
      t,
      tab,
      go: (next) => {
        setTab(next);
        setSheet(null);
        setPage(null);
      },
      update(fn, note) {
        const before = store.get();
        store.update(fn);
        if (note) showToast({ text: note.text, undo: note.undo ? () => { store.update(() => before); setToast(null); } : undefined });
      },
      sheet,
      open(req) {
        if (req.kind !== 'block') return setSheet(req);
        setPage(req);
        setSheet(null);
      },
      close: () => (sheet ? setSheet(null) : setPage(null)),
      plan,
      setPlan: (patch) => setPlanView((p) => ({ ...p, ...patch })),
      finish(id) {
        app.update((s) => ({ ...s, items: s.items.map((x) => (x.id === id ? finishItem(x, clock.today) : x)) }), { text: t.done, undo: true });
      },
    }),
    [state, clock, tab, t, sheet, page, plan],
  );

  if (!clock.today) return null;
  return (
    <AppContext.Provider value={app}>
      <div class="stage">
        <div class="phone">
          <canvas ref={canvas} id="waves" aria-hidden="true" />
          <main class="screen">
            {page?.id ? <BlockPage id={page.id} day={page.date ?? clock.today} /> : tab === 'today' ? <Today /> : tab === 'plan' ? <Plan /> : tab === 'tasks' ? <Tasks /> : tab === 'money' ? <Money /> : <Placeholder tab={tab} />}
          </main>
          <Dock onBuddy={() => setSheet({ kind: 'chat' })} />
          {sheet?.kind === 'focus' && sheet.id && <Focus id={sheet.id} />}
          {sheet?.kind === 'area' && <AreaSheet />}
          {sheet && <AddOrEdit req={sheet} today={clock.today} />}
          {sheet?.kind === 'chat' && <ChatSheet log={chat} setLog={setChat} />}
          {bubble && !sheet && !page && <Bubble onClose={() => setBubble(false)} />}
          {toast && <Toast text={toast.text} onUndo={toast.undo} action={toast.action} />}
        </div>
      </div>
    </AppContext.Provider>
  );
}

// Add (quick add, Add buttons, block page) and details: one task/appointment → the details page; money or several lines → the review list.
function AddOrEdit({ req, today }: { req: SheetRequest; today: string }) {
  if (req.kind === 'details' && req.id) return <DetailsSheet id={req.id} />;
  if (req.kind === 'review') return <ReviewSheet text={req.text} date={req.date} />;
  if (req.kind === 'spend') return <SpendSheet categoryId={req.id} />;
  if (req.kind === 'bill') return <BillSheet id={req.id} ym={req.date} />;
  if (req.kind === 'paste') return <PasteSheet />;
  if (req.kind !== 'add') return null;
  const text = req.text?.trim() ?? '';
  if (!text) return <DetailsSheet date={req.date} blockId={req.blockId} />;
  const drafts = parseAll(text, today, req.date && req.date !== today ? req.date : undefined);
  const one = drafts.length === 1 && drafts[0].kind !== 'expense' && drafts[0].kind !== 'bill';
  return one ? <DetailsSheet draft={drafts[0]} date={req.date} blockId={req.blockId} /> : <ReviewSheet text={text} date={req.date} />;
}
