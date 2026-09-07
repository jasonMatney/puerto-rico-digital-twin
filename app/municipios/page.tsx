import { DataReadiness } from '@/app/data-readiness';
import type { Municipio } from '@/lib/municipalities';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Compass, ArrowUpRight } from 'lucide-react';
import { municipalities } from '@/lib/municipalities';
export const dynamic = 'force-dynamic';
export default async function Municipalities() {
  const h = await headers();
  if (!h.get('oai-authenticated-user-id'))
    redirect('/signin-with-chatgpt?return_to=%2Fmunicipios');
  return (
    <main className="welcome">
      <header>
        <a className="welcome-brand" href="/">
          <Compass /> PUERTO RICO / DIGITAL TWIN
        </a>
        <a href="/signout-with-chatgpt?return_to=%2F" target="_top">
          Sign out
        </a>
      </header>
      <section className="welcome-hero">
        <p className="eyebrow">MUNICIPAL WORKSPACES</p>
        <h1>
          Choose your
          <br />
          <em>municipality.</em>
        </h1>
        <p>
          Each workspace has its own geographic data, shelter inventory and
          review history. Your saved reviews belong to your account.
        </p>
      </section>
      <div className="municipality-cards">
        {Object.values(municipalities).map((m) => (
          <a
            className="municipality-card"
            href={'/municipios/' + m.slug}
            key={m.slug}
          >
            <span className="eyebrow">
              PILOT {m.pilot} / {m.geoid}
            </span>
            <h2>
              {m.name} <ArrowUpRight />
            </h2>
            <p>3D terrain · Buildings & roads · FEMA flood exposure</p>
            <p>
              {m.shelterIds.length} designated shelters · Evidence review &
              approval
            </p>
            <DataReadiness municipio={m.slug as Municipio} compact />
            <strong>Open workspace →</strong>
          </a>
        ))}
      </div>
      <footer>
        Source coverage varies by municipality. Shelter designation does not
        establish current operating status.
      </footer>
    </main>
  );
}
