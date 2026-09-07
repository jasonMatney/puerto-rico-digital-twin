import fs from 'node:fs/promises';
import booleanIntersects from '@turf/boolean-intersects';
const b = JSON.parse(
  await fs.readFile('public/data/buildings.geojson', 'utf8'),
);
const boundary = JSON.parse(
  await fs.readFile('public/data/boundary.geojson', 'utf8'),
).features[0];
const features = [];
for (const f of b.features) {
  const parts =
    f.geometry.type === 'MultiPolygon'
      ? f.geometry.coordinates
      : [f.geometry.coordinates];
  for (let i = 0; i < parts.length; i++) {
    const p = {
      type: 'Feature',
      properties: { ...f.properties, id: `${f.properties.id}:${i}` },
      geometry: { type: 'Polygon', coordinates: parts[i] },
    };
    if (booleanIntersects(p, boundary)) features.push(p);
  }
}
await fs.writeFile(
  'public/data/buildings.geojson',
  JSON.stringify({ type: 'FeatureCollection', features }),
);
const m = JSON.parse(await fs.readFile('public/data/manifest.json', 'utf8'));
m.mapFeatures.buildings = features.length;
m.mapFeatures.method +=
  ' Merged multipolygons split into individual footprint polygons, then filtered against municipal boundary; IDs are snapshot-specific, not cadastral IDs.';
await fs.writeFile('public/data/manifest.json', JSON.stringify(m, null, 2));
console.log('Footprints:', features.length);
