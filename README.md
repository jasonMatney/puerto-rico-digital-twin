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
