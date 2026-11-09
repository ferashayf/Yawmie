import { render } from 'preact';
import { mode } from './mode';

// Placeholder until the app shell (Task 20).
function App() {
  return (
    <main style={{ fontFamily: 'ui-rounded, system-ui', padding: '48px 16px', textAlign: 'center' }}>
      <h1>يومي · Yawmie</h1>
      <p>{mode}</p>
    </main>
  );
}

render(<App />, document.getElementById('app')!);
