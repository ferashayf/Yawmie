import { useState } from 'preact/hooks';
import { fmtDate, fmtMoney, fmtTime } from '../../i18n/format';
import { readBankMessages } from '../../logic/bankMessages';
import { monthOf } from '../../logic/dates';
import { isDuplicate, matchBill } from '../../logic/matchBill';
import { savePasted, toggleSkip, type PastedLine } from '../../logic/money-edits';
import { newId } from '../../model/empty';
import type { YM } from '../../model/types';
import { billReminder, reminderLink } from '../../integrations/reminder';
import { useApp } from '../app-context';
import { Icon } from '../Icon';
import { esc, nameOf } from '../labels';
import { SheetShell } from './DetailsSheet';

const HALALAS = 100;
const MAX_HALALAS = 100_000_000;
const NAME_MAX = 60;
const DAYS_IN_GRID = 31;
const toHalalas = (v: string) => Math.round(Number(v) * HALALAS);
const okAmount = (h: number) => h >= 1 && h <= MAX_HALALAS;

// Add spending: a big Amount field first, then date, category, note (PRD M7).
export function SpendSheet({ categoryId }: { categoryId?: string }) {
  const { state, today, t, update, close } = useApp();
  const lang = state.settings.lang;
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [cat, setCat] = useState(categoryId ?? state.categories[0].id);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const save = () => {
    const h = toHalalas(amount);
    if (!okAmount(h)) return setErr(t.needAmount);
    update((s) => ({ ...s, expenses: [...s.expenses, { id: newId(), date, amountHalalas: h, categoryId: cat, note: note.trim() || undefined }] }), { text: t.saved(1), undo: true });
    close();
  };
  return (
    <SheetShell title={t.addExpense} onSave={save}>
      <div class="draft"><div class="grid">
        <label class="full">{t.amount}<input class="bigamt num" type="number" inputMode="decimal" min="1" step="0.01" placeholder="0.00" value={amount} autoFocus onInput={(e) => setAmount(e.currentTarget.value)} /></label>
        <label>{t.date}<input type="date" value={date} max={today} onChange={(e) => e.currentTarget.value && setDate(e.currentTarget.value)} /></label>
        <label>{t.category}<select value={cat} onChange={(e) => setCat(e.currentTarget.value)}>{state.categories.map((c) => <option value={c.id}>{nameOf(c.name, lang)}</option>)}</select></label>
        <label class="full">{t.note}<input dir="auto" maxLength={NAME_MAX} value={note} onInput={(e) => setNote(e.currentTarget.value)} /></label>
      </div></div>
      {err && <div class="err" role="alert">{err}</div>}
    </SheetShell>
  );
}

// Add or edit a bill: name, amount, category, due day from a 1–31 grid; editing adds Remind me, Skip, Delete (PRD M9).
export function BillSheet({ id, ym }: { id?: string; ym?: YM }) {
  const { state, today, t, features, update, close } = useApp();
  const lang = state.settings.lang;
  const month = ym ?? monthOf(today);
  const b = id ? state.bills.find((x) => x.id === id) : undefined;
  const [name, setName] = useState(b?.name ?? '');
  const [amount, setAmount] = useState(b ? String(b.amountHalalas / HALALAS) : '');
  const [cat, setCat] = useState(b?.categoryId ?? state.categories[0].id);
  const [day, setDay] = useState(b?.dueDay ?? Number(today.slice(8)));
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState(false);
  const save = () => {
    const h = toHalalas(amount);
    if (!name.trim()) return setErr(t.needName);
    if (!okAmount(h)) return setErr(t.needAmount);
    const data = { name: name.trim().slice(0, NAME_MAX), amountHalalas: h, categoryId: cat, dueDay: day };
    if (b) update((s) => ({ ...s, bills: s.bills.map((x) => (x.id === b.id ? { ...x, ...data } : x)) }), { text: t.saved(1) });
    else update((s) => ({ ...s, bills: [...s.bills, { id: newId(), ...data, paid: {}, skipped: {} }] }), { text: t.saved(1) });
    close();
  };
  const remove = () => {
    if (!b) return;
    update((s) => ({ ...s, bills: s.bills.filter((x) => x.id !== b.id) }), { text: t.deleted, undo: true });
    close();
  };
  const paid = !!b?.paid[month];
  const skipped = !!b && !paid && !!b.skipped[month];
  return (
    <SheetShell title={b ? t.editBillT : t.addBill} onSave={save}>
      <div class="draft"><div class="grid">
        <label class="full">{t.billName}<input dir="auto" maxLength={NAME_MAX} value={name} onInput={(e) => setName(e.currentTarget.value)} /></label>
        <label>{t.amount}<input type="number" inputMode="decimal" min="1" step="0.01" value={amount} onInput={(e) => setAmount(e.currentTarget.value)} /></label>
        <label>{t.category}<select value={cat} onChange={(e) => setCat(e.currentTarget.value)}>{state.categories.map((c) => <option value={c.id}>{nameOf(c.name, lang)}</option>)}</select></label>
      </div></div>
      {err && <div class="err" role="alert">{err}</div>}
      <div class="lbl">{t.dueDay}</div>
      <div class="dgroup">
        <div class="daygrid" role="group" aria-label={t.dueDay}>
          {Array.from({ length: DAYS_IN_GRID }, (_, i) => i + 1).map((n) => <button class={`num${n === day ? ' on' : ''}`} aria-pressed={n === day} onClick={() => setDay(n)}>{n}</button>)}
        </div>
        <div class="dhint">{t.dueHint}</div>
      </div>
      {b && (
        <>
          <div class="dgroup">
            {features.reminders && <button class="drow dbtn" onClick={() => { window.location.href = reminderLink(billReminder(b, today)); }}><Icon name="bell" /> {t.remindMe}</button>}
            {!paid && <button class="drow dbtn" onClick={() => update((s) => toggleSkip(s, b.id, month))}>{skipped ? t.unskip : t.skip}</button>}
            <button class="drow dbtn danger" onClick={() => setConfirm(!confirm)}>{t.delBill}</button>
          </div>
          {confirm && (
            <div class="confirm" role="alert"><span>{t.delBillQ}</span>
              <div class="b"><button class="yes" onClick={remove}>{t.yesDel}</button><button class="no" onClick={() => setConfirm(false)}>{t.back}</button></div>
            </div>
          )}
        </>
      )}
    </SheetShell>
  );
}

// Paste bank messages → review → save (PRD N1–N4). Card numbers and the message text are never stored.
export function PasteSheet() {
  const { state, today, t, update, close } = useApp();
  const lang = state.settings.lang;
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [lines, setLines] = useState<PastedLine[] | null>(null);
  const [skipped, setSkipped] = useState({ code: 0, income: 0, other: 0 });

  const read = () => {
    const r = readBankMessages(text, today);
    if (!r.found.length) return setErr(t.smsNone);
    setSkipped(r.skipped);
    setLines(r.found.map((f) => {
      const bill = matchBill(f, state.bills);
      const dup = isDuplicate(f, state.expenses);
      return { ...f, on: !dup && f.kind !== 'cash' && f.kind !== 'transfer', billId: bill?.id, payBill: !!bill, dup } as PastedLine & { dup: boolean };
    }));
    setText(''); // the raw text is not kept once read
    setErr('');
  };
  const fromClipboard = async () => {
    try {
      setText(await navigator.clipboard.readText());
    } catch {
      setErr(t.clipNo);
    }
  };
  const save = () => {
    if (!lines) return read();
    const r = savePasted(state, lines, newId, { cash: t.cashLbl, transfer: t.transferLbl, purchase: t.purchaseLbl });
    update(() => r.state, { text: t.smsSaved(r.saved, r.paid), undo: true });
    close();
  };
  const patch = (i: number, change: Partial<PastedLine>) => setLines((ls) => ls!.map((l, j) => (j === i ? { ...l, ...change } : l)));

  if (!lines) {
    return (
      <SheetShell title={t.pasteMsgs} onSave={read}>
        <textarea class="smsbox" dir="auto" placeholder={t.pastePh} aria-label={t.pastePh} value={text} onInput={(e) => setText(e.currentTarget.value)} />
        {err && <div class="err" role="alert">{err}</div>}
        <button class="add-row" onClick={fromClipboard}><Icon name="clip" />{t.pasteFromClip}</button>
        <div class="hint"><Icon name="lock" /><span>{t.pasteHint}</span></div>
      </SheetShell>
    );
  }
  const on = lines.filter((l) => l.on).length;
  return (
    <SheetShell title={t.reviewN(on)} onSave={save}>
      <div class="glass group">
        {lines.map((f, i) => {
          const c = state.categories.find((x) => x.id === f.categoryId) ?? state.categories[0];
          const label = f.merchant || (f.kind === 'cash' ? t.cashLbl : f.kind === 'transfer' ? t.transferLbl : f.kind === 'refund' ? t.refundLbl : t.purchaseLbl);
          const when = (f.date === today ? t.rel(0) : fmtDate(f.date, lang, { weekday: 'short', day: 'numeric', month: 'short' })) + (f.time ? ` ${fmtTime(f.time, lang)}` : '');
          const bill = f.billId ? state.bills.find((b) => b.id === f.billId) : undefined;
          const refund = f.kind === 'refund';
          return (
            <div class={`rv${f.on ? '' : ' off'}`} key={i}>
              <div class="r1">
                <span class="pi" style={{ background: c.color }}>{label.charAt(0).toUpperCase()}</span>
                <span class="pm"><b>{label}{refund && f.merchant ? ` · ${t.refundLbl}` : ''}</b><small class="num">{(f as { dup?: boolean }).dup ? `${t.already} · ` : ''}{when}</small></span>
                <bdi dir="ltr" class={`amt num${refund ? ' plus' : ''}`}>{refund ? '+' : ''}{fmtMoney(f.amountHalalas)}</bdi>
                <button class={`switch${f.on ? ' on' : ''}`} role="switch" aria-checked={f.on} aria-label={label} onClick={() => patch(i, { on: !f.on })} />
              </div>
              {f.on && !(bill && f.payBill) && (
                <select class="rvcat" aria-label={t.category} value={f.categoryId} onChange={(e) => patch(i, { categoryId: e.currentTarget.value })}>
                  {state.categories.map((x) => <option value={x.id}>{nameOf(x.name, lang)}</option>)}
                </select>
              )}
              {bill && f.on && (
                <div class="match">
                  <span dangerouslySetInnerHTML={{ __html: t.billMatch(esc(bill.name), new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-US', { month: 'long' }).format(new Date(Number(f.date.slice(0, 4)), Number(f.date.slice(5, 7)) - 1, 1))) }} />
                  <button class={`switch${f.payBill ? ' on' : ''}`} role="switch" aria-checked={!!f.payBill} aria-label={bill.name} onClick={() => patch(i, { payBill: !f.payBill })} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div class="skipped">{t.smsSkipped(skipped)}</div>
      <button class="add-row" onClick={() => setLines(null)}>{t.editMsgs}</button>
    </SheetShell>
  );
}
