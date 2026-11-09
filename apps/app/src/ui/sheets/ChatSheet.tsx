import { useEffect, useRef, useState } from 'preact/hooks';
import buddy from '../../../../../brand/buddy.png';
import { fmtMoney, fmtTime } from '../../i18n/format';
import { startListening, type VoiceProblem } from '../../integrations/speech';
import { brief, reply, type ChatPart } from '../../logic/assistant';
import { saveDraft } from '../../logic/drafts';
import { newId } from '../../model/empty';
import type { Draft } from '../../model/types';
import { validateDraft } from '../../model/validate';
import { useApp } from '../app-context';
import { Icon } from '../Icon';
import { esc, findCategory, nameOf } from '../labels';

const INPUT_MAX = 200;
const WAVE = [8, 14, 22, 12, 26, 18, 10, 20, 24, 12, 16, 8];
const STEP_MS = 70;

const Html = ({ html }: { html: string }) => <span dangerouslySetInnerHTML={{ __html: html }} />;

export interface ChatMsg { from: 'me' | 'bot'; text?: string; parts?: ChatPart[]; asked?: string; added?: boolean }

// Yawmie's chat: daily brief, quick questions, Add cards, and voice in the website app (PRD Y2–Y6).
export function ChatSheet({ log, setLog }: { log: ChatMsg[]; setLog: (fn: (l: ChatMsg[]) => ChatMsg[]) => void }) {
  const { state, today, now, t, features, update, open, close } = useApp();
  const b = t.bot;
  const lang = state.settings.lang;
  const [input, setInput] = useState('');
  const [listening, setListening] = useState<{ text: string; stop(): void; cancel(): void } | null>(null);
  const logEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!log.length) setLog(() => [{ from: 'bot', parts: brief(state, today, now) }]);
  }, []);
  useEffect(() => {
    if (logEl.current) logEl.current.scrollTop = logEl.current.scrollHeight;
  }, [log.length, listening]);

  const say = (text: string) => {
    const clean = text.trim().slice(0, INPUT_MAX);
    if (!clean) return;
    setLog((l) => [...l, { from: 'me', text: clean }, { from: 'bot', parts: reply(clean, state, today), asked: clean }]);
    setInput('');
  };

  const talk = () => {
    if (!features.mic) return;
    const voice = startListening(lang, (words) => setListening((x) => (x ? { ...x, text: words } : x)));
    setListening({ text: '', stop: voice.stop, cancel: voice.cancel });
    voice.done.then(
      (text) => { setListening(null); if (text) say(text); },
      (why: VoiceProblem) => {
        setListening(null);
        const msg = why === 'dictationOff' ? b.siriOff : why === 'notAllowed' ? b.micDenied : why === 'framed' ? b.micFrame : why === 'unavailable' ? b.noVoice : b.micFail;
        setLog((l) => [...l, { from: 'bot', text: msg }]);
      },
    );
  };

  const addFromCard = (i: number, d: Draft) => {
    if (validateDraft(d)) return editDraft(d, log[i].asked ?? d.title);
    update((s) => saveDraft(s, d, newId), { text: t.saved(1), undo: true });
    setLog((l) => l.map((m, j) => (j === i ? { ...m, added: true } : m)));
  };
  const editDraft = (d: Draft, asked: string) => {
    const money = d.kind === 'expense' || d.kind === 'bill';
    open(money ? { kind: 'review', text: asked } : { kind: 'add', text: asked });
  };

  const empty = !input.trim();
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="chat-head">
          <span class="av"><img src={buddy} alt="" /></span>
          <div><h2>{b.name}</h2><small>{b.sub}</small></div>
          <button class="round glass" aria-label={b.close} onClick={close}><Icon name="close" /></button>
        </div>
        <div class="chat" ref={logEl}>
          {log.map((m, i) => (
            <div class={`msg ${m.from}`} key={i}>
              {m.text !== undefined ? (m.from === 'me' ? m.text : <Html html={m.text} />) : m.parts!.map((p, k) => renderPart(p, k, m, i))}
            </div>
          ))}
        </div>
        {listening ? (
          <div class="listen" role="status">
            <button class="ring" aria-label={b.stopTalk} onClick={() => listening.stop()}><Icon name="mic" /></button>
            <b>{b.listening}</b>
            <div class="wave" aria-hidden="true">{WAVE.map((h, k) => <i style={{ height: `${h}px`, animationDelay: `${k * STEP_MS}ms` }} />)}</div>
            <div class="live" dir="auto">{listening.text}</div>
            <small>{b.voiceHint}</small>
            <button class="btn sm" onClick={() => { listening.cancel(); setListening(null); }}>{b.cancelTalk}</button>
          </div>
        ) : (
          <div class="chips">{(b.chips as string[]).map((c) => <button onClick={() => say(c)}>{c}</button>)}</div>
        )}
        <div class="chatbar">
          <input dir="auto" maxLength={INPUT_MAX} autocomplete="off" placeholder={b.inputPh} aria-label={b.inputPh} value={input}
            onInput={(e) => setInput(e.currentTarget.value)} onKeyDown={(e) => e.key === 'Enter' && !e.isComposing && say(input)} />
          {empty && features.mic ? (
            <button class="send mic" aria-label={b.talk} onClick={talk}><Icon name="mic" /></button>
          ) : (
            <button class="send" aria-label={b.send} onClick={() => say(input)}><Icon name="send" /></button>
          )}
        </div>
        {!features.mic && <div class="ai-note">{t.keyboardMicHint}</div>}
        <div class="ai-note">{b.aiLater}</div>
      </div>
    </div>
  );

  function renderPart(p: ChatPart, k: number, m: ChatMsg, i: number) {
    if (p.type === 'text') {
      if (p.key === 'bot.warnCats') return null; // shown with its category list
      return <p key={k}><Html html={textFor(p.key, p.vars ?? {})} /></p>;
    }
    if (p.type === 'items') {
      return (
        <ul key={k}>
          {p.ids.map((id) => state.items.find((x) => x.id === id)).filter(Boolean).map((x) => (
            <li><button class="golink" onClick={() => open({ kind: 'details', id: x!.id })}>{x!.title}</button>{x!.time && <span class="num"> {fmtTime(x!.time, lang)}</span>}</li>
          ))}
        </ul>
      );
    }
    if (p.type === 'bills') {
      return <ul key={k}>{p.ids.map((id) => state.bills.find((x) => x.id === id)).filter(Boolean).map((x) => <li>{x!.name} · <bdi dir="ltr">{fmtMoney(x!.amountHalalas)}</bdi></li>)}</ul>;
    }
    if (p.type === 'categories') return <p key={k}><Html html={b.warnCats(p.ids.map((id) => esc(nameOf(findCategory(state.categories, id).name, lang))).join(lang === 'ar' ? '، ' : ', '))} /></p>;
    if (p.type === 'tourButton') return <button key={k} class="btn sm accent" onClick={() => open({ kind: 'tour' })}>{t.tourBtn}</button>;
    if (p.type === 'review') {
      return (
        <p key={k}><Html html={b.addAsk(esc(m.asked ?? ''))} /><br />
          <button class="btn sm accent" onClick={() => open({ kind: 'review', text: m.asked })}>{b.addBtn}</button>
        </p>
      );
    }
    const d = p.draft;
    if (m.added) return <p key={k}><Html html={b.added(esc(d.title))} /></p>;
    const money = d.kind === 'expense' || d.kind === 'bill';
    const color = money ? findCategory(state.categories, d.categoryId).color : (state.areas.find((a) => a.id === d.areaId) ?? state.areas[0]).color;
    const problem = validateDraft(d);
    const meta = [b.kindLbl[d.kind], d.date ? (d.date === today ? t.rel(0) : d.date) + (d.time ? ` ${fmtTime(d.time, lang)}` : '') : '',
      money ? nameOf(findCategory(state.categories, d.categoryId).name, lang) : nameOf((state.areas.find((a) => a.id === d.areaId) ?? state.areas[0]).name, lang)].filter(Boolean).join(' · ');
    return (
      <div class="addcard" key={k}>
        <div class="row">
          <span class="ic" style={{ background: color }}><Icon name={d.kind === 'appointment' ? 'cal' : d.kind === 'expense' ? 'spend' : d.kind === 'bill' ? 'bills' : 'check'} /></span>
          <div>
            <b class="num">{money && d.amountHalalas ? <><bdi dir="ltr">{fmtMoney(d.amountHalalas)}</bdi> · </> : null}<bdi>{d.title || m.asked}</bdi></b>
            <small class="num">{meta}</small>
          </div>
        </div>
        {problem && <small class="err">{b.needEdit(problem === 'amountRange' ? t.needAmount : t.needTitle)}</small>}
        <div class="acts2">
          <button class="ok" onClick={() => addFromCard(i, d)}><Icon name="check" />{b.addOk}</button>
          <button class="ed" onClick={() => editDraft(d, m.asked ?? d.title)}><Icon name="pencil" />{b.editIt}</button>
        </div>
      </div>
    );
  }

  function textFor(key: string, v: Record<string, string | number>): string {
    switch (key) {
      case 'bot.hello': return b.hello(v.hour);
      case 'bot.todayHead': return b.todayHead(v.tasks, v.appointments);
      case 'bot.lateHead': return b.lateHead(v.n);
      case 'bot.spend': return b.spend(fmtMoney(Number(v.spent)), fmtMoney(Number(v.limit)), v.pct, fmtMoney(Number(v.todaySpent)));
      case 'bot.bubbleLate': return b.bubbleLate(v.n);
      case 'bot.bubbleAppt': return b.bubbleAppt(fmtTime(String(v.time), lang));
      default: {
        const value = (b as Record<string, unknown>)[key.replace('bot.', '')];
        return typeof value === 'string' ? value : '';
      }
    }
  }
}
