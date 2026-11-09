import { useEffect } from 'preact/hooks';
import { fmtTime } from '../i18n/format';
import { bubbleLine } from '../logic/assistant';
import { useApp } from './app-context';
import { Icon } from './Icon';

const BUBBLE_MS = 6000;

// One useful line from Yawmie when the app opens; closes by itself after 6 s or on scroll (PRD Y1).
export function Bubble({ onClose }: { onClose: () => void }) {
  const { state, today, now, t, open } = useApp();
  const b = t.bot;
  useEffect(() => {
    const timer = setTimeout(onClose, BUBBLE_MS);
    const screen = document.querySelector('.screen');
    screen?.addEventListener('scroll', onClose, { once: true });
    return () => {
      clearTimeout(timer);
      screen?.removeEventListener('scroll', onClose);
    };
  }, []);
  const line = bubbleLine(state, today, now);
  const v = line.type === 'text' ? line.vars ?? {} : {};
  const html = line.type === 'text' && line.key === 'bot.bubbleLate' ? b.bubbleLate(v.n)
    : line.type === 'text' && line.key === 'bot.bubbleAppt' ? b.bubbleAppt(fmtTime(String(v.time), state.settings.lang))
    : b.bubbleFree;
  return (
    <div id="bubble">
      <div class="glass buddy-bubble" role="status" onClick={() => { onClose(); open({ kind: 'chat' }); }}>
        <span dangerouslySetInnerHTML={{ __html: html }} />
        <button class="x" aria-label={b.close} onClick={(e) => { e.stopPropagation(); onClose(); }}><Icon name="xs" /></button>
      </div>
    </div>
  );
}
