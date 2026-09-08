import data from '../public/data/readiness.json';
import type { Municipio } from '@/lib/municipalities';
export function DataReadiness({
  municipio,
  lang = 'en',
  compact = false,
}: {
  municipio: Municipio;
  lang?: 'en' | 'es';
  compact?: boolean;
}) {
  const d = data[municipio],
    es = lang === 'es';
  const labels = es
    ? ['Refugios', 'Policía', 'Bomberos', 'Salud', 'Sirenas']
    : ['Shelters', 'Police', 'Fire', 'Health', 'Sirens'];
  return (
    <section
      className={'data-readiness ' + (compact ? 'compact' : '')}
      aria-label={
        es ? 'Cobertura y datos pendientes' : 'Coverage and data gaps'
      }
    >
      <h3>{es ? 'Cobertura y datos pendientes' : 'Coverage & data gaps'}</h3>
      <p>
        {es ? 'Inventario de fuentes' : 'Source inventory'} · {d.asOf}
      </p>
      <dl>
        {Object.entries(d.counts).map(([kind, count], i) => (
          <div key={kind}>
            <dt>{labels[i]}</dt>
            <dd>
              {count
                ? `${count} ${es ? 'puntos' : 'points'}`
                : es
                  ? 'Sin cartografiar'
                  : 'Not mapped'}
            </dd>
          </div>
        ))}
      </dl>
      <p>
        {es
          ? 'Los conteos no establecen cobertura completa ni preparación para emergencias.'
          : 'Counts do not establish complete coverage or emergency readiness.'}
      </p>
      {!compact && (
        <>
          <h4>{es ? 'Base documental' : 'Evidence basis'}</h4>
          <ul>
            {(es ? d.basisEs : d.basis).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </>
      )}
      <h4>{es ? 'Pendiente de validar' : 'Still to validate'}</h4>
      <ul>
        {(es ? d.gapsEs : d.gaps).map((s) => (
          <li key={s}>{s}</li>
        ))}
        <li>
          {es
            ? 'Estado operativo actual y capacidad sin validar para este inventario.'
            : 'Current operating status and capacity unvalidated for this inventory.'}
        </li>
      </ul>
      {!compact && (
        <p>
          {es
            ? 'Este resumen describe el inventario original. Las revisiones de este navegador se muestran en cada registro.'
            : 'This summary describes the original inventory. Browser workspace reviews appear on individual records.'}
        </p>
      )}
    </section>
  );
}
