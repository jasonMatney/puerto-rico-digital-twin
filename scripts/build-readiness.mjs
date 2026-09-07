import fs from 'node:fs/promises';
const result = {};
for (const [slug, path] of [
  ['toa-baja', 'public/data'],
  ['catano', 'public/data/catano'],
]) {
  const fc = JSON.parse(
    await fs.readFile(path + '/facilities.geojson', 'utf8'),
  );
  const summary = JSON.parse(await fs.readFile(path + '/summary.json', 'utf8'));
  const counts = Object.fromEntries(
    ['shelter', 'police', 'fire', 'health', 'siren'].map((k) => [
      k,
      fc.features.filter((f) => f.properties.kind === k).length,
    ]),
  );
  result[slug] = {
    asOf: '2026-09-07',
    counts,
    total: fc.features.length,
    buildings: summary.buildings.total,
    roads: summary.roads.total,
    basis:
      slug === 'catano'
        ? [
            'PRDOH 2026 shelters; linked map coordinates',
            'OpenStreetMap facility locations; not field verified',
          ]
        : [
            'PRDOH 2026 shelters; 2025 municipal GIS',
            'Other facilities: historical mitigation-plan inventory',
          ],
    basisEs:
      slug === 'catano'
        ? [
            'Refugios PRDOH 2026; coordenadas de mapas enlazados',
            'Instalaciones OpenStreetMap; sin verificar en campo',
          ]
        : [
            'Refugios PRDOH 2026; SIG municipal 2025',
            'Otras instalaciones: inventario histórico del plan de mitigación',
          ],
    gaps:
      slug === 'catano'
        ? [
            'Siren coordinates not substantiated; inventory unknown',
            'State police location not established',
            'Fire-station address differs between sources',
            'Health records may be outdated; names and use need confirmation',
          ]
        : [
            'Historical facility locations need reconfirmation',
            'Siren functionality is historical, not live',
          ],
    gapsEs:
      slug === 'catano'
        ? [
            'Coordenadas de sirenas sin sustentar; inventario desconocido',
            'Ubicación de policía estatal sin establecer',
            'Dirección de bomberos difiere entre fuentes',
            'Salud: confirmar vigencia, nombres y uso',
          ]
        : [
            'Reconfirmar ubicaciones históricas de instalaciones',
            'Funcionamiento de sirenas histórico, no en vivo',
          ],
  };
}
await fs.writeFile(
  'public/data/readiness.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log('Readiness summaries derived from both source inventories.');
