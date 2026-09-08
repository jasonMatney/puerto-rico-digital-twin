import { scopedOwner, requestMunicipio } from '@/lib/municipalities';
import { database } from '@/db/client';
import { previewImport } from '@/lib/csv-import';
export async function POST(request: Request) {
  let owner: string | null;
  try {
    owner = scopedOwner(request);
    requestMunicipio(request);
  } catch {
    return Response.json({ error: 'Unknown municipality' }, { status: 400 });
  }
  if (!owner)
    return Response.json(
      { error: 'Browser session unavailable. Reload to retry.' },
      { status: 401 },
    );
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return Response.json({ error: 'Invalid origin' }, { status: 403 });
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return Response.json({ error: 'Expected JSON' }, { status: 415 });
  try {
    const raw = await request.text();
    if (raw.length > 1100000) throw new Error('File too large');
    const body = JSON.parse(raw);
    if (body.confirm !== true || typeof body.csv !== 'string')
      throw new Error('Preview and confirm the CSV first');
    const p = previewImport(body.csv, requestMunicipio(request));
    if (p.errors.length || !p.reviews.length || p.sample)
      return Response.json(
        {
          error: p.sample
            ? 'Sample files are preview-only.'
            : p.errors.length
              ? 'Correct all flagged rows before saving.'
              : 'No completed responses to save.',
        },
        { status: 400 },
      );
    const now = new Date().toISOString(),
      db = database();
    const statements = await Promise.all(
      p.reviews.map(async ({ review }) => {
        const payload = JSON.stringify(review),
          hash = Array.from(
            new Uint8Array(
              await crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode(payload),
              ),
            ),
          )
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        return db
          .prepare(
            'INSERT OR IGNORE INTO verifications (id,owner_id,shelter_id,created_at,payload) SELECT ?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM verifications WHERE owner_id=? AND payload=?)',
          )
          .bind(
            `${owner}:csv:${hash}`,
            owner,
            review.shelterId,
            now,
            payload,
            owner,
            payload,
          );
      }),
    );
    const results = await db.batch(statements);
    const saved = results.reduce((n, r) => n + r.meta.changes, 0);
    return Response.json({
      saved,
      duplicates: p.reviews.length - saved,
      skipped: p.skipped,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Import failed' },
      { status: 400 },
    );
  }
}
