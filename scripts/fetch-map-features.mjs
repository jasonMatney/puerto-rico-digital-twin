const dataDir = process.env.DATA_DIR || 'public/data';
import fs from 'node:fs/promises';
import { VectorTile } from '@mapbox/vector-tile';
import { PbfReader as Pbf } from 'pbf';
import booleanIntersects from '@turf/boolean-intersects';
import union from '@turf/union';
const manifest = JSON.parse(
  await fs.readFile(dataDir + '/manifest.json', 'utf8'),
);
const boundary = JSON.parse(
  await fs.readFile(dataDir + '/boundary.geojson', 'utf8'),
).features[0];
const tj = await (await fetch('https://tiles.openfreemap.org/planet')).json();
const template = tj.tiles[0];
const z = 14,
  n = 2 ** z,
  b = manifest.bbox;
const tx = (x) => Math.floor(((x + 180) / 360) * n),
  ty = (y) =>
    Math.floor(
      ((1 - Math.asinh(Math.tan((y * Math.PI) / 180)) / Math.PI) / 2) * n,
    );
const jobs = [];
for (let x = tx(b[0]); x <= tx(b[2]); x++)
  for (let y = ty(b[3]); y <= ty(b[1]); y++) jobs.push([x, y]);
const buildings = new Map();
const roads = [];
let cursor = 0;
async function worker() {
  while (cursor < jobs.length) {
    const [x, y] = jobs[cursor++];
    const r = await fetch(
      template.replace('{z}', z).replace('{x}', x).replace('{y}', y),
    );
    if (!r.ok) throw new Error('Tile fetch ' + r.status);
    const tile = new VectorTile(new Pbf(new Uint8Array(await r.arrayBuffer())));
    for (const name of ['building', 'transportation']) {
      const layer = tile.layers[name];
      if (!layer) continue;
      for (let i = 0; i < layer.length; i++) {
        const v = layer.feature(i);
        const f = v.toGeoJSON(x, y, z);
        if (!booleanIntersects(f, boundary)) continue;
        if (name === 'building') {
          if (!['Polygon', 'MultiPolygon'].includes(f.geometry.type)) continue;
          const key = v.id !== undefined ? String(v.id) : `${x}/${y}/${i}`;
          f.properties = {
            ...f.properties,
            id: key,
            source: 'OpenFreeMap / OpenStreetMap',
            heightStatus: 'Rendering height; not survey verified',
          };
          if (buildings.has(key)) {
            const old = buildings.get(key);
            const merged = union({
              type: 'FeatureCollection',
              features: [old, f],
            });
            if (merged) {
              merged.properties = f.properties;
              buildings.set(key, merged);
            }
          } else buildings.set(key, f);
        } else if (
          [
            'motorway',
            'trunk',
            'primary',
            'secondary',
            'tertiary',
            'minor',
            'service',
          ].includes(f.properties.class)
        ) {
          f.properties = {
            ...f.properties,
            id: `${z}/${x}/${y}/${i}`,
            source: 'OpenFreeMap / OpenStreetMap',
          };
          roads.push(f);
        }
      }
    }
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
await fs.writeFile(
  dataDir + '/buildings.geojson',
  JSON.stringify({
    type: 'FeatureCollection',
    features: [...buildings.values()],
  }),
);
await fs.writeFile(
  dataDir + '/roads.geojson',
  JSON.stringify({ type: 'FeatureCollection', features: roads }),
);
manifest.mapFeatures = {
  tilejson: 'https://tiles.openfreemap.org/planet',
  tileTemplate: template,
  retrievedAt: new Date().toISOString(),
  zoom: z,
  tiles: jobs.length,
  buildings: buildings.size,
  roadSegments: roads.length,
  license: '© OpenStreetMap contributors, ODbL 1.0',
  method:
    'Building geometries intersecting Census boundary; same vector feature IDs unioned across tiles. Roads are tile segments, not unique roads. Coverage and rendering heights are not survey verified.',
};
await fs.writeFile(
  dataDir + '/manifest.json',
  JSON.stringify(manifest, null, 2),
);
console.log(manifest.mapFeatures);
