import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { isMunicipio, municipalities } from '@/lib/municipalities';
import { effectiveInventory } from '@/lib/inventory-server';
export const dynamic = 'force-dynamic';
export default async function Briefing({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio } = await params;
  if (!isMunicipio(municipio)) notFound();
  return <ProtectedBriefing municipio={municipio} />;
}
async function ProtectedBriefing({
  municipio,
}: {
  municipio: 'toa-baja' | 'catano';
}) {
  if (!(await headers()).get('oai-authenticated-user-id'))
    redirect(
      '/signin-with-chatgpt?return_to=' +
        encodeURIComponent('/municipios/' + municipio + '/briefing'),
    );
  const m = municipalities[municipio],
    facilities = effectiveInventory([], municipio).facilities.features.filter(
      (f) => f.properties.kind === 'shelter',
    );
  return (
    <main className="welcome briefing">
      <a href={'/municipios/' + municipio}>← Volver al mapa / Back to map</a>
      <section className="welcome-hero">
        <p className="eyebrow">VALIDACIÓN MUNICIPAL · 7 SEP. 2026</p>
        <h1>{m.name}</h1>
        <p>
          Inventario original para revisión documental. Confirme nombre,
          ubicación, estado operativo y capacidad con la entidad responsable. No
          constituye una evaluación de seguridad ni una lista de refugios
          abiertos.
        </p>
      </section>
      <h2>Cómo responder</h2>
      <ol>
        <li>
          En la cola de revisión, descargue la hoja de respuesta CSV del
          municipio.
        </li>
        <li>
          Complete solo los campos de respuesta. Conserve los identificadores de
          refugio y los encabezados.
        </li>
        <li>
          Incluya revisor / organización, fecha de observación y un enlace a la
          evidencia. Deje sin confirmar lo que no pueda verificar.
        </li>
        <li>
          Importe el CSV y revise la vista previa. Guardar crea propuestas;
          aprobar cambios requiere una acción independiente.
        </li>
      </ol>
      <p>
        Las coordenadas de Cataño provienen de los lugares enlazados por PRDOH,
        consultados el 7 de septiembre de 2026. Requieren verificación de campo.
        La designación de 2026 no confirma operación actual.
      </p>
      {facilities.map((f) => (
        <article key={f.properties.id}>
          <h2>{f.properties.name}</h2>
          <p>
            {f.properties.id} · {f.geometry.coordinates[1].toFixed(6)},{' '}
            {f.geometry.coordinates[0].toFixed(6)}
          </p>
          <p>
            Pendiente: confirmar nombre, coordenadas, operación, capacidad y
            fecha de observación.
          </p>
          <p>{f.properties.vintage}</p>
          {f.properties.sources.map((s) => (
            <p key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label} ↗
              </a>
            </p>
          ))}
        </article>
      ))}
      <footer>
        Use la función Imprimir del navegador para guardar esta guía como PDF.
        El mapa muestra intersecciones geométricas con zonas FEMA; no estima
        profundidad, daños ni transitabilidad.
      </footer>
    </main>
  );
}
