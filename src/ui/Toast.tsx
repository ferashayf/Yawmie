import { useApp } from './app-context';

// The small capsule at the top: "Saved", "Deleted", with Undo when it can be undone.
export function Toast({ text, onUndo, action }: { text: string; onUndo?: () => void; action?: { label: string; run: () => void } }) {
  const { t } = useApp();
  return (
    <div class="toast" role="status">
      <span>{text}</span>
      {onUndo && <button onClick={onUndo}>{t.undo}</button>}
      {action && <button onClick={action.run}>{action.label}</button>}
    </div>
  );
}
