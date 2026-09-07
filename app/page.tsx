'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Map as GLMap,
  FilterSpecification,
  GeoJSONSource,
  StyleSpecification,
} from 'maplibre-gl';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import {
  Compass,
  Layers,
  RotateCcw,
  Mountain,
  Info,
  X,
  ArrowUpRight,
  Eye,
  ChevronDown,
  Building2,
  Route,
  Waves,
  Download,
  Globe2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FacilityList, FacilityDetails, type Facility } from './facilities';
import { AccessScreening } from './access-screening';

type View = 'none' | 'high' | 'extended';
type Summary = {
  buildings: { total: number; high: number; extended: number };
  roads: { total: number; high: number; extended: number };
  floodPolygons: number;
  method: string;
};
type Selection = {
  kind: 'building' | 'road' | 'flood' | 'facility';
  properties: Record<string, unknown>;
};
const home = {
  center: [-66.205, 18.442] as [number, number],
  zoom: 12.65,
  pitch: 52,
  bearing: -18,
};
const copy = {
  en: {
    title: 'Toa Baja',
    eyebrow: 'PUERTO RICO / DIGITAL TWIN',
    pilot: 'PILOT 01',
    intro: 'The floodplain, in context.',
    sub: 'Explore mapped flood exposure across Toa Baja’s buildings and roads.',
    hazard: 'Flood hazard view',
    none: 'Landscape only',
    high: '1% annual chance',
    extended: '1% + 0.2% annual chance',
    highNote: 'FEMA special flood hazard areas: zones A, AE and VE.',
    extendedNote: 'Adds mapped 0.2% annual-chance areas to the 1% floodplain.',
    noneNote: 'Explore terrain, roads and building footprints.',
    layers: 'MAP LAYERS',
    buildings: 'Building footprints',
    roads: 'Road network',
    terrain: '3D terrain',
    reset: 'Reset view',
    flat: '2D view',
    three: '3D view',
    sources: 'Sources & methods',
    snapshot: 'DATA SNAPSHOT',
    exposure: 'Mapped exposure',
    overlap: 'Footprints intersecting selected zones',
    total: 'footprints in this snapshot',
    segments: 'road segments intersecting',
    coverage:
      'Coverage is not a complete building census. Intersection does not establish damage or road closure.',
    inspect: 'Inspect a footprint',
    download: 'Download summary',
    independent: 'Independent prototype · Not affiliated with PRDOH',
    notice:
      'Mapped hazard zones · Not a María flood reconstruction or live forecast',
    ready: 'Toa Baja · Puerto Rico',
    loading: 'Loading local map layers…',
    error: 'Some map data could not load. Reload to try again.',
    select:
      'Select a building, road or flood zone to inspect its source attributes.',
    detail: 'FEATURE DETAILS',
    close: 'Close details',
    height: 'Rendering height',
    estimated: 'Not survey verified; may be estimated',
    zone: 'Intersecting mapped zones',
    id: 'Snapshot feature ID',
    floodZone: 'FEMA flood zone',
    bfe: 'Base flood elevation',
    nodata: 'Not provided',
    instructions: 'Drag to pan · Scroll to zoom · Right-drag to rotate',
    controls: 'Map controls',
    collapse: 'Hide controls',
    methodTitle: 'Sources, scope & limitations',
    methodDesc:
      'An exploratory geospatial prototype for flood-exposure planning.',
    boundary: 'Municipal boundary',
    boundaryDesc:
      'U.S. Census TIGERweb, January 1, 2026 vintage. GEOID 72137. Includes municipal waters.',
    floodDesc:
      'FEMA National Flood Hazard Layer, downloaded September 7, 2026. Polygons clipped to the municipal boundary. Zone designation is a mapped annual probability, not a storm simulation.',
    buildingDesc:
      'OpenFreeMap / OpenStreetMap, August 30, 2026 tile snapshot. Footprint polygons are extracted at zoom 14, merged across tile edges and split from grouped geometry. IDs are specific to this snapshot. Heights are rendering attributes, not verified measurements.',
    terrainDesc:
      'AWS / Mapzen Terrain Tiles, displayed at 1× vertical scale. Regional elevation data is for visual context, not flood-depth calculations.',
    method: 'Exposure method',
    methodText:
      'A footprint or road segment is counted when any part intersects a selected FEMA polygon, including boundary contact. Roads are tile segments, not unique streets. Counts do not represent people, homes lost, water depth or passability.',
    next: 'Next data milestone',
    nextText:
      'Validate footprints against authoritative building and parcel inventories; verify shelters and critical facilities with their data owners before adding them. No facility locations or operating status are assumed.',
    noFlood: 'Choose a flood hazard view to see intersection counts.',
    footprint: 'Building footprint',
    road: 'Road segment',
    flood: 'Flood hazard polygon',
    readMore: 'Program context',
    retry: 'Reload map',
  },
  es: {
    title: 'Toa Baja',
    eyebrow: 'PUERTO RICO / GEMELO DIGITAL',
    pilot: 'PILOTO 01',
    intro: 'La zona inundable, en contexto.',
    sub: 'Explore la exposición cartografiada de edificios y vías en Toa Baja.',
    hazard: 'Vista de peligro de inundación',
    none: 'Solo paisaje',
    high: '1% de probabilidad anual',
    extended: '1% + 0.2% de probabilidad anual',
    highNote: 'Áreas especiales de peligro de FEMA: zonas A, AE y VE.',
    extendedNote:
      'Añade las áreas cartografiadas con probabilidad anual de 0.2%.',
    noneNote: 'Explore el terreno, las vías y las huellas de edificios.',
    layers: 'CAPAS DEL MAPA',
    buildings: 'Huellas de edificios',
    roads: 'Red vial',
    terrain: 'Terreno 3D',
    reset: 'Restablecer vista',
    flat: 'Vista 2D',
    three: 'Vista 3D',
    sources: 'Fuentes y métodos',
    snapshot: 'INSTANTÁNEA DE DATOS',
    exposure: 'Exposición cartografiada',
    overlap: 'Huellas que intersectan las zonas seleccionadas',
    total: 'huellas en esta instantánea',
    segments: 'segmentos viales que intersectan',
    coverage:
      'La cobertura no es un censo completo de edificios. La intersección no determina daños ni cierres viales.',
    inspect: 'Inspeccionar una huella',
    download: 'Descargar resumen',
    independent: 'Prototipo independiente · Sin afiliación con Vivienda',
    notice:
      'Zonas de peligro cartografiadas · No es una reconstrucción de María ni un pronóstico en vivo',
    ready: 'Toa Baja · Puerto Rico',
    loading: 'Cargando las capas locales…',
    error:
      'No se pudieron cargar algunos datos. Recargue para intentar de nuevo.',
    select:
      'Seleccione un edificio, una vía o una zona inundable para ver sus atributos.',
    detail: 'DETALLES DEL ELEMENTO',
    close: 'Cerrar detalles',
    height: 'Altura de representación',
    estimated: 'Sin verificación topográfica; puede ser estimada',
    zone: 'Zonas cartografiadas que intersectan',
    id: 'ID de esta instantánea',
    floodZone: 'Zona de inundación FEMA',
    bfe: 'Elevación de inundación base',
    nodata: 'No disponible',
    instructions:
      'Arrastre para mover · Rueda para acercar · Arrastre derecho para rotar',
    controls: 'Controles del mapa',
    collapse: 'Ocultar controles',
    methodTitle: 'Fuentes, alcance y limitaciones',
    methodDesc:
      'Un prototipo geoespacial exploratorio para planificar ante inundaciones.',
    boundary: 'Límite municipal',
    boundaryDesc:
      'TIGERweb del Censo de EE. UU., límites del 1 de enero de 2026. GEOID 72137. Incluye aguas municipales.',
    floodDesc:
      'Capa Nacional de Peligro de Inundación de FEMA, descargada el 7 de septiembre de 2026. Polígonos recortados al límite municipal. Las zonas representan probabilidades anuales cartografiadas, no una simulación de tormenta.',
    buildingDesc:
      'OpenFreeMap / OpenStreetMap, instantánea del 30 de agosto de 2026. Huellas extraídas al nivel de zoom 14, unidas entre teselas y separadas de geometrías agrupadas. Los ID son específicos de esta instantánea. Las alturas son atributos de representación, no mediciones verificadas.',
    terrainDesc:
      'AWS / Mapzen Terrain Tiles, a escala vertical 1×. La elevación regional sirve de contexto visual, no para calcular profundidades de inundación.',
    method: 'Método de exposición',
    methodText:
      'Se cuenta una huella o segmento vial cuando cualquier parte intersecta un polígono FEMA seleccionado, incluso el contacto con el borde. Las vías son segmentos de teselas, no calles únicas. Los conteos no representan personas, hogares perdidos, profundidad ni transitabilidad.',
    next: 'Próximo paso de datos',
    nextText:
      'Validar las huellas con inventarios oficiales de edificios y parcelas; verificar refugios e instalaciones críticas con sus custodios antes de añadirlos. No se presuponen ubicaciones ni estados operativos.',
    noFlood:
      'Seleccione una vista de peligro para ver los conteos de intersección.',
    footprint: 'Huella de edificio',
    road: 'Segmento vial',
    flood: 'Polígono de peligro de inundación',
    readMore: 'Contexto del programa',
    retry: 'Recargar mapa',
  },
};
const number = (n: number) => new Intl.NumberFormat('en-US').format(n);
export default function Home() {
  const host = useRef<HTMLDivElement>(null),
    map = useRef<GLMap | null>(null),
    footprints = useRef<FeatureCollection<Polygon> | null>(null);
  const [lang, setLang] = useState<'en' | 'es'>('en'),
    [view, setView] = useState<View>('high'),
    [buildings, setBuildings] = useState(true),
    [roads, setRoads] = useState(true),
    [terrain, setTerrain] = useState(true),
    [is3d, setIs3d] = useState(true),
    [ready, setReady] = useState(false),
    [error, setError] = useState(false),
    [sources, setSources] = useState(false),
    [controls, setControls] = useState(true),
    [summary, setSummary] = useState<Summary | null>(null),
    [selection, setSelection] = useState<Selection | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [accessData, setAccessData] = useState<FeatureCollection | null>(null);
  const [accessError, setAccessError] = useState(false);
  const [category, setCategory] = useState('all');
  const [facilitiesVisible, setFacilitiesVisible] = useState(true);
  const c = copy[lang];
  useEffect(() => {
    const controller = new AbortController();
    fetch('/data/access.geojson', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Access data unavailable');
        return r.json() as Promise<FeatureCollection>;
      })
      .then(setAccessData)
      .catch(() => {
        if (!controller.signal.aborted) setAccessError(true);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    (async () => {
      try {
        const [ml, style, boundary, flood, bld, rd, stats, facilityData] =
          await Promise.all([
            import('maplibre-gl'),
            fetch('/data/basemap.json', { signal: controller.signal }).then(
              (r) => {
                if (!r.ok) throw new Error('Data unavailable');
                return r.json() as Promise<StyleSpecification>;
              },
            ),
            fetch('/data/boundary.geojson', { signal: controller.signal }).then(
              (r) => {
                if (!r.ok) throw new Error('Data unavailable');
                return r.json() as Promise<FeatureCollection>;
              },
            ),
            fetch('/data/flood.geojson', { signal: controller.signal }).then(
              (r) => {
                if (!r.ok) throw new Error('Data unavailable');
                return r.json() as Promise<FeatureCollection>;
              },
            ),
            fetch('/data/buildings.geojson', {
              signal: controller.signal,
            }).then((r) => {
              if (!r.ok) throw new Error('Data unavailable');
              return r.json() as Promise<FeatureCollection<Polygon>>;
            }),
            fetch('/data/roads.geojson', { signal: controller.signal }).then(
              (r) => {
                if (!r.ok) throw new Error('Data unavailable');
                return r.json() as Promise<FeatureCollection>;
              },
            ),
            fetch('/data/summary.json', { signal: controller.signal }).then(
              (r) => {
                if (!r.ok) throw new Error('Data unavailable');
                return r.json() as Promise<Summary>;
              },
            ),
            fetch('/data/facilities.geojson', {
              signal: controller.signal,
            }).then((r) => {
              if (!r.ok) throw new Error('Facility data unavailable');
              return r.json() as Promise<
                FeatureCollection<
                  import('geojson').Point,
                  Facility['properties']
                >
              >;
            }),
          ]);
        if (disposed || !host.current) return;
        setSummary(stats);
        setFacilities(facilityData.features);
        footprints.current = bld;
        ml.setWorkerUrl('/vendor/maplibre-gl-worker.mjs');
        const m = new ml.Map({
          container: host.current,
          style,
          ...home,
          maxZoom: 18,
          minZoom: 10,
          attributionControl: { compact: true },
        });
        map.current = m;
        m.addControl(
          new ml.NavigationControl({ visualizePitch: true }),
          'bottom-right',
        );
        m.addControl(new ml.ScaleControl({ unit: 'metric' }), 'bottom-right');
        m.on('error', (e) => {
          console.error('Map source error', e.error);
          if (!disposed) setError(true);
        });
        m.on('load', () => {
          if (disposed) return;
          try {
            m.addSource('dem', {
              type: 'raster-dem',
              tiles: [
                'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
              ],
              encoding: 'terrarium',
              tileSize: 256,
              maxzoom: 15,
              attribution: 'Terrain: AWS / Mapzen',
            });
            m.setTerrain({ source: 'dem', exaggeration: 1 });
            m.addSource('municipio', { type: 'geojson', data: boundary });
            m.addSource('flood', { type: 'geojson', data: flood });
            m.addSource('footprints', { type: 'geojson', data: bld });
            m.addSource('roads', { type: 'geojson', data: rd });
            m.addSource('selected', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] },
            });
            m.addLayer({
              id: 'municipio-fill',
              type: 'fill',
              source: 'municipio',
              paint: { 'fill-color': '#91caac', 'fill-opacity': 0.07 },
            });
            m.addLayer({
              id: 'flood-fill',
              type: 'fill',
              source: 'flood',
              filter: ['==', ['get', 'SFHA_TF'], 'T'],
              paint: {
                'fill-color': [
                  'case',
                  ['==', ['get', 'FLD_ZONE'], 'VE'],
                  '#5378d5',
                  ['==', ['get', 'SFHA_TF'], 'T'],
                  '#2499c5',
                  '#d6a548',
                ],
                'fill-opacity': 0.4,
              },
            });
            m.addLayer({
              id: 'flood-outline',
              type: 'line',
              source: 'flood',
              filter: ['==', ['get', 'SFHA_TF'], 'T'],
              paint: {
                'line-color': '#3d9fba',
                'line-width': 0.6,
                'line-opacity': 0.7,
              },
            });
            m.addLayer({
              id: 'pilot-roads',
              type: 'line',
              source: 'roads',
              paint: {
                'line-color': [
                  'case',
                  ['get', 'exposureHigh'],
                  '#b35037',
                  '#fff9e9',
                ],
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  11,
                  0.7,
                  15,
                  2.5,
                ],
                'line-opacity': 0.9,
              },
            });
            m.addLayer({
              id: 'pilot-buildings',
              type: 'fill-extrusion',
              source: 'footprints',
              paint: {
                'fill-extrusion-color': [
                  'case',
                  ['get', 'exposureHigh'],
                  '#eead65',
                  '#dce5e0',
                ],
                'fill-extrusion-height': [
                  'coalesce',
                  ['get', 'render_height'],
                  5,
                ],
                'fill-extrusion-base': [
                  'coalesce',
                  ['get', 'render_min_height'],
                  0,
                ],
                'fill-extrusion-opacity': 0.95,
              },
            });
            m.addLayer({
              id: 'municipio-line',
              type: 'line',
              source: 'municipio',
              paint: {
                'line-color': '#b7f578',
                'line-width': 2,
                'line-dasharray': [3, 2],
              },
            });
            m.addLayer({
              id: 'selected-line',
              type: 'line',
              source: 'selected',
              paint: { 'line-color': '#f4fb55', 'line-width': 4 },
            });
            m.addSource('access-screening', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] },
            });
            m.addLayer({
              id: 'access-radius',
              type: 'line',
              source: 'access-screening',
              filter: ['==', ['get', 'kind'], 'radius'],
              paint: {
                'line-color': '#ffffff',
                'line-width': 2,
                'line-dasharray': [3, 3],
              },
            });
            m.addLayer({
              id: 'access-roads-halo',
              type: 'line',
              source: 'access-screening',
              filter: ['==', ['get', 'kind'], 'road'],
              paint: { 'line-color': '#092330', 'line-width': 8 },
            });
            m.addLayer({
              id: 'access-roads',
              type: 'line',
              source: 'access-screening',
              filter: ['==', ['get', 'kind'], 'road'],
              paint: { 'line-color': '#ffffff', 'line-width': 4 },
            });
            m.addSource('facilities', { type: 'geojson', data: facilityData });
            m.addLayer({
              id: 'facility-points',
              type: 'circle',
              source: 'facilities',
              paint: {
                'circle-radius': 7,
                'circle-color': [
                  'match',
                  ['get', 'kind'],
                  'shelter',
                  '#b7f578',
                  'siren',
                  '#ce9aff',
                  'health',
                  '#ff9fbd',
                  'fire',
                  '#ffad66',
                  '#9bdcff',
                ],
                'circle-stroke-color': [
                  'case',
                  ['get', 'exposureHigh'],
                  '#ff6f47',
                  '#0c2533',
                ],
                'circle-stroke-width': 2,
              },
            });
            m.addLayer({
              id: 'selected-point',
              type: 'circle',
              source: 'selected',
              filter: ['==', ['geometry-type'], 'Point'],
              paint: {
                'circle-radius': 12,
                'circle-color': '#ffffff',
                'circle-opacity': 0.15,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 3,
              },
            });
            m.on('click', (e) => {
              const layers = [
                'facility-points',
                'pilot-buildings',
                'pilot-roads',
                'flood-fill',
              ].filter(
                (id) => m.getLayoutProperty(id, 'visibility') !== 'none',
              );
              const hits = m.queryRenderedFeatures(e.point, { layers });
              if (!hits.length) {
                setSelection(null);
                return;
              }
              const f =
                hits.find((hit) => hit.layer.id === 'facility-points') ||
                hits[0];
              setSelection({
                kind:
                  f.layer.id === 'facility-points'
                    ? 'facility'
                    : f.layer.id === 'pilot-buildings'
                      ? 'building'
                      : f.layer.id === 'pilot-roads'
                        ? 'road'
                        : 'flood',
                properties: f.properties,
              });
              (m.getSource('selected') as GeoJSONSource).setData({
                type: 'Feature',
                properties: {},
                geometry: f.geometry,
              });
            });
            m.on('mousemove', (e) => {
              m.getCanvas().style.cursor = m.queryRenderedFeatures(e.point, {
                layers: [
                  'facility-points',
                  'pilot-buildings',
                  'pilot-roads',
                  'flood-fill',
                ],
              }).length
                ? 'pointer'
                : '';
            });
            setReady(true);
          } catch (err) {
            console.error(err);
            setError(true);
          }
        });
      } catch (err) {
        if (!disposed) {
          console.error(err);
          setError(true);
        }
      }
    })();
    return () => {
      disposed = true;
      controller.abort();
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!ready || !map.current) return;
    const m = map.current;
    const filter: FilterSpecification =
      view === 'high'
        ? ['==', ['get', 'SFHA_TF'], 'T']
        : [
            'any',
            ['==', ['get', 'SFHA_TF'], 'T'],
            ['in', '0.2 PCT', ['coalesce', ['get', 'ZONE_SUBTY'], '']],
          ];
    for (const id of ['flood-fill', 'flood-outline']) {
      m.setFilter(id, filter);
      m.setLayoutProperty(
        id,
        'visibility',
        view === 'none' ? 'none' : 'visible',
      );
    }
    const exposed: import('maplibre-gl').ExpressionSpecification =
      view === 'extended'
        ? ['any', ['get', 'exposureHigh'], ['get', 'exposureModerate']]
        : ['get', 'exposureHigh'];
    m.setPaintProperty(
      'pilot-buildings',
      'fill-extrusion-color',
      view === 'none' ? '#dce5e0' : ['case', exposed, '#eead65', '#dce5e0'],
    );
    m.setPaintProperty(
      'pilot-roads',
      'line-color',
      view === 'none' ? '#fff9e9' : ['case', exposed, '#b35037', '#fff9e9'],
    );
  }, [view, ready]);
  useEffect(() => {
    if (!ready || !map.current) return;
    map.current.setLayoutProperty(
      'pilot-buildings',
      'visibility',
      buildings ? 'visible' : 'none',
    );
    map.current.setLayoutProperty(
      'pilot-roads',
      'visibility',
      roads ? 'visible' : 'none',
    );
    map.current.setTerrain(
      terrain && is3d ? { source: 'dem', exaggeration: 1 } : null,
    );
    map.current.easeTo({ pitch: is3d ? 52 : 0, duration: 650 });
    map.current.setPaintProperty(
      'pilot-buildings',
      'fill-extrusion-height',
      is3d ? ['coalesce', ['get', 'render_height'], 5] : 0,
    );
  }, [ready, buildings, roads, terrain, is3d]);
  useEffect(() => {
    if (!ready || !map.current) return;
    map.current.setFilter(
      'facility-points',
      category === 'all' ? null : ['==', ['get', 'kind'], category],
    );
    map.current.setLayoutProperty(
      'facility-points',
      'visibility',
      facilitiesVisible ? 'visible' : 'none',
    );
    map.current.setPaintProperty(
      'facility-points',
      'circle-stroke-color',
      view === 'none'
        ? '#0c2533'
        : [
            'case',
            view === 'extended'
              ? ['any', ['get', 'exposureHigh'], ['get', 'exposureModerate']]
              : ['get', 'exposureHigh'],
            '#ff6f47',
            '#0c2533',
          ],
    );
  }, [ready, category, facilitiesVisible, view]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const shelterId =
      selection?.kind === 'facility' && selection.properties.kind === 'shelter'
        ? selection.properties.id
        : null;
    (map.current.getSource('access-screening') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features:
        accessData?.features.filter(
          (f) => f.properties?.shelterId === shelterId,
        ) || [],
    });
    map.current.setPaintProperty(
      'access-roads',
      'line-color',
      view === 'none'
        ? '#ffffff'
        : [
            'case',
            view === 'extended'
              ? ['any', ['get', 'exposureHigh'], ['get', 'exposureModerate']]
              : ['get', 'exposureHigh'],
            '#ff914d',
            '#ffffff',
          ],
    );
  }, [selection, accessData, ready, view]);
  const selectFacility = (f: Facility) => {
    setFacilitiesVisible(true);
    setSelection({ kind: 'facility', properties: f.properties });
    (map.current?.getSource('selected') as GeoJSONSource | undefined)?.setData(
      f,
    );
    map.current?.flyTo({
      center: f.geometry.coordinates as [number, number],
      zoom: 15.5,
      padding: {
        left: window.innerWidth > 1100 ? 340 : 0,
        right: window.innerWidth > 700 ? 310 : 0,
        top: 0,
        bottom: 100,
      },
    });
  };
  const inspect = useCallback(() => {
    const list = footprints.current?.features;
    const f = list?.find(
      (f) =>
        view === 'none' ||
        f.properties?.exposureHigh ||
        (view === 'extended' && f.properties?.exposureModerate),
    );
    if (!f || !map.current) return;
    const p = f.geometry.coordinates[0][0];
    setSelection({ kind: 'building', properties: f.properties || {} });
    (map.current.getSource('selected') as GeoJSONSource).setData(f);
    map.current.flyTo({
      center: [p[0], p[1]],
      zoom: 16,
      pitch: is3d ? 55 : 0,
      padding: {
        left: window.innerWidth > 700 ? 340 : 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    });
  }, [view, is3d]);
  const changeView = useCallback((v: View) => {
    setView(v);
    // Keep the inspected feature and its screening visible when comparing hazard views.
  }, []);
  useEffect(() => {
    type Tool = {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    };
    const ctx = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            opts: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!ctx) return;
    const ac = new AbortController();
    const register = (tool: Tool) => {
      try {
        Promise.resolve(ctx.registerTool(tool, { signal: ac.signal })).catch(
          console.error,
        );
      } catch (e) {
        console.error(e);
      }
    };
    register({
      name: 'set_hazard_view',
      description:
        'Select the visible Toa Baja FEMA hazard view. This changes map display only; it does not simulate a storm.',
      inputSchema: {
        type: 'object',
        properties: {
          view: { type: 'string', enum: ['none', 'high', 'extended'] },
        },
        required: ['view'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (input) => {
        const v = (input as { view?: unknown })?.view;
        if (!['none', 'high', 'extended'].includes(String(v)))
          throw new Error('view must be none, high, or extended');
        changeView(v as View);
        await new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        );
        return { view: v };
      },
    });
    register({
      name: 'get_exposure_summary',
      description:
        'Read the current selected hazard view and counts for downloaded map features. Counts are geometry intersections, not damage or population estimates.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => ({
        view,
        loaded: !!summary,
        mapReady: ready,
        mapSourceError: error,
        summary,
        scope: 'Toa Baja municipal boundary; snapshot coverage only',
      }),
    });
    return () => ac.abort();
  }, [view, summary, changeView, ready, error]);
  const count = summary && view !== 'none' ? summary.buildings[view] : null;
  const roadCount = summary && view !== 'none' ? summary.roads[view] : null;
  const download = () => {
    const data = {
      municipio: 'Toa Baja',
      view,
      retrievedAt: '2026-09-07',
      summary,
      limitations: c.coverage,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'toa-baja-exposure-summary.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="atlas">
      <div
        ref={host}
        className="map"
        aria-label={
          lang === 'en'
            ? 'Interactive map of Toa Baja'
            : 'Mapa interactivo de Toa Baja'
        }
      />
      <header className="topbar">
        <div className="brand">
          <Compass size={32} />
          <div>
            <span className="eyebrow">{c.eyebrow}</span>
            <h1>
              {c.title}
              <span className="dot">.</span>
            </h1>
          </div>
        </div>
        <div className="header-actions">
          <span className="pilot">{c.pilot}</span>
          <Button
            variant="secondary"
            onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
            aria-label={
              lang === 'en' ? 'Cambiar a español' : 'Switch to English'
            }
          >
            <Globe2 size={16} />
            {lang === 'en' ? 'ES' : 'EN'}
          </Button>
          <Button variant="secondary" onClick={() => setSources(true)}>
            <Info size={16} />
            <span className="desktop-label">{c.sources}</span>
          </Button>
        </div>
      </header>
      {!controls && (
        <Button className="show-controls" onClick={() => setControls(true)}>
          <Layers size={16} />
          {c.controls}
        </Button>
      )}
      {controls && (
        <section className="control-panel" aria-label={c.controls}>
          <button
            className="panel-close"
            onClick={() => setControls(false)}
            aria-label={c.collapse}
          >
            <X size={18} />
          </button>
          <span className="eyebrow">{c.pilot} / TOA BAJA</span>
          <h2>{c.intro}</h2>
          <p className="intro-copy">{c.sub}</p>
          <label className="section-label" id="hazard-label">
            <Waves size={16} />
            {c.hazard}
          </label>
          <Select
            value={view}
            onValueChange={(v) => {
              if (v) changeView(v as View);
            }}
            items={{ none: c.none, high: c.high, extended: c.extended }}
          >
            <SelectTrigger
              className="hazard-select"
              aria-labelledby="hazard-label"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{c.none}</SelectItem>
              <SelectItem value="high">{c.high}</SelectItem>
              <SelectItem value="extended">{c.extended}</SelectItem>
            </SelectContent>
          </Select>
          <p className="small hazard-note">
            {view === 'high'
              ? c.highNote
              : view === 'extended'
                ? c.extendedNote
                : c.noneNote}
          </p>
          <div className="section-label">
            <Layers size={16} />
            {c.layers}
          </div>
          <div className="layer-list">
            {[
              {
                id: 'facilities',
                icon: Building2,
                label:
                  lang === 'en'
                    ? 'Essential facilities'
                    : 'Infraestructura esencial',
                checked: facilitiesVisible,
                set: setFacilitiesVisible,
              },
              {
                id: 'buildings',
                icon: Building2,
                label: c.buildings,
                checked: buildings,
                set: setBuildings,
              },
              {
                id: 'roads',
                icon: Route,
                label: c.roads,
                checked: roads,
                set: setRoads,
              },
              {
                id: 'terrain',
                icon: Mountain,
                label: c.terrain,
                checked: terrain,
                set: setTerrain,
              },
            ].map((item) => (
              <label key={item.id} className="layer-row">
                <span>
                  <item.icon size={17} />
                  {item.label}
                </span>
                <Switch
                  checked={item.checked}
                  onCheckedChange={item.set}
                  disabled={item.id === 'terrain' && !is3d}
                  aria-label={item.label}
                />
              </label>
            ))}
          </div>
          <div className="view-buttons">
            <Button variant="secondary" onClick={() => setIs3d(!is3d)}>
              {is3d ? c.flat : c.three}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                map.current?.flyTo({
                  ...home,
                  pitch: is3d ? home.pitch : 0,
                  padding: { left: 0, right: 0, top: 0, bottom: 0 },
                });
                setSelection(null);
              }}
            >
              <RotateCcw size={15} />
              {c.reset}
            </Button>
          </div>
          <p className="small gesture-hint">{c.instructions}</p>
        </section>
      )}
      <section className="summary-panel" aria-label={c.exposure}>
        <Tabs defaultValue="facilities">
          <TabsList
            aria-label={
              lang === 'en' ? 'Inventory view' : 'Vista de inventario'
            }
          >
            <TabsTrigger value="facilities">
              {lang === 'en' ? 'Facilities' : 'Instalaciones'}
            </TabsTrigger>
            <TabsTrigger value="exposure">
              {lang === 'en' ? 'Buildings' : 'Edificios'}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="facilities">
            <FacilityList
              items={facilities}
              lang={lang}
              category={category}
              onCategory={setCategory}
              onSelect={selectFacility}
              ready={ready}
              view={view}
            />
          </TabsContent>
          <TabsContent value="exposure">
            <div className="summary-heading">
              <span className="eyebrow">{c.snapshot}</span>
              <span className="live-dot" />{' '}
              <span className="small">30 AUG 2026</span>
            </div>
            <h3>{c.exposure}</h3>
            {view === 'none' ? (
              <p>{c.noFlood}</p>
            ) : (
              <>
                <div className="big-stat" aria-live="polite">
                  {count !== null ? number(count) : '—'}
                  <span>
                    <Building2 size={23} />
                  </span>
                </div>
                <p className="stat-label">{c.overlap}</p>
                <div className="stat-rule" />
                <div className="summary-row">
                  <strong>
                    {summary ? number(summary.buildings.total) : '—'}
                  </strong>
                  <span>{c.total}</span>
                </div>
                <div className="summary-row">
                  <strong>
                    {roadCount !== null ? number(roadCount) : '—'}
                  </strong>
                  <span>{c.segments}</span>
                </div>
              </>
            )}
            <p className="small coverage-note">{c.coverage}</p>
            <div className="summary-actions">
              <Button variant="outline" disabled={!ready} onClick={inspect}>
                <Eye size={15} />
                {c.inspect}
              </Button>
              <Button
                size="icon"
                variant="outline"
                disabled={!summary}
                onClick={download}
                aria-label={c.download}
              >
                <Download size={16} />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </section>
      {selection && (
        <section className="detail-panel" aria-label={c.detail}>
          <button
            className="panel-close"
            onClick={() => {
              setSelection(null);
              (
                map.current?.getSource('selected') as GeoJSONSource | undefined
              )?.setData({ type: 'FeatureCollection', features: [] });
            }}
            aria-label={c.close}
          >
            <X size={18} />
          </button>
          <span className="eyebrow">{c.detail}</span>
          {selection.kind === 'facility' ? (
            <>
              {selection.properties.kind === 'shelter' && (
                <AccessScreening
                  data={accessData}
                  shelterId={String(selection.properties.id)}
                  shelterName={String(selection.properties.name)}
                  view={view}
                  lang={lang}
                  error={accessError}
                />
              )}
              <FacilityDetails
                lang={lang}
                facility={facilities.find(
                  (f) => f.properties.id === selection.properties.id,
                )!}
              />
            </>
          ) : (
            <>
              <h3>
                {selection.kind === 'building'
                  ? c.footprint
                  : selection.kind === 'road'
                    ? c.road
                    : c.flood}
              </h3>
              <dl>
                <dt>{selection.kind === 'flood' ? c.floodZone : c.id}</dt>
                <dd>
                  {String(
                    selection.properties[
                      selection.kind === 'flood' ? 'FLD_ZONE' : 'id'
                    ] || c.nodata,
                  )}
                </dd>
                {selection.kind === 'building' && (
                  <>
                    <dt>{c.height}</dt>
                    <dd>
                      {String(selection.properties.render_height ?? 5)} m{' '}
                      <small>{c.estimated}</small>
                    </dd>
                  </>
                )}
                {selection.kind !== 'flood' && (
                  <>
                    <dt>{c.zone}</dt>
                    <dd>
                      {String(selection.properties.zoneLabels || c.nodata)}
                    </dd>
                  </>
                )}
                {selection.kind === 'flood' && (
                  <>
                    <dt>{c.bfe}</dt>
                    <dd>
                      {Number(selection.properties.STATIC_BFE) > -1000
                        ? `${selection.properties.STATIC_BFE} ${selection.properties.LEN_UNIT || ''} (${selection.properties.V_DATUM || ''})`
                        : c.nodata}
                    </dd>
                    <dt>DFIRM / SOURCE_CIT</dt>
                    <dd>
                      {String(selection.properties.DFIRM_ID)} /{' '}
                      {String(selection.properties.SOURCE_CIT)}
                    </dd>
                  </>
                )}
              </dl>
            </>
          )}
        </section>
      )}
      <div className="map-caption">
        <span className="legend-swatch boundary" />
        <span>Toa Baja</span>
        {view !== 'none' && (
          <>
            <span className="legend-swatch flood" />
            <span>A / AE</span>
            <span className="legend-swatch coast" />
            <span>VE</span>
            {view === 'extended' && (
              <>
                <span className="legend-swatch moderate" />
                <span>0.2%</span>
              </>
            )}
            <span className="legend-swatch building" />
            <span>
              {lang === 'en'
                ? 'Intersecting footprint'
                : 'Huella que intersecta'}
            </span>
          </>
        )}
      </div>
      <div className="status-pill" role="status">
        {error ? (
          <>
            <Info size={15} />
            {c.error}
            <button onClick={() => window.location.reload()}>{c.retry}</button>
          </>
        ) : !ready ? (
          c.loading
        ) : (
          <>
            <Mountain size={15} />
            {c.ready} · 1×
          </>
        )}
      </div>
      <footer className="bottom-note">
        <span>{c.notice}</span>
        <button onClick={() => setSources(true)}>
          {c.independent}
          <ArrowUpRight size={13} />
        </button>
      </footer>
      <Dialog open={sources} onOpenChange={setSources}>
        <DialogContent className="sources-dialog">
          <DialogTitle className="source-title">{c.methodTitle}</DialogTitle>
          <DialogDescription>{c.methodDesc}</DialogDescription>
          <div className="source-body">
            <h4>{c.boundary}</h4>
            <p>
              {c.boundaryDesc}{' '}
              <a
                href="https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1"
                target="_blank"
                rel="noreferrer"
              >
                Census TIGERweb ↗
              </a>
            </p>
            <h4>FEMA NFHL</h4>
            <p>
              {c.floodDesc}{' '}
              <a
                href="https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28"
                target="_blank"
                rel="noreferrer"
              >
                FEMA ↗
              </a>
            </p>
            <h4>
              {c.buildings} / {c.roads}
            </h4>
            <p>
              {c.buildingDesc}{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
              >
                © OpenStreetMap contributors · ODbL ↗
              </a>
            </p>
            <h4>{c.terrain}</h4>
            <p>
              {c.terrainDesc}{' '}
              <a
                href="https://registry.opendata.aws/terrain-tiles/"
                target="_blank"
                rel="noreferrer"
              >
                AWS Open Data ↗
              </a>
            </p>
            <h4>{c.method}</h4>
            <p>{c.methodText}</p>
            <h4>{c.next}</h4>
            <p>
              {lang === 'en'
                ? 'The facility inventory combines PRDOH’s 2026 shelter designation, municipal 2025 shelter and siren GIS, and historical facilities from the 2024 mitigation plan (2019 inventory). Each point links to its source. Point-in-polygon exposure does not establish damage, safe access or operating status. Water assets, current capacity, live operations and field confirmation remain gaps.'
                : 'El inventario combina refugios designados por Vivienda en 2026, SIG municipal de 2025 y ubicaciones históricas del plan de mitigación de 2024 (inventario de 2019). Cada punto enlaza a su fuente. La exposición puntual no establece daños, acceso seguro ni operación. Faltan activos de agua, capacidad actual y confirmación de campo.'}
            </p>
            <a
              href="https://recuperacion.pr.gov/en/risk-and-asset-data-collection-program/"
              target="_blank"
              rel="noreferrer"
            >
              {c.readMore} ↗
            </a>
            <p className="small">{c.independent}</p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
