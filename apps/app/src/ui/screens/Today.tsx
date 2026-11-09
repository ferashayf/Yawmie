import { useState } from 'preact/hooks';
import buddy from '../../assets/buddy.png';
import { fmtDate, fmtTime } from '../../i18n/format';
import { placeTasks } from '../../logic/blocks';
import { daysBetween } from '../../logic/dates';
import { dayCounts, nextUp, todayList } from '../../logic/today';
import { isStandalone } from '../../storage/persist';
import { useApp } from '../app-context';
import { DayArc } from '../DayArc';
import { Icon } from '../Icon';
import { ItemRow } from '../ItemRow';
import { findArea, nameOf } from '../labels';
import { TopButtons } from '../TopBar';

const NOON = '12:00';
const BACKUP_OLD_DAYS = 30;

export function Today() {
  const app = useApp();
  const { state, today, now, t, features, open, finish, update } = app;
  const lang = state.settings.lang;
  const [quick, setQuick] = useState('');
  const [homeLater, setHomeLater] = useState(false);
  const counts = dayCounts(state, today);
  const newUser = state.items.length === 0;
  const next = nextUp(state, today, now);
  const list = todayList(state, today);
  const appts = state.items.filter((x) => x.status === 'open' && x.kind === 'appointment' && x.dueDate === today && x.time);
  const name = state.settings.name?.trim();

  const add = () => {
    open({ kind: 'add', text: quick.trim() });
    setQuick('');
  };

  return (
    <>
      <header class="tbar">
        <span class="datepill num"><Icon name="cal" />{fmtDate(today, lang, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        <TopButtons />
      </header>
      <h1 class="greet">
        {now < NOON ? t.morning : t.evening}
        {name ? `${lang === 'ar' ? '، ' : ', '}${name}` : ''}
        <span class="num">{newUser ? t.emptyGreet : `${counts.left} ${t.tasksLeft}${counts.late ? ` · ${counts.late} ${t.cLate}` : ''}`}</span>
      </h1>

      <section class="herowrap">
        <button class="peek" aria-label={t.bot.name} onClick={() => open({ kind: 'chat' })}><img src={buddy} alt="" /></button>
        <div class="hero">
          {next.type === 'block' ? (
            <>
              <div class="hero-lbl">{t.nowLbl}</div>
              <h2 onClick={() => open({ kind: 'block', id: next.block.id })}>{t.blockTitle(nameOf(findArea(state.areas, next.block.areaId).name, lang))}</h2>
              <div class="hero-meta num">
                {fmtTime(next.block.start, lang)} – {fmtTime(next.block.end, lang)} · {t.tasksN(placeTasks(state, today, today, now).inBlock[next.block.id]?.length ?? 0)}
              </div>
              <button class="go" onClick={() => open({ kind: 'focus', id: next.block.id })}><Icon name="focus" />{t.startFocus}</button>
            </>
          ) : next.type === 'appointment' || next.type === 'task' ? (
            <>
              <div class="hero-lbl">{t.nextUp}</div>
              <h2 onClick={() => open({ kind: 'details', id: next.item.id })}>{next.item.title}</h2>
              <div class="hero-meta num">
                {[next.item.time ? fmtTime(next.item.time, lang) : next.item.dueDate && next.item.dueDate < today ? t.late(daysBetween(next.item.dueDate, today)) : t.rel(0), nameOf(findArea(state.areas, next.item.areaId).name, lang), next.item.place].filter(Boolean).join(' · ')}
              </div>
              <button class="go" onClick={() => finish(next.item.id)}><Icon name="checkBig" />{t.markDone}</button>
            </>
          ) : newUser ? (
            <>
              <div class="hero-lbl">{t.nextUp}</div>
              <h2>{t.emptyHero}</h2>
              <div class="hero-meta">{t.emptyHeroP}</div>
            </>
          ) : (
            <h2>{t.noNext}</h2>
          )}
        </div>
      </section>

      <div class="glass quick">
        <input dir="auto" placeholder={t.quickPh} aria-label={t.quickPh} autocomplete="off" value={quick}
          onInput={(e) => setQuick(e.currentTarget.value)} onKeyDown={(e) => e.key === 'Enter' && !e.isComposing && add()} />
        <button class="addbtn" onClick={add}><Icon name="plusSm" />{t.addBtn}</button>
      </div>

      {features.dataSafety && !isStandalone() && !homeLater && (
        <section class="glass bkcard hm" role="status">
          <span class="bk-ic"><Icon name="share" /></span>
          <div class="bk-t"><b>{t.homeT}</b><small>{t.homeP}</small></div>
          <div class="bk-acts">
            <button class="btn sm accent" onClick={() => open({ kind: 'steps' })}>{t.showMe}</button>
            <button class="btn sm" onClick={() => setHomeLater(true)}>{t.notNow}</button>
          </div>
        </section>
      )}

      <BackupCard />

      <section class="dayband">
        <h2 class="huge">{t.yourDay}</h2>
        <div class="band">
          <div class="glow" aria-hidden="true" />
          <DayArc now={now} lang={lang} label={t.today} ticks={appts.map((x) => ({ at: x.time!, color: findArea(state.areas, x.areaId).color }))} />
          {newUser ? (
            <div class="band-note">{t.emptyArc}</div>
          ) : (
            <div class="bstats num">
              <div><b>{counts.left}</b><span>{t.sLeft}</span></div>
              <div><b>{counts.appointments}</b><span>{t.sAppts}</span></div>
              <div class={counts.late ? 'late' : ''}><b>{counts.late}</b><span>{t.sLate}</span></div>
            </div>
          )}
        </div>
      </section>

      <section class="section">
        <h3><span>{t.today}</span>{list.length > 0 && <span class="count num">{list.length}</span>}</h3>
        {list.length ? (
          <div class="glass group">{list.map((it) => <ItemRow key={it.id} it={it} />)}</div>
        ) : (
          <div class="glass empty-card">
            <span class="eico"><Icon name="today" /></span>
            <b>{newUser ? t.noTasksT : t.noNext}</b>
            <p>{newUser ? t.noTasksP : t.emptyHeroP}</p>
          </div>
        )}
      </section>
    </>
  );

  // Website app only: when the last export is 30+ days old (or there's data and no backup yet). Later hides it until tomorrow.
  function BackupCard() {
    if (!features.dataSafety || state.backupLaterOn === today) return null;
    const hasData = state.items.length + state.expenses.length + state.bills.length > 0;
    const age = state.lastBackupAt ? daysBetween(state.lastBackupAt, today) : null;
    if (age === null ? !hasData : age < BACKUP_OLD_DAYS) return null;
    return (
      <section class="glass bkcard" role="status">
        <span class="bk-ic"><Icon name="backup" /></span>
        <div class="bk-t"><b>{t.backupT}</b><small class="num">{age === null ? t.backupNever : t.backupP(age)}</small></div>
        <div class="bk-acts">
          <button class="btn sm accent" onClick={() => open({ kind: 'export' })}>{t.exportBtn}</button>
          <button class="btn sm" onClick={() => update((s) => ({ ...s, backupLaterOn: today }))}>{t.backupLater}</button>
        </div>
      </section>
    );
  }
}

