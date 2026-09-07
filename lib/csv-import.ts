import { validateVerification, type Verification } from './verification.ts';
export const responseHeaders = [
  'nombre_confirmado_respuesta',
  'nombre_confirmacion_si_no_pendiente',
  'latitud_confirmada_respuesta',
  'longitud_confirmada_respuesta',
  'ubicacion_confirmacion_si_no_pendiente',
  'estado_abierto_cerrado_espera_desconocido',
  'capacidad_personas_respuesta',
  'fecha_observacion_respuesta',
  'revisor_organizacion_respuesta',
  'evidencia_titulo_respuesta',
  'evidencia_url_respuesta',
  'preguntas_pendientes_respuesta',
];
export function parseCsv(input: string): string[][] {
  if (input.length > 524288) throw new Error('CSV exceeds 512 KB.');
  const text = input.replace(/^\uFEFF/, ''),
    rows: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false,
    closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += c;
      continue;
    }
    if (c === '"') {
      if (cell || closed) throw new Error('Invalid quote in CSV.');
      quoted = true;
      continue;
    }
    if (c === ',' || c === '\n' || c === '\r') {
      row.push(cell);
      cell = '';
      closed = false;
      if (c !== ',') {
        if (row.some((v) => v !== '')) rows.push(row);
        row = [];
        if (c === '\r' && text[i + 1] === '\n') i++;
      }
      continue;
    }
    if (closed) throw new Error('Unexpected text after a quoted field.');
    cell += c;
  }
  if (quoted) throw new Error('Unclosed quoted field.');
  row.push(cell);
  if (row.some((v) => v !== '')) rows.push(row);
  if (rows.length > 13) throw new Error('Use at most 12 shelter rows.');
  return rows;
}
export type ImportPreview = {
  reviews: { row: number; review: Verification }[];
  errors: { row: number; message: string }[];
  skipped: number;
  sample: boolean;
};
export function previewImport(csv: string): ImportPreview {
  const rows = parseCsv(csv);
  if (!rows.length) throw new Error('CSV is empty.');
  const header = rows[0].map((s) => s.trim());
  if (new Set(header).size !== header.length)
    throw new Error('Duplicate column headers.');
  for (const h of ['id_refugio', ...responseHeaders])
    if (!header.includes(h)) throw new Error('Missing column: ' + h);
  const result: ImportPreview = {
      reviews: [],
      errors: [],
      skipped: 0,
      sample: false,
    },
    seen = new Set<string>();
  rows.slice(1).forEach((cells, i) => {
    const row = i + 2;
    try {
      if (cells.length !== header.length)
        throw new Error('Column count does not match header.');
      const get = (h: string) => cells[header.indexOf(h)].trim(),
        id = get('id_refugio');
      if (!/^shelter-([1-9]|1[0-2])$/.test(id))
        throw new Error('Unknown shelter ID: ' + id);
      if (seen.has(id)) throw new Error('Duplicate shelter ID: ' + id);
      seen.add(id);
      if (responseHeaders.every((h) => !get(h))) {
        result.skipped++;
        return;
      }
      const choice = (
        h: string,
        options: Record<string, string>,
        fallback: string,
      ) => {
        const s = get(h).toLowerCase();
        if (!s) return fallback;
        if (!options[s]) throw new Error('Invalid value in ' + h);
        return options[s];
      };
      const numeric = (h: string) => {
        const s = get(h);
        if (!s) return null;
        if (!/^-?\d+(\.\d+)?$/.test(s))
          throw new Error('Use a decimal number in ' + h);
        return Number(s);
      };
      const confirmation = {
        si: 'confirmed',
        sí: 'confirmed',
        no: 'discrepancy',
        pendiente: 'unconfirmed',
      };
      const review = validateVerification({
        shelterId: id,
        proposedName: get(responseHeaders[0]),
        nameCheck: choice(responseHeaders[1], confirmation, 'unconfirmed'),
        latitude: numeric(responseHeaders[2]),
        longitude: numeric(responseHeaders[3]),
        locationCheck: choice(responseHeaders[4], confirmation, 'unconfirmed'),
        operatingStatus: choice(
          responseHeaders[5],
          {
            abierto: 'open',
            cerrado: 'closed',
            espera: 'standby',
            desconocido: 'unknown',
          },
          'unknown',
        ),
        capacity: numeric(responseHeaders[6]),
        asOf: get(responseHeaders[7]),
        reviewer: get(responseHeaders[8]),
        sourceTitle: get(responseHeaders[9]),
        sourceUrl: get(responseHeaders[10]),
        questions: get(responseHeaders[11]),
      });
      if (/^SAMPLE\b/i.test(review.reviewer)) result.sample = true;
      result.reviews.push({ row, review });
    } catch (e) {
      result.errors.push({
        row,
        message: e instanceof Error ? e.message : 'Invalid row',
      });
    }
  });
  return result;
}
