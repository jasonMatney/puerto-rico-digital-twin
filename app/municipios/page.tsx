import { DataReadiness } from '@/app/data-readiness';
import type { Municipio } from '@/lib/municipalities';
import { Compass, ArrowUpRight } from 'lucide-react';
import { municipalities } from '@/lib/municipalities';
export const dynamic = 'force-dynamic';
export default async function Municipalities() {
  return (
    <main className="welcome">
      <header>
        <a className="welcome-brand" href="/">
          <Compass /> PUERTO RICO / DIGITAL TWIN
        </a>
        <span>Open prototype · No sign-in required</span>
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
          review history. Demo reviews are saved separately for this browser.
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
