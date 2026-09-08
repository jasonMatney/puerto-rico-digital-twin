import { scopedOwner, requestMunicipio } from '@/lib/municipalities';
import { database } from '@/db/client';
import { validateVerification } from '@/lib/verification';
export const dynamic = 'force-dynamic';
const response = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
export async function GET(request: Request) {
  let owner: string | null;
  try {
    owner = scopedOwner(request);
    requestMunicipio(request);
  } catch {
    return Response.json({ error: 'Unknown municipality' }, { status: 400 });
  }
  if (!owner)
    return response({ error: 'Reload to start your browser workspace.' }, 401);
  try {
    const rows = await database()
      .prepare(
        'SELECT id, created_at, payload FROM verifications WHERE owner_id = ? ORDER BY created_at DESC',
      )
      .bind(owner)
      .all<{ id: string; created_at: string; payload: string }>();
    return response({
      reviews: rows.results.map((r) => ({
        ...JSON.parse(r.payload),
        id: r.id,
        createdAt: r.created_at,
      })),
    });
  } catch {
    return response(
      { error: 'Verification records could not load. Please try again.' },
      503,
    );
  }
}
export async function POST(request: Request) {
  let owner: string | null;
  try {
    owner = scopedOwner(request);
    requestMunicipio(request);
  } catch {
    return Response.json({ error: 'Unknown municipality' }, { status: 400 });
  }
  if (!owner)
    return response({ error: 'Reload to start your browser workspace.' }, 401);
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return response({ error: 'Invalid request origin.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return response({ error: 'Expected JSON.' }, 415);
  let review;
  try {
    const raw = await request.text();
    if (raw.length > 16000)
      return response({ error: 'Review is too large.' }, 413);
    review = validateVerification(JSON.parse(raw), requestMunicipio(request));
  } catch (e) {
    return response(
      { error: e instanceof Error ? e.message : 'Invalid review.' },
      400,
    );
  }
  try {
    const id = crypto.randomUUID(),
      createdAt = new Date().toISOString();
    await database()
      .prepare(
        'INSERT INTO verifications (id,owner_id,shelter_id,created_at,payload) VALUES (?,?,?,?,?)',
      )
      .bind(id, owner, review.shelterId, createdAt, JSON.stringify(review))
      .run();
    return response({ review: { ...review, id, createdAt } }, 201);
  } catch {
    return response(
      {
        error:
          'The review could not be saved. Your form is still available; please try again.',
      },
      503,
    );
  }
}
