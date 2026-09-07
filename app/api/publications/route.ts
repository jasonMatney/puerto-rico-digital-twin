import { scopedOwner, requestMunicipio } from '@/lib/municipalities';
import type { Municipio } from '@/lib/municipalities';
import { database } from '@/db/client';
import {
  publicationRows,
  currentFacility,
  applyReview,
} from '@/lib/inventory-server';
import { validateVerification } from '@/lib/verification';
export const dynamic = 'force-dynamic';
const response = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
async function preview(owner: string, reviewId: string, municipio: Municipio) {
  const row = await database()
    .prepare('SELECT payload FROM verifications WHERE id=? AND owner_id=?')
    .bind(reviewId, owner)
    .first<{ payload: string }>();
  if (!row) throw new Error('Review not found');
  const review = validateVerification(JSON.parse(row.payload), municipio),
    rows = await publicationRows(owner),
    current = currentFacility(review.shelterId, rows, municipio);
  return {
    review,
    before: current.feature,
    after: applyReview(current.feature, review, municipio),
    expectedRevision: current.revision,
    alreadyPublished: rows.some((r) => r.review_id === reviewId),
    history: rows.filter((r) => r.shelter_id === review.shelterId),
  };
}
export async function GET(request: Request) {
  let owner: string | null;
  try {
    owner = scopedOwner(request);
    requestMunicipio(request);
  } catch {
    return Response.json({ error: 'Unknown municipality' }, { status: 400 });
  }
  if (!owner) return response({ error: 'Sign in required' }, 401);
  try {
    const reviewId = new URL(request.url).searchParams.get('reviewId');
    return response(
      reviewId
        ? await preview(owner, reviewId, requestMunicipio(request))
        : { publications: await publicationRows(owner) },
    );
  } catch (e) {
    return response(
      { error: e instanceof Error ? e.message : 'Preview unavailable' },
      400,
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
  if (!owner) return response({ error: 'Sign in required' }, 401);
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return response({ error: 'Invalid origin' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return response({ error: 'Expected JSON' }, 415);
  try {
    const body = (await request.json()) as {
      reviewId?: string;
      expectedRevision?: string;
      expectedBefore?: string;
      confirm?: boolean;
    };
    if (
      body.confirm !== true ||
      typeof body.reviewId !== 'string' ||
      typeof body.expectedRevision !== 'string' ||
      typeof body.expectedBefore !== 'string'
    )
      return response(
        { error: 'Explicit approval and a current preview are required' },
        400,
      );
    const p = await preview(owner, body.reviewId, requestMunicipio(request));
    if (p.alreadyPublished)
      return response({ error: 'This review has already been published' }, 409);
    if (
      p.expectedRevision !== body.expectedRevision ||
      JSON.stringify(p.before) !== body.expectedBefore
    )
      return response(
        { error: 'This shelter changed. Reopen the preview before approving.' },
        409,
      );
    const id = crypto.randomUUID(),
      createdAt = new Date().toISOString();
    const result = await database()
      .prepare(
        "INSERT INTO publications (id,owner_id,shelter_id,review_id,previous_id,created_at,before,after) SELECT ?,?,?,?,?,?,?,? WHERE COALESCE((SELECT id FROM publications WHERE owner_id=? AND shelter_id=? ORDER BY sequence DESC LIMIT 1),'baseline') = ?",
      )
      .bind(
        id,
        owner,
        p.review.shelterId,
        body.reviewId,
        p.expectedRevision,
        createdAt,
        JSON.stringify(p.before),
        JSON.stringify(p.after),
        owner,
        p.review.shelterId,
        body.expectedRevision,
      )
      .run();
    if (!result.meta.changes)
      return response(
        { error: 'This shelter changed. Reopen the preview.' },
        409,
      );
    return response({ id, createdAt }, 201);
  } catch (e) {
    return response(
      { error: e instanceof Error ? e.message : 'Publication failed' },
      400,
    );
  }
}
