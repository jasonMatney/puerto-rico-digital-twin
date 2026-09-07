import assert from 'node:assert/strict';
import { validateVerification } from '../lib/verification.ts';
const valid = {
  shelterId: 'shelter-3',
  reviewer: 'Local test',
  asOf: '2026-09-01',
  nameCheck: 'discrepancy',
  locationCheck: 'unconfirmed',
  proposedName: '',
  latitude: null,
  longitude: null,
  operatingStatus: 'unknown',
  capacity: null,
  sourceTitle: 'Source test',
  sourceUrl: 'https://www.toabaja.com/',
  questions: 'Test only',
};
assert.equal(validateVerification(valid).capacity, null);
assert.equal(validateVerification({ ...valid, capacity: 0 }).capacity, 0);
for (const patch of [
  { shelterId: 'shelter-13' },
  { reviewer: '' },
  { sourceUrl: 'javascript:alert(1)' },
  { sourceUrl: 'https://user:pass@example.com/' },
  { asOf: '2026-02-30' },
  { asOf: '2099-01-01' },
  { latitude: 18.4 },
  { latitude: 91, longitude: -66 },
  { capacity: -1 },
  { capacity: 1.5 },
  { operatingStatus: 'verified' },
  { questions: 'x'.repeat(4001) },
])
  assert.throws(() => validateVerification({ ...valid, ...patch }));
console.log(
  'PASS: valid review, unknown vs zero capacity, required evidence, date, coordinate, enum and size validation.',
);
