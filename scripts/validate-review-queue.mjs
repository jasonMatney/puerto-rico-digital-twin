import assert from 'node:assert/strict';
import { queueState } from '../lib/review-queue.ts';
const full = {
  id: 'a',
  shelterId: 'shelter-3',
  createdAt: '2026-09-07T01:00:00Z',
  asOf: '2026-09-06',
  reviewer: 'Test',
  nameCheck: 'confirmed',
  locationCheck: 'confirmed',
  operatingStatus: 'open',
  capacity: 0,
  questions: '',
};
assert.equal(queueState('shelter-3', [], new Set()).action, 'collect');
assert.equal(queueState('shelter-3', [full], new Set()).action, 'decision');
assert.equal(queueState('shelter-3', [full], new Set(['a'])).action, 'monitor');
assert.equal(
  queueState(
    'shelter-3',
    [{ ...full, nameCheck: 'discrepancy' }],
    new Set(['a']),
  ).action,
  'resolve',
);
assert.ok(
  queueState(
    'shelter-3',
    [{ ...full, capacity: null }],
    new Set(),
  ).gaps.includes('capacity'),
);
assert.equal(
  queueState(
    'shelter-3',
    [{ ...full, questions: 'Confirm entrance' }],
    new Set(['a']),
  ).action,
  'followup',
);
const newer = {
  ...full,
  id: 'b',
  createdAt: '2026-09-07T02:00:00Z',
  nameCheck: 'discrepancy',
};
assert.equal(
  queueState('shelter-3', [full, newer], new Set(['a'])).latest.id,
  'b',
);
assert.equal(
  queueState('shelter-3', [full, newer], new Set(['a'])).unpublished,
  1,
);
assert.equal(queueState('shelter-6', [full], new Set()).latest, null);
console.log(
  'PASS: missing reviews, discrepancies after publication, zero vs unknown capacity, unresolved questions, latest-review ordering and unpublished counts.',
);
