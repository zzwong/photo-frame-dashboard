import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// Exercise the production header with synthetic state, without DOM or device IO.
const source = readFileSync(new URL('../js/views/calendar.js', import.meta.url), 'utf8');
const start = source.indexOf('  function header()');
const end = source.indexOf('\n  function render()', start);
assert.ok(start >= 0 && end > start, 'calendar header source boundaries');
const headerSource = source.slice(start, end);

function todayHidden(mode, selected, now) {
  const context = {
    V: { mode, date: selected },
    App: {
      now: () => now,
      icon: () => '',
      sameDay: (a, b) => a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(),
    },
    title: () => ({ t: 'Synthetic calendar', k: '' }),
    MODES: [],
  };
  vm.createContext(context);
  vm.runInContext(headerSource, context);
  const html = context.header();
  assert.match(html, /<button\b[^>]*\bdata-today(?:\s|>)/, 'Today button exists');
  return /class="btn btn--ghost is-hidden" data-today/.test(html);
}

test('month Today shortcut is hidden only in the current month and year', () => {
  const now = new Date(2026, 10, 9);
  assert.equal(todayHidden('month', new Date(2026, 10, 1), now), true);
  assert.equal(todayHidden('month', new Date(2025, 10, 1), now), false);
  assert.equal(todayHidden('month', new Date(2027, 10, 1), now), false);
  assert.equal(todayHidden('month', new Date(2026, 9, 1), now), false);
  assert.equal(todayHidden('month', new Date(2026, 11, 1), now), false);
});

test('month Today shortcut stays available across a December/January boundary', () => {
  assert.equal(todayHidden('month', new Date(2025, 11, 1), new Date(2026, 0, 1)), false);
  assert.equal(todayHidden('month', new Date(2025, 0, 1), new Date(2026, 0, 1)), false);
});

test('day, three-day and week modes retain same-day visibility rules', () => {
  const now = new Date(2026, 10, 9, 18);
  for (const mode of ['day', '3day', 'week']) {
    assert.equal(todayHidden(mode, new Date(2026, 10, 9), now), true);
    assert.equal(todayHidden(mode, new Date(2026, 10, 8), now), false);
    assert.equal(todayHidden(mode, new Date(2025, 10, 9), now), false);
  }
});
