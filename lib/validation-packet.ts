import type { Facility } from '@/app/facilities';
import type { SavedVerification } from './verification';
export function packetRows(
  facilities: Facility[],
  reviews: SavedVerification[],
  exportedAt: string,
): (string | number)[][] {
  const header = [
    'id_refugio',
    'fecha_exportacion_utc',
    'nombre_en_mapa',
    'latitud_en_mapa',
    'longitud_en_mapa',
    'fecha_fuentes',
    'fuentes_urls',
    'notas_del_mapa',
    'estado_en_mapa',
    'estado_fecha_observacion',
    'capacidad_en_mapa',
    'ultima_revision_guardada_utc',
    'revision_fecha_observacion',
    'revision_revisor',
    'revision_fuente',
    'revision_preguntas',
    'evidencia_pendiente',
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
  return [
    header,
    ...facilities
      .filter((f) => f.properties.kind === 'shelter')
      .sort((a, b) => a.properties.name.localeCompare(b.properties.name, 'es'))
      .map((f) => {
        const p = f.properties,
          r = reviews
            .filter((r) => r.shelterId === p.id)
            .sort(
              (a, b) =>
                b.createdAt.localeCompare(a.createdAt) ||
                b.id.localeCompare(a.id),
            )[0];
        return [
          p.id,
          exportedAt,
          p.name,
          f.geometry.coordinates[1],
          f.geometry.coordinates[0],
          p.vintage,
          p.sources.map((s) => s.url).join(' | '),
          p.note,
          p.operatingStatus,
          p.statusAsOf || '',
          p.capacity ?? '',
          r?.createdAt || '',
          r?.asOf || '',
          r?.reviewer || '',
          r?.sourceUrl || '',
          r?.questions || '',
          [
            !r ? 'Revisión fechada con fuente' : '',
            r?.nameCheck !== 'confirmed' ? 'Confirmar nombre' : '',
            r?.locationCheck !== 'confirmed' ? 'Confirmar ubicación' : '',
            !r || r.operatingStatus === 'unknown'
              ? 'Estado operativo fechado'
              : '',
            !r || r.capacity === null ? 'Capacidad documentada' : '',
            r?.questions ? 'Resolver preguntas guardadas' : '',
          ]
            .filter(Boolean)
            .join(' | '),
          ...Array(12).fill(''),
        ];
      }),
  ];
}
export function packetCsv(rows: (string | number)[][]): string {
  // Keep numeric coordinates numeric, but neutralize spreadsheet formulas in text.
  const cell = (value: string | number) => {
    let s = String(value);
    if (typeof value === 'string' && /^[\s]*[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  return (
    '\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n'
  );
}
