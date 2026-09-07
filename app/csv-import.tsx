'use client';
import { useMunicipality } from './municipality-context';
import { useState } from 'react';
import { previewImport, type ImportPreview } from '@/lib/csv-import';
import type { Facility } from './facilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
export function CsvImport({
  facilities,
  lang,
}: {
  facilities: Facility[];
  lang: 'en' | 'es';
}) {
  const municipality = useMunicipality();
  const es = lang === 'es',
    [open, setOpen] = useState(false),
    [csv, setCsv] = useState(''),
    [preview, setPreview] = useState<ImportPreview | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState('');
  async function read(file: File | undefined) {
    setPreview(null);
    setCsv('');
    setError('');
    setResult('');
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 524288) throw new Error('Maximum file size: 512 KB');
      const text = await file.text();
      setCsv(text);
      setPreview(previewImport(text, municipality.slug));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Read failed');
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setError('');
    try {
      const r = await fetch(municipality.api('/api/verifications/import'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv, confirm: true }),
      });
      const d = (await r.json()) as {
        saved: number;
        duplicates: number;
        error?: string;
      };
      if (!r.ok) throw new Error(d.error);
      setResult(
        es
          ? `${d.saved} revisiones guardadas; ${d.duplicates} duplicados omitidos. El mapa no cambió.`
          : `${d.saved} reviews saved; ${d.duplicates} duplicates skipped. The map is unchanged.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {es ? 'Importar respuestas CSV' : 'Import CSV responses'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="shelter-comparison">
          <DialogTitle>
            {es
              ? 'Vista previa de respuestas municipales'
              : 'Municipal response preview'}
          </DialogTitle>
          <DialogDescription>
            {es
              ? 'Seleccione el CSV de respuesta con los encabezados originales. Se guardan revisiones propuestas, nunca aprobaciones ni cambios directos al mapa.'
              : 'Select the response CSV with its original headers. Imports save proposed reviews, never approvals or direct map changes.'}
          </DialogDescription>
          {municipality.slug === 'toa-baja' && (
            <a
              href="/validation/toa-baja-ejemplo-solo-vista-previa.csv"
              download
            >
              {es
                ? 'Descargar ejemplo sintético (solo vista previa)'
                : 'Download synthetic sample (preview only)'}
            </a>
          )}
          <label>
            {es ? 'Archivo CSV (máximo 512 KB)' : 'CSV file (maximum 512 KB)'}
            <Input
              type="file"
              accept=".csv,text/csv"
              disabled={busy}
              onChange={(e) => read(e.target.files?.[0])}
            />
          </label>
          <p className="small">
            {es
              ? 'Confirmación: si, no o pendiente. Estado: abierto, cerrado, espera o desconocido. Fecha: AAAA-MM-DD. Coordenadas: decimales WGS84. Evidencia, fecha y revisor son obligatorios para cada respuesta. Filas sin respuestas se omiten.'
              : 'Confirmation: si, no or pendiente. Status: abierto, cerrado, espera or desconocido. Date: YYYY-MM-DD. Coordinates: WGS84 decimals. Each completed response needs evidence, date and reviewer. Blank responses are skipped.'}
          </p>
          {error && <p role="alert">{error}</p>}
          {busy && <p role="status">{es ? 'Procesando…' : 'Processing…'}</p>}
          {preview && (
            <>
              <p>
                {preview.reviews.length}{' '}
                {es ? 'respuestas válidas' : 'valid responses'} ·{' '}
                {preview.skipped}{' '}
                {es ? 'filas vacías omitidas' : 'blank rows skipped'} ·{' '}
                {preview.errors.length} {es ? 'errores' : 'errors'}
              </p>
              {preview.sample && (
                <p role="alert">
                  {es
                    ? 'Ejemplo sintético: no se puede guardar.'
                    : 'Synthetic sample: saving is disabled.'}
                </p>
              )}
              {preview.errors.length > 0 && (
                <ul role="alert">
                  {preview.errors.map((e) => (
                    <li key={e.row}>
                      {es ? 'Fila' : 'Row'} {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {es ? 'Refugio actual' : 'Current shelter'}
                    </TableHead>
                    <TableHead>{es ? 'Propuesta' : 'Proposal'}</TableHead>
                    <TableHead>
                      {es ? 'Evidencia / revisión' : 'Evidence / review'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.reviews.map(({ row, review: r }) => {
                    const f = facilities.find(
                      (f) => f.properties.id === r.shelterId,
                    );
                    return (
                      <TableRow key={row}>
                        <TableCell>
                          {r.shelterId}
                          <br />
                          {f?.properties.name}
                          <br />
                          {f?.geometry.coordinates.slice().reverse().join(', ')}
                        </TableCell>
                        <TableCell>
                          {r.proposedName ||
                            (es ? 'Nombre sin cambio' : 'Name unchanged')}
                          <br />
                          {r.latitude === null
                            ? es
                              ? 'Coordenadas sin cambio'
                              : 'Coordinates unchanged'
                            : `${r.latitude}, ${r.longitude}`}
                          <br />
                          {r.operatingStatus} · {es ? 'Capacidad' : 'Capacity'}:{' '}
                          {r.capacity ?? (es ? 'Desconocida' : 'Unknown')}
                          <br />
                          {es ? 'Nombre / ubicación' : 'Name / location'}:{' '}
                          {r.nameCheck} / {r.locationCheck}
                        </TableCell>
                        <TableCell>
                          {r.reviewer}
                          <br />
                          {r.asOf}
                          <br />
                          <a
                            href={r.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {r.sourceTitle} ↗
                          </a>
                          <p>{r.questions}</p>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Button
                disabled={
                  busy ||
                  !!result ||
                  preview.sample ||
                  !!preview.errors.length ||
                  !preview.reviews.length
                }
                onClick={save}
              >
                {es
                  ? 'Guardar respuestas válidas como revisiones'
                  : 'Save valid responses as reviews'}
              </Button>
            </>
          )}
          {result && <p role="status">{result}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}
