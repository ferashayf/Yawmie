import { useEffect, useState } from 'preact/hooks';
import { daysBetween } from '../../logic/dates';
import type { AppState, Settings as SettingsT } from '../../model/types';
import { readBackupFile } from '../../storage/backup';
import { isProtected } from '../../storage/persist';
import { useApp } from '../app-context';
import { AreaEditor } from '../AreaEditor';
import { CategoryEditor } from '../CategoryEditor';
import { Icon } from '../Icon';
import { Header } from '../TopBar';

const BACKUP_OLD_DAYS = 30;

// Settings: data safety and backup (website app), Move to the website app (artifact), language, theme,
// text size, setup again, areas and categories (PRD S1–S5, C4).
export function Settings({ onImport }: { onImport: (s: AppState) => void }) {
  const { state, today, t, features, update, open } = useApp();
  const [prot, setProt] = useState(false);
  useEffect(() => {
    if (features.dataSafety) void isProtected().then(setProt);
  }, []);
  const set = (patch: Partial<SettingsT>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const age = state.lastBackupAt ? daysBetween(state.lastBackupAt, today) : null;
  const old = age === null || age > BACKUP_OLD_DAYS;

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    const r = readBackupFile(await file.text());
    if (r.ok) return onImport(r.state);
    update((s) => s, { text: r.reason === 'newerVersion' ? t.importNewer : r.reason === 'tooBig' ? t.importTooBig : t.importBad });
  };

  const seg = <V extends string>(options: [V, string][], current: V, pick: (v: V) => void) => (
    <div class="seg" role="group">
      {options.map(([v, label]) => <button class={v === current ? 'on' : ''} aria-pressed={v === current} onClick={() => pick(v)}>{label}</button>)}
    </div>
  );

  return (
    <>
      <Header title={t.more} />
      {features.dataSafety && (
        <section class="section">
          <h3><span>{t.safeT}</span></h3>
          <div class="glass">
            <div class="setting">
              <span>{t.protT}{!prot && <><br /><small class="hint2">{t.protHint}</small></>}</span>
              <span class={`prot${prot ? ' on' : ''}`}>{prot ? <><Icon name="check" />{t.protOn}</> : t.protOff}</span>
            </div>
            <div class="setting"><span class="hint2">{t.warnDel}</span><button class="btn sm" onClick={() => open({ kind: 'steps' })}>{t.stepsBtn}</button></div>
          </div>
        </section>
      )}
      <section class="section">
        <h3><span>{features.importBackup ? t.backup : t.moveToWebsite}</span></h3>
        <div class="glass">
          <div class="setting">
            {features.importBackup ? (
              <span class={`backup-age num${old ? ' old' : ''}`}>{age === null ? t.backupNever : t.lastBackup(age)}{age !== null && age > BACKUP_OLD_DAYS && <><br />{t.backupOld}</>}</span>
            ) : (
              <span class="hint2">{t.moveToWebsiteP}</span>
            )}
            <div class="acts">
              <button class="btn sm primary" onClick={() => open({ kind: 'export' })}>{t.exportBtn}</button>
              {features.importBackup && (
                <label class="btn sm filepick">{t.importBtn}
                  <input type="file" accept="application/json,.json" onChange={(e) => { void pickFile(e.currentTarget.files?.[0]); e.currentTarget.value = ''; }} />
                </label>
              )}
            </div>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="glass">
          <div class="setting"><span>{t.language}</span>{seg([['ar', 'العربية'], ['en', 'English']], state.settings.lang, (lang) => set({ lang }))}</div>
          <div class="setting"><span>{t.theme}</span>{seg([['system', t.system], ['light', t.light], ['dark', t.dark]], state.settings.theme, (theme) => set({ theme }))}</div>
          <div class="setting"><span>{t.text}</span>{seg([['normal', t.normal], ['large', t.large]], state.settings.textSize, (textSize) => set({ textSize }))}</div>
          <div class="setting"><span>{t.setupAgain}</span><button class="btn sm" onClick={() => open({ kind: 'setup' })}>{t.runSetup}</button></div>
        </div>
      </section>
      <section class="section"><h3><span>{t.areas}</span></h3><AreaEditor /></section>
      <section class="section"><h3><span>{t.moneyCats}</span></h3><CategoryEditor /></section>
    </>
  );
}
