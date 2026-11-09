import type { ComponentChildren } from 'preact';
import { useApp } from './app-context';
import { Icon } from './Icon';

// Every sheet: round ✕ (start) · title · teal ✓ (end) when there is something to save.
export function Sheet({ title, onClose, onSave, children }: { title: ComponentChildren; onClose: () => void; onSave?: () => void; children: ComponentChildren }) {
  const { t } = useApp();
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="dhead">
          <button class="round glass" aria-label={t.cancel} onClick={onClose}><Icon name="close" /></button>
          <h2>{title}</h2>
          {onSave ? <button class="round okbtn" aria-label={t.doneBtn} onClick={onSave}><Icon name="checkBig" /></button> : <span class="dhead-pad" />}
        </div>
        {children}
      </div>
    </div>
  );
}
