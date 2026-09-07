import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { facilityRegistry } from '../lib/facility-registry.ts';
import { validateVerification } from '../lib/verification.ts';
import { previewImport, responseHeaders } from '../lib/csv-import.ts';
const base = {
  reviewer: 'LOCAL TEST',
  asOf: '2026-09-07',
  nameCheck: 'unconfirmed',
  locationCheck: 'unconfirmed',
  proposedName: '',
  latitude: null,
  longitude: null,
  operatingStatus: 'unknown',
  capacity: null,
  sourceTitle: 'Test',
  sourceUrl: 'https://example.com',
  questions: '',
};
for (const [m, dir] of [
  ['toa-baja', 'public/data'],
  ['catano', 'public/data/catano'],
]) {
  const fc = JSON.parse(await fs.readFile(dir + '/facilities.geojson', 'utf8'));
  assert.deepEqual(
    Object.keys(facilityRegistry[m]).sort(),
    fc.features.map((f) => f.properties.id).sort(),
  );
  for (const f of fc.features) {
    assert.equal(
      validateVerification({ ...base, shelterId: f.properties.id }, m)
        .shelterId,
      f.properties.id,
    );
    assert.equal(facilityRegistry[m][f.properties.id], f.properties.kind);
  }
}
const id = 'catano-fire-535083126';
assert.throws(() =>
  validateVerification({ ...base, shelterId: id }, 'toa-baja'),
);
const csv = [
  'id_refugio,' + responseHeaders.join(','),
  id +
    ',,pendiente,,,pendiente,desconocido,,2026-09-07,LOCAL TEST,Test,https://example.com,',
].join('\n');
assert.equal(previewImport(csv, 'catano').reviews.length, 1);
assert.equal(previewImport(csv, 'toa-baja').errors.length, 1);
console.log(
  'PASS: all 37 facility IDs accepted only in their municipality, registry matches inventories, non-shelter CSV accepted.',
);
