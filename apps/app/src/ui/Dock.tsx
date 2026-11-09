import buddy from '../../../../brand/buddy.png';
import { isOverdue } from '../logic/today';
import { useApp, type Tab } from './app-context';
import { Icon } from './Icon';
import type { IconName } from './icons';

const TABS: [Exclude<Tab, 'settings'>, IconName][] = [['today', 'today'], ['plan', 'cal'], ['tasks', 'list'], ['money', 'spend']];

// Yawmie's tile (red badge = overdue count) and the tab capsule.
export function Dock({ onBuddy }: { onBuddy: () => void }) {
  const { state, today, t, tab, go } = useApp();
  const late = state.items.filter((it) => isOverdue(it, today)).length;
  return (
    <div class="dock">
      <div id="buddy">
        <button class="glass buddy" aria-label={t.bot.name} onClick={onBuddy}><img src={buddy} alt="" /></button>
        {late > 0 && <span class="badge num" aria-hidden="true">{late}</span>}
      </div>
      <nav class="tabbar glass" aria-label="Tabs">
        {TABS.map(([id, icon]) => (
          <button key={id} class={`tab${tab === id ? ' on' : ''}`} aria-current={tab === id ? 'page' : 'false'} onClick={() => go(id)}>
            <Icon name={icon} /><span>{t[id]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
