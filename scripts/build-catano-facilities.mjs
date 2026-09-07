import fs from 'node:fs/promises';
import pointInPolygon from '@turf/boolean-point-in-polygon';
const dir = 'public/data/catano';
const flood = JSON.parse(await fs.readFile(dir + '/flood.geojson', 'utf8'));
const boundary = JSON.parse(
  await fs.readFile(dir + '/boundary.geojson', 'utf8'),
);
const official =
  'https://docs.pr.gov/files/Vivienda/vivienda.pr.gov/Home/DVAVP_Refugios_Temporada_de_Huracanes_2026.pdf';
// Coordinates are place coordinates in redirects from links in the official 2026 list,
// retrieved September 7, 2026; not map viewport centers and not field verified.
const records = [
  [
    'catano-shelter-1',
    'Esc. Mercedes García de Colorado',
    -66.1476264,
    18.4352633,
    'https://maps.app.goo.gl/CW2CFNevhW6zEqJm7',
  ],
  [
    'catano-shelter-2',
    'Esc. Isaac del Rosario',
    -66.1444168,
    18.4297046,
    'https://maps.app.goo.gl/iwqkcgJSVi5akwNv7',
  ],
];
const features = records.map(([id, name, lon, lat, url]) => {
  const f = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: {
      id,
      name,
      kind: 'shelter',
      sources: [
        { label: 'PRDOH / AVP · 2026 designated shelters', url: official },
        { label: 'Location linked by PRDOH (not field verified)', url },
      ],
      vintage: '2026 designation / linked map coordinates accessed 2026-09-07',
      note: 'Coordinates from the place linked in the PRDOH 2026 list; not field verified. Name, location, current operation and capacity require confirmation.',
      designationYear: 2026,
      operatingStatus: 'unconfirmed',
      capacity: null,
      reviewedAt: '2026-09-07',
    },
  };
  if (!boundary.features.some((b) => pointInPolygon(f, b)))
    throw Error('Shelter outside municipality: ' + id);
  const zones = flood.features.filter((z) => pointInPolygon(f, z));
  Object.assign(f.properties, {
    exposureHigh: zones.some((z) => z.properties.SFHA_TF === 'T'),
    exposureModerate: zones.some((z) =>
      String(z.properties.ZONE_SUBTY).includes('0.2 PCT'),
    ),
    zoneLabels: zones.map((z) => z.properties.FLD_ZONE).join(', '),
  });
  return f;
});
const community = JSON.parse(
  await fs.readFile('data/facilities/catano-community-snapshot.json', 'utf8'),
);
for (const r of community.records) {
  const f = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: r.coordinates },
    properties: {
      id: r.id,
      name: r.name,
      kind: r.kind,
      sources: [
        { label: 'OpenStreetMap · community mapping (ODbL)', url: r.sourceUrl },
      ],
      vintage: `OSM version ${r.osmVersion}, edited ${r.osmTimestamp.slice(0, 10)} / retrieved 2026-09-07`,
      note: `${r.coordinateMethod}; not field verified. Community mapping does not establish current name, use, operation or capacity. ${r.kind === 'fire' ? 'Address discrepancy: the 2019 mitigation plan lists Calle Olivo; OSM lists Calle Hernández. Confirmation required.' : r.id.includes('5150833707') ? 'OSM attributes cite PR Department of Health records from 2009/2015; continued operation and location require confirmation.' : 'Municipal confirmation required.'}`,
      designationYear: null,
      operatingStatus: 'unconfirmed',
      capacity: null,
      reviewedAt: '2026-09-07',
      coordinateMethod: r.coordinateMethod,
    },
  };
  if (!boundary.features.some((b) => pointInPolygon(f, b)))
    throw Error('Community point outside Cataño: ' + r.id);
  const zones = flood.features.filter((z) => pointInPolygon(f, z));
  Object.assign(f.properties, {
    exposureHigh: zones.some((z) => z.properties.SFHA_TF === 'T'),
    exposureModerate: zones.some((z) =>
      String(z.properties.ZONE_SUBTY).includes('0.2 PCT'),
    ),
    zoneLabels: zones.map((z) => z.properties.FLD_ZONE).join(', '),
  });
  features.push(f);
}
await fs.writeFile(
  dir + '/facilities.geojson',
  JSON.stringify({ type: 'FeatureCollection', features }),
);
console.log('Cataño: ' + features.length + ' sourced facility points.');
