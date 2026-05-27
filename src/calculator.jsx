// calculator.jsx — Design-side viability calculator (v2).
//
// Adds: scenario presets · best-in-category tags · sync A↔B ·
//       carbon target gauge · whole-life carbon · sensitivity bands ·
//       PDF print · summary comparison row.

import React from "react";
import { Logo, Eyebrow } from "./placeholder.jsx";

// ─── DATA ──────────────────────────────────────────────────────────────
const STRUCTURE = {
  "steel-clt":         { label: "Steel + CLT",          carbon: 305, cost: 1200, biogenic:  -85, note: "Hybrid frame; biogenic CLT; lighter than RC. LETI exemplar." },
  "steel-clt-reused":  { label: "Reused steel + CLT",   carbon: 165, cost: 1280, biogenic:  -85, note: "Reclaimed structural steel + CLT — ~70% lower steel carbon. Sourcing premium." },
  "steel-comp":        { label: "Steel + composite",    carbon: 420, cost: 1050, biogenic:    0, note: "Steel frame + composite metal-deck slab." },
  "rc":                { label: "RC concrete",          carbon: 575, cost:  950, biogenic:    0, note: "Reinforced concrete; CEM I cement, standard." },
  "rc-ggbs":           { label: "RC + GGBS",            carbon: 395, cost:  985, biogenic:    0, note: "70% GGBS cement replacement; −30% carbon." },
  "full-clt":          { label: "Full CLT",             carbon: 215, cost: 1550, biogenic: -170, note: "Mass timber throughout; large biogenic sequestration; premium." },
};

const HEAVY = {
  "brick":          { label: "Engineering brick",      carbon: 140, cost:  900, note: "Full bricks — proposed. Kiln-fired at ~1,100°C." },
  "brick-slip":     { label: "Brick slip on rail",     carbon:  95, cost:  650, note: "20mm slips on mechanically-fixed carrier." },
  "stone-portland": { label: "Portland limestone (UK)",carbon:  85, cost: 1300, note: "UK-quarried sedimentary; low energy." },
  "stone-granite":  { label: "Granite (imported)",     carbon: 280, cost: 1550, note: "Imported, high-energy cutting + shipping." },
  "precast":        { label: "Pre-cast concrete",      carbon: 240, cost:  750, note: "Reconstituted-stone PCC panels." },
  "precast-ggbs":   { label: "Pre-cast + GGBS",        carbon: 145, cost:  800, note: "70% GGBS cement replacement." },
};

const LIGHT = {
  "al-primary":     { label: "Aluminium — primary",       carbon: 310, cost:  650, note: "Standard cassette; ~12 kgCO₂e/kg." },
  "al-recycled":    { label: "Aluminium — recycled",      carbon:  75, cost:  720, note: "CIRCAL 75R — 75% recycled. Proposed." },
  "stainless":      { label: "Corrugated stainless",      carbon: 180, cost:  825, note: "316 grade, marine-suitable." },
  "corten":         { label: "Weathering steel (Corten)", carbon:  95, cost:  580, note: "Self-finishing patina; low-process steel." },
  "zinc":           { label: "Zinc standing seam",        carbon: 105, cost:  850, note: "Pre-weathered VMZinc." },
  "al-mesh":        { label: "Aluminium mesh / perf",     carbon: 200, cost:  580, note: "Perforated screen; less aluminium per m²." },
};

const BASEMENT = {
  "none":           { label: "No basement",     carbon:   0, cost:    0, note: "Slab-on-grade." },
  "single":         { label: "Single basement", carbon: 175, cost:  410, note: "+1 level plant + storage. Premium spread over GIA." },
  "double":         { label: "Double basement", carbon: 350, cost:  850, note: "+2 levels. Heavy excavation + secant piling." },
};

const REST = { carbon: 220, cost: 2400 };

const SCHEMES = {
  "A": {
    key: "A", label: "Path A", long: "G+7 cantilevered",
    GIA: 4340, heavyArea: 2200, lightArea: 350,
    penalty: {
      carbon: 100, cost: 85,
      lbl: "Cantilever structural premium",
      headerNote: "+100 kgCO₂e/m² · +£85/m² — ground-floor transfer structure carries cantilevered plates over the tube lines; upper plates thickened for the cantilever. Not free.",
    },
  },
  "B": {
    key: "B", label: "Path B", long: "G+8/9 simple extrusion",
    GIA: 5150, heavyArea: 2800, lightArea: 420,
    penalty: null,
    headerNote: "No transfer structure — clean stacked frame. The cantilever penalty (Path A) does not apply.",
  },
};

const BASELINE = { carbon: 1100, cost: 5400 };

const TARGETS = [
  { name: "LETI 2030",        threshold: 500,  kind: "best" },
  { name: "RIBA 2030 Office", threshold: 750,  kind: "pass" },
  { name: "RIBA 2025 Office", threshold: 970,  kind: "minimum" },
];

// Operational carbon — kgCO2e/m² GIA per year for typical Cat A office.
const OPERATIONAL = { carbon: 28, life: 60 };

// Sensitivity band — applied to cost as ± percentage.
const SENSITIVITY = 0.10;

// Quick scenarios.
const PRESETS = {
  "lowest-carbon":  { label: "Lowest carbon",     note: "Full CLT · Portland · recycled Al",       structure: "full-clt",  basement: "none",   heavyMat: "stone-portland", lightMat: "al-recycled" },
  "lowest-cost":    { label: "Lowest cost",       note: "RC frame · brick slip · primary Al",       structure: "rc",        basement: "none",   heavyMat: "brick-slip",     lightMat: "al-primary"  },
  "consented":      { label: "Consented baseline",note: "RC + basement · precast · primary Al",     structure: "steel-comp",basement: "single", heavyMat: "precast",        lightMat: "al-primary"  },
  "recommended":    { label: "Coffey recommended",note: "Steel + CLT · brick · recycled Al",        structure: "steel-clt", basement: "none",   heavyMat: "brick",          lightMat: "al-recycled" },
};

const DEFAULT_STATE = {
  A: { ...PRESETS["consented"] },
  B: { ...PRESETS["recommended"] },
};
// Strip the meta keys so they don't pollute the state shape.
["A","B"].forEach(k => { delete DEFAULT_STATE[k].label; delete DEFAULT_STATE[k].note; });

// ─── HELPERS ───────────────────────────────────────────────────────────
function bestKey(options, field, mode = "min") {
  let bestK = null, bestV = mode === "min" ? Infinity : -Infinity;
  for (const k in options) {
    const v = options[k][field];
    if (v == null) continue;
    if ((mode === "min" && v < bestV) || (mode === "max" && v > bestV)) {
      bestV = v; bestK = k;
    }
  }
  return bestK;
}

function calcScheme(state, schemeKey) {
  const s = SCHEMES[schemeKey];
  const str   = STRUCTURE[state.structure];
  const bas   = BASEMENT[state.basement];
  const heavy = HEAVY[state.heavyMat];
  const light = LIGHT[state.lightMat];
  const pen   = s.penalty || { carbon: 0, cost: 0, lbl: null };

  const penCarbon = pen.carbon * s.GIA;
  const penCost   = pen.cost   * s.GIA;

  const dsCarbon =
    str.carbon * s.GIA +
    heavy.carbon * s.heavyArea +
    light.carbon * s.lightArea +
    bas.carbon * s.GIA +
    penCarbon;
  const biogenic = (str.biogenic || 0) * s.GIA;
  const dsCost =
    str.cost * s.GIA +
    heavy.cost * s.heavyArea +
    light.cost * s.lightArea +
    bas.cost * s.GIA +
    penCost;

  const restCarbon = REST.carbon * s.GIA;
  const restCost   = REST.cost   * s.GIA;

  const carbonTotal = dsCarbon + restCarbon;
  const costTotal   = dsCost + restCost;

  const operationalLifetime = OPERATIONAL.carbon * OPERATIONAL.life * s.GIA;
  const wholeLifeTotal = carbonTotal + operationalLifetime + biogenic;

  const carbonPerM2 = carbonTotal / s.GIA;
  const costPerM2   = costTotal / s.GIA;
  const dsCarbonPerM2 = dsCarbon / s.GIA;
  const wholeLifePerM2 = wholeLifeTotal / s.GIA;

  return {
    carbonTotal, carbonPerM2, dsCarbonPerM2,
    costTotal, costPerM2,
    biogenic, biogenicPerM2: biogenic / s.GIA,
    operationalLifetime, operationalPerM2: operationalLifetime / s.GIA,
    wholeLifeTotal, wholeLifePerM2,
    sensitivityLow: costPerM2 * (1 - SENSITIVITY),
    sensitivityHigh: costPerM2 * (1 + SENSITIVITY),
    deltaCarbon: ((carbonPerM2 - BASELINE.carbon) / BASELINE.carbon) * 100,
    deltaCost:   ((costPerM2   - BASELINE.cost)   / BASELINE.cost)   * 100,
    breakdown: {
      structure: { lbl: str.label,   carbon: str.carbon * s.GIA,         cost: str.cost * s.GIA },
      basement:  { lbl: bas.label,   carbon: bas.carbon * s.GIA,         cost: bas.cost * s.GIA },
      heavy:     { lbl: heavy.label, carbon: heavy.carbon * s.heavyArea, cost: heavy.cost * s.heavyArea },
      light:     { lbl: light.label, carbon: light.carbon * s.lightArea, cost: light.cost * s.lightArea },
      penalty:   { lbl: pen.lbl || "—",                                  carbon: penCarbon,        cost: penCost },
      biogenic:  { lbl: str.biogenic ? `Biogenic sequestration (CLT)` : "—", carbon: biogenic,        cost: 0 },
      rest:      { lbl: "MEP, fit-out, externals, fees, prelims",            carbon: restCarbon,      cost: restCost },
    },
  };
}

function fmtMoney(n) {
  if (n >= 1e6) return "£" + (n / 1e6).toFixed(2) + "m";
  if (n >= 1e3) return "£" + (n / 1e3).toFixed(0) + "k";
  return "£" + Math.round(n).toLocaleString();
}
function fmtMoneyPerM2(n) { return "£" + Math.round(n / 10) * 10; }
function fmtMoneyTotal(n) {
  if (n >= 1e6) return "£" + (Math.round(n / 1e5) / 10).toFixed(1) + "m";
  if (n >= 1e3) return "£" + Math.round(n / 1e3).toLocaleString() + "k";
  return "£" + Math.round(n).toLocaleString();
}
function fmtSigned(n, suffix = "") {
  const s = n >= 0 ? "+" : "";
  const v = Math.abs(n) < 10 ? n.toFixed(1) : n.toFixed(0);
  return s + v + suffix;
}

// ─── COMPONENTS ────────────────────────────────────────────────────────

function MaterialButtons({ options, value, onChange }) {
  const keys = Object.keys(options);
  const bestCarbonKey = bestKey(options, "carbon");
  const bestCostKey   = bestKey(options, "cost");
  return (
    <div className="matgrid matgrid--c1">
      {keys.map((k) => {
        const o = options[k];
        const active = k === value;
        const isLowC = k === bestCarbonKey;
        const isLowCost = k === bestCostKey;
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
                {isLowC ? <span className="matbtn__tag matbtn__tag--c">Lowest C</span> : null}
                {isLowCost ? <span className="matbtn__tag matbtn__tag--cost">Lowest £</span> : null}
              </span>
              <span className="matbtn__num">{o.carbon} <span className="matbtn__unit">kgCO₂e</span></span>
            </div>
            <div className="matbtn__row matbtn__row--sec">
              <span className="matbtn__note">{o.note}</span>
              <span className="matbtn__cost">{fmtMoney(o.cost)} /m²</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CtrlGroup({ num, title, hint, options, selectedKey, onChange }) {
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
        <MaterialButtons options={options} value={selectedKey} onChange={onChange} />
      </div>
    </details>
  );
}

function ResultCard({ label, value, sub, accent }) {
  return (
    <div className={"resultcard" + (accent ? " resultcard--accent" : "")}>
      <div className="resultcard__lbl">{label}</div>
      <div className="resultcard__val">{value}</div>
      {sub ? <div className="resultcard__sub">{sub}</div> : null}
    </div>
  );
}

// Horizontal gauge showing the design-side carbon against thresholds.
function CarbonGauge({ value, baseline, targets }) {
  const max = Math.max(baseline, value) * 1.05;
  const pct = Math.min(100, (value / max) * 100);
  // Which target band are we in?
  const sorted = [...targets].sort((a, b) => a.threshold - b.threshold);
  let band = "fail";
  if (value <= sorted[0].threshold) band = "best";
  else if (value <= sorted[1].threshold) band = "pass";
  else if (value <= sorted[2].threshold) band = "minimum";
  return (
    <div className={"gauge gauge--" + band}>
      <div className="gauge__head">
        <span className="gauge__title mono">Design-side carbon vs targets</span>
        <span className="gauge__value">
          <b>{Math.round(value)}</b><span className="mono">kgCO₂e/m²</span>
        </span>
      </div>
      <div className="gauge__track">
        <div className="gauge__fill" style={{ width: pct + "%" }}></div>
        {sorted.map((t) => {
          const left = (t.threshold / max) * 100;
          return (
            <div key={t.name} className={"gauge__marker gauge__marker--" + t.kind} style={{ left: left + "%" }}>
              <span className="gauge__marker-line"></span>
              <span className="gauge__marker-lbl mono">{t.name}<br/>≤{t.threshold}</span>
            </div>
          );
        })}
      </div>
      <div className="gauge__status mono">
        {band === "best"    && "✓ LETI 2030 met — exemplary"}
        {band === "pass"    && "✓ RIBA 2030 met — passes target"}
        {band === "minimum" && "✓ RIBA 2025 met — minimum"}
        {band === "fail"    && "✗ Above RIBA 2025 threshold"}
      </div>
    </div>
  );
}

function SchemeCard({ schemeKey, state, setState, otherState, otherKey, onSync }) {
  const s = SCHEMES[schemeKey];
  const r = calcScheme(state, schemeKey);
  const isB = schemeKey === "B";
  const note = s.penalty ? s.penalty.headerNote : s.headerNote;
  return (
    <section className={"schemecard" + (isB ? " schemecard--recommended" : "")}>
      <header className="schemecard__head">
        <div>
          <div className="schemecard__key">
            <span className="mono">{s.label}</span>
            {isB ? <span className="mono schemecard__chip">Recommended</span> : null}
          </div>
          <h3 className="schemecard__title">{s.long}</h3>
          {note ? (
            <div className={"schemecard__note" + (s.penalty ? " schemecard__note--penalty" : "")}>
              {note}
            </div>
          ) : null}
        </div>
        <div className="schemecard__gia">
          <div className="mono">GIA</div>
          <div className="schemecard__gia-val">{s.GIA.toLocaleString()}<span className="mono">m²</span></div>
          <button className="schemecard__sync mono" onClick={onSync}
            title={`Copy spec from Path ${otherKey} to Path ${schemeKey} — isolates the geometry-only difference.`}>
            ⇄ Copy from {otherKey}
          </button>
        </div>
      </header>

      <div className="schemecard__controls">
        <CtrlGroup num="01" title="Primary structure" hint="per m² GIA"
          options={STRUCTURE} selectedKey={state.structure}
          onChange={(v) => setState({ ...state, structure: v })} />
        <CtrlGroup num="02" title="Basement" hint="per m² GIA"
          options={BASEMENT} selectedKey={state.basement}
          onChange={(v) => setState({ ...state, basement: v })} />
        <CtrlGroup num="03" title="Heavy mass — facade" hint={`${s.heavyArea}m² facade`}
          options={HEAVY} selectedKey={state.heavyMat}
          onChange={(v) => setState({ ...state, heavyMat: v })} />
        <CtrlGroup num="04" title="Light cladding — signal house" hint={`${s.lightArea}m² facade`}
          options={LIGHT} selectedKey={state.lightMat}
          onChange={(v) => setState({ ...state, lightMat: v })} />
      </div>

      <div className="schemecard__results">
        <div className="results-row">
          <ResultCard
            label="Embodied carbon · design-side"
            value={<span><b>{Math.round(r.dsCarbonPerM2)}</b><span className="mono"> kgCO₂e/m²</span></span>}
            sub={`Structure + facade + basement · all-in incl. MEP: ${Math.round(r.carbonPerM2)}`}
            accent
          />
          <ResultCard
            label="Construction cost · all-in"
            value={<span><b>{fmtMoneyPerM2(r.costPerM2)}</b><span className="mono"> /m²</span></span>}
            sub={`${fmtSigned(r.deltaCost, "%")} vs baseline · ${fmtMoneyTotal(r.costTotal)} total · range ${fmtMoneyPerM2(r.sensitivityLow)}–${fmtMoneyPerM2(r.sensitivityHigh)} (±10%)`}
          />
        </div>
        <div className="results-row">
          <ResultCard
            label={`Whole-life carbon · ${OPERATIONAL.life}yr life`}
            value={<span><b>{Math.round(r.wholeLifePerM2)}</b><span className="mono"> kgCO₂e/m²</span></span>}
            sub={`Embodied ${Math.round(r.carbonPerM2)} + operational ${Math.round(r.operationalPerM2)}${r.biogenicPerM2 ? " − biogenic " + Math.abs(Math.round(r.biogenicPerM2)) : ""}`}
          />
          <ResultCard
            label="Biogenic sequestration"
            value={r.biogenicPerM2 ? <span><b>{Math.round(r.biogenicPerM2)}</b><span className="mono"> kgCO₂e/m²</span></span> : <span style={{color: 'var(--fg-dim)', fontSize: 18}}>None — no timber structure</span>}
            sub={r.biogenicPerM2 ? `Stored carbon in CLT, released only if burned. ${Math.abs(Math.round(r.biogenic / 1000)).toLocaleString()}t total.` : ""}
          />
        </div>

        <CarbonGauge value={r.dsCarbonPerM2} baseline={BASELINE.carbon} targets={TARGETS} />

        <details className="breakdown" open>
          <summary className="breakdown__summary mono">Breakdown · contributions to embodied carbon</summary>
          <table className="breakdown__table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Selection</th>
                <th>kgCO₂e total</th>
                <th>Cost total</th>
              </tr>
            </thead>
            <tbody>
              {["structure", "basement", "heavy", "light", "penalty", "biogenic", "rest"].map((k) => {
                const b = r.breakdown[k];
                if (k === "biogenic" && b.carbon === 0) return null;
                if (k === "penalty" && b.carbon === 0) return null;
                return (
                  <tr key={k} className={k === "rest" ? "breakdown__rest" : (k === "biogenic" ? "breakdown__biogenic" : (k === "penalty" ? "breakdown__penalty" : ""))}>
                    <th>{({structure:"Primary structure",basement:"Basement",heavy:"Heavy facade",light:"Light cladding",penalty:"Cantilever premium",biogenic:"Biogenic sequestration",rest:"Rest of build (fixed)"})[k]}</th>
                    <td>{b.lbl}</td>
                    <td>{Math.round(b.carbon).toLocaleString()}</td>
                    <td>{b.cost === 0 ? "—" : fmtMoney(b.cost)}</td>
                  </tr>
                );
              })}
              <tr className="breakdown__totals">
                <th colSpan={2}>Total · embodied + biogenic + rest</th>
                <td>{Math.round(r.carbonTotal + r.biogenic).toLocaleString()}</td>
                <td>{fmtMoney(r.costTotal)}</td>
              </tr>
            </tbody>
          </table>
        </details>
      </div>
    </section>
  );
}

function CompareRow({ stateA, stateB }) {
  const ra = calcScheme(stateA, "A");
  const rb = calcScheme(stateB, "B");
  const carbonDelta = ((rb.dsCarbonPerM2 - ra.dsCarbonPerM2) / ra.dsCarbonPerM2) * 100;
  const costDelta   = ((rb.costPerM2 - ra.costPerM2) / ra.costPerM2) * 100;
  const wlcDelta    = ((rb.wholeLifePerM2 - ra.wholeLifePerM2) / ra.wholeLifePerM2) * 100;
  return (
    <section className="compare">
      <div className="compare__head">
        <Eyebrow>Side-by-side</Eyebrow>
        <h3 className="compare__title">Path A &nbsp;↔&nbsp; Path B</h3>
      </div>
      <div className="compare__grid">
        <div className="compare__row">
          <div className="compare__lbl mono">Design-side carbon</div>
          <div className="compare__a">{Math.round(ra.dsCarbonPerM2)}<span className="mono"> kgCO₂e/m²</span></div>
          <div className="compare__arrow mono">→</div>
          <div className="compare__b">{Math.round(rb.dsCarbonPerM2)}<span className="mono"> kgCO₂e/m²</span></div>
          <div className={"compare__delta " + (carbonDelta < 0 ? "is-better" : "is-worse")}>{fmtSigned(carbonDelta, "%")}</div>
        </div>
        <div className="compare__row">
          <div className="compare__lbl mono">Construction cost</div>
          <div className="compare__a">{fmtMoneyPerM2(ra.costPerM2)}<span className="mono"> /m²</span></div>
          <div className="compare__arrow mono">→</div>
          <div className="compare__b">{fmtMoneyPerM2(rb.costPerM2)}<span className="mono"> /m²</span></div>
          <div className={"compare__delta " + (costDelta < 0 ? "is-better" : "is-worse")}>{fmtSigned(costDelta, "%")}</div>
        </div>
        <div className="compare__row">
          <div className="compare__lbl mono">Whole-life carbon</div>
          <div className="compare__a">{Math.round(ra.wholeLifePerM2)}<span className="mono"> kgCO₂e/m²</span></div>
          <div className="compare__arrow mono">→</div>
          <div className="compare__b">{Math.round(rb.wholeLifePerM2)}<span className="mono"> kgCO₂e/m²</span></div>
          <div className={"compare__delta " + (wlcDelta < 0 ? "is-better" : "is-worse")}>{fmtSigned(wlcDelta, "%")}</div>
        </div>
        <div className="compare__row">
          <div className="compare__lbl mono">Total construction cost</div>
          <div className="compare__a">{fmtMoneyTotal(ra.costTotal)}</div>
          <div className="compare__arrow mono">→</div>
          <div className="compare__b">{fmtMoneyTotal(rb.costTotal)}</div>
          <div className="compare__delta">over {SCHEMES.B.GIA - SCHEMES.A.GIA}m² more GIA</div>
        </div>
      </div>
    </section>
  );
}

function ScenarioBar({ state, setState }) {
  function apply(presetKey, scheme) {
    const p = PRESETS[presetKey];
    const s = { structure: p.structure, basement: p.basement, heavyMat: p.heavyMat, lightMat: p.lightMat };
    if (scheme === "both") setState({ A: s, B: s });
    else if (scheme === "A") setState({ ...state, A: s });
    else if (scheme === "B") setState({ ...state, B: s });
  }
  return (
    <div className="scenarios">
      <div className="scenarios__lbl mono">Scenario presets</div>
      {Object.entries(PRESETS).map(([k, p]) => (
        <div className="scenario" key={k}>
          <div className="scenario__top">
            <span className="scenario__name">{p.label}</span>
            <span className="scenario__note mono">{p.note}</span>
          </div>
          <div className="scenario__actions">
            <button className="scenario__btn" onClick={() => apply(k, "A")}>→ A</button>
            <button className="scenario__btn" onClick={() => apply(k, "B")}>→ B</button>
            <button className="scenario__btn scenario__btn--both" onClick={() => apply(k, "both")}>→ Both</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Calculator({ onClose }) {
  const [state, setStateRaw] = React.useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("twcf-calc") || "null");
      if (s && s.A && s.B) return s;
    } catch {}
    return DEFAULT_STATE;
  });
  const setState = (s) => {
    setStateRaw(s);
    try { localStorage.setItem("twcf-calc", JSON.stringify(s)); } catch {}
  };
  const setA = (a) => setState({ ...state, A: a });
  const setB = (b) => setState({ ...state, B: b });
  const syncFromB = () => setState({ ...state, A: { ...state.B } });
  const syncFromA = () => setState({ ...state, B: { ...state.A } });

  function resetDefaults() { setState(DEFAULT_STATE); }
  function doPrint() { window.print(); }

  return (
    <div className="calc">
      <header className="calc__head">
        <div className="calc__head-left">
          <Logo size="sm" />
          <div className="calc__head-doc mono">1820 Goods Way · Design-Side Viability Calculator</div>
        </div>
        <div className="calc__head-right">
          <button className="calc__btn" onClick={doPrint} title="Print or save as PDF">⎙ PDF</button>
          <button className="calc__btn" onClick={resetDefaults}>Reset</button>
          <button className="calc__btn calc__btn--primary" onClick={onClose}>← Back to document</button>
        </div>
      </header>

      <section className="calc__intro">
        <Eyebrow>§15 · Design-side viability tool</Eyebrow>
        <h1 className="calc__title">Cost &amp; carbon comparison.</h1>
        <p className="calc__sub">
          A design-side study — not a financial viability appraisal. Switch primary structure, basement, heavy facade material and signal-house cladding for each scheme to see the resulting embodied carbon and construction cost, and whether they meet 2025 / 2030 industry carbon targets. The "rest of build" — MEP, fit-out, externals, prelims, professional fees — is held constant at an indicative central London office rate so the totals are realistic; the choices in this tool move structure, basement and facade only.
        </p>
        <div className="calc__sub-meta mono">
          Baseline · {BASELINE.carbon.toLocaleString()} kgCO₂e/m² GIA · {fmtMoney(BASELINE.cost)} /m² · RC frame + unitised curtain wall + single basement
        </div>
        <div className="calc__sub-meta mono" style={{color: 'var(--fg-dim)'}}>
          Rest of build (fixed) · {REST.carbon} kgCO₂e/m² · {fmtMoney(REST.cost)} /m² · MEP, Cat A fit-out, externals, prelims, fees<br/>
          Operational carbon · {OPERATIONAL.carbon} kgCO₂e/m²/yr · {OPERATIONAL.life}yr life · Cost shown with ±{Math.round(SENSITIVITY*100)}% sensitivity band
        </div>
      </section>

      <ScenarioBar state={state} setState={setState} />

      <section className="calc__grid">
        <SchemeCard
          schemeKey="A" state={state.A} setState={setA}
          otherState={state.B} otherKey="B" onSync={syncFromB}
        />
        <SchemeCard
          schemeKey="B" state={state.B} setState={setB}
          otherState={state.A} otherKey="A" onSync={syncFromA}
        />
      </section>

      <CompareRow stateA={state.A} stateB={state.B} />

      <section className="calc__caveat">
        <Eyebrow>Caveats</Eyebrow>
        <p>
          Indicative pre-planning estimates based on published embodied-carbon datasets (ICE, ECC, EPDs from named manufacturers) and current UK construction rates (Q2 2026). Figures show <strong>design-side scope</strong> — structure, basement, and primary facade systems — plus a fixed adder for MEP, fit-out, externals, prelims, and professional fees so the totals are realistic. Operational energy is an estimate based on typical Cat A office energy use intensity. Land cost, finance, rent, yield and tax are out of scope. Final figures will be subject to detailed design, contractor procurement, market conditions, and a formal cost plan at RIBA Stage 2. Path A and Path B are not directly comparable — they deliver different total GIA — so values are presented per m² GIA. Cost figures shown with ±{Math.round(SENSITIVITY*100)}% sensitivity band reflecting RIBA Stage 2 typical uncertainty.
        </p>
      </section>
    </div>
  );
}

export { Calculator };
