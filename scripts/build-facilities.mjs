import fs from 'node:fs/promises';
import pointInPolygon from '@turf/boolean-point-in-polygon';
const read = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));
const municipal =
  'https://services8.arcgis.com/n6by4cEju3ytQLNI/ArcGIS/rest/services/Temporada_de_Huracanes_2025_WFL1/FeatureServer';
const designation =
  'https://docs.pr.gov/files/Vivienda/vivienda.pr.gov/Home/DVAVP_Refugios_Temporada_de_Huracanes_2026.pdf';
const plan =
  'https://www.toabaja.com/wp-content/uploads/2025/03/TBAJ-FinalHMP_Approved_24.04.10-OCE10539_web.pdf';
const shelters = await read('data/facilities/municipal-shelters-2025.geojson');
const sirens = await read('data/facilities/municipal-sirens-2025.geojson');
const flood = await read('public/data/flood.geojson');
const features = [];
function add(
  id,
  name,
  kind,
  coordinates,
  sources,
  vintage,
  note = '',
  year = null,
) {
  const feature = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties: {
      id,
      name,
      kind,
      sources,
      vintage,
      note,
      designationYear: year,
      operatingStatus: 'unconfirmed',
      reviewedAt: '2026-09-07',
    },
  };
  const zones = flood.features.filter((z) => pointInPolygon(feature, z));
  Object.assign(feature.properties, {
    exposureHigh: zones.some((z) => z.properties.SFHA_TF === 'T'),
    exposureModerate: zones.some((z) =>
      String(z.properties.ZONE_SUBTY).includes('0.2 PCT'),
    ),
    zoneLabels: [
      ...new Set(
        zones.map((z) =>
          [z.properties.FLD_ZONE, z.properties.ZONE_SUBTY]
            .filter(Boolean)
            .join(' · '),
        ),
      ),
    ].join('; '),
  });
  features.push(feature);
}
const list = [
  [14, 'Centro Comunal Jesusa Matías'],
  [13, 'Centro Comunal Barrio Pájaros'],
  [12, 'Centro Comunal José "Pipo" Negrón'],
  [8, 'Esc. Altinencia Valle'],
  [10, 'Esc. Delia Dávila de Cabán'],
  [null, 'Esc. Dr. Pedro Albizu Campos'],
  [6, 'Esc. Efraín Sánchez Hidalgo'],
  [3, 'Esc. Ernestina Bracero'],
  [9, 'Esc. José Robles Otero'],
  [7, 'Esc. María J. Corredor Rivera'],
  [1, 'Esc. Martín García Giusti'],
  [2, 'Esc. José Nevárez'],
];
for (const [i, [oid, name]] of list.entries()) {
  const source = shelters.features.find((f) => f.properties.OBJECTID === oid);
  const coords = source?.geometry.coordinates ?? [
    -66.1818901224, 18.4494672453,
  ];
  add(
    `shelter-${i + 1}`,
    name,
    'shelter',
    coords,
    [
      {
        label: `PRDOH 2026 · PDF p. ${i < 2 ? 17 : 18}`,
        url: designation + `#page=${i < 2 ? 17 : 18}`,
      },
      {
        label: oid
          ? `Municipal GIS 2025 · record ${oid}`
          : 'Mitigation plan 2024 · Table 16, printed p.52',
        url: oid ? municipal + '/1/' + oid : plan + '#page=54',
      },
    ],
    oid
      ? '2025 GIS / 2026 designation'
      : '2019 inventory / 2024 plan / 2026 designation',
    oid === 12
      ? 'PRDOH names José; municipal GIS and the PRDOH-linked map name Rafael “Pipo” Negrón. Identity needs municipal confirmation.'
      : !oid
        ? 'Historical coordinate cross-checked with the PRDOH-linked map. The mitigation plan notes location discrepancies in its inventory; current field confirmation is needed.'
        : 'Location cross-checked against the map link in the 2026 designation. No field verification.',
    2026,
  );
}
for (const f of sirens.features)
  add(
    `siren-${f.properties.OBJECTID}`,
    `Sirena · ${f.properties.Comunidad} · ${f.properties.Calle}`,
    'siren',
    f.geometry.coordinates,
    [
      {
        label: `Municipal GIS 2025 · record ${f.properties.OBJECTID}`,
        url: municipal + '/2/' + f.properties.OBJECTID,
      },
    ],
    '2025 GIS',
    `${f.properties.PuntoDeReferencia}. The source reports functioning in its snapshot; current operation is unconfirmed.`,
  );
for (const [id, name, kind, lat, lon] of [
  [
    'police-levittown',
    'Policía Estatal · Levittown',
    'police',
    18.4478393294,
    -66.1809051346,
  ],
  [
    'police-pueblo',
    'Policía Estatal · Pueblo',
    'police',
    18.4400596182,
    -66.2535214391,
  ],
  [
    'police-municipal',
    'Policía Municipal · Toa Baja',
    'police',
    18.4379989917,
    -66.1943283444,
  ],
  [
    'fire-toa-baja',
    'Parque de Bombas Toa Baja',
    'fire',
    18.4401675494,
    -66.2529274144,
  ],
  [
    'health-toa-baja',
    'Toa Baja Health Center',
    'health',
    18.4391405191,
    -66.1948829716,
  ],
])
  add(
    id,
    name,
    kind,
    [lon, lat],
    [
      {
        label: 'Mitigation plan 2024 · Table 16, printed p.52',
        url: plan + '#page=54',
      },
    ],
    '2019 inventory / 2024 plan',
    'Historical inventory. The plan notes location discrepancies; current location and operation need confirmation.',
  );
await fs.writeFile(
  'public/data/facilities.geojson',
  JSON.stringify({ type: 'FeatureCollection', features }, null, 2) + '\n',
);
console.log(
  `Built ${features.length} source-documented facility points; ${features.filter((f) => f.properties.exposureHigh).length} in 1% zones.`,
);
