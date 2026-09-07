import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import booleanIntersects from '@turf/boolean-intersects';
const read = async (name) =>
  JSON.parse(await fs.readFile('public/data/' + name, 'utf8'));
const [buildings, roads, flood, boundary, summary] = await Promise.all(
  [
    'buildings.geojson',
    'roads.geojson',
    'flood.geojson',
    'boundary.geojson',
    'summary.json',
  ].map(read),
);
assert.equal(boundary.features[0].properties.GEOID, '72137');
assert.ok(
  buildings.features.length > 10000,
  'Expected meaningful footprint coverage',
);
assert.ok(flood.features.some((f) => f.properties.SFHA_TF === 'T'));
assert.ok(
  flood.features.some((f) =>
    String(f.properties.ZONE_SUBTY).includes('0.2 PCT'),
  ),
);
for (const [name, data] of [
  ['buildings', buildings],
  ['roads', roads],
]) {
  assert.equal(
    new Set(data.features.map((f) => f.properties.id)).size,
    data.features.length,
    'Feature IDs unique',
  );
  assert.equal(summary[name].total, data.features.length);
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
  assert.ok(summary[name].extended >= summary[name].high);
  const sample = data.features.filter(
    (_, i) => i % Math.max(1, Math.floor(data.features.length / 100)) === 0,
  );
  for (const f of sample) {
    assert.ok(
      booleanIntersects(f, boundary.features[0]),
      'Features must intersect municipality',
    );
    const high = flood.features.some(
      (z) => z.properties.SFHA_TF === 'T' && booleanIntersects(f, z),
    );
    const moderate = flood.features.some(
      (z) =>
        String(z.properties.ZONE_SUBTY).includes('0.2 PCT') &&
        booleanIntersects(f, z),
    );
    assert.equal(f.properties.exposureHigh, high);
    assert.equal(f.properties.exposureModerate, moderate);
  }
}
const square = (x, y) => ({
  type: 'Polygon',
  coordinates: [
    [
      [x, y],
      [x + 1, y],
      [x + 1, y + 1],
      [x, y + 1],
      [x, y],
    ],
  ],
});
assert.equal(booleanIntersects(square(0, 0), square(2, 2)), false);
assert.equal(booleanIntersects(square(0, 0), square(0.5, 0.5)), true);
assert.equal(booleanIntersects(square(0, 0), square(1, 0)), true);
console.log(
  'PASS: source identity, unique IDs, summary totals, monotonic hazard views, 200+ independent spatial spot checks, and boundary-contact semantics.',
);

const { default: pointInPolygon } =
  await import('@turf/boolean-point-in-polygon');
const facilities = await read('facilities.geojson');
assert.equal(facilities.features.length, 31);
assert.equal(new Set(facilities.features.map((f) => f.properties.id)).size, 31);
assert.equal(
  facilities.features.filter((f) => f.properties.designationYear === 2026)
    .length,
  12,
);
for (const f of facilities.features) {
  assert.ok(
    boundary.features.some((b) => pointInPolygon(f, b)),
    `${f.properties.name} outside Toa Baja`,
  );
  assert.equal(f.properties.operatingStatus, 'unconfirmed');
  assert.ok(
    f.properties.sources.length &&
      f.properties.sources.every((s) => s.url.startsWith('https://')),
  );
  const zones = flood.features.filter((z) => pointInPolygon(f, z));
  assert.equal(
    f.properties.exposureHigh,
    zones.some((z) => z.properties.SFHA_TF === 'T'),
  );
  assert.equal(
    f.properties.exposureModerate,
    zones.some((z) => String(z.properties.ZONE_SUBTY).includes('0.2 PCT')),
  );
}
console.log(
  'Facility inventory: 31 unique sourced points within Toa Baja, 12 designated 2026 shelters; all point exposures independently checked.',
);
