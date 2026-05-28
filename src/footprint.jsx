// footprint.jsx, "500/600 · Who is the tenant?" research overlay.
// Chart-heavy presentation about the lettability of a 5,000-6,000 sqft
// floorplate in central London, the premium rent it commands, the AI
// demand pipeline at King's Cross, and how those map onto 1820 Goods Way.
//
// Mirrors the Calculator's overlay pattern. Opened from a topbar button.

import React from "react";
import { Logo, Eyebrow } from "./placeholder.jsx";

// ─── DATA ──────────────────────────────────────────────────────────────

// Savills Central London Office Market Watch, sub-5,000 sqft share of supply.
const SUPPLY_SERIES = [
  { q: "Q1 25", pct: 48 },
  { q: "Q2 25", pct: 53 },
  { q: "Q3 25", pct: 49 },
  { q: "Q4 25", pct: 50 },
  { q: "Q1 26", pct: 51 },
];

// GPE Fully Managed. H2 2025 / Q1 2026 disclosures.
const PREMIUM_DEALS = [
  { name: "170 Piccadilly",     rent: 296, premium: null, floors: "0.8–4.5k sqft" },
  { name: "141 Wardour Street", rent: 279, premium: "+13.3% vs ERV", floors: "2.3–4.6k sqft" },
  { name: "Recent H2 25",       rent: 236, premium: "+9.7% vs ERV · 74% cash uplift", floors: "38,400 sqft" },
  { name: "31 Alfred Place",    rent: 222, premium: "+5.4% vs ERV", floors: "24,500 sqft" },
  { name: "Recent H2 25",       rent: 215, premium: "112% cash uplift vs Ready-to-Fit", floors: "33,500 sqft" },
  { name: "6 St Andrew Street", rent: 203, premium: null, floors: "boutique floors" },
  { name: "City Tower EC2",     rent: 186, premium: "+6.6% vs ERV", floors: "phase 1" },
];

// AI demand at King's Cross. Knight Frank / CoStar / press, May 2026.
const AI_STATS = [
  { val: "450k sqft", lbl: "AI lettings in London. May 2026", sub: ">10× the 2025 monthly average of 40k sqft" },
  { val: "1m sqft+",  lbl: "AI leases in London since Jan 2025", sub: "Knight Frank, May 2026" },
  { val: "88,500 sqft", lbl: "OpenAI's first permanent UK office", sub: "King's Cross · capacity for 544 people · Endurance Land, April 2026" },
];

const AI_TENANTS = [
  "OpenAI", "Google DeepMind", "Anthropic*", "Synthesia",
  "Wayve", "Isomorphic Labs", "Scale AI", "Prometheus",
];

// Tenant profile cards.
const TENANT_PROFILES = [
  { tag: "Boutique", name: "Creative + design agencies",
    desc: "Brand, advertising, design studios, whole-floor identity is the product. 20–50 staff. £/sqft is justified by client-facing image." },
  { tag: "Tech",     name: "Mid-stage scale-ups",
    desc: "Series B–C, 30–80 people. Outgrowing co-working, not yet ready for a single 30k-sqft floor. King's Cross AI cluster gravity." },
  { tag: "AI",       name: "AI scale-ups below the top tier",
    desc: "Synthesia / Wayve / Isomorphic-shaped, clustering near OpenAI/Anthropic/DeepMind. Need talent proximity, not compute infrastructure." },
  { tag: "Finance",  name: "Specialist finance + wealth",
    desc: "Single-tenant privacy on a clean floor. Premium per-sqft tolerance. Likes a building with a strong address." },
  { tag: "Services", name: "Architecture, engineering, consulting",
    desc: "Practices that brand the building as theirs. Whole-floor identity, daylight on three sides, sustainability story for ESG." },
  { tag: "HQ",       name: "International UK headquarters",
    desc: "European or US brand looking for a London identity floor, not a vast HQ, but a credible one. Character matters." },
];

const MATCH_PAIRS = [
  ["Whole-floor identity",           "A single coherent plate per tenant. The floor reads as theirs, not as a sublet of someone else's space."],
  ["Light + air",                    "Daylight on multiple sides, generous ceiling heights, depth of view from inside."],
  ["Character",                      "Materials that age. An address with a story. A space worth being seen in."],
  ["ESG / sustainability narrative", "Low embodied carbon, recycled materials, published EPDs, the building supports the tenant's own reporting."],
  ["Transport + amenity",            "Major termini at the door (St Pancras + King's Cross), walkable culture and food, the canal."],
  ["A signature element",            "Something distinctive about the place, a roof, a room, a moment, that becomes part of the tenant's identity."],
];

// ─── HELPERS ───────────────────────────────────────────────────────────
function fmt(n) {
  return n.toLocaleString();
}

// ─── COMPONENTS ────────────────────────────────────────────────────────

function FpStat({ val, lbl, sub, accent }) {
  return (
    <div className={"fp-stat" + (accent ? " fp-stat--accent" : "")}>
      <div className="fp-stat__val">{val}</div>
      <div className="fp-stat__lbl">{lbl}</div>
      {sub ? <div className="fp-stat__sub mono">{sub}</div> : null}
    </div>
  );
}

// Bar chart, vertical bars of supply % by quarter.
function SupplyChart() {
  const max = 60; // y-axis ceiling
  return (
    <div className="fp-chart fp-chart--supply">
      <div className="fp-chart__head">
        <span className="mono">Sub-5,000 sqft share of central London office supply</span>
        <span className="mono fp-chart__src">Source · Savills Central London Office Market Watch · Q1 25 → Q1 26</span>
      </div>
      <div className="fp-chart__bars">
        {/* horizontal threshold line at 50% */}
        <div className="fp-chart__threshold" style={{ bottom: `${(50 / max) * 100}%` }}>
          <span className="mono">50%, half of all supply</span>
        </div>
        {SUPPLY_SERIES.map((d, i) => (
          <div className="fp-bar-col" key={i}>
            <div className="fp-bar-col__bar" style={{ height: `${(d.pct / max) * 100}%` }}>
              <span className="fp-bar-col__val mono">{d.pct}%</span>
            </div>
            <div className="fp-bar-col__lbl mono">{d.q}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bar chart, horizontal bars of £/sqft for GPE Fully Managed deals.
function PremiumChart() {
  const max = 320;
  return (
    <div className="fp-chart fp-chart--premium">
      <div className="fp-chart__head">
        <span className="mono">GPE Fully Managed · achieved £/sqft on boutique whole-floor lettings</span>
        <span className="mono fp-chart__src">Source · GPE H2 2025 / Q1 2026 disclosures</span>
      </div>
      <div className="fp-hbars">
        {PREMIUM_DEALS.map((d, i) => (
          <div className="fp-hbar" key={i}>
            <div className="fp-hbar__name">{d.name}</div>
            <div className="fp-hbar__track">
              <div className="fp-hbar__fill" style={{ width: `${(d.rent / max) * 100}%` }}>
                <span className="fp-hbar__val mono">£{d.rent}/sqft</span>
              </div>
            </div>
            <div className="fp-hbar__sub mono">
              {d.floors}{d.premium ? <> &nbsp;·&nbsp; <b style={{ color: "var(--accent)" }}>{d.premium}</b></> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="fp-chart__note mono">
        ERV = Estimated Rental Value (the institutional benchmark). Cash uplift quoted is per-deal vs an equivalent Ready-to-Fit lease.
      </div>
    </div>
  );
}

// ─── PAGES ─────────────────────────────────────────────────────────────

function FpIntro() {
  return (
    <section className="fp-section fp-section--intro">
      <Eyebrow>500/600 · Who is the tenant?</Eyebrow>
      <h1 className="fp-title">A 5,000–6,000 sqft floor is not the floor of big.<br/>It is the ceiling of small.</h1>
      <p className="fp-lead">
        A whole-floor plate of 5,000–6,000 sqft (~465–560 m²) sits at the apex of the
        dominant segment of the central London market, and where the most consistently
        growing rental story in London is happening right now.
      </p>
      <div className="fp-stats-row">
        <FpStat val="50%" lbl="of all central London office supply has sub-5,000 sqft floorplates" sub="Savills · five consecutive quarters" accent />
        <FpStat val="£186–296" lbl="per sqft achieved on GPE Fully Managed boutique floors" sub="6–13% above ERV · 74–112% cash uplift" />
        <FpStat val="450k sqft" lbl="leased by AI tenants in London. May 2026 alone" sub=">10× the 2025 monthly average" />
      </div>
    </section>
  );
}

function FpMarket() {
  return (
    <section className="fp-section">
      <div className="fp-section__head">
        <Eyebrow>The market</Eyebrow>
        <h2 className="fp-h2">Sub-5,000 sqft floorplates dominate central London supply.</h2>
      </div>
      <SupplyChart />
      <div className="fp-prose">
        <p>
          For five consecutive quarters. Q1 2025 to Q1 2026, between <b>48% and 53%</b> of
          all central London office supply has been in floorplates under 5,000 sqft.
          A 5,000 sqft floor is therefore at the upper end of the largest single segment of
          the market, not below an institutional threshold.
        </p>
        <p>
          And the segment is <em>letting</em>: <b>46% of the Q2 2025 sub-5k supply was already
          fitted</b>, reflecting demand for plug-and-play space.
          A 5,000 sqft whole-floor can let two ways: as a single coherent whole-floor occupation
          (the premium identity product), or split <b>2 × 2,500 sqft</b>, landing squarely in
          the heart of the smallest-tenant segment.
        </p>
      </div>
    </section>
  );
}

function FpPremium() {
  return (
    <section className="fp-section">
      <div className="fp-section__head">
        <Eyebrow>The premium</Eyebrow>
        <h2 className="fp-h2">Boutique whole-floors are the highest-yielding £/sqft product in central London.</h2>
      </div>
      <PremiumChart />
      <div className="fp-prose">
        <p>
          Great Portland Estates' Fully Managed product, across <b>five buildings</b> and
          ~<b>70,000 sqft</b> of recent lettings in H2 2025 / Q1 2026, is letting boutique
          whole-floors at <b>£186–296/sqft</b>, consistently <b>6–13% above ERV</b>, with
          cash-flow uplifts of <b>74–112%</b> versus equivalent Ready-to-Fit leases.
        </p>
        <p>
          The structural premium for a well-designed boutique floor is the most consistently
          growing rental story in central London right now.
          <em> A 5,000 sqft floor, let whole, or fitted-and-managed on the top floors, is
          exactly the product GPE has been demonstrating commands this premium.</em>
        </p>
      </div>
    </section>
  );
}

function FpAI() {
  return (
    <section className="fp-section">
      <div className="fp-section__head">
        <Eyebrow>The demand</Eyebrow>
        <h2 className="fp-h2">The AI cluster at King's Cross is the demand pipeline, at exactly this scale.</h2>
      </div>
      <div className="fp-stats-row fp-stats-row--ai">
        {AI_STATS.map((s, i) => (
          <FpStat key={i} val={s.val} lbl={s.lbl} sub={s.sub} accent={i === 0} />
        ))}
      </div>
      <div className="fp-prose">
        <p>
          OpenAI, Google DeepMind, Anthropic and a long tail of smaller AI scale-ups have
          made King's Cross / Euston / Bloomsbury the centre of gravity for AI office demand
          in the UK. CoStar's senior director of market analytics, Patrick Scanlon, called
          May 2026's surge <em>"a graduation moment"</em> for the sector.
        </p>
        <p className="fp-callout">
          <b>Critically</b>, Knight Frank confirmed: <em>"AI tenants are not asking for
          unusual infrastructure requirements, power capacity, cooling, connectivity. The
          compute is elsewhere, in data centres rather than central London floors."</em>
          The "AI needs big floors and heavy services" objection is dismantled by the actual
          market data.
        </p>
      </div>
      <div className="fp-tenants">
        <div className="fp-tenants__head mono">AI tenant pipeline at the cluster</div>
        <div className="fp-tenants__row">
          {AI_TENANTS.map((t, i) => (
            <span key={i} className="fp-tenant-chip mono">{t}</span>
          ))}
        </div>
        <div className="fp-tenants__note mono">
          * Anthropic's 158k commitment is at One Triton Square (Regent's Place), part of
          the wider Knowledge Quarter cluster around Euston/King's Cross, not the King's Cross
          Central estate proper.
        </div>
      </div>
    </section>
  );
}

function FpProfile() {
  return (
    <section className="fp-section">
      <div className="fp-section__head">
        <Eyebrow>The tenant</Eyebrow>
        <h2 className="fp-h2">Six profiles for a 5,000–6,000 sqft whole-floor in this market.</h2>
      </div>
      <div className="fp-grid">
        {TENANT_PROFILES.map((p, i) => (
          <div className="fp-card" key={i}>
            <div className="fp-card__tag mono">{p.tag}</div>
            <div className="fp-card__name">{p.name}</div>
            <div className="fp-card__desc">{p.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FpMatch() {
  return (
    <section className="fp-section">
      <div className="fp-section__head">
        <Eyebrow>The match</Eyebrow>
        <h2 className="fp-h2">What this tenant looks for.</h2>
      </div>
      <table className="fp-match">
        <thead>
          <tr>
            <th>Tenant priority</th>
            <th>What it means in practice</th>
          </tr>
        </thead>
        <tbody>
          {MATCH_PAIRS.map(([want, offer], i) => (
            <tr key={i}>
              <td className="fp-match__want">{want}</td>
              <td className="fp-match__offer">{offer}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function FpCaveats() {
  return (
    <section className="fp-section fp-section--caveats">
      <Eyebrow>Sources &amp; caveats</Eyebrow>
      <ul className="fp-sources mono">
        <li>Savills · Central London Office Market Watch · Q1 2025 → Q1 2026 (supply-side floorplate distribution)</li>
        <li>Great Portland Estates · 2025 / 2026 trading and full-year disclosures (Fully Managed achieved rents and ERV deltas)</li>
        <li>Knight Frank · HotMinute, May 2026 (AI office leasing aggregate and infrastructure note)</li>
        <li>CoStar · UK office data, May 2026, quoted in SEC Newgate and BBC News</li>
        <li>Endurance Land · April 2026 announcement of OpenAI King's Cross office (88,500 sqft)</li>
        <li>British Land · Q4 FY2026 trading update, 29 April 2026 (Anthropic at One Triton Square)</li>
        <li>The Architects' Journal · review of R7 Handyside Street, Morris+Company (structural commentary)</li>
        <li>BCO Guide to Specification 2023 (6.0 m and 7.5 m grids), IStructE Design for Zero / SCORS Table 2</li>
      </ul>
      <p className="fp-caveat">
        Supply-side data describes <em>availability</em>, not <em>take-up</em>. The deal-count
        distribution of sub-5,000 sqft transactions is broadly consistent (Savills and CBRE
        both confirm the segment as the largest by count) but comes from a separate cut of data.
        Cushman &amp; Wakefield's "London Moves" series explicitly tracks transactions over 5,000
        sqft, so its headline volumes <em>exclude</em> the segment this scheme is targeting.
        All figures are indicative; market conditions evolve quarter-to-quarter.
      </p>
    </section>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────

function Footprint500_600({ onClose }) {
  function doPrint() { window.print(); }
  return (
    <div className="fp">
      <header className="fp__head">
        <div className="fp__head-left">
          <Logo size="sm" />
          <div className="fp__head-doc mono">1820 Goods Way · 500/600 · Who is the tenant?</div>
        </div>
        <div className="fp__head-right">
          <button className="fp__btn" onClick={doPrint} title="Print or save as PDF">⎙ PDF</button>
          <button className="fp__btn fp__btn--primary" onClick={onClose}>← Back to document</button>
        </div>
      </header>

      <main className="fp__body">
        <FpIntro />
        <FpMarket />
        <FpPremium />
        <FpAI />
        <FpProfile />
        <FpMatch />
        <FpCaveats />
      </main>
    </div>
  );
}

export { Footprint500_600 };
