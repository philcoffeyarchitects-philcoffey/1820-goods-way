// calculator.jsx — Design-side viability calculator (v3, mid-tender)
//
// Rebuilt around the deck's current scheme structure:
//   Path A = Previously Consented Stage 5 (by others, locked, reference baseline)
//   Path B = Coffey direction — picker over four variants:
//            Canopy G+6, Signal Box G+8, Canopy G+10 (hybrid), Signal Box G+10
//
// Cost is shown RELATIVE to the consented baseline (percentages, not raw £/m²)
// so the headline figures don't spook a non-technical reader. Raw figures
// are kept in a small caveat line for the analytical reader.
//
// Carbon keeps its absolute value (because LETI 2030 / RIBA 2030 / RIBA 2025
// thresholds are absolute), but the visual indicator is rebuilt: tier badge
// at the top, then three target rows with tick/cross and the gap.
//
// Numbers are mid-tender illustrative — swap in real Stage 2 cost-plan
// figures by editing the *_TOTAL_COST constants below.

import React from "react";
import { Logo, Eyebrow } from "./placeholder.jsx";

// ─── MATERIAL DATA ─────────────────────────────────────────────────────
const STRUCTURE = {
  "steel-clt":         { label: "Steel + CLT",          carbon: 305, biogenic:  -85, note: "Hybrid frame; biogenic CLT. LETI exemplar. Coffey recommended." },
  "steel-clt-reused":  { label: "Reused steel + CLT",   carbon: 165, biogenic:  -85, note: "Reclaimed structural steel + CLT. Sourcing premium." },
  "steel-comp":        { label: "Steel + composite",    carbon: 420, biogenic:    0, note: "Steel frame + composite metal-deck slab." },
  "rc":                { label: "RC concrete",          carbon: 575, biogenic:    0, note: "Reinforced concrete; CEM I cement, standard." },
  "rc-ggbs":           { label: "RC + GGBS",            carbon: 395, biogenic:    0, note: "70% GGBS cement replacement; ~30% lower carbon." },
  "full-clt":          { label: "Full CLT",             carbon: 215, biogenic: -170, note: "Mass timber throughout. Large biogenic sequestration; premium." },
};

const HEAVY = {
  "brick":                 { label: "Engineering brick",            carbon: 140, note: "Full bricks. The brick of Victorian canal infrastructure. Coffey recommended." },
  "brick-slip":            { label: "Brick slip on rail",           carbon:  95, note: "20mm slips on a carrier. Lower carbon, less honest at close range." },
  "stone-portland":        { label: "Portland limestone",           carbon:  85, note: "UK-quarried sedimentary. Low energy. A different vocabulary." },
  "stone-granite":         { label: "Granite (imported)",           carbon: 280, note: "Imported, high-energy cutting + shipping." },
  "precast":               { label: "Pre-cast concrete",            carbon: 240, note: "Reconstituted-stone PCC panels. Faster, lower cost." },
  "precast-ggbs":          { label: "Pre-cast + GGBS",              carbon: 145, note: "70% GGBS cement replacement." },
  "weathered-mild-steel":  { label: "Weathered mild steel",         carbon: 120, note: "Low-process mild steel patinated to a deep oxide finish. Reads heavy by colour, not mass." },
  "coloured-aluminium":    { label: "Coloured aluminium (recycled)", carbon: 180, note: "Recycled aluminium cassette in a deep brick-toned anodised / PPC finish. Reads heavy from distance." },
};

const LIGHT = {
  "al-recycled":    { label: "Aluminium, recycled (CIRCAL 75R)", carbon:  75, note: "75% recycled content. Coffey recommended." },
  "al-primary":     { label: "Aluminium, primary",                carbon: 310, note: "Standard cassette. Four times the embodied carbon of recycled." },
  "stainless":      { label: "Corrugated stainless",              carbon: 180, note: "316 grade, marine-suitable." },
  "corten":         { label: "Weathering steel (Corten)",         carbon:  95, note: "Self-finishing patina. Reads agricultural, not signal-box." },
  "zinc":           { label: "Zinc standing seam",                carbon: 105, note: "Pre-weathered VMZinc. Reads domestic at scale." },
  "al-mesh":        { label: "Aluminium mesh / perf",             carbon: 200, note: "Perforated screen. Less aluminium per m²." },
};

// Rest-of-build adder (MEP, fit-out, externals, fees, prelims) — held
// constant so the choices in this tool move structure + facade only.
const REST_CARBON = 220;          // kgCO₂e/m² GIA
const REST_COST   = 2400;         // £/m² GIA

// Operational carbon (kgCO₂e/m² GIA per year for a typical Cat A office)
// and assumed building life used for whole-life carbon.
const OPERATIONAL = { carbon: 28, life: 60 };

// Cost sensitivity band at RIBA Stage 2 (±10% typical).
const SENSITIVITY = 0.10;

// ─── SCHEME DEFINITIONS ────────────────────────────────────────────────
// The Stage 5 consented scheme is LOCKED. The Coffey directions are
// editable on material choices but their geometry (GIA, NIA, facade areas)
// is fixed.

// Design-side £/m² baseline used by calcCost as the starting rate from
// which structural and material premiums move. Mid-tender illustrative;
// swap to a Stage-2 cost-plan figure next week.
const CONSENTED_RATE = 2600;

const COFFEY_VARIANTS = {
  "canopy-g6": {
    key: "canopy-g6", label: "Canopy", long: "G+6 · Original Canopy study",
    note: "Low and wide. Roof at 54.53 m AOD. No basement. NMA planning only.",
    gia: 6119, nia: 4518,
    heavyArea: 2400, lightArea: 320,
  },
  "signal-box-g8": {
    key: "signal-box-g8", label: "Signal Box", long: "G+8 · Original Signal Box study",
    note: "Tall and slender. Roof at 58.18 m AOD. No basement. New planning required.",
    gia: 6731, nia: 4964,
    heavyArea: 2600, lightArea: 380,
  },
  "canopy-g10": {
    key: "canopy-g10", label: "Canopy", long: "G+10 · Hybrid · Our direction",
    note: "Slender footprint with a canopy at the foot. Apex 71.33 m AOD, just under the Kenwood House view line at 73.2 m.",
    gia: 8002, nia: 5984,
    heavyArea: 2700, lightArea: 420,
  },
  "signal-box-g10": {
    key: "signal-box-g10", label: "Signal Box", long: "G+10 · Our direction",
    note: "Slender tower with the lookout marking the crossing. Apex 71.98 m AOD, just under the Kenwood House view line at 73.2 m.",
    gia: 8051, nia: 6016,
    heavyArea: 2800, lightArea: 420,
  },
};

// Industry carbon targets — RIBA / LETI thresholds, kgCO₂e/m² GIA.
const TARGETS = [
  { name: "LETI 2030",        full: "LETI 2030 Office",        threshold: 500, tier: "best",    label: "Exemplary" },
  { name: "RIBA 2030",        full: "RIBA 2030 Office",        threshold: 750, tier: "pass",    label: "Pass"      },
  { name: "RIBA 2025",        full: "RIBA 2025 Office",        threshold: 970, tier: "minimum", label: "Minimum"   },
];

// Defaults: Coffey's recommended materials.
const COFFEY_DEFAULT_SPEC = { structure: "steel-clt", heavy: "brick", light: "al-recycled" };

// ─── HELPERS ───────────────────────────────────────────────────────────
function calcCarbon(scheme, spec, hasBasement) {
  const str = STRUCTURE[spec.structure];
  const heavy = HEAVY[spec.heavy];
  const light = LIGHT[spec.light];
  const basementC = hasBasement ? scheme.basement : 0;
  const designSide =
    str.carbon * scheme.gia +
    heavy.carbon * scheme.heavyArea +
    light.carbon * scheme.lightArea +
    basementC * scheme.gia;
  const biogenic = (str.biogenic || 0) * scheme.gia;
  const rest = REST_CARBON * scheme.gia;
  const total = designSide + rest;
  const operational = OPERATIONAL.carbon * OPERATIONAL.life * scheme.gia;
  const wholeLife = total + operational + biogenic;
  return {
    designSidePerM2: designSide / scheme.gia,
    totalPerM2: total / scheme.gia,
    biogenicPerM2: biogenic / scheme.gia,
    operationalPerM2: operational / scheme.gia,
    wholeLifePerM2: wholeLife / scheme.gia,
    breakdown: {
      structure: { lbl: str.label,   carbon: str.carbon * scheme.gia },
      heavy:     { lbl: heavy.label, carbon: heavy.carbon * scheme.heavyArea },
      light:     { lbl: light.label, carbon: light.carbon * scheme.lightArea },
      basement:  { lbl: hasBasement ? "Single basement" : null, carbon: basementC * scheme.gia },
      biogenic:  { lbl: str.biogenic ? "Biogenic sequestration (CLT)" : null, carbon: biogenic },
      rest:      { lbl: "MEP, fit-out, externals, fees, prelims", carbon: rest },
    },
  };
}

// Cost is held mid-tender illustrative. The consented scheme's £/m² is set
// directly; Coffey variants derive from the consented per-m² rate plus a
// modest design-side delta driven by structure + facade choices.
function calcCost(scheme, spec, hasBasement, consentedPerM2) {
  // Structural cost premium/discount per m² vs RC concrete baseline.
  const STR_DELTA = {
    "steel-clt":        250,    // hybrid frame
    "steel-clt-reused": 330,    // reclaimed steel premium
    "steel-comp":       100,    // steel + composite
    "rc":               0,      // baseline
    "rc-ggbs":          35,     // small premium for GGBS
    "full-clt":         600,    // mass timber premium
  };
  const HEAVY_DELTA = {
    "brick":                 0,        // baseline
    "brick-slip":           -250,
    "stone-portland":        400,
    "stone-granite":         650,
    "precast":              -150,
    "precast-ggbs":         -100,
    "weathered-mild-steel":  150,      // specialist patination + sourcing premium
    "coloured-aluminium":    75,       // mid-range cassette + colour finish
  };
  const LIGHT_DELTA = {
    "al-primary":     0,
    "al-recycled":    70,
    "stainless":      175,
    "corten":        -70,
    "zinc":           200,
    "al-mesh":       -70,
  };
  // Heavy/light deltas are roughly per-m² of facade area, normalised to
  // GIA via a typical facade-to-GIA ratio (~0.4 for these schemes).
  const FACADE_TO_GIA = 0.4;
  const strDelta   = STR_DELTA[spec.structure]   || 0;
  const heavyDelta = (HEAVY_DELTA[spec.heavy]    || 0) * FACADE_TO_GIA;
  const lightDelta = (LIGHT_DELTA[spec.light]    || 0) * FACADE_TO_GIA * 0.1;
  const basementDelta = hasBasement ? 410 : 0;
  const designSidePerM2 = consentedPerM2 + strDelta + heavyDelta + lightDelta + basementDelta;
  const totalPerM2 = designSidePerM2 + REST_COST;
  return {
    designSidePerM2,
    totalPerM2,
    designSideTotal: designSidePerM2 * scheme.gia,
    total:           totalPerM2     * scheme.gia,
    sensLow:  totalPerM2 * (1 - SENSITIVITY),
    sensHigh: totalPerM2 * (1 + SENSITIVITY),
  };
}

// Round to a "tidy" percentage — nearest 5%, with " < 5%" cap for tiny deltas.
function roundDelta(pct) {
  const rounded = Math.round(pct / 5) * 5;
  if (Math.abs(rounded) < 5) return "approximately the same";
  return (rounded > 0 ? "+" : "") + rounded + "%";
}
function deltaSign(pct) {
  if (Math.abs(pct) < 5) return "neutral";
  return pct > 0 ? "up" : "down";
}
function fmtMoneyApprox(n) {
  const abs = Math.abs(n);
  if (abs >= 1e6) return (n < 0 ? "−" : "") + "~£" + (abs / 1e6).toFixed(1) + "m";
  if (abs >= 1e3) return (n < 0 ? "−" : "") + "~£" + Math.round(abs / 1e3) + "k";
  return (n < 0 ? "−" : "") + "~£" + Math.round(abs);
}
function fmtSqM(n) { return Math.round(n).toLocaleString("en-GB") + " m²"; }

// Identify which tier a carbon value sits in.
function tierFor(value) {
  if (value <= TARGETS[0].threshold) return "best";
  if (value <= TARGETS[1].threshold) return "pass";
  if (value <= TARGETS[2].threshold) return "minimum";
  return "fail";
}
function tierLabel(t) {
  return { best: "LETI 2030 territory · exemplary",
           pass: "RIBA 2030 met · pass",
           minimum: "RIBA 2025 met · minimum",
           fail: "Above 2025 threshold" }[t];
}

// ─── COMPONENTS ────────────────────────────────────────────────────────

function MaterialButtons({ options, value, onChange, recommend }) {
  const keys = Object.keys(options);
  return (
    <div className="matgrid matgrid--c1">
      {keys.map((k) => {
        const o = options[k];
        const active = k === value;
        const isRec = k === recommend;
        return (
          <button
            key={k}
            type="button"
            className={"matbtn" + (active ? " is-active" : "")}
            onClick={() => onChange(k)}
            title={o.note || o.label}
          >
            <div className="matbtn__row">
              <span className="matbtn__lbl">
                {o.label}
                {isRec ? <span className="matbtn__tag matbtn__tag--rec">Recommended</span> : null}
              </span>
              <span className="matbtn__num">{o.carbon} <span className="matbtn__unit">kgCO₂e</span></span>
            </div>
            <div className="matbtn__row matbtn__row--sec">
              <span className="matbtn__note">{o.note}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CtrlGroup({ num, title, hint, options, selectedKey, onChange, recommend }) {
  const sel = options[selectedKey];
  return (
    <details className="ctrl-group">
      <summary className="ctrl-group__head">
        <span className="ctrl-group__num mono">{num}</span>
        <span className="ctrl-group__title">{title}</span>
        <span className="ctrl-group__current">
          <span className="ctrl-group__current-lbl">{sel.label}</span>
          <span className="ctrl-group__current-num mono">
            {sel.carbon} <span style={{color: 'var(--fg-dim)'}}>kgCO₂e</span>
          </span>
        </span>
        <span className="ctrl-group__hint mono">{hint}</span>
        <span className="ctrl-group__chev" aria-hidden="true">▸</span>
      </summary>
      <div className="ctrl-group__body">
        <MaterialButtons options={options} value={selectedKey} onChange={onChange} recommend={recommend} />
      </div>
    </details>
  );
}

// Carbon target scorecard: tier badge + three target rows with tick/cross
// and the gap to threshold. Absolute kgCO₂e/m² only — no baseline comparison.
function CarbonScorecard({ designSidePerM2, totalPerM2 }) {
  const tier = tierFor(designSidePerM2);
  const headline = tierLabel(tier);
  const v = Math.round(designSidePerM2);
  return (
    <div className={"target-card target-card--" + tier}>
      <div className="target-card__head">
        <div className="target-card__head-left">
          <span className="target-card__big-num">~{v}</span>
          <span className="mono target-card__big-unit">kgCO₂e/m²</span>
          <span className="target-card__tier">{headline}</span>
        </div>
      </div>
      <ul className="target-card__rows">
        {TARGETS.map((t) => {
          const met = v <= t.threshold;
          const gap = Math.abs(v - t.threshold);
          return (
            <li key={t.name} className={"target-card__row target-card__row--" + (met ? "met" : "fail")}>
              <span className={"target-card__check"}>{met ? "✓" : "✗"}</span>
              <span className="target-card__name">{t.full}</span>
              <span className="mono target-card__thresh">≤ {t.threshold} kgCO₂e/m²</span>
              <span className={"target-card__status mono " + (met ? "is-met" : "is-fail")}>
                {met ? `Met by ${gap}` : `Above by ${gap}`}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="target-card__foot mono">
        Approximate, mid-tender · all-in (incl. fixed MEP / fit-out): ~{Math.round(totalPerM2)} kgCO₂e/m²
      </div>
    </div>
  );
}

// Cost is shown qualitatively only, against a fixed benchmark scheme. No
// pound figures appear anywhere in the UI; just words. The benchmark
// itself is a stable reference point but its cost is also not disclosed.
//   Benchmark = the smallest Coffey variant (Canopy G+6) with the
//   recommended materials (Steel + CLT, brick, recycled aluminium).
const BENCHMARK_VARIANT_KEY = "canopy-g6";

function costVsBenchmarkRel(per, benchmarkPer) {
  const pct = ((per - benchmarkPer) / benchmarkPer) * 100;
  const abs = Math.abs(pct);
  if (abs < 5)  return { label: "Broadly the same as the benchmark", short: "On par",         tone: "neutral" };
  if (pct < 0) {
    if (abs < 15) return { label: "Slightly less expensive than the benchmark", short: "Slightly less expensive", tone: "down" };
    if (abs < 30) return { label: "Less expensive than the benchmark",          short: "Less expensive",           tone: "down" };
    return            { label: "Considerably less expensive than the benchmark", short: "Considerably less expensive", tone: "down" };
  } else {
    if (abs < 15) return { label: "Slightly more expensive than the benchmark", short: "Slightly more expensive", tone: "up" };
    if (abs < 30) return { label: "More expensive than the benchmark",          short: "More expensive",           tone: "up" };
    return            { label: "Considerably more expensive than the benchmark", short: "Considerably more expensive", tone: "up" };
  }
}

// Qualitative cost block — never names a pound figure. Compares the
// current option against the fixed benchmark above and prints one of
// six qualitative descriptors. Designed so the panel reads "where this
// sits relative to the cheapest sensible scheme" without ever seeing a
// number that could spook them out of context.
function CostVsBenchmark({ costPerM2, benchmarkCostPerM2, isBenchmark }) {
  const rel = costVsBenchmarkRel(costPerM2, benchmarkCostPerM2);
  const display = isBenchmark
    ? { label: "This is the benchmark", short: "Benchmark", tone: "neutral" }
    : rel;
  return (
    <div className="costcard">
      <div className="costcard__head">
        <span className="costcard__lbl mono">COST · against the benchmark</span>
        <span className={"costcard__chip costcard__chip--" + display.tone}>{display.short}</span>
      </div>
      <div className="costcard__lines">
        <div className="costcard__line">
          <span className="costcard__line-lbl">Headline</span>
          <span className="costcard__line-val">{display.label}.</span>
        </div>
      </div>
      <div className="costcard__foot mono">
        Benchmark · Canopy G+6 with Coffey's recommended materials (Steel + CLT, brick, recycled aluminium). Mid-tender; deliberately qualitative.
      </div>
    </div>
  );
}

// Bottom strip — all four Coffey options at a glance, each rendered with
// its own stored material spec so the rows show genuinely independent
// design proposals, not "same materials, four areas". Carbon is
// absolute; cost is qualitative against the fixed benchmark.
function OptionsComparison({ activeKey, onPick, specs }) {
  // Compute the benchmark cost ONCE so every row compares against it.
  const benchmark = COFFEY_VARIANTS[BENCHMARK_VARIANT_KEY];
  const benchmarkCost = calcCost(benchmark, COFFEY_DEFAULT_SPEC, false, CONSENTED_RATE);
  // Label per spec: short summary of the three material choices so the
  // panel can see at a glance how a given row has been set up.
  const specLabel = (s) => {
    const isDefault = s.structure === COFFEY_DEFAULT_SPEC.structure
      && s.heavy === COFFEY_DEFAULT_SPEC.heavy
      && s.light === COFFEY_DEFAULT_SPEC.light;
    if (isDefault) return "Coffey recommended";
    return [STRUCTURE[s.structure]?.label, HEAVY[s.heavy]?.label, LIGHT[s.light]?.label]
      .filter(Boolean).join(" · ");
  };
  return (
    <section className="opts-cmp">
      <div className="opts-cmp__head">
        <Eyebrow>All four directions, at a glance</Eyebrow>
        <h3 className="opts-cmp__title">Carbon and cost across the options.</h3>
        <p className="opts-cmp__sub">
          Each direction carries its own material specification, so the rows compare as independent design proposals. Switch any row's materials by clicking it (it becomes the active card) and using the controls above. Cost is shown qualitatively against a fixed benchmark (Canopy G+6 with Coffey's recommended materials).
        </p>
      </div>
      <table className="opts-cmp__table">
        <thead>
          <tr>
            <th>Direction</th>
            <th>Height</th>
            <th>GIA (m²)</th>
            <th>NIA (m²)</th>
            <th>Materials</th>
            <th>Carbon (~kgCO₂e/m²)</th>
            <th>Cost · vs benchmark</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(COFFEY_VARIANTS).map((v) => {
            const rowSpec = specs[v.key] || COFFEY_DEFAULT_SPEC;
            const c = calcCarbon(v, rowSpec, false);
            const $ = calcCost(v, rowSpec, false, CONSENTED_RATE);
            const tier = tierFor(c.designSidePerM2);
            const active = v.key === activeKey;
            const isBench = v.key === BENCHMARK_VARIANT_KEY;
            // Benchmark row reads "Benchmark" only if it still carries
            // the recommended spec; if the user has tweaked it, it falls
            // back to a normal comparison against itself-as-default.
            const benchAtDefault = v.key === BENCHMARK_VARIANT_KEY
              && rowSpec.structure === COFFEY_DEFAULT_SPEC.structure
              && rowSpec.heavy === COFFEY_DEFAULT_SPEC.heavy
              && rowSpec.light === COFFEY_DEFAULT_SPEC.light;
            const rel = benchAtDefault
              ? { short: "Benchmark", tone: "neutral" }
              : costVsBenchmarkRel($.totalPerM2, benchmarkCost.totalPerM2);
            return (
              <tr key={v.key}
                  className={"opts-cmp__row" + (active ? " is-active" : "")}
                  onClick={() => onPick(v.key)}
                  title={`Make ${v.label} ${v.long.split('·')[0].trim()} the active card so you can edit its materials.`}
              >
                <th>
                  <span className="opts-cmp__name">{v.label}</span>
                  <span className="mono opts-cmp__note">{v.long.split("·").slice(1).join("·").trim() || v.long}</span>
                </th>
                <td className="mono">{v.long.split("·")[0].trim()}</td>
                <td>{v.gia.toLocaleString()}</td>
                <td>{v.nia.toLocaleString()}</td>
                <td className="mono" style={{fontSize: 10, color: 'var(--fg-soft)', letterSpacing: 0.04, lineHeight: 1.4}}>{specLabel(rowSpec)}</td>
                <td>
                  ~{Math.round(c.designSidePerM2)}
                  <span className={"target-pill target-pill--" + tier} style={{marginLeft: 8}}>{tierLabel(tier).split(' · ')[1] || tierLabel(tier)}</span>
                </td>
                <td>
                  <span className={"costcard__chip costcard__chip--" + rel.tone} style={{fontSize: 12, padding: '2px 10px'}}>{rel.short}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function SchemeTabs({ value, onChange }) {
  const tabs = Object.values(COFFEY_VARIANTS);
  return (
    <div className="scheme-tabs">
      <div className="scheme-tabs__lbl mono">Coffey direction</div>
      <div className="scheme-tabs__list">
        {tabs.map((v) => (
          <button
            key={v.key}
            className={"scheme-tab" + (v.key === value ? " is-active" : "")}
            onClick={() => onChange(v.key)}
            title={v.note}
          >
            <span className="scheme-tab__lbl">{v.label}</span>
            <span className="scheme-tab__sub mono">{v.long.split("·")[0].trim()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CoffeyCard({ variantKey, setVariantKey, spec, setSpec, onCopyToAll }) {
  const scheme = COFFEY_VARIANTS[variantKey];
  const carbon = calcCarbon(scheme, spec, false);
  const cost   = calcCost(scheme, spec, false, CONSENTED_RATE);
  // Benchmark cost (fixed: smallest Coffey variant + recommended materials).
  // Computed for the qualitative cost comparison; the benchmark's own
  // pound figure is never displayed.
  const benchmarkCost = calcCost(COFFEY_VARIANTS[BENCHMARK_VARIANT_KEY], COFFEY_DEFAULT_SPEC, false, CONSENTED_RATE);

  return (
    <section className="schemecard schemecard--recommended">
      <header className="schemecard__head">
        <div>
          <div className="schemecard__key">
            <span className="mono">Coffey direction</span>
            <span className="mono schemecard__chip">Editable</span>
          </div>
          <h3 className="schemecard__title">{scheme.long}</h3>
          <div className="schemecard__note">{scheme.note}</div>
        </div>
        <div className="schemecard__gia">
          <div className="mono">GIA / NIA</div>
          <div className="schemecard__gia-val">{scheme.gia.toLocaleString()}<span className="mono"> m²</span></div>
          <div className="mono schemecard__gia-nia">NIA {scheme.nia.toLocaleString()} m²</div>
          {onCopyToAll ? (
            <button
              className="schemecard__sync mono"
              onClick={onCopyToAll}
              title="Copy this scheme's materials onto every other Coffey direction. Useful for an apples-to-apples comparison."
            >
              ⇄ Copy materials → all directions
            </button>
          ) : null}
        </div>
      </header>

      <SchemeTabs value={variantKey} onChange={setVariantKey} />

      <div className="schemecard__controls">
        <CtrlGroup num="01" title="Primary structure" hint="per m² GIA"
          options={STRUCTURE} selectedKey={spec.structure} recommend={COFFEY_DEFAULT_SPEC.structure}
          onChange={(v) => setSpec({ ...spec, structure: v })} />
        <CtrlGroup num="02" title="Heavy mass · facade" hint={`${scheme.heavyArea} m² facade`}
          options={HEAVY} selectedKey={spec.heavy} recommend={COFFEY_DEFAULT_SPEC.heavy}
          onChange={(v) => setSpec({ ...spec, heavy: v })} />
        <CtrlGroup num="03" title="Light cladding · lookout / canopy" hint={`${scheme.lightArea} m² facade`}
          options={LIGHT} selectedKey={spec.light} recommend={COFFEY_DEFAULT_SPEC.light}
          onChange={(v) => setSpec({ ...spec, light: v })} />
      </div>

      <div className="schemecard__results">
        <CarbonScorecard
          designSidePerM2={carbon.designSidePerM2}
          totalPerM2={carbon.totalPerM2}
        />

        <CostVsBenchmark
          costPerM2={cost.totalPerM2}
          benchmarkCostPerM2={benchmarkCost.totalPerM2}
          isBenchmark={variantKey === BENCHMARK_VARIANT_KEY}
        />

        <details className="breakdown">
          <summary className="breakdown__summary mono">Detail · embodied carbon breakdown</summary>
          <table className="breakdown__table">
            <thead>
              <tr><th>Component</th><th>Selection</th><th>kgCO₂e total</th></tr>
            </thead>
            <tbody>
              {["structure", "heavy", "light", "biogenic", "rest"].map((k) => {
                const b = carbon.breakdown[k];
                if (!b.lbl) return null;
                return (
                  <tr key={k} className={k === "rest" ? "breakdown__rest" : (k === "biogenic" ? "breakdown__biogenic" : "")}>
                    <th>{({structure:"Primary structure",heavy:"Heavy facade",light:"Light cladding",biogenic:"Biogenic sequestration",rest:"Rest of build (fixed)"})[k]}</th>
                    <td>{b.lbl}</td>
                    <td>{Math.round(b.carbon).toLocaleString()}</td>
                  </tr>
                );
              })}
              <tr className="breakdown__totals">
                <th colSpan={2}>Whole-life over {OPERATIONAL.life}yr life (incl. operational)</th>
                <td>{Math.round(carbon.wholeLifePerM2 * scheme.gia).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </details>
      </div>
    </section>
  );
}

function Calculator({ onClose }) {
  const [variantKey, setVariantKey] = React.useState(() => {
    try { return localStorage.getItem("twcf-calc-variant") || "signal-box-g10"; } catch { return "signal-box-g10"; }
  });
  // Per-scheme material specs. Each Coffey variant remembers its own
  // structure / heavy / light choices. Switching tabs swaps both the
  // active card AND its stored spec. The comparison strip below uses
  // each variant's own spec, so the four rows can be compared as
  // genuinely different design proposals (not "same materials, four
  // areas") if the user has set each one up that way.
  const [specs, setSpecsRaw] = React.useState(() => {
    const init = {};
    Object.keys(COFFEY_VARIANTS).forEach((k) => { init[k] = { ...COFFEY_DEFAULT_SPEC }; });
    try {
      const s = JSON.parse(localStorage.getItem("twcf-calc-specs") || "null");
      if (s && typeof s === "object") {
        const valid = Object.keys(COFFEY_VARIANTS).every(
          (k) => s[k] && s[k].structure && s[k].heavy && s[k].light
        );
        if (valid) return s;
      }
    } catch {}
    return init;
  });
  const setSpecs = (s) => {
    setSpecsRaw(s);
    try { localStorage.setItem("twcf-calc-specs", JSON.stringify(s)); } catch {}
  };
  // Setter for just the active variant's spec.
  const setActiveSpec = (s) => setSpecs({ ...specs, [variantKey]: s });
  // "Copy active to all" — useful for resetting all four to the same spec
  // so the user can see the area-only comparison again.
  const copyActiveToAll = () => {
    const active = specs[variantKey];
    const next = {};
    Object.keys(COFFEY_VARIANTS).forEach((k) => { next[k] = { ...active }; });
    setSpecs(next);
  };
  const setVariant = (k) => {
    setVariantKey(k);
    try { localStorage.setItem("twcf-calc-variant", k); } catch {}
  };
  const resetDefaults = () => {
    const init = {};
    Object.keys(COFFEY_VARIANTS).forEach((k) => { init[k] = { ...COFFEY_DEFAULT_SPEC }; });
    setSpecs(init);
    setVariant("signal-box-g10");
  };
  const doPrint = () => window.print();

  return (
    <div className="calc">
      <header className="calc__head">
        <div className="calc__head-left">
          <Logo size="sm" />
          <div className="calc__head-doc mono">1820 Goods Way · Design-side viability calculator</div>
        </div>
        <div className="calc__head-right">
          <button className="calc__btn" onClick={doPrint} title="Print or save as PDF">⎙ PDF</button>
          <button className="calc__btn" onClick={resetDefaults}>Reset</button>
          <button className="calc__btn calc__btn--primary" onClick={onClose}>← Back to document</button>
        </div>
      </header>

      <section className="calc__intro">
        <Eyebrow>§15 · Design-side viability tool · mid-tender</Eyebrow>
        <h1 className="calc__title">Carbon &amp; cost across the four Studies.</h1>
        <p className="calc__sub">
          Switch direction with the tabs below; toggle primary structure, heavy facade and light cladding to see how each material choice moves the carbon scorecard. <strong>Carbon is shown in absolute terms</strong> against the LETI / RIBA targets that govern the procurement conversation. <strong>Cost is shown qualitatively against a fixed benchmark</strong> (the smallest Coffey direction with our recommended materials); pound figures are deliberately held back at this stage. The bottom table shows all four directions at a glance.
        </p>
        <div className="calc__sub-meta mono" style={{color: 'var(--fg-dim)'}}>
          Rest of build (fixed) · {REST_CARBON} kgCO₂e/m² · MEP + Cat A fit-out + externals + prelims + fees · operational {OPERATIONAL.carbon} kgCO₂e/m²/yr over {OPERATIONAL.life}yr life
        </div>
      </section>

      <section className="calc__grid calc__grid--single">
        <CoffeyCard
          variantKey={variantKey}
          setVariantKey={setVariant}
          spec={specs[variantKey]}
          setSpec={setActiveSpec}
          onCopyToAll={copyActiveToAll}
        />
      </section>

      <OptionsComparison activeKey={variantKey} onPick={setVariant} specs={specs} />

      <section className="calc__caveat">
        <Eyebrow>Caveats</Eyebrow>
        <p>
          Mid-tender illustrative tool, based on published embodied-carbon datasets (ICE, ECC, EPDs) and indicative UK construction rates (Q2 2026). Carbon figures cover <strong>design-side scope</strong> (structure + facade) plus a fixed adder for MEP, Cat A fit-out, externals, prelims, and fees; operational energy is an estimate based on typical Cat A office EUI. Cost is shown qualitatively only against a fixed benchmark; absolute pound figures are held back at this stage. Land cost, finance, rent, yield and tax are out of scope.
        </p>
      </section>
    </div>
  );
}

export { Calculator };
