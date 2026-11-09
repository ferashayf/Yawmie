import { I, type IconName } from './icons';

// Our own SVG markup (never user text), dropped in place so the demo's CSS styles it.
export function Icon({ name }: { name: IconName }) {
  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: I[name] }} />;
}
