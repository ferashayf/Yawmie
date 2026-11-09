import { I, type IconName } from './icons';

// Our own SVG markup (never user text), dropped in place so the demo's CSS styles it.
export function Icon({ name }: { name: IconName }) {
  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: I[name] }} />;
}

import type { AreaIcon as AreaIconName } from '../model/types';
import { AREA_ICON_PATHS } from './icons';

export function AreaIcon({ name, size = 18 }: { name: AreaIconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" dangerouslySetInnerHTML={{ __html: AREA_ICON_PATHS[name] }} />
  );
}
