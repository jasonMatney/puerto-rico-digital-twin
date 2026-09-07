const dataDir = process.env.DATA_DIR || 'public/data';
import fs from 'node:fs/promises';
import bbox from '@turf/bbox';
import intersect from '@turf/intersect';
import booleanIntersects from '@turf/boolean-intersects';
const read = async (n) =>
  JSON.parse(await fs.readFile(dataDir + '/' + n + '.geojson', 'utf8'));
const boundary = (await read('boundary')).features[0];
const flood = await read('flood');
const zones = [];
for (const f of flood.features) {
  const clipped = intersect({
    type: 'FeatureCollection',
    features: [boundary, f],
  });
  if (clipped) {
    clipped.properties = f.properties;
    zones.push(clipped);
  }
}
const features = { type: 'FeatureCollection', features: zones };
await fs.writeFile(dataDir + '/flood.geojson', JSON.stringify(features));
const high = zones.filter((f) => f.properties.SFHA_TF === 'T');
const moderate = zones.filter((f) =>
  String(f.properties.ZONE_SUBTY).includes('0.2 PCT'),
);
const candidates = zones.map((f) => ({ f, b: bbox(f) }));
function exposure(f) {
  const b = bbox(f);
  const overlaps = candidates
    .filter(
      (x) =>
        b[0] <= x.b[2] && b[2] >= x.b[0] && b[1] <= x.b[3] && b[3] >= x.b[1],
    )
    .filter((x) => booleanIntersects(f, x.f))
    .map((x) => x.f.properties);
  return {
    high: overlaps.some((p) => p.SFHA_TF === 'T'),
    moderate: overlaps.some((p) => String(p.ZONE_SUBTY).includes('0.2 PCT')),
    zones:
      [...new Set(overlaps.map((p) => p.FLD_ZONE))].join(', ') ||
      'No mapped zone intersection',
  };
}
const buildings = await read('buildings');
const roads = await read('roads');
for (const data of [buildings, roads])
  for (const f of data.features) {
    const e = exposure(f);
    Object.assign(f.properties, {
      exposureHigh: e.high,
      exposureModerate: e.moderate,
      zoneLabels: e.zones,
    });
  }
const counts = (data) => ({
  total: data.features.length,
  high: data.features.filter((f) => f.properties.exposureHigh).length,
  extended: data.features.filter(
    (f) => f.properties.exposureHigh || f.properties.exposureModerate,
  ).length,
});
const summary = {
  buildings: counts(buildings),
  roads: counts(roads),
  floodPolygons: zones.length,
  highPolygons: high.length,
  moderatePolygons: moderate.length,
  method:
    'Any geometry intersection with FEMA mapped polygons. Boundary-touching features included. Buildings are mapped vector features, not verified structures or households; roads are tile segments, not unique roads. No water-depth or passability model.',
};
for (const [name, data] of [
  ['buildings', buildings],
  ['roads', roads],
])
  await fs.writeFile(dataDir + '/' + name + '.geojson', JSON.stringify(data));
await fs.writeFile(dataDir + '/summary.json', JSON.stringify(summary, null, 2));
console.log(summary);
