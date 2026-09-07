'use client';
import type { Feature, Point } from 'geojson';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
export type Facility = Feature<
  Point,
  {
    id: string;
    name: string;
    kind: string;
    sources: { label: string; url: string }[];
    vintage: string;
    note: string;
    designationYear: number | null;
    operatingStatus: string;
    capacity?: number | null;
    statusAsOf?: string;
    reviewedBy?: string;
    reviewedAt: string;
    exposureHigh: boolean;
    exposureModerate: boolean;
    zoneLabels: string;
  }
>;
export const categories = {
  all: ['All facilities', 'Todas'],
  shelter: ['Shelters', 'Refugios'],
  siren: ['Sirens', 'Sirenas'],
  police: ['Police', 'Policía'],
  fire: ['Fire', 'Bomberos'],
  health: ['Health', 'Salud'],
};
export function FacilityList({
  items,
  lang,
  category,
  onCategory,
  onSelect,
  ready,
  view,
}: {
  items: Facility[];
  lang: 'en' | 'es';
  category: string;
  onCategory: (v: string) => void;
  onSelect: (f: Facility) => void;
  ready: boolean;
  view: string;
}) {
  const es = lang === 'es',
    visible = items.filter(
      (f) => category === 'all' || f.properties.kind === category,
    );
  const exposed = visible.filter(
    (f) =>
      f.properties.exposureHigh ||
      (view === 'extended' && f.properties.exposureModerate),
  ).length;
  return (
    <div className="facility-inventory">
      <h3>{es ? 'Infraestructura esencial' : 'Essential facilities'}</h3>
      <p className="small">
        {es
          ? '31 ubicaciones documentadas · 12 refugios designados en 2026. Estado operativo según fuente o sin confirmar.'
          : '31 documented locations · 12 designated 2026 shelters. Operating status is source-reported or unconfirmed.'}
      </p>
      <p className="small">
        {es
          ? 'Seleccione un refugio para evaluar vías dentro de 500 m.'
          : 'Select a shelter to screen roads within 500 m.'}
      </p>
      <Select
        value={category}
        onValueChange={(v) => v && onCategory(v)}
        items={Object.fromEntries(
          Object.entries(categories).map(([k, v]) => [k, v[es ? 1 : 0]]),
        )}
      >
        <SelectTrigger
          aria-label={es ? 'Tipo de instalación' : 'Facility type'}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(categories).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {v[es ? 1 : 0]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="small" aria-live="polite">
        {visible.length} {es ? 'ubicaciones' : 'locations'}
        {view !== 'none' &&
          ` · ${exposed} ${es ? 'en zonas seleccionadas' : 'in selected zones'}`}
      </p>
      <div className="facility-list">
        {visible.map((f) => (
          <Button
            key={f.properties.id}
            variant="ghost"
            disabled={!ready}
            onClick={() => onSelect(f)}
          >
            <span className={`facility-dot ${f.properties.kind}`} />
            <span>
              {f.properties.name}
              <small>
                {f.properties.designationYear
                  ? 'PRDOH 2026'
                  : f.properties.vintage}
              </small>
            </span>
          </Button>
        ))}
      </div>
      <p className="small">
        {es
          ? 'Los anillos naranjas indican puntos en zonas seleccionadas. La exposición corresponde al punto, no al edificio completo ni al acceso.'
          : 'Orange rings mark points in selected flood zones. Exposure describes the point, not the whole building or access.'}
      </p>
      <a className="small" href="/data/facilities.geojson" download>
        {es
          ? 'Descargar inventario original'
          : 'Download original source inventory'}{' '}
        ↗
      </a>
    </div>
  );
}
export function FacilityDetails({
  facility,
  lang,
}: {
  facility: Facility;
  lang: 'en' | 'es';
}) {
  const p = facility.properties,
    es = lang === 'es';
  return (
    <>
      <h3>{p.name}</h3>
      <p className="facility-status">
        {es
          ? `Estado: ${p.operatingStatus}${p.statusAsOf ? ' · ' + p.statusAsOf : ''}`
          : `Source-reported status: ${p.operatingStatus}${p.statusAsOf ? ' · ' + p.statusAsOf : ''}`}
      </p>
      <p className="small">
        {p.reviewedBy && `${p.reviewedBy} · `}
        {p.capacity !== undefined &&
          `${lang === 'es' ? 'Capacidad' : 'Capacity'}: ${p.capacity ?? 'Unknown'}`}
      </p>
      <dl>
        <dt>{es ? 'Zona FEMA en el punto' : 'FEMA zone at point'}</dt>
        <dd>
          {p.zoneLabels ||
            (es
              ? 'Sin zona cartografiada en esta muestra; no implica seguridad.'
              : 'No mapped zone in this snapshot; does not establish safety.')}
        </dd>
        <dt>{es ? 'Fecha de los datos' : 'Source vintage'}</dt>
        <dd>{p.vintage}</dd>
      </dl>
      <p className="small">{p.note}</p>
      <p className="small">
        {es
          ? 'Notas de revisión en el idioma de la fuente. No indica disponibilidad, capacidad ni acceso seguro.'
          : 'Source review does not establish availability, capacity or safe access.'}
      </p>
      <div className="facility-sources">
        {p.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
            {s.label} ↗
          </a>
        ))}
      </div>
    </>
  );
}
