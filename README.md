# Puerto Rico Digital Twin

An independent geospatial prototype for Puerto Rico, beginning with **Toa Baja**. Explore terrain, building footprints, roads, and FEMA mapped flood exposure in a browser.

This is an exploratory demonstrator inspired by PRDOH's GeoFrame and Risk and Asset Data Collection (RAD) program direction. It is **not affiliated with or endorsed by PRDOH, HUD, FEMA, or the Municipio de Toa Baja**. It is not an operational digital twin, emergency routing tool, flood forecast, property eligibility determination, or reconstruction of Hurricane María.

## Pilot capabilities

- Navigable map with 3D terrain at 1× vertical scale and a 2D view.
- FEMA 1% annual-chance hazard areas (A/AE/VE), with an optional mapped 0.2% annual-chance overlay.
- Building and road visibility controls; highlighted intersections and selectable source attributes.
- Snapshot-wide exposure counts, independent of viewport, and a downloadable JSON summary.
- English and Spanish interfaces and a sources/methods dialog.
- Browser WebMCP tools for changing the hazard view and reading the exposure summary.

## Scope and data

| Dataset             | Source / vintage                                          | Use                                                                               |
| ------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Municipality        | U.S. Census TIGERweb, January 1, 2026; GEOID 72137        | Analysis boundary, including municipal waters                                     |
| Flood hazard        | FEMA NFHL layer 28; retrieved September 7, 2026           | Documented mapped hazard zones, clipped to the municipality                       |
| Buildings and roads | OpenFreeMap / OpenStreetMap tile snapshot August 30, 2026 | Footprint geometry and road segments, extracted at zoom 14                        |
| Terrain             | AWS / Mapzen Terrain Tiles                                | Regional visual context at true vertical scale; not used in exposure calculations |

The current snapshot includes **33,461 footprint polygons** and **600 road segments** intersecting the municipal boundary. These are **not a complete building inventory, household count, or count of unique streets**. Tile-grouped building geometry is unioned by vector feature ID, split into polygon footprints, and filtered against the boundary. IDs are snapshot-specific and are not cadastral identifiers. Buildings touching the boundary are retained in full.

A feature is marked exposed if any part intersects a selected FEMA polygon, including boundary contact. The 1% view currently intersects 6,862 footprints and 283 road segments; adding mapped 0.2% areas intersects 17,065 footprints and 404 road segments. Those values describe this source snapshot only. They do not establish damage, flood depth, building occupancy, route passability, or future losses. A lack of intersection does not establish safety or absence of risk. Rendering heights may be estimated and are not survey verified. FEMA base flood elevation attributes are not water depths; their original units and vertical datum are shown when provided.

Source URLs, query parameters, retrieval dates, and extraction details are recorded in `public/data/manifest.json`. Counts and methodology are in `public/data/summary.json`. The basemap and elevation tiles require network access; analysis snapshots are packaged with the application.

## Run locally

Requires Node.js 22.13+ and npm.

```sh
npm ci
npm run dev
```

```sh
npm run typecheck
npm run test:data
npm run build
```

## Refresh source data

The refresh uses public services and may take several minutes. Run from the repository root. Review source changes before publishing updated counts.

```sh
npm run data:refresh
npm run test:data
```

Pipeline: download Census and FEMA → extract building/road geometry from OpenFreeMap → split grouped footprints → clip flood zones and compute geometry intersections. Overpass was unavailable during the initial build, so the prototype uses the documented OpenFreeMap vector snapshot. No missing data is fabricated.

## Next milestones

1. Validate coverage, identifiers, and heights with authoritative GeoFrame/municipal building and parcel inventories.
2. Obtain verified shelter and critical-facility locations, metadata, and update responsibilities from their custodians.
3. Integrate a documented hydraulic scenario with known datum, resolution, assumptions, and uncertainty before estimating flood depth.
4. Add a validated road network model before evaluating access to shelters.
5. Establish data refresh and governance agreements for a maintained digital twin.

## Program and research context

- [PRDOH GeoFrame](https://recuperacion.pr.gov/en/puerto-rico-geospatial-framework-geoframe-program/)
- [PRDOH RAD](https://recuperacion.pr.gov/en/risk-and-asset-data-collection-program/)
- [NASA DEVELOP Toa Baja flood mitigation project](https://ntrs.nasa.gov/citations/20205001040)
- [Seoul atlas visual reference](https://seoul-3d-atlas.synabreu.chatgpt.site/)

## Data attribution and licensing

OpenStreetMap-derived data is © OpenStreetMap contributors, available under [ODbL 1.0](https://www.openstreetmap.org/copyright). Derived map snapshots retain that attribution and license. [OpenFreeMap](https://openfreemap.org/) supplies the basemap and vector tiles; the basemap style derives from its Liberty style. Terrain attribution and source licenses are described by [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/). Federal data remains subject to its source documentation. Third-party licenses are not replaced by this repository's ownership. No license is granted here over third-party data beyond its existing terms.

### Essential facilities inventory

`public/data/facilities.geojson` contains 31 source-documented points: 12 shelters designated in PRDOH's 2026 hurricane list, 14 municipal sirens, three police facilities, one fire station and one health center. All operating statuses are **unconfirmed**. This is not an emergency shelter availability service or a complete lifeline census.

Sources and coordinate provenance are linked per record. Shelter names follow [PRDOH 2026, PDF pages 17–18](https://docs.pr.gov/files/Vivienda/vivienda.pr.gov/Home/DVAVP_Refugios_Temporada_de_Huracanes_2026.pdf). Eleven shelter locations use the municipality's 2025 GIS, cross-checked against the PRDOH-linked map locations. Pedro Albizu Campos uses Table 16 of the [2024 mitigation plan, printed page 52](https://www.toabaja.com/wp-content/uploads/2025/03/TBAJ-FinalHMP_Approved_24.04.10-OCE10539_web.pdf#page=54), cross-checked with the 2026 link. Police, fire and health coordinates also use that historical inventory (2019 data). The plan's footnote 26 acknowledges location discrepancies; these points require current municipal/field confirmation.

The municipal GIS organization was verified as Municipio Autónomo de Toa Baja. Its 2025 shelter and siren snapshots are retained in `data/facilities/`. No explicit license was provided in the service metadata. “Funciona: Sí” in the siren snapshot is not presented as a current operational claim. The 2025-only shelter records for Cuatro Canchas, Francisca Dávila Semprit and Basilio Milán Hernández are excluded from the 2026 designation inventory. PRDOH calls Pipo Negrón “José”; municipal GIS and the linked map call it “Rafael”. This discrepancy is displayed. The generic historical “Cuartel de la Policía” near the Pueblo police point is omitted to avoid a possible duplicate.

Regenerate with `node scripts/build-facilities.mjs` after refreshing the flood snapshot. Curated source joins are explicit in that script. Exposure uses point-in-polygon classification against the same FEMA snapshot as the map; it does not classify the whole campus, structural damage, evacuation access or safe roads. No mapped zone does not establish safety. Water assets, capacities, current operations and field verification remain gaps. Source review date: 2026-09-07.

### Shelter access screening

Select any of the 12 shelters in the inventory or on the map to screen road records within an approximate **500 m straight-line radius**. The map shows the radius and clipped road portions; orange marks records whose clipped geometry intersects the selected FEMA zones, and white marks records without that intersection. Switching hazard views preserves the selected shelter and updates the screening.

`node scripts/build-access.mjs` regenerates `public/data/access.geojson` from the existing facility, road and FEMA snapshots. Each road feature is clipped to a circle in a local equirectangular projection centered on the shelter (Earth radius 6,371,008.8 m); the displayed boundary uses 96 vertices. Flood flags are recomputed on the clipped geometry, so intersections beyond the radius do not affect the result. A road record can contain disconnected sections; counts are source records, not distinct streets or access routes. Orange highlights the clipped record, not only its exact flooded portion. Positive-length road portions are retained; point-only tangent contacts with the radius are excluded. FEMA boundary contacts on retained portions count as intersections.

This proximity screen does not model road connectivity, entrances, travel distance, bridge elevation, closures or safe evacuation. It cannot establish that a shelter is reachable or isolated. Zero intersections is not a safety finding, and the road snapshot is incomplete. The facility location and operating-status caveats remain applicable. `node scripts/validate-access.mjs` checks clipping, distant-intersection exclusion, radius containment and each generated flood flag.

### Shelter comparison

Use **Compare 12 shelters** in the Facilities panel to review all designated shelters alphabetically. The table displays the FEMA zone at each point, intersecting/total nearby road records for both 1% and combined 1% + 0.2% zones, source vintage, review notes and source links. Counts reuse the same clipped 500 m screening dataset. Missing screening data is shown as unavailable/loading rather than zero. Each shelter is explicitly marked operationally unconfirmed. Selecting its name closes the comparison, filters the map to shelters and opens that shelter's existing access-screening details. The comparison does not rank shelter safety or availability.

### Municipal verification workflow

**Verify records** opens a review form for the 12 designated shelters. It prioritizes Pipo Negrón and shows the original name, coordinates, source vintage and known questions before proposed changes. Reviews require a reviewer/organization label, observation date and supporting document title/link. Name/location confirmations, proposed coordinates/name, source-reported operating status, capacity and unresolved questions remain reviewer assertions; saving never modifies the GeoJSON inventory, map classifications or shelter availability.

Reviews persist in Sites D1 (`DB`) and are scoped server-side to the authenticated Site user. The platform identity is recorded separately from the entered reviewer label. Each save appends a dated record; corrections require another review, preserving history. Observation date is distinct from the server save timestamp. Blank capacity is unknown, distinct from zero. Both proposed coordinates must be supplied together. Evidence is linked, not uploaded. Drafts are transient and switching shelters clears the form. The site remains owner-private; this does not invite municipal staff or claim municipal endorsement.

Schema: `db/schema.ts`; generated append-only migrations: `drizzle/`. Production migrations are applied by Sites. `node --experimental-strip-types scripts/validate-verification.mjs` validates dates, coordinates, required evidence, capacity and enums. API routes require a platform identity, scope reads/writes to that identity, reject cross-origin writes, validate inputs and use prepared statements. Local API validation covered rejected anonymous and cross-origin requests, invalid input, a saved synthetic review and its authenticated reload. The synthetic record is removed from the local database and never included in deployment.

### Evidence cycle and approval

The September 7 desk reviews check two official pages against the existing PRDOH list. The municipal services page names Rafael “Pipo” Negrón while the 2026 PRDOH PDF names José; a proposed name correction remains a cross-agency discrepancy. The undated municipal hurricane page lists Pedro Albizu Campos but supplies no updated coordinate confirmation. Both findings remain desk research, not municipal sign-off, field verification, activation or capacity confirmation. The **Save the two September 7 desk reviews** action stores these source-linked findings once per account; repeated clicks do not duplicate them.

A saved review can now be previewed against the current map record. Publication requires checking an explicit approval statement and selecting **Approve and publish to my map**. The server rechecks ownership, review validity, the previewed record and current revision; an atomic conditional insert rejects stale approvals, and a unique review index rejects duplicate publication. Publication appends a full before/after snapshot and account identity with a server timestamp. Past reviews and revisions are retained. This is an account-scoped private-map overlay, not publication to municipal systems or the public web.

`/api/inventory` serves the original GeoJSON plus approved account-specific revisions. Proposed names and coordinates apply only on approval. Source-reported status/capacity carry the review date; unknown status remains unconfirmed. Approved point changes recompute FEMA point exposure and rebuild the 500 m road screening. Coordinates outside the Toa Baja boundary cannot be published. Original source downloads remain unchanged. History shows before/after snapshots. A later corrective review is required to supersede an approval.

Local API tests covered explicit-confirmation rejection, stale and duplicate rejection, before/after previews, append-only history, effective inventory updates, screening-radius recomputation, and out-of-boundary rejection. Synthetic test reviews/publications were removed locally and are not deployment content. Research findings are saved as pending reviews; no real map correction is auto-approved.

### Review queue

**Review queue** summarizes all 12 shelters from the account's saved reviews and publication history. Filters show all shelters, records without a review, discrepancies and records with unpublished reviews. Each row lists the latest saved review/source, missing name/location/status/capacity evidence, saved questions and a next action; selecting the shelter opens its verification form. Pipo discrepancies and the Pedro coordinate follow-up are prioritized. The queue is a read-only view and never approves changes.

Latest means latest server save time, not necessarily the newest observation date. Publication alone does not clear a discrepancy or unresolved questions. Zero capacity is distinct from unknown. Questions/notes require review; a completed set of fields is not a safety certification. No expiration thresholds are invented. `node --experimental-strip-types scripts/validate-review-queue.mjs` covers these derivation rules. No new database schema is required.

### Municipal validation packet

The review queue offers a Spanish three-page PDF briefing and a CSV response sheet for all 12 shelters. The PDF is a dated original-source briefing (7 September 2026), with per-shelter source links, Pipo/Pedro priorities and response instructions. It does not claim to be a live export. The queue's CSV uses the map records and account reviews loaded at export time, records the export timestamp, lists evidence gaps, and leaves all 12 municipal response fields empty. It includes stable IDs, WGS84 coordinates, source links, status/capacity reference data and latest review notes. Numeric zero and unknown capacity remain distinct. CSV text is quoted and formula-leading text is neutralized.

A standalone original-inventory CSV is also included under `public/validation/`; its desk-research notes are explicitly distinguished from account review history. Rebuild the PDF with `scripts/build-validation-pdf.py` using ReportLab and visually inspect rendered pages before replacing the hosted copy. Returned CSVs are not automatically imported; review evidence through the verification workflow and explicitly approve any map correction. No outreach is performed by downloading the packet.

### CSV response import

**Import CSV responses** reads the municipal response template (UTF-8, comma separated, up to 512 KB and 12 shelter rows), previews completed responses against current shelter names/coordinates, and saves only after an explicit **Save valid responses as reviews** action. Original reference columns are not treated as proposed changes. Blank response rows are skipped. Duplicate or unknown shelter IDs, malformed CSV, missing required headers, invalid confirmation/status values, dates, numeric coordinates/capacity and missing reviewer/evidence are flagged before saving. Coordinate pairs use decimal WGS84; publication separately checks the municipal boundary.

The server repeats validation and requires the authenticated account and a same-origin request. The entire import must be valid before a transactional D1 batch is saved. Canonical review payloads are hashed for repeat-import idempotency and compared against existing same-account payloads. Imported responses remain unpublished reviews; no import calls the publication API or changes the effective inventory.

`public/validation/toa-baja-ejemplo-solo-vista-previa.csv` contains one explicitly synthetic response and eleven blank response rows. It is offered for preview only; the app and server prohibit saving rows whose reviewer begins with SAMPLE. The sample supplies no municipal evidence. `node --experimental-strip-types scripts/validate-csv-import.mjs` exercises parsing and validation. Local API tests verified sample rejection, explicit confirmation, persistence, duplicate skipping and unchanged map data; local test records were removed.

## Multiple municipal workspaces

The root route is an explanatory landing page. `/municipios` and
`/municipios/[municipio]` require dispatch-owned ChatGPT sign-in. The existing
Sites access policy still applies before the application; a private Site can
require sign-in before the landing page. No public access or external login
provider is configured by this update.

Toa Baja retains its original data and saved records. Cataño (`72033`) has its
own Census boundary, FEMA polygons, OpenFreeMap buildings and roads, plus two
PRDOH 2026 designated shelters. Coordinates are the place coordinates in the
Google Maps links supplied by the official list, retrieved September 7, 2026;
they are not field verified. Cataño additionally includes four community-mapped police, fire and health points; siren coordinates remain unsubstantiated.
`public/data/catano/manifest.json` records geographic sources and retrieval.
`scripts/build-catano-facilities.mjs` records shelter provenance and coordinates.

Map, comparison, screening, reviews, CSV response export/import and publication
use shared components with a municipality context. API requests validate a
municipality allowlist. To preserve historical records without a migration,
Toa Baja keeps the original D1 owner key; Cataño uses a JSON tuple of the
platform-authenticated owner and municipality. The same scoped key is applied
to every review/publication query, insert, duplicate check and approval.
Shelter IDs are additionally distinct (`catano-shelter-*`), so a CSV from one
municipality is rejected in the other. Review records remain per-account,
not shared municipal approvals. No field confirmation is implied.

Refresh Cataño geographic inputs in order with `DATA_DIR=public/data/catano`:
`MUNICIPIO_GEOID=72033 node scripts/fetch-data.mjs`, then
`node scripts/fetch-map-features.mjs`, `node scripts/split-footprints.mjs`,
`node scripts/analyze.mjs`. Run `node scripts/build-catano-facilities.mjs`, then
`DATA_DIR=public/data/catano node scripts/build-access.mjs`.
Without these environment variables the original Toa Baja refresh is unchanged.

`node scripts/validate-municipalities.mjs` checks geographic coverage, counts,
source-backed shelter points, scope separation and cross-municipality CSV
rejection. The Cataño validation briefing is a printable page at
`/municipios/catano/briefing`; response sheets are generated from loaded records.
The Toa Baja PDF and preview-only sample remain specific to Toa Baja.


### Cataño facility expansion and readiness (2026-09-07)

Four named OpenStreetMap records were retrieved via Overpass: municipal police
way 533099600, fire station way 535083126, CDT way 952097685, and a historically
sourced health clinic node 5150833707. The version, edit date, coordinates,
source tags and original object links are retained in
`data/facilities/catano-community-snapshot.json`. Building points use OSM
bounding-box centers, not surveyed entrances. All four have unconfirmed current
operation and capacity. ODbL attribution remains attached.

The 2019 mitigation plan, Table 22 (printed p. 105), identifies police, fire
and health facilities but is not current operational evidence. Its fire-station
address (Calle Olivo) differs from OSM (Calle Hernández), so the discrepancy is
flagged rather than reconciled without evidence. Planning Board's linked PDF
returned 404; the plan was inspected via the public alternate copy linked at
https://www.lascucharillas.com/recursos :
https://drive.google.com/file/d/1ToKZogm8ldrGTferR6UDfV9xac3ff4Ss/view .

The bounded search of the plan, public web sources and OSM did not substantiate
siren coordinates. Zero mapped sirens means missing inventory, not absence of
sirens. State police coordinates also remain unresolved. No outreach was sent.

Run `node scripts/build-readiness.mjs` after changing either source inventory.
The picker and facility panel share its category counts, evidence basis and
gaps. This is source coverage, not an emergency readiness score; per-account
reviews do not alter this original-inventory summary.

### Reviews for every mapped facility

Review forms, queues, CSV exports/imports and explicit approvals now accept all
37 mapped facilities across both municipalities. `lib/facility-registry.ts`
contains the exact baseline IDs and kinds, checked against the source inventories
by `scripts/validate-all-facilities.mjs`. Update this registry when adding assets.
The legacy `shelterId`, `shelter_id` and CSV `id_refugio` names remain compatible
with saved reviews and previously issued response sheets; they now carry facility
IDs of any supported kind. No database migration or existing-record rewrite occurs.

Coordinate approvals recalculate point flood exposure for any facility; only
shelter moves rebuild 500 m road screening. People-capacity gaps apply to shelter
and health records, not police, fire or sirens. Status open/closed represents
source-reported open/operational or closed/not operational; it is never live telemetry.
The dated shelter briefing and sample remain shelter-specific references; current
CSV exports include every mapped facility. Existing evidence requirements,
per-account municipal scope, explicit approval and immutable history still apply.

### Illustrative scenario studio

Each map has a Scenario studio entry point. Today (0 m), Heavy rainfall (2.5 m)
and Coastal surge (5 m) are named demonstration presets, not observed conditions
or calibrated physical scenarios. The 0–8 m control changes the drawn extrusion
height over the existing FEMA 1% annual-chance polygons. That footprint remains
fixed; there is no rainfall/runoff, drainage, tide, connectivity or flood-depth
calculation and no new exposure count. The interface labels these limitations.

A second, noninteractive MapLibre view copies the map style without the demo
layers and follows the primary camera. A clipped comparison divider can be moved
by pointer, keyboard or the panel slider. Comparison allocates the second map
only while enabled and releases it on exit. Failed comparison loading is reported
without modifying source data. Animation respects reduced motion and pauses when
the document is hidden. Closing the studio removes both demo layers and cancels
animation. No review records, source geometries or approvals are changed.
