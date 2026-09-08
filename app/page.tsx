import { Compass, ArrowUpRight } from 'lucide-react';
export const dynamic = 'force-dynamic';
export default async function Welcome() {
  return (
    <main className="welcome">
      <header>
        <a href="/" className="welcome-brand">
          <Compass size={28} /> PUERTO RICO / DIGITAL TWIN
        </a>
        <span>Independent research prototype</span>
      </header>
      <section className="welcome-hero">
        <p className="eyebrow">TERRITORY · EVIDENCE · RESILIENCE</p>
        <h1>
          Understand the place.
          <br />
          <em>Plan with evidence.</em>
        </h1>
        <p>
          Explore municipal terrain, buildings, roads and mapped flood exposure.
          Review shelter information, document its sources and approve
          corrections in a traceable workspace.
        </p>
        <a className="welcome-cta" href="/municipios">
          Choose a municipality <ArrowUpRight size={22} />
        </a>
        <p className="welcome-note">
          Open to everyone · No account required. Demo reviews stay in this
          browser workspace.
        </p>
      </section>
      <section className="welcome-details">
        <div>
          <span>01 / EXPLORE</span>
          <h2>A shared geographic view</h2>
          <p>
            See buildings and roads alongside FEMA hazard zones, with 3D terrain
            for context.
          </p>
        </div>
        <div>
          <span>02 / VERIFY</span>
          <h2>Keep evidence attached</h2>
          <p>
            Compare shelters, check nearby roads and collect dated information
            from data owners.
          </p>
        </div>
        <div>
          <span>03 / REVIEW</span>
          <h2>Make changes deliberately</h2>
          <p>
            Import responses, review proposed corrections and approve each
            change with its history.
          </p>
        </div>
      </section>
      <footer>
        Independent prototype · Not affiliated with PRDOH. Mapped exposure is
        not a storm forecast, damage estimate or safe-route assessment.
      </footer>
    </main>
  );
}
