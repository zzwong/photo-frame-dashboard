import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// Exercise the production week renderer with synthetic events, without DOM or device IO.
const source = readFileSync(new URL('../js/views/calendar.js', import.meta.url), 'utf8');
const start = source.indexOf('  function weekView()');
const end = source.indexOf('\n  // ------------------------------------------------------------ month', start);
assert.ok(start >= 0 && end > start, 'calendar week source boundaries');
const weekSource = source.slice(start, end);

function addDays(date, count) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
}

function setup(counts, selected = new Date(2026, 10, 9)) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(selected, i));
  const events = days.map((day, i) => {
    const [allDayCount, timedCount] = counts[i] || [0, 0];
    return {
      allDay: Array.from({ length: allDayCount }, (_, j) => ({
        id: `day-${i}-all-${j}`, title: `All day ${j}`,
      })),
      timed: Array.from({ length: timedCount }, (_, j) => ({
        id: `day-${i}-timed-${j}`, title: `Timed ${j}`, start: day, end: day,
      })),
    };
  });
  const index = date => days.findIndex(day => +day === +date);
  const context = {
    V: { date: selected },
    App: {
      now: () => selected,
      addDays,
      sameDay: (a, b) => +a === +b,
      allDayOn: date => events[index(date)].allDay,
      timedOn: date => events[index(date)].timed,
      fmt: { dayShort: () => '', time: () => '' },
      pstyle: () => '', evColor: () => '', esc: value => value,
    },
  };
  vm.createContext(context);
  vm.runInContext(weekSource, context, { timeout: 1000 });
  return { context, days, events };
}

function assertWeek(fixture) {
  const html = fixture.context.weekView();
  const columns = html.split(/(?=<div class="wk-col(?: is-today)?")/).slice(1);
  assert.equal(columns.length, 7, 'one column per day');
  columns.forEach((column, i) => {
    const { allDay, timed } = fixture.events[i];
    const shown = Math.min(timed.length, Math.max(0, 7 - allDay.length));
    const hidden = timed.length - shown;
    assert.equal(Number(column.match(/^<div[^>]*data-day="(\d+)"/)[1]), +fixture.days[i]);
    assert.deepEqual(
      [...column.matchAll(/<button class="wk-ad" data-ev="([^"]+)"/g)].map(match => match[1]),
      allDay.map(event => event.id),
      `day ${i}: all-day entries remain visible and ordered`,
    );
    assert.deepEqual(
      [...column.matchAll(/<button class="wk-ev(?: is-past)?" data-ev="([^"]+)"/g)].map(match => match[1]),
      timed.slice(0, shown).map(event => event.id),
      `day ${i}: visible timed entries use the available capacity`,
    );
    const more = [...column.matchAll(/<button class="wk-more" data-day="(\d+)">\+(\d+) more<\/button>/g)];
    assert.equal(more.length, hidden > 0 ? 1 : 0, `day ${i}: no phantom more button`);
    if (hidden > 0) {
      assert.equal(Number(more[0][1]), +fixture.days[i], `day ${i}: more targets this day`);
      assert.equal(Number(more[0][2]), hidden, `day ${i}: exact hidden count`);
    }
    assert.equal(column.includes('class="wk-free serif"'), !allDay.length && !timed.length);
  });
  return html;
}

for (const allDay of [0, 1, 6, 7, 8, 9, 10]) {
  for (const timed of [0, 1, 3, 7, 8]) {
    test(`week accounts for ${allDay} all-day and ${timed} timed events`, () => {
      assertWeek(setup([[allDay, timed]]));
    });
  }
}

test('week columns have independent capacities across a year boundary', () => {
  assertWeek(setup([[0, 8], [6, 3], [7, 3], [8, 3], [9, 0], [0, 0], [1, 7]], new Date(2026, 11, 28)));
});

test('repeated week renders do not mutate event lists or leak earlier counts', () => {
  const fixture = setup([[8, 3], [0, 8], [7, 0]]);
  const originalEvents = JSON.stringify(fixture.events);
  const first = assertWeek(fixture);
  assert.equal(assertWeek(fixture), first);
  assert.equal(JSON.stringify(fixture.events), originalEvents);
  fixture.events[0].allDay.length = 6;
  assertWeek(fixture);
  fixture.events[0].allDay.length = 0;
  fixture.events[0].timed.length = 0;
  assertWeek(fixture);
});
