import { useEffect, useState } from 'preact/hooks';
import type { AppState } from '../../model/types';
import { exportBackup } from '../../storage/backup';
import { useApp } from '../app-context';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { SheetShell } from './DetailsSheet';

const STEP_ICONS: IconName[] = ['share', 'backup', 'restore'];

// "Keep your data safe": the 3 steps and the delete-icon warning (website app only, PRD S5, 6.16).
export function StepsSheet() {
  const { t } = useApp();
  return (
    <SheetShell title={t.safeT}>
      <div class="glass stepl">
        {(t.steps as [string, string][]).map(([title, text], i) => (
          <div class="step"><span class="snum num">{i + 1}</span><div><b>{title}</b><p>{text}</p></div><span class="sic"><Icon name={STEP_ICONS[i]} /></span></div>
        ))}
      </div>
      <div class="warnbox"><Icon name="lock" /><span>{t.warnDel}</span></div>
    </SheetShell>
  );
}

// Runs Export once (Share sheet, download, or Claude's save prompt), then closes.
export function ExportRunner() {
  const { state, today, t, update, close } = useApp();
  useEffect(() => {
    void exportBackup(state, today).then(
      (r) => {
        if (r === 'saved') update((s) => ({ ...s, lastBackupAt: today }), { text: t.lastBackup(0) });
        close();
      },
      () => {
        update((s) => s, { text: t.exportFailed });
        close();
      },
    );
  }, []);
  return null;
}

// Import: the file is checked first; a summary is shown; data is replaced only after "Replace" (PRD S1).
export function ImportSheet({ incoming }: { incoming: AppState }) {
  const { t, update, close } = useApp();
  const counts = { items: incoming.items.length, bills: incoming.bills.length, expenses: incoming.expenses.length };
  const [busy, setBusy] = useState(false);
  return (
    <SheetShell title={t.importBtn}>
      <p style={{ margin: 0 }}>{t.importQ(counts)}</p>
      <div class="acts">
        <button class="btn accent" disabled={busy} onClick={() => { setBusy(true); update(() => incoming, { text: t.imported, undo: true }); close(); }}>{t.importYes}</button>
        <button class="btn" onClick={close}>{t.back}</button>
      </div>
    </SheetShell>
  );
}
