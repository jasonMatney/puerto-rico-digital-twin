import fs from 'node:fs/promises';
import intersects from '@turf/boolean-intersects';
import { clipRoad, radiusRing } from './access-geometry.mjs';
const read = async (n) =>
  JSON.parse(await fs.readFile('public/data/' + n, 'utf8'));
const [facilities, roads, flood] = await Promise.all(
  ['facilities.geojson', 'roads.geojson', 'flood.geojson'].map(read),
);
const features = [],
  radiusM = 500;
for (const shelter of facilities.features.filter(
  (f) => f.properties.kind === 'shelter',
)) {
  const id = shelter.properties.id,
    center = shelter.geometry.coordinates;
  features.push({
    type: 'Feature',
    geometry: radiusRing(center, radiusM),
    properties: { shelterId: id, kind: 'radius', radiusM },
  });
  for (const road of roads.features) {
    const geometry = clipRoad(road.geometry, center, radiusM);
    if (!geometry) continue;
    const f = {
      type: 'Feature',
      geometry,
      properties: {
        shelterId: id,
        kind: 'road',
        radiusM,
        roadId: road.properties.id,
        roadClass: road.properties.class || 'unknown',
        source: road.properties.source,
      },
    };
    const zones = flood.features.filter((z) => intersects(f, z));
    Object.assign(f.properties, {
      exposureHigh: zones.some((z) => z.properties.SFHA_TF === 'T'),
      exposureModerate: zones.some((z) =>
        String(z.properties.ZONE_SUBTY).includes('0.2 PCT'),
      ),
    });
    features.push(f);
  }
}
await fs.writeFile(
  'public/data/access.geojson',
  JSON.stringify({ type: 'FeatureCollection', features }) + '\n',
);
console.log(
  `Access screening: ${features.filter((f) => f.properties.kind === 'road').length} shelter/road records, 12 radius boundaries.`,
);
