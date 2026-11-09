import { Header } from '../TopBar';
import { useApp, type Tab } from '../app-context';

// Shell only: each tab gets its real screen in Tasks 21–26.
export function Placeholder({ tab }: { tab: Tab }) {
  const { t } = useApp();
  const title = tab === 'settings' ? t.more : t[tab];
  return <Header title={title} />;
}
