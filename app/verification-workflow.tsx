'use client';
import { useEffect, useState } from 'react';
import { PublishReview } from './publish-review';
import type { Facility } from './facilities';
import type { Verification, SavedVerification } from '@/lib/verification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
const blank = (id: string): Verification => ({
  shelterId: id,
  reviewer: '',
  asOf: '',
  nameCheck: 'unconfirmed',
  locationCheck: 'unconfirmed',
  proposedName: '',
  latitude: null,
  longitude: null,
  operatingStatus: 'unknown',
  capacity: null,
  sourceTitle: '',
  sourceUrl: '',
  questions: '',
});
export function VerificationWorkflow({
  facilities,
  lang,
}: {
  facilities: Facility[];
  lang: 'en' | 'es';
}) {
  const es = lang === 'es',
    [open, setOpen] = useState(false),
    [form, setForm] = useState<Verification>(blank('shelter-3')),
    [reviews, setReviews] = useState<SavedVerification[]>([]),
    [loading, setLoading] = useState(false),
    [loadError, setLoadError] = useState(''),
    [error, setError] = useState(''),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false),
    [reload, setReload] = useState(0);
  const shelters = facilities.filter((f) => f.properties.kind === 'shelter'),
    selected = shelters.find((f) => f.properties.id === form.shelterId);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    fetch('/api/verifications', { signal: controller.signal })
      .then(async (r) => {
        const d = (await r.json()) as {
          reviews: SavedVerification[];
          error?: string;
        };
        if (!r.ok) throw new Error(d.error);
        setReviews(d.reviews);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setLoadError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open, reload]);
  const update = <K extends keyof Verification>(
    key: K,
    value: Verification[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };
  const checkOptions = {
    unconfirmed: es ? 'Sin confirmar' : 'Unconfirmed',
    confirmed: es ? 'Confirmado por el revisor' : 'Confirmed by reviewer',
    discrepancy: es ? 'Discrepancia' : 'Discrepancy',
  };
  const statusOptions = {
    unknown: es ? 'Desconocido' : 'Unknown',
    open: es ? 'Abierto según fuente' : 'Reported open',
    closed: es ? 'Cerrado según fuente' : 'Reported closed',
    standby: es ? 'En espera según fuente' : 'Reported standby',
  };
  const choice = (
    key: 'nameCheck' | 'locationCheck' | 'operatingStatus',
    label: string,
    options: Record<string, string>,
  ) => (
    <label>
      {label}
      <Select
        value={form[key]}
        items={options}
        onValueChange={(v) => v && update(key, v as never)}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([k, v]) => (
            <SelectItem value={k} key={k}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const r = await fetch('/api/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = (await r.json()) as {
        review: SavedVerification;
        error?: string;
      };
      if (!r.ok) throw new Error(d.error);
      setReviews((rs) => [d.review, ...rs]);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {es ? 'Verificar registros' : 'Verify records'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="verification-dialog">
          <DialogTitle>
            {es ? 'Revisión de registros de refugios' : 'Shelter record review'}
          </DialogTitle>
          <DialogDescription>
            {es
              ? 'Registre evidencia y correcciones propuestas. Guardar una revisión no cambia el inventario publicado ni confirma oficialmente un refugio.'
              : 'Record evidence and proposed corrections. Saving a review does not change the published inventory or officially verify a shelter.'}
          </DialogDescription>
          <p className="small">
            {es
              ? 'Prioridades: nombre de Pipo Negrón y coordenadas históricas de Pedro Albizu Campos. Los registros se guardan para su cuenta; cambiar de refugio abre un formulario vacío y recargar descarta formularios sin guardar.'
              : 'Priorities: Pipo Negrón’s name and Pedro Albizu Campos’s historical coordinates. Records are saved for your account; switching shelters starts a blank form, and unsaved forms are lost on reload.'}
          </p>
          <label>
            {es ? 'Refugio' : 'Shelter'}
            <Select
              disabled={saving}
              value={form.shelterId}
              items={Object.fromEntries(
                shelters.map((f) => [f.properties.id, f.properties.name]),
              )}
              onValueChange={(id) => {
                if (id) {
                  setForm(blank(id));
                  setSaved(false);
                  setError('');
                }
              }}
            >
              <SelectTrigger
                aria-label={es ? 'Refugio a revisar' : 'Shelter to review'}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {shelters.map((f) => (
                  <SelectItem key={f.properties.id} value={f.properties.id}>
                    {f.properties.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          {selected && (
            <div className="verification-baseline">
              <strong>
                {es ? 'Registro actual del mapa' : 'Current map record'}
              </strong>
              <p>
                {selected.properties.name} ·{' '}
                {selected.geometry.coordinates[1].toFixed(6)},{' '}
                {selected.geometry.coordinates[0].toFixed(6)}
              </p>
              <p>
                {selected.properties.vintage} ·{' '}
                {es ? 'Operación sin confirmar' : 'Operation unconfirmed'}
              </p>
              <p>{selected.properties.note}</p>
              {selected.properties.sources.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                  {s.label} ↗
                </a>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              setError('');
              try {
                const r = await fetch('/api/verifications/research', {
                  method: 'POST',
                });
                if (!r.ok) throw new Error('Could not save desk reviews');
                setReload((n) => n + 1);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Save failed');
              } finally {
                setSaving(false);
              }
            }}
          >
            {es
              ? 'Guardar las dos revisiones documentales del 7 sep.'
              : 'Save the two September 7 desk reviews'}
          </Button>
          <form onSubmit={save}>
            <fieldset disabled={saving || loading || !!loadError || !selected}>
              <div className="verification-grid">
                <label>
                  {es
                    ? 'Revisor / organización *'
                    : 'Reviewer / organization *'}
                  <Input
                    required
                    maxLength={120}
                    value={form.reviewer}
                    onChange={(e) => update('reviewer', e.target.value)}
                  />
                </label>
                <label>
                  {es ? 'Fecha de observación *' : 'Observation date *'}
                  <Input
                    required
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={form.asOf}
                    onChange={(e) => update('asOf', e.target.value)}
                  />
                </label>
                {choice(
                  'nameCheck',
                  es ? 'Confirmación del nombre' : 'Name confirmation',
                  checkOptions,
                )}
                {choice(
                  'locationCheck',
                  es ? 'Confirmación de ubicación' : 'Location confirmation',
                  checkOptions,
                )}
                <label>
                  {es
                    ? 'Nombre propuesto (opcional)'
                    : 'Proposed name (optional)'}
                  <Input
                    maxLength={200}
                    value={form.proposedName}
                    onChange={(e) => update('proposedName', e.target.value)}
                  />
                </label>
                {choice(
                  'operatingStatus',
                  es ? 'Estado según fuente' : 'Source-reported status',
                  statusOptions,
                )}
                <label>
                  {es ? 'Latitud propuesta' : 'Proposed latitude'}
                  <Input
                    type="number"
                    step="any"
                    min={-90}
                    max={90}
                    value={form.latitude ?? ''}
                    onChange={(e) =>
                      update(
                        'latitude',
                        e.target.value === '' ? null : Number(e.target.value),
                      )
                    }
                  />
                </label>
                <label>
                  {es ? 'Longitud propuesta' : 'Proposed longitude'}
                  <Input
                    type="number"
                    step="any"
                    min={-180}
                    max={180}
                    value={form.longitude ?? ''}
                    onChange={(e) =>
                      update(
                        'longitude',
                        e.target.value === '' ? null : Number(e.target.value),
                      )
                    }
                  />
                </label>
                <label>
                  {es
                    ? 'Capacidad en personas (vacío = desconocida)'
                    : 'Capacity in people (blank = unknown)'}
                  <Input
                    type="number"
                    step="1"
                    min={0}
                    max={1000000}
                    value={form.capacity ?? ''}
                    onChange={(e) =>
                      update(
                        'capacity',
                        e.target.value === '' ? null : Number(e.target.value),
                      )
                    }
                  />
                </label>
                <label>
                  {es ? 'Documento / fuente *' : 'Document / source title *'}
                  <Input
                    required
                    maxLength={240}
                    value={form.sourceTitle}
                    onChange={(e) => update('sourceTitle', e.target.value)}
                  />
                </label>
              </div>
              <label>
                {es ? 'Enlace a evidencia *' : 'Evidence link *'}
                <Input
                  required
                  type="url"
                  maxLength={2000}
                  value={form.sourceUrl}
                  onChange={(e) => update('sourceUrl', e.target.value)}
                />
              </label>
              <label>
                {es
                  ? 'Preguntas pendientes / notas'
                  : 'Unresolved questions / notes'}
                <Textarea
                  maxLength={4000}
                  value={form.questions}
                  onChange={(e) => update('questions', e.target.value)}
                />
              </label>
              <p className="small">
                {es
                  ? 'Las confirmaciones son declaraciones del revisor respaldadas por el enlace. Para corregir una revisión guardada, agregue otra; se conserva el historial.'
                  : 'Confirmations are reviewer statements supported by the evidence link. To correct a saved review, add another; earlier records remain in the history.'}
              </p>
              <Button type="submit" disabled={saved}>
                {saving
                  ? es
                    ? 'Guardando…'
                    : 'Saving…'
                  : saved
                    ? es
                      ? 'Revisión guardada'
                      : 'Review saved'
                    : es
                      ? 'Guardar revisión propuesta'
                      : 'Save proposed review'}
              </Button>
            </fieldset>
          </form>
          {error && <p role="alert">{error}</p>}
          {saved && (
            <p role="status">
              {es
                ? 'Guardado. El inventario publicado no cambió.'
                : 'Saved. The published inventory is unchanged.'}
            </p>
          )}
          <section>
            <h3>
              {es
                ? 'Historial de este refugio'
                : 'This shelter’s review history'}
            </h3>
            {loading ? (
              <p role="status">{es ? 'Cargando…' : 'Loading…'}</p>
            ) : loadError ? (
              <p role="alert">
                {loadError}{' '}
                <Button
                  variant="outline"
                  onClick={() => setReload((n) => n + 1)}
                >
                  {es ? 'Reintentar' : 'Retry'}
                </Button>
              </p>
            ) : !reviews.some((r) => r.shelterId === form.shelterId) ? (
              <p>
                {es
                  ? 'Aún no hay revisiones guardadas.'
                  : 'No saved reviews yet.'}
              </p>
            ) : (
              reviews
                .filter((r) => r.shelterId === form.shelterId)
                .map((r) => (
                  <details key={r.id} className="verification-history">
                    <summary>
                      {r.asOf} · {r.reviewer}
                    </summary>
                    <p>
                      {es ? 'Nombre' : 'Name'}: {checkOptions[r.nameCheck]} ·{' '}
                      {es ? 'Ubicación' : 'Location'}:{' '}
                      {checkOptions[r.locationCheck]}
                    </p>
                    <p>
                      {statusOptions[r.operatingStatus]} ·{' '}
                      {es ? 'Capacidad' : 'Capacity'}:{' '}
                      {r.capacity ?? (es ? 'Desconocida' : 'Unknown')}
                    </p>
                    {r.proposedName && <p>{r.proposedName}</p>}
                    {r.latitude !== null && (
                      <p>
                        {r.latitude}, {r.longitude}
                      </p>
                    )}
                    <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                      {r.sourceTitle} ↗
                    </a>
                    <p>{r.questions}</p>
                    <small>
                      {es ? 'Guardado' : 'Saved'}:{' '}
                      {new Date(r.createdAt).toLocaleString(lang)}
                    </small>
                    <PublishReview reviewId={r.id} lang={lang} />
                  </details>
                ))
            )}
          </section>
        </DialogContent>
      </Dialog>
    </>
  );
}
