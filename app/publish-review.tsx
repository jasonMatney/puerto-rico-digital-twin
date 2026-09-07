'use client';
import { useState } from 'react';
import type { Facility } from './facilities';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
type Preview = {
  before: Facility;
  after: Facility;
  expectedRevision: string;
  alreadyPublished: boolean;
  history: { id: string; created_at: string; before: string; after: string }[];
};
export function PublishReview({
  reviewId,
  lang,
}: {
  reviewId: string;
  lang: 'en' | 'es';
}) {
  const es = lang === 'es',
    [preview, setPreview] = useState<Preview | null>(null),
    [approved, setApproved] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function load() {
    setBusy(true);
    setError('');
    setApproved(false);
    try {
      const r = await fetch(
        '/api/publications?reviewId=' + encodeURIComponent(reviewId),
      );
      const d = (await r.json()) as Preview & { error?: string };
      if (!r.ok) throw new Error(d.error);
      setPreview(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    if (!preview || !approved) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          expectedRevision: preview.expectedRevision,
          expectedBefore: JSON.stringify(preview.before),
          confirm: true,
        }),
      });
      const d = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(d.error);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publication failed');
      setApproved(false);
    } finally {
      setBusy(false);
    }
  }
  const values = (f: Facility) => [
    f.properties.name,
    f.geometry.coordinates.slice().reverse().join(', '),
    f.properties.operatingStatus,
    f.properties.capacity ?? (es ? 'Desconocida' : 'Unknown'),
    f.properties.statusAsOf || '—',
    f.properties.note,
  ];
  return (
    <section className="publication-preview">
      <Button variant="outline" disabled={busy} onClick={load}>
        {es
          ? 'Revisar cambios para publicar'
          : 'Review changes for publication'}
      </Button>
      {error && <p role="alert">{error}</p>}
      {preview && (
        <>
          <h4>
            {es ? 'Registro actual → propuesta' : 'Current record → proposal'}
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{es ? 'Campo' : 'Field'}</TableHead>
                <TableHead>{es ? 'Actual' : 'Current'}</TableHead>
                <TableHead>{es ? 'Propuesto' : 'Proposed'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                es ? 'Nombre' : 'Name',
                es ? 'Latitud, longitud' : 'Latitude, longitude',
                es ? 'Estado según fuente' : 'Source-reported status',
                es ? 'Capacidad' : 'Capacity',
                es ? 'Fecha de observación' : 'Observation date',
                es ? 'Notas' : 'Notes',
              ].map((label, i) => (
                <TableRow key={label}>
                  <TableCell>{label}</TableCell>
                  <TableCell>{values(preview.before)[i]}</TableCell>
                  <TableCell>{values(preview.after)[i]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="small">
            {es
              ? 'Esta aprobación aplica a su mapa privado y no equivale a confirmación municipal. Un cambio de coordenadas recalcula la exposición puntual y las vías dentro de 500 m. Las revisiones anteriores se conservan.'
              : 'Approval updates your private map; it is not municipal confirmation. Coordinate changes recalculate point exposure and roads within 500 m. Previous revisions are retained.'}
          </p>
          {preview.alreadyPublished ? (
            <p>
              {es
                ? 'Esta revisión ya fue publicada.'
                : 'This review has already been published.'}
            </p>
          ) : (
            <>
              <label className="publication-approval">
                <Checkbox
                  checked={approved}
                  onCheckedChange={setApproved}
                  disabled={busy}
                />
                {es
                  ? 'Revisé los cambios y apruebo aplicarlos a mi mapa.'
                  : 'I reviewed these changes and approve applying them to my map.'}
              </label>
              <Button disabled={!approved || busy} onClick={publish}>
                {busy
                  ? es
                    ? 'Publicando…'
                    : 'Publishing…'
                  : es
                    ? 'Aprobar y publicar en mi mapa'
                    : 'Approve and publish to my map'}
              </Button>
            </>
          )}
          <h4>{es ? 'Historial de publicaciones' : 'Publication history'}</h4>
          {!preview.history.length ? (
            <p>
              {es ? 'Sin publicaciones previas.' : 'No previous publications.'}
            </p>
          ) : (
            preview.history.map((h) => (
              <details key={h.id}>
                <summary>{new Date(h.created_at).toLocaleString(lang)}</summary>
                <p>
                  {JSON.parse(h.before).properties.name} →{' '}
                  {JSON.parse(h.after).properties.name}
                </p>
                <p>{JSON.parse(h.after).properties.reviewedBy}</p>
                <pre>
                  {JSON.stringify(
                    {
                      before: JSON.parse(h.before),
                      after: JSON.parse(h.after),
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            ))
          )}
        </>
      )}
    </section>
  );
}
