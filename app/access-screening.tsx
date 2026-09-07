'use client';
import type { FeatureCollection } from 'geojson';
export function AccessScreening({
  data,
  shelterId,
  shelterName,
  view,
  lang,
  error,
}: {
  data: FeatureCollection | null;
  shelterId: string;
  shelterName: string;
  view: string;
  lang: 'en' | 'es';
  error: boolean;
}) {
  const es = lang === 'es',
    roads =
      data?.features.filter(
        (f) =>
          f.properties?.shelterId === shelterId &&
          f.properties?.kind === 'road',
      ) || [];
  const count = roads.filter(
    (f) =>
      f.properties?.exposureHigh ||
      (view === 'extended' && f.properties?.exposureModerate),
  ).length;
  return (
    <section
      className="access-screening"
      aria-label={es ? 'Evaluación preliminar de acceso' : 'Access screening'}
    >
      <h3>{shelterName}</h3>
      <h4>
        {es ? 'Acceso · entorno de 500 m' : 'Access · 500 m surroundings'}
      </h4>
      <p className="access-result" aria-live="polite">
        {error
          ? es
            ? 'No se pudo cargar la evaluación. Recargue la página.'
            : 'Screening could not load. Reload the page.'
          : !data
            ? es
              ? 'Cargando evaluación…'
              : 'Loading screening…'
            : !roads.length
              ? es
                ? 'No hay vías en esta muestra dentro de 500 m.'
                : 'No roads in this snapshot within 500 m.'
              : view === 'none'
                ? es
                  ? `${roads.length} registros viales cercanos. Seleccione una vista de inundación.`
                  : `${roads.length} nearby road records. Select a flood hazard view.`
                : es
                  ? `${count} de ${roads.length} registros viales intersectan las zonas seleccionadas dentro de 500 m.`
                  : `${count} of ${roads.length} road records intersect selected zones within 500 m.`}
      </p>
      <p className="small">
        {es
          ? 'Naranja: registros con intersección en alguna de sus porciones recortadas. Blanco: sin intersección en las zonas seleccionadas. Línea discontinua: radio aproximado de 500 m.'
          : 'Orange: records with an intersection somewhere in their clipped portions. White: no intersection with selected zones. Dashed line: approximate 500 m radius.'}
      </p>
      <p className="small">
        {es
          ? 'Distancia en línea recta, no distancia de viaje. Los registros pueden contener varios tramos. No confirma cierres, conectividad, inundación de puentes ni acceso seguro. Cero intersecciones no implica seguridad. Cobertura vial incompleta; requiere revisión local.'
          : 'Straight-line distance, not travel distance. Records can contain several road sections. Does not confirm closures, connectivity, bridge flooding or safe access. Zero intersections does not establish safety. Road coverage is incomplete; local review is needed.'}
      </p>
      <div className="facility-sources">
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap / OpenFreeMap ↗
        </a>
        <a
          href="https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28"
          target="_blank"
          rel="noreferrer"
        >
          FEMA NFHL ↗
        </a>
      </div>
    </section>
  );
}
