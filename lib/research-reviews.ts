import type { Verification } from './verification';
export const researchReviews: Verification[] = [
  {
    shelterId: 'shelter-3',
    reviewer: 'Codex desk review — not municipal confirmation',
    asOf: '2026-09-07',
    nameCheck: 'discrepancy',
    locationCheck: 'unconfirmed',
    proposedName: 'Centro Comunal Rafael “Pipo” Negrón',
    latitude: null,
    longitude: null,
    operatingStatus: 'unknown',
    capacity: null,
    sourceTitle:
      'Toa Baja municipal services page (undated; accessed 2026-09-07)',
    sourceUrl: 'https://toabaja.com/servicios-municipales/',
    questions:
      'Municipal services names Rafael “Pipo” Negrón in Barrio Ingenio. PRDOH’s 2026 shelter PDF p.18 names José “Pipo” Negrón (https://docs.pr.gov/files/Vivienda/vivienda.pr.gov/Home/DVAVP_Refugios_Temporada_de_Huracanes_2026.pdf). This corroborates a proposed name correction, but the cross-agency conflict remains unresolved. Ask the municipality/PRDOH to confirm the official shelter name and identity. No field visit, current operating status, capacity, or new coordinates verified.',
  },
  {
    shelterId: 'shelter-6',
    reviewer: 'Codex desk review — not municipal confirmation',
    asOf: '2026-09-07',
    nameCheck: 'unconfirmed',
    locationCheck: 'unconfirmed',
    proposedName: '',
    latitude: null,
    longitude: null,
    operatingStatus: 'unknown',
    capacity: null,
    sourceTitle:
      'Toa Baja hurricane preparedness page (undated; accessed 2026-09-07)',
    sourceUrl: 'https://toabaja.com/temporada-de-huracanes/',
    questions:
      'The municipal page lists Escuela Pedro Albizu Campos for the northern region; the page is undated and does not validate current coordinates or activation. PRDOH 2026 PDF p.18 lists Dr. Pedro Albizu Campos at Ave. Boulevard, 4ta sección Levittown (https://docs.pr.gov/files/Vivienda/vivienda.pr.gov/Home/DVAVP_Refugios_Temporada_de_Huracanes_2026.pdf). Retain the 2019-inventory / 2024-plan point until municipal GIS or field evidence confirms the shelter building/entrance. No replacement coordinate is proposed; capacity and operation remain unknown.',
  },
];
