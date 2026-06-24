import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MatchingService } from '../src/matching/matching.service';

const service = new MatchingService();

test('returns 100 when the role requires no skills', () => {
  assert.equal(service.computeScore([1, 2, 3], []), 100);
});

test('returns 0 when there is no overlap between volunteer and role skills', () => {
  assert.equal(service.computeScore([1, 2], [3, 4]), 0);
});

test('returns 100 when the volunteer has exactly the required skills', () => {
  assert.equal(service.computeScore([1, 2, 3], [1, 2, 3]), 100);
});

test('returns a rounded Jaccard percentage for a partial match', () => {
  // intersection = {2} (1), union = {1,2,3} (3) -> round(1/3 * 100) = 33
  assert.equal(service.computeScore([1, 2], [2, 3]), 33);
});
