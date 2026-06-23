import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ShiftsService } from '../src/shifts/shifts.service';

// These methods are pure (no DB / no `this` dependency on the injected repos),
// so we can construct the service without its dependencies and call them directly.
const service = new ShiftsService(
  undefined as never, // shiftRepo
  undefined as never, // appRepo
  undefined as never, // roleRepo
  undefined as never, // eventRepo
  undefined as never, // usersService
);

test('splitHoursEqually returns [] when days is zero or negative', () => {
  assert.deepEqual(service.splitHoursEqually(10, 0), []);
  assert.deepEqual(service.splitHoursEqually(10, -3), []);
});

test('splitHoursEqually distributes hours so the total is preserved', () => {
  const parts = service.splitHoursEqually(10, 3);
  assert.equal(parts.length, 3);
  const sum = parts.reduce((a, b) => a + b, 0);
  assert.equal(Math.round(sum * 100) / 100, 10);
});

test('splitHoursEqually rounds each base share down to the nearest 0.25', () => {
  const parts = service.splitHoursEqually(10, 3);
  // 10/3 = 3.333..., rounded down to 0.25 -> 3.25 for the non-remainder days
  assert.equal(parts[0], 3.25);
  assert.equal(parts[1], 3.25);
});

test('getEventDays lists every day in the inclusive range as YYYY-MM-DD', () => {
  const days = (service as never as {
    getEventDays(start: string, end: string): string[];
  }).getEventDays('2026-06-20', '2026-06-22');
  assert.deepEqual(days, ['2026-06-20', '2026-06-21', '2026-06-22']);
});

test('addHours advances an HH:MM time and clamps the hour at 23', () => {
  const addHours = (service as never as {
    addHours(time: string, hours: number): string;
  }).addHours.bind(service);
  assert.equal(addHours('09:00', 1.5), '10:30');
  // Hour is clamped to 23 (minutes are kept), so it never overflows past 27:30.
  assert.equal(addHours('22:30', 5), '23:30');
});
