// Tests for the pre-push privacy check. The fake values here are why the
// checker skips this one file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findLeaks } from './check-privacy.mjs';

const kinds = (text, words = []) => findLeaks(text, 'x.md', words).map((l) => l.kind);

test('flags Saudi mobiles', () => {
  assert.deepEqual(kinds('call +966 55 123 4567'), ['phone']);
  assert.deepEqual(kinds('call 0551234567'), ['phone']);
  assert.deepEqual(kinds('call ٠٥٥١٢٣٤٥٦٧'), ['phone']);
});

test('flags emails but allows example.com and noreply', () => {
  assert.deepEqual(kinds('mail a@b.co'), ['email']);
  assert.deepEqual(kinds('x@example.com'), []);
  assert.deepEqual(kinds('1+u@users.noreply.github.com'), []);
  assert.deepEqual(kinds('noreply@anthropic.com'), []);
});

test('flags card-like numbers and IBANs', () => {
  assert.deepEqual(kinds('card 4111 1111 1111 1111'), ['card']);
  assert.deepEqual(kinds('iban SA0380000000608010167519'), ['iban']);
  assert.deepEqual(kinds('card ***0000'), []);
});

test('flags private words whole-word, any case', () => {
  assert.deepEqual(kinds('lunch at corner cafe', ['Corner Cafe']), ['word']);
  assert.deepEqual(kinds('cornercafeteria', ['Corner Cafe']), []);
});

test('ignores amounts and dates', () => {
  assert.deepEqual(kinds('SAR 1,250.00 on 2026-11-09 08:14'), []);
});

test('reports the line number', () => {
  const [leak] = findLeaks('ok\nmail a@b.co', 'x.md', []);
  assert.equal(leak.line, 2);
  assert.equal(leak.path, 'x.md');
});
