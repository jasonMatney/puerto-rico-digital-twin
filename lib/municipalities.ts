export const municipalities = {
  'toa-baja': {
    slug: 'toa-baja',
    name: 'Toa Baja',
    geoid: '72137',
    pilot: '01',
    dataPath: '/data',
    center: [-66.205, 18.442] as [number, number],
    zoom: 12.65,
    shelterIds: Array.from({ length: 12 }, (_, i) => `shelter-${i + 1}`),
  },
  catano: {
    slug: 'catano',
    name: 'Cataño',
    geoid: '72033',
    pilot: '02',
    dataPath: '/data/catano',
    center: [-66.14, 18.44] as [number, number],
    zoom: 13.5,
    shelterIds: ['catano-shelter-1', 'catano-shelter-2'],
  },
};
export type Municipio = keyof typeof municipalities;
export function isMunicipio(s: string): s is Municipio {
  return Object.hasOwn(municipalities, s);
}
export function requestMunicipio(request: Request): Municipio {
  const value =
    new URL(request.url).searchParams.get('municipio') || 'toa-baja';
  if (!isMunicipio(value)) throw new Error('Unknown municipality');
  return value;
}
// Preserve existing Toa Baja owner keys. Other workspaces use an unambiguous tuple.
export function scopedOwner(request: Request) {
  const owner = request.headers.get('oai-authenticated-user-id');
  if (!owner) return null;
  const municipio = requestMunicipio(request);
  return municipio === 'toa-baja' ? owner : JSON.stringify([owner, municipio]);
}
