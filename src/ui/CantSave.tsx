import { strings } from '../i18n';
import type { Lang } from '../model/types';
import { Icon } from './Icon';

// Artifact only: shown instead of the app when it can't save here (PRD C2). Nothing is saved.
export function CantSave({ reason, lang }: { reason: 'signedOut' | 'notAllowed'; lang: Lang }) {
  const t = strings(lang);
  const [title, text] = reason === 'signedOut' ? [t.cantSaveSignedOutT, t.cantSaveSignedOutP] : [t.cantSaveNotAllowedT, t.cantSaveNotAllowedP];
  return (
    <main class="screen">
      <div class="glass empty-card" role="alert">
        <span class="eico"><Icon name="lock" /></span>
        <b>{title}</b>
        <p>{text}</p>
      </div>
    </main>
  );
}
