// Blocks personal data before it reaches the public repo.
// Run: node scripts/check-privacy.mjs (the pre-push hook and CI run it too).
// Private words (your real shops, names) go in .privacy-words, one per line; that file is git-ignored.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SKIP = new Set(['package-lock.json', 'scripts/check-privacy.test.mjs']);
const MIN_CARD_DIGITS = 13;

const PATTERNS = [
  { kind: 'phone', re: /(?:\+|00)?966[\s-]?5\d(?:[\s-]?\d){7}|(?<!\d)05\d(?:[\s-]?\d){7}(?!\d)/g },
  { kind: 'email', re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, allow: isAllowedEmail },
  { kind: 'iban', re: /\bSA\d{22}\b/gi },
  { kind: 'card', re: /(?<![\w*])\d(?:[ -]?\d){12,18}(?!\w)/g, allow: (m) => !passesLuhn(m) },
];

function toWesternDigits(text) {
  return text.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
}

function isAllowedEmail(email) {
  const e = email.toLowerCase();
  return /@example\.(com|org|net)$/.test(e) || e.endsWith('@users.noreply.github.com') || e === 'noreply@anthropic.com';
}

function passesLuhn(match) {
  const digits = match.replace(/\D/g, '');
  if (digits.length < MIN_CARD_DIGITS) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

function wordPattern(word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'giu');
}

export function findLeaks(text, path, words) {
  const patterns = [...PATTERNS, ...words.map((w) => ({ kind: 'word', re: wordPattern(w) }))];
  const leaks = [];
  toWesternDigits(text).split('\n').forEach((lineText, i) => {
    for (const { kind, re, allow } of patterns) {
      for (const m of lineText.matchAll(re)) {
        if (allow && allow(m[0])) continue;
        leaks.push({ path, line: i + 1, kind, match: m[0] });
      }
    }
  });
  return leaks;
}

function readWords() {
  if (!existsSync('.privacy-words')) return [];
  return readFileSync('.privacy-words', 'utf8').split('\n').map((w) => w.trim()).filter((w) => w && !w.startsWith('#'));
}

function repoFiles() {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' });
  return out.split('\0').filter(Boolean);
}

function isBinary(buf) {
  return buf.subarray(0, 8000).includes(0);
}

function main() {
  const words = readWords();
  const leaks = [];
  for (const path of repoFiles()) {
    if (SKIP.has(path) || !existsSync(path)) continue;
    const buf = readFileSync(path);
    if (isBinary(buf)) continue;
    leaks.push(...findLeaks(buf.toString('utf8'), path, words));
  }
  if (leaks.length === 0) { console.log('Privacy check passed.'); return; }
  console.error('Privacy check FAILED. Remove these before pushing:');
  for (const l of leaks) console.error(`  ${l.path}:${l.line}  ${l.kind}  ${l.match.slice(0, 60)}`);
  process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
