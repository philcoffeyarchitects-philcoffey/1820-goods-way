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
  "brick":          { label: "Engineering brick",      carbon: 140, note: "Full bricks. The brick of Victorian canal infrastructure. Coffey recommended." },
  "brick-slip":     { label: "Brick slip on rail",     carbon:  95, note: "20mm slips on a carrier. Lower carbon, less honest at close range." },
  "stone-portland": { label: "Portland limestone",     carbon:  85, note: "UK-quarried sedimentary. Low energy. A different vocabulary." },
  "stone-granite":  { label: "Granite (imported)",     carbon: 280, note: "Imported, high-energy cutting + shipping." },
  "precast":        { label: "Pre-cast concrete",      carbon: 240, note: "Reconstituted-stone PCC panels. Faster, lower cost." },
  "precast-ggbs":   { label: "Pre-cast + GGBS",        carbon: 145, note: "70% GGBS cement replacement." },
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

const CONSENTED = {
  key: "consented",
  label: "Previously consented",
  long: "Stage 5 consent, by others",
  note: "G+6 with basement. RC frame, precast facade, primary aluminium, single basement.",
  gia: 5252,
  nia: 3797,
  heavyArea: 2200,
  lightArea: 250,
  basement: 175,                  // kgCO₂e/m² GIA (single basement)
  basementCost: 410,              // £/m² GIA
  // Locked spec — these are the materials the consented scheme used.
  spec: { structure: "rc", heavy: "precast", light: "al-primary" },
  // Mid-tender illustrative £/m² for the design-side scope only.
  // Real Stage 2 cost-plan figures slot in here next week.
  designSideCostPerM2: 2600,
};

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
    "brick":          0,        // baseline
    "brick-slip":    -250,
    "stone-portland": 400,
    "stone-granite":  650,
    "precast":       -150,
    "precast-ggbs":  -100,
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

// New, clearer carbon target indicator: tier badge + three target rows
// with tick/cross and the gap to threshold.
function CarbonScorecard({ designSidePerM2, totalPerM2, consentedTotal, deltaText, deltaSignVal }) {
  const tier = tierFor(designSidePerM2);
  const headline = tierLabel(tier);
  const v = Math.round(designSidePerM2);
  return (
    <div className={"target-card target-card--" + tier}>
      <div className="target-card__head">
        <div className="target-card__head-left">
          <span className="target-card__big-num">{v}</span>
          <span className="mono target-card__big-unit">kgCO₂e/m²</span>
          <span className="target-card__tier">{headline}</span>
        </div>
        <div className={"target-card__delta target-card__delta--" + deltaSignVal}>
          <span className="mono target-card__delta-lbl">vs consented</span>
          <span className="target-card__delta-val">{deltaText}</span>
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
        All-in (incl. fixed MEP / fit-out): {Math.round(totalPerM2)} kgCO₂e/m² · Whole-life over 60yr life included in detailed breakdown
      </div>
    </div>
  );
}

// Relative cost block — no raw £/m² as headline. Always paired with area
// gain so the panel reads "more area for similar/less cost per m²."
function RelativeCost({ costDeltaPct, costDeltaTotal, areaDeltaPct, costPerM2, totalCost, sensLow, sensHigh }) {
  const dText = roundDelta(costDeltaPct);
  const dSign = deltaSign(costDeltaPct);
  const tText = roundDelta(Math.round(costDeltaTotal / Math.abs(costDeltaTotal || 1) * 5) * 5);  // placeholder
  const aText = roundDelta(areaDeltaPct);
  return (
    <div className="costcard">
      <div className="costcard__head">
        <span className="costcard__lbl mono">COST</span>
        <span className={"costcard__chip costcard__chip--" + dSign}>{dText} per m²</span>
      </div>
      <div className="costcard__lines">
        <div className="costcard__line">
          <span className="costcard__line-lbl">Per m²</span>
          <span className="costcard__line-val">{dText} vs the consented scheme</span>
        </div>
        <div className="costcard__line">
          <span className="costcard__line-lbl">Overall</span>
          <span className="costcard__line-val">
            {Math.abs(costDeltaTotal) < 200000 ? "approximately the same overall" : (costDeltaTotal > 0 ? "approximately +" : "approximately −") + fmtMoneyApprox(Math.abs(costDeltaTotal)).replace("~£", "£") + " overall"}
            {" "}
            <span className="costcard__line-note">for {aText} more lettable area</span>
          </span>
        </div>
      </div>
      <div className="costcard__foot mono">
        Mid-tender illustrative · design-side scope · ±{Math.round(SENSITIVITY * 100)}% Stage 2 sensitivity ·
        analytical: ~£{Math.round(costPerM2 / 10) * 10}/m² all-in, total ~{fmtMoneyApprox(totalCost)}
      </div>
    </div>
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

function ConsentedCard({ result, costResult }) {
  return (
    <section className="schemecard schemecard--locked">
      <header className="schemecard__head">
        <div>
          <div className="schemecard__key">
            <span className="mono">Previously consented</span>
            <span className="mono schemecard__chip schemecard__chip--locked">Locked · by others</span>
          </div>
          <h3 className="schemecard__title">{CONSENTED.long}</h3>
          <div className="schemecard__note">{CONSENTED.note}</div>
        </div>
        <div className="schemecard__gia">
          <div className="mono">GIA / NIA</div>
          <div className="schemecard__gia-val">{CONSENTED.gia.toLocaleString()}<span className="mono"> m²</span></div>
          <div className="mono schemecard__gia-nia">NIA {CONSENTED.nia.toLocaleString()} m²</div>
        </div>
      </header>

      <div className="schemecard__locked-spec">
        <span className="mono">Specification:</span>
        <span>{STRUCTURE[CONSENTED.spec.structure].label}</span>
        <span className="dim">·</span>
        <span>{HEAVY[CONSENTED.spec.heavy].label}</span>
        <span className="dim">·</span>
        <span>{LIGHT[CONSENTED.spec.light].label}</span>
        <span className="dim">·</span>
        <span>Single basement</span>
      </div>

      <div className="schemecard__results">
        <div className="consented-summary">
          <div className="consented-summary__item">
            <span className="mono">Embodied carbon</span>
            <b>{Math.round(result.designSidePerM2)}</b>
            <span className="mono">kgCO₂e/m² (design-side)</span>
            <span className={"target-pill target-pill--" + tierFor(result.designSidePerM2)}>
              {tierLabel(tierFor(result.designSidePerM2))}
            </span>
          </div>
          <div className="consented-summary__item">
            <span className="mono">Build cost (illustrative)</span>
            <b>~£{Math.round(costResult.totalPerM2 / 10) * 10}</b>
            <span className="mono">/m² all-in · ~{fmtMoneyApprox(costResult.total)} total</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoffeyCard({ variantKey, setVariantKey, spec, setSpec, consentedCarbon, consentedCost, consentedScheme }) {
  const scheme = COFFEY_VARIANTS[variantKey];
  const carbon = calcCarbon(scheme, spec, false);
  const cost   = calcCost(scheme, spec, false, CONSENTED.designSideCostPerM2);
  const costDeltaPct   = ((cost.totalPerM2 - consentedCost.totalPerM2) / consentedCost.totalPerM2) * 100;
  const costDeltaTotal = cost.total - consentedCost.total;
  const areaDeltaPct   = ((scheme.nia - consentedScheme.nia) / consentedScheme.nia) * 100;
  const carbonDeltaPct = ((carbon.designSidePerM2 - consentedCarbon.designSidePerM2) / consentedCarbon.designSidePerM2) * 100;

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
          consentedTotal={consentedCarbon.totalPerM2}
          deltaText={roundDelta(carbonDeltaPct)}
          deltaSignVal={deltaSign(carbonDeltaPct)}
        />

        <RelativeCost
          costDeltaPct={costDeltaPct}
          costDeltaTotal={costDeltaTotal}
          areaDeltaPct={areaDeltaPct}
          costPerM2={cost.totalPerM2}
          totalCost={cost.total}
          sensLow={cost.sensLow}
          sensHigh={cost.sensHigh}
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
  const [spec, setSpecRaw] = React.useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("twcf-calc-spec") || "null");
      if (s && s.structure && s.heavy && s.light) return s;
    } catch {}
    return { ...COFFEY_DEFAULT_SPEC };
  });
  const setSpec = (s) => {
    setSpecRaw(s);
    try { localStorage.setItem("twcf-calc-spec", JSON.stringify(s)); } catch {}
  };
  const setVariant = (k) => {
    setVariantKey(k);
    try { localStorage.setItem("twcf-calc-variant", k); } catch {}
  };
  const resetDefaults = () => {
    setSpec({ ...COFFEY_DEFAULT_SPEC });
    setVariant("signal-box-g10");
  };
  const doPrint = () => window.print();

  const consentedCarbon = calcCarbon(CONSENTED, CONSENTED.spec, true);
  const consentedCost   = calcCost(CONSENTED, CONSENTED.spec, true, CONSENTED.designSideCostPerM2);

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
        <h1 className="calc__title">Cost &amp; carbon, anchored to the consented baseline.</h1>
        <p className="calc__sub">
          Compare the Coffey directions against the previously consented Stage 5 scheme. Cost is shown as a percentage versus that baseline rather than a raw £/m², because the relative move is what matters at this stage; absolute figures are included in small print for the analytical reader. Switch the Coffey direction with the tabs below, and toggle primary structure, heavy facade and light cladding to see how each choice moves the carbon scorecard. Real Stage 2 cost-plan figures replace the illustrative ones at the final presentation.
        </p>
        <div className="calc__sub-meta mono">
          Baseline · the previously consented Stage 5 scheme (by others) · G+6 with basement · RC frame · precast facade · primary aluminium
        </div>
        <div className="calc__sub-meta mono" style={{color: 'var(--fg-dim)'}}>
          Rest of build (fixed) · {REST_CARBON} kgCO₂e/m² · ~£{(REST_COST / 1000).toFixed(1)}k/m² · MEP + Cat A fit-out + externals + prelims + fees · operational {OPERATIONAL.carbon} kgCO₂e/m²/yr over {OPERATIONAL.life}yr life
        </div>
      </section>

      <section className="calc__grid calc__grid--ab">
        <ConsentedCard result={consentedCarbon} costResult={consentedCost} />
        <CoffeyCard
          variantKey={variantKey}
          setVariantKey={setVariant}
          spec={spec}
          setSpec={setSpec}
          consentedCarbon={consentedCarbon}
          consentedCost={consentedCost}
          consentedScheme={CONSENTED}
        />
      </section>

      <section className="calc__caveat">
        <Eyebrow>Caveats</Eyebrow>
        <p>
          Mid-tender illustrative numbers, based on published embodied-carbon datasets (ICE, ECC, EPDs) and indicative UK construction rates (Q2 2026). Cost figures show <strong>design-side scope</strong>, structure + facade + basement, plus a fixed adder for MEP, Cat A fit-out, externals, prelims, and fees. Operational energy is an estimate based on typical Cat A office EUI. Land cost, finance, rent, yield and tax are out of scope. Final figures will be subject to detailed design, contractor procurement and a formal cost plan at RIBA Stage 2; the values here are presented as relative deltas to the consented baseline because that is what is meaningful at this stage. Cost shown with ±{Math.round(SENSITIVITY * 100)}% sensitivity.
        </p>
      </section>
    </div>
  );
}

export { Calculator };
