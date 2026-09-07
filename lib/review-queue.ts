import { facilityRegistry } from './facility-registry.ts';
import type { SavedVerification } from './verification';
export type QueueState = {
  latest: SavedVerification | null;
  unpublished: number;
  discrepancy: boolean;
  gaps: (
    | 'review'
    | 'name'
    | 'location'
    | 'status'
    | 'capacity'
    | 'questions'
  )[];
  action:
    | 'resolve'
    | 'collect'
    | 'location'
    | 'status'
    | 'capacity'
    | 'decision'
    | 'monitor'
    | 'followup';
};
export function queueState(
  id: string,
  reviews: SavedVerification[],
  publishedReviewIds: Set<string>,
): QueueState {
  const matches = reviews
    .filter((r) => r.shelterId === id)
    .sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
    );
  const latest = matches[0] || null,
    unpublished = matches.filter((r) => !publishedReviewIds.has(r.id)).length;
  const discrepancy =
    latest?.nameCheck === 'discrepancy' ||
    latest?.locationCheck === 'discrepancy';
  const gaps: QueueState['gaps'] = [];
  if (!latest) gaps.push('review');
  if (!latest || latest.nameCheck !== 'confirmed') gaps.push('name');
  if (!latest || latest.locationCheck !== 'confirmed') gaps.push('location');
  if (!latest || latest.operatingStatus === 'unknown') gaps.push('status');
  const kind = Object.values(facilityRegistry)
    .map((r) => r[id])
    .find(Boolean);
  if (
    (kind === 'shelter' || kind === 'health') &&
    (!latest || latest.capacity === null)
  )
    gaps.push('capacity');
  if (latest?.questions.trim()) gaps.push('questions');
  const action = discrepancy
    ? 'resolve'
    : !latest
      ? 'collect'
      : gaps.includes('name') || gaps.includes('location')
        ? 'location'
        : gaps.includes('status')
          ? 'status'
          : gaps.includes('capacity')
            ? 'capacity'
            : gaps.includes('questions')
              ? 'followup'
              : unpublished
                ? 'decision'
                : 'monitor';
  return { latest, unpublished, discrepancy, gaps, action };
}
