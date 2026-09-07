import { municipalities, type Municipio } from './municipalities';
import catanoFacilitiesRaw from '../public/data/catano/facilities.geojson?raw';
import catanoFloodRaw from '../public/data/catano/flood.geojson?raw';
import catanoRoadsRaw from '../public/data/catano/roads.geojson?raw';
import catanoAccessRaw from '../public/data/catano/access.geojson?raw';
import catanoBoundaryRaw from '../public/data/catano/boundary.geojson?raw';
import raw from '../public/data/facilities.geojson?raw';
import floodRaw from '../public/data/flood.geojson?raw';
import roadsRaw from '../public/data/roads.geojson?raw';
import accessRaw from '../public/data/access.geojson?raw';
import boundaryRaw from '../public/data/boundary.geojson?raw';
import { database } from '@/db/client';
import pointInPolygon from '@turf/boolean-point-in-polygon';
import intersects from '@turf/boolean-intersects';
import { clipRoad, radiusRing } from '../scripts/access-geometry.mjs';
import type { Facility } from '@/app/facilities';
import type {
  FeatureCollection,
  Feature,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
} from 'geojson';
import type { Verification } from './verification';
export const baseline = JSON.parse(raw) as FeatureCollection<
  Facility['geometry'],
  Facility['properties']
>;
const flood = JSON.parse(floodRaw) as FeatureCollection<Polygon | MultiPolygon>;
const roads = JSON.parse(roadsRaw) as FeatureCollection<
  LineString | MultiLineString
>;
const access = JSON.parse(accessRaw) as FeatureCollection;
const boundary = JSON.parse(boundaryRaw) as FeatureCollection<
  Polygon | MultiPolygon
>;
const datasets = {
  'toa-baja': { baseline, flood, roads, access, boundary },
  catano: {
    baseline: JSON.parse(catanoFacilitiesRaw) as typeof baseline,
    flood: JSON.parse(catanoFloodRaw) as typeof flood,
    roads: JSON.parse(catanoRoadsRaw) as typeof roads,
    access: JSON.parse(catanoAccessRaw) as typeof access,
    boundary: JSON.parse(catanoBoundaryRaw) as typeof boundary,
  },
};
export type PublishedRow = {
  id: string;
  shelter_id: string;
  review_id: string;
  previous_id: string;
  created_at: string;
  before: string;
  after: string;
};
export async function publicationRows(owner: string) {
  return (
    await database()
      .prepare(
        'SELECT id,shelter_id,review_id,previous_id,created_at,before,after FROM publications WHERE owner_id=? ORDER BY sequence DESC',
      )
      .bind(owner)
      .all<PublishedRow>()
  ).results;
}
export function currentFacility(
  id: string,
  rows: PublishedRow[],
  municipio: Municipio = 'toa-baja',
) {
  const { baseline, access } = datasets[municipio];
  const row = rows.find((r) => r.shelter_id === id);
  return {
    revision: row?.id || 'baseline',
    feature: row
      ? (JSON.parse(row.after) as Facility)
      : structuredClone(baseline.features.find((f) => f.properties.id === id)!),
  };
}
export function applyReview(
  before: Facility,
  review: Verification,
  municipio: Municipio = 'toa-baja',
) {
  const { boundary, flood } = datasets[municipio];
  const after = structuredClone(before),
    p = after.properties;
  if (review.proposedName) p.name = review.proposedName;
  if (review.latitude !== null && review.longitude !== null) {
    after.geometry.coordinates = [review.longitude, review.latitude];
    if (!boundary.features.some((b) => pointInPolygon(after, b)))
      throw new Error(
        'Proposed coordinates must be within ' +
          municipalities[municipio].name +
          '.',
      );
  }
  const zones = flood.features.filter((z) => pointInPolygon(after, z));
  p.exposureHigh = zones.some((z) => z.properties?.SFHA_TF === 'T');
  p.exposureModerate = zones.some((z) =>
    String(z.properties?.ZONE_SUBTY).includes('0.2 PCT'),
  );
  p.zoneLabels = [
    ...new Set(
      zones.map((z) =>
        [z.properties?.FLD_ZONE, z.properties?.ZONE_SUBTY]
          .filter(Boolean)
          .join(' · '),
      ),
    ),
  ].join('; ');
  p.operatingStatus =
    review.operatingStatus === 'unknown'
      ? 'unconfirmed'
      : review.operatingStatus;
  p.capacity = review.capacity;
  p.statusAsOf = review.asOf;
  p.reviewedAt = review.asOf;
  p.reviewedBy = review.reviewer;
  p.note =
    review.questions ||
    'Published reviewer assertion; not official municipal confirmation.';
  p.vintage = `${before.properties.vintage.split(' / review ')[0]} / review ${review.asOf}`;
  p.sources = [
    ...p.sources.filter((s) => s.url !== review.sourceUrl),
    { label: review.sourceTitle, url: review.sourceUrl },
  ];
  return after;
}
export function screenShelter(
  shelter: Facility,
  municipio: Municipio = 'toa-baja',
): Feature[] {
  const { roads, flood } = datasets[municipio];
  const center = shelter.geometry.coordinates,
    id = shelter.properties.id,
    radiusM = 500;
  const features: Feature[] = [
    {
      type: 'Feature',
      geometry: radiusRing(center, radiusM) as Polygon,
      properties: { shelterId: id, kind: 'radius', radiusM },
    },
  ];
  for (const road of roads.features) {
    const geometry = clipRoad(
      road.geometry,
      center,
      radiusM,
    ) as MultiLineString | null;
    if (!geometry) continue;
    const f: Feature = {
      type: 'Feature',
      geometry,
      properties: {
        shelterId: id,
        kind: 'road',
        radiusM,
        roadId: road.properties?.id,
        roadClass: road.properties?.class,
        source: road.properties?.source,
      },
    };
    const zones = flood.features.filter((z) => intersects(f, z));
    f.properties!.exposureHigh = zones.some(
      (z) => z.properties?.SFHA_TF === 'T',
    );
    f.properties!.exposureModerate = zones.some((z) =>
      String(z.properties?.ZONE_SUBTY).includes('0.2 PCT'),
    );
    features.push(f);
  }
  return features;
}
export function effectiveInventory(
  rows: PublishedRow[],
  municipio: Municipio = 'toa-baja',
) {
  const { baseline, access } = datasets[municipio];
  const facilities = structuredClone(baseline),
    screening = structuredClone(access);
  for (let i = 0; i < facilities.features.length; i++) {
    const old = facilities.features[i],
      current = currentFacility(old.properties.id, rows, municipio).feature;
    facilities.features[i] = current;
    if (JSON.stringify(old.geometry) !== JSON.stringify(current.geometry)) {
      screening.features = screening.features.filter(
        (f) => f.properties?.shelterId !== old.properties.id,
      );
      screening.features.push(...screenShelter(current, municipio));
    }
  }
  return { facilities, access: screening };
}
