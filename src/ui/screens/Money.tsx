import { useState } from 'preact/hooks';
import { fmtDate, fmtMoney } from '../../i18n/format';
import { billsMonth, dueDayIn } from '../../logic/bills';
import { budgetLevel, limitFor, safeToSpend, spentMonth, vsLastMonth } from '../../logic/budget';
import { addMonths, daysBetween, monthOf } from '../../logic/dates';
import { togglePaid } from '../../logic/money-edits';
import type { Expense, YM } from '../../model/types';
import { useApp } from '../app-context';
import { CategoryEditor } from '../CategoryEditor';
import { Icon } from '../Icon';
import { findCategory, nameOf } from '../labels';
import { MoneyArc } from '../MoneyArc';
import { TopButtons } from '../TopBar';

const HALALAS = 100;
const FULL_PCT = 100;
type View = 'overview' | 'spend' | 'bills';
const VIEWS: View[] = ['overview', 'spend', 'bills'];
const Money$ = ({ h }: { h: number }) => <bdi class="money num" dir="ltr">{fmtMoney(h)}</bdi>;

// Money: month card, Overview · Spending · Bills (PRD M1–M10).
export function Money() {
  const { state, today, t, open, update } = useApp();
  const lang = state.settings.lang;
  const thisMonth = monthOf(today);
  const [ym, setYm] = useState<YM>(thisMonth);
  const [view, setView] = useState<View>('overview');
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [editing, setEditing] = useState(false);
  const total = spentMonth(state, ym);
  const vs = vsLastMonth(state, today, ym);
  const monthName = (m: YM) => new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-US', { month: 'long' }).format(new Date(Number(m.slice(0, 4)), Number(m.slice(5)) - 1, 1));

  return (
    <>
      <header class="top">
        <div class="toolbar">
          <span class="mnav">
            <button class="round glass" aria-label={t.prevMonth} onClick={() => setYm(addMonths(ym, -1))}><Icon name="chevBack" /></button>
            <button class="round glass" aria-label={t.nextMonth} disabled={ym >= thisMonth} style={ym >= thisMonth ? { opacity: 0.3 } : undefined} onClick={() => ym < thisMonth && setYm(addMonths(ym, 1))}><Icon name="chev" /></button>
          </span>
          <TopButtons />
        </div>
        <div class="eyebrow num">{t.money} · {ym.slice(0, 4)}</div>
        <h1>{monthName(ym)}</h1>
      </header>
      <section class="mhero">
        <span class="hero-lbl">{t.spentLbl}</span>
        <bdi dir="ltr" class="mbig num"><small>SAR</small>{fmtMoney(total).slice(4)}</bdi>
        {vs && <span class="vs num"><Icon name={vs.less ? 'arDown' : 'arUp'} />{t.vsMonth(vs.pct, !vs.less, monthName(addMonths(ym, -1)))}</span>}
      </section>
      <div class="seg wide mseg" role="tablist">
        {VIEWS.map((k) => <button role="tab" class={view === k ? 'on' : ''} aria-selected={view === k} onClick={() => setView(k)}>{t.mv[k]}</button>)}
      </div>
      {view === 'bills' ? billsView() : view === 'spend' ? (<>{addPair()}{catSection()}</>) : (<>{gauge()}{addPair()}{billRow()}</>)}
    </>
  );

  function addPair() {
    return (
      <div class="addpair">
        <button class="add-row" onClick={() => open({ kind: 'spend' })}><Icon name="plusSm" />{t.addExpense}</button>
        <button class="add-row" onClick={() => open({ kind: 'paste' })}><Icon name="msg" />{t.pasteMsgs}</button>
      </div>
    );
  }

  function gauge() {
    const limit = limitFor(state, ym) ?? 0;
    if (editing) return <CategoryEditor onDone={() => setEditing(false)} />;
    if (!limit) {
      return (
        <div class="glass empty-card"><span class="eico"><Icon name="spend" /></span><b>{t.noBudgetT}</b><p>{t.noBudgetP}</p>
          <button class="add-row" onClick={() => setEditing(true)}>{t.editBudget}</button>
        </div>
      );
    }
    const pct = Math.round((total / limit) * FULL_PCT);
    const lv = budgetLevel(total, limit);
    const cls = lv === 'ok' ? '' : `status ${lv}`;
    const safe = ym === thisMonth ? safeToSpend(state, today) : null;
    const bills = spentMonth(state, ym) - spentExpenses(ym);
    return (
      <div class="glass gauge">
        <button class="round glass corner-edit" aria-label={t.editBudget} title={t.editBudget} onClick={() => setEditing(true)}><Icon name="pencil" /></button>
        {safe && (
          <div class={`safe${safe.left - safe.unpaid > 0 ? '' : ' over'}`}>
            <span class="lbl">{t.safeToday}</span>
            <b class="big num"><Money$ h={safe.perDay} /></b>
            <span class="sub num">{safe.left <= 0 ? t.safeOver : safe.left - safe.unpaid <= 0 ? t.safeBills(fmtMoney(safe.unpaid)) : t.safeHow(fmtMoney(safe.left), safe.days, safe.unpaid ? fmtMoney(safe.unpaid) : '')}</span>
          </div>
        )}
        <div class="g-svg">
          <MoneyArc t={pct / FULL_PCT} color={lv === 'over' ? 'var(--over)' : lv === 'warn' ? 'var(--warn)' : 'var(--accent)'} sun label={t.overall} lang={lang} />
          <div class="g-center"><b class="num"><Money$ h={total} /></b><span class={`num ${cls}`}>{pct}% {t.of} {fmtMoney(limit)}</span></div>
        </div>
        <div class="g-rows">
          {!(safe && lv !== 'over') && (
            <div class="g-row"><span class={cls}><b class={cls}>{lv === 'over' ? `${t.overBy} ${fmtMoney(total - limit)}` : `${fmtMoney(limit - total)} ${t.left}`}</b></span></div>
          )}
          <div class="g-row"><span>{t.expenses} <b><Money$ h={spentExpenses(ym)} /></b></span><span>{t.billsPaid} <b><Money$ h={bills} /></b></span></div>
        </div>
      </div>
    );
  }

  function spentExpenses(m: YM) {
    return state.expenses.filter((e) => monthOf(e.date) === m).reduce((s, e) => s + e.amountHalalas, 0);
  }

  function billRow() {
    const bt = billsMonth(state, ym);
    const due = bt.next ? (ym === thisMonth ? t.dueIn(daysBetween(today, bt.next.date)) : bt.next.bill.dueDay) : '';
    return (
      <button class="glass billrow" onClick={() => setView('bills')}>
        <span class="dicon"><Icon name="bills" /></span>
        <span class="bmain">
          <span class="bl1"><b>{t.bills}</b>{bt.left > 0 && <span class="num"><Money$ h={bt.left} /> <small>{t.left}</small></span>}</span>
          <span class="bl2 num">{bt.next ? `${bt.next.bill.name} · ${due}` : state.bills.length ? t.allPaid : t.noBillsT}</span>
        </span>
        <Icon name="chev" />
      </button>
    );
  }

  function catSection() {
    const rows = state.categories.filter((c) => (limitFor(state, ym, c.id) ?? 0) > 0 || spentMonth(state, ym, c.id) !== 0);
    return (
      <>
        <section class="section">
          <h3><span>{t.byCat}</span>
            <span class="h-acts">
              <button class={`fx${editing ? ' on' : ''}`} aria-label={t.edit} title={t.edit} onClick={() => setEditing(!editing)}><Icon name="pencil" /></button>
            </span>
          </h3>
          {editing ? <CategoryEditor onDone={() => setEditing(false)} /> : rows.length > 0 && (
            <>
              <div class="it-meta" style={{ paddingInline: '4px' }}>{t.tapToSee}</div>
              <div class="glass">
                {rows.map((c) => {
                  const sp = spentMonth(state, ym, c.id);
                  const bl = limitFor(state, ym, c.id) ?? 0;
                  const bp = bl ? Math.round((sp / bl) * FULL_PCT) : 0;
                  const lv = bl ? budgetLevel(sp, bl) : 'ok';
                  const isOpen = openCat === c.id;
                  return (
                    <div class="brow" key={c.id}>
                      <div class="row" style={{ cursor: 'pointer' }} onClick={() => setOpenCat(isOpen ? null : c.id)}>
                        <span class="name"><span class="dot" style={{ '--c': c.color }} />{nameOf(c.name, lang)} <span class={`caret${isOpen ? ' open' : ''}`}><Icon name="chev" /></span></span>
                        <span class={`num ${lv === 'ok' ? '' : `status ${lv}`}`}><Money$ h={sp} />{bl ? <> / <Money$ h={bl} /></> : null}</span>
                      </div>
                      {bl > 0 && <div class="track"><div class={`fill ${lv === 'ok' ? '' : lv}`} style={{ width: `${Math.min(bp, FULL_PCT)}%` }} /></div>}
                      <div class="row">
                        <span class="num" style={{ color: 'var(--sub)' }}>{bl ? `${bp}%` : ''}</span>
                        <button class="btn sm" onClick={() => open({ kind: 'spend', id: c.id })}><Icon name="plusSm" />{t.addExpense}</button>
                      </div>
                      {isOpen && expenseList(state.expenses.filter((e) => monthOf(e.date) === ym && e.categoryId === c.id))}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
        {logSection()}
      </>
    );
  }

  function expenseRow(x: Expense, showCat: boolean) {
    const c = findCategory(state.categories, x.categoryId);
    const setAmount = (v: string) => {
      const h = Math.round(Number(v) * HALALAS);
      if (!(h > 0)) return;
      update((s) => ({ ...s, expenses: s.expenses.map((e) => (e.id === x.id ? { ...e, amountHalalas: e.refund ? -h : h } : e)) }), { text: t.saved(1) });
    };
    return (
      <div class="exp" key={x.id}>
        <div class="exp-name">
          <div>{showCat && <span class="dot" style={{ '--c': c.color }} />} {x.note}</div>
          <small class="num">{showCat ? nameOf(c.name, lang) : fmtDate(x.date, lang, { weekday: 'short', day: 'numeric', month: 'short' })}</small>
        </div>
        <input type="number" min="0.01" step="0.01" inputMode="decimal" class="num" value={Math.abs(x.amountHalalas) / HALALAS} aria-label={t.amount} onChange={(e) => setAmount(e.currentTarget.value)} />
        <button class="abtn del" aria-label={t.del} onClick={() => update((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== x.id) }), { text: t.deleted, undo: true })}><Icon name="xs" /></button>
      </div>
    );
  }

  function expenseList(list: Expense[]) {
    if (!list.length) return <div class="empty">{t.noExp}</div>;
    return <div class="explist">{[...list].sort((a, b) => b.date.localeCompare(a.date)).map((x) => expenseRow(x, false))}</div>;
  }

  function logSection() {
    const list = state.expenses.filter((e) => monthOf(e.date) === ym).sort((a, b) => b.date.localeCompare(a.date));
    if (!list.length) return <section class="section"><div class="glass logbar">{t.noSpendYet}</div></section>;
    const days = [...new Set(list.map((e) => e.date))];
    return (
      <section class="section">
        <button class="glass logbar" aria-expanded={showLog} onClick={() => setShowLog(!showLog)}>
          <span><b>{t.log}</b> <span class="num">{t.logCount(list.length)}</span></span>
          <span class={`caret${showLog ? ' open' : ''}`}><Icon name="chev" /></span>
        </button>
        {showLog && (
          <div class="glass loglist">
            {days.map((d) => {
              const of = list.filter((e) => e.date === d);
              return (
                <div class="logday" key={d}>
                  <div class="logday-head"><span>{fmtDate(d, lang, { weekday: 'long', day: 'numeric', month: 'short' })}</span><Money$ h={of.reduce((s, e) => s + e.amountHalalas, 0)} /></div>
                  {of.map((x) => expenseRow(x, true))}
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  function billsView() {
    const bt = billsMonth(state, ym);
    const isSkipped = (b: (typeof state.bills)[number]) => !b.paid[ym] && !!b.skipped[ym];
    const list = [...state.bills].sort((a, b) => Number(isSkipped(a)) - Number(isSkipped(b)) || Number(!!a.paid[ym]) - Number(!!b.paid[ym]) || a.dueDay - b.dueDay);
    return (
      <>
        {list.length ? (
          <div class="glass gauge">
            <div class="g-svg">
              <MoneyArc t={bt.total ? bt.paid / bt.total : 0} color="var(--accent)" label={t.monthTotal} lang={lang} />
              <div class="g-center"><b class="num"><Money$ h={bt.left} /></b><span>{t.unpaidTotal}</span></div>
            </div>
            <div class="g-rows"><div class="g-row"><span>{t.monthTotal} <b><Money$ h={bt.total} /></b></span><span>{t.paidTotal} <b><Money$ h={bt.paid} /></b></span></div></div>
          </div>
        ) : (
          <div class="glass empty-card"><span class="eico"><Icon name="bills" /></span><b>{t.noBillsT}</b><p>{t.noBillsP}</p></div>
        )}
        <button class="add-row" onClick={() => open({ kind: 'bill' })}><Icon name="plusSm" />{t.addBill}</button>
        {list.length > 0 && (
          <div class="glass group">
            {list.map((b) => {
              const paid = !!b.paid[ym];
              const skipped = isSkipped(b);
              const n = daysBetween(today, `${ym}-${String(dueDayIn(b, ym)).padStart(2, '0')}`);
              const sub = skipped ? t.skipped : paid ? t.paid : ym === thisMonth ? t.dueIn(n) : t.unpaid;
              const cat = findCategory(state.categories, b.categoryId);
              return (
                <div class={`it${skipped ? ' skipped' : ''}`} style={{ padding: 0 }} key={b.id}>
                  <div class={`bill${paid ? ' paid' : ''}`}>
                    <div class="day num">{b.dueDay}</div>
                    <div style={{ cursor: 'pointer' }} onClick={() => open({ kind: 'bill', id: b.id, date: ym })}>
                      <div class="it-title">{b.name}</div>
                      <div class="it-meta"><span class="dot" style={{ '--c': cat.color }} /><span class={!paid && !skipped && n < 0 && ym === thisMonth ? 'status over' : ''}>{sub}</span></div>
                    </div>
                    <div class="num amt"><Money$ h={paid ? b.paid[ym].amountHalalas : b.amountHalalas} /></div>
                    {skipped ? <span /> : (
                      <button class={`toggle${paid ? ' on' : ''}`} role="switch" aria-checked={paid} aria-label={`${t.paid}: ${b.name}`} onClick={() => update((s) => togglePaid(s, b.id, ym, today))} />
                    )}
                    <button class="xbtn" aria-label={`${t.details}: ${b.name}`} onClick={() => open({ kind: 'bill', id: b.id, date: ym })}><Icon name="info" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }
}
