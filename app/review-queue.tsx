'use client';
import { useEffect, useState } from 'react';
import type { Facility } from './facilities';
import type { SavedVerification } from '@/lib/verification';
import { queueState } from '@/lib/review-queue';
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
export function ReviewQueue({
  facilities,
  lang,
  onSelect,
}: {
  facilities: Facility[];
  lang: 'en' | 'es';
  onSelect: (id: string) => void;
}) {
  const es = lang === 'es',
    [open, setOpen] = useState(false),
    [reviews, setReviews] = useState<SavedVerification[]>([]),
    [published, setPublished] = useState<Set<string>>(new Set()),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [filter, setFilter] = useState('all'),
    [reload, setReload] = useState(0);
  useEffect(() => {
    if (!open) return;
    const c = new AbortController();
    setLoading(true);
    setError('');
    Promise.all(
      ['/api/verifications', '/api/publications'].map((url) =>
        fetch(url, { signal: c.signal }).then(async (r) => {
          if (!r.ok)
            throw new Error(
              es ? 'No se pudo cargar la cola.' : 'The queue could not load.',
            );
          return r.json();
        }),
      ),
    )
      .then(([a, b]) => {
        setReviews((a as { reviews: SavedVerification[] }).reviews);
        setPublished(
          new Set(
            (b as { publications: { review_id: string }[] }).publications.map(
              (p) => p.review_id,
            ),
          ),
        );
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [open, reload, es]);
  const rows = facilities
    .filter((f) => f.properties.kind === 'shelter')
    .map((f) => ({ f, q: queueState(f.properties.id, reviews, published) }))
    .sort(
      (a, b) =>
        Number(b.q.discrepancy) - Number(a.q.discrepancy) ||
        (a.f.properties.id === 'shelter-6'
          ? -1
          : b.f.properties.id === 'shelter-6'
            ? 1
            : 0) ||
        a.f.properties.name.localeCompare(b.f.properties.name, 'es'),
    );
  const options = {
    all: es ? 'Todos los refugios' : 'All shelters',
    unreviewed: es ? 'Sin revisión' : 'No review yet',
    discrepancy: es ? 'Discrepancias' : 'Discrepancies',
    unpublished: es ? 'Revisiones sin publicar' : 'Unpublished reviews',
  };
  const gaps = {
    questions: es
      ? 'Preguntas o notas pendientes de revisión'
      : 'Questions or notes to review',
    review: es ? 'Revisión con evidencia y fecha' : 'Dated evidence review',
    name: es ? 'Confirmación del nombre' : 'Name confirmation',
    location: es ? 'Confirmación de ubicación' : 'Location confirmation',
    status: es ? 'Estado operativo fechado' : 'Dated operating status',
    capacity: es ? 'Capacidad documentada' : 'Documented capacity',
  };
  const actions = {
    followup: es
      ? 'Revisar las preguntas guardadas y documentar su resolución.'
      : 'Review the saved questions and document their resolution.',
    resolve: es
      ? 'Resolver el conflicto con el custodio de la fuente; adjuntar evidencia.'
      : 'Resolve the source conflict with its custodian; attach evidence.',
    collect: es
      ? 'Obtener evidencia actual y guardar la primera revisión.'
      : 'Obtain current evidence and save the first review.',
    location: es
      ? 'Confirmar el nombre y la ubicación con evidencia municipal o de campo.'
      : 'Confirm name and location with municipal or field evidence.',
    status: es
      ? 'Obtener el estado operativo y su fecha de observación.'
      : 'Obtain operating status and its observation date.',
    capacity: es
      ? 'Obtener capacidad respaldada por una fuente fechada.'
      : 'Obtain capacity supported by a dated source.',
    decision: es
      ? 'Revisar los cambios antes de decidir si se publican.'
      : 'Review the changes before deciding whether to publish.',
    monitor: es
      ? 'Mantener las fuentes vigentes; agregar una revisión si cambia la evidencia.'
      : 'Keep evidence current; add a review when it changes.',
  };
  const visible = rows.filter(
    ({ q }) =>
      filter === 'all' ||
      (filter === 'unreviewed' && !q.latest) ||
      (filter === 'discrepancy' && q.discrepancy) ||
      (filter === 'unpublished' && q.unpublished > 0),
  );
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {es ? 'Cola de revisión' : 'Review queue'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="shelter-comparison review-queue">
          <DialogTitle>
            {es ? 'Cola de revisión de refugios' : 'Shelter review queue'}
          </DialogTitle>
          <DialogDescription>
            {es
              ? 'Seguimiento de evidencia para los 12 refugios. Abrir un registro no aprueba ni publica cambios.'
              : 'Evidence follow-up for all 12 shelters. Opening a record does not approve or publish changes.'}
          </DialogDescription>
          {loading ? (
            <p role="status">
              {es ? 'Cargando revisiones…' : 'Loading reviews…'}
            </p>
          ) : error ? (
            <p role="alert">
              {error}{' '}
              <Button variant="outline" onClick={() => setReload((n) => n + 1)}>
                {es ? 'Reintentar' : 'Retry'}
              </Button>
            </p>
          ) : (
            <>
              <p aria-live="polite">
                {rows.filter((r) => !r.q.latest).length}{' '}
                {es ? 'sin revisión' : 'without a review'} ·{' '}
                {rows.filter((r) => r.q.discrepancy).length}{' '}
                {es ? 'con discrepancias' : 'with discrepancies'} ·{' '}
                {rows.reduce((n, r) => n + r.q.unpublished, 0)}{' '}
                {es ? 'revisiones sin publicar' : 'unpublished reviews'}
              </p>
              <Select
                value={filter}
                items={options}
                onValueChange={(v) => v && setFilter(v)}
              >
                <SelectTrigger
                  aria-label={es ? 'Filtrar cola' : 'Filter queue'}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(options).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!visible.length ? (
                <p>
                  {es
                    ? 'Ningún registro coincide con este filtro.'
                    : 'No records match this filter.'}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{es ? 'Refugio' : 'Shelter'}</TableHead>
                      <TableHead>
                        {es
                          ? 'Última revisión guardada'
                          : 'Latest saved review'}
                      </TableHead>
                      <TableHead>
                        {es ? 'Evidencia pendiente' : 'Evidence still needed'}
                      </TableHead>
                      <TableHead>
                        {es ? 'Próxima acción' : 'Next action'}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map(({ f, q }) => (
                      <TableRow key={f.properties.id}>
                        <TableCell>
                          <Button
                            variant="link"
                            disabled={!facilities.length}
                            onClick={() => {
                              setOpen(false);
                              onSelect(f.properties.id);
                            }}
                          >
                            {f.properties.name}
                          </Button>
                          <p>
                            {q.unpublished}{' '}
                            {es ? 'sin publicar' : 'unpublished'}
                          </p>
                        </TableCell>
                        <TableCell>
                          {q.latest ? (
                            <>
                              <p>
                                {q.latest.asOf} · {q.latest.reviewer}
                              </p>
                              <a
                                href={q.latest.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {q.latest.sourceTitle} ↗
                              </a>
                              {q.latest.questions && (
                                <details>
                                  <summary>
                                    {es
                                      ? 'Preguntas guardadas'
                                      : 'Saved questions'}
                                  </summary>
                                  <p>{q.latest.questions}</p>
                                </details>
                              )}
                            </>
                          ) : es ? (
                            'Aún no hay revisión'
                          ) : (
                            'No review yet'
                          )}
                        </TableCell>
                        <TableCell>
                          {q.gaps.length ? (
                            <ul>
                              {q.gaps.map((g) => (
                                <li key={g}>{gaps[g]}</li>
                              ))}
                            </ul>
                          ) : es ? (
                            'Sin campos pendientes; requiere mantener evidencia vigente.'
                          ) : (
                            'No missing fields; evidence still needs upkeep.'
                          )}
                        </TableCell>
                        <TableCell>{actions[q.action]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <p className="small">
                {es
                  ? 'La cola usa la revisión guardada más recientemente, no una certificación oficial. Una publicación no resuelve automáticamente preguntas ni confirma operación. No se asignan fechas de vencimiento sin una política acordada.'
                  : 'The queue uses the most recently saved review, not an official certification. Publication does not automatically resolve questions or confirm operation. No expiry dates are assigned without an agreed policy.'}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
