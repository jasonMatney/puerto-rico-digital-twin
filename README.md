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
