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
// Anonymous browser workspaces never reuse private account-owned records.
export function scopedOwner(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const token = cookie
    .split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith('prdt-demo-session='))
    ?.slice('prdt-demo-session='.length);
  if (
    !token ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      token,
    )
  )
    return null;
  return JSON.stringify(['anonymous-demo', token, requestMunicipio(request)]);
}
