// Fine contour lines from the brand kit (ferashayf.com texture), drawn behind the glass.
const WAVE_LINES = 40;
const STEP_PX = 4;

export function drawWaves(c: HTMLCanvasElement) {
  const r = c.getBoundingClientRect();
  const ctx = c.getContext('2d');
  if (!r.width || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  c.width = Math.round(r.width * dpr);
  c.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, r.width, r.height);
  const cs = getComputedStyle(document.documentElement);
  ctx.strokeStyle = cs.getPropertyValue('--ink').trim();
  ctx.globalAlpha = cs.colorScheme === 'dark' ? 0.09 : 0.1;
  ctx.lineWidth = 0.6;
  for (let i = 0; i < WAVE_LINES; i++) {
    const base = r.height * 0.05 + i * ((r.height * 0.95) / WAVE_LINES);
    ctx.beginPath();
    for (let x = 0; x <= r.width; x += STEP_PX) {
      const t = x / r.width;
      const y = base + Math.sin(t * 4.2 + i * 0.2) * (14 + i * 0.7) + Math.cos(t * 2.1 - i * 0.13) * 18;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
