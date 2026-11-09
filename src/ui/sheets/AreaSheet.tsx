import { useState } from 'preact/hooks';
import { newId } from '../../model/empty';
import { AREA_COLORS, AREA_ICONS, type AreaIcon as AreaIconName } from '../../model/types';
import { useApp } from '../app-context';
import { AreaIcon, Icon } from '../Icon';

const NAME_MAX = 30;

// New area: name, 8 colors, 12 icons, live preview. ✓ stays locked until there is a name (PRD P7).
export function AreaSheet() {
  const { state, t, update, close } = useApp();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(AREA_COLORS[state.areas.length % AREA_COLORS.length]);
  const [icon, setIcon] = useState<AreaIconName>('star');
  const save = () => {
    if (!name.trim()) return;
    update((s) => ({ ...s, areas: [...s.areas, { id: newId(), name: name.trim(), color, icon }] }), { text: t.saved(name.trim()) });
    close();
  };
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="dhead">
          <button class="round glass" aria-label={t.cancel} onClick={close}><Icon name="close" /></button>
          <h2>{t.newArea}</h2>
          <button class="round okbtn" aria-label={t.save} disabled={!name.trim()} onClick={save}><Icon name="checkBig" /></button>
        </div>
        <div class="apreview">
          <span class="ico big" style={{ '--a': color }}><AreaIcon name={icon} size={30} /></span>
          <b>{name.trim() ? name : <span class="sub">{t.areaPh}</span>}</b>
        </div>
        <div class="dgroup">
          <input class="dtitle" dir="auto" maxLength={NAME_MAX} value={name} placeholder={t.areaName} aria-label={t.areaName} autoFocus
            onInput={(e) => setName(e.currentTarget.value)} onKeyDown={(e) => e.key === 'Enter' && !e.isComposing && save()} />
        </div>
        <div class="lbl">{t.colorLbl}</div>
        <div class="dgroup"><div class="cgrid">
          {AREA_COLORS.map((c) => <button key={c} class={`cdot${color === c ? ' on' : ''}`} style={{ '--c': c }} aria-label={c} aria-pressed={color === c} onClick={() => setColor(c)} />)}
        </div></div>
        <div class="lbl">{t.iconLbl}</div>
        <div class="dgroup"><div class="igrid">
          {AREA_ICONS.map((k) => (
            <button key={k} class={`ipick${icon === k ? ' on' : ''}`} style={{ '--a': color }} aria-label={k} aria-pressed={icon === k} onClick={() => setIcon(k)}><AreaIcon name={k} size={22} /></button>
          ))}
        </div></div>
      </div>
    </div>
  );
}
