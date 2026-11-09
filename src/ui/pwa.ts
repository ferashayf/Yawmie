// Website app: tells the screen when a new version is ready, so nothing is ever half old and half new (PRD I5).
import { registerSW } from 'virtual:pwa-register';

export function watchForUpdate(onReady: (apply: () => void) => void) {
  const update = registerSW({ onNeedRefresh: () => onReady(() => void update(true)) });
}
