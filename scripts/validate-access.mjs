import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import intersects from '@turf/boolean-intersects';
import { clipRoad, projection } from './access-geometry.mjs';
const center = [-66.2, 18.44],
  { from, to } = projection(center),
  line = (a, b) => ({ type: 'LineString', coordinates: [from(a), from(b)] });
const crossing = clipRoad(line([-1000, 0], [1000, 0]), center, 500);
assert.ok(crossing);
assert.ok(Math.abs(to(crossing.coordinates[0][0])[0] + 500) < 1e-6);
assert.ok(Math.abs(to(crossing.coordinates[0][1])[0] - 500) < 1e-6);
assert.equal(clipRoad(line([600, 0], [900, 0]), center, 500), null);
assert.equal(clipRoad(line([0, 0], [0, 0]), center, 500), null);
assert.ok(clipRoad(line([0, 0], [100, 100]), center, 500));
// A remote flood intersection on the same road must not mark the nearby clipped part.
const remoteZone = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        from([700, -100]),
        from([900, -100]),
        from([900, 100]),
        from([700, 100]),
        from([700, -100]),
      ],
    ],
  },
};
assert.ok(
  intersects(
    { type: 'Feature', properties: {}, geometry: line([-1000, 0], [1000, 0]) },
    remoteZone,
  ),
);
assert.equal(
  intersects(
    { type: 'Feature', properties: {}, geometry: crossing },
    remoteZone,
  ),
  false,
);
const read = async (n) =>
  JSON.parse(await fs.readFile('public/data/' + n, 'utf8'));
const [data, flood, facilities] = await Promise.all(
  ['access.geojson', 'flood.geojson', 'facilities.geojson'].map(read),
);
assert.equal(
  data.features.filter((f) => f.properties.kind === 'radius').length,
  12,
);
const keys = new Set();
for (const f of data.features.filter((f) => f.properties.kind === 'road')) {
  const p = f.properties,
    key = p.shelterId + '/' + p.roadId;
  assert.ok(!keys.has(key));
  keys.add(key);
  const shelter = facilities.features.find(
    (s) => s.properties.id === p.shelterId,
  );
  assert.equal(shelter.properties.kind, 'shelter');
  const proj = projection(shelter.geometry.coordinates);
  for (const part of f.geometry.coordinates)
    for (const c of part) assert.ok(Math.hypot(...proj.to(c)) <= 500.00001);
  const zones = flood.features.filter((z) => intersects(f, z));
  assert.equal(
    p.exposureHigh,
    zones.some((z) => z.properties.SFHA_TF === 'T'),
  );
  assert.equal(
    p.exposureModerate,
    zones.some((z) => String(z.properties.ZONE_SUBTY).includes('0.2 PCT')),
  );
}
console.log(
  `PASS: clipping edge cases, distant-intersection exclusion, 12 shelter radii and ${keys.size} unique clipped road records with independent flood checks.`,
);
