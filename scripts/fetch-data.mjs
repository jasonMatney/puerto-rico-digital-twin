import fs from 'node:fs/promises';
const out = new URL('../public/data/', import.meta.url);
const boundaryService =
  'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1';
const floodService =
  'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28';
async function query(url, params) {
  const r = await fetch(url + '/query?' + new URLSearchParams(params));
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const d = await r.json();
  if (d.error) throw new Error(JSON.stringify(d.error));
  return d;
}
const boundary = await query(boundaryService, {
  where: "GEOID='72137'",
  outFields: 'GEOID,NAME,AREALAND,AREAWATER',
  outSR: '4326',
  f: 'geojson',
});
if (boundary.features.length !== 1)
  throw new Error('Expected one municipal boundary');
await fs.writeFile(new URL('boundary.geojson', out), JSON.stringify(boundary));
const coord = boundary.features[0].geometry.coordinates.flat(Infinity);
const xs = coord.filter((_, i) => i % 2 === 0),
  ys = coord.filter((_, i) => i % 2 === 1);
const bbox = [
  Math.min(...xs),
  Math.min(...ys),
  Math.max(...xs),
  Math.max(...ys),
];
const params = {
  geometry: JSON.stringify({
    xmin: bbox[0],
    ymin: bbox[1],
    xmax: bbox[2],
    ymax: bbox[3],
    spatialReference: { wkid: 4326 },
  }),
  geometryType: 'esriGeometryEnvelope',
  inSR: '4326',
  spatialRel: 'esriSpatialRelIntersects',
  where: '1=1',
};
const ids = await query(floodService, {
  ...params,
  returnIdsOnly: 'true',
  f: 'json',
});
let features = [];
for (let i = 0; i < (ids.objectIds || []).length; i += 100) {
  const batch = await query(floodService, {
    objectIds: ids.objectIds.slice(i, i + 100).join(','),
    outFields:
      'OBJECTID,DFIRM_ID,FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,V_DATUM,LEN_UNIT,SOURCE_CIT',
    outSR: '4326',
    geometryPrecision: '6',
    f: 'geojson',
  });
  features.push(...batch.features);
}
if (!features.length) throw new Error('No FEMA flood zones returned');
await fs.writeFile(
  new URL('flood.geojson', out),
  JSON.stringify({ type: 'FeatureCollection', features }),
);
const manifest = {
  retrievedAt: new Date().toISOString(),
  bbox,
  boundary: {
    url: boundaryService,
    count: boundary.features.length,
    properties: boundary.features[0].properties,
  },
  flood: {
    url: floodService,
    count: features.length,
    zones: [...new Set(features.map((f) => f.properties.FLD_ZONE))],
    note: 'FEMA NFHL mapped flood hazard zones intersecting municipal bounding box; not Hurricane Maria observed inundation.',
  },
};
await fs.writeFile(
  new URL('manifest.json', out),
  JSON.stringify(manifest, null, 2),
);
console.log(JSON.stringify(manifest, null, 2));
