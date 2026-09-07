export type Verification = {
  shelterId: string;
  reviewer: string;
  asOf: string;
  nameCheck: 'unconfirmed' | 'confirmed' | 'discrepancy';
  locationCheck: 'unconfirmed' | 'confirmed' | 'discrepancy';
  proposedName: string;
  latitude: number | null;
  longitude: number | null;
  operatingStatus: 'unknown' | 'open' | 'closed' | 'standby';
  capacity: number | null;
  sourceTitle: string;
  sourceUrl: string;
  questions: string;
};
export type SavedVerification = Verification & {
  id: string;
  createdAt: string;
};
export function validateVerification(input: unknown): Verification {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Invalid review');
  const v = input as Record<string, unknown>;
  const text = (key: string, max: number, required = false) => {
    const x = v[key];
    if (typeof x !== 'string' || x.length > max || (required && !x.trim()))
      throw new Error(`Invalid ${key}`);
    return x.trim();
  };
  const choice = <T extends string>(key: string, values: readonly T[]) => {
    if (!values.includes(v[key] as T)) throw new Error(`Invalid ${key}`);
    return v[key] as T;
  };
  const shelterId = text('shelterId', 30, true);
  if (!/^shelter-([1-9]|1[0-2])$/.test(shelterId))
    throw new Error('Unknown shelter');
  const asOf = text('asOf', 10, true);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(asOf) ||
    !Number.isFinite(Date.parse(asOf)) ||
    new Date(asOf).toISOString().slice(0, 10) !== asOf ||
    asOf > new Date().toISOString().slice(0, 10)
  )
    throw new Error('Use a valid observation date, not a future date');
  const numeric = (key: string, min: number, max: number, integer = false) => {
    const x = v[key];
    if (x === null) return null;
    if (
      typeof x !== 'number' ||
      !Number.isFinite(x) ||
      x < min ||
      x > max ||
      (integer && !Number.isInteger(x))
    )
      throw new Error(`Invalid ${key}`);
    return x;
  };
  const latitude = numeric('latitude', -90, 90),
    longitude = numeric('longitude', -180, 180);
  if ((latitude === null) !== (longitude === null))
    throw new Error('Provide both coordinates or neither');
  const sourceUrl = text('sourceUrl', 2000, true);
  try {
    const u = new URL(sourceUrl);
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password)
      throw new Error();
  } catch {
    throw new Error('Use an http or https source link without credentials');
  }
  return {
    shelterId,
    reviewer: text('reviewer', 120, true),
    asOf,
    nameCheck: choice('nameCheck', ['unconfirmed', 'confirmed', 'discrepancy']),
    locationCheck: choice('locationCheck', [
      'unconfirmed',
      'confirmed',
      'discrepancy',
    ]),
    proposedName: text('proposedName', 200),
    latitude,
    longitude,
    operatingStatus: choice('operatingStatus', [
      'unknown',
      'open',
      'closed',
      'standby',
    ]),
    capacity: numeric('capacity', 0, 1000000, true),
    sourceTitle: text('sourceTitle', 240, true),
    sourceUrl,
    questions: text('questions', 4000),
  };
}
