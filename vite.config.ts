import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Website build only: the artifact runs inside Claude's own sandbox and inlines its script.
const CSP = "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'";

function contentSecurityPolicy(): Plugin {
  return {
    name: 'yawmie-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}">`),
  };
}

const pwa = VitePWA({
  registerType: 'prompt',
  includeAssets: ['icons/apple-touch-icon.png'],
  manifest: {
    name: 'Yawmie',
    short_name: 'Yawmie',
    lang: 'ar',
    dir: 'rtl',
    display: 'standalone',
    start_url: '/',
    background_color: '#F4F4F2',
    theme_color: '#F4F4F2',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
});

export default defineConfig(({ mode }) =>
  mode === 'artifact'
    ? {
        plugins: [preact(), viteSingleFile()],
        publicDir: false,
        build: { outDir: 'dist-artifact' },
        resolve: { alias: { 'virtual:pwa-register': '/src/ui/pwa-stub.ts' } },
      }
    : { plugins: [preact(), contentSecurityPolicy(), pwa], test: { include: ['src/**/*.test.{ts,tsx}'] } },
);
