'use client';
import { useState } from 'react';
import type { FeatureCollection } from 'geojson';
import type { Facility } from './facilities';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export function ShelterComparison({
  facilities,
  accessData,
  accessError,
  ready,
  lang,
  onSelect,
}: {
  facilities: Facility[];
  accessData: FeatureCollection | null;
  accessError: boolean;
  ready: boolean;
  lang: 'en' | 'es';
  onSelect: (f: Facility) => void;
}) {
  const [open, setOpen] = useState(false),
    es = lang === 'es';
  const shelters = facilities
    .filter((f) => f.properties.kind === 'shelter')
    .sort((a, b) => a.properties.name.localeCompare(b.properties.name, 'es'));
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {es
          ? `Comparar ${shelters.length} refugios`
          : `Compare ${shelters.length} shelters`}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="shelter-comparison">
          <DialogTitle>
            {es ? 'Comparación de refugios' : 'Shelter comparison'}
          </DialogTitle>
          <DialogDescription>
            {es
              ? 'Refugios designados en 2026, en orden alfabético. Seleccione un nombre para abrir el mapa y la evaluación de acceso.'
              : '2026 designated shelters, in alphabetical order. Select a name to open the map and access screening.'}
          </DialogDescription>
          <p className="comparison-notice">
            {es
              ? 'Estado según fuente o sin confirmar; consulte la fecha. Esta comparación no clasifica seguridad ni disponibilidad.'
              : 'Status is source-reported or unconfirmed; check the observation date. This comparison does not rank safety or availability.'}
          </p>
          {!facilities.length ? (
            <p role="status">
              {es ? 'Cargando refugios…' : 'Loading shelters…'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {es ? 'Refugio / estado' : 'Shelter / status'}
                  </TableHead>
                  <TableHead>
                    {es ? 'Zona FEMA en el punto' : 'FEMA zone at point'}
                  </TableHead>
                  <TableHead>{es ? 'Vías: 1%' : 'Roads: 1%'}</TableHead>
                  <TableHead>
                    {es ? 'Vías: 1% + 0.2%' : 'Roads: 1% + 0.2%'}
                  </TableHead>
                  <TableHead>
                    {es
                      ? 'Fuentes / revisión de ubicación'
                      : 'Sources / location review'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shelters.map((f) => {
                  const p = f.properties,
                    roads =
                      accessData?.features.filter(
                        (r) =>
                          r.properties?.kind === 'road' &&
                          r.properties?.shelterId === p.id,
                      ) || [];
                  const high = roads.filter(
                      (r) => r.properties?.exposureHigh,
                    ).length,
                    extended = roads.filter(
                      (r) =>
                        r.properties?.exposureHigh ||
                        r.properties?.exposureModerate,
                    ).length;
                  const count = (n: number) =>
                    accessError
                      ? es
                        ? 'No disponible'
                        : 'Unavailable'
                      : !accessData
                        ? es
                          ? 'Cargando…'
                          : 'Loading…'
                        : !roads.length
                          ? es
                            ? 'Sin datos viales'
                            : 'No road data'
                          : `${n} / ${roads.length}`;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Button
                          variant="link"
                          disabled={!ready}
                          onClick={() => {
                            onSelect(f);
                            setOpen(false);
                          }}
                        >
                          {p.name}
                        </Button>
                        <span className="comparison-status">
                          {es
                            ? `Estado: ${p.operatingStatus}`
                            : `Status: ${p.operatingStatus}`}
                          {p.statusAsOf && ` · ${p.statusAsOf}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        {p.zoneLabels ||
                          (es
                            ? 'Sin zona en esta muestra'
                            : 'No zone in this snapshot')}
                      </TableCell>
                      <TableCell>{count(high)}</TableCell>
                      <TableCell>{count(extended)}</TableCell>
                      <TableCell>
                        <span>{p.vintage}</span>
                        <details>
                          <summary>
                            {es
                              ? 'Ver notas y fuentes'
                              : 'Review notes & sources'}
                          </summary>
                          <p>{p.note}</p>
                          <p>
                            {es
                              ? 'Notas de revisión en inglés; sin verificación de campo.'
                              : 'No field verification.'}
                          </p>
                          {p.sources.map((source) => (
                            <a
                              key={source.url}
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {source.label} ↗
                            </a>
                          ))}
                        </details>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <p className="small">
            {es
              ? 'Vías: registros que intersectan las zonas / registros presentes dentro de 500 m. Se evalúan solo las porciones recortadas al radio. Un registro puede incluir varios tramos. Cero intersecciones no implica seguridad; no se evalúan rutas, cierres ni conectividad.'
              : 'Roads: intersecting records / records present within 500 m. Only portions clipped to that radius are assessed. One record may contain several sections. Zero intersections does not establish safety; routes, closures and connectivity are not assessed.'}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
