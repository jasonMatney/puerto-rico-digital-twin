import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import intersects from '@turf/boolean-intersects';
import pointInPolygon from '@turf/boolean-point-in-polygon';
import {
  municipalities,
  requestMunicipio,
  scopedOwner,
} from '../lib/municipalities.ts';
import { previewImport, responseHeaders } from '../lib/csv-import.ts';
const req = (m) =>
  new Request('https://example.com/api/inventory?municipio=' + m, {
    headers: { 'oai-authenticated-user-id': 'test-owner' },
  });
assert.equal(scopedOwner(req('toa-baja')), 'test-owner');
assert.notEqual(scopedOwner(req('catano')), scopedOwner(req('toa-baja')));
assert.throws(() => requestMunicipio(req('invalid')));
const load = async (n) =>
  JSON.parse(await fs.readFile('public/data/catano/' + n, 'utf8'));
const [boundary, buildings, roads, flood, facilities, access, summary] =
  await Promise.all(
    [
      'boundary.geojson',
      'buildings.geojson',
      'roads.geojson',
      'flood.geojson',
      'facilities.geojson',
      'access.geojson',
      'summary.json',
    ].map(load),
  );
assert.equal(boundary.features[0].properties.GEOID, '72033');
for (const [name, data] of [
  ['buildings', buildings],
  ['roads', roads],
]) {
  assert.equal(summary[name].total, data.features.length);
  assert.equal(
    new Set(data.features.map((f) => f.properties.id)).size,
    data.features.length,
  );
  assert.equal(
    summary[name].high,
    data.features.filter((f) => f.properties.exposureHigh).length,
  );
  assert.equal(
    summary[name].extended,
    data.features.filter(
      (f) => f.properties.exposureHigh || f.properties.exposureModerate,
    ).length,
  );
  for (const f of data.features) assert(intersects(f, boundary.features[0]));
}
assert.equal(facilities.features.length, 6);
for (const f of facilities.features) {
  if (f.properties.kind === 'shelter')
    assert(municipalities.catano.shelterIds.includes(f.properties.id));
  assert(pointInPolygon(f, boundary.features[0]));
  assert(f.properties.sources.length >= 1);
  assert.equal(f.properties.operatingStatus, 'unconfirmed');
  assert.equal(
    f.properties.exposureHigh,
    flood.features.some(
      (z) => z.properties.SFHA_TF === 'T' && pointInPolygon(f, z),
    ),
  );
}
assert.equal(
  access.features.filter((f) => f.properties.kind === 'radius').length,
  2,
);
for (const f of access.features)
  assert(municipalities.catano.shelterIds.includes(f.properties.shelterId));
const csv = [
  'id_refugio,' + responseHeaders.join(','),
  'catano-shelter-1,,pendiente,,,pendiente,desconocido,,2026-09-07,LOCAL TEST,Test,https://example.com,',
].join('\n');
assert.equal(previewImport(csv, 'catano').reviews.length, 1);
assert.equal(previewImport(csv, 'toa-baja').errors.length, 1);
console.log(
  'PASS: municipality scopes, cross-municipality CSV rejection, Cataño geometry, unique IDs, exposure counts and sourced shelter coverage.',
);
const readiness = JSON.parse(
  await fs.readFile('public/data/readiness.json', 'utf8'),
);
for (const [slug, dir] of [
  ['toa-baja', 'public/data'],
  ['catano', 'public/data/catano'],
]) {
  const fc = JSON.parse(await fs.readFile(dir + '/facilities.geojson', 'utf8'));
  assert.equal(readiness[slug].total, fc.features.length);
  for (const [kind, count] of Object.entries(readiness[slug].counts))
    assert.equal(
      count,
      fc.features.filter((f) => f.properties.kind === kind).length,
    );
  assert(readiness[slug].gaps.length > 0);
}
assert.equal(readiness.catano.counts.siren, 0);
assert.equal(readiness.catano.counts.police, 1);
assert.equal(readiness.catano.counts.fire, 1);
assert.equal(readiness.catano.counts.health, 2);
console.log(
  'PASS: readiness counts agree with each inventory; missing siren coverage remains explicit.',
);
