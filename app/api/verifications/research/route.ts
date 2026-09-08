import { scopedOwner, requestMunicipio } from '@/lib/municipalities';
import { database } from '@/db/client';
import { researchReviews } from '@/lib/research-reviews';
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
  if (requestMunicipio(request) !== 'toa-baja')
    return Response.json(
      { error: 'No desk reviews for this municipality' },
      { status: 400 },
    );
  try {
    const now = new Date().toISOString();
    await database().batch(
      researchReviews.map((r) =>
        database()
          .prepare(
            'INSERT OR IGNORE INTO verifications (id,owner_id,shelter_id,created_at,payload) VALUES (?,?,?,?,?)',
          )
          .bind(
            `${owner}:desk-2026-09-07:${r.shelterId}`,
            owner,
            r.shelterId,
            now,
            JSON.stringify(r),
          ),
      ),
    );
    return Response.json({ saved: 2 });
  } catch {
    return Response.json(
      { error: 'Could not save desk reviews' },
      { status: 503 },
    );
  }
}
