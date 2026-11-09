import buddy from '../../../../brand/buddy.png';
import { fmtTime } from '../i18n/format';
import { weekday } from '../logic/dates';
import { setBudget } from '../logic/money-edits';
import { newId } from '../model/empty';
import type { Settings } from '../model/types';
import { useApp } from './app-context';
import { AreaIcon, Icon } from './Icon';
import type { IconName } from './icons';
import { findArea, nameOf } from './labels';

const HALALAS = 100;
const NAME_MAX = 30;
const START_H = 9;

function Opt({ on, label, pick }: { on: boolean; label: string; pick: () => void }) {
  return <button class={`sopt${on ? ' on' : ''}`} aria-pressed={on} onClick={pick}>{label}<span class="rad" /></button>;
}

function Row({ icon, title, text, tile }: { icon: IconName; title: string; text: string; tile: string }) {
  return <div class="drow"><span class="dicon" style={{ '--tile': tile }}><Icon name={icon} /></span><span class="dlabel">{title}<small>{text}</small></span></div>;
}

// First open: short steps, every one skippable, with back and step dots (PRD U1).
// Step 7 (reminders, backup) is left out where neither exists (the Claude artifact).
export function Setup({ step, setStep, onFinish }: { step: number; setStep: (n: number) => void; onFinish: () => void }) {
  const { state, today, t, features, update, open } = useApp();
  const lang = state.settings.lang;
  const total = features.reminders || features.dataSafety ? 7 : 6;
  const set = (patch: Partial<Settings>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const next = () => (step >= total ? onFinish() : setStep(step + 1));
  const overall = state.budgets.find((b) => b.categoryId === null)?.limitHalalas ?? 0;
  const addBlock = () => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const b = { id: newId(), areaId: state.areas[0].id, start: `${pad(START_H)}:00`, end: `${pad(START_H + 1)}:00`, days: [weekday(today)] };
    update((s) => ({ ...s, blocks: [...s.blocks, b] }));
    open({ kind: 'block', id: b.id, date: today });
  };

  return (
    <div class="setup">
      <div class="stop">
        {step > 1 ? <button class="round glass" aria-label={t.back} onClick={() => setStep(step - 1)}><Icon name="chevBack" /></button> : <span />}
        <div class="steps" aria-label={t.stepOf(step, total)}>{Array.from({ length: total }, (_, i) => <i class={i < step ? 'on' : ''} />)}</div>
        <span />
      </div>
      <div class="sbody">
        {step === 1 && (
          <>
            <div class="stile"><img src={buddy} alt="" /></div>
            <h1 class="sh1 c">{t.su1t}</h1><p class="sp c">{t.su1p}</p>
            <Opt on={lang === 'ar'} label="العربية" pick={() => set({ lang: 'ar' })} />
            <Opt on={lang === 'en'} label="English" pick={() => set({ lang: 'en' })} />
          </>
        )}
        {step === 2 && (
          <>
            <h1 class="sh1">{t.su2t}</h1><p class="sp">{t.su2p}</p>
            <div class="dgroup">
              <input class="dtitle" dir="auto" maxLength={NAME_MAX} value={state.settings.name ?? ''} placeholder={t.namePh} aria-label={t.namePh}
                onChange={(e) => set({ name: e.currentTarget.value.trim() || undefined })} onKeyDown={(e) => e.key === 'Enter' && !e.isComposing && e.currentTarget.blur()} />
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h1 class="sh1">{t.su3t}</h1><p class="sp">{t.su3p}</p>
            {(['system', 'light', 'dark'] as const).map((v) => <Opt on={state.settings.theme === v} label={t[v]} pick={() => set({ theme: v })} />)}
          </>
        )}
        {step === 4 && (
          <>
            <h1 class="sh1">{t.su4t}</h1><p class="sp">{t.su4p}</p>
            <div class="dgroup">
              {state.areas.map((a) => <div class="drow"><span class="ico" style={{ '--a': a.color }}><AreaIcon name={a.icon} size={17} /></span><span class="dlabel">{nameOf(a.name, lang)}</span></div>)}
              <button class="drow dbtn addl" onClick={() => open({ kind: 'area' })}><Icon name="plusSm" />{t.newArea}</button>
            </div>
          </>
        )}
        {step === 5 && (
          <>
            <h1 class="sh1">{t.su5t}</h1><p class="sp">{t.su5p}</p>
            <div class="dgroup">
              {state.blocks.map((b) => {
                const a = findArea(state.areas, b.areaId);
                return (
                  <button class="drow dbtn" onClick={() => open({ kind: 'block', id: b.id, date: today })}>
                    <span class="ico" style={{ '--a': a.color }}><AreaIcon name={a.icon} size={17} /></span>
                    <span class="dlabel">{nameOf(a.name, lang)}<small class="num">{fmtTime(b.start, lang)} – {fmtTime(b.end, lang)}</small></span>
                    <Icon name="chev" />
                  </button>
                );
              })}
              <button class="drow dbtn addl" onClick={addBlock}><Icon name="plusSm" />{t.addBlock}</button>
            </div>
          </>
        )}
        {step === 6 && (
          <>
            <h1 class="sh1">{t.su6t}</h1><p class="sp">{t.su6p}</p>
            <div class="dgroup">
              <div class="drow">
                <span class="dlabel">{t.budgetLbl}</span>
                <input type="number" min="0" step="10" inputMode="decimal" class="tin num" value={overall / HALALAS} aria-label={t.budgetLbl}
                  onChange={(e) => update((s) => setBudget(s, null, Math.max(0, Math.round(Number(e.currentTarget.value) * HALALAS) || 0), newId))} />
              </div>
              <div class="drow"><span class="dlabel">{t.bills}<small>{t.billsN(state.bills.length)}</small></span></div>
              <button class="drow dbtn addl" onClick={() => open({ kind: 'bill' })}><Icon name="plusSm" />{t.addBill}</button>
            </div>
          </>
        )}
        {step === 7 && (
          <>
            <h1 class="sh1">{t.su7t}</h1>
            <div class="dgroup">
              {features.reminders && <Row icon="bell" title={t.remT} text={t.remP} tile="#D08A2E" />}
              {features.dataSafety && <Row icon="cal" title={t.bakT} text={t.bakP} tile="#4E9583" />}
            </div>
          </>
        )}
      </div>
      <div class="sfoot">
        <button class="btn primary bigbtn" onClick={next}>{step >= total ? t.startBtn : t.cont}</button>
        <button class="slink" onClick={step === 1 ? onFinish : next}>{step === 1 ? t.skipSetup : t.skipStep}</button>
      </div>
    </div>
  );
}
