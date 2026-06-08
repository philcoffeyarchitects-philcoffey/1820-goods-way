// pages.jsx
// All pages of "The Crossing". Each page has a fixed 1280×905
// frame and carries TWO renderers, `presentation` (image-led, sparse) and
// `report` (text-led, descriptive). Navigation moves between pages; the
// P/R toggle swaps which renderer fills the body of the current page.

import React from "react";
import { Placeholder, Eyebrow, Cap, Logo, DEFAULT_ASPECTS } from "./placeholder.jsx";

// ─── small layout helpers ──────────────────────────────────────────────

function PresCover({ filename, caption, overlay, src, overlayMode, align }) {
  const cls = "pc-cover__overlay"
    + (overlayMode === "mini" ? " pc-cover__overlay--mini" : "")
    + (align === "right" ? " pc-cover__overlay--right" : "");
  return (
    <div className="pc-cover">
      <Placeholder filename={filename} caption={caption} variant="photo" fill src={src} />
      <div className={cls}>{overlay}</div>
    </div>
  );
}

function PresStatement({ kicker, title, body, align = "left" }) {
  const cls = "pc-stmt" + (align === "right" ? " pc-stmt--right" : align === "centre" ? " pc-stmt--centre" : "");
  return (
    <div className={cls}>
      {kicker ? <Eyebrow>{kicker}</Eyebrow> : null}
      {title ? <h2 className="h-title">{title}</h2> : null}
      {body ? <div className="pres-copy">{body}</div> : null}
    </div>
  );
}

function PresImage({ filename, caption, capIdx, capTitle, capMeta, variant = "photo", number, aspect }) {
  const ar = aspect || DEFAULT_ASPECTS[variant] || "3/2";
  return (
    <div className="pc-img">
      <div className="pc-img__frame">
        <Placeholder filename={filename} caption={caption} variant={variant} number={number} aspect={ar} />
      </div>
      <div className="pc-img__cap">
        {capIdx ? <span className="idx">{capIdx}</span> : null}
        {capTitle ? <span className="title">{capTitle}</span> : null}
        {capMeta ? <span className="meta">{capMeta}</span> : null}
      </div>
    </div>
  );
}

function ReportImageText({
  filename, caption, capIdx, capTitle,
  kicker, title, body,
  variant = "photo", number, aspect, reverse = false,
}) {
  const ar = aspect || DEFAULT_ASPECTS[variant] || "3/2";
  return (
    <div className={"pc-imgtext" + (reverse ? " pc-imgtext--reverse" : "")}>
      <div className="pc-imgtext__media">
        <div className="pc-imgtext__media__image">
          <Placeholder filename={filename} caption={caption} variant={variant} number={number} aspect={ar} />
        </div>
        <div className="pc-imgtext__caption"><b>{capIdx}</b>{capTitle}</div>
      </div>
      <div className="pc-imgtext__text">
        {kicker ? <Eyebrow>{kicker}</Eyebrow> : null}
        {title ? <h2 className="h-sub">{title}</h2> : null}
        {body ? <div className="prose">{body}</div> : null}
      </div>
    </div>
  );
}

function ReportProse({ kicker, title, body }) {
  return (
    <div className="pc-prose">
      <div className="pc-prose__head">
        {kicker ? <Eyebrow>{kicker}</Eyebrow> : null}
        {title ? <h2 className="h-title">{title}</h2> : null}
      </div>
      <div className="pc-prose__body">
        <div className="prose">{body}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Stable-ID registry. Every page and section gets a stable, content-based
// id (slug). sectionPages() populates these maps as a side effect, so the
// runtime page order can be controlled by an external JSON file
// (public/deck-order.json) without ever drifting from the source code.
// ═══════════════════════════════════════════════════════════════════════
const ALL_PAGES_BY_ID = {};       // id -> page object (one per page definition)
const ALL_SECTIONS_BY_ID = {};    // id -> { id, label, title, originalNum }
// DEFAULT_ITEMS is derived at the bottom of this file from the source-order
// PAGES concat (which is the canonical authored order). sectionPages() does
// not populate it directly because the file's evaluation order is not the
// deck's display order.

const _sectionIdCount = {};
const _pageIdCount = {};

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqId(base, counts) {
  counts[base] = (counts[base] || 0) + 1;
  return counts[base] === 1 ? base : `${base}-${counts[base]}`;
}

// helper: build a section of pages with shared metadata
function sectionPages(meta, pages) {
  // Section id, explicit override > slugified label > slugified title
  const baseSectionId = slugify(meta.sectionId || meta.sectionLabel || meta.sectionTitle || `section-${meta.sectionNum}`);
  const sectionId = uniqId(baseSectionId, _sectionIdCount);
  ALL_SECTIONS_BY_ID[sectionId] = {
    id: sectionId,
    originalNum: meta.sectionNum,
    label: meta.sectionLabel,
    title: meta.sectionTitle,
  };

  return pages.map((p, i) => {
    // Page id, explicit override > sectionId + slug(label) > sectionId + index
    const baseLabel = p.id ? p.id : (p.label ? `${sectionId}-${slugify(typeof p.label === "string" ? p.label : `page-${i+1}`)}` : `${sectionId}-p${i+1}`);
    const id = uniqId(baseLabel, _pageIdCount);
    const obj = {
      id,
      sectionId,
      sectionNum: meta.sectionNum,           // initial; overridden by buildPages at runtime
      sectionTitle: meta.sectionTitle,       // initial; overridden by buildPages at runtime
      sectionLabel: meta.sectionLabel,       // initial; overridden by buildPages at runtime
      pageInSection: i + 1,                  // initial; overridden by buildPages at runtime
      totalInSection: pages.length,          // initial; overridden by buildPages at runtime
      label: p.label,
      isDivider: !!p.isDivider,
      presentation: p.presentation,
      report: p.report,
      // `inCurated` controls whether the page appears in the deck's curated
      // mode (toggle in the top bar). Default true — page-by-page overrides
      // happen on slides in the city/tenant walks.
      inCurated: p.inCurated !== false,
    };
    ALL_PAGES_BY_ID[id] = obj;
    return obj;
  });
}

// ── Divider + TOC components, act breaks, chrome hidden ─────────────────
function Divider({ range, title, sub }) {
  return (
    <div className="divider">
      <span className="divider__range mono">{range}</span>
      <h1 className="divider__title">{title}</h1>
      {sub ? <div className="divider__sub">{sub}</div> : null}
    </div>
  );
}

const TOC_ROWS = [
  ["Part I",   "Responsiveness to site, context and constraints"],
  ["",         "Legacy · Water · Site · Constraints · Site Walk"],
  ["Part II",  "Planning and delivery realism"],
  ["",         "Challenge · Families · Two Studies · Canopy · Signal Box"],
  ["Part III", "Alignment with client objectives and commercial drivers"],
  ["",         "Viability · The Tenant · The Crossing · Cost"],
  ["Part IV",  "Quality and clarity of vision"],
  ["",         "Our Direction · Materials · Sustainability · Closing"],
];

function TOCPage() {
  return (
    <div className="toc">
      <div className="toc__head">
        <span className="mono">A roadmap · four parts</span>
        <h1 className="toc__title">What's in this conversation.</h1>
      </div>
      <ol className="toc__list">
        {TOC_ROWS.map(([num, name], i) => (
          <li key={i} className={num ? "toc__part" : "toc__under"}>
            <span className="toc__num mono">{num}</span>
            <span className="toc__name">{name}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Structural pages: the four Parts (mirroring KXG's evaluation criteria),
// plus the interim recap and cost placeholders. These carry sentinel section
// numbers (>= 100) so the chrome renders them as un-numbered dividers rather
// than as numbered content sections. See app.jsx rail / counter.
function partDivider(id, num, range, title, sub) {
  return sectionPages(
    { sectionId: id, sectionNum: num, sectionTitle: range, sectionLabel: range },
    [{
      label: range,
      isDivider: true,
      presentation: () => <Divider range={range} title={title} sub={sub} />,
      report:       () => <Divider range={range} title={title} sub={sub} />,
    }]
  );
}

const PART_I = partDivider("part-i", 101, "Part I",
  "Responsiveness to site, context and constraints.",
  "The legacy, the origin, the site, the walk. The understanding that earns the proposal.");
const PART_II = partDivider("part-ii", 102, "Part II",
  "Planning and delivery realism.",
  "The challenge interrogated, the families tested, the two studies that survive.");
const PART_III = partDivider("part-iii", 103, "Part III",
  "Alignment with client objectives and commercial drivers.",
  "Viability, the tenant, the floor plate, the cost. The commercial argument that the building works.");
const PART_IV = partDivider("part-iv", 104, "Part IV",
  "Quality and clarity of vision.",
  "Our direction. The building, in plan, elevation, and in the round.");

const SRecap = sectionPages(
  { sectionId: "interim-recap", sectionNum: 100, sectionTitle: "Since the interim", sectionLabel: "Since the interim" },
  [{
    label: "Since the interim (placeholder)",
    presentation: () => (
      <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
        <Eyebrow>Since the interim · 22 May 2026</Eyebrow>
        <h2 className="h-title" style={{marginBottom: 14}}>What we showed, and what we have sharpened.</h2>
        <div className="prose tight" style={{maxWidth: '72ch', border: '1px dashed var(--fg-dim)', padding: '18px 20px', borderRadius: 4}}>
          <p className="mono" style={{fontSize: 11, letterSpacing: 0.08, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8}}>Placeholder · to build together</p>
          <p>A short recap of the interim presentation, and the moves we have made since: lighter at height, the core off the south, area and efficiency answered, sustainability made deliverable.</p>
          <p><em>This page signals that the final entry is a considered second move, not a fresh start.</em></p>
        </div>
      </div>
    ),
    report: () => (
      <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
        <Eyebrow>Since the interim · 22 May 2026</Eyebrow>
        <h2 className="h-title" style={{marginBottom: 10}}>What we showed at the interim, and what we have sharpened.</h2>
        <div className="prose tight" style={{maxWidth: '78ch', border: '1px dashed var(--fg-dim)', padding: '18px 20px', borderRadius: 4}}>
          <p className="mono" style={{fontSize: 11, letterSpacing: 0.08, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8}}>Placeholder · to build together</p>
          <p>Summarise the interim direction shown to KXG on 22 May, then set out the development since: the moves toward lightness, the relocated core, the area and efficiency case, and a sustainability target reframed as deliverable rather than restrictive.</p>
        </div>
      </div>
    ),
  }]
);

const SCost = sectionPages(
  { sectionId: "cost", sectionNum: 105, sectionTitle: "Cost", sectionLabel: "Cost" },
  [{
    label: "Cost (placeholder)",
    presentation: () => (
      <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
        <Eyebrow>Cost · Commercial</Eyebrow>
        <h2 className="h-title" style={{marginBottom: 14}}>Efficient area, sensible cost.</h2>
        <div className="prose tight" style={{maxWidth: '72ch', border: '1px dashed var(--fg-dim)', padding: '18px 20px', borderRadius: 4}}>
          <p className="mono" style={{fontSize: 11, letterSpacing: 0.08, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8}}>Placeholder · to build together</p>
          <p>The cost and commercial story sits here: efficiency (NIA to GIA), the rate the area lets at, and a high level cost position. Numbers run live in the calculator (top right).</p>
        </div>
      </div>
    ),
    report: () => (
      <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
        <Eyebrow>Cost · Commercial</Eyebrow>
        <h2 className="h-title" style={{marginBottom: 10}}>Efficient area, sensible cost.</h2>
        <div className="prose tight" style={{maxWidth: '78ch', border: '1px dashed var(--fg-dim)', padding: '18px 20px', borderRadius: 4}}>
          <p className="mono" style={{fontSize: 11, letterSpacing: 0.08, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8}}>Placeholder · to build together</p>
          <p>High level commercial commentary: the efficiency case (NIA to GIA), indicative rent and cost per square foot, and how the scheme answers the concern that the consented design was inefficient with low NIA. The calculator quantifies the area, cost and carbon implications.</p>
        </div>
      </div>
    ),
  }]
);

// Sustainability, practical. The commercial-framed sustainability page for
// Part III — argues that the building moves that make the scheme buildable
// also make it sustainable (no basement, no long cantilevers, light
// structure, low embodied carbon). Calculator-led: the trade-off lives on
// the top-right toolbar. Sentinel sectionNum so the rail shows it as
// un-numbered, matching Cost / The tenant.
const SSustainability = sectionPages(
  { sectionId: "sustainability", sectionNum: 109, sectionTitle: "Sustainability", sectionLabel: "Sustainability" },
  [{
    label: "Sustainability, practical",
    presentation: () => (
      <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
        <Eyebrow>Sustainability · Cost · The Calculator</Eyebrow>
        <h2 className="h-title" style={{marginBottom: 4}}>Sustainability and cost.</h2>
        <div className="prose" style={{fontSize: 18, color: 'var(--fg-soft)', marginBottom: 22, maxWidth: '64ch'}}>
          A commercial driver, balanced and measured.
        </div>
        <ol className="numlist">
          {[
            "Tenants pay a premium for credentials. Excellent earns the most.",
            "Sustainability here is a commercial driver, not an ideology.",
            "We meet the credentials that earn the rent. Not the ones that don't.",
            "Specifics — materials, structure, Calculator workings — come with the building in Part IV.",
          ].map((t, i) => (
            <li className="numlist__item" key={i}>
              <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
              <div><div className="numlist__title">{t}</div></div>
            </li>
          ))}
        </ol>
        <div style={{marginTop: 18, padding: '12px 16px', background: 'rgba(180, 96, 30, 0.05)', border: '1px solid var(--accent)', borderRadius: 2}}>
          <div className="mono" style={{fontSize: 10, color: 'var(--accent)', letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 5, fontWeight: 500}}>∑ The Calculator</div>
          <div style={{fontSize: 12, color: 'var(--fg)', lineHeight: 1.5}}>
            Open the <strong style={{color: 'var(--accent)'}}>∑ Calculator</strong> in the top toolbar. Cost against embodied carbon, live as the scheme develops. <em>Early days, but the right tool for the balance.</em>
          </div>
        </div>
        <div style={{marginTop: 10, padding: '12px 16px', background: 'rgba(180, 96, 30, 0.04)', borderLeft: '2px solid var(--accent)'}}>
          <div className="mono" style={{fontSize: 10, color: 'var(--accent)', letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 5}}>A note on approach</div>
          <div style={{fontSize: 12, color: 'var(--fg)', lineHeight: 1.45, fontStyle: 'italic'}}>
            A building is not designed in one or two client meetings, and we don't pretend to have. We think the direction is right. We are not wedded to it. When the information changes, the building will.
          </div>
        </div>
      </div>
    ),
    report: () => (
      <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
        <Eyebrow>Sustainability · Cost · The Calculator</Eyebrow>
        <h2 className="h-title" style={{marginBottom: 8}}>Sustainability and cost.</h2>
        <div className="prose tight" style={{maxWidth: '78ch'}}>
          <p>The boutique segment we are building for pays a premium for credentials. An <strong>Excellent rating</strong> earns real rent on a building of this kind; a building without one does not. So sustainability on this project is a commercial driver, not an ideology. We treat it accordingly.</p>
          <p>We will meet the credentials that earn the rent, and not the ones that don't. The balance between ambition and cost is the live conversation, kept with the engineers we work with and the client we hope to serve. <strong>The specific material and structural decisions that deliver this position are presented in Part IV</strong>, where the building itself is shown.</p>
          <p>There are decisions still open on the route to it. How much ambition is the project willing to pay for, and where. Which materials and which structural moves do the most for the rating without breaking the cost. We measure. We think long and hard about every move. We are not interested in greenwash, and we are not interested in zealotry that breaks the project.</p>
        </div>
        <div style={{marginTop: 16, padding: '14px 18px', background: 'rgba(180, 96, 30, 0.05)', border: '1px solid var(--accent)', borderRadius: 2, maxWidth: '78ch'}}>
          <div className="mono" style={{fontSize: 10, color: 'var(--accent)', letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6, fontWeight: 500}}>∑ The Calculator</div>
          <div style={{fontSize: 12.5, color: 'var(--fg)', lineHeight: 1.55}}>
            Open the <strong style={{color: 'var(--accent)'}}>∑ Calculator</strong> in the top toolbar. It plots cost against embodied carbon for every material decision the building makes, so the balance stays live as the scheme develops. <em>It is early days — the workings are still being calibrated — but it is the right tool for the argument we are making, and we will use it through the design.</em>
          </div>
        </div>
        <div style={{marginTop: 12, padding: '14px 18px', background: 'rgba(180, 96, 30, 0.04)', borderLeft: '2px solid var(--accent)', maxWidth: '78ch'}}>
          <div className="mono" style={{fontSize: 10, color: 'var(--accent)', letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6}}>A note on approach</div>
          <div style={{fontSize: 12.5, color: 'var(--fg)', lineHeight: 1.55, fontStyle: 'italic'}}>
            Many competitions, much experience. A building is not designed in one or two client meetings, and we don't pretend to have. We have taken our best view with the site as it is, the engineers who know this ground, and the information available now. We think the direction is right. We are not wedded to it. As the information changes, the building will. This presentation is a starting point, not a finished position — and we hope it reads that way throughout.
          </div>
        </div>
      </div>
    ),
  }]
);

// The form, a pure extrusion. Standalone Part III content page sitting
// after Sustainability and before Summary, Part III. The argument is
// commercial-as-form: the discipline that keeps the office a pure
// extrusion is what maximises NIA on this site, simplifies delivery,
// and reduces embodied carbon. Complexity is tested against value —
// accepted at the canopy and signal box where it pays, refused
// elsewhere. Reads as the FORM PRINCIPLE that delivers Part III's
// commercial outcomes (more area, lower cost, higher rating).
const SExtrusion = sectionPages(
  { sectionId: "extrusion", sectionNum: 109, sectionTitle: "The form, a pure extrusion", sectionLabel: "The form" },
  [
    {
      label: "A pure extrusion",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Part III · The form</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>A pure extrusion.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 22}}>
            Maximum area by discipline. Complexity tested against value.
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 480px', gap: 36, alignItems: 'start'}}>
            <ol className="numlist">
              {[
                "A pure extrusion on the simplest part of the site. Simple shape, simple delivery.",
                "Curved to the boundary. No kink, no cut. Every metre of the site, used.",
                "Simple is sustainable. Less material, less complexity, less waste.",
                "Complexity tested against value. Accepted at the canopy and the signal box. Refused elsewhere.",
              ].map((t, i) => (
                <li className="numlist__item" key={i}>
                  <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
                  <div><div className="numlist__title">{t}</div></div>
                </li>
              ))}
            </ol>
            <div style={{width: 480, height: 480}}>
              <Placeholder filename="pure-extrusion-sketch.jpg" variant="sketch" aspect="1/1" caption="Pure extrusion, curved to the boundary" />
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Part III · The form</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 10}}>A pure extrusion.</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 36, alignItems: 'start'}}>
            <div className="prose tight" style={{maxWidth: '64ch'}}>
              <p>The office plan is a pure extrusion on the simplest part of the site. We do not kink it. We do not cut into it. <strong>We curve the corner where the site curves</strong>, so that every square metre of the boundary becomes usable area, but the move stays single and disciplined.</p>
              <p>This is the simplest building to construct and the cheapest to deliver. It is also, by discipline alone, the most sustainable: less material, less complexity, less waste. The simple shape is the green shape, and the green shape is the rentable shape.</p>
              <p>The same logic governs where we accept complexity. We add it only where it earns its place. <strong>At the canopy</strong>, where the public threshold earns the cost. <strong>At the signal box</strong>, where the structural action unlocks the height. Complexity is tested against value, not added as architecture for its own sake.</p>
              <p><em>Plain where plainness is right. Brave where bravery is paid for.</em></p>
            </div>
            <div style={{width: 420, height: 420}}>
              <Placeholder filename="pure-extrusion-sketch.jpg" variant="sketch" aspect="1/1" caption="Pure extrusion, curved to the boundary" />
            </div>
          </div>
        </div>
      ),
    },
    // Second page of SExtrusion — moved here from Summary, Part II so that
    // "the main brick body" sits in the form / facade conversation rather
    // than at the close of Part II. Two A4-landscape sketch slots.
    {
      label: "The main brick body of the building",
      presentation: () => (
        <div style={{position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 460, height: 325}}>
            <Placeholder filename="main-body-sketch-01.jpg" variant="sketch" aspect="1.414/1" caption="The main brick body, design development of the office facade" />
          </div>
          <div style={{position: 'absolute', bottom: 36, left: 36, zIndex: 2, background: 'rgba(252, 250, 246, 0.62)', backdropFilter: 'blur(10px) saturate(120%)', WebkitBackdropFilter: 'blur(10px) saturate(120%)', borderTop: '2px solid var(--accent)', padding: '12px 18px 14px', display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 460, boxShadow: '0 12px 32px rgba(0,0,0,0.08)'}}>
            <span className="mono" style={{color: 'var(--accent)', fontWeight: 500, fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase'}}>Part III · The body</span>
            <h2 className="h-title" style={{margin: 0, fontSize: 30, lineHeight: 1.06}}>The main brick body of the building.</h2>
            <span style={{fontSize: 14, color: 'var(--fg-soft)', lineHeight: 1.4, marginTop: 4}}>Design development of the office facade.</span>
            <span className="mono" style={{fontSize: 10, color: 'var(--fg-dim)', letterSpacing: 0.14, textTransform: 'uppercase', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--rule-soft)'}}>Sketch · 01</span>
          </div>
        </div>
      ),
      report: () => (
        <div style={{position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 460, height: 325}}>
            <Placeholder filename="main-body-sketch-01.jpg" variant="sketch" aspect="1.414/1" caption="The main brick body, design development of the office facade" />
          </div>
          <div style={{position: 'absolute', bottom: 36, left: 36, zIndex: 2, background: 'rgba(252, 250, 246, 0.62)', backdropFilter: 'blur(10px) saturate(120%)', WebkitBackdropFilter: 'blur(10px) saturate(120%)', borderTop: '2px solid var(--accent)', padding: '12px 18px 14px', display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 520, boxShadow: '0 12px 32px rgba(0,0,0,0.08)'}}>
            <span className="mono" style={{color: 'var(--accent)', fontWeight: 500, fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase'}}>Part III · The body</span>
            <h2 className="h-title" style={{margin: 0, fontSize: 30, lineHeight: 1.06}}>The main brick body of the building.</h2>
            <span style={{fontSize: 13.5, color: 'var(--fg-soft)', lineHeight: 1.5, marginTop: 6}}>Design development of the office facade. The sketch reads the body of the building as a continuous brick, with floor plates and openings worked through in the studio.</span>
            <span className="mono" style={{fontSize: 10, color: 'var(--fg-dim)', letterSpacing: 0.14, textTransform: 'uppercase', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--rule-soft)'}}>Sketch · 01</span>
          </div>
        </div>
      ),
    },
  ]
);

// Place at the top and bottom. Was inside STenant; now lives as its own
// section so it can sit at the END of Part III's arc, mirroring the
// summary order (tenant → plate → form → sustainability → place). The
// "place pays" callout makes the commercial close.
const SPlace = sectionPages(
  { sectionId: "place", sectionNum: 111, sectionTitle: "Place at the top and bottom", sectionLabel: "Place" },
  [
    {
      label: "City and tenant journeys",
      presentation: () => (
        <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', columnGap: 28, height: '100%', minHeight: 0, alignItems: 'stretch'}}>
          <div style={{display: 'flex', flexDirection: 'column', minWidth: 0, paddingTop: 2}}>
            <Eyebrow>Part III · Place</Eyebrow>
            <h2 className="h-title" style={{marginTop: 20, marginBottom: 14, fontSize: 32, lineHeight: 1.05}}>City and tenant journeys.</h2>
            <div style={{fontSize: 15, color: 'var(--fg-soft)', lineHeight: 1.45, marginBottom: 18}}>
              Connecting the canopy at the foot to the room at the top.
            </div>
            <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: 'var(--fg-soft)', lineHeight: 1.4}}>
              {[
                "Lobby and entrance from Goods Way.",
                "Bike storage, end-of-trip facilities, lifts at the foot.",
                "Café at the ground, opening to the canal.",
                "Lift core exits straight onto the plate. Views and balconies above.",
                "A room at the top: green, indoor and outdoor.",
                "Let, co-working, or public. Open to discuss.",
              ].map((b, i) => (
                <li key={i} style={{paddingLeft: 14, position: 'relative'}}>
                  <span style={{position: 'absolute', left: 0, color: 'var(--accent)', fontWeight: 500}}>·</span>{b}
                </li>
              ))}
            </ul>
            <div style={{marginTop: 16, padding: '12px 14px', background: 'rgba(180, 96, 30, 0.04)', borderLeft: '2px solid var(--accent)'}}>
              <div className="mono" style={{fontSize: 10, color: 'var(--accent)', letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 5}}>Place pays</div>
              <div style={{fontSize: 12, color: 'var(--fg)', lineHeight: 1.45, fontStyle: 'italic'}}>
                The team that wants to come to the office is the tenant who'll pay rent for the privilege. We design for that.
              </div>
            </div>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
            <div style={{flex: '1 1 0', minHeight: 0, position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid var(--rule-soft)'}}>
              <Placeholder filename="place-section-diagram.jpg" caption="Building section, foot to top: café, lobby, lifts, plates, roof" variant="diagram" fill fitMode="contain" />
            </div>
            <div className="mono" style={{marginTop: 6, fontSize: 10.5, letterSpacing: 0.08, color: 'var(--accent)', textTransform: 'uppercase'}}>Section · Foot to top</div>
          </div>
        </div>
      ),
      report: () => (
        <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', columnGap: 28, height: '100%', minHeight: 0, alignItems: 'stretch'}}>
          <div style={{display: 'flex', flexDirection: 'column', minWidth: 0, paddingTop: 2}}>
            <Eyebrow>Part III · Place</Eyebrow>
            <h2 className="h-title" style={{marginTop: 20, marginBottom: 12, fontSize: 32, lineHeight: 1.05}}>City and tenant journeys.</h2>
            <div className="prose tight" style={{fontSize: 13, color: 'var(--fg-soft)', lineHeight: 1.5}}>
              <p>The canopy at the foot and the signal box at the top are the building's two big moves. The tenant experience is what connects them.</p>
              <p><strong>At the ground:</strong> lobby and entrance from Goods Way, bike storage, end-of-trip facilities, lifts. A café opening to the canal.</p>
              <p><strong>On the plate:</strong> the lift core exits straight onto the floor, no double-circulation tax. Views and balconies above the canal.</p>
              <p><strong>At the top:</strong> a room that could be green, indoor or outdoor, let to a tenant or run as co-working. Whether it is public or private is open to discuss.</p>
              <p><em>If appointed, these are the next questions we would answer.</em></p>
            </div>
            <div style={{marginTop: 14, padding: '12px 14px', background: 'rgba(180, 96, 30, 0.04)', borderLeft: '2px solid var(--accent)'}}>
              <div className="mono" style={{fontSize: 10, color: 'var(--accent)', letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 5}}>Place pays</div>
              <div style={{fontSize: 12, color: 'var(--fg)', lineHeight: 1.45, fontStyle: 'italic'}}>
                Placemaking is a commercial argument. The team that wants to come to the office is the tenant who'll pay rent for the privilege, and the boss who signs the lease knows it. We design for that.
              </div>
            </div>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
            <div style={{flex: '1 1 0', minHeight: 0, position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid var(--rule-soft)'}}>
              <Placeholder filename="place-section-diagram.jpg" caption="Building section, foot to top: café, lobby, lifts, plates, roof" variant="diagram" fill fitMode="contain" />
            </div>
            <div className="mono" style={{marginTop: 6, fontSize: 10.5, letterSpacing: 0.08, color: 'var(--accent)', textTransform: 'uppercase'}}>Section · Foot to top</div>
          </div>
        </div>
      ),
    },
  ]
);

// Summary, Part III. ONE page — title + four conclusions in a numlist.
// Part III's argument is short (one §09 + tenant + place + plate +
// sustainability + extrusion) so the summary doesn't earn four pages of
// its own. This single-page form closes the commercial argument before
// Part IV's design reveal.
const SSummaryIII = sectionPages(
  { sectionId: "summary-iii", sectionNum: 110, sectionTitle: "Summary, Part III", sectionLabel: "Summary, Part III" },
  [
    {
      label: "Summary, Part III — Five things",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Summary, Part III</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>Five things.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 22}}>
            Viable. Lettable. Premium-rated.
          </div>
          <ol className="numlist">
            {[
              { t: "We know who this is for.",      s: "The boutique whole-floor segment. Structurally short, and paying." },
              { t: "Maximise area by going up.",         s: "11 × 500 m² beats 8 × 600 m² by 700 m² and three whole-floor tenants." },
              { t: "A pure extrusion.",              s: "Maximum area by discipline. Complexity tested against value, accepted only where it pays." },
              { t: "Sustainability is commercial.",  s: "Excellent earns the rent. The Calculator keeps the balance live." },
              { t: "Place pays.",                    s: "The team that wants to come to the office is the tenant who pays for the privilege." },
            ].map((b, i) => (
              <li className="numlist__item" key={i}>
                <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
                <div>
                  <div className="numlist__title">{b.t}</div>
                  <div style={{fontSize: 14, color: 'var(--fg-soft)', lineHeight: 1.4, marginTop: 2}}>{b.s}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Summary, Part III</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 10}}>Five things. Viable, lettable, premium-rated.</h2>
          <div className="prose tight" style={{maxWidth: '78ch'}}>
            <p><strong>We know who this is for.</strong> The boutique whole-floor segment, structurally short and paying. Series B to C tech, AI scale-ups, creative agencies, specialist finance. King's Cross is the cluster. The building suits the segment precisely.</p>
            <p><strong>Maximise area by going up.</strong> The signal box at the top does honest structural work, so the scheme reaches G+11 instead of G+8. 11 × 500 m² = 5,500 m² versus 8 × 600 m² = 4,800 m². Seven hundred square metres more total, three more whole-floor tenants, a smaller plate that suits the segment better, not worse.</p>
            <p><strong>A pure extrusion.</strong> The office plan is the simplest move on the simplest part of the site, curved to the boundary so every metre is used. Simple to build, lower in embodied carbon, and the green shape is the rentable shape. Complexity is tested against value and accepted only at the canopy and signal box, where it earns its place.</p>
            <p><strong>Sustainability is commercial.</strong> An Excellent rating earns real rent on a building of this kind. We meet the credentials that pay and not the ones that don't, with the ∑ Calculator keeping the cost-against-carbon balance live throughout the design. <em>The specifics, materials, structure, workings, come with the building in Part IV.</em></p>
            <p><strong>Place pays.</strong> The team that wants to come to the office is the tenant who pays rent for the privilege, and the boss who signs the lease knows it. Lobby, café, bike, end-of-trip at the ground. Lifts straight onto the plate, with views and balconies above the canal. A room at the top, let, co-working, or public.</p>
          </div>
        </div>
      ),
    },
  ]
);

// The tenant. Moved out of §07 The Challenge into Part IV, where the
// commercial case lives. Sets up the boutique 500/600 m² segment that the
// area schedule and the cost story then answer to.
const STenant = sectionPages(
  { sectionId: "tenant", sectionNum: 106, sectionTitle: "The tenant", sectionLabel: "The tenant" },
  [{
    // Merged page — was "Who is the tenant?" + "500, not 600" as two pages.
    // Tenant identity (left) sets up who the 5,500-vs-4,800 maths (right)
    // serves. One page, two columns, one argument.
    label: "Who is the tenant? 500, not 600.",
    presentation: () => (
      <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
        <Eyebrow>The tenant · Whole floor, boutique segment</Eyebrow>
        <h2 className="h-title" style={{marginBottom: 4}}>Who is the tenant? 500, not 600.</h2>
        <div className="prose" style={{fontSize: 18, color: 'var(--fg-soft)', marginBottom: 22}}>
          The boutique whole-floor segment. The smaller plate, taken upward.
        </div>
        <div style={{flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 40, alignItems: 'stretch'}}>
          {/* LEFT — tenant identity */}
          <div style={{display: 'flex', flexDirection: 'column', gap: 16, borderRight: '1px solid var(--rule-soft)', paddingRight: 32}}>
            <div className="mono" style={{fontSize: 11, color: 'var(--accent)', letterSpacing: 0.18, textTransform: 'uppercase'}}>Who's in the segment</div>
            <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13, color: 'var(--fg)', lineHeight: 1.4}}>
              {[
                "Creative + design agencies",
                "Series B–C tech scale-ups",
                "AI scale-ups below the top tier",
                "Specialist finance and wealth",
                "Architecture, engineering, consulting",
                "International UK headquarters",
              ].map((t, i) => (
                <li key={i} style={{paddingLeft: 14, position: 'relative'}}>
                  <span style={{position: 'absolute', left: 0, color: 'var(--accent)'}}>·</span>
                  {t}
                </li>
              ))}
            </ul>
            <div style={{borderLeft: '2px solid var(--accent)', paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8}}>
              <div className="mono" style={{fontSize: 22, color: 'var(--accent)', fontWeight: 500, letterSpacing: 0.02}}>~50%</div>
              <div style={{fontSize: 13, color: 'var(--fg)', lineHeight: 1.35}}>of central London supply is sub-5,000 sqft</div>
              <div className="mono" style={{fontSize: 10, color: 'var(--fg-dim)', letterSpacing: 0.04, marginTop: 2}}>Savills Q4 2025. The segment is structurally short.</div>
            </div>
          </div>
          {/* RIGHT — the 600 vs 500 maths */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24, alignItems: 'stretch'}}>
            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--rule-soft)', paddingRight: 18}}>
              <div className="mono" style={{fontSize: 11, color: 'var(--fg-dim)', letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 10}}>The bigger plate</div>
              <div className="mono" style={{fontSize: 40, color: 'var(--fg)', fontWeight: 500, letterSpacing: 0.01, lineHeight: 1.0, marginBottom: 4}}>600 m²</div>
              <div className="mono" style={{fontSize: 16, color: 'var(--fg-soft)', letterSpacing: 0.04, marginBottom: 14}}>× 8 floors</div>
              <div className="mono" style={{fontSize: 11, color: 'var(--accent)', letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4}}>Total</div>
              <div className="mono" style={{fontSize: 26, color: 'var(--fg)', fontWeight: 500, letterSpacing: 0.01}}>4,800 m²</div>
              <div style={{marginTop: 14, fontSize: 12, color: 'var(--fg-soft)', lineHeight: 1.4}}>Eight whole-floor tenants.</div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 4}}>
              <div className="mono" style={{fontSize: 11, color: 'var(--accent)', letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 10}}>What we propose</div>
              <div className="mono" style={{fontSize: 40, color: 'var(--accent)', fontWeight: 500, letterSpacing: 0.01, lineHeight: 1.0, marginBottom: 4}}>500 m²</div>
              <div className="mono" style={{fontSize: 16, color: 'var(--fg-soft)', letterSpacing: 0.04, marginBottom: 14}}>× 11 floors</div>
              <div className="mono" style={{fontSize: 11, color: 'var(--accent)', letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4}}>Total</div>
              <div className="mono" style={{fontSize: 26, color: 'var(--accent)', fontWeight: 500, letterSpacing: 0.01}}>5,500 m²</div>
              <div style={{marginTop: 14, fontSize: 12, color: 'var(--fg)', lineHeight: 1.4}}><strong>+700 m². Three more whole-floor tenants.</strong></div>
            </div>
          </div>
        </div>
        <div className="mono" style={{fontSize: 11, color: 'var(--fg-dim)', letterSpacing: 0.04, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--rule-soft)'}}>
          Full workings, comparables, supply, tenant profiles, plate-by-plate sensitivity, on the <strong style={{color: 'var(--accent)'}}>500/600 · Who is the tenant?</strong> tab (top toolbar).
        </div>
      </div>
    ),
    report: () => (
      <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
        <Eyebrow>The tenant · Whole floor, 500 m²</Eyebrow>
        <h2 className="h-title" style={{marginBottom: 8}}>Who is the tenant? 500, not 600.</h2>
        <div className="prose tight" style={{maxWidth: '78ch'}}>
          <p>The tenant case sits behind every floor-plate decision the building makes. Both 500 m² and 600 m² satisfy the same fundamentals, whole-floor letting, three-sided daylight, a coherent open plate, a building that reads as a place, and both land in the same boutique segment. <em>The choice between them is design-led, not market-led.</em></p>
          <p><strong>The segment is structurally short.</strong> Sub-5,000 sqft accounts for roughly half of central London's office supply (Savills Q4 2025), and whole-floor boutique is the part of that share that's hardest to find. Best-in-class fully-managed deals are clearing at £200 to £296 / sqft (170 Piccadilly, 141 Wardour, GPE H2 2025): premium per-sqft tolerance from tenants who value a floor of their own. The segment, in plain terms, is Series B to C tech, AI scale-ups below the top tier, creative practices, specialist finance, architecture and design firms, international UK HQs.</p>
          <p><strong>King's Cross is the cluster.</strong> AI lettings in London reached 450,000 sqft in May 2026 alone, more than ten times the 2025 monthly average, and OpenAI's first permanent UK office (88,500 sqft) opened here in April. The boutique floors sit beneath the very-large lettings.</p>
          <p>And so the plate. The simple extrusion the scheme commits to gives a typical floor plate of around <strong>500 m²</strong>, not the 600 m² a wider plate would have produced. On a tight site that is often where the conversation ends, a smaller plate sounds like a smaller building. It is not. <strong>Because the signal box at the top does honest structural work, the scheme reaches G+11 instead of G+8.</strong> The arithmetic: <strong>11 × 500 m² = 5,500 m²</strong> versus <strong>8 × 600 m² = 4,800 m²</strong>. Seven hundred square metres more total, eleven whole-floor tenants instead of eight, and the boutique segment we have profiled wants the whole-floor experience more than the bigger floor. <em>The smaller plate, taken upward, is the better commercial answer.</em></p>
          <p className="mono" style={{fontSize: 11, color: 'var(--fg-dim)', letterSpacing: 0.04, marginTop: 12}}>
            Full workings, comparables, supply data, tenant profiles, plate-by-plate sensitivity, on the <strong style={{color: 'var(--accent)'}}>500/600 · Who is the tenant?</strong> tab in the top toolbar.
          </p>
        </div>
      </div>
    ),
  },
  // "Place at the top and bottom" moved into its own section SPlace,
  // which sits AFTER Sustainability so the Part III arc lands on the
  // place argument (tenant → plate → form → sustainability → place).
  // Page 4 — The floor plate in use. Three A4-landscape image slots
  // across the middle, with 01/02/03 + the matching beat below each.
  // Point 04 dropped. Filenames: floor-plate-in-use-01/02/03.jpg.
  (() => {
    const PLATE_BEATS = [
      { fn: "floor-plate-in-use-01.jpg", title: "Column grid sized for open plan, with cellular options where the tenant wants them." },
      { fn: "floor-plate-in-use-02.jpg", title: "Eccentric core. One plate, three sides of daylight." },
      { fn: "floor-plate-in-use-03.jpg", title: "Splittable to 2 × 250 m² in theory. We don't subdivide, the boutique segment wants whole floors." },
    ];
    const render = () => (
      <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
        <Eyebrow>Part III · The plate</Eyebrow>
        <h2 className="h-title" style={{marginBottom: 6}}>The floor plate in use.</h2>
        <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 22}}>
          One tenant per floor. The plate as a working office.
        </div>
        <div style={{flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 22, alignItems: 'start'}}>
          {PLATE_BEATS.map((b, i) => (
            <div key={i} style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
              <div style={{aspectRatio: '1.414', position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid var(--rule-soft)', marginBottom: 12}}>
                <Placeholder filename={b.fn} caption={b.title} variant="diagram" fill fitMode="contain" />
              </div>
              <div className="mono" style={{fontSize: 11, letterSpacing: 0.1, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6, lineHeight: 1.25}}>{String(i+1).padStart(2,"0")}</div>
              <div style={{fontSize: 12, color: 'var(--fg-soft)', lineHeight: 1.4}}>{b.title}</div>
            </div>
          ))}
        </div>
      </div>
    );
    return {
      label: "The floor plate in use",
      presentation: render,
      report: render,
    };
  })()]
);

// ════════════════════════════════════════════════════════════════════════
// §01 COVER (1 page)
// ════════════════════════════════════════════════════════════════════════
const S01 = sectionPages(
  { sectionNum: 1, sectionTitle: "Cover", sectionLabel: "Cover" },
  [
    {
      label: "Cover",
      presentation: () => (
        <PresCover
          filename="cover.jpg"
          caption="Bagley Walk retaining wall, full bleed, low overcast light, documentary"
          overlay={
            <>
              <Logo size="md" />
              <span className="mono">F1 · King's Cross · London N1C</span>
              <h1 className="h-display" style={{fontSize: 64, lineHeight: 1.05, margin: 0}}>The Crossing.</h1>
              <span className="mono">Design competition · F1, King's Cross · 2026</span>
            </>
          }
        />
      ),
      report: () => (
        <div className="report-cover">
          <div className="report-cover__media">
            <Placeholder
              filename="cover.jpg"
              caption="Bagley Walk retaining wall, front cover of bound document"
              variant="photo"
              fill
            />
          </div>
          <div className="report-cover__plate">
            <div className="report-cover__plate-top">
              <Logo size="md" />
              <div className="report-cover__rule"></div>
              <div className="mono report-cover__doctype">Design proposition · May 2026</div>
            </div>
            <div className="report-cover__title-block">
              <h1 className="report-cover__title">The Crossing.</h1>
              <div className="report-cover__sub">
                A proposition for King's Cross.
              </div>
            </div>
            <div className="report-cover__meta">
              <div className="report-cover__meta-row">
                <span className="mono report-cover__meta-lbl">Site</span>
                <span className="report-cover__meta-val">F1 · King's Cross · London N1C</span>
              </div>
              <div className="report-cover__meta-row">
                <span className="mono report-cover__meta-lbl">Prepared by</span>
                <span className="report-cover__meta-val">Coffey Architects</span>
              </div>
              <div className="report-cover__meta-row">
                <span className="mono report-cover__meta-lbl">Document</span>
                <span className="report-cover__meta-val">Design proposition. Report</span>
              </div>
              <div className="report-cover__meta-row">
                <span className="mono report-cover__meta-lbl">Date</span>
                <span className="report-cover__meta-val">May 2026</span>
              </div>
            </div>
            <div className="report-cover__foot">
              <span className="mono">Coffey Architects · 70 Cowcross Street · London EC1M 6EJ</span>
              <span className="mono">· C/A · 2026 ·</span>
            </div>
          </div>
        </div>
      ),
    },
    // ─── A microcosm of King's Cross. The deck's thesis, placed before the
    //     "conversation, not a conclusion" page so it primes everything that
    //     follows. The four claims (placemaking, heritage, commerce, culture)
    //     map onto the four Parts the deck is structured into, so the TOC
    //     reads as the answer to this page.
    {
      label: "A microcosm of King's Cross",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§01 · The opportunity</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>A microcosm of King's Cross.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 22}}>
            The whole story of King's Cross, condensed onto a single plot.
          </div>
          <ul className="numlist" style={{listStyle: 'none'}}>
            {[
              ["Placemaking", "The crossing where the canal meets the railway, made civic."],
              ["Heritage",    "The last layer of an industrial site read and reread for two centuries."],
              ["Commerce",    "An exceptional, lettable, efficient floor plate that earns its place."],
              ["Culture",     "A ground and a roof that give back to the city and to the tenant."],
            ].map(([k, v], i) => (
              <li className="numlist__item" key={i}>
                <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
                <div>
                  <div className="numlist__title">{k}. <span style={{color: 'var(--fg-soft)', fontWeight: 400}}>{v}</span></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§01 · The opportunity</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 8}}>A microcosm of King's Cross.</h2>
          <div className="prose tight" style={{maxWidth: '78ch'}}>
            <p>This is the last plot of the Argent King's Cross masterplan, and it is the only one where the masterplan's four ambitions land in a single building. <strong>Placemaking, heritage, commerce, culture.</strong> The whole story of King's Cross, condensed onto one site.</p>
            <p><strong>Placemaking.</strong> The site is the crossing itself, where the canal meets the railway. The ambition is a place, not a plot.</p>
            <p><strong>Heritage.</strong> The site has been read and reread since the canal opened in 1820. The building is the next reading, not the last word.</p>
            <p><strong>Commerce.</strong> A small footprint, tightly priced, with no room for inefficiency. The building has to earn its place commercially as well as architecturally.</p>
            <p><strong>Culture.</strong> A ground and a roof that give back to the city and to the tenant. The building owes the place a civic gesture, and the tenant a generous one.</p>
            <p><em>The four Parts of this conversation follow in that order.</em></p>
          </div>
        </div>
      ),
    },
    {
      label: "We listened",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§01 · Since the mid-tender interview</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>We listened.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 18}}>
            What we heard at the mid-tender interview is what has moved the building since.
          </div>
          <ul className="numlist" style={{listStyle: 'none'}}>
            {[
              "The site is complex. We still have a lot to learn, and we are still learning.",
              "This is still the beginning of a conversation. The mid-tender interview was its first chapter.",
              "Our approach shows malleability. The scheme has moved with what we heard, and it will move again.",
              "We respond contextually and intelligently to the historic, the cultural, and the economic context of the site.",
              "Above all, the economic. A building you cannot build brings nothing to the city, and nothing to the tenant.",
            ].map((t, i) => (
              <li className="numlist__item" key={i}>
                <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
                <div><div className="numlist__title">{t}</div></div>
              </li>
            ))}
          </ul>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§01 · Since the mid-tender interview</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 8}}>We listened.</h2>
          <div className="prose tight" style={{maxWidth: '78ch'}}>
            <p>The mid-tender interview was the first chapter of this conversation, and what we heard in it is what has moved the building between then and now. The pages that follow are the answer to that listening, not a re-pitch of what we brought before.</p>
            <p>We still have a lot to learn. The site is complex, and we know it will not be simply solved. We see this as still the beginning of a longer conversation, and the way we have approached the project since the interview shows a deliberate malleability: where we heard something that mattered, the scheme moved.</p>
            <p><strong>We respond contextually and intelligently to the historic, the cultural, and the economic context of the site.</strong> The historic in the canal and the railway, the cultural in what the building gives to its public and its tenant, and the economic in every decision about plate, height, and material. Above all, the economic. <em>A building you cannot build brings nothing to the city, and nothing to the tenant.</em></p>
            <p>The deck that follows is set up to take this conversation further with you, properly. We would rather earn the next decisions together than arrive with answers that have not been earned.</p>
          </div>
        </div>
      ),
    },
    {
      label: "What's in this conversation",
      isDivider: true,
      presentation: () => <TOCPage />,
      report: () => <TOCPage />,
    },
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §02 THE LEGACY (14 pages), opening narrative: the history of the crossing
// ════════════════════════════════════════════════════════════════════════
const SLegacy = sectionPages(
  { sectionNum: 2, sectionTitle: "The Legacy", sectionLabel: "The Legacy" },
  [
    {
      label: "The Crossing",
      presentation: () => (
        <PresStatement
          kicker="§02 · The Legacy"
          title="The Crossing."
          body={<p>King's Cross.</p>}
          align="centre"
        />
      ),
      report: () => (
        <ReportProse
          kicker="§02 · The Legacy"
          title="The Crossing."
          body={<>
            <p>King's Cross. The first and the last site.</p>
            <p>This is the legacy our building inherits, and the legacy it completes. The pages that follow tell the story of the crossing… the place, and the word.</p>
          </>}
        />
      ),
    },
    {
      label: "The word",
      presentation: () => (
        <PresStatement
          kicker="§02 · The word"
          title="A word about crossing."
          body={<>
            <p style={{ fontFamily: "var(--ff-mono)", letterSpacing: "0.04em" }}>crux → cros → <strong>cross</strong> → crucial</p>
            <p>Latin. Old Irish. Old English.</p>
            <p>A word about the point where two lines meet… a word about decision.</p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§02 · The word"
          title="A word about crossing."
          body={<>
            <p style={{ fontFamily: "var(--ff-mono)", letterSpacing: "0.04em" }}>crux → cros → <strong>cross</strong> → crucial</p>
            <p>The word runs from Latin <em>crux</em> through Old Irish <em>cros</em> to the Old English <em>cross</em>, and on to <em>crucial</em>. It has always been a word about the point where two lines meet… and a word about decision.</p>
          </>}
        />
      ),
    },
    {
      label: "A name that stuck",
      presentation: () => (
        <PresImage
          filename="legacy-george-iv-monument.jpg"
          caption="Period engraving of the George IV monument (1830–1845). Source: British Library / Wikimedia (public domain). Portrait orientation."
          variant="archive"
          aspect="3/4"
          capIdx="1830"
          capTitle="A name that stuck."
          capMeta="A sixty-foot column to George IV, at the meeting of three roads"
        />
      ),
      report: () => (
        <ReportImageText
          filename="legacy-george-iv-monument.jpg"
          caption="George IV monument, King's Cross, 1830–1845"
          variant="archive"
          aspect="3/4"
          capIdx="1830"
          capTitle="A name that stuck."
          kicker="§02 · A name that stuck"
          title="The name stuck."
          body={<>
            <p>In 1830, at the meeting of three roads, they raised a sixty-foot column to George IV. Walter Thornbury called it <em>"a ridiculous octagonal structure crowned by an absurd statue"</em>.</p>
            <p>The statue came down in 1842. The monument in 1845. The name stuck.</p>
          </>}
        />
      ),
    },
    {
      label: "Before that, a crossing",
      presentation: () => (
        <div className="lookout-pair">
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="legacy-battle-bridge.jpg" caption="Battle Bridge, historical map, sketched over. Portrait." variant="archive" aspect="3/4" />
            </div>
            <div className="lookout-pair__cap">
              <span className="idx mono">Battle Bridge</span>
              <span className="title">A crossing of the Fleet.</span>
            </div>
          </div>
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="legacy-fleet-route.jpg" caption="The route of the River Fleet, sketched over. Portrait." variant="archive" aspect="3/4" />
            </div>
            <div className="lookout-pair__cap">
              <span className="idx mono">The River Fleet</span>
              <span className="title">The water it crossed.</span>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="lookout-pair lookout-pair--report">
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="legacy-battle-bridge.jpg" caption="Battle Bridge, historical map" variant="archive" aspect="3/4" />
            </div>
            <div className="lookout-pair__caption mono"><b>Battle Bridge</b>A crossing of the Fleet.</div>
          </div>
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="legacy-fleet-route.jpg" caption="The route of the River Fleet" variant="archive" aspect="3/4" />
            </div>
            <div className="lookout-pair__caption mono"><b>The River Fleet</b>The water it crossed.</div>
          </div>
          <div className="lookout-pair__text">
            <Eyebrow>§02 · Before that, a crossing</Eyebrow>
            <h2 className="h-sub">It was always a crossing.</h2>
            <div className="prose">
              <p>Before it was King's Cross it was Battle Bridge… a crossing of the River Fleet, originally Broad Ford Bridge.</p>
              <p>Even then, the place was defined by the act of crossing water.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Crossings on crossings",
      presentation: () => (
        <div className="lookout-pair">
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="legacy-canal-1820.jpg" caption="Period print of the Regent's Canal at King's Cross, c.1820s. Source: Wikimedia / Postal Museum." variant="archive" aspect="4/3" />
            </div>
            <div className="lookout-pair__cap">
              <span className="idx mono">1820</span>
              <span className="title">The canal arrived.</span>
            </div>
          </div>
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="legacy-goodsyard-1851.jpg" caption="Lewis Cubitt's 1851 plan of the King's Cross Goods Yard. Source: Historic England / Network Rail." variant="archive" aspect="4/3" />
            </div>
            <div className="lookout-pair__cap">
              <span className="idx mono">1852</span>
              <span className="title">The railway followed.</span>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="lookout-pair lookout-pair--report">
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="legacy-canal-1820.jpg" caption="Regent's Canal at King's Cross, c.1820s" variant="archive" aspect="4/3" />
            </div>
            <div className="lookout-pair__caption mono"><b>1820</b>The canal arrived.</div>
          </div>
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="legacy-goodsyard-1851.jpg" caption="Cubitt's 1851 Goods Yard plan" variant="archive" aspect="4/3" />
            </div>
            <div className="lookout-pair__caption mono"><b>1852</b>The railway followed.</div>
          </div>
          <div className="lookout-pair__text">
            <Eyebrow>§02 · Crossings on crossings</Eyebrow>
            <h2 className="h-sub">Three crossings layered on one.</h2>
            <div className="prose">
              <p>1820, the canal arrived. 1852, the railway followed. Roads, water, rail… three crossings layered on one.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "The yard",
      presentation: () => (
        <PresImage
          filename="legacy-goods-yard.jpg"
          caption="Victorian photograph of the King's Cross Goods Yard at full operation. Wide / panoramic if possible. Source: Historic England / London Transport Museum (editorial licence)."
          variant="CGI"
          capIdx="Victorian"
          capTitle="The yard."
          capMeta="A working yard… a crossing of everything"
        />
      ),
      report: () => (
        <ReportImageText
          filename="legacy-goods-yard.jpg"
          caption="King's Cross Goods Yard in operation"
          variant="CGI"
          capIdx="Victorian"
          capTitle="The yard."
          kicker="§02 · The yard"
          title="A crossing of everything."
          body={<>
            <p>The country's freight passed through here. Its coal. Its grain. Its gas.</p>
            <p>A working yard… a crossing of everything.</p>
          </>}
        />
      ),
    },
    {
      label: "Then the lights went out",
      presentation: () => (
        <PresImage
          filename="legacy-derelict-1990.jpg"
          caption="Derelict King's Cross goods yard, late 1980s / 1990. Black and white, empty. Source: Alamy / King's Cross Voices (licence required)."
          variant="CGI"
          capIdx="1980s"
          capTitle="Then the lights went out."
          capMeta="Empty warehouses. Weeds through the rails."
        />
      ),
      report: () => (
        <ReportImageText
          filename="legacy-derelict-1990.jpg"
          caption="The derelict post-industrial yard, c.1990"
          variant="CGI"
          capIdx="1980s"
          capTitle="Then the lights went out."
          kicker="§02 · Then the lights went out"
          title="A part of London forgotten."
          body={<>
            <p>By the 1980s, the yard was dark. Empty warehouses. Weeds through the rails.</p>
            <p>A part of London that had been forgotten.</p>
          </>}
        />
      ),
    },
    {
      label: "The cross becomes something else",
      presentation: () => (
        <div className="lookout-pair">
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="legacy-clubs-bagleys.jpg" caption="Bagley's interior at peak, crowd, lasers, warehouse scale. Source: Curious London / Naki / Time Out (licence required)." variant="photo" aspect="4/3" />
            </div>
            <div className="lookout-pair__cap">
              <span className="idx mono">1990s</span>
              <span className="title">Bagley's. The Cross. The Key. Canvas.</span>
            </div>
          </div>
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="legacy-clubs-flyers.jpg" caption="A grid of 1990s club flyers, or the queue at The Cross (York Way arches). Source: Gasholder.london / Dave Swindells (licence required)." variant="photo" aspect="4/3" />
            </div>
            <div className="lookout-pair__cap">
              <span className="idx mono">Ten thousand a weekend</span>
              <span className="title">A different kind of congregation.</span>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="lookout-pair lookout-pair--report">
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="legacy-clubs-bagleys.jpg" caption="Bagley's at peak" variant="photo" aspect="4/3" />
            </div>
            <div className="lookout-pair__caption mono"><b>1990s</b>Bagley's. The Cross. The Key. Canvas.</div>
          </div>
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="legacy-clubs-flyers.jpg" caption="Club flyers / the queue at The Cross" variant="photo" aspect="4/3" />
            </div>
            <div className="lookout-pair__caption mono"><b>10,000 / weekend</b>A different kind of congregation.</div>
          </div>
          <div className="lookout-pair__text">
            <Eyebrow>§02 · The cross becomes something else</Eyebrow>
            <h2 className="h-sub">The cross became a meeting point again.</h2>
            <div className="prose">
              <p>Into the emptiness came the clubs. Bagley's. The Cross. The Key. Canvas. Ten thousand people a weekend. Danny Rampling called it <em>"a little bit of Ibiza in the heart of London"</em>.</p>
              <p>The cross became a meeting point again… a different kind of congregation.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "The masterplan",
      presentation: () => (
        <PresImage
          filename="legacy-masterplan.jpg"
          caption="Argent / Allies and Morrison masterplan diagram, 67-acre site, retained historic structures, new plot pattern. Plan view, full-bleed landscape. Source: Allies and Morrison / Argent press."
          variant="CGI"
          capIdx="Masterplan"
          capTitle="The masterplan."
          capMeta="50 buildings. 20 streets. 10 squares."
        />
      ),
      report: () => (
        <ReportImageText
          filename="legacy-masterplan.jpg"
          caption="The King's Cross masterplan"
          variant="CGI"
          capIdx="Masterplan"
          capTitle="The masterplan."
          kicker="§02 · The masterplan"
          title="One of Europe's largest regenerations."
          body={<>
            <p>50 buildings. 20 streets. 10 squares. 20 historic structures restored. 2,000 homes.</p>
            <p>One of the largest regeneration schemes in Europe.</p>
          </>}
        />
      ),
    },
    {
      label: "The Last Site",
      presentation: () => (
        <PresImage
          filename="legacy-scheme-reveal.jpg"
          caption="Coffey's scheme, first reveal. Source: Coffey Architects design team."
          variant="CGI"
          capIdx="The scheme"
          capTitle="The Last Site. The Placemaking Legacy."
          capMeta="The Crossing. Full circle."
        />
      ),
      report: () => (
        <ReportImageText
          filename="legacy-scheme-reveal.jpg"
          caption="The proposed scheme, first reveal"
          variant="CGI"
          capIdx="The scheme"
          capTitle="The Last Site. The Placemaking Legacy."
          kicker="§02 · The Last Site"
          title="The Last Site. The Placemaking Legacy."
          body={<>
            <p><em>The Crossing. Full circle.</em></p>
            <p>This is the last building in the masterplan… and the final moment in an incredible history of crossings. A moment not to be missed: the chance to create and dignify this place.</p>
            <p>An incredible site that deserves a strong and generous response, while also making an attractive and viable commercial building.</p>
          </>}
        />
      ),
    },
    // "Why the name" closing page removed from §02 The Legacy.
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §03 THE WATER CAME FIRST (8 pages)
// ════════════════════════════════════════════════════════════════════════
const S02 = sectionPages(
  { sectionNum: 3, sectionTitle: "The Crossing", sectionLabel: "The Crossing" },
  [
    {
      label: "Site & origin (act break)",
      isDivider: true,
      presentation: () => <Divider range="§§ 03–05" title="Site & origin." sub="The canal, the railway, and the brick context this building answers to." />,
      report: () => <Divider range="§§ 03–05" title="Site & origin." sub="The canal, the railway, and the brick context this building answers to." />,
    },
    // ─── The thesis. After the legacy, the punchline: this is the site
    //     where the industrial revolution reached London, and the last
    //     plot of the masterplan that re-knit it. The whole regeneration
    //     ends by marking where it all began.
    {
      label: "Thesis · Where it all started",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§03 · Thesis</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>Where it all started.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 22}}>
            The last plot of the masterplan, on the ground where King's Cross began.
          </div>
          <ul className="numlist" style={{listStyle: 'none'}}>
            {[
              ["1820",  "The canal arrived. Coal, timber, brick and produce flowed into the city by water."],
              ["1852",  "The railway arrived. Trains came south from the coalfields, carrying freight day and night."],
              ["1880s", "London's demand for coal had soared. Most now arrived by rail rather than canal."],
              ["Now",   "This is where the industrial revolution arrived twice: first by canal, then by rail."],
            ].map(([k, v], i) => (
              <li className="numlist__item" key={i}>
                <span className="numlist__num">{k}</span>
                <div><div className="numlist__title">{v}</div></div>
              </li>
            ))}
          </ul>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§03 · Thesis</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 8}}>Where it all started.</h2>
          <div className="prose tight" style={{maxWidth: '78ch'}}>
            <p>The site we are proposing to build on is where King's Cross began. The building we are proposing to make is the last in the masterplan that re-knit it.</p>
            <p>The <strong>Regent's Canal opened in 1820</strong>, cut north of London to link the Grand Junction at Paddington with the Thames at Limehouse. Coal, timber, brick, fruit, all the working freight a growing city consumed, arrived first by water. King's Cross took its address from this moment.</p>
            <p>The <strong>railway arrived in 1852</strong>. King's Cross station opened in October that year, and the East Coast Main Line began hauling coal south from the Yorkshire and Durham coalfields by the wagonload, day and night, on a scale the canal could not match.</p>
            <p>Within thirty years, <strong>London's demand for coal had soared</strong>, and most of it was now arriving by rail rather than canal. The canal had got the city started. The railway industrialised it.</p>
            <p><strong>This is where the industrial revolution arrived twice. First by canal, then by rail.</strong> The last plot of the masterplan, on the very ground where the masterplan began. <em>The most resonant way to end this regeneration is to mark where it all started.</em></p>
          </div>
        </div>
      ),
    },
    {
      label: "I walked it",
      presentation: () => (
        <div className="pc-stmt" style={{ maxWidth: "none", width: "100%" }}>
          <Eyebrow>§03 · A personal note</Eyebrow>
          <h2 className="h-title" style={{ marginBottom: 6 }}>I walked it.</h2>
          <div className="prose" style={{ maxWidth: "64ch", fontSize: 18, color: "var(--fg-soft)" }}>
            Manchester to King's Cross to Limehouse. The whole length of the water.
          </div>
          <div className="models-4" style={{ marginTop: 14 }}>
            {[1, 2, 3, 4].map((n) => (
              <div className="model-cell" key={n}>
                <div className="model-cell__frame">
                  <Placeholder filename={`canal-walk-0${n}.jpg`} caption={`Canal walk photo ${n} · drop landscape image here`} variant="photo" aspect="3/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{ maxWidth: "none", width: "100%" }}>
          <Eyebrow>§03 · A personal note</Eyebrow>
          <h2 className="h-title" style={{ marginBottom: 8 }}>I walked it.</h2>
          <div className="prose" style={{ maxWidth: "78ch" }}>
            <p>Manchester to King's Cross to Limehouse, the whole length of the water, on foot. I have felt the scale of this canal and the weight of what it once carried at first hand. This is not an abstract site to me. It is a place I know by walking it, and that conviction runs through everything that follows.</p>
          </div>
          <div className="models-4" style={{ marginTop: 14 }}>
            {[1, 2, 3, 4].map((n) => (
              <div className="model-cell" key={n}>
                <div className="model-cell__frame">
                  <Placeholder filename={`canal-walk-0${n}.jpg`} caption={`Canal walk photo ${n}`} variant="photo" aspect="3/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // ─── The canal, then and now.
    //     PRESENTATION: title + one-line strap + big 2x2 images (.models-4),
    //     matching the visual rhythm of page 18 "I walked it".
    //     REPORT: same title + prose explanation + smaller image grid with
    //     captions + closing line.
    (() => {
      const grid = [
        { fn: "canal-then-01-limehouse-1826.jpg", title: "Limehouse Basin, 1826.",  meta: "The Regent's Canal in its first decade. Watercolour by T. H. Shepherd." },
        { fn: "canal-then-02-barging-1924.jpg",   title: "Limehouse Basin, 1924.",  meta: "The canal at work, looking out to the masts in the Thames." },
        { fn: "canal-then-03-fruit-1944.jpg",     title: "Regent's Canal, 1944.",   meta: "A working narrowboat on its way to the Grand Union." },
        { fn: "canal-now-granary-square.jpg",     title: "Granary Square, today.",  meta: "The same water, beside the site. The canal as the city's room." },
      ];
      return {
        label: "The canal, then and now",
        presentation: () => (
          <div className="pc-stmt" style={{ maxWidth: "none", width: "100%" }}>
            <Eyebrow>§03 · The canal · Then and now</Eyebrow>
            <h2 className="h-title" style={{ marginBottom: 6 }}>Water then. Water now.</h2>
            <div className="prose" style={{ maxWidth: "64ch", fontSize: 18, color: "var(--fg-soft)" }}>
              From a working artery to a place for people.
            </div>
            <div className="models-4" style={{ marginTop: 14 }}>
              {grid.map((g, i) => (
                <div className="model-cell" key={i}>
                  <div className="model-cell__frame">
                    <Placeholder filename={g.fn} caption={g.title} variant="archive" aspect="3/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
        report: () => (
          <div className="pc-stmt" style={{ maxWidth: "none", width: "100%" }}>
            <Eyebrow>§03 · The canal · Then and now</Eyebrow>
            <h2 className="h-title" style={{ marginBottom: 8 }}>Water then. Water now.</h2>
            <div className="prose tight" style={{ maxWidth: "78ch" }}>
              <p>From a working artery to a place for people. The canal that gave the site its shape is still here, still in use. Brand new in 1826 at the Limehouse Basin where the canal meets the Thames; still working in 1924 with sailing ships in the basin behind; still moving freight in 1944 on its way to the Grand Union. Today, the same water beside the site, the city's room.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto auto", columnGap: 18, rowGap: 14, marginTop: 14 }}>
              {grid.map((g, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <div style={{ height: 165, position: "relative", overflow: "hidden", background: "#ffffff" }}>
                    <Placeholder filename={g.fn} caption={g.title} variant="archive" fill fitMode="contain" />
                  </div>
                  <div className="mono" style={{ marginTop: 5, fontSize: 10.5, letterSpacing: 0.08, color: "var(--accent)", textTransform: "uppercase" }}>{g.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-soft)", lineHeight: 1.35 }}>{g.meta}</div>
                </div>
              ))}
            </div>
            <div className="prose tight" style={{ maxWidth: "82ch", fontSize: 13, lineHeight: 1.5, marginTop: 10 }}>
              <p><em>The canal has not stopped doing what it has always done.</em></p>
            </div>
          </div>
        ),
      };
    })(),
    // ─── The railway, then and now.
    //     PRESENTATION: title + Phil's one-line punchline + big 2x2 images.
    //     REPORT: same title + the personal opening + full caption strip.
    (() => {
      const grid = [
        { fn: "railway-then-01-doncaster-1928.jpg",  title: "Doncaster Plant Works, 1928.",  meta: "A finished Pacific locomotive on the works floor. Doncaster built the locos that ran the line." },
        { fn: "railway-then-02-ecml-coal-train.jpg", title: "East Coast Main Line, c.1950.", meta: "A loaded coal train heading south. London-bound, every day." },
        { fn: "railway-then-03-brodsworth-1967.png", title: "Brodsworth Colliery, 1967.",    meta: "South Yorkshire. One of the pits that filled the wagons." },
        { fn: "railway-now-train-at-colliery.jpg",   title: "Same line, today.",             meta: "A passenger train passes the disused coal-loading infrastructure." },
      ];
      return {
        label: "The railway, then and now",
        presentation: () => (
          <div className="pc-stmt" style={{ maxWidth: "none", width: "100%" }}>
            <Eyebrow>§03 · The railway · Then and now</Eyebrow>
            <h2 className="h-title" style={{ marginBottom: 6 }}>Coal then. People now.</h2>
            <div className="prose" style={{ maxWidth: "64ch", fontSize: 18, color: "var(--fg-soft)" }}>
              The energy that once arrived as coal now arrives as people.
            </div>
            <div className="models-4" style={{ marginTop: 14 }}>
              {grid.map((g, i) => (
                <div className="model-cell" key={i}>
                  <div className="model-cell__frame">
                    <Placeholder filename={g.fn} caption={g.title} variant="archive" aspect="3/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
        report: () => (
          <div className="pc-stmt" style={{ maxWidth: "none", width: "100%" }}>
            <Eyebrow>§03 · The railway · Then and now</Eyebrow>
            <h2 className="h-title" style={{ marginBottom: 8 }}>Coal then. People now.</h2>
            <div className="prose tight" style={{ maxWidth: "78ch" }}>
              <p>Every time I take the train north to UK REIIF I ride the same line that brought the coal that powered London. Doncaster built the locomotives. The Yorkshire and Durham pits filled the wagons. The East Coast Main Line hauled them south, day and night. Now the same rails carry passengers, and the colliery infrastructure stands quiet beside them.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto auto", columnGap: 18, rowGap: 14, marginTop: 14 }}>
              {grid.map((g, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <div style={{ height: 165, position: "relative", overflow: "hidden", background: "#ffffff" }}>
                    <Placeholder filename={g.fn} caption={g.title} variant="archive" fill fitMode="contain" />
                  </div>
                  <div className="mono" style={{ marginTop: 5, fontSize: 10.5, letterSpacing: 0.08, color: "var(--accent)", textTransform: "uppercase" }}>{g.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-soft)", lineHeight: 1.35 }}>{g.meta}</div>
                </div>
              ))}
            </div>
            <div className="prose tight" style={{ maxWidth: "82ch", fontSize: 13, lineHeight: 1.5, marginTop: 10 }}>
              <p><em>The energy that once arrived as coal now arrives as people.</em></p>
            </div>
          </div>
        ),
      };
    })(),
    // "The crossing" statement page removed.
    {
      label: "The Canal",
      presentation: () => (
        <PresImage
          filename="the-canal.jpg"
          caption="Sketch: the Regent's Canal, the water that came first"
          variant="archive"
          capIdx="Fig. 3.2"
          capTitle="The Canal."
          capMeta="Opened 1820, two decades before the railway lands"
        />
      ),
      report: () => (
        <ReportImageText
          filename="the-canal.jpg"
          caption="The Regent's Canal at King's Cross"
          variant="archive"
          capIdx="Fig. 3.2"
          capTitle="The Canal."
          kicker="§03 · The canal"
          title="The water that came first."
          body={<>
            <p>The Regent's Canal opened in 1820, cut north of London to link the Grand Junction Canal at Paddington with the Thames at Limehouse. It is the oldest piece of infrastructure on the site, and the reason the site exists at all.</p>
            <p>Every reading of this place begins with the water.</p>
          </>}
        />
      ),
    },
    {
      label: "The Canal and railway",
      presentation: () => (
        <PresImage
          filename="crossing-canal-railway.jpg"
          caption="Sketch: the canal of 1820, joined by the Great Northern Railway of 1852"
          variant="archive"
          capIdx="Fig. 3.3"
          capTitle="The Canal and railway."
          capMeta="Two systems of moving the city, almost at right angles"
        />
      ),
      report: () => (
        <ReportImageText
          filename="crossing-canal-railway.jpg"
          caption="The canal of 1820 and the railway of 1852"
          variant="archive"
          capIdx="Fig. 3.3"
          capTitle="The Canal and railway."
          kicker="§03 · The canal and the railway"
          title="Then the railway came."
          body={<>
            <p>The Great Northern Railway opened in 1852, throwing iron between London and the north. The canal and the railway are the two great pieces of Victorian infrastructure that made King's Cross, and they run almost at right angles to one another.</p>
            <p>Water first, then rail. The place is built from both.</p>
          </>}
        />
      ),
    },
    {
      label: "The redevelopment",
      presentation: () => (
        <PresImage
          filename="the-redevelopment.jpg"
          caption="Sketch: the King's Cross quarter grown around the canal and the rail"
          variant="archive"
          capIdx="Fig. 3.4"
          capTitle="The redevelopment."
          capMeta="Granary, Coal Drops Yard, Gasholders, the new quarter"
        />
      ),
      report: () => (
        <ReportImageText
          filename="the-redevelopment.jpg"
          caption="The contemporary King's Cross quarter"
          variant="archive"
          capIdx="Fig. 3.4"
          capTitle="The redevelopment."
          kicker="§03 · The redevelopment"
          title="Everything since has answered to them."
          body={<>
            <p>The Granary, the Coal Drops, the Gasholders, and the contemporary King's Cross masterplan all grew up around the canal and the railway. The quarter we know today is a response to those two lines, built in dark engineered brick.</p>
            <p>The redevelopment did not erase the infrastructure. It made a city out of it.</p>
          </>}
        />
      ),
    },
    {
      label: "The Crossing",
      presentation: () => (
        <PresImage
          filename="the-crossing.jpg"
          caption="Sketch: the point where canal and railway cross, and our site within it"
          variant="archive"
          capIdx="Fig. 3.5"
          capTitle="The Crossing."
          capMeta="The Crossing sits exactly here"
        />
      ),
      report: () => (
        <ReportImageText
          filename="the-crossing.jpg"
          caption="Where the canal and the railway cross"
          variant="archive"
          capIdx="Fig. 3.5"
          capTitle="The Crossing."
          kicker="§03 · The crossing"
          title="And here, they cross."
          body={<>
            <p>At one point, and almost nowhere else so cleanly, the canal and the railway cross. Our site sits exactly in that meeting, bordered by the towpath and the Bagley Walk wall on one side and the safeguarded rail lines beneath.</p>
            <p>The crossing of water and rail is the site's defining fact. <strong>It is the subject our building takes up.</strong></p>
          </>}
        />
      ),
    },
    {
      label: "Mark the crossing",
      presentation: () => (
        <PresStatement
          kicker="§03 · Mark the crossing"
          title="So how do we mark it?"
          body={<>
            <p>The crossing deserves to be marked.<br/>Not blocked. Marked.</p>
            <p><em>Possibly something low</em>, a public space at canal level, where the city can meet the water.</p>
            <p><em>Possibly something high</em>, visible from across the basin, naming the place that has been overlooked for too long.</p>
            <p>And between them, the building stays calm. The crossing must remain clear to be seen.</p>
            <p><em>These are the questions the rest of this document answers.</em></p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§03 · Mark the crossing"
          title="The crossing deserves to be marked. How?"
          body={<>
            <p>The crossing is the most important piece of city at this end of King's Cross. It deserves to be marked, but not blocked. A building that fights the crossing with mass, with cantilevered floor plates, fills the air the crossing needs to be seen; the geometry of the meeting is lost behind the geometry of the building. We don't think that is right.</p>
            <p>So the question of how to mark the crossing, without fighting it, becomes the architectural subject of the proposal. <strong>Possibly something low</strong>, where the building meets the canal and the water-going public. <strong>Possibly something high</strong>, visible at distance, naming the place. <strong>And between them, the building stays calm</strong>, slender enough that the air around the crossing stays clear, the meeting still legible from the bridges.</p>
            <p>The pages that follow are the working-out of these questions: how the building grows from the canal, what typology marks the crossing best, and where on the spectrum between heavy and slender, public and private, the building finally lands. <em>This conviction, to mark the crossing without fighting it, is the conviction that the four design questions later in the document all follow from.</em></p>
          </>}
        />
      ),
    },
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §04 THE SITE (4 pages)
// ════════════════════════════════════════════════════════════════════════
// Four sketches that read the site: it is canal architecture, in a brick
// context, highly visible, and forced into a heavy/light position.
const siteSketches = [
  { fn: "site-of-the-canal.jpg",
    label: "Of the Canal",
    capTitle: "Of the Canal.",
    capMeta: "An artifact of the canal, not an office on a plot",
    cap: "Sketch: the site read as one of the canal's artifacts",
    kicker: "§04 · Of the canal",
    reportTitle: "This is canal architecture.",
    body: <>
      <p>We read this site as a piece of canal architecture: one of the artifacts that belong to the water, alongside the gasholders, Bagley Walk, the locks and the coal drops. It is not a normal office building set down on a plot.</p>
      <p>What belongs here is a structure <em>of</em> the canal, descended from the same family of infrastructure.</p>
    </>,
  },
  { fn: "site-brick-context.jpg",
    label: "Brick context",
    capTitle: "A brick context.",
    capMeta: "Closer in: the material of almost every neighbour",
    cap: "Sketch: a closer view, the predominantly brick surroundings",
    kicker: "§04 · Brick context",
    reportTitle: "Predominantly a brick context.",
    body: <>
      <p>Closer in, the reading sharpens. Almost every structure around the site, Victorian and contemporary alike, is built from the same dark, engineered, infrastructural brick.</p>
      <p>This is, before anything else, a brick context.</p>
    </>,
  },
  { fn: "site-in-full-view.jpg",
    label: "In full view",
    capTitle: "In full view.",
    capMeta: "Seen from the platforms, the north, and the canal",
    cap: "Sketch: the open void at grade leaves the site widely visible",
    kicker: "§04 · A visible site",
    reportTitle: "Seen from everywhere that matters.",
    body: <>
      <p>The canal, and the open void the railway tunnels hold at grade, leave the site unusually exposed. It is seen from the King's Cross station platforms, from the approaches to the north, and all along the towpath.</p>
      <p>This is a building that will be noticed. It has to earn that visibility.</p>
    </>,
  },
  { fn: "site-heavy-and-light.jpg",
    label: "Heavy and light",
    capTitle: "Heavy and light.",
    capMeta: "Light over the tunnels, heavy where easily founded",
    cap: "Sketch: the site on the fringe between heavy and light ground",
    kicker: "§04 · On the fringe",
    reportTitle: "Heavy where it can be, light where it must.",
    body: <>
      <p>The site sits on a fringe between heavy and light. Over the rail tunnels below, the building must stay light; where the ground is easily founded, it can be heavy.</p>
      <p>This is a forced contextual position, not a stylistic choice. Fighting it would be neither in the spirit of the place nor truthful urbanistically. The building takes the division as a given and grows from it.</p>
    </>,
  },
];

const S03 = sectionPages(
  { sectionNum: 4, sectionTitle: "The Site", sectionLabel: "The Site" },
  [
    {
      label: "Intro",
      presentation: () => (
        <PresStatement
          kicker="§04 · Reading the site"
          title="The building grows from the canal."
          body={<p>First, we read the site through sketches.</p>}
        />
      ),
      report: () => (
        <div className="pc-prose">
          <div className="pc-prose__head">
            <Eyebrow>§04 · Reading the site</Eyebrow>
            <h2 className="h-title">We read the site through sketches.</h2>
          </div>
          <div className="pc-prose__body">
            <div className="prose">
              <p>Before proposing a building, we read the site. The sketches that follow work through its contextual logic: this is canal architecture, in a brick context, unusually visible, and forced into a position that is both heavy and light.</p>
              <p>Together they argue the building's place relative to the canal, the railway, and the wider King's Cross fabric.</p>
            </div>
          </div>
        </div>
      ),
    },
    ...siteSketches.map((p, i) => ({
    label: p.label,
    presentation: () => (
      <PresImage
        filename={p.fn}
        caption={p.cap}
        variant="sketch"
        number={`0${i+1}`}
        capIdx={`Fig. 4.${i+1}`}
        capTitle={p.capTitle}
        capMeta={p.capMeta}
      />
    ),
    report: () => (
      <ReportImageText
        filename={p.fn}
        caption={p.cap}
        variant="sketch"
        number={`0${i+1}`}
        capIdx={`Fig. 4.${i+1}`}
        capTitle={p.capTitle}
        kicker={p.kicker}
        title={p.reportTitle}
        body={p.body}
      />
    ),
  })),
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §09 SKETCHES. STAGE TWO (6 pages)
// ════════════════════════════════════════════════════════════════════════
const stage2 = [
  { t: "The signal box as type",
    pres: "Small, elevated, pitched roof, generous glazing, the working architecture of infrastructure.",
    body: <p>The Victorian and early twentieth-century signal box is a defined architectural type, a small elevated structure, typically with a pitched or hipped roof, clad in metal or timber, with generous glazing for the operator's visibility. <strong>One of the most legible pieces of working infrastructure in the British railway and canal tradition.</strong></p> },
  { t: "The lookout",
    pres: "The upper floors are the lookout.",
    body: <p>The typological function is to look out. From a signal box, the operator surveys the network. As an architectural metaphor for the upper levels of a contemporary canal-side building, this is unusually apt, the upper floors are the lookout, the place from which the city and canal are observed.</p> },
  { t: "The inversion, offset, not centred",
    pres: "Not a crown on top of the brick mass, a contemporary addition stuck to the side.",
    body: <p>Rather than placing a small signal house centred on top of the brick mass, a classical composition, a heritage gesture, we propose offsetting it to one flank. <strong>The signal house becomes a contemporary addition stuck to the side of the infrastructure, not a crown sitting on top of it.</strong></p> },
  { t: "The pitched roof as archetype",
    pres: "The archetypal silhouette of working infrastructure architecture.",
    body: <p>The pitched roof is retained. It is the archetypal silhouette of working infrastructure architecture, and it differentiates the signal house unmistakably from a contemporary penthouse. A flat-roofed upper volume would read as a different building type entirely.</p> },
  { t: "Bright metal in contrast to dark brick",
    pres: "The brick is the brick. The aluminium box is the aluminium box.",
    body: <p>Bright perforated aluminium against dark brick. <strong>The two parts do not reconcile.</strong> The brick is the brick. The aluminium box is the aluminium box. Their architectural intelligence is in the precision of their contrast.</p> },
];

// ════════════════════════════════════════════════════════════════════════
// Shared helper, a family section of 14 pages, same structure for both
// Terraced (§09) and Signal Box (§10):
//   1     sketch + landscape image (two-up, lookout-pair format)
//   2     further concept drawing (single image + body)
//   3-8   axonometric build-up (6 stages, single image + body each)
//   9     what this family offers (numbered list, 5 offerings)
//   10-14 in context (5 photographic placeholders)
// ════════════════════════════════════════════════════════════════════════

// Numbered-list renderer for "what this family offers" pages (5 offerings)
const OfferList = ({ items }) => (
  <ol className="numlist">
    {items.map(([t, d], i) => (
      <li className="numlist__item" key={i}>
        <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
        <div>
          <div className="numlist__title">{t}</div>
          <div className="numlist__desc">{d}</div>
        </div>
      </li>
    ))}
  </ol>
);

// Two-up lookout-pair page, used for page 1 of either family.
// Either pane can be a sketch or a photograph.
function familyPage1({ sectionNum, sectionLabel, slug,
                       leftFilename, leftIdx, leftTitle, leftCaption, leftVariant,
                       rightFilename, rightIdx, rightTitle, rightCaption, rightVariant,
                       reportTitle, reportBody }) {
  const kicker = `§${String(sectionNum).padStart(2,'0')} · ${sectionLabel} · 1 of 14`;
  return {
    label: `${sectionLabel} · concept + image`,
    presentation: () => (
      <div className="lookout-pair">
        <div className="lookout-pair__col">
          <div className="lookout-pair__media">
            <Placeholder filename={leftFilename} caption={leftCaption} variant={leftVariant} number={leftIdx} aspect="4/3" />
          </div>
          <div className="lookout-pair__cap">
            <span className="idx mono">{leftIdx}</span>
            <span className="title">{leftTitle}</span>
          </div>
        </div>
        <div className="lookout-pair__col">
          <div className="lookout-pair__media">
            <Placeholder filename={rightFilename} caption={rightCaption} variant={rightVariant} number={rightIdx} aspect="4/3" />
          </div>
          <div className="lookout-pair__cap">
            <span className="idx mono">{rightIdx}</span>
            <span className="title">{rightTitle}</span>
          </div>
        </div>
      </div>
    ),
    report: () => (
      <div className="lookout-pair lookout-pair--report">
        <div className="lookout-pair__col">
          <div className="lookout-pair__media">
            <Placeholder filename={leftFilename} caption={leftCaption} variant={leftVariant} number={leftIdx} aspect="4/3" />
          </div>
          <div className="lookout-pair__caption mono"><b>{leftIdx}</b>{leftTitle}</div>
        </div>
        <div className="lookout-pair__col">
          <div className="lookout-pair__media">
            <Placeholder filename={rightFilename} caption={rightCaption} variant={rightVariant} number={rightIdx} aspect="4/3" />
          </div>
          <div className="lookout-pair__caption mono"><b>{rightIdx}</b>{rightTitle}</div>
        </div>
        <div className="lookout-pair__text">
          <Eyebrow>{kicker}</Eyebrow>
          <h2 className="h-sub">{reportTitle}</h2>
          <div className="prose">{reportBody}</div>
        </div>
      </div>
    ),
  };
}

// Standard single-image-with-body page (used for pages 2-8 axonometric build-up,
// and re-used across both families).
function familyImagePage({ sectionNum, sectionLabel, idx, of,
                          filename, variant, capIdx, capTitle, caption,
                          reportTitle, reportBody }) {
  const kicker = `§${String(sectionNum).padStart(2,'0')} · ${sectionLabel} · ${idx} of ${of}`;
  return {
    label: capTitle,
    presentation: () => (
      <PresImage
        filename={filename}
        caption={caption}
        variant={variant}
        number={String(idx)}
        capIdx={capIdx}
        capTitle={capTitle}
        capMeta={kicker}
      />
    ),
    report: () => (
      <ReportImageText
        filename={filename}
        caption={caption}
        variant={variant}
        number={String(idx)}
        capIdx={capIdx}
        capTitle={capTitle}
        kicker={kicker}
        title={reportTitle || capTitle}
        body={reportBody}
      />
    ),
  };
}

// "What this family offers" page (page 9 of each section)
function familyOffersPage({ sectionNum, sectionLabel, kickerLine, leadPres, leadReport, offerings, title, label }) {
  const kicker = `§${String(sectionNum).padStart(2,'0')} · ${sectionLabel} · ${kickerLine}`;
  const displayTitle = title || "What this family offers.";
  const pageLabel = label || "What this family offers";
  return {
    label: pageLabel,
    presentation: () => (
      <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
        <Eyebrow>{kicker}</Eyebrow>
        <h2 className="h-title" style={{marginBottom: 4}}>{displayTitle}</h2>
        <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 12}}>
          {leadPres}
        </div>
        <OfferList items={offerings} />
      </div>
    ),
    report: () => (
      <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
        <Eyebrow>{kicker}</Eyebrow>
        <h2 className="h-title" style={{marginBottom: 8}}>{displayTitle}</h2>
        <div className="prose" style={{maxWidth: '78ch', marginBottom: 8}}>
          {leadReport}
        </div>
        <OfferList items={offerings} />
      </div>
    ),
  };
}

// Site context pages 10-14, single full-bleed photographic placeholder per page.
function familySitePage({ sectionNum, sectionLabel, idx, slug }) {
  const kicker = `§${String(sectionNum).padStart(2,'0')} · ${sectionLabel} · in context · ${idx} of 5`;
  return {
    label: `In context · ${idx}`,
    presentation: () => (
      <PresImage
        filename={`${slug}-site-0${idx}.jpg`}
        caption={`${sectionLabel} in the King's Cross context · view ${idx}`}
        variant="photo"
        number={String(idx)}
        capIdx={`In context · ${idx}`}
        capTitle={`${sectionLabel} on the canal.`}
        capMeta={kicker}
      />
    ),
    report: () => (
      <ReportImageText
        filename={`${slug}-site-0${idx}.jpg`}
        caption={`${sectionLabel} in the King's Cross context · view ${idx}`}
        variant="photo"
        number={String(idx)}
        capIdx={`In context · ${idx}`}
        capTitle={`${sectionLabel} on the canal.`}
        kicker={kicker}
        title={`${sectionLabel} on the canal · view ${idx}.`}
        body={<p>Photographic study of the {sectionLabel.toLowerCase()} family seen from the King's Cross context. Drop a CGI or photomontage onto the slot to populate.</p>}
      />
    ),
  };
}

// Placeholder area-schedule page, appended at the end of each family
// section (Terraced / Signal Box). Renders the empty schedule shape that
// will be populated once the geometry is finalised in the calculator.
function familySchedulePage({ sectionNum, sectionLabel }) {
  const kicker = `§${String(sectionNum).padStart(2,'0')} · ${sectionLabel} · Area schedule`;
  const rows = ["Roof / 1820", "L7", "L6", "L5", "L4", "L3", "L2", "L1", "Ground", "Basement"];
  const table = (
    <table className="schedule__table">
      <thead>
        <tr>
          <th>Level</th>
          <th>GIA (m²)</th>
          <th>NIA (m²)</th>
          <th>NIA : GIA</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((lvl) => (
          <tr key={lvl}>
            <th>{lvl}</th>
            <td className="dim">, </td>
            <td className="dim">, </td>
            <td className="dim">, </td>
            <td className="dim">TBD</td>
          </tr>
        ))}
        <tr className="schedule__total">
          <th>Total</th>
          <td className="dim">, </td>
          <td className="dim">, </td>
          <td className="dim">, </td>
          <td></td>
        </tr>
      </tbody>
    </table>
  );
  return {
    label: "Area schedule",
    presentation: () => (
      <div className="schedule">
        <div className="schedule__head">
          <Eyebrow>{kicker}</Eyebrow>
          <h2 className="h-sub">{sectionLabel} family · indicative area schedule.</h2>
          <div className="prose tight" style={{maxWidth: '78ch', marginTop: 2}}>
            Placeholder, to follow once geometry is finalised in the calculator.
          </div>
        </div>
        {table}
      </div>
    ),
    report: () => (
      <div className="schedule">
        <div className="schedule__head">
          <Eyebrow>{kicker}</Eyebrow>
          <h2 className="h-sub">{sectionLabel} family · indicative area schedule.</h2>
          <div className="prose tight" style={{maxWidth: '78ch', marginTop: 2}}>
            <p>An indicative area schedule for the {sectionLabel.toLowerCase()} family. GIA, NIA, efficiency and brief notes per level. To follow, once the geometry of this family variant is settled and plugged into the design-side carbon + cost calculator.</p>
          </div>
        </div>
        {table}
      </div>
    ),
  };
}

// ════════════════════════════════════════════════════════════════════════
// §09 TERRACED, 14 pages
// ════════════════════════════════════════════════════════════════════════
const terracedOfferings = [
  ["Continuous landscape",
   "The roof reads as a garden, not a cap. The public realm of King's Cross continues up and over the building rather than stopping at its plinth."],
  ["A planted top",
   "Soil depth and species selection give a roof that performs ecologically, biodiverse and seasonal, not a single specimen ornament."],
  ["A softer crown",
   "Among the brick-and-glass neighbours, planting differentiates the silhouette without competing on architectural rhetoric."],
  ["Microclimate and stormwater",
   "Terraced planting attenuates rainwater, cools the air around the building, and shades the upper storeys."],
  ["A useful upper terrace",
   "The stepped form makes outdoor space at height usable, sheltered, and oriented to the canal."],
];

const terracedAxoSteps = [
  { capTitle: "Massing",            body: <p>The plate is sized to the constraints. A simple rectangular volume sits on the site, the starting point shared with every family.</p> },
  { capTitle: "Terracing carved",   body: <p>The upper floors step back from the canal edge. Each setback opens a horizontal plane that can carry soil and planting.</p> },
  { capTitle: "Structural frame",   body: <p>A lightweight frame above the brick body carries the terraces, with load concentrated to the eastern edge where the ground can take it.</p> },
  { capTitle: "Substrate and drainage", body: <p>The terraces receive a build-up of drainage, substrate, and growing medium. Roof becomes ground.</p> },
  { capTitle: "Planting",           body: <p>The substrate is planted: a layered, biodiverse mix selected for King's Cross light and exposure. The garden begins.</p> },
  { capTitle: "Assembled",          body: <p>The completed assembly. A continuous green silhouette reading up and over the building, the public realm of the canal extended to height.</p> },
];

const STerraced = sectionPages(
  { sectionNum: 17, sectionTitle: "Terraced", sectionLabel: "Terraced" },
  [
    // 0, title page (section opener / act break)
    {
      label: "Terraced",
      presentation: () => (
        <PresStatement
          kicker="§17 · Terraced"
          title="Terraced."
          body={<p>Greenery up and over the building.</p>}
        />
      ),
      report: () => (
        <div className="pc-prose">
          <div className="pc-prose__head">
            <Eyebrow>§17 · Terraced</Eyebrow>
            <h2 className="h-title">Terraced.</h2>
          </div>
          <div className="pc-prose__body">
            <div className="prose">
              <p>Greenery up and over the building. The roof read as a garden rather than a cap, the building dissolving into the public realm above.</p>
            </div>
          </div>
        </div>
      ),
    },
    // 1, sketch + landscape image
    familyPage1({
      sectionNum: 17, sectionLabel: "Terraced", slug: "terraced",
      leftFilename: "terraced-concept-01.jpg",
      leftIdx: "Concept · 1",
      leftTitle: "The building as terraced garden.",
      leftCaption: "Concept sketch, the roof read as continuous landscape.",
      leftVariant: "sketch",
      rightFilename: "terraced-precedent-01.jpg",
      rightIdx: "Precedent",
      rightTitle: "Planted roofscapes as precedent.",
      rightCaption: "Photographic precedent, a planted, terraced building as reference.",
      rightVariant: "photo",
      reportTitle: "Terraced, the building as garden.",
      reportBody: <>
        <p>The terraced family treats the building as an extension of the landscape rather than a frame for it. The roof is not a flat cap nor a sculpted gesture; it is a stepped, planted surface that continues the public realm of King's Cross up and over the building.</p>
        <p>The opening pages of this section pair our concept sketch with a photographic precedent, before the axonometric pages develop the build-up of the section in six stages.</p>
      </>,
    }),
    // 2, further concept drawing
    familyImagePage({
      sectionNum: 17, sectionLabel: "Terraced", idx: 2, of: 14,
      filename: "terraced-concept-02.jpg",
      variant: "sketch",
      capIdx: "Concept · 2",
      capTitle: "The terraced section.",
      caption: "Further concept drawing, the section taken through the terraced roof.",
      reportTitle: "The section that lets the garden up.",
      reportBody: <p>A section study through the building. The horizontal terraces are read as receivers of soil and planting; the stepped geometry is set by the building's contextual edges, not by an arbitrary gesture.</p>,
    }),
    // 3-8, axonometric build-up
    ...terracedAxoSteps.map((step, i) => familyImagePage({
      sectionNum: 17, sectionLabel: "Terraced", idx: i + 3, of: 14,
      filename: `terraced-axo-0${i+1}.jpg`,
      variant: "diagram",
      capIdx: `Axo · ${i+1}`,
      capTitle: step.capTitle,
      caption: `Axonometric build-up · stage ${i+1} of 6 · ${step.capTitle}`,
      reportTitle: step.capTitle,
      reportBody: step.body,
    })),
    // 9, what this family offers
    familyOffersPage({
      sectionNum: 17, sectionLabel: "Terraced", kickerLine: "What this family offers",
      leadPres: "What planting up and over the building gives the architecture and the city.",
      leadReport: <p>Before we leave the terraced family, the architectural argument: <em>why planting carries the building, what the gesture buys, where it lands lightly.</em></p>,
      offerings: terracedOfferings,
    }),
    // 10-14, site context images
    ...[1,2,3,4,5].map((n) => familySitePage({
      sectionNum: 17, sectionLabel: "Terraced", idx: n, slug: "terraced",
    })),
    // 15, placeholder area schedule
    familySchedulePage({ sectionNum: 17, sectionLabel: "Terraced" }),
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §10 SIGNAL BOX, 14 pages
//   (Existing typology bodies from `stage2` are reused inline as the body
//    text for the relevant axonometric stages; the §11 "Why Signal House"
//    page is folded in here as page 9.)
// ════════════════════════════════════════════════════════════════════════
const signalBoxOfferings = [
  ["Two voices, not one",
   "A heavy brick body that belongs to the canal, and a lightweight 1820 above. The contrast carries the contextual reading; neither part dilutes the other."],
  ["A legible top",
   "Every King's Cross neighbour has a distinctive crown, the Gasholders, the Granary, Coal Drops Yard. This one says signal box. Read from the bridges and across the basin."],
  ["The lookout",
   "Typologically, a signal box is a place to look out from. The upper room becomes a belvedere, naming the crossing it surveys."],
  ["Date as identity",
   "1820 names the building. The crown is the moniker; the building is the date the canal opened, carried into the city."],
  ["The right scale of expression",
   "The gesture is contained to one small object at the top. The brick body below stays disciplined. The signal house is the only place the building permits itself to speak."],
];

// stage2 indexes:
//   0 = "The signal box as type"   →  page 2 (further concept drawing)
//   1 = "The lookout"              →  page 1 (sketch + Varini precedent)
//   2 = "The inversion"            →  body for axo stage 3 (offset volume)
//   3 = "The pitched roof"         →  body for axo stage 4 (pitched roof)
//   4 = "Bright metal"             →  body for axo stage 5 (cladding)
const signalBoxAxoSteps = [
  { capTitle: "Brick body",                       body: <p>The plate begins as a heavy brick body, sized to the constraints and matching the canal context. Brick to the waterline; the building belongs to the canal before it does anything else.</p> },
  { capTitle: "Structural frame",                 body: <p>A lightweight upper frame is added to the brick mass. Vertical loads and lateral stability concentrate to the eastern edge where the ground beneath the site can take them.</p> },
  { capTitle: "Offset signal-box volume",         body: stage2[2].body /* inversion, offset, not centred */ },
  { capTitle: "Pitched roof",                     body: stage2[3].body /* pitched roof as archetype */ },
  { capTitle: "Bright aluminium cladding",        body: stage2[4].body /* bright metal in contrast to dark brick */ },
  { capTitle: "Assembled",                        body: <p>The completed assembly. Heavy brick body, offset signal-box volume, pitched roof, bright perforated aluminium cladding. The two parts read as two distinct architectural voices, held in deliberate contrast.</p> },
];

const S05 = sectionPages(
  { sectionNum: 18, sectionTitle: "Signal Box", sectionLabel: "Signal Box" },
  [
    // 0, title page (section opener / act break)
    {
      label: "Signal Box",
      presentation: () => (
        <PresStatement
          kicker="§18 · Signal Box"
          title="Signal Box."
          body={<p>The history of the site, looking up.</p>}
        />
      ),
      report: () => (
        <div className="pc-prose">
          <div className="pc-prose__head">
            <Eyebrow>§18 · Signal Box</Eyebrow>
            <h2 className="h-title">Signal Box.</h2>
          </div>
          <div className="pc-prose__body">
            <div className="prose">
              <p>The history of the site, looking up. A heavy brick body below and a lightweight, elevated lookout above, picking up the canal and railway typology of signal boxes, hoists, and lookouts. The top is a place of lightness.</p>
            </div>
          </div>
        </div>
      ),
    },
    // 1, sketch + landscape image (REUSE: our lookout sketch + Varini precedent)
    familyPage1({
      sectionNum: 18, sectionLabel: "Signal Box", slug: "signal-box",
      leftFilename: "sketch-07.jpg",
      leftIdx: "Sketch · 7",
      leftTitle: "Our sketch, the upper floors as lookout.",
      leftCaption: "The upper floors are the lookout.",
      leftVariant: "sketch",
      rightFilename: "varini-across-the-buildings.jpg",
      rightIdx: "Precedent · Varini, 2007",
      rightTitle: "\"Across the Buildings\", a lookout was here before.",
      rightCaption: "Across the Buildings · Felice Varini, 2007 · King's Cross, anamorphic painting resolving from a single viewing platform",
      rightVariant: "photo",
      reportTitle: "The upper floors as lookout.",
      reportBody: <>
        {stage2[1].body /* the lookout, typological function is to look out */}
        <p>King's Cross has done this before. <strong>"Across the Buildings"</strong> by the Swiss artist <strong>Felice Varini</strong> was an anamorphic installation commissioned by Argent in 2007 as part of the RELAY public art programme, silver and yellow geometric lines painted across multiple King's Cross facades, fragmented from most angles and resolving into a single coherent shape only from <em>one specific viewing point</em>. A platform was built to host that view.</p>
        <p>The architectural conversation at King's Cross has form for distinctive, site-specific, infrastructure-engaging artworks. Our signal box continues that lineage. <strong>It is the legible viewing point the masterplan once had on loan.</strong></p>
      </>,
    }),
    // 2, further concept drawing (REUSE: the signal box as type)
    familyImagePage({
      sectionNum: 18, sectionLabel: "Signal Box", idx: 2, of: 14,
      filename: "sketch-06.jpg",
      variant: "sketch",
      capIdx: "Sketch · 6",
      capTitle: "The signal box as type.",
      caption: stage2[0].pres,
      reportTitle: "The signal box as type.",
      reportBody: stage2[0].body,
    }),
    // 3-8, axonometric build-up
    ...signalBoxAxoSteps.map((step, i) => familyImagePage({
      sectionNum: 18, sectionLabel: "Signal Box", idx: i + 3, of: 14,
      filename: `signal-box-axo-0${i+1}.jpg`,
      variant: "diagram",
      capIdx: `Axo · ${i+1}`,
      capTitle: step.capTitle,
      caption: `Axonometric build-up · stage ${i+1} of 6 · ${step.capTitle}`,
      reportTitle: step.capTitle,
      reportBody: step.body,
    })),
    // 9, what this family offers (FOLDED IN from former §11)
    familyOffersPage({
      sectionNum: 18, sectionLabel: "Signal Box", kickerLine: "What this family offers",
      leadPres: "Before we narrow to a variant, the architectural argument for the family.",
      leadReport: <p>Before we look at variants within the family, the architectural argument: <em>why this family of buildings, on this site, before any of the other three wider options.</em> Five things the signal box typology gives us that none of the alternatives can.</p>,
      offerings: signalBoxOfferings,
    }),
    // 10. The building speaks twice (RELOCATED from §13 Materials,
    //       sits naturally with the Signal Box family argument since the
    //       two voices (brick body + aluminium signal house) are exactly
    //       what the signage makes literal.)
    {
      label: "The building speaks twice",
      presentation: () => (
        <div className="signage">
          <div className="signage__head">
            <Eyebrow>§18 · Signage</Eyebrow>
            <h2 className="h-title">The building speaks twice.</h2>
          </div>
          <div className="signage__cols">
            <div className="signage__col">
              <div className="signage__media">
                <Placeholder filename="signage-01-brick-1820-recessed.jpg" caption="1820 recessed and carved into the engineering brick at ground level. Victorian canal vocabulary, read at arm's reach" variant="material" number="01" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At ground level · in the brick</span>
                <div className="signage__big">The Crossing.</div>
                <div className="signage__sub">Recessed, carved into the masonry at canal level.<br/><em>Where you are.</em></div>
              </div>
            </div>
            <div className="signage__col">
              <div className="signage__media">
                <Placeholder filename="signage-02-aluminium-1820-perforated.jpg" caption="The Crossing, perforated through the lightweight skin of the 1820 belvedere; a lantern at night" variant="material" number="02" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At the skyline · perforated through aluminium</span>
                <div className="signage__big">The Crossing.</div>
                <div className="signage__sub">By day, shadow and depth. By night, a lantern over the canal.<br/><em>Why the building is here.</em></div>
              </div>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="signage">
          <div className="signage__head">
            <Eyebrow>§18 · Signage, the building speaks twice</Eyebrow>
            <h2 className="h-sub">The building speaks twice.</h2>
            <div className="prose tight" style={{maxWidth: '78ch', marginTop: 4}}>
              <p>Two pieces of signage, both worked into the material itself rather than applied to it. At the entrance, the building says <strong>where you are</strong>. At the skyline, <strong>why the building is here</strong>. The crossing is the silent context.</p>
            </div>
          </div>
          <div className="signage__cols">
            <div className="signage__col">
              <div className="signage__media">
                <Placeholder filename="signage-01-brick-1820-recessed.jpg" caption="The Crossing, recessed and carved into the brick at ground level" variant="material" number="01" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At ground level · embossed brick</span>
                <div className="signage__big">The Crossing.</div>
                <div className="signage__sub">Carved and recessed into the engineering brick at the canal threshold. Deep reveals, Victorian canal vocabulary. Read at arm's reach as you arrive on foot.</div>
              </div>
            </div>
            <div className="signage__col">
              <div className="signage__media">
                <Placeholder filename="signage-02-aluminium-1820-perforated.jpg" caption="The Crossing, perforated through the lightweight aluminium of the 1820 belvedere" variant="material" number="02" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At the skyline · perforated aluminium</span>
                <div className="signage__big">The Crossing.</div>
                <div className="signage__sub">Cut through the lightweight skin by perforation. By day, shadow and depth against bright metal. By night, the room glows from within, a soft lantern above the canal, legible from the bridges, St Pancras, Camley Street.</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // 11-15, site context images
    ...[1,2,3,4,5].map((n) => familySitePage({
      sectionNum: 18, sectionLabel: "Signal Box", idx: n, slug: "signal-box",
    })),
    // 16, placeholder area schedule
    familySchedulePage({ sectionNum: 18, sectionLabel: "Signal Box" }),
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §07 VISION. SIX MOVES (3 pages)
// ════════════════════════════════════════════════════════════════════════
const sixMoves = [
  ["Generous canal-side ground floor", "Sheltered colonnade, public threshold, café opening to the towpath."],
  ["A small cultural use at ground floor", "Gallery, public archive, or curated project space."],
  ["A public route through the building", "Goods Way to the towpath, sheltered and direct."],
  ["An eccentric core on the eastern edge", "Opens the lettable plate to a single coherent space with daylight from three sides."],
  ["Small distinctive tenancies above", "One or two floors per occupier, each tenancy genuinely defined."],
  ["A shared signal house lookout at the top", "Meeting space, terrace, communal moment for the whole building."],
];

const NumList = () => (
  <ol className="numlist">
    {sixMoves.map(([t, d], i) => (
      <li className="numlist__item" key={i}>
        <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
        <div>
          <div className="numlist__title">{t}</div>
          <div className="numlist__desc">{d}</div>
        </div>
      </li>
    ))}
  </ol>
);

const S06 = sectionPages(
  { sectionNum: 7, sectionTitle: "Vision", sectionLabel: "Vision" },
  [
    {
      label: "Narrowing the concept (act break)",
      isDivider: true,
      presentation: () => <Divider range="§§ 07–11" title="Narrowing the concept." sub="How the building meets the crossing at its western end, and the moves that balance value, cost, and sustainability." />,
      report: () => <Divider range="§§ 07–11" title="Narrowing the concept." sub="How the building meets the crossing at its western end, and the moves that balance value, cost, and sustainability." />,
    },
    {
      label: "Eastern threshold",
      presentation: () => (
        <PresStatement
          kicker="§07 · Vision"
          title="The eastern threshold of King's Cross."
          body={<>
            <p>The last building of the masterplan.<br/>The first building of the canal beyond it.</p>
            <p><em>It should do two things:</em></p>
            <p>1. Be unmistakably contextual.<br/>2. Be generous.</p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§07 · Vision"
          title="Two principles."
          body={<>
            <p>The site is the eastern threshold of the King's Cross masterplan, the last building before the canal opens to Camley Street and the wider city beyond. Anything built here is the closing statement of one of the most significant pieces of urban regeneration in modern London.</p>
            <p><strong>First, the building should be unmistakably contextual.</strong> The Bagley Walk wall, immediately adjacent, is the purest expression of the vocabulary. The building must answer to this context directly, as a continuation of canal infrastructure made habitable.</p>
            <p><strong>Second, the building should be generous.</strong> The architectural moves at ground level, how the building meets the canal, what it gives back to the city, define whether the building is a tolerated commercial object or a genuine contributor to the place.</p>
          </>}
        />
      ),
    },
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §05 CONSTRAINTS (2 pages)
// ════════════════════════════════════════════════════════════════════════
const S07 = sectionPages(
  { sectionNum: 5, sectionTitle: "Constraints", sectionLabel: "Constraints" },
  [
    {
      label: "Structural section",
      presentation: () => (
        <PresImage
          filename="constraints-diagram.jpg"
          caption="Canal · Bagley Walk · tube and Crossrail safeguarding · piling · steel + CLT frame · eccentric core"
          variant="diagram"
          capIdx="Fig. 7.1"
          capTitle="The constraints shape the building."
          capMeta="Structural section"
        />
      ),
      report: () => (
        <ReportImageText
          filename="constraints-diagram.jpg"
          caption="Structural section through site"
          variant="diagram"
          capIdx="Fig. 7.1"
          capTitle="Structural section, lightweight frame strategy."
          kicker="§05 · Engineering"
          title="The engineering follows the ground."
          body={<>
            <p>Beneath the site run the Northern, Piccadilly, Victoria, and Thameslink lines, with loading caps and exclusion zones safeguarded by Transport for London. The Bagley Walk wall cannot bear new load. A conventional reinforced concrete frame is not viable.</p>
            <p>The structural strategy concentrates lateral stability and vertical loads on the <strong>eastern edge</strong> of the site, where the ground beneath can carry weight.</p>
          </>}
        />
      ),
    },
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §08 FOUR FAMILY OPTIONS (1 page)
// ════════════════════════════════════════════════════════════════════════
const familyOptions = [
  {
    slug: "pitch",
    title: "Pitch.",
    sub: "Contextual roof form.",
    body: <p>A pitched roof family. The form reads the surrounding King's Cross context, where pitched and gabled forms recur across the canal and railway buildings. The crowning gesture is contextual rather than invented.</p>,
  },
  {
    slug: "terraced",
    title: "Terraced.",
    sub: "Greenery up and over the building.",
    body: <p>A terraced family. Planting and landscape continue up and over the building, so the roof is read as a garden rather than as a cap. The building dissolves into the public realm above.</p>,
  },
  {
    slug: "signal-box",
    title: "Signal Box.",
    sub: "The history of the site, looking up.",
    body: <p>A signal-box family. A heavy brick body below and a lightweight, elevated lookout above, picking up the canal and railway typology of signal boxes, hoists, and lookouts. The top is a place of lightness, looking up and out.</p>,
  },
  {
    slug: "carved",
    title: "Carved.",
    sub: "A distinctive cut elevation.",
    body: <p>A carved family. A single sculpted volume with a distinctive cut into its elevation, the geometry doing the work that material or top-detail does in the other families. The identity sits in the elevation, not in the silhouette.</p>,
  },
];

const S07_new = sectionPages(
  { sectionNum: 16, sectionTitle: "Four family options", sectionLabel: "Family options" },
  [
    {
      label: "Four families",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§16 · Family options</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>Four families.</h2>
          <div className="prose" style={{maxWidth: '72ch', fontSize: 18, color: 'var(--fg-soft)'}}>
            Four architectural families tested for the building, three studies in each.
          </div>
          <div className="families-4" style={{marginTop: 14}}>
            {familyOptions.map((fam) => (
              <div className="family-col" key={fam.slug}>
                <div className="family-col__title">{fam.title}</div>
                <div className="family-col__sub mono">{fam.sub}</div>
                <div className="family-col__cells">
                  {[1, 2, 3].map((n) => (
                    <div className="family-col__cell" key={n}>
                      <Placeholder filename={`family-${fam.slug}-0${n}.jpg`} caption={`${fam.title.replace('.', '')} · study ${n}`} variant="photo" aspect="3/2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§16 · Family options</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 8}}>Four families.</h2>
          <div className="prose" style={{maxWidth: '82ch'}}>
            <p>Within the brief and the constraints, we tested four architectural families for the building, three studies in each. Each family is a different answer to the same site, the same context, and the same brief. The studies within a family share a logic; the families themselves are genuinely different propositions, not variations on one idea.</p>
          </div>
          <div className="families-4" style={{marginTop: 14}}>
            {familyOptions.map((fam) => (
              <div className="family-col" key={fam.slug}>
                <div className="family-col__title">{fam.title}</div>
                <div className="family-col__sub mono">{fam.sub}</div>
                <div className="family-col__cells">
                  {[1, 2, 3].map((n) => (
                    <div className="family-col__cell" key={n}>
                      <Placeholder filename={`family-${fam.slug}-0${n}.jpg`} caption={`${fam.title.replace('.', '')} · study ${n}`} variant="photo" aspect="3/2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §10 WHY THE SIGNAL HOUSE FAMILY (1 page)
// ════════════════════════════════════════════════════════════════════════
const signalHouseOfferings = [
  ["Two voices, not one",
   "A heavy brick body that belongs to the canal, and a lightweight 1820 above. The contrast carries the contextual reading; neither part dilutes the other."],
  ["A legible top",
   "Every King's Cross neighbour has a distinctive crown, the Gasholders, the Granary, Coal Drops Yard. This one says signal box. Read from the bridges and across the basin."],
  ["The lookout",
   "Typologically, a signal box is a place to look out from. The upper room becomes a belvedere, naming the crossing it surveys."],
  ["Date as identity",
   "1820 names the building. The crown is the moniker; the building is the date the canal opened, carried into the city."],
  ["The right scale of expression",
   "The gesture is contained to one small object at the top. The brick body below stays disciplined. The signal house is the only place the building permits itself to speak."],
];

const ShOfferList = () => (
  <ol className="numlist">
    {signalHouseOfferings.map(([t, d], i) => (
      <li className="numlist__item" key={i}>
        <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
        <div>
          <div className="numlist__title">{t}</div>
          <div className="numlist__desc">{d}</div>
        </div>
      </li>
    ))}
  </ol>
);

const S09_new = sectionPages(
  { sectionNum: 11, sectionTitle: "Why the signal house family", sectionLabel: "Why Signal House" },
  [
    {
      label: "What the family offers",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§19 · Why the signal house family</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 4}}>What this family offers.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 12}}>
            Before we narrow to a variant, the architectural argument for the family.
          </div>
          <ShOfferList />
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§19 · Why the signal house family</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 8}}>What this family offers.</h2>
          <div className="prose" style={{maxWidth: '78ch', marginBottom: 8}}>
            <p>Before we look at variants within the family, the architectural argument: <em>why this family of buildings, on this site, before any of the other four wider options.</em> Five things the signal house typology gives us that none of the alternatives can.</p>
          </div>
          <ShOfferList />
        </div>
      ),
    },
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §11 THREE SIGNAL HOUSE VARIANTS → OUR PREFERRED (5 pages)
// ════════════════════════════════════════════════════════════════════════
const signalHouseVariants = [
  {
    slug: "centred",
    t: "Centred signal house",
    pres: "Classical composition, symmetric signal box centred on top of the brick mass",
    body: <p>The classical composition. A symmetrical centred signal house reads as a heritage gesture, a quiet completion, a crown. But the gesture asks little of the building; the signal house becomes ornament rather than architecture.</p>,
  },
  {
    slug: "offset",
    t: "Offset signal house",
    pres: "Contemporary inversion, signal house attached to one flank of the brick mass",
    body: <p><strong>Our preferred variant.</strong> A contemporary inversion of the classical composition. The signal house becomes a contemporary <em>addition</em> stuck to one flank of the brick infrastructure, not a crown sitting on top of it. The two parts do not reconcile. <strong>The architectural intelligence is in the precision of their unrelatedness.</strong></p>,
    preferred: true,
  },
  {
    slug: "stepped",
    t: "Stepped signal house",
    pres: "Multi-volume, a cluster of stepped signal-house elements along the roofline",
    body: <p>A more articulated answer. Multiple signal-house volumes step along the roofline, suggesting a small village of working elements. Reads as more domestic and busy than the single offset gesture, less disciplined, less legible at distance.</p>,
  },
];

const S10_new = sectionPages(
  { sectionNum: 19, sectionTitle: "The 1820, the marker", sectionLabel: "The 1820" },
  [
    {
      label: "The 1820, what sits at the top",
      presentation: () => (
        <PresCover
          filename="the-1820-room.jpg"
          caption="The 1820, the cantilevered room at the top, lit at night, seen from the canal, the station and the parks"
          overlay={
            <>
              <span className="mono" style={{color: 'var(--accent)', letterSpacing: '0.22em', fontWeight: 500}}>The marker</span>
              <h2 className="h-sub" style={{fontSize: 32, maxWidth: '16ch', margin: 0, lineHeight: 1.15}}>The 1820.</h2>
              <span className="mono" style={{fontSize: 11, color: 'var(--fg-soft)'}}>What sits at the top of the building.</span>
            </>
          }
        />
      ),
      report: () => (
        <ReportImageText
          filename="the-1820-room.jpg"
          caption="The 1820, the cantilevered room at the top"
          variant="CGI"
          number="1820"
          capIdx="Fig. 10.1"
          capTitle="The 1820, the marker."
          kicker="§19 · The marker"
          title="The 1820."
          body={<p>The cantilevered room at the top. Lit at night, visible from the canal, the station and the parks. The building's marker, and the subject of the four design questions that follow.</p>}
        />
      ),
    },
    {
      label: "What could the 1820 be?",
      presentation: () => (
        <PresStatement
          kicker="§19 · The marker"
          title="What could the 1820 be?"
          body={<>
            <p>Lit at night. Seen from the canal, from the station, from Camley Street.<br/>And from it, you see all of King's Cross.</p>
            <p><em>Maybe</em> a small museum, telling the history of the canal, the railway, the place.</p>
            <p><em>Maybe</em> a terrace, open to the air. We sense it wants to be outside, not internal.</p>
            <p><em>Maybe</em> the last generous move the building makes to the city.</p>
            <p>If public, incredible.<br/>If private, wonderful for tenants. A draw. A place.</p>
            <p><em>But this is open. A wonderful opportunity to discuss.</em></p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§19 · The marker, before the questions"
          title="What could the 1820 be?"
          body={<>
            <p>The 1820 is the building's marker. What it <em>is</em> is fixed, a cantilevered room at the top, lit at night, visible from the canal, the station, Camley Street, and Coal Drops Yard. From it, you see King's Cross. <strong>What it does</strong>, its programme, its public-ness, its content, is open.</p>
            <p>It could be a small museum of the canal and the railway, telling the story of the place that made King's Cross, a generous gesture from the building to the public realm that surrounds it. It could be a terrace, simply, open to the air; we sense it wants to be outside rather than internal, the air around the crossing rather than a glazed room. It could carry an inscription cut into its lightweight skin, text legible by day through shadow and depth, glowing as a soft lantern at night.</p>
            <p>If public, it is incredible, a free roof for the city, the only one of its kind at King's Cross. If private, it is wonderful for the building's tenants, a draw at the top, a place, a piece of identity money cannot easily buy. <em>The decision between these is one of the four questions that follow, but the 1820 itself, as the building's marker, is not in question.</em></p>
            <p>Before the four questions, then: a clear statement that <strong>the 1820 is the poetic engine of the building, but the building below is also an office, and it has to work.</strong> The four questions that follow are where the office part gets resolved, without compromising the marker.</p>
          </>}
        />
      ),
    },
  ]
);


// ════════════════════════════════════════════════════════════════════════
// §12 FOUR QUESTIONS (6 pages)
// ════════════════════════════════════════════════════════════════════════

// ── Helpers ──────────────────────────────────────────────────────────────
function OptionCard({ tag, title, fn, cap, num, points, pick = false, mode, variant = "model" }) {
  const isHero = mode === "hero";
  return (
    <div className={"q-opt" + (pick ? " q-opt--pick" : "") + (isHero ? " q-opt--hero" : "")}>
      {pick ? <span className="q-opt__chip">Our instinct</span> : null}
      <div className="q-opt__model">
        <Placeholder filename={fn} caption={cap} variant={variant} number={num} />
      </div>
      <div className="q-opt__head">
        <span className="q-opt__tag">{tag}</span>
        <h3 className="q-opt__title">{title}</h3>
      </div>
      {!isHero && points ? (
        <ul className="q-opt__list">
          {points.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

function QuestionPage({ n, topic, question, intro, optA, optB, pickIdx, instinct, view, mode, variant }) {
  return (
    <div className="q-page">
      <div className="q-page__head">
        <Eyebrow>§20 · Question {n} of 5 · {topic} · summary</Eyebrow>
        <h2 className="h-title">{question}</h2>
        {view === "report" && intro ? <div className="q-page__intro">{intro}</div> : null}
      </div>
      <div className="q-page__cols">
        <OptionCard {...optA} pick={pickIdx === "A"} mode={mode} variant={variant} />
        <OptionCard {...optB} pick={pickIdx === "B"} mode={mode} variant={variant} />
      </div>
      <div className="q-instinct">
        <span className="q-instinct__lbl">Our instinct</span>
        <span className="q-instinct__body">{instinct}</span>
      </div>
    </div>
  );
}

function QuestionOptionPage({ n, topic, question, opt, abIdx, pick, view, variant = "model" }) {
  return (
    <div className="q-opt-page">
      <div className="q-opt-page__head">
        <Eyebrow>§20 · Question {n} of 5 · {topic}</Eyebrow>
        <h2 className="h-sub">{question}</h2>
      </div>
      <div className="q-opt-page__model">
        <Placeholder filename={opt.fn} caption={opt.cap} variant={variant} number={opt.num} />
      </div>
      <div className="q-opt-page__caption">
        <div className={"q-opt-page__abIdx mono" + (pick ? " q-opt-page__abIdx--pick" : "")}>
          Option {abIdx} of 2{pick ? " · OUR INSTINCT" : ""}
        </div>
        <h3 className="q-opt-page__title">{opt.title}</h3>
        <div className="q-opt-page__sub mono">{opt.tag}, {opt.cap}</div>
      </div>
    </div>
  );
}

// ── Question data ────────────────────────────────────────────────────────
const fourQuestions = [
  {
    topic: "Massing",
    variant: "model",
    question: "Wider and shorter, or slender and taller?",
    intro: <p>Both options carry the offset 1820 belvedere at the top. The question is whether the floor plates <em>below</em> also cantilever outward, recovering area at the cost of structure and carbon, or sit cleanly on the easy ground and add storeys instead.</p>,
    pickIdx: "B",
    optA: {
      tag: "Option A · G+7",
      title: "Cantilevered plates.",
      fn: "scheme-a-cantilever.jpg",
      cap: "G+7 with full-floor cantilever toward the canal, wider, shorter",
      num: "A",
      points: [
        <>~6,000 sqft per floor, every plate reaches over the hard piece</>,
        <><b>Significant</b> structural transfer at ground level</>,
        <>Heavier embodied carbon, transfer is the carbon villain</>,
        <>Building presses outward; reads heavier on a tight site</>,
        <>Costlier per sqm of NIA</>,
      ],
    },
    optB: {
      tag: "Option B · G+8 / G+9",
      title: "Simple extrusion.",
      fn: "scheme-b-extrusion.jpg",
      cap: "G+8/9 clean stack, only The 1820 cantilevers",
      num: "B",
      points: [
        <>~5,000 sqft per floor, clean stacked structure</>,
        <>No transfer structure, honest, regular grid</>,
        <>Lower embodied carbon, lighter on ground</>,
        <>Building presses upward, reads slender</>,
        <>Only <b>one</b> cantilever in the building. The 1820</>,
        <>Cheaper per sqm but more façade per sqm of NIA</>,
      ],
    },
    instinct: <>Option <b>B</b>. The 1820 is the only cantilever the building needs, repeating the gesture nine times below dilutes it.</>,
  },
  {
    topic: "Core",
    variant: "diagram",
    question: "Perimeter space, or one large coherent space?",
    intro: <p>A plan-level question about the <em>shape</em> of the lettable space, not whether it can be split, <strong>both options can be split</strong>. The core's position determines whether tenants occupy a doughnut of perimeter space around services in the middle, or a single coherent room with services pushed to one flank.</p>,
    pickIdx: "B",
    optA: {
      tag: "Option A · Central core",
      title: "Perimeter space.",
      fn: "scheme-a-central-core.jpg",
      cap: "Central core, a doughnut of perimeter space around services in the middle; splittable into 2–3 tenancies",
      num: "A",
      points: [
        <>Lettable space wraps the core, <b>perimeter daylight</b> on all four sides</>,
        <>Splittable: 1, 2 or 3 tenants per floor</>,
        <>Services break the perimeter, visible from outside</>,
        <>Hits the splittable sub-2,500 sqft segment as well as whole-floor</>,
        <>The conventional plan logic</>,
      ],
    },
    optB: {
      tag: "Option B · Eccentric core",
      title: "One large coherent space.",
      fn: "scheme-b-eccentric-core.jpg",
      cap: "Eccentric core to one flank, single coherent room with daylight on three sides; equally splittable",
      num: "B",
      points: [
        <>A single coherent open volume, <b>three-sided daylight</b></>,
        <>Equally splittable, we can still take 2–3 tenants per floor</>,
        <>Cleaner facade, services contained to one flank</>,
        <>Hits the boutique whole-floor 5,000 sqft segment <em>and</em> the splittable market</>,
        <>The distinctive plan logic</>,
      ],
    },
    instinct: <>Option <b>B</b>. We can split both, so the question is really which <em>shape</em> of space the building should offer. A single coherent room with three-sided daylight is more architecturally generous, more flexible for occupiers, and produces a cleaner elevation. <em>The eccentric core gives up nothing on splittability.</em></>,
  },
  {
    topic: "Substructure",
    variant: "diagram",
    question: "Basement, or 6 m ground floor?",
    intro: <p>Where does the plant live? The basement keeps it hidden but costs in capex, carbon and programme. Lifting plant to a mezzanine frees the ground floor to be 6 m tall, a different kind of building at street level.</p>,
    pickIdx: "B",
    optA: {
      tag: "Option A · With basement",
      title: "Plant below ground.",
      fn: "scheme-a-basement.jpg",
      cap: "Basement plant, standard 3.5–4 m ground floor",
      num: "A",
      points: [
        <>Plant below ground, hidden from the public realm</>,
        <>Standard 3.5–4 m ground floor height</>,
        <>Higher capex, excavation, waterproofing, tube-line interface</>,
        <>More embodied carbon, concrete-heavy substructure</>,
        <>Longer programme, substructure on critical path</>,
      ],
    },
    optB: {
      tag: "Option B · No basement",
      title: "6 m generous ground floor.",
      fn: "scheme-b-no-basement.jpg",
      cap: "Mezzanine plant, double-height 6 m ground floor, café, lobby, deeper daylight",
      num: "B",
      points: [
        <>Plant on mezzanine, expressed, honest</>,
        <><b>6 m double-height ground</b>, café, lobby, daylight reaches deeper</>,
        <>Lower capex, faster programme</>,
        <>Materially lower embodied carbon, possibly decisive on LETI 2030</>,
        <>Building reads taller and more present at street level</>,
      ],
    },
    instinct: <>Option <b>B</b>. The 6 m ground floor is a better building, cheaper, lower-carbon, faster, more generous at the canal threshold. The most consequential single lever in the sub-structure decision tree.</>,
  },
  {
    topic: "The 1820",
    variant: "CGI",
    question: "Tenant-only, or public?",
    intro: <p>The 1820 belvedere is fixed, it is the building's reason for being. The question is who gets to stand on it. A private tenant amenity, or King's Cross's first free public roof.</p>,
    pickIdx: "B",
    optA: {
      tag: "Option A · Tenant-only",
      title: "Private amenity.",
      fn: "scheme-a-private-roof.jpg",
      cap: "The 1820 as private tenant terrace at the top",
      num: "A",
      points: [
        <>Full NIA preserved, no public lift, no public entrance</>,
        <>~£0 incremental capex / opex</>,
        <>Simple operation, no visitor management, no covenant</>,
        <>Building reads private, strong tenant amenity</>,
        <>Conventional planning case</>,
      ],
    },
    optB: {
      tag: "Option B · Public",
      title: "King's Cross's first free public roof.",
      fn: "scheme-b-public-roof.jpg",
      cap: "The 1820 with public lift and entrance, civic belvedere",
      num: "B",
      points: [
        <>~5–8% NIA loss for public lift and entrance</>,
        <>~£1.1m incremental capex / ~£165k p.a. opex</>,
        <><b>£150–300k p.a. event income</b>, opex pays for itself</>,
        <><b>Place premium £5–15/sqft</b> = £225–675k p.a. additional rent</>,
        <>Planning hook under London Plan D9(D) + Camden draft KQ1</>,
        <>Building is civic, visible from inside <em>and</em> outside</>,
      ],
    },
    instinct: <>Option <b>B</b>. The 1820 is wasted if it is only seen by tenants. The whole point of marking the crossing is that the city can stand on it, and the economics work: opex pays for itself in event income, the rental premium funds the capex back inside ten years.</>,
  },
];

// ── Q5 Materials data, mirrors the calculator's HEAVY / LIGHT lists ─────
// Used by QMaterialPage. The "chosen" entry is the proposed material; the
// rest are alternatives presented for the sustainability + cost discussion.
const heavyMaterials = [
  { slug: "brick",                 label: "Engineering brick",                carbon: 140, cost:  900, note: "Full bricks. Kiln-fired at ~1,100°C. Same family of brick that built King's Cross.", chosen: true },
  { slug: "brick-slip",            label: "Brick slip on rail",               carbon:  95, cost:  650, note: "20mm slips on a mechanically-fixed carrier. Lower carbon, less honest at close range." },
  { slug: "stone-portland",        label: "Portland limestone (UK)",          carbon:  85, cost: 1300, note: "UK-quarried sedimentary. Low energy, but a different vocabulary from the canal." },
  { slug: "stone-granite",         label: "Granite (imported)",               carbon: 280, cost: 1550, note: "Imported, high-energy cutting and shipping. Highest carbon, highest cost." },
  { slug: "precast",               label: "Pre-cast concrete",                carbon: 240, cost:  750, note: "Reconstituted-stone PCC panels. Faster to install, lower cost." },
  { slug: "precast-ggbs",          label: "Pre-cast + GGBS",                  carbon: 145, cost:  800, note: "70% GGBS cement replacement. Comparable carbon to brick at lower cost." },
  // Materials that read as heavy by finish rather than mass: low-process
  // steel with a deliberate weathered patina, or anodised / coloured
  // aluminium cassettes in deep tones. Lighter than masonry, much lower
  // carbon than full brick, but capable of carrying the same weight on
  // the elevation through colour and surface depth.
  { slug: "weathered-mild-steel",  label: "Weathered mild steel",             carbon: 120, cost: 1050, note: "Low-process mild steel allowed to patina to a deep oxide finish. Reads as heavy without the mass; lighter than brick on the structure." },
  { slug: "coloured-aluminium",    label: "Coloured aluminium (recycled)",    carbon: 180, cost:  975, note: "Recycled aluminium cassette with a deep anodised or PPC finish in a brick-toned palette. Reads heavy from distance; lighter than brick on the structure; honest at close range." },
];

const lightMaterials = [
  { slug: "al-recycled",    label: "Aluminium, recycled (CIRCAL 75R)", carbon:  75, cost:  720, note: "75% recycled content. Embodied carbon 75–85% lower than primary aluminium.", chosen: true },
  { slug: "al-primary",     label: "Aluminium, primary",         carbon: 310, cost:  650, note: "Standard cassette; ~12 kgCO₂e/kg. Cheaper, but four times the carbon." },
  { slug: "stainless",      label: "Corrugated stainless",        carbon: 180, cost:  825, note: "316 grade, marine-suitable. Heavier carbon and cost; different patina." },
  { slug: "corten",         label: "Weathering steel (Corten)",   carbon:  95, cost:  580, note: "Self-finishing patina; low-process steel. Reads agricultural, not signal-box." },
  { slug: "zinc",           label: "Zinc standing seam",          carbon: 105, cost:  850, note: "Pre-weathered VMZinc. Sympathetic, but reads domestic at this scale." },
  { slug: "al-mesh",        label: "Aluminium mesh / perf",       carbon: 200, cost:  580, note: "Perforated screen; less aluminium per m² but lower recycled content." },
];

// ── Material page renderer ─────────────────────────────────────────────
function QMaterialPage({ slot, image, imageCaption, lead, materials, view, kicker, title }) {
  const idx = slot === "heavy" ? "Heavy" : "Light";
  const defaultKicker = `§20 · Question 5 of 5 · Materials · ${idx}`;
  const defaultTitle  = slot === "heavy" ? "Which heavy material below?" : "Which light material above?";
  return (
    <div className="q-mat">
      <div className="q-mat__head">
        <Eyebrow>{kicker || defaultKicker}</Eyebrow>
        <h2 className="h-sub">{title || defaultTitle}</h2>
        {view === "report" ? (
          <div className="prose tight" style={{maxWidth: '78ch', marginTop: 4}}>{lead}</div>
        ) : (
          <div className="prose" style={{maxWidth: '64ch', fontSize: 14, color: 'var(--fg-soft)', marginTop: 4}}>{lead}</div>
        )}
      </div>
      <div className="q-mat__body">
        <div className="q-mat__image">
          <Placeholder filename={image} caption={imageCaption} variant="material" number={slot === "heavy" ? "H" : "L"} />
          <div className="q-mat__image-cap mono">
            <b>{materials[0].label}{materials[0].chosen ? " · proposed" : ""}</b>
            {materials[0].note}
          </div>
        </div>
        <div className="q-mat__alts">
          <div className="q-mat__alts-hd mono">Alternatives, for sustainability + cost discussion</div>
          <table className="q-mat__table">
            <thead>
              <tr>
                <th>Material</th>
                <th className="num">kgCO₂e / m²</th>
                <th className="num">£ / m²</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => (
                <tr key={m.slug} className={m.chosen ? "is-chosen" : ""}>
                  <td>
                    <b>{m.label}</b>
                    {m.chosen ? <span className="q-mat__pick mono"> · proposed</span> : null}
                  </td>
                  <td className="num mono">{m.carbon}</td>
                  <td className="num mono">£{m.cost}</td>
                  <td className="dim">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Spectrum setup (used by §12 page 1) ──────────────────────────────────
function SpectrumPage({ view }) {
  const rows = [
    ["01 · Massing",      "G+7 · 6,000 sqft floors · cantilevered plates", "G+8/9 · 5,000 sqft floors · simple extrusion"],
    ["02 · Core",         "Central · splittable · 18 letting events",       "Eccentric · whole-floor · 9 letting events"],
    ["03 · Substructure", "Basement · standard 3.5–4 m ground floor",       "No basement · generous 6 m ground floor"],
    ["04 · The 1820",     "Tenant-only · private amenity",                  "Public · King's Cross's first free roof"],
  ];
  return (
    <div className="q-spectrum">
      <div className="q-spectrum__head">
        <Eyebrow>§20 · The four answers, assembled</Eyebrow>
        <h2 className="h-title">Two ends of the spectrum.</h2>
        {view === "report" ? (
          <div className="prose" style={{maxWidth: '78ch', marginTop: 4}}>
            <p>The four answers together define a spectrum between two extreme schemes. Scheme A is the maximum-commercial answer at every axis; Scheme B is our instinct. The building lands somewhere between these two ends, depending on the panel's steer.</p>
          </div>
        ) : null}
      </div>
      <div className="q-spectrum__grid">
        <div className="q-spectrum__row q-spectrum__row--head">
          <div></div>
          <div className="col-eyebrow">Scheme A · Max commercial</div>
          <div className="col-eyebrow accent">Scheme B · Our instinct</div>
        </div>
        {rows.map(([axis, a, b], i) => (
          <div className="q-spectrum__row" key={i}>
            <div className="q-spectrum__axis">{axis}</div>
            <div className="q-spectrum__cell">{a}</div>
            <div className="q-spectrum__cell q-spectrum__cell--pick">{b}</div>
          </div>
        ))}
      </div>
      <div className="q-spectrum__foot">
        <em>Each answer to the four questions moves the building along this spectrum. Where our instinct lands is on the next page.</em>
      </div>
    </div>
  );
}

// ── Recap (used by §12 page 6) ───────────────────────────────────────────
function RecapPage({ view }) {
  const rows = [
    ["01 · Massing",      "B. Simple extrusion",   "Only The 1820 cantilevers."],
    ["02 · Core",         "B. Eccentric",          "Boutique whole-floor lettings; daylight three sides."],
    ["03 · Substructure", "B. No basement",        "6 m generous ground floor; the lowest-carbon path."],
    ["04 · The 1820",     "B. Public",             "King's Cross's first free public roof; sound economics."],
    ["05 · Floor plate",  "5,000 sqft",            "The plate that lets every other choice stay simple."],
  ];
  return (
    <div className="q-recap">
      <div className="q-recap__head">
        <Eyebrow>§20 · The scheme we believe in</Eyebrow>
        <h2 className="h-title">Where our instinct lands.</h2>
        {view === "report" ? (
          <div className="prose" style={{maxWidth:'78ch', marginTop: 4}}>
            <p>Each choice individually is defensible at either end. Taken together, our instinct lands consistently on B, a slender, simple, generous, civic building. But this is an interim conversation, not a verdict.</p>
          </div>
        ) : null}
      </div>
      <div className="q-recap__grid">
        {rows.map(([q, pick, because], i) => (
          <div className="q-recap__row" key={i}>
            <span className="q-recap__q">{q}</span>
            <span className="q-recap__pick">{pick}</span>
            <span className="q-recap__because">{because}</span>
          </div>
        ))}
      </div>
      <div className="q-recap__foot">
        We are presenting these openly because we want your <b>steer</b> on which axis matters most to you, and where the red lines are before the final interview.
      </div>
    </div>
  );
}

const S09 = sectionPages(
  { sectionId: "four-questions", sectionNum: 20, sectionTitle: "The Five Questions", sectionLabel: "Five Questions" },
  [
    {
      label: "The five questions (act break)",
      isDivider: true,
      presentation: () => <Divider range="§20" title="The five questions." sub="From the poetic to the prosaic. This is also an office building, and it has to work." />,
      report: () => <Divider range="§20" title="The five questions." sub="From the poetic to the prosaic. This is also an office building, and it has to work." />,
    },
    ...fourQuestions.flatMap((q, i) => {
      // Short titles shown on each question's title page.
      const shortTitles = [
        "Wider or Taller?",
        "One Room or Many?",
        "Basement or 6 m Ground?",
        "Private or Public?",
      ];
      const shortTitle = shortTitles[i] || q.topic;
      return [
        {
          label: `Q${i+1} · Title`,
          isDivider: true,
          presentation: () => <Divider range={`§20 · Question ${i+1} of 5 · ${q.topic}`} title={`Question ${i+1} : ${shortTitle}`} sub={q.question} />,
          report: () => <Divider range={`§20 · Question ${i+1} of 5 · ${q.topic}`} title={`Question ${i+1} : ${shortTitle}`} sub={q.question} />,
        },
        {
          label: `Q${i+1} · ${q.topic} · A`,
          presentation: () => <QuestionOptionPage n={i+1} topic={q.topic} question={q.question} opt={q.optA} abIdx="A" pick={q.pickIdx === "A"} view="presentation" variant={q.variant} />,
          report: () => <QuestionOptionPage n={i+1} topic={q.topic} question={q.question} opt={q.optA} abIdx="A" pick={q.pickIdx === "A"} view="report" variant={q.variant} />,
        },
        {
          label: `Q${i+1} · ${q.topic} · B`,
          presentation: () => <QuestionOptionPage n={i+1} topic={q.topic} question={q.question} opt={q.optB} abIdx="B" pick={q.pickIdx === "B"} view="presentation" variant={q.variant} />,
          report: () => <QuestionOptionPage n={i+1} topic={q.topic} question={q.question} opt={q.optB} abIdx="B" pick={q.pickIdx === "B"} view="report" variant={q.variant} />,
        },
        {
          label: `Q${i+1} · ${q.topic} · Summary`,
          presentation: () => <QuestionPage n={i+1} {...q} view="presentation" />,
          report: () => <QuestionPage n={i+1} {...q} view="report" />,
        },
      ];
    }),
    // ── Q5 · Materials, title + heavy + light ──────────────────────────
    {
      label: "Q5 · Title",
      isDivider: true,
      presentation: () => <Divider range="§20 · Question 5 of 5 · Materials" title="Question 5 : Which Materials?" sub="Heavy and light. Sustainability and cost. The two material choices the building stands on." />,
      report: () => <Divider range="§20 · Question 5 of 5 · Materials" title="Question 5 : Which Materials?" sub="Heavy and light. Sustainability and cost. The two material choices the building stands on." />,
    },
    {
      label: "Q5 · Materials · Heavy (brick)",
      presentation: () => (
        <QMaterialPage
          slot="heavy"
          image="material-01-brick-sample.jpg"
          imageCaption="Staffordshire blue-brown engineering brick, the brick of Victorian canal and railway infrastructure"
          lead={<p>The brick body is heavy by intent, it belongs to the canal. The proposed material is full engineering brick; the alternatives below are the heavy options we could discuss for sustainability and cost.</p>}
          materials={heavyMaterials}
          view="presentation"
        />
      ),
      report: () => (
        <QMaterialPage
          slot="heavy"
          image="material-01-brick-sample.jpg"
          imageCaption="Staffordshire blue-brown engineering brick, the brick of Victorian canal and railway infrastructure"
          lead={<p>The brick body is heavy by intent. It is the contextual move: brick to the waterline, matching the canal vocabulary. The proposed material is full engineering brick. The table below sets out the heavy alternatives, with their embodied carbon and indicative cost, so the trade-offs are visible. <em>Numbers are indicative and align with the design-side carbon calculator.</em></p>}
          materials={heavyMaterials}
          view="report"
        />
      ),
    },
    {
      label: "Q5 · Materials · Light (aluminium)",
      presentation: () => (
        <QMaterialPage
          slot="light"
          image="material-04-aluminium-detail.jpg"
          imageCaption="Bright perforated recycled aluminium. Hydro CIRCAL 75R, lantern-like at dusk"
          lead={<p>The signal-box volume is light by intent, bright, lantern-like, in contrast to the brick body. The proposed material is recycled aluminium (CIRCAL 75R); the alternatives below are the light options we could discuss.</p>}
          materials={lightMaterials}
          view="presentation"
        />
      ),
      report: () => (
        <QMaterialPage
          slot="light"
          image="material-04-aluminium-detail.jpg"
          imageCaption="Bright perforated recycled aluminium. Hydro CIRCAL 75R, lantern-like at dusk"
          lead={<p>The signal-box volume is light by intent. Bright, lantern-like, in deliberate contrast to the brick body. The proposed material is Hydro CIRCAL 75R, 75% recycled aluminium with embodied carbon 75–85% lower than primary aluminium. The table below sets out the light alternatives, with embodied carbon and indicative cost. <em>Numbers are indicative and align with the design-side carbon calculator.</em></p>}
          materials={lightMaterials}
          view="report"
        />
      ),
    },
    {
      label: "The planning trade-off",
      presentation: () => (
        <PresStatement
          kicker="§20 · The planning trade-off"
          title="One honest caveat."
          body={<>
            <p>The G+8/9 scheme we recommend sits <strong>outside the existing outline consent.</strong></p>
            <p>Both options need fresh planning.</p>
            <p>We save money in construction.<br/>We save carbon in structure.<br/>We arguably make the better urban building.</p>
            <p><em>But the cost of those savings is planning time.</em></p>
            <p>We are confident in the urban argument.<br/><strong>But we must consider the time.</strong></p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§20 · The planning trade-off"
          title="One honest caveat, what believing in Path B asks of you."
          body={<>
            <p>The G+8/9 scheme we recommend (Path B) sits <strong>outside the existing outline consent</strong>, which envelopes a G+7 building. Both Path A and Path B will require a new planning application, refurbishment is not on the table, and any new office building on this site needs a fresh determination. But the two paths are not equally easy to consent: Path A sits within the established envelope and is, in planning terms, a refinement of what is already known; Path B is a different and more ambitious building, and it asks the planning authority to accept a height greater than the original masterplan anticipated for this plot.</p>
                <p>The argument for Path B at planning is urbanistic: a smaller ground footprint, more public realm at the canal threshold, lower embodied carbon, and full alignment with the King's Cross masterplan's established grain of tall slim buildings on a fine-grained public realm (the Granary Building, R7, R8, the Gasholders apartments). The case is strong, and we believe it will be won, but it is a real piece of work that introduces programme risk.</p>
                <p>Indicatively, that risk costs <strong>9–15 months</strong> of additional design and consenting time at the front of the programme, compared with a Path A application that would move more directly through the King's Cross DRP route. The construction time saving and the cost / carbon savings of Path B compound during build, but the planning time has to be paid up front.</p>
                <p><em>This is not a hidden issue. It is the trade-off the four questions implicitly resolve. We recommend Path B, openly, knowing the cost, because the architectural and sustainability gain is, in our view, materially better than the alternative.</em> The decision is the panel's.</p>
          </>}
        />
      ),
    },
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §13 RECOMMENDED SCHEME (5 pages)
// ════════════════════════════════════════════════════════════════════════
const cgis = [
  { fn: "cgi-01-canal-view.jpg", t: "From the opposite towpath",
    pres: "Dark brick mass rising from the towpath, signal house to one flank, Bagley Walk behind",
    body: <p>The public reading of the building. The dark engineering brick mass rises from the towpath as a continuation of the Bagley Walk wall. The signal house in bright perforated aluminium is visible to one flank, the contemporary contrast, the distinctive silhouette on the King's Cross skyline.</p> },
  { fn: "cgi-02-approach.jpg", t: "Arrival from Goods Way",
    pres: "Gable end revealing the relationship between brick mass and offset signal house",
    body: <p>From the pedestrian approach, the building announces itself as a piece of engineered brick infrastructure. The gable end reveals the relationship between the brick mass and the offset signal house. The stippling and carved brick signage at the base register at close range.</p> },
  { fn: "cgi-03-context.jpg", t: "Within the King's Cross context",
    pres: "Gasholders, Coal Drops Yard, the Granary completing the architectural company",
    body: <p>The wider view places the building among its neighbours. The Gasholders apartments to the north-west, with their perforated metal screens, are the closest contemporary cousins to our signal house. Coal Drops Yard and the Granary beyond complete the architectural company.</p> },
  { fn: "cgi-04-interior.jpg", t: "Interior, eccentric core",
    pres: "Single coherent open volume with daylight from three sides",
    body: <p>The view from inside the lettable space demonstrates the architectural consequence of the eccentric core arrangement. The plate reads as a single coherent open volume. Daylight reaches across the floor from three sides. The canal is visible across the full canal-facing elevation.</p> },
];

const S10 = sectionPages(
  { sectionNum: 13, sectionTitle: "The Recommended Scheme", sectionLabel: "Recommended Scheme" },
  [
    {
      label: "What the building is (act break)",
      isDivider: true,
      presentation: () => <Divider range="§§ 13–14" title="What the building is." sub="The recommended scheme, visualised, materialised." />,
      report: () => <Divider range="§§ 13–14" title="What the building is." sub="The recommended scheme, visualised, materialised." />,
    },
    ...cgis.map((c, i) => ({
      label: `${c.t} (A vs B)`,
      presentation: () => (
        <div className="cgi-compare">
          <div className="cgi-compare__head">
            <Eyebrow>§21 · View {i+1} of 4</Eyebrow>
            <h2 className="h-sub">{c.t}</h2>
          </div>
          <div className="cgi-compare__cols">
            <div className="cgi-compare__col">
              <div className="cgi-compare__media">
                <Placeholder filename={c.fn.replace(".jpg", "-A.jpg")} caption={`${c.pres}. Scheme A (G+7 cantilevered)`} variant="CGI" number="A" />
              </div>
              <div className="cgi-compare__lbl mono">
                <span className="cgi-compare__tag">Scheme A</span>
                <span>G+7 cantilevered · 6,000 sqft plates</span>
              </div>
            </div>
            <div className="cgi-compare__col cgi-compare__col--pick">
              <div className="cgi-compare__media">
                <Placeholder filename={c.fn} caption={`${c.pres}. Scheme B (G+8/9 simple extrusion)`} variant="CGI" number="B" />
              </div>
              <div className="cgi-compare__lbl mono">
                <span className="cgi-compare__tag cgi-compare__tag--pick">Scheme B · our preferred</span>
                <span>G+8/9 simple extrusion · 5,000 sqft plates</span>
              </div>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="cgi-compare">
          <div className="cgi-compare__head">
            <Eyebrow>§21 · View {i+1} of 4</Eyebrow>
            <h2 className="h-sub">{c.t}</h2>
            <div className="prose tight" style={{maxWidth: '78ch', marginTop: 4}}>{c.body}</div>
          </div>
          <div className="cgi-compare__cols">
            <div className="cgi-compare__col">
              <div className="cgi-compare__media">
                <Placeholder filename={c.fn.replace(".jpg", "-A.jpg")} caption={`${c.pres}. Scheme A (G+7 cantilevered)`} variant="CGI" number="A" />
              </div>
              <div className="cgi-compare__lbl mono">
                <span className="cgi-compare__tag">Scheme A</span>
                <span>G+7 cantilevered · 6,000 sqft plates</span>
              </div>
            </div>
            <div className="cgi-compare__col cgi-compare__col--pick">
              <div className="cgi-compare__media">
                <Placeholder filename={c.fn} caption={`${c.pres}. Scheme B (G+8/9 simple extrusion)`} variant="CGI" number="B" />
              </div>
              <div className="cgi-compare__lbl mono">
                <span className="cgi-compare__tag cgi-compare__tag--pick">Scheme B · our preferred</span>
                <span>G+8/9 simple extrusion · 5,000 sqft plates</span>
              </div>
            </div>
          </div>
        </div>
      ),
    })),
    {
      label: "Our preferred, at scale",
      presentation: () => (
        <PresCover
          filename="cgi-hero-preferred.jpg"
          caption="The preferred scheme. G+8/9 simple extrusion with offset signal house, final hero view"
          overlay={
            <>
              <span className="mono" style={{color: 'var(--accent)', letterSpacing: '0.22em', fontWeight: 500}}>Our preferred</span>
              <h2 className="h-sub" style={{fontSize: 24, maxWidth: '20ch', margin: 0, lineHeight: 1.2}}>G+8/9. Simple extrusion. Offset signal house.</h2>
              <span className="mono" style={{fontSize: 11, color: 'var(--fg-soft)'}}>The Crossing</span>
            </>
          }
        />
      ),
      report: () => (
        <ReportImageText
          filename="cgi-hero-preferred.jpg"
          caption="The preferred scheme at scale"
          variant="CGI"
          number="hero"
          capIdx="Hero view"
          capTitle="The preferred scheme, at scale."
          kicker="§21 · Preferred scheme"
          title="G+8/9 simple extrusion with offset signal house."
          body={<>
            <p>The hero view of the preferred scheme. The dark engineering brick mass rises from the towpath as a continuation of Bagley Walk; the lightweight aluminium signal house sits offset to one flank, marking the crossing. The four questions on the previous pages tune the variant; the building shown here is what BBBB looks like.</p>
            <p><strong>This is the building we believe in, but openly, awaiting your steer on the four questions.</strong></p>
          </>}
        />
      ),
    },
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §14 MATERIALS (6 pages)
// ════════════════════════════════════════════════════════════════════════
// §13 Materials section removed. Its content (brick + aluminium) lives in
// §12 Q5 Materials (Heavy / Light), which carries the cost + carbon
// alternatives drawn from the calculator's HEAVY / LIGHT lookups.
// The signage spread ("The building speaks twice") relocated to §10 Signal Box.

// ════════════════════════════════════════════════════════════════════════
// §14 SUSTAINABILITY (2 pages)
// ════════════════════════════════════════════════════════════════════════
const carbonChart = (
  <div style={{background: 'var(--bg-soft)', border: '1px solid var(--rule-soft)', padding: 28}}>
    <div className="mono" style={{fontSize: 11, marginBottom: 16, color: 'var(--fg-soft)'}}>
      Embodied carbon · structure + facade · kgCO2e / m² GIA
    </div>
    <div className="bars">
      {[
        { lbl: "Path B, recommended", val: 435, range: "380–490", accent: true },
        { lbl: "Path A, cantilevered", val: 650, range: "580–720" },
        { lbl: "Conventional baseline", val: 835, range: "720–950" },
      ].map((r, i) => (
        <div className="bars__row" key={i}>
          <div className="lbl">{r.lbl}</div>
          <div className={`bars__bar ${r.accent ? 'bars__bar--accent' : ''}`}>
            <span style={{width: `${(r.val/1000)*100}%`}}></span>
          </div>
          <div className="num">{r.range}</div>
        </div>
      ))}
    </div>
    <div className="bars__targets">
      <div className="bars__target" style={{left: `${35}%`}}>LETI 2030 · 350</div>
      <div className="bars__target" style={{left: `${50}%`}}>RIBA 2030 · ~500</div>
    </div>
    <div className="cap" style={{marginTop: 16}}>
      <b>Fig. 12.1</b>Bars: midpoint of range. Targets: industry 2030 benchmarks.
    </div>
  </div>
);

const S12 = sectionPages(
  { sectionNum: 17, sectionTitle: "Sustainability", sectionLabel: "Sustainability" },
  [
    {
      label: "Carbon comparison",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§21 · Carbon</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 14}}>30–45% below baseline.</h2>
          {carbonChart}
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§21 · Embodied carbon</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 8}}>30–45% below conventional baseline.</h2>
          <div className="prose tight" style={{maxWidth: '78ch'}}>
            <p>Steel and CLT structure, brick facade, and recycled aluminium signal house deliver ~380–490 kgCO2e/m² GIA. Conventional baseline (RC + curtain wall) is 720–950. Strong performance against LETI 2030 and RIBA 2030 targets at the design-side level.</p>
          </div>
          <div style={{marginTop: 14}}>{carbonChart}</div>
        </div>
      ),
    },
    {
      label: "Whole-life + recoverability",
      presentation: () => (
        <PresStatement
          kicker="§21 · Whole-life carbon"
          title="No part of the facade is intended for replacement."
          body={<>
            <p>Engineering brick, 100–150+ years.<br/>Steel and CLT, 100+ years.<br/>Recycled aluminium, 80+ years, infinitely recyclable.</p>
            <p><em>The building is, in principle, fully recoverable at end of life.</em></p>
          </>}
        />
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§21 · Whole-life carbon</Eyebrow>
          <h2 className="h-sub" style={{marginBottom: 12}}>No part of the facade is intended for replacement within the building's design life.</h2>
          <div className="two-col">
            <div className="prose tight">
              <p><strong>Whole-life carbon.</strong> Engineering brick: 100–150+ years. Steel and CLT: 100+ years with end-of-life recovery. Recycled aluminium: 80+ years with infinite recyclability.</p>
              <p>The whole-life position is significantly stronger than schemes that anticipate facade replacement every 30–40 years.</p>
            </div>
            <div className="prose tight">
              <p><strong>End-of-life recoverability.</strong> Lime mortar pointing ensures brick can be recovered and reused. Aluminium is fully recyclable. CLT can be reused or biomass-recovered. Steel is recyclable at 90%+ recovery rates.</p>
              <p><em>The structural and material decisions reinforce each other.</em></p>
            </div>
          </div>
        </div>
      ),
    },
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §15 VIABILITY & THE OFFER (13 pages, area first, then opportunity, then images)
// No numbers / costings here; the calculator (topbar button) handles those
// quantitatively. This section is qualitative, what the area question
// produces architecturally.
// ════════════════════════════════════════════════════════════════════════

const planComparisons = [
  {
    type: "Ground floor",
    planA: {
      fn: "plan-gf-A.jpg",
      cap: "G+7 ground, larger footprint, central core, basement plant below",
      areas: [
        ["Footprint", "~700 m²"],
        ["Cafe + threshold", "~110 m²"],
        ["Lobby + central core", "~140 m²"],
        ["Tenant entrance", "~60 m²"],
        ["BoH + circulation", "~80 m²"],
        ["Public route", "~50 m²"],
      ],
    },
    planB: {
      fn: "plan-gf-B.jpg",
      cap: "G+8/9 ground, smaller footprint, eccentric core, generous 6 m clear height",
      areas: [
        ["Footprint", "~550 m²"],
        ["Cafe + threshold", "~150 m²"],
        ["Lobby + eccentric core", "~95 m²"],
        ["1820 entrance + public lift", "~35 m²"],
        ["BoH + circulation", "~70 m²"],
        ["Public route", "~80 m²"],
      ],
    },
  },
  {
    type: "Typical floor",
    planA: {
      fn: "plan-typ-A.jpg",
      cap: "G+7 typical, larger plate via cantilever, central core",
      areas: [
        ["GIA per floor", "~620 m²"],
        ["NIA per floor", "~540 m²"],
        ["Core (central)", "~80 m²"],
        ["Tenants per floor", "1 or 2 (splittable)"],
        ["Daylight", "2 sides"],
      ],
    },
    planB: {
      fn: "plan-typ-B.jpg",
      cap: "G+8/9 typical, smaller plate, eccentric core, three-sided daylight",
      areas: [
        ["GIA per floor", "~510 m²"],
        ["NIA per floor", "~460 m²"],
        ["Core (eccentric)", "~50 m²"],
        ["Tenants per floor", "1 (whole-floor)"],
        ["Daylight", "3 sides"],
      ],
    },
  },
  {
    type: "Roof / 1820",
    planA: {
      fn: "plan-roof-A.jpg",
      cap: "G+7 roof, private 1820 amenity, tenant-only",
      areas: [
        ["1820 room area", "~80 m²"],
        ["Private terrace", "~140 m²"],
        ["Mech / plant", "~120 m²"],
        ["Lift", "1 (tenant only)"],
        ["Use", "Tenant amenity"],
      ],
    },
    planB: {
      fn: "plan-roof-B.jpg",
      cap: "G+8/9 roof, public 1820 belvedere, civic gift",
      areas: [
        ["1820 room area", "~80 m²"],
        ["Public terrace", "~140 m²"],
        ["Mech / plant", "~80 m²"],
        ["Lift", "2 (1 public, 1 tenant)"],
        ["Use", "Free public roof"],
      ],
    },
  },
];

function PlanComparePage({ idx, total, comp }) {
  return (
    <div className="plan-compare">
      <div className="plan-compare__head">
        <Eyebrow>§21 · Plans · {idx} of {total}</Eyebrow>
        <h2 className="h-sub">{comp.type}.</h2>
      </div>
      <div className="plan-compare__cols">
        <div className="plan-compare__col">
          <div className="plan-compare__media">
            <Placeholder filename={comp.planA.fn} caption={comp.planA.cap} variant="diagram" number="A" />
          </div>
          <div className="plan-compare__caption">
            <div className="col-eyebrow">Scheme A · G+7 · central core</div>
            <ul className="plan-compare__areas mono">
              {comp.planA.areas.map(([k, v], i) => (
                <li key={i}><span>{k}</span><span>{v}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="plan-compare__col plan-compare__col--pick">
          <div className="plan-compare__media">
            <Placeholder filename={comp.planB.fn} caption={comp.planB.cap} variant="diagram" number="B" />
          </div>
          <div className="plan-compare__caption">
            <div className="col-eyebrow accent">Scheme B · G+8/9 · eccentric core · preferred</div>
            <ul className="plan-compare__areas mono">
              {comp.planB.areas.map(([k, v], i) => (
                <li key={i}><span>{k}</span><span>{v}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const scheduleA = {
  scheme: "Scheme A. G+7 cantilevered · central core",
  rows: [
    { level: "Roof / 1820",  gia: 340, nia:  80, note: "Tenant-only amenity + plant" },
    { level: "L7",           gia: 620, nia: 540, note: "Central core · 2 tenants possible" },
    { level: "L6",           gia: 620, nia: 540, note: "" },
    { level: "L5",           gia: 620, nia: 540, note: "" },
    { level: "L4",           gia: 620, nia: 540, note: "" },
    { level: "L3",           gia: 620, nia: 540, note: "" },
    { level: "L2",           gia: 620, nia: 540, note: "" },
    { level: "L1",           gia: 620, nia: 540, note: "" },
    { level: "Ground",       gia: 700, nia: 220, note: "Cafe, lobby, BoH, public route" },
    { level: "Basement",     gia: 480, nia:   0, note: "Plant, MEP, storage" },
  ],
};
const scheduleB = {
  scheme: "Signal Box Scheme",
  rows: [
    { level: "1820 belvedere", gia: 300, nia:  80, note: "Public roof · 1820 room + free terrace" },
    { level: "L9",             gia: 510, nia: 460, note: "Eccentric core · whole-floor letting" },
    { level: "L8",             gia: 510, nia: 460, note: "" },
    { level: "L7",             gia: 510, nia: 460, note: "" },
    { level: "L6",             gia: 510, nia: 460, note: "" },
    { level: "L5",             gia: 510, nia: 460, note: "" },
    { level: "L4",             gia: 510, nia: 460, note: "" },
    { level: "L3",             gia: 510, nia: 460, note: "" },
    { level: "L2",             gia: 510, nia: 460, note: "" },
    { level: "L1",             gia: 510, nia: 460, note: "" },
    { level: "Ground (6 m)",   gia: 550, nia: 200, note: "Cafe, lobby, public route, public 1820 entrance" },
    { level: "Mezz plant",     gia: 180, nia:   0, note: "Mech + MEP, no basement" },
  ],
};
[scheduleA, scheduleB].forEach(s => {
  s.totals = s.rows.reduce((a, r) => ({ gia: a.gia + r.gia, nia: a.nia + r.nia }), { gia: 0, nia: 0 });
});

function SchedulePage({ schedule, pickAccent }) {
  return (
    <div className="schedule">
      <div className="schedule__head">
        <Eyebrow>§21 · Area schedule</Eyebrow>
        <h2 className="h-sub">{schedule.scheme}</h2>
        <div className="prose tight" style={{maxWidth: '78ch', marginTop: 2}}>
          Indicative, to be plugged into the calculator once finalised.
        </div>
      </div>
      <table className={"schedule__table" + (pickAccent ? " schedule__table--pick" : "")}>
        <thead>
          <tr>
            <th>Level</th>
            <th>GIA (m²)</th>
            <th>NIA (m²)</th>
            <th>NIA : GIA</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {schedule.rows.map((r, i) => {
            const eff = r.nia && r.gia ? Math.round((r.nia / r.gia) * 100) + "%" : ", ";
            return (
              <tr key={i}>
                <th>{r.level}</th>
                <td>{r.gia.toLocaleString()}</td>
                <td>{r.nia ? r.nia.toLocaleString() : ", "}</td>
                <td>{eff}</td>
                <td>{r.note || ""}</td>
              </tr>
            );
          })}
          <tr className="schedule__total">
            <th>Total</th>
            <td>{schedule.totals.gia.toLocaleString()}</td>
            <td>{schedule.totals.nia.toLocaleString()}</td>
            <td>{Math.round((schedule.totals.nia / schedule.totals.gia) * 100)}%</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const opportunityPillars = [
  ["The 5,000 sqft floor plate",
   "The boutique whole-floor segment King's Cross is structurally short of. Single coherent open volume, daylight from three sides, the canal across the full canal-facing elevation."],
  ["A generous 6 m ground floor",
   "Cafe opens to the towpath. Lobby reads as civic, not commercial. Double-height, daylight reaches deep into the plate. The most consequential single decision in the substructure tree."],
  ["A canal-side public threshold",
   "The building gives back to the city as much as it takes. A café, a route from Goods Way to the towpath, a place to dwell on the water. Not a tolerated commercial object, a contributor."],
  ["The 1820, a public roof",
   "King's Cross's first free public roof. A belvedere, a function room, a small civic gift. The whole point of marking the crossing is that the city can stand on it."],
];

// closingImages (4 offer pages, café / lobby / floor plate / 1820 belvedere)
// removed; the offer is summarised by the area schedule and the §15 Closing
// section. The image set lived here for §14 page-end.

const S13 = sectionPages(
  { sectionId: "viability", sectionNum: 21, sectionTitle: "The Crossing", sectionLabel: "The Crossing" },
  [
    {
      label: "The Crossing (act break)",
      isDivider: true,
      presentation: () => <Divider range="§21" title={<>The Crossing.</>} sub="The first mark on this site was the canal, 1820. The last mark is this building." />,
      report: () => <Divider range="§21" title={<>The Crossing.</>} sub="The first mark on this site was the canal, 1820. The last mark is this building." />,
    },
    {
      label: "Area is the question",
      presentation: () => (
        <PresStatement
          kicker="§21 · The question"
          title="On a small site, area is unforgiving."
          body={<>
            <p>The site is small. Every square metre has to earn itself.</p>
            <p>Each one costs the same to build. Each one that doesn't let earns nothing.</p>
            <p><em>So the first question is simple: <strong>how much usable area, and how efficient?</strong></em></p>
            <p className="mono" style={{fontSize: 12, letterSpacing: 0.04, color: 'var(--fg-dim)', marginTop: 12}}>
              Numbers on the calculator tab (top right). The pages that follow are the area story behind them.
            </p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§21 · The question"
          title="Area first. On a small site, inefficiency is unforgiving."
          body={<>
            <p>The site is tight, and tightly priced, both on the way in (cost per m² is roughly fixed) and on the way out (rent per m² is roughly fixed). Inefficiency compounds against you both ways. The first viability question, before cost, carbon, or programme, is therefore <strong>area</strong>: how much usable area does the scheme produce, and how efficiently is it produced.</p>
                <p>The pages that follow are the area story for both schemes, ground, typical, and roof plans side-by-side, with indicative areas annotated; then a per-scheme area schedule. The cost and carbon implications of these areas are quantified in the calculator (top-right of the toolbar), which can be re-run with these areas once finalised.</p>
          </>}
        />
      ),
    },
    {
      label: "The plan, hugging the boundary",
      presentation: () => (
        <PresImage
          filename="viability-plan-sketch.jpg"
          caption="Plan sketch, the building hugs the site boundary, no chamfers, no setbacks"
          variant="sketch"
          capIdx="The plan"
          capTitle="The plan hugs the site boundary."
          capMeta="No chamfers, no setbacks, area maximised by geometry alone."
        />
      ),
      report: () => (
        <ReportImageText
          filename="viability-plan-sketch.jpg"
          caption="Plan sketch, the building hugs the site boundary, no chamfers, no setbacks"
          variant="sketch"
          capIdx="Fig. 13.0"
          capTitle="The plan hugs the site boundary."
          kicker="§21 · The plan"
          title="The plan maximises area by simply hugging the boundary."
          body={<>
            <p>The plan does the simplest possible thing the site allows. <strong>It follows the site boundary edge-for-edge</strong>, no chamfers, no setbacks, no formal gestures that subtract usable floor area. The geometry alone earns the area; no architectural performance is asked of the plan itself.</p>
            <p>Discipline at the plan level lets every other choice in the building (the section, the structure, the signal house above) stay simple and legible. The boundary <em>is</em> the figure.</p>
          </>}
        />
      ),
    },
    {
      label: "The section, simple office, lightweight crown",
      presentation: () => (
        <PresImage
          filename="viability-section-sketch.jpg"
          caption="Section sketch, a simple office building below; a lightweight expression on the roof"
          variant="sketch"
          capIdx="The section"
          capTitle="A simple office. A lightweight crown."
          capMeta="The roof speaks to the city and to the crossing."
        />
      ),
      report: () => (
        <ReportImageText
          filename="viability-section-sketch.jpg"
          caption="Section sketch, a simple office building below; a lightweight expression on the roof"
          variant="sketch"
          capIdx="Fig. 13.1"
          capTitle="A simple office below, a lightweight crown above."
          kicker="§21 · The section"
          title="A simple office building, with a lightweight roof speaking to the city."
          body={<>
            <p>In section, the building is disciplined to two things. Below: <strong>a simple office building</strong>, clean stacked plates, regular grid, no transfer structure. Above: <strong>a lightweight expression on the roof</strong>, the signal-box volume that speaks to the city and to the crossing the building is named for.</p>
            <p>The poetry lives at the top. The plates below quietly earn their area. The two work because they are not asked to do each other's job.</p>
          </>}
        />
      ),
    },
    ...planComparisons.map((comp, i) => ({
      label: `${comp.type}. A vs B`,
      presentation: () => <PlanComparePage idx={i+1} total={planComparisons.length} comp={comp} />,
      report: () => <PlanComparePage idx={i+1} total={planComparisons.length} comp={comp} />,
    })),
    // Scheme A area schedule removed; only the Signal Box scheme is shown.
    {
      label: "Signal Box Scheme · area schedule",
      presentation: () => <SchedulePage schedule={scheduleB} pickAccent={true} />,
      report: () => <SchedulePage schedule={scheduleB} pickAccent={true} />,
    },
    // "The opportunity at 1820" page removed, content folded into the Urban
    // page below (tenant / building / city) to avoid duplication.
    // The four "offer" pages (café / lobby / floor plate / 1820 belvedere) removed.
    // ─────────────────────────────────────────────────────────────────────
    //  THE FINALE, sustainable / efficient / urban / poetic, then the
    //  image crescendo. The first mark on this site was the canal, 1820;
    //  the final mark is the 1820 lookout standing over the crossing.
    // ─────────────────────────────────────────────────────────────────────
    {
      label: "Sustainable",
      presentation: () => (
        <PresStatement
          kicker="§21 · Sustainable"
          title="The Crossing is sustainable by design."
          body={<>
            <p>Not bolted on. Built in.</p>
            <p>Steel and CLT structure. Recycled aluminium signal house. No basement.<br/>Brick to the canal. Brick to last.</p>
            <p className="mono" style={{fontSize: 13, letterSpacing: '0.04em', color: 'var(--fg-soft)', marginTop: 8}}>
              ~380–490 kgCO₂e/m² GIA &nbsp;·&nbsp; vs 720–950 conventional &nbsp;·&nbsp; LETI 2030 territory
            </p>
            <p><em>Sustainability is not an addition. It is the form.</em></p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§21 · Sustainable · The Crossing"
          title="The Crossing is sustainable because of its discipline, not in spite of it."
          body={<>
            <p>The building does not add sustainability to itself. It is sustainable because the design moves it makes are the right ones for <em>this site</em>. The slender extrusion avoids the transfer structure a cantilever would require above the Northern, Piccadilly, Victoria and Thameslink lines below. The absence of a basement removes the carbon-heaviest single line of the build, and respects the loading caps and the proximity of the canal wall. The brick is the same family that built King's Cross, with a design life over a hundred years. The signal house above is recycled aluminium. Hydro CIRCAL 75R, 75% recycled, embodied carbon a fraction of primary aluminium.</p>
            <p>The numbers: ~<strong>380–490 kgCO₂e/m² GIA</strong> against a conventional baseline of 720–950. LETI 2030 territory and comfortably within RIBA 2030. Every primary material has a defined recovery route. Brick recoverable through lime mortar. Aluminium infinitely recyclable. CLT reusable or biomass-recoverable. Steel at over 90% recycled-content recovery.</p>
            <p>The first mark on this site was the canal, dug in 1820 for the working life of a city. The last mark is a building designed not to need replacing in our lifetime. <em>The Crossing is sustainable because of the way it sits on this site, not because we added sustainability to it.</em></p>
          </>}
        />
      ),
    },
    {
      label: "Efficient",
      presentation: () => (
        <PresStatement
          kicker="§21 · Efficient"
          title="The Crossing is efficient because of its plan."
          body={<>
            <p>The plan hugs the site boundary. No chamfers. No setbacks.</p>
            <p>A simple extrusion above. No transfer structure.<br/>An eccentric core. One coherent plate, daylight three sides.</p>
            <p className="mono" style={{fontSize: 13, letterSpacing: '0.04em', color: 'var(--fg-soft)', marginTop: 8}}>
              Quantified in the calculator (top of toolbar) &nbsp;·&nbsp; ±10% sensitivity at RIBA Stage 2
            </p>
            <p><em>Discipline at the plan. The rest follows.</em></p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§21 · Efficient · The Crossing"
          title="The Crossing earns its area through discipline, not architectural performance."
          body={<>
            <p>On a tight site, every square metre has to work twice. Once on the way in: each square metre costs roughly the same to build. Once on the way out: each square metre that does not let earns nothing for the life of the building. The plan is the first thing to get right, and on this scheme the plan does the simplest possible thing, it follows the site boundary edge for edge, no chamfers, no formal gestures that subtract usable area. The boundary <em>is</em> the figure.</p>
            <p>Above the plan, the section is a simple stacked extrusion. No transfer structure, no cantilever below the signal house. The eccentric core produces a single coherent floor plate without service breaks on the perimeter, daylight from three sides, the canal visible across the full canal elevation. The no-basement substructure removes the carbon-heaviest single line of the build and the longest item on the programme. The interactive calculator at the top of the toolbar quantifies the consequence of each of these moves, with a ±10% sensitivity band reflecting RIBA Stage 2 typical uncertainty.</p>
            <p>The efficiency is not a value-engineering compromise. <em>It is the design.</em></p>
          </>}
        />
      ),
    },
    {
      label: "Urban",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§21 · Urban</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 4}}>The Crossing gives back to the city.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 12}}>
            Not a tolerated object. A contributor. In three layers.
          </div>
          <ol className="numlist">
            <li className="numlist__item">
              <span className="numlist__num">01</span>
              <div>
                <div className="numlist__title">To the tenant</div>
                <div className="numlist__desc">A 5,000 sqft whole-floor plate. The boutique segment King's Cross is structurally short of. Daylight three sides. The canal across the full elevation.</div>
              </div>
            </li>
            <li className="numlist__item">
              <span className="numlist__num">02</span>
              <div>
                <div className="numlist__title">To the building</div>
                <div className="numlist__desc">The 1820 belvedere. The date of the canal, written into the address. The marker the building takes its name from.</div>
              </div>
            </li>
            <li className="numlist__item">
              <span className="numlist__num">03</span>
              <div>
                <div className="numlist__title">To the city</div>
                <div className="numlist__desc">A café opens to the towpath. A 6 m ground floor reads as civic, not commercial. A route from Goods Way to the water. And above it all, King's Cross's first free public roof, a lookout from which the crossing of the canal of 1820 and the railway of 1852 can be read in one view.</div>
              </div>
            </li>
          </ol>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§21 · Urban · The Crossing</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 8}}>The Crossing gives back to the city it stands in.</h2>
          <div className="prose" style={{maxWidth: '78ch', marginBottom: 8}}>
            <p>A building on this site can either occupy King's Cross or contribute to it. The Crossing is built around the second. The case is made in three ascending layers, what the building gives the tenant, what it gives itself, and what it gives the city, and the three layers reinforce each other rather than compete. <em>Not a tolerated commercial object. A contributor.</em></p>
          </div>
          <ol className="numlist">
            <li className="numlist__item">
              <span className="numlist__num">01</span>
              <div>
                <div className="numlist__title">To the tenant</div>
                <div className="numlist__desc">The 5,000 sqft whole-floor plate is the boutique segment King's Cross is structurally short of. A single coherent open volume, daylight from three sides, the canal visible across the full canal-facing elevation. Premium per-sqft rent and a narrower but more loyal tenant pool.</div>
              </div>
            </li>
            <li className="numlist__item">
              <span className="numlist__num">02</span>
              <div>
                <div className="numlist__title">To the building</div>
                <div className="numlist__desc">The 1820 belvedere is the building's moniker. The date the canal opened, written into the address itself. Address quality, rental tone, and planning hook all earned by a single small object at the top. Place premium £5–15/sqft = £225–675k p.a. of additional rent, capex recovered inside ten years, on London Plan D9(D) precedents.</div>
              </div>
            </li>
            <li className="numlist__item">
              <span className="numlist__num">03</span>
              <div>
                <div className="numlist__title">To the city</div>
                <div className="numlist__desc">At canal level, a café opens to the towpath and a 6 m double-height ground floor reads as civic, not commercial, a public threshold rather than a corporate lobby. A direct route from Goods Way to the water passes through the building. Above, the 1820 belvedere is King's Cross's first free public roof, the lookout the masterplan once had on loan from Felice Varini's "Across the Buildings" (RELAY, 2007), now made permanent. A marker from which the crossing of the canal of 1820 and the railway of 1852 can be read in a single view. The small civic gift that turns a regeneration into a place.</div>
              </div>
            </li>
          </ol>
        </div>
      ),
    },
    {
      label: "Poetic",
      presentation: () => (
        <PresStatement
          kicker="§21 · Poetic"
          title="The Crossing comes full circle."
          body={<>
            <p>The first mark on this site was the canal. 1820.</p>
            <p>The building is named for it.</p>
            <p>The brick at canal level says <strong>where you are</strong>: The Crossing.<br/>The aluminium at the skyline says <strong>why the building is here</strong>: the crossing.</p>
            <p><em>The last mark on the crossing the water made.</em></p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§21 · Poetic · The Crossing"
          title="The last mark on the crossing the water made."
          body={<>
            <p>Every layer of this site has been a mark on a crossing. Battle Bridge over the River Fleet was the first. The canal, cut in 1820, gave the place its shape, its industry, and its name. The railway came in 1852 and crossed the canal in turn. The goods yard followed, then the lights going out, then the clubs and the long quiet, then Argent's masterplan and the slow re-knitting of the place. The Crossing is the last move on the last plot of that masterplan. The last mark.</p>
            <p>The building is named for the first mark. The brick at canal level carries <em>The Crossing</em>, recessed and carved into the engineering brick, read at arm's reach as you arrive on foot, the address as Victorian canal vocabulary. The aluminium at the skyline carries <em>the crossing</em>, perforated through the lightweight skin of the lookout, by day shadow and depth against bright metal, by night a soft lantern above the canal, legible from the bridges, the station, and Camley Street.</p>
            <p>Two voices. One says where you are. The other says why the building is here. They do not reconcile and they are not meant to. The building speaks twice because the site has spoken to it twice, first as the crossing the water made, then as the city that grew around the water. The Crossing carries both into one quiet object.</p>
            <p><em>A simple, contextual office building, with a public offering of space. The last mark on the crossing the water made.</em></p>
          </>}
        />
      ),
    },
    // ── IMAGE CRESCENDO, five views, building toward the climax ────────
    //    01 distant · 02 wider · 03 approach · 04 lantern · 05 from the 1820
    // Night CGI page removed, its overlay ("water came first / building
    // came last") restated the Poetic page on the previous slide, and the
    // atmospheric night view is now carried by the "At dusk, the lookout
    // lit" placeholder below.
    ...[
      { slug: "01", view: "From the opposite towpath.",                       sub: "The building seen from the canal that named it." },
      { slug: "02", view: "Within the King's Cross context.",                 sub: "Among the Gasholders, the Granary, Coal Drops Yard." },
      { slug: "03", view: "Arrival from Goods Way.",                          sub: "Brick at ground. The Crossing, carved into the wall." },
      { slug: "04", view: "At dusk, the lookout lit.",                        sub: "The Crossing, perforated through the aluminium." },
      { slug: "05", view: "From the 1820, the crossing, in every direction.", sub: "Standing on the building. The city, in eyeshot." },
    ].map((s, i) => ({
      label: `The Crossing · ${s.view}`,
      presentation: () => (
        <PresCover
          filename={`signal-box-final-${s.slug}.jpg`}
          caption={`The Crossing · ${s.view}`}
          overlay={
            <>
              <span className="mono" style={{color: 'var(--accent)', letterSpacing: '0.22em', fontWeight: 500}}>The Crossing</span>
              <span className="mono" style={{fontSize: 13, color: 'var(--fg)', letterSpacing: '0.02em', fontWeight: 500}}>{s.view}</span>
              <span className="mono" style={{fontSize: 11, color: 'var(--fg-soft)', letterSpacing: '0.04em'}}>{s.sub}</span>
            </>
          }
        />
      ),
      report: () => (
        <ReportImageText
          filename={`signal-box-final-${s.slug}.jpg`}
          caption={`The Crossing · ${s.view}`}
          variant="CGI"
          number={s.slug}
          capIdx={`Final · ${i+1} of 5`}
          capTitle={s.view}
          kicker={`§21 · The Crossing · final view ${i+1} of 5`}
          title={s.view}
          body={<p>{s.sub} Placeholder, drop a final CGI / hero render onto the slot to populate.</p>}
        />
      ),
    })),
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §16 WORKING WITH US (consolidated, open questions, next steps, practice)
// 2 pages: one outlines what's next + what's open; one is the practice CV.
// Positioned BEFORE the closing arc so the presentation doesn't fade out.
// ════════════════════════════════════════════════════════════════════════
const workingOpenList = (
  <ol className="numlist">
    {[
      ["Land cost & acquisition", "The commercial framework that determines what the site is worth."],
      ["Finance, rent, yield, tax", "The appraisal that converts the design proposition into a viable development."],
      ["Detailed planning strategy", "Formal Camden and King's Cross DRP route, not yet pursued."],
      ["Full viability appraisal", "QS appointment at RIBA Stage 2 and full cost plan."],
    ].map(([t, d], i) => (
      <li className="numlist__item" key={i}>
        <span className="numlist__num">{"abcd"[i]}</span>
        <div>
          <div className="numlist__title">{t}</div>
          <div className="numlist__desc">{d}</div>
        </div>
      </li>
    ))}
  </ol>
);

const workingNextSteps = (
  <ol className="numlist">
    {[
      ["Geotechnical desk study", "£15–25k · 4 weeks"],
      ["Pre-application engagement", "Camden + DRP + CRT"],
      ["Sample panel commissioning", "3m × 3m physical sample"],
      ["Cost plan at RIBA Stage 2", "Formal QS appointment"],
    ].map(([t, m], i) => (
      <li className="numlist__item" key={i}>
        <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
        <div>
          <div className="numlist__title">{t}</div>
          <div className="mono" style={{fontSize: 11, marginTop: 2, color: 'var(--fg-soft)'}}>{m}</div>
        </div>
      </li>
    ))}
  </ol>
);

const awards = (
  <ul className="awards">
    <li>British Homes Awards 2025, four trophies, dual Architect of the Year</li>
    <li>RIBA House of the Year, shortlisted three times</li>
    <li>Stephen Lawrence Prize, shortlisted three times</li>
    <li>BD Individual House Architect of the Year 2023</li>
  </ul>
);

const practiceWork = [
  ["practice-01.jpg", "Holland Park Gate, Kensington"],
  ["practice-02.jpg", "22 Handyside Street, King's Cross"],
  ["practice-03.jpg", "The Tannery, Bermondsey"],
  ["practice-04.jpg", "Rich Estate, Southwark"],
];

const S14 = sectionPages(
  { sectionNum: 16, sectionTitle: "Working with us", sectionLabel: "Working with us" },
  [
    {
      label: "Coffey Architects",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§12 · Practice</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 14}}>Coffey | Architects.</h2>
          <div className="two-col" style={{flex: 'none'}}>
            <div className="prose">
              <p>London-based practice, founded 2005. Residential, cultural, commercial.</p>
              <p>Led by <strong>Phil Coffey</strong> (design, client relationships) and <strong>Lee Marsden</strong> (delivery, operations).</p>
              <p>We approach every project from the position that the site comes first. On this project, that means <strong>the crossing.</strong></p>
            </div>
            <div>
              <div className="col-eyebrow">Recent recognition</div>
              {awards}
            </div>
          </div>
          <div style={{flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, minHeight: 0, marginTop: 12}}>
            {practiceWork.map(([fn, cap], i) => (
              <div key={i} style={{display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0}}>
                <div style={{flex: 1, position: 'relative', minHeight: 0, minWidth: 0, display: 'flex'}}>
                  <Placeholder filename={fn} caption={cap} variant="practice" number={String(i+1)} />
                </div>
                <div className="cap"><b>{`14.${i+1}`}</b>{cap}</div>
              </div>
            ))}
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§12 · Practice</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 10}}>Coffey | Architects.</h2>
          <div className="two-col">
            <div className="prose tight">
              <p>Coffey Architects is a London-based practice founded in 2005, working across residential, cultural, and commercial sectors. Led by Founding Director Phil Coffey alongside Lee Marsden, Director of Delivery and Operations.</p>
              <p>The practice has a portfolio of canal-side, infrastructure-adjacent and contextually sensitive projects across London. Holland Park Gate, 22 Handyside Street, The Tannery Bermondsey and Rich Estate among them.</p>
              <p>We approach every project from the position that the site comes first.</p>
            </div>
            <div>
              <div className="col-eyebrow">Recent recognition</div>
              {awards}
            </div>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 18}}>
            {practiceWork.map(([fn, cap], i) => (
              <div key={i} style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                <div style={{position: 'relative', minHeight: 0, minWidth: 0, display: 'flex', height: 180}}>
                  <Placeholder filename={fn} caption={cap} variant="practice" number={String(i+1)} />
                </div>
                <div className="cap"><b>{`14.${i+1}`}</b>{cap}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ]
);

// S15 (Closing/The Crossing) removed, content folded into S13 above.


// ════════════════════════════════════════════════════════════════════════
// §20 PARKING LOT (3 pages, pulled out earlier sections, kept for reference)
// ════════════════════════════════════════════════════════════════════════
const S18 = sectionPages(
  { sectionNum: 20, sectionTitle: "Parking lot", sectionLabel: "Parking" },
  [
    {
      label: "Six-moves diagram (parked)",
      presentation: () => (
        <PresImage
          filename="six-moves-diagram.jpg"
          caption="The single most important image of the pitch, to be hand-drawn"
          variant="diagram"
          capIdx="Fig. 6.0"
          capTitle="Six architectural moves, diagrammatic section."
          capMeta="Parked · originally §07"
        />
      ),
      report: () => (
        <ReportImageText
          filename="six-moves-diagram.jpg"
          caption="Six architectural moves diagram"
          variant="diagram"
          capIdx="Fig. 6.0"
          capTitle="Six architectural moves, diagrammatic section."
          kicker="§19 · Parked from §07 · Diagrammatic section"
          title="Six moves, located on the section."
          body={<>
            <p>Each move is the architectural consequence of the two principles. Together they make the building a contributor to King's Cross, not just an occupant of it.</p>
            <p>The diagram on the left locates each move within the section of the building, from the public colonnade at canal level to the shared signal house lookout at the top.</p>
          </>}
        />
      ),
    },
    {
      label: "Six moves enumerated (parked)",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§19 · Parked from §07 · Six moves</Eyebrow>
          <h2 className="h-sub" style={{marginBottom: 4}}>Each move follows from the two principles.</h2>
          <NumList />
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§19 · Parked from §07 · Six moves</Eyebrow>
          <h2 className="h-sub" style={{marginBottom: 4}}>What the building should be.</h2>
          <NumList />
        </div>
      ),
    },
    {
      label: "Strategy summary (parked)",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 980}}>
          <Eyebrow>§19 · Parked from §05 · Engineering</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 12}}>Lightweight steel and CLT.</h2>
          <div className="pres-copy">
            <p>Tube lines below. Loading caps apply.</p>
            <p>Canal wall cannot carry load.</p>
            <p>Core concentrated on the eastern edge.</p>
            <p><em>The architecture follows the engineering.</em></p>
          </div>
        </div>
      ),
      report: () => (
        <ReportProse
          kicker="§19 · Parked from §05 · Lightweight frame"
          title="Steel and CLT, the only realistic strategy."
          body={<>
            <ul>
              <li><strong>Weight</strong>, 40–50% lighter than reinforced concrete, within achievable loading envelope above tube structures.</li>
              <li><strong>Speed</strong>, 1.5–2 storeys/week, vs 1 storey/week for concrete; 12–16 week programme saving.</li>
              <li><strong>Embodied carbon</strong>, 280–350 kgCO2e/m² GIA structure, vs 500–650 for RC; CLT provides biogenic sequestration.</li>
              <li><strong>Acoustic + fire</strong>, modern CLT specifications meet all commercial office requirements with appropriate topping, sprinkler protection, and non-combustible cladding.</li>
            </ul>
            <p>This produces the <strong>eccentric core</strong> arrangement that defines the architectural plan, the lettable plate to the west is freed as a single coherent open volume.</p>
          </>}
        />
      ),
    },
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §06 A CONSIDERED INTERVENTION (60 pages), site photographs, sketched over
// ════════════════════════════════════════════════════════════════════════

// Small per-photo titles, sitting where "Title to follow" used to be.
// (19 and 46 are not in the deck.)
const INTERVENTION_TITLES = {
  1: "Beneath the bridge, beside the water.",
  2: "Towpath, boat, basin.",
  3: "Brick and terracotta, close up.",
  4: "The basin.",
  5: "The Gasholders frame.",
  6: "Trains over the boats.",
  7: "Boats moored beside the brick.",
  8: "Lawn at the canal edge.",
  9: "Towpath beneath the Gasholders.",
  10: "Boats moored at the basin.",
  11: "St Pancras Lock.",
  12: "Under the bridge at the wildlife trust.",
  13: "Arches beneath the rail.",
  14: "Brick warehouse, glass beyond.",
  15: "Towpath beside the warehouse.",
  16: "Towpath with the Frank Donkey.",
  17: "Iron bridge over the canal.",
  18: "Crowd on the grass beside the canal.",
  20: "Under the bridge, towards the basin.",
  21: "Towpath beside the canal.",
  22: "Word on the Water bookbarge.",
  23: "Floating art gallery.",
  24: "The canal opens out.",
  25: "Regent's Wharf, mirrored in the water.",
  26: "Regent's Wharf from the towpath.",
  27: "Towpath and apartments by the canal.",
  28: "Walking the towpath.",
  29: "A blue boat against the brick.",
  30: "Canal, brick wall, building beyond.",
  31: "Beneath the bridge, looking out.",
  32: "The canal bend.",
  33: "Market and boats on the towpath.",
  34: "The greenhouse boat.",
  35: "Path through the yard.",
  36: "The wildlife trust from the bridge.",
  37: "St Pancras Lock and the Gasholders.",
  38: "The brick tower.",
  39: "Across the bridge, looking back.",
  40: "Brick at the canal edge.",
  41: "Coal Drops Yard.",
  42: "Above the yard, looking back.",
  43: "The yard in summer.",
  44: "Beside the curving roofs.",
  45: "The curved brick at the yard.",
  47: "Granary Square in summer.",
  48: "Cobbled lane, brick and dark glass.",
  49: "Path between the buildings.",
  50: "Hedged path beside the buildings.",
  51: "Goods Way.",
  52: "Across the bridge to the buildings.",
  53: "Bridge view, the buildings beyond.",
  54: "Looking back to the station roofs.",
  55: "Goods Way, looking down.",
  56: "Boats moored, brickwork beyond.",
  57: "A floating garden, beside the buildings.",
  58: "The towpath in shade.",
  59: "Canal, looking toward the bridge.",
  60: "Boats and trees beneath the glass.",
};

// §06. Site Walk (was "A Considered Intervention" + standalone Site Walk;
// merged into a single section: title page + 58 site-walk photographs +
// the "What we learnt" closer). The Vision section (was §07) is gone.

// Closing beat of §06 Site Walk: a 5x2 grid of square axonometric
// "ideograms" — nine canal buildings (Granary, Gasholders, Coal Drops,
// Regent's Wharf etc) plus the tenth, the proposed building, highlighted
// as the family member we hope to be. Labels are best-guess where I'm
// confident, marked "to confirm" where Phil should sharpen them.
const CANAL_FAMILY = [
  { fn: "canal-family-01.png", label: "Coal Drops, curved warehouse", note: "King's Cross" },
  { fn: "canal-family-02.png", label: "Gasholder Park",                note: "King's Cross" },
  { fn: "canal-family-03.png", label: "Canal warehouses",              note: "to confirm" },
  { fn: "canal-family-04.png", label: "The Granary",                   note: "King's Cross" },
  { fn: "canal-family-05.png", label: "Handyside Street canopies",     note: "King's Cross" },
  { fn: "canal-family-06.png", label: "Pumping station",               note: "to confirm" },
  { fn: "canal-family-07.png", label: "King's Cross train shed",       note: "King's Cross" },
  { fn: "canal-family-08.png", label: "Regent's Wharf",                note: "Regent's Canal" },
  { fn: "canal-family-09.png", label: "Coal Drops Yard",               note: "King's Cross" },
  // The tenth tile hides the proposed building. A discreet italic question
  // mark stands in its place; the building itself is revealed at the close
  // of the deck. Keeps the family arc intact without giving away the design.
  { fn: null,                  label: "The Crossing",                  note: "revealed at the close.", proposed: true, mystery: true },
];

// Tile renderer for the ten canal-family ideograms. With mystery=true the
// image is replaced by a centred italic "?" in the deck's display serif.
function CanalFamilyTile({ it, imgHeight, showSub }) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
      <div style={{
        height: imgHeight,
        position: 'relative',
        overflow: 'hidden',
        background: it.proposed ? 'rgba(180, 96, 30, 0.04)' : '#ffffff',
        border: it.proposed ? '1px solid var(--accent)' : '1px solid var(--rule-soft)',
        display: it.mystery ? 'flex' : 'block',
        alignItems: it.mystery ? 'center' : undefined,
        justifyContent: it.mystery ? 'center' : undefined,
      }}>
        {it.mystery ? (
          <span style={{
            fontFamily: 'var(--ff-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: Math.round(imgHeight * 0.46),
            lineHeight: 1,
            color: 'var(--accent)',
            opacity: 0.78,
            userSelect: 'none',
            paddingBottom: Math.round(imgHeight * 0.05),
          }}>?</span>
        ) : (
          <Placeholder filename={it.fn} caption={it.label} variant="diagram" fill fitMode="contain" />
        )}
      </div>
      <div className="mono" style={{marginTop: 5, fontSize: 9.5, letterSpacing: 0.08, color: it.proposed ? 'var(--accent)' : 'var(--fg)', textTransform: 'uppercase', lineHeight: 1.25}}>{it.label}</div>
      {showSub ? <div className="mono" style={{fontSize: 8.5, color: 'var(--fg-dim)', letterSpacing: 0.04, lineHeight: 1.25}}>{it.note}</div> : null}
    </div>
  );
}

// OptionSummaryPage: shared layout for the Canopy and Signal Box summary
// pages. 5-column grid: title block top-left, watercolour + CGI on the
// top row, a wide plan filling the bottom-left (cols 1–4) with the model
// tucked into the bottom-right (col 5). The wide plan is the star: it
// reads as the building's logic at a glance.
//
// Images expected: [ watercolour, cgi, plan, model ] in that order.
function OptionSummaryPage({ eyebrow, title, strap, bullets, prose, images, mode }) {
  const [wc, cgi, plan, model] = images;
  const cap = (lbl) => `${title.replace('.', '')} · ${lbl}`;
  const Tile = ({ im, area }) => (
    <div style={{gridArea: area, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0}}>
      <div style={{flex: '1 1 0', minHeight: 0, position: 'relative', overflow: 'hidden'}}>
        <Placeholder filename={im.fn} caption={cap(im.label)} variant={im.variant} fill fitMode="cover" />
      </div>
      <div className="mono" style={{marginTop: 4, fontSize: 10, letterSpacing: 0.08, color: 'var(--accent)', textTransform: 'uppercase'}}>{im.label}</div>
    </div>
  );
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr 1fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gridTemplateAreas: `
        "title wc   wc   cgi  cgi"
        "plan  plan plan plan model"
      `,
      columnGap: 16,
      rowGap: 16,
      height: '100%',
      minHeight: 0,
    }}>
      <div style={{gridArea: 'title', display: 'flex', flexDirection: 'column', minWidth: 0, paddingTop: 2}}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="h-title" style={{marginTop: 16, marginBottom: 12, fontSize: 30, lineHeight: 1.05}}>{title}</h2>
        <div style={{fontSize: 13.5, color: 'var(--fg-soft)', lineHeight: 1.4, marginBottom: 14}}>{strap}</div>
        {mode === 'bullets' ? (
          <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12, color: 'var(--fg-soft)', lineHeight: 1.35}}>
            {bullets.map((b, i) => (
              <li key={i} style={{paddingLeft: 13, position: 'relative'}}>
                <span style={{position: 'absolute', left: 0, color: 'var(--accent)', fontWeight: 500}}>·</span>{b}
              </li>
            ))}
          </ul>
        ) : (
          <div className="prose tight" style={{fontSize: 12, color: 'var(--fg-soft)', lineHeight: 1.5}}>
            {prose.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        )}
      </div>
      <Tile im={wc}    area="wc" />
      <Tile im={cgi}   area="cgi" />
      <Tile im={plan}  area="plan" />
      <Tile im={model} area="model" />
    </div>
  );
}

// Presentation: bigger images, just the title + a one-line strap above and
// minimal labels beneath. No closing prose. Reads like page 18 in spirit.
function OfTheCanalPresentation() {
  return (
    <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
      <Eyebrow>Summary, Part I · Of the canal and the railway</Eyebrow>
      <h2 className="h-title" style={{marginBottom: 4}}>Of the canal… and the railway.</h2>
      <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)'}}>
        Simple. Pitched. The odd characterful moment.
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'auto auto', columnGap: 16, rowGap: 14, marginTop: 16}}>
        {CANAL_FAMILY.map((it, i) => <CanalFamilyTile key={i} it={it} imgHeight={228} showSub={false} />)}
      </div>
    </div>
  );
}

// Report: smaller images, full labels with the location sub-label, the
// explanatory closing paragraphs.
function OfTheCanalReport() {
  return (
    <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
      <Eyebrow>Summary, Part I · Of the canal and the railway</Eyebrow>
      <h2 className="h-title" style={{marginBottom: 4}}>Of the canal… and the railway.</h2>
      <div style={{maxWidth: '70ch', fontSize: 14, color: 'var(--fg-soft)', marginBottom: 14, lineHeight: 1.45}}>
        Simple. Pitched. The odd characterful moment. Nine buildings of the canal and the railway. A tenth to come.
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'auto auto', columnGap: 14, rowGap: 10, marginBottom: 14}}>
        {CANAL_FAMILY.map((it, i) => <CanalFamilyTile key={i} it={it} imgHeight={164} showSub={true} />)}
      </div>
      <div className="prose tight" style={{maxWidth: '82ch', fontSize: 13, lineHeight: 1.4}}>
        <p>Each is an ideogram. Brick, simple, pitched. Every now and then, one does something idiosyncratic: a chimney at the pumping station, a sawtooth at Handyside Street, a swoop at Coal Drops Yard, the lattice at the gasholders. Plain speech, from an age that built before it decorated.</p>
        <p>Our brief is to make a building of this lineage. Brick. Pitched. Simple. <strong>And one characterful moment of our own:</strong> the canopy at the foot, or the signal box at the top.</p>
      </div>
    </div>
  );
}

const SInter = sectionPages(
  { sectionId: "site-walk", sectionNum: 6, sectionTitle: "Site Walk", sectionLabel: "Site Walk" },
  [
    {
      label: "Site Walk (title)",
      isDivider: true,
      presentation: () => <Divider range="§06" title="Site Walk." sub="Reading the site, on foot." />,
      report:       () => <Divider range="§06" title="Site Walk." sub="Reading the site, on foot." />,
    },
    ...Array.from({ length: 60 }, (_, i) => i + 1)
      .filter((num) => num !== 19 && num !== 46)
      .map((num) => {
    const n = String(num).padStart(2, "0");
    const t = INTERVENTION_TITLES[num] || "";
    return {
      label: t || `Site walk ${n}`,
      presentation: () => (
        <PresImage
          filename={`intervention-${n}.jpg`}
          caption={`Site photograph ${n}, sketched over`}
          variant="photo"
          capIdx={`${n} / 60`}
          capMeta={t}
        />
      ),
      report: () => (
        <ReportImageText
          filename={`intervention-${n}.jpg`}
          caption={`Site photograph ${n}, sketched over`}
          variant="photo"
          capIdx={`${n} / 60`}
          kicker="§06 · Site Walk"
          title={t}
        />
      ),
    };
  }),
    // Closer, "What we learnt from the site walk". Reframed around the
    // two distinct experiences encountered on the walk: canal level
    // (intimate, short view) and the masterplan level above (civic,
    // long view). The brief that follows is to talk to both.
    // "Two walks. Two scales." and "Of the canal..." moved to SSummaryI
    // (Summary, Part I). §06 Site Walk now closes on the photographic walk
    // itself; the conclusions live in the new summary section.
  ]
);

// ═══════════════════════════════════════════════════════════════════════
// Summary, Part I. Sits between §06 Site Walk and Part II. Four pages:
// title divider, the two existing summary beats (relocated from §06), and
// a new "Don't fight the site." page that distils the constraint argument.
// Sentinel sectionNum (107) so the rail shows it as an un-numbered tick.
// Same pattern will repeat at the end of every Part.
// ═══════════════════════════════════════════════════════════════════════
const SSummaryI = sectionPages(
  { sectionId: "summary-i", sectionNum: 107, sectionTitle: "Summary, Part I", sectionLabel: "Summary, Part I" },
  [
    {
      label: "Summary, Part I (title)",
      isDivider: true,
      presentation: () => <Divider range="Summary, Part I" title="What we now know." sub="Four things." />,
      report:       () => <Divider range="Summary, Part I" title="What we now know." sub="Four things." />,
    },
    // (1) Two walks. Two scales — relocated from §06 Site Walk.
    {
      label: "Two walks, two scales",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Summary, Part I · Two walks</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>Two walks. Two scales.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 22}}>
            The canal life below, the masterplan life above. The building has to talk to both.
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 22}}>
            <div>
              <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10}}>At canal level · the intimate, short view</div>
              <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, lineHeight: 1.4}}>
                {[
                  <>The water, the boats, the towpath, the bridges.</>,
                  <>Eye-level. Touch-distance. The brick reads.</>,
                  <>A working, pedestrian scale.</>,
                ].map((t, i) => (
                  <li key={i} style={{paddingLeft: 16, position: 'relative'}}>
                    <span style={{position: 'absolute', left: 0, color: 'var(--accent)'}}>·</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10}}>At masterplan level · the civic, long view</div>
              <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, lineHeight: 1.4}}>
                {[
                  <>The crossing, King's Cross, the skyline.</>,
                  <>Read from the bridges, the towers, from afar.</>,
                  <>A civic, silhouette scale.</>,
                ].map((t, i) => (
                  <li key={i} style={{paddingLeft: 16, position: 'relative'}}>
                    <span style={{position: 'absolute', left: 0, color: 'var(--accent)'}}>·</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ol className="numlist">
            {[
              "The two walks are distinct experiences. Each has its own evidence.",
              "Connecting them, and talking to both, is the building's job.",
              "Material at canal level for touch; form at masterplan level for the silhouette.",
            ].map((t, i) => (
              <li className="numlist__item" key={i}>
                <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
                <div><div className="numlist__title">{t}</div></div>
              </li>
            ))}
          </ol>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Summary, Part I · Two walks</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 10}}>Two walks. Two scales.</h2>
          <div className="prose tight" style={{maxWidth: '78ch', marginBottom: 16}}>
            <p>The site walk gave us two distinct bodies of evidence. <strong>At canal level</strong>, the intimate scale: boats moving past, the towpath underfoot, the wall at arm's reach, the rhythm of brick. A working pedestrian scale. The building is read by surface, texture, doorway. <strong>At masterplan level</strong>, the civic scale: the crossing seen from the bridges, from the gasholders, from the towers across the masterplan. The building is read by its form, by its silhouette, by its presence on the skyline.</p>
            <p><em>The brief that follows is to talk to both. Connecting the two experiences is the building's job.</em></p>
          </div>
          <ol className="numlist">
            {[
              "The two walks are distinct experiences. Each has its own evidence and its own scale.",
              "Connecting them, and talking to both, is the building's job. The brief follows from this.",
              "Material at canal level for touch and texture; form at masterplan level for the silhouette.",
            ].map((t, i) => (
              <li className="numlist__item" key={i}>
                <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
                <div><div className="numlist__title">{t}</div></div>
              </li>
            ))}
          </ol>
        </div>
      ),
    },
    // (2) Of the canal... and the railway — relocated from §06.
    {
      label: "Of the canal and the railway",
      presentation: OfTheCanalPresentation,
      report:       OfTheCanalReport,
    },
    // (3) Don't fight the site — new third summary. The constraints + the
    //     urban move + the three-way public-space argument.
    {
      label: "Don't fight the site",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Summary, Part I · The site</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>Why fight the site?</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 22}}>
            Why would we? The site asks for the right move anyway.
          </div>
          <ol className="numlist">
            {[
              "Hard to build over tunnels below. View lines above. A diminishing footprint. Difficult to construct.",
              "Fighting it to create extra space at every level costs. Heavy cantilevers, transfers, structural gymnastics. Not good for viability.",
              "Taller. Slimmer. Less long. Public space at the ground. Opportunity up high to mark the crossing. Good for planning.",
              "A highly contextual building. Material, structure, ground, height, views. Every decision led by the site, not the architect.",
            ].map((t, i) => (
              <li className="numlist__item" key={i}>
                <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
                <div><div className="numlist__title">{t}</div></div>
              </li>
            ))}
          </ol>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Summary, Part I · The site</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 10}}>Why fight the site?</h2>
          <div className="prose tight" style={{maxWidth: '78ch'}}>
            <p>The site is hard to build over. The Piccadilly line runs beneath the western part of the plot. The Kenwood House view line caps the height at 73.2m AOD. The footprint is small and diminishing. The canal hard-edges the western boundary.</p>
            <p>We could fight it to win extra space at every level. Heavy cantilevers over the tunnels, transfer structures on the wrong line, structural gymnastics to coax area out of geometry that does not want to give it. Each of those moves costs, and on a site this tight the cost compounds against the viability.</p>
            <p><strong>Why would we?</strong> The constraints point at the move we want to make anyway. A taller, slimmer, less long building. Public space at the ground. An opportunity up high to mark the crossing on the silhouette.</p>
            <p>The public space works three ways. It gives the canal the room the towpath wants. It marks the fact that the rail lines run below where you cannot see them, by leaving the ground open above them. And it makes a place from which people can look up at a building that is allowed to be taller because the ground has been given back. The same logic plays to planning: a height that earns itself by giving the ground back. The urban argument and the planning argument are the same argument.</p>
            <p>On every project there are three things: the site, the architect, and the brief. On this site the architect has to step back. The layers, the constraints, the legacy are too rich for any other reading. Every decision the building makes, from the first massing move to the front door handle, follows from the site. Material, structure, ground, height, views. <strong>The building is contextual all the way through.</strong></p>
            <p><em>Why fight the site? Build the building the site is asking for.</em></p>
          </div>
        </div>
      ),
    },
    // (4) Mark the crossing. Don't obstruct it.
    //     Relocated from §10 The Building is too long? The closing urban
    //     thesis of Part I, paired with the same square sketch/image it
    //     used to carry. Half image, half text.
    {
      label: "Mark the crossing. Don't obstruct it.",
      presentation: () => (
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr', gap: 36, height: '100%', minHeight: 0, alignItems: 'stretch'}}>
          <div style={{display: 'flex', minHeight: 0, minWidth: 0}}>
            <Placeholder filename="too-long-square.jpg" caption="The crossing, square image (sketch, model, diagram or photo of the crossing)" variant="sketch" aspect="1/1" />
          </div>
          <div className="pc-stmt" style={{maxWidth: 'none', width: '100%', justifyContent: 'center'}}>
            <Eyebrow>Summary, Part I · The urban move</Eyebrow>
            <h2 className="h-title" style={{marginBottom: 12}}>Mark the crossing. Don't obstruct it.</h2>
            <div className="prose" style={{maxWidth: '46ch', fontSize: 16, color: 'var(--fg)', display: 'flex', flexDirection: 'column', gap: 10}}>
              <p>The site sits where the canal and railway cross. The building's job is to mark that crossing, not block it.</p>
              <p><em>An offering to the public and to the tenants — an experience of the city, and the value it brings to both.</em></p>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr', gap: 36, height: '100%', minHeight: 0, alignItems: 'stretch'}}>
          <div style={{display: 'flex', minHeight: 0, minWidth: 0}}>
            <Placeholder filename="too-long-square.jpg" caption="The crossing, square image (sketch, model, diagram or photo of the crossing)" variant="sketch" aspect="1/1" />
          </div>
          <div className="pc-stmt" style={{maxWidth: 'none', width: '100%', justifyContent: 'center'}}>
            <Eyebrow>Summary, Part I · The urban move</Eyebrow>
            <h2 className="h-title" style={{marginBottom: 10}}>Mark the crossing. Don't obstruct it.</h2>
            <div className="prose tight" style={{maxWidth: '52ch'}}>
              <p>The building sits at the point where the canal and the railway cross. A long volume that fills the plot risks obstructing that crossing rather than marking it. The brief, in design terms, is one of balance.</p>
              <p><em>An offering to the public and to the tenants — an experience of the city, and the value it brings to both.</em></p>
              <p>Two directions follow in Part II. Both mark the crossing. They differ in how they treat the space, and in where the offering sits.</p>
            </div>
          </div>
        </div>
      ),
    },
  ]
);

// ═══════════════════════════════════════════════════════════════════════
// Summary, Part II. Title divider plus three conclusions. Closes Part II
// (the design-testing and delivery-thinking part) before the rest of the
// existing Part II content is restructured. Same shape and sentinel-
// numbering pattern as SSummaryI.
//   (1) Build over the tracks? (buildability)
//   (2) A canopy space? (the ground move)
//   (3) The signal box does the work. (structure + height + meaning)
// The meta-argument ("Best for planning. Best for delivery.") sits in the
// title divider sub, not as a fourth conclusion page.
// ═══════════════════════════════════════════════════════════════════════
const SSummaryII = sectionPages(
  { sectionId: "summary-ii", sectionNum: 108, sectionTitle: "Summary, Part II", sectionLabel: "Summary, Part II" },
  [
    // (4) Current direction. Full-bleed model image of the chosen massing,
    //     with a small bottom-left label plate that lands the whole Part II
    //     argument in one paragraph, AND a matched A4-landscape image
    //     drop-zone in the bottom-right with its own small label above.
    //     Both bottom overlays sit at 320px wide so they read as a pair.
    (() => {
      const render = () => (
        <div className="pc-cover">
          <Placeholder filename="current-direction-model.jpg" caption="The chosen massing, model photo" variant="photo" fill />
          {/* bottom-left label plate (unchanged) */}
          <div className="pc-cover__overlay pc-cover__overlay--mini">
            <span className="mono" style={{color: 'var(--accent)', fontWeight: 500}}>Summary, Part II · Optimised direction</span>
            <h1 className="h-display" style={{fontSize: 24, lineHeight: 1.05, margin: 0}}>Optimised direction.</h1>
            <span style={{marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--rule-soft)', fontSize: 12, color: 'var(--fg)', fontWeight: 600, letterSpacing: 0.02}}>
              Maximum NIA achievable structurally on-site. <span style={{color: 'var(--accent)'}}>xxx m²</span>
            </span>
            <span className="mono" style={{fontSize: 10, color: 'var(--fg-soft)', letterSpacing: 0.06, lineHeight: 1.55}}>
              Maximum area, simplest construction. Compelling urbanistically. Height to give King's Cross a signal box. The ground given for public space with meaning. No temporary propping over the railway.
            </span>
          </div>
          {/* bottom-right: small label + A4 landscape image drop-zone */}
          <div style={{position: 'absolute', right: 36, bottom: 36, width: 320, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 8}}>
            <span className="mono" style={{color: 'var(--accent)', fontWeight: 500, fontSize: 10, letterSpacing: 0.16, textTransform: 'uppercase', background: 'var(--bg)', padding: '6px 10px', borderTop: '2px solid var(--accent)', alignSelf: 'flex-start'}}>1820 / 1852 · The crossing · Two elements with meaning</span>
            <div style={{width: 320, aspectRatio: '1.414', position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid var(--rule-soft)'}}>
              <Placeholder filename="current-direction-reference.jpg" caption="Reference image, drop here" variant="photo" fill fitMode="cover" />
            </div>
          </div>
        </div>
      );
      return {
        label: "Optimised direction",
        isDivider: true,
        presentation: render,
        report:       render,
      };
    })(),
    // Summary, Part II — was four pages (title divider + east + ground + top).
    // Condensed to a single page that lands the three claims in one read.
    // Current direction page that follows is the visual answer.
    {
      label: "Summary, Part II — Three things",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Summary, Part II</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>Three things.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 22}}>
            Best for planning. Best for delivery.
          </div>
          <ol className="numlist">
            {[
              { t: "Build to the east.",            s: "A simple extrusion off the tunnels. No long cantilevers, no transfer over live tracks, no temporary propping. Honest mass on ground that can carry it." },
              { t: "A canopy space, not a canopy.", s: "The ground is given as a place, not as a roof. A café opens to the canal and the towpath. The crossing is marked from above, not roofed from below." },
              { t: "The signal box does the work.", s: "Spreads load across the Piccadilly line and unlocks G+11. Cantilevers out to mark the canal. Structure, height and meaning, all reinforcing each other." },
            ].map((b, i) => (
              <li className="numlist__item" key={i}>
                <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
                <div>
                  <div className="numlist__title">{b.t}</div>
                  <div style={{fontSize: 14, color: 'var(--fg-soft)', lineHeight: 1.4, marginTop: 2}}>{b.s}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Summary, Part II</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 10}}>Three things. Best for planning, best for delivery.</h2>
          <div className="prose tight" style={{maxWidth: '78ch'}}>
            <p><strong>Build to the east.</strong> The Piccadilly line runs beneath the western part of the plot. Building over it requires cantilevers, transfer structures, and propping over live tracks, and the plan diminishes over the tunnels in any case. A simple extrusion east of the tunnels is honest mass on ground that can carry it, cleaner and easier to deliver.</p>
            <p><strong>A canopy space, not a canopy.</strong> The canopy survives as the experience, not as a roof. A café at the foot of the building opens to the canal and the towpath, the public ground given as a place rather than a shelter. The crossing is still marked, but from above.</p>
            <p><strong>The signal box does the work.</strong> The signal box spreads load across the Piccadilly line and unlocks <strong>G+11</strong>, just below the Kenwood House viewing corridor. It cantilevers out to mark the eastern end of the canal at King's Cross and hinges the building into the masterplan further east. The same move does the structure, gains the height, and delivers the meaning. <em>An honest, self-fulfilling argument.</em></p>
          </div>
        </div>
      ),
    },
    // "A pure extrusion" page moved to Part III (lives as its own section
    // SExtrusion after Sustainability). Summary, Part II returns to three
    // conclusions: east, ground, top.
    // "The main brick body of the building" page moved to Part III, sitting
    // as the second page of SExtrusion right after "A pure extrusion."
  ]
);

// ═══════════════════════════════════════════════════════════════════════
// NEW SEQUENCE (§08–§16), inserted between §07 Vision and the existing
// "Family options" section. These nine sections present the studio's
// process and the two preferred directions. Existing sections from
// "Family options" onwards retain their content but were renumbered +9.
// ═══════════════════════════════════════════════════════════════════════

// ── §08 Site Walk ───────────────────────────────────────────────────────
const SSiteWalk = sectionPages(
  { sectionNum: 8, sectionTitle: "Site Walk", sectionLabel: "Site Walk" },
  [
    {
      label: "Site Walk (title)",
      isDivider: true,
      presentation: () => <Divider range="§08" title="Site Walk." sub="Reading the site, on foot." />,
      report:       () => <Divider range="§08" title="Site Walk." sub="Reading the site, on foot." />,
    },
    {
      label: "What we learnt from the site walk",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§08 · Site Walk</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>What we learnt from the site walk.</h2>
          <ol className="numlist" style={{marginTop: 18}}>
            {[
              "The building sits alone. It is distinct.",
              "We see the building firstly as an artifact of the canal, not of the street.",
              "The canal life and boats can bring real activity to the ground plane.",
              "The building can act as a hinge, improving the canal to the east and the undercroft of the bridge.",
              "The top of the building is highly visible. It can be seen from far away.",
            ].map((t, i) => (
              <li className="numlist__item" key={i}>
                <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
                <div><div className="numlist__title">{t}</div></div>
              </li>
            ))}
          </ol>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§08 · Site Walk · What we learnt</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 8}}>What we learnt from the site walk.</h2>
          <div className="prose tight" style={{maxWidth: '78ch', marginBottom: 8}}>
            <p>Five observations from walking the site. Each shaped the brief we set ourselves; each shows up in the design moves on the pages that follow.</p>
          </div>
          <ol className="numlist">
            {[
              "The building sits alone. It is distinct.",
              "We see the building firstly as an artifact of the canal, not of the street.",
              "The canal life and boats can bring real activity to the ground plane.",
              "The building can act as a hinge, improving the canal to the east and the undercroft of the bridge.",
              "The top of the building is highly visible. It can be seen from far away.",
            ].map((t, i) => (
              <li className="numlist__item" key={i}>
                <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
                <div><div className="numlist__title">{t}</div></div>
              </li>
            ))}
          </ol>
        </div>
      ),
    },
  ]
);

// ── §09 The Challenge ───────────────────────────────────────────────────
const SChallenge = sectionPages(
  { sectionNum: 7, sectionTitle: "The Challenge", sectionLabel: "The Challenge" },
  [
    {
      label: "The Challenge (title)",
      isDivider: true,
      presentation: () => <Divider range="§07" title="The Challenge." sub="What this building is being asked to do." />,
      report:       () => <Divider range="§07" title="The Challenge." sub="What this building is being asked to do." />,
    },
    {
      label: "The Challenge, statement",
      presentation: () => (
        <PresStatement
          kicker="§07 · The Challenge"
          title="A boutique, simple, viable office. With meaning."
          body={<>
            <p>To make a boutique, simple, viable office building that has meaning. That brings joy to its tenants and to the public.</p>
            <p>On this important site, where the canal and railways cross.</p>
            <p><em>To honour a sensitive and important place.</em></p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§07 · The Challenge"
          title="A boutique, simple, viable office building with meaning."
          body={<>
            <p>The brief, in a single sentence: to make a boutique, simple, viable office building that has meaning and brings joy to its tenants and to the public, on this important site where the canal and railways cross. To honour a sensitive and important place.</p>
            <p>Every word in that sentence carries weight. <em>Boutique</em>, the segment the building is built for, where every square metre has to earn itself. <em>Simple</em>, discipline at the plan, no architectural gymnastics. <em>Viable</em>, the numbers have to work. <em>Meaning</em>, the building has to be more than a frame for rent. <em>Joy</em>, for the tenant inside, and the city outside. <em>Honour</em>, to a site that has been a working crossing since 1820, and a part of London's history far longer than that.</p>
          </>}
        />
      ),
    },
    // "Who is the tenant?" page moved to Part IV (see STenant) so the
    // commercial/lettable argument lives with the rest of the commercial
    // case, not inside The Challenge.
  ]
);

// ── Five Families (condensed) ───────────────────────────────────────────
//    Five conceptual families were tested. Two were taken further (Canopy,
//    Signal Box); three were set aside (Terrace, Carve, Roofline). Condensed
//    to two pages: the three set aside on one, the two taken further on the
//    next. Each family shows two landscape images (one model photo, one
//    sketch) with a short line of text beneath, refined once slides are set.
//    (The earlier per-family concept/3-model pages and the Felice Varini
//    precedent were removed here; the Varini lookout reference can be
//    reinstated in the Signal Box study section if wanted.)
const familiesPicked = [
  { slug: "canopy",     title: "Canopy.",     sub: "A low canopy that gives back to the canal.",
    model: "family-canopy-model-01.jpg",     sketch: "family-canopy-concept.jpg",
    bullets: [
      "Civic threshold at the ground. Gives the canal the room it wants.",
      "Industrial shed language. Of the canal, retold for the city now.",
      "Activates the ground. Seating, shelter, life under the canopy. One bay or three: open.",
      "The urban move sits at the ground. The crossing marked from below.",
    ],
    report: "Canopy lands the urban move at the ground. A low canopy threshold gives the canal back the space the towpath wants, a civic gesture at the foot. The language belongs here: shed, warehouse, retold for the city now. The canopy's length is still a question (one bay, two, or three), but the activation is the point: seating, shelter, life. The crossing marked from below."
  },
  { slug: "signal-box", title: "Signal Box.", sub: "A heavy body with a lightweight lookout above.",
    model: "family-signal-box-model-01.jpg", sketch: "family-signal-box-concept-photo.jpg",
    bullets: [
      "Marker on the skyline. The canal language, lifted into the silhouette.",
      "Smaller footprint. Taller, slimmer, less long. Asks less of the ground.",
      "Expressive room at the top. Seen from afar, in the long view.",
      "The urban move sits at the top. The crossing marked from above.",
    ],
    report: "Signal Box puts the urban move at the top. A heavy masonry body lifts an expressive room into the skyline, marking the crossing in the long view. The footprint is smaller, the building taller and slimmer and less long, so the ground can be given back. The language is still of the canal, lifted into the silhouette."
  },
];
const familiesSetAside = [
  { slug: "terrace",  title: "Terrace.",  sub: "Greenery stepping up and over the building.",
    model: "family-terrace-model-01.jpg",  sketch: "family-terrace-concept.jpg",
    bullets: [
      "Cantilever over the railway below. Hard to construct, needs temporary propping.",
      "Terracing cuts back the floor plate. Area lost on every terraced level.",
      "Terrace size out of proportion to office area. Generous outdoor, not enough office.",
    ],
    report: "Terraces look generous, but here they don't earn themselves. The cantilevers needed to push the plates out over the railway are hard to construct and need temporary propping. The terracing then cuts the plate back, so area is lost on every terraced level. The result: a lot of outdoor space, not enough office."
  },
  { slug: "carve",    title: "Carve.",    sub: "A distinctive cut into the elevation.",
    model: "family-carve-model-01.jpg",    sketch: "family-carve-concept.jpg",
    bullets: [
      "Too bulky for the canal. Wide, tall, oppressive at the towpath.",
      "Angled front reads more Singapore than Regent's Canal. Wrong language for the place.",
      "Cantilever limits height. Bulk at the foot costs us the freedom up top.",
    ],
    report: "At the scale this site needs, Carve is too bulky to belong to the canal. Wide, tall, oppressive at the towpath, far from the canal family. The angled front reads more Singapore than Regent's Canal, the wrong language for the place. And because the form cantilevers over the railway, the bulk we win at the foot costs us the freedom we want at the top."
  },
  { slug: "roofline", title: "Roofline.", sub: "Contextual pitched and gabled forms.",
    model: "family-roofline-model-01.jpg", sketch: "family-roofline-concept.jpg",
    bullets: [
      "Too complicated. Too many junctions. Too expensive to build.",
      "Cantilever plus stepping over the railway. Area lost twice.",
      "Reads more mill than canal. The verticality is interesting; the language is wrong.",
    ],
    report: "Roofline is the most complicated of the five, and that tells against it. Too many junctions, too expensive to build, especially with the cantilever required over the railway below. The stepping then costs area twice: at the cantilever, and at every stepped level. And the family is wrong: the pitched, gabled form reads more like a mill than a canal building."
  },
];

// One family fills the full column height of its grid cell. Title at top,
// model + sketch images flex to share the remaining space (so they get as
// large as the page allows), and the reason text sits at a fixed reserved
// block at the bottom so all three text blocks bottom-align across columns.
// Images stay ranged left and uncropped.
const FAMILY_TEXT_H = 92;
// FamilyUnit fills its grid cell. Bullets render when mode="bullets" and the
// family has a `bullets` array; otherwise the text block falls back to
// f.report (longer prose) → f.text → f.sub. `textHeight` reserves a
// fixed-height bottom block so columns bottom-align across the page.
function FamilyUnit({ f, mode = "prose", textHeight = FAMILY_TEXT_H }) {
  const name = f.title.replace('.', '');
  return (
    <div style={{display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%'}}>
      <div className="mono" style={{flex: '0 0 auto', fontSize: 11.5, letterSpacing: 0.14, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8}}>{name}</div>
      <div style={{flex: '1 1 0', minHeight: 0, position: 'relative', overflow: 'hidden', marginBottom: 8}}>
        <Placeholder filename={f.model} caption={`${name}, model photo`} variant="model" fill fitMode="contain" align="left" />
      </div>
      <div style={{flex: '1 1 0', minHeight: 0, position: 'relative', overflow: 'hidden', marginBottom: 10}}>
        <Placeholder filename={f.sketch} caption={`${name}, concept sketch`} variant="sketch" fill fitMode="contain" align="left" />
      </div>
      <div style={{flex: `0 0 ${textHeight}px`, fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-soft)', overflow: 'hidden'}}>
        {mode === "bullets" && f.bullets ? (
          <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5}}>
            {f.bullets.map((b, i) => (
              <li key={i} style={{paddingLeft: 14, position: 'relative'}}>
                <span style={{position: 'absolute', left: 0, color: 'var(--accent)', fontWeight: 500}}>·</span>
                {b}
              </li>
            ))}
          </ul>
        ) : (f.report || f.text || f.sub)}
      </div>
    </div>
  );
}

// "We crossed them both." A 2x2 grid of four landscape references behind the
// chosen families (tree canopy + King's Cross signal box, with their two
// concept images), uncropped, with the title ranged left beneath.
function CrossedPage() {
  const imgs = [
    { fn: "family-canopy-concept-photo.jpg",      cap: "Tree canopy, the canopy reference" },
    { fn: "family-signal-box-concept-sketch.jpg", cap: "King's Cross signal box, the signal box reference" },
    { fn: "family-canopy-concept.jpg",            cap: "Canopy, concept" },
    { fn: "family-signal-box-concept-photo.jpg",  cap: "Signal Box, concept" },
  ];
  return (
    <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
      <Eyebrow>§08 · Five Families</Eyebrow>
      <h2 className="h-title" style={{marginBottom: 14}}>We crossed them both.</h2>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
        {imgs.map((im) => (
          <div key={im.fn} style={{display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0}}>
            <div style={{height: 248, position: 'relative', overflow: 'hidden'}}>
              <Placeholder filename={im.fn} caption={im.cap} variant="photo" fill fitMode="contain" align="left" />
            </div>
            <div className="mono" style={{fontSize: 11, letterSpacing: 0.04, color: 'var(--fg-dim)', textAlign: 'left'}}>{im.cap}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SFiveFamilies = sectionPages(
  { sectionNum: 8, sectionTitle: "Five Families", sectionLabel: "Five Families" },
  [
    {
      label: "Five Families (title)",
      isDivider: true,
      presentation: () => <Divider range="§08" title="Five Families." sub="Five conceptual directions tested. Two taken further, three set aside." />,
      report:       () => <Divider range="§08" title="Five Families." sub="Five conceptual directions tested. Two taken further, three set aside." />,
    },
    // Page 1 — the three we set aside (Terrace, Carve, Roofline)
    {
      label: "Three set aside",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§08 · Five Families · The three we set aside</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 10}}>Three we set aside.</h2>
          <div style={{flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 22, alignItems: 'stretch'}}>
            {familiesSetAside.map((f) => <FamilyUnit key={f.slug} f={f} mode="bullets" textHeight={120} />)}
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§08 · Five Families · The three we set aside</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 10}}>Three we set aside.</h2>
          <div style={{flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 22, alignItems: 'stretch'}}>
            {familiesSetAside.map((f) => <FamilyUnit key={f.slug} f={f} mode="prose" textHeight={130} />)}
          </div>
        </div>
      ),
    },
    // Page 2 — the two we took further (Canopy, Signal Box)
    {
      label: "Two taken further",
      // Page 101 layout differs from page 100 on purpose: the title sits in
      // a narrower left column, freeing the full page height for the two
      // family columns. Images get bigger and the page reads as "these are
      // the chosen ones" rather than "another row of options".
      presentation: () => (
        <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', columnGap: 28, height: '100%', minHeight: 0, alignItems: 'stretch'}}>
          <div style={{display: 'flex', flexDirection: 'column', minWidth: 0, paddingTop: 2}}>
            <Eyebrow>§08 · Five Families</Eyebrow>
            <h2 className="h-title" style={{marginTop: 20, marginBottom: 14, fontSize: 32, lineHeight: 1.05}}>Two we took further.</h2>
            <div style={{fontSize: 15, color: 'var(--fg-soft)', lineHeight: 1.45}}>
              Canopy at the ground.<br/>Signal Box at the top.
            </div>
          </div>
          {familiesPicked.map((f) => <FamilyUnit key={f.slug} f={f} mode="bullets" textHeight={145} />)}
        </div>
      ),
      report: () => (
        <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', columnGap: 28, height: '100%', minHeight: 0, alignItems: 'stretch'}}>
          <div style={{display: 'flex', flexDirection: 'column', minWidth: 0, paddingTop: 2}}>
            <Eyebrow>§08 · Five Families</Eyebrow>
            <h2 className="h-title" style={{marginTop: 20, marginBottom: 12, fontSize: 32, lineHeight: 1.05}}>Two we took further.</h2>
            <div className="prose tight" style={{fontSize: 13.5, color: 'var(--fg-soft)', lineHeight: 1.5}}>
              <p>Canopy and Signal Box answer the same brief in two positions: at the ground, and at the top.</p>
              <p>Both work. The choice is design-led, not market-led.</p>
            </div>
          </div>
          {familiesPicked.map((f) => <FamilyUnit key={f.slug} f={f} mode="prose" textHeight={130} />)}
        </div>
      ),
    },
    // ─── Pages 3–6: the bridge from "two options" to "one merged building".
    //     (3) Why these forms — precedents (King's Cross signal box +
    //     Handyside Canopy interior). (4) Canopy summary. (5) Signal Box
    //     summary. (6) "We crossed them" — the merger sketch that pivots
    //     into the post-merger studies that follow.
    // Page 3a — Why these forms · The object. Full-bleed signal box,
    // with a small label in the bottom-left. The pitched-roof box, the
    // ideogram of the place. Top-left: a precedent tile with "Across the
    // Buildings, the lookout" — the art piece that did something similar
    // at King's Cross.
    (() => {
      const render = () => (
        <div className="pc-cover">
          <Placeholder filename="family-signal-box-concept-sketch.jpg" caption="The King's Cross signal box, historic photo" variant="photo" fill />
          {/* top-left: precedent tile, with "Across the Buildings, the lookout" */}
          <div style={{position: 'absolute', top: 36, left: 36, width: 220, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 6}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
              <span className="mono" style={{background: 'var(--accent)', color: '#fff', fontSize: 9, letterSpacing: 0.2, textTransform: 'uppercase', padding: '3px 7px', fontWeight: 600, lineHeight: 1.1}}>Precedent</span>
            </div>
            <div style={{width: 220, aspectRatio: '3/2', position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid var(--rule-soft)'}}>
              <Placeholder filename="across-the-buildings.jpg" caption="Across the Buildings, the lookout, King's Cross" variant="photo" fill fitMode="cover" />
            </div>
            <div className="mono" style={{fontSize: 9.5, color: 'var(--accent)', letterSpacing: 0.12, textTransform: 'uppercase', lineHeight: 1.3, background: 'var(--bg)', padding: '5px 8px', borderTop: '2px solid var(--accent)'}}>Across the Buildings, the lookout</div>
          </div>
          {/* bottom-left: existing label plate */}
          <div className="pc-cover__overlay pc-cover__overlay--mini">
            <span className="mono" style={{color: 'var(--accent)', fontWeight: 500}}>Why these forms · The object</span>
            <h1 className="h-display" style={{fontSize: 24, lineHeight: 1.05, margin: 0}}>The signal box.</h1>
            <span className="mono" style={{fontSize: 10, color: 'var(--fg-soft)', letterSpacing: 0.06, lineHeight: 1.5}}>
              The ideogram. Brick body, light top. The pitched-roof box of King's Cross.
            </span>
          </div>
        </div>
      );
      return {
        label: "Why these forms · The object",
        isDivider: true,
        presentation: render,
        report:       render,
      };
    })(),
    // Page 3b — Signal Box summary. Pairs with the object precedent above:
    // the signal box image (object) is the precedent, this page is the
    // project drawn from it.
    {
      label: "Signal Box (summary)",
      presentation: () => (
        <OptionSummaryPage
          eyebrow="§08 · Two taken further"
          title="Signal Box."
          strap="A heavy brick body. A lightweight room at the top."
          bullets={[
            "A heavy brick body, lighter expressive top.",
            "An expressive room at the skyline. Seen from afar.",
            "Smaller footprint. Taller, slimmer, less long.",
            "Marks the crossing from the long view.",
          ]}
          images={[
            { fn: "signal-box-study-concept-sketch.jpg",     label: "Watercolour", variant: "sketch" },
            { fn: "signal-box-study-townscape-01.jpg",       label: "CGI",         variant: "CGI" },
            { fn: "signal-box-study-plan.jpg",               label: "Plan",        variant: "diagram" },
            { fn: "signal-box-study-detailed-model.jpg",     label: "Model",       variant: "model" },
          ]}
          mode="bullets"
        />
      ),
      report: () => (
        <OptionSummaryPage
          eyebrow="§08 · Two taken further"
          title="Signal Box."
          strap="A heavy brick body. A lightweight room at the top."
          bullets={[
            "A heavy brick body, lighter expressive top.",
            "An expressive room at the skyline. Seen from afar.",
            "Smaller footprint. Taller, slimmer, less long.",
            "Marks the crossing from the long view.",
          ]}
          prose={[
            "A heavy masonry body lifting a lightweight, expressive room into the skyline. Light against heavy, of the canal and the railway language of the place.",
            "The footprint is smaller, the building taller and slimmer and less long, so the ground is given back. The crossing is marked from the long view, where it can be seen.",
          ]}
          images={[
            { fn: "signal-box-study-concept-sketch.jpg",     label: "Watercolour", variant: "sketch" },
            { fn: "signal-box-study-townscape-01.jpg",       label: "CGI",         variant: "CGI" },
            { fn: "signal-box-study-plan.jpg",               label: "Plan",        variant: "diagram" },
            { fn: "signal-box-study-detailed-model.jpg",     label: "Model",       variant: "model" },
          ]}
          mode="prose"
        />
      ),
    },
    // Page 4 — Why these forms · The experience. Full-bleed Handyside
    // Canopy interior. Pairs with the Canopy summary that follows.
    (() => {
      const render = () => (
        <PresCover
          filename="handyside-canopy-interior.jpg"
          caption="Handyside Canopy interior, King's Cross"
          overlayMode="mini"
          overlay={
            <>
              <span className="mono" style={{color: 'var(--accent)', fontWeight: 500}}>Why these forms · The experience</span>
              <h1 className="h-display" style={{fontSize: 24, lineHeight: 1.05, margin: 0}}>The Handyside Canopy.</h1>
              <span className="mono" style={{fontSize: 10, color: 'var(--fg-soft)', letterSpacing: 0.06, lineHeight: 1.5}}>
                Interior space, activity, roof. Light iron over a brick threshold.
              </span>
            </>
          }
        />
      );
      return {
        label: "Why these forms · The experience",
        isDivider: true,
        presentation: render,
        report:       render,
      };
    })(),
    // Page 5 — Canopy summary. Pairs with the experience precedent above:
    // the Handyside Canopy image is the precedent, this page is the
    // project drawn from it.
    {
      label: "Canopy (summary)",
      presentation: () => (
        <OptionSummaryPage
          eyebrow="§08 · Two taken further"
          title="Canopy."
          strap="A pitched canopy at the ground. A sheltered threshold for the canal."
          bullets={[
            "A pitched canopy that opens to the canal.",
            "Brick body, lighter iron-and-glass roof. Of the place.",
            "A public ground floor. Seating, shelter, life.",
            "Marks the crossing at the foot, where it begins.",
          ]}
          images={[
            { fn: "canopy-concept-sketch.jpg",   label: "Watercolour", variant: "sketch" },
            { fn: "canopy-townscape-01.jpg",     label: "CGI",         variant: "CGI" },
            { fn: "canopy-plan.jpg",             label: "Plan",        variant: "diagram" },
            { fn: "canopy-detailed-model.jpg",   label: "Model",       variant: "model" },
          ]}
          mode="bullets"
        />
      ),
      report: () => (
        <OptionSummaryPage
          eyebrow="§08 · Two taken further"
          title="Canopy."
          strap="A pitched canopy at the ground. A sheltered threshold for the canal."
          bullets={[
            "A pitched canopy that opens to the canal.",
            "Brick body, lighter iron-and-glass roof. Of the place.",
            "A public ground floor. Seating, shelter, life.",
            "Marks the crossing at the foot, where it begins.",
          ]}
          prose={[
            "A pitched canopy at the ground level of the building, opening to the canal. The body is brick, the canopy roof is iron and glass: light against heavy, of the language of the place.",
            "One, two, or three bays of public space under the canopy. Seating, shelter, life. The crossing is marked at the foot, where it begins.",
          ]}
          images={[
            { fn: "canopy-concept-sketch.jpg",   label: "Watercolour", variant: "sketch" },
            { fn: "canopy-townscape-01.jpg",     label: "CGI",         variant: "CGI" },
            { fn: "canopy-plan.jpg",             label: "Plan",        variant: "diagram" },
            { fn: "canopy-detailed-model.jpg",   label: "Model",       variant: "model" },
          ]}
          mode="prose"
        />
      ),
    },
    // "We crossed them" page removed — the merger argument is implicit in
    // the pages that follow and no longer needs its own slide.
    // NEW Page 7 — Canopy G+8 and Signal Box G+11. Two A4 landscape
    // images side by side, with a small label under each.
    {
      label: "Canopy G+8 and Signal Box G+11",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§08 · Two taken further · The two directions</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 18, fontSize: 36, lineHeight: 1.06}}>Canopy G+8 and Signal Box G+11.</h2>
          <div style={{flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 28, alignItems: 'stretch'}}>
            {[
              { fn: "canopy-g8.jpg",      label: "Canopy G+8" },
              { fn: "signal-box-g11.jpg", label: "Signal Box G+11" },
            ].map((s, i) => (
              <div key={i} style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
                <div style={{aspectRatio: '1.414', position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid var(--rule-soft)', marginBottom: 10}}>
                  <Placeholder filename={s.fn} caption={s.label} variant="diagram" fill fitMode="contain" />
                </div>
                <div className="mono" style={{fontSize: 11, letterSpacing: 0.1, color: 'var(--accent)', textTransform: 'uppercase', lineHeight: 1.25}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§08 · Two taken further · The two directions</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 18, fontSize: 36, lineHeight: 1.06}}>Canopy G+8 and Signal Box G+11.</h2>
          <div style={{flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 28, alignItems: 'stretch'}}>
            {[
              { fn: "canopy-g8.jpg",      label: "Canopy G+8" },
              { fn: "signal-box-g11.jpg", label: "Signal Box G+11" },
            ].map((s, i) => (
              <div key={i} style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
                <div style={{aspectRatio: '1.414', position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid var(--rule-soft)', marginBottom: 10}}>
                  <Placeholder filename={s.fn} caption={s.label} variant="diagram" fill fitMode="contain" />
                </div>
                <div className="mono" style={{fontSize: 11, letterSpacing: 0.1, color: 'var(--accent)', textTransform: 'uppercase', lineHeight: 1.25}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // Page 8 — Conversations with the structural engineer. One single
    // A4-landscape diagram fitted as large as the remaining space allows
    // beneath the title + strap.
    {
      label: "Conversations with the engineer",
      presentation: () => (
        <div className="pc-cover" style={{background: '#ffffff'}}>
          <Placeholder filename="engineer-diagram-01.jpg" caption="Engineer's diagram, the structural argument" variant="diagram" fill fitMode="contain" />
          <div style={{position: 'absolute', bottom: 36, right: 36, zIndex: 2, background: 'rgba(252, 250, 246, 0.62)', backdropFilter: 'blur(10px) saturate(120%)', WebkitBackdropFilter: 'blur(10px) saturate(120%)', borderTop: '2px solid var(--accent)', padding: '12px 18px 14px', display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 460, boxShadow: '0 12px 32px rgba(0,0,0,0.08)'}}>
            <span className="mono" style={{color: 'var(--accent)', fontWeight: 500, fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase'}}>§08 · Early studies and conversations · The engineer</span>
            <h2 className="h-title" style={{margin: 0, fontSize: 32, lineHeight: 1.06}}>Conversations with the engineer.</h2>
            <span style={{fontSize: 14, color: 'var(--fg-soft)', lineHeight: 1.4, marginTop: 4}}>The structural answer. Load away from the tunnels, height earned in return.</span>
            <span className="mono" style={{fontSize: 10, color: 'var(--fg-dim)', letterSpacing: 0.14, textTransform: 'uppercase', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--rule-soft)'}}>Engineer's diagram</span>
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-cover" style={{background: '#ffffff'}}>
          <Placeholder filename="engineer-diagram-01.jpg" caption="Engineer's diagram, the structural argument" variant="diagram" fill fitMode="contain" />
          <div style={{position: 'absolute', bottom: 36, right: 36, zIndex: 2, background: 'rgba(252, 250, 246, 0.62)', backdropFilter: 'blur(10px) saturate(120%)', WebkitBackdropFilter: 'blur(10px) saturate(120%)', borderTop: '2px solid var(--accent)', padding: '12px 18px 14px', display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 520, boxShadow: '0 12px 32px rgba(0,0,0,0.08)'}}>
            <span className="mono" style={{color: 'var(--accent)', fontWeight: 500, fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase'}}>§08 · Early studies and conversations · The engineer</span>
            <h2 className="h-title" style={{margin: 0, fontSize: 32, lineHeight: 1.06}}>Conversations with the engineer.</h2>
            <span style={{fontSize: 13.5, color: 'var(--fg-soft)', lineHeight: 1.5, marginTop: 6}}>The argument: the signal box action spreads the load across the Piccadilly line and transfers weight away from the tunnels, onto ground that can carry it. The result is honest structural work that earns three additional storeys of height, taking the building to G+11 just below the Kenwood House viewing corridor. <em>The engineering is what makes the urban move possible.</em></span>
            <span className="mono" style={{fontSize: 10, color: 'var(--fg-dim)', letterSpacing: 0.14, textTransform: 'uppercase', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--rule-soft)'}}>Engineer's diagram</span>
          </div>
        </div>
      ),
    },
    // Mass and buildability — the one-pager Phil presents while talking
    // to the physical model in the room. Five square model options.
    (() => {
      const MASS_OPTIONS = [
        {
          label: "Hold the south",
          bullets: [
            "Planning: ground given to the canal.",
            "Delivery: easy from Goods Way.",
          ],
        },
        {
          label: "Hold the north",
          bullets: [
            "Planning: dense at the canal.",
            "Delivery: hard over the railway.",
          ],
        },
        {
          label: "Mass at the foot",
          bullets: [
            "Planning: a solid base.",
            "Delivery: stable and conventional.",
          ],
        },
        {
          label: "Distributed",
          bullets: [
            "Planning: balanced throughout.",
            "Delivery: standard construction.",
          ],
        },
        {
          label: "Mass at the top",
          bullets: [
            "Planning: ground freed for the public.",
            "Delivery: transfer structure needed.",
          ],
        },
      ];
      const render = () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§08 · Mass and buildability</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 4, fontSize: 36, lineHeight: 1.06}}>Mass and buildability.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 6}}>
            Planning and delivery.
          </div>
          <div style={{fontSize: 14, color: 'var(--fg-soft)', lineHeight: 1.45, marginBottom: 22, maxWidth: '82ch'}}>
            Where to place the mass, on balance, for planning and for delivery. Five options, shown on the model.
          </div>
          <div style={{flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', columnGap: 14, alignItems: 'start'}}>
            {MASS_OPTIONS.map((m, i) => (
              <div key={i} style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
                <div style={{aspectRatio: '1', overflow: 'hidden', marginBottom: 10, background: '#ffffff', border: '1px solid var(--rule-soft)', position: 'relative'}}>
                  <Placeholder filename={`mass-option-0${i+1}.jpg`} caption={`Mass option ${i+1}, ${m.label}`} variant="model" fill fitMode="contain" />
                </div>
                <div className="mono" style={{fontSize: 10.5, letterSpacing: 0.1, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6, lineHeight: 1.25}}>{String(i+1).padStart(2, '0')} · {m.label}</div>
                <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11.5, color: 'var(--fg-soft)', lineHeight: 1.35}}>
                  {m.bullets.map((b, j) => (
                    <li key={j} style={{paddingLeft: 11, position: 'relative'}}>
                      <span style={{position: 'absolute', left: 0, color: 'var(--accent)', fontWeight: 500}}>·</span>{b}
                    </li>
                  ))}
                </ul>
                <div style={{marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--rule-soft)', fontSize: 12, color: 'var(--fg)', fontWeight: 600}}>
                  Maximum NIA = <span style={{color: 'var(--accent)'}}>xxx m²</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      return {
        label: "Mass and buildability",
        presentation: render,
        report:       render,
      };
    })(),
    // Early studies — Phil's sketches showing how each direction tries
    // to win area; the highlighted middle option is the merger answer.
    {
      label: "Early studies (Phil's sketches)",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§08 · Early studies and conversations · The hand</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 4, fontSize: 36, lineHeight: 1.06}}>Maximizing area and deliverability.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 17, color: 'var(--fg-soft)', marginBottom: 18}}>
            How each direction gains area. And why both at maximum doesn't work.
          </div>
          <div style={{flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 22, alignItems: 'stretch'}}>
            {[
              { fn: "early-study-signal-box.jpg",    label: "01 · Canopy G+8",      note: "Structural transfer transfers load to column at ground floor." },
              { fn: "early-study-canopy.jpg",        label: "02 · Signal Box G+11", note: "Truss spreads load at top floor to two columns either side of the Piccadilly line. Hanging is more efficient than holding.", highlight: true },
              { fn: "early-study-both-conflict.jpg", label: "03 · Both G+11",       note: "Cantilever and transfer at ground plus truss at roof. Loads the column too much, reaches sand, not possible." },
            ].map((s, i) => (
              <div key={i} style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
                <div style={{aspectRatio: '1.414', position: 'relative', overflow: 'hidden', background: '#ffffff', border: s.highlight ? '3px solid var(--accent)' : '1px solid var(--rule-soft)', marginBottom: 10}}>
                  <Placeholder filename={s.fn} caption={s.label} variant="sketch" fill fitMode="contain" />
                  {s.highlight ? (
                    <div className="mono" style={{position: 'absolute', top: 10, left: 10, background: 'var(--accent)', color: '#fff', fontSize: 10, letterSpacing: 0.18, textTransform: 'uppercase', padding: '5px 9px', fontWeight: 600, lineHeight: 1.1}}>Maximum area structurally possible and most buildable</div>
                  ) : null}
                </div>
                <div className="mono" style={{fontSize: 11, letterSpacing: 0.1, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 5, lineHeight: 1.25}}>{s.label}</div>
                <div style={{fontSize: 12, color: 'var(--fg-soft)', lineHeight: 1.4}}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§08 · Early studies and conversations · The hand</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6, fontSize: 36, lineHeight: 1.06}}>Maximizing area and deliverability.</h2>
          <div className="prose tight" style={{maxWidth: '78ch', fontSize: 13.5, lineHeight: 1.5, marginBottom: 16}}>
            <p>Each option tested for how it gains area on a tight site, and how it sits with the constraints. The signal box gains height through a structural strategy that spreads load away from the Piccadilly line. The canopy gains area by cantilevering out from the body. The third sketch tests both at once and shows the conflict: maximising one move undermines the other. The merger asks each to do one job well.</p>
          </div>
          <div style={{flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 22, alignItems: 'stretch'}}>
            {[
              { fn: "early-study-signal-box.jpg",    label: "01 · Canopy G+8",      note: "Structural transfer transfers load to column at ground floor." },
              { fn: "early-study-canopy.jpg",        label: "02 · Signal Box G+11", note: "Truss spreads load at top floor to two columns either side of the Piccadilly line. Hanging is more efficient than holding.", highlight: true },
              { fn: "early-study-both-conflict.jpg", label: "03 · Both G+11",       note: "Cantilever and transfer at ground plus truss at roof. Loads the column too much, reaches sand, not possible." },
            ].map((s, i) => (
              <div key={i} style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
                <div style={{aspectRatio: '1.414', position: 'relative', overflow: 'hidden', background: '#ffffff', border: s.highlight ? '3px solid var(--accent)' : '1px solid var(--rule-soft)', marginBottom: 10}}>
                  <Placeholder filename={s.fn} caption={s.label} variant="sketch" fill fitMode="contain" />
                  {s.highlight ? (
                    <div className="mono" style={{position: 'absolute', top: 10, left: 10, background: 'var(--accent)', color: '#fff', fontSize: 10, letterSpacing: 0.18, textTransform: 'uppercase', padding: '5px 9px', fontWeight: 600, lineHeight: 1.1}}>Maximum area structurally possible and most buildable</div>
                  ) : null}
                </div>
                <div className="mono" style={{fontSize: 11, letterSpacing: 0.1, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 5, lineHeight: 1.25}}>{s.label}</div>
                <div style={{fontSize: 12, color: 'var(--fg-soft)', lineHeight: 1.4}}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // The modulation of the crossing — six A4-landscape diagram slots in a
    // 3x2 grid telling the urban story from canal to seating-mimicking-trains.
    (() => {
      const MODULATION = [
        { fn: "modulation-01.jpg", num: "01", label: "The canal." },
        { fn: "modulation-02.jpg", num: "02", label: "An extension of the canal." },
        { fn: "modulation-03.jpg", num: "03", label: "Addition of Canopy and Signal Box." },
        { fn: "modulation-04.jpg", num: "04", label: "Canopy responds to the direction of the public space and closes the route to York Way." },
        { fn: "modulation-05.jpg", num: "05", label: "Canopy removed from public space in 1852 café; left as a singular canopy element. Allows views to the Signal Box from public space." },
        { fn: "modulation-06.jpg", num: "06", label: "Soft landscape added. In view: seating within the café and the public space mimics the seats of the trains that pass below." },
      ];
      const render = () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§08 · The modulation of the crossing</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 18, fontSize: 36, lineHeight: 1.06}}>The modulation of the crossing.</h2>
          <div style={{flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: '1fr 1fr', columnGap: 18, rowGap: 10, alignItems: 'start', paddingBottom: 16}}>
            {MODULATION.map((m, i) => (
              <div key={i} style={{display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0}}>
                <div style={{aspectRatio: '1.6', position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid var(--rule-soft)', marginBottom: 8}}>
                  <Placeholder filename={m.fn} caption={`${m.num} · ${m.label}`} variant="diagram" fill fitMode="contain" />
                </div>
                <div className="mono" style={{fontSize: 9.5, letterSpacing: 0.12, color: 'var(--accent)', textTransform: 'uppercase', lineHeight: 1.3}}>
                  <span style={{fontWeight: 600}}>{m.num}</span> · {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      return {
        label: "The modulation of the crossing",
        presentation: render,
        report:       render,
      };
    })(),

  ]
);

// ── §09 Five Viability Questions (six, condensed onto two pages) ─────────
const viabilityQs = [
  { title: "Eccentric core.",                           sub: "One coherent plate, daylight from three sides." },
  { title: "Extended floor plate, support or hang?",    sub: "Cantilever from below, or suspend from above." },
  { title: "Basement.",                                 sub: "Plant below, or lift it to a mezzanine, freeing the ground." },
  { title: "Build to the canal wall.",                  sub: "How far do we go, and what does it mean for the towpath?" },
  { title: "Two staircases, height versus efficiency.", sub: "Code-driven, but every metre of core costs lettable area." },
  { title: "Public or private roof?",                   sub: "No truly public roof exists at King's Cross. A civic gesture, and it helps the height case." },
];

// One viability question: number, title, a one-line sub, and a landscape
// sketch beneath. The fixed-height text header keeps every sketch starting on
// the same line across the three columns. Sketches load where present; q6
// (public/private roof) is a placeholder for a sketch to be added later.
function QuestionCard({ q, n }) {
  const name = q.title.replace(/[.?]$/, '');
  return (
    <div style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
      <div style={{height: 104, display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden'}}>
        <div className="mono" style={{fontSize: 11, letterSpacing: 0.14, color: 'var(--accent)', textTransform: 'uppercase'}}>Question {n}</div>
        <h3 className="h-sub" style={{margin: 0, fontSize: 18, lineHeight: 1.1}}>{q.title}</h3>
        <div style={{fontSize: 12, lineHeight: 1.35, color: 'var(--fg-soft)'}}>{q.sub}</div>
      </div>
      <div style={{height: 300, position: 'relative', overflow: 'hidden'}}>
        <Placeholder filename={`viability-q${n}-${slugify(q.title)}.jpg`} caption={`Question ${n}, ${name}, sketch`} variant="diagram" fill fitMode="contain" align="left" />
      </div>
    </div>
  );
}

function ViabilityPage({ from }) {
  const items = viabilityQs.slice(from, from + 3);
  return (
    <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
      <Eyebrow>§09 · Five Viability Questions · {from === 0 ? "1 to 3" : "4 to 6"}</Eyebrow>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 22, alignItems: 'start', marginTop: 10}}>
        {items.map((q, i) => <QuestionCard key={q.title} q={q} n={from + i + 1} />)}
      </div>
    </div>
  );
}

const SViabilityQs = sectionPages(
  { sectionNum: 9, sectionTitle: "Questions on delivering the best office", sectionLabel: "The questions" },
  [
    {
      label: "Questions on delivering the best office (title)",
      isDivider: true,
      presentation: () => <Divider range="§09" title="Questions on delivering the best office." sub="On this site. Six of them." />,
      report:       () => <Divider range="§09" title="Questions on delivering the best office." sub="On this site. Six of them." />,
    },
    {
      label: "Viability Questions 1 to 3",
      presentation: () => <ViabilityPage from={0} />,
      report:       () => <ViabilityPage from={0} />,
    },
    {
      label: "Viability Questions 4 to 6",
      presentation: () => <ViabilityPage from={3} />,
      report:       () => <ViabilityPage from={3} />,
    },
  ]
);

// ── §12 The Building is too long? ───────────────────────────────────────
const SBuildingTooLong = sectionPages(
  { sectionNum: 10, sectionTitle: "The Building is too long?", sectionLabel: "Too long?" },
  [
    {
      label: "The Building is too long? (title)",
      isDivider: true,
      presentation: () => <Divider range="§10" title="The Building is too long?" sub="A question from the client; an echo of the planners." />,
      report:       () => <Divider range="§10" title="The Building is too long?" sub="A question from the client; an echo of the planners." />,
    },
    // "Mark the crossing. Don't obstruct it." moved to Summary, Part I as
    // the closing urban-thesis page. §10 starts directly on the divider.
  ]
);

// ── §11 Two studies, further explored ──────────────────────────────────
// Deliberately tentative framing, we are exploring two directions in
// parallel, not committing to one. The "chosen" language was too strong.
const STwoChosen = sectionPages(
  { sectionNum: 11, sectionTitle: "Two studies, further explored", sectionLabel: "Two studies" },
  [
    {
      label: "Two studies, further explored (title)",
      isDivider: true,
      presentation: () => <Divider range="§11" title="Two studies, further explored." sub="Canopy and Signal Box. One brief. Two open answers." />,
      report:       () => <Divider range="§11" title="Two studies, further explored." sub="Canopy and Signal Box. One brief. Two open answers." />,
    },
    {
      label: "Two Directions. Canopy and Signal Box",
      presentation: () => (
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr', gap: 36, height: '100%', minHeight: 0, alignItems: 'stretch'}}>
          <div style={{display: 'flex', minHeight: 0, minWidth: 0}}>
            <Placeholder filename="two-directions-sketch.jpg" caption="Two directions, landscape sketch (Canopy reaching to the canal; Signal Box marking the crossing from above)" variant="sketch" aspect="4/3" />
          </div>
          <div className="pc-stmt" style={{maxWidth: 'none', width: '100%', justifyContent: 'center'}}>
            <Eyebrow>§11 · Two studies</Eyebrow>
            <h2 className="h-title" style={{marginBottom: 14}}>Two ways to mark the crossing.</h2>
            <div className="prose" style={{maxWidth: '48ch', fontSize: 15, color: 'var(--fg)', display: 'flex', flexDirection: 'column', gap: 12}}>
              <div>
                <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4}}>Canopy</div>
                <p>The building looks at the base. A canopy at canal level brings the building into relationship with canal life, boats, the towpath, the under-the-bridge crossing made navigable.</p>
              </div>
              <div>
                <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4}}>Signal Box</div>
                <p>The building looks up. A marker at the crossing, of the canal of 1820 and the railway of 1852, but the public destination is high: the lookout above.</p>
              </div>
              <p className="mono" style={{fontSize: 11, color: 'var(--fg-dim)', letterSpacing: 0.04}}>
                Beneath both: the same office. Eccentric core, two stairs, ~80–81% efficient, 5,300–6,000 sqft plates, three-sided daylight.
              </p>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr', gap: 36, height: '100%', minHeight: 0, alignItems: 'stretch'}}>
          <div style={{display: 'flex', minHeight: 0, minWidth: 0}}>
            <Placeholder filename="two-directions-sketch.jpg" caption="Two directions, landscape sketch (Canopy reaching to the canal; Signal Box marking the crossing from above)" variant="sketch" aspect="4/3" />
          </div>
          <div className="pc-stmt" style={{maxWidth: 'none', width: '100%', justifyContent: 'center'}}>
            <Eyebrow>§11 · Two studies</Eyebrow>
            <h2 className="h-title" style={{marginBottom: 10}}>Two ways to mark the crossing.</h2>
            <div className="prose tight" style={{maxWidth: '52ch'}}>
              <p>Beneath both directions is the same optimised office: eccentric core, two stairs, ~80–81% efficient, 5,300–6,000 sqft plates, three-sided daylight. The office building is settled. <em>What changes is how the building activates the crossing it sits on.</em></p>
              <p><strong>Canopy</strong> looks at the base. A canopy at canal level brings the building into relationship with canal life, the boats, the towpath, the under-the-bridge crossing made navigable. The destination is the ground.</p>
              <p><strong>Signal Box</strong> looks up. A marker at the crossing of the canal of 1820 and the railway of 1852, but the public destination is high: the lookout above, from which the whole crossing can be read in one view.</p>
              <p>The next two sections develop each in turn, on the same set of pages.</p>
            </div>
          </div>
        </div>
      ),
    },
  ]
);

// ── Area schedule data ─────────────────────────────────────────────────
// Drawn from the Stage 2 area schedules supplied by the team. Used by
// §12 Canopy (G+6), §13 Signal Box study (G+8), §14 Our Direction
// (G+10 both options) and §17 Appendix (previously consented scheme).
// Ground floor sits at +22.98 m AOD on site; heights derive from there.
const CANOPY_G6_SCHEDULE = {
  totals: { gea: 7341, gia: 6119, nia: 4518, eff: "74%" },
  rows: [
    { lvl: "Roof",      gea: 837, gia: 776, nia: 316, eff: null,  use: "Amenities & plant" },
    { lvl: "6F",        gea: 837, gia: 776, nia: 629, eff: "81%", use: "Office" },
    { lvl: "5F",        gea: 837, gia: 776, nia: 629, eff: "81%", use: "Office" },
    { lvl: "4F",        gea: 837, gia: 776, nia: 629, eff: "81%", use: "Office" },
    { lvl: "3F",        gea: 837, gia: 776, nia: 629, eff: "81%", use: "Office" },
    { lvl: "2F",        gea: 837, gia: 776, nia: 629, eff: "81%", use: "Office" },
    { lvl: "1F",        gea: 837, gia: 776, nia: 629, eff: "81%", use: "Office" },
    { lvl: "Mezzanine", gea: 741, gia: null, nia: null, eff: null, use: "Plant" },
    { lvl: "Ground",    gea: 741, gia: 687, nia: 428, eff: "62%", use: "Lobby" },
  ],
  note: "G+6. No basement. Roof at 54.53 m AOD (31.55 m from ground).",
};
const SIGNAL_BOX_G8_SCHEDULE = {
  totals: { gea: 7954, gia: 6731, nia: 4964, eff: "74%" },
  rows: [
    { lvl: "Roof",      gea: 872, gia: 804, nia: 355, eff: null,  use: "Amenities & plant" },
    { lvl: "8F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "7F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "6F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "5F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "4F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "3F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "2F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "1F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "Mezzanine", gea: 705, gia: null, nia: null, eff: null, use: "Plant" },
    { lvl: "Ground",    gea: 705, gia: 647, nia: 401, eff: null,  use: "Lobby" },
  ],
  note: "G+8 study. No basement. Roof at 58.18 m AOD (35.20 m from ground).",
};
const CANOPY_G10_SCHEDULE = {
  totals: { gea: 9336, gia: 8002, nia: 5984, eff: "75%" },
  rows: [
    { lvl: "Roof",      gea: 714, gia: 665, nia: 256, eff: null,  use: "Amenities & plant" },
    { lvl: "10F",       gea: 714, gia: 665, nia: 530, eff: "80%", use: "Office" },
    { lvl: "9F",        gea: 714, gia: 665, nia: 530, eff: "80%", use: "Office" },
    { lvl: "8F",        gea: 714, gia: 665, nia: 530, eff: "80%", use: "Office" },
    { lvl: "7F",        gea: 714, gia: 665, nia: 530, eff: "80%", use: "Office" },
    { lvl: "6F",        gea: 714, gia: 665, nia: 530, eff: "80%", use: "Office" },
    { lvl: "5F",        gea: 714, gia: 665, nia: 530, eff: "80%", use: "Office" },
    { lvl: "4F",        gea: 714, gia: 665, nia: 530, eff: "80%", use: "Office" },
    { lvl: "3F",        gea: 714, gia: 665, nia: 530, eff: "80%", use: "Office" },
    { lvl: "2F",        gea: 714, gia: 665, nia: 530, eff: "80%", use: "Office" },
    { lvl: "1F",        gea: 714, gia: 665, nia: 530, eff: "80%", use: "Office" },
    { lvl: "Mezzanine", gea: 741, gia: null, nia: null, eff: null, use: "Plant" },
    { lvl: "Ground",    gea: 741, gia: 687, nia: 428, eff: "62%", use: "Lobby" },
  ],
  note: "G+10 hybrid. Parapet apex 71.33 m AOD (48.35 m from ground). Under the 73.2 m Kenwood House view line.",
};
const SIGNAL_BOX_G10_SCHEDULE = {
  totals: { gea: 9372, gia: 8051, nia: 6016, eff: "75%" },
  rows: [
    { lvl: "Roof",      gea: 872, gia: 804, nia: 355, eff: null,  use: "Amenities & plant" },
    { lvl: "10F",       gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "9F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "8F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "7F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "6F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "5F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "4F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "3F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "2F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "1F",        gea: 709, gia: 660, nia: 526, eff: "80%", use: "Office" },
    { lvl: "Mezzanine", gea: 705, gia: null, nia: null, eff: null, use: "Plant" },
    { lvl: "Ground",    gea: 705, gia: 647, nia: 401, eff: null,  use: "Lobby" },
  ],
  note: "G+10. Apex of roof 71.98 m AOD (49.00 m from ground). Under the 73.2 m Kenwood House view line.",
};
const PREVIOUS_CONSENTED_SCHEDULE = {
  totals: { gea: 5836, gia: 5252, nia: 3797, eff: "72%" },
  rows: [
    { lvl: "Roof",     gea: null, gia: null, nia: null, eff: null,  use: "Plant" },
    { lvl: "6F",       gea: 733, gia: 676, nia: 535, eff: "79%", use: "Office" },
    { lvl: "5F",       gea: 764, gia: 692, nia: 563, eff: "81%", use: "Office" },
    { lvl: "4F",       gea: 764, gia: 692, nia: 563, eff: "81%", use: "Office" },
    { lvl: "3F",       gea: 762, gia: 691, nia: 561, eff: "81%", use: "Office" },
    { lvl: "2F",       gea: 762, gia: 691, nia: 561, eff: "81%", use: "Office" },
    { lvl: "1F",       gea: 744, gia: 679, nia: 517, eff: "76%", use: "Office & retail" },
    { lvl: "Ground",   gea: 733, gia: 685, nia: 432, eff: "63%", use: "Lobby & retail" },
    { lvl: "Basement", gea: 574, gia: 446, nia:  65, eff: "15%", use: "Plant & retail BOH" },
  ],
  note: "Stage 5 consented planning scheme. G+6 with basement. Roof plant at 49.66 m AOD.",
};

// Renders a single area-schedule table. Use null in any numeric cell to
// show an en-dash; "use" column is optional.
function AreaSchedule({ data, compact = false }) {
  const fmt = (n) => (n == null ? "–" : n.toLocaleString("en-GB"));
  return (
    <table className={"schedule__table" + (compact ? " schedule__table--compact" : "")}>
      <thead>
        <tr>
          <th>Level</th>
          <th>GEA (m²)</th>
          <th>GIA (m²)</th>
          <th>NIA (m²)</th>
          <th>Eff.</th>
          {!compact ? <th>Use</th> : null}
        </tr>
      </thead>
      <tbody>
        {data.rows.map((r) => (
          <tr key={r.lvl}>
            <th>{r.lvl}</th>
            <td className={r.gea == null ? "dim" : ""}>{fmt(r.gea)}</td>
            <td className={r.gia == null ? "dim" : ""}>{fmt(r.gia)}</td>
            <td className={r.nia == null ? "dim" : ""}>{fmt(r.nia)}</td>
            <td className={r.eff == null ? "dim" : ""}>{r.eff || "–"}</td>
            {!compact ? <td className={r.use ? "" : "dim"}>{r.use || "–"}</td> : null}
          </tr>
        ))}
        <tr className="schedule__total">
          <th>Total</th>
          <td>{fmt(data.totals.gea)}</td>
          <td>{fmt(data.totals.gia)}</td>
          <td>{fmt(data.totals.nia)}</td>
          <td>{data.totals.eff || "–"}</td>
          {!compact ? <td></td> : null}
        </tr>
      </tbody>
    </table>
  );
}

// ── Helper for §14 Canopy and §15 Signal Box (16-page study structures) ─
// axoStages: optional array of 6 stage names (e.g. ["The Site", ...]).
// Falls back to "Stage 1", "Stage 2", … if not provided.
function studyDesignPages({ sectionNum, sectionLabel, slug, displayName, conceptNote, scheduleData, axoStages }) {
  const stageName = (n) => (axoStages && axoStages[n - 1]) || `Stage ${n}`;
  const sectStr = String(sectionNum).padStart(2, '0');
  return [
    // 1, full-bleed image with title overlay
    {
      label: `${displayName} · Hero`,
      presentation: () => (
        <PresCover
          filename={`${slug}-hero.jpg`}
          caption={`${displayName}, full-bleed hero image`}
          overlay={
            <>
              <span className="mono" style={{color: 'var(--accent)', letterSpacing: '0.22em', fontWeight: 500}}>§{sectStr} · {sectionLabel}</span>
              <h1 className="h-display" style={{fontSize: 64, lineHeight: 1, margin: 0}}>{displayName}.</h1>
              <span className="mono" style={{fontSize: 12, color: 'var(--fg-soft)', letterSpacing: '0.04em'}}>{conceptNote.headline}</span>
            </>
          }
        />
      ),
      report: () => (
        <PresCover
          filename={`${slug}-hero.jpg`}
          caption={`${displayName}, full-bleed hero image`}
          overlay={
            <>
              <span className="mono" style={{color: 'var(--accent)', letterSpacing: '0.22em', fontWeight: 500}}>§{sectStr} · {sectionLabel}</span>
              <h1 className="h-display" style={{fontSize: 64, lineHeight: 1, margin: 0}}>{displayName}.</h1>
              <span className="mono" style={{fontSize: 12, color: 'var(--fg-soft)', letterSpacing: '0.04em'}}>{conceptNote.headline}</span>
            </>
          }
        />
      ),
    },
    // 1b, detailed physical model (large landscape image, no overlay,
    //      sits between the section hero and the concept sketch).
    {
      label: `${displayName} · Detailed model`,
      presentation: () => (
        <PresImage
          filename={`${slug}-detailed-model.jpg`}
          caption={`${displayName}, detailed physical model, large landscape photograph`}
          variant="model"
          capIdx="Model"
          capTitle={`${displayName}, in detail.`}
          capMeta={`Physical model${displayName === "Signal Box" ? ", G+8 scheme" : ""}.`}
          aspect="16/9"
        />
      ),
      report: () => (
        <PresImage
          filename={`${slug}-detailed-model.jpg`}
          caption={`${displayName}, detailed physical model, large landscape photograph`}
          variant="model"
          capIdx="Model"
          capTitle={`${displayName}, in detail.`}
          capMeta={`Physical model${displayName === "Signal Box" ? ", G+8 scheme" : ""}.`}
          aspect="16/9"
        />
      ),
    },
    // 2, concept sketch
    {
      label: `${displayName} · Concept sketch`,
      presentation: () => (
        <PresImage
          filename={`${slug}-concept-sketch.jpg`}
          caption={`${displayName}, concept sketch (landscape)`}
          variant="sketch"
          capIdx="Concept"
          capTitle={`${displayName}, the idea, in a sketch.`}
          capMeta={conceptNote.headline}
        />
      ),
      report: () => (
        <ReportImageText
          filename={`${slug}-concept-sketch.jpg`}
          caption={`${displayName}, concept sketch (landscape)`}
          variant="sketch"
          capIdx="Concept"
          capTitle={`${displayName}, the idea, in a sketch.`}
          kicker={`§${sectStr} · ${sectionLabel} · Concept`}
          title={`${displayName}, the idea.`}
          body={<>
            <p>{conceptNote.headline}</p>
            {conceptNote.body}
          </>}
        />
      ),
    },
    // 3–8, axonometric build-up (6 stages). Each scheme passes its own
    // axoStages so the per-stage titles (capTitle / report title) read
    // as the build-up's narrative steps, not generic "Stage 1, Stage 2".
    ...[1, 2, 3, 4, 5, 6].map((n) => {
      const name = stageName(n);
      return {
        label: `${displayName} · Axo · ${n}. ${name}`,
        presentation: () => (
          <PresImage
            filename={`${slug}-axo-${String(n).padStart(2,'0')}.jpg`}
            caption={`${displayName}, axonometric build-up · ${n}. ${name} · stage ${n} of 6`}
            variant="diagram"
            number={String(n)}
            capIdx={`Axo · ${n} of 6`}
            capTitle={`${name}.`}
            capMeta={`${displayName}, axonometric build-up, step ${n} of 6.`}
          />
        ),
        report: () => (
          <ReportImageText
            filename={`${slug}-axo-${String(n).padStart(2,'0')}.jpg`}
            caption={`${displayName}, axonometric build-up · ${n}. ${name} · stage ${n} of 6`}
            variant="diagram"
            number={String(n)}
            capIdx={`Axo · ${n} of 6`}
            capTitle={`${name}.`}
            kicker={`§${sectStr} · ${sectionLabel} · Axonometric · ${n} of 6`}
            title={`${name}.`}
            body={<p>Placeholder for axonometric step {n} of 6, <em>{name.toLowerCase()}</em>. Drop a render or diagram onto the slot to populate.</p>}
          />
        ),
      };
    }),
    // 9, townscape (single page per study). Hero CGI showing the scheme
    //    in its King's Cross context. Sits BEFORE the plan so the
    //    reader sees the form first, then the plan.
    {
      label: `${displayName} · Townscape`,
      presentation: () => (
        <PresImage
          filename={`${slug}-townscape-01.jpg`}
          caption={`${displayName}, townscape CGI (landscape)`}
          variant="photo"
          capIdx="Townscape"
          capTitle={`${displayName}, in townscape.`}
          capMeta={`${displayName}, CGI placeholder.`}
        />
      ),
      report: () => (
        <ReportImageText
          filename={`${slug}-townscape-01.jpg`}
          caption={`${displayName}, townscape CGI (landscape)`}
          variant="photo"
          capIdx="Townscape"
          capTitle={`${displayName}, in townscape.`}
          kicker={`§${sectStr} · ${sectionLabel} · Townscape`}
          title={`${displayName}, in townscape.`}
          body={<p>Placeholder, drop the townscape CGI onto the slot.</p>}
        />
      ),
    },
    // 10, plan (single 16:9 plan image at full body width; labels in a
    //     JetBrains Mono box directly beneath the plans, full body width).
    //     Comes after the townscape so the reader has the silhouette in
    //     mind before they look at the floor plates.
    (() => {
      const renderPlanPage = () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§{sectStr} · {sectionLabel} · Plan</Eyebrow>
          <h2 className="h-sub" style={{marginBottom: 14}}>{displayName}, plan.</h2>
          {/* Image area, fills the remaining vertical space, keeps 16:9 */}
          <div style={{flex: 1, minHeight: 0, display: 'flex'}}>
            <Placeholder filename={`${slug}-plan.jpg`} caption={`${displayName}, plan drawing (composite: Ground Floor · Typical Plan · Roof Plan, side-by-side)`} variant="diagram" aspect="16/9" />
          </div>
          {/* Label strip, directly beneath the plans, JetBrains Mono */}
          <div style={{
            marginTop: 10,
            borderTop: '1px solid var(--rule)',
            borderBottom: '1px solid var(--rule)',
            padding: '10px 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 0,
            flex: '0 0 auto',
          }}>
            <div style={{fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--fg)', letterSpacing: '0.06em', textTransform: 'uppercase'}}>Ground Floor</div>
            <div style={{fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--fg)', letterSpacing: '0.06em', textTransform: 'uppercase'}}>Typical Plan</div>
            <div style={{fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--fg)', letterSpacing: '0.06em', textTransform: 'uppercase'}}>Roof Plan</div>
          </div>
        </div>
      );
      return {
        label: `${displayName} · Plan`,
        presentation: renderPlanPage,
        report: renderPlanPage,
      };
    })(),
    // 16, area schedule. Uses real data when scheduleData is provided;
    //     otherwise renders a placeholder table.
    {
      label: `${displayName} · Area schedule`,
      presentation: () => (
        <div className="schedule">
          <div className="schedule__head">
            <Eyebrow>§{sectStr} · {sectionLabel} · Area schedule</Eyebrow>
            <h2 className="h-sub">{displayName}, indicative area schedule.</h2>
            {scheduleData ? (
              <div className="prose tight" style={{maxWidth: '78ch', marginTop: 2, fontSize: 13, color: 'var(--fg-dim)'}}>
                {scheduleData.note}
              </div>
            ) : (
              <div className="prose tight" style={{maxWidth: '78ch', marginTop: 2}}>
                Placeholder, numbers to follow.
              </div>
            )}
          </div>
          {scheduleData ? <AreaSchedule data={scheduleData} /> : (
            <table className="schedule__table">
              <thead><tr><th>Level</th><th>GIA (m²)</th><th>NIA (m²)</th><th>NIA : GIA</th><th>Notes</th></tr></thead>
              <tbody>
                {["Roof", "Top", "Mid", "Lower", "Ground", "Basement"].map((lvl) => (
                  <tr key={lvl}><th>{lvl}</th><td className="dim">–</td><td className="dim">–</td><td className="dim">–</td><td className="dim">TBD</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ),
      report: () => (
        <div className="schedule">
          <div className="schedule__head">
            <Eyebrow>§{sectStr} · {sectionLabel} · Area schedule</Eyebrow>
            <h2 className="h-sub">{displayName}, indicative area schedule.</h2>
            <div className="prose tight" style={{maxWidth: '78ch', marginTop: 2}}>
              {scheduleData ? <p>{scheduleData.note}</p> : <p>Indicative area schedule for the {displayName} direction. Numbers to follow.</p>}
            </div>
          </div>
          {scheduleData ? <AreaSchedule data={scheduleData} /> : (
            <table className="schedule__table">
              <thead><tr><th>Level</th><th>GIA (m²)</th><th>NIA (m²)</th><th>NIA : GIA</th><th>Notes</th></tr></thead>
              <tbody>
                {["Roof", "Top", "Mid", "Lower", "Ground", "Basement"].map((lvl) => (
                  <tr key={lvl}><th>{lvl}</th><td className="dim">–</td><td className="dim">–</td><td className="dim">–</td><td className="dim">TBD</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ),
    },
  ];
}

// ── Offerings, used by Canopy and Signal Box study closers ─────────────
const canopyOfferings = [
  ["Activates the canal",
   "A sheltered civic room at the building's foot, a public passage between Goods Way and the towpath, not a wall to walk past."],
  ["The undercroft as gift",
   "Connecting the upper path and the lower canal path through the building. The crossing the planners worried about, made navigable."],
  ["Hung floors, wider plates",
   "Suspending the upper floors yields ~80 m² extra per floor. Heavy structure pays for it; the area is real."],
  ["A quieter silhouette",
   "G+6 sits low in the canal context. Doesn't compete with the Gasholders or Granary; lets them keep the skyline."],
  ["Faster to build",
   "Only NMA planning required. No new principal consent. The programme is materially shorter."],
];

const signalBoxStudyOfferings = [
  ["The lookout",
   "Public access to the 1820 room at the top. King's Cross's first free public roof; the crossing visible in one view."],
  ["The crossing, marked",
   "A lightweight signal-box silhouette visible from far away. \"The Crossing,\" perforated through the aluminium at the skyline."],
  ["Simply supported",
   "No transfer structure, no cantilever. Lighter on ground, lower embodied carbon, no carbon villain in the section."],
  ["Three-sided daylight",
   "The slender plate gives the canal a full elevation; daylight reaches across, the canal visible from inside."],
  ["Honesty in section",
   "Heavy brick body that belongs to the canal; lightweight lookout that belongs to the sky. The two are not asked to reconcile."],
];

// ── §12 Materials ───────────────────────────────────────────────────────
//   Heavy and light. Both schemes share the same material logic, brick body
//   to the canal, lightweight expression at the top. Alternatives below each
//   image map to the choices in the calculator (top toolbar) so the cost +
//   sustainability conversation is quantified, not assumed.
const SMaterials = sectionPages(
  { sectionNum: 15, sectionTitle: "Materials", sectionLabel: "Materials" },
  [
    // Title page
    {
      label: "Materials (title)",
      isDivider: true,
      presentation: () => <Divider range="§15" title="Materials. Sustainability. Cost." sub="Heavy and light. Both quantified in the calculator." />,
      report:       () => <Divider range="§15" title="Materials. Sustainability. Cost." sub="Heavy and light. Both quantified in the calculator." />,
    },
    {
      label: "Heavy, brick + alternatives",
      presentation: () => (
        <QMaterialPage
          slot="heavy"
          kicker="§15 · Materials · Heavy"
          title="Heavy, the brick body."
          image="material-01-brick-sample.jpg"
          imageCaption="Staffordshire blue-brown engineering brick, the brick of Victorian canal and railway infrastructure"
          lead={<p>The brick body is heavy by intent: it belongs to the canal. The same in either scheme. Canopy or Signal Box, brick to the waterline. The alternatives below sit in the calculator; sustainability and cost are quantified, not assumed.</p>}
          materials={heavyMaterials}
          view="presentation"
        />
      ),
      report: () => (
        <QMaterialPage
          slot="heavy"
          kicker="§15 · Materials · Heavy"
          title="Heavy, the brick body."
          image="material-01-brick-sample.jpg"
          imageCaption="Staffordshire blue-brown engineering brick, the brick of Victorian canal and railway infrastructure"
          lead={<p>The brick body is heavy by intent. Brick to the waterline; the building belongs to the canal before it does anything else. Both directions. Canopy and Signal Box, share this body. The table below sets out the heavy alternatives the calculator quantifies, with embodied carbon and indicative cost per square metre of facade. <em>Numbers align with the design-side carbon + cost calculator (top toolbar).</em></p>}
          materials={heavyMaterials}
          view="report"
        />
      ),
    },
    {
      label: "Light, aluminium + alternatives",
      presentation: () => (
        <QMaterialPage
          slot="light"
          kicker="§15 · Materials · Light"
          title="Light, the lantern."
          image="material-04-aluminium-detail.jpg"
          imageCaption="Bright perforated recycled aluminium. Hydro CIRCAL 75R, lantern-like at dusk"
          lead={<p>The lightweight expression contrasts the brick. In the Signal Box it sits at the top as a lookout; in the Canopy it sits below as a sheltered public room. Either way, bright, perforated, lantern-like, the building's second voice.</p>}
          materials={lightMaterials}
          view="presentation"
        />
      ),
      report: () => (
        <QMaterialPage
          slot="light"
          kicker="§15 · Materials · Light"
          title="Light, the lantern."
          image="material-04-aluminium-detail.jpg"
          imageCaption="Bright perforated recycled aluminium. Hydro CIRCAL 75R, lantern-like at dusk"
          lead={<p>The lightweight expression contrasts the brick. <strong>Where it sits depends on the scheme</strong>, at the top in the Signal Box (the 1820 lookout), at the canopy below in the Canopy (the sheltered public room). The material logic is the same in both: bright, perforated, lantern-like, the building's second voice. The table below sets out the light alternatives the calculator quantifies. <em>Numbers align with the design-side carbon + cost calculator (top toolbar).</em></p>}
          materials={lightMaterials}
          view="report"
        />
      ),
    },
  ]
);

// ── §13 Canopy ──────────────────────────────────────────────────────────
// Build the base study then splice in a dusk-townscape companion page
// just after the day-time townscape (same pattern used in §13 Signal Box).
const _canopyBase = studyDesignPages({
  sectionNum: 12,
  sectionLabel: "Canopy",
  slug: "canopy",
  displayName: "Canopy",
  conceptNote: {
    headline: "Low and wide. G+6. The building reaches out to the canal.",
    body: <>
      <p>The Canopy direction activates the canal. It creates a sheltered point at the building's foot connecting the upper path and the lower canal towpath, a small civic room beneath the building's mass.</p>
      <p>Cantilevers earn the area; heavy structure is required for them. Hanging the floors gives roughly 80 m² extra per floor. The challenge: is that area worth it, and is the urbanistic outcome arguably worse for it?</p>
      <p><strong>Only NMA planning required.</strong> Quicker programme.</p>
    </>,
  },
  scheduleData: CANOPY_G6_SCHEDULE,
  axoStages: [
    "The Site",
    "The Activity",
    "The Canopy",
    "The Office",
    "The Elegant Facade",
    "The Landscape",
  ],
});
// Split points inside _canopyBase:
//   0–8  : hero, model, concept sketch, six axos
//   9    : townscape (day)
//   10–11: plan, schedule
const _canopyThroughTownscape = _canopyBase.slice(0, 10);
const _canopyFromPlan         = _canopyBase.slice(10);

// "Canopy, in townscape at dusk" companion page. Slot:
// `canopy-townscape-02-dusk.jpg`. Same PresImage variant/aspect as the
// day-time townscape so the two placeholders render at identical size.
const _canopyDuskPage = (() => {
  const render = () => (
    <PresImage
      filename="canopy-townscape-02-dusk.jpg"
      caption="Canopy in townscape at dusk; the public space at the foot lit, the canal in the foreground, King's Cross silhouettes behind. CGI."
      variant="photo"
      capIdx="Townscape · dusk"
      capTitle="Canopy, in townscape at dusk."
      capMeta="The canopy lit. The public room at the foot. The crossing activated, after dark."
    />
  );
  return {
    label: "Canopy · Townscape at dusk",
    presentation: render,
    report: render,
  };
})();

const SCanopy = sectionPages(
  { sectionId: "canopy-study", sectionNum: 12, sectionTitle: "Canopy", sectionLabel: "Canopy" },
  [
    ..._canopyThroughTownscape,
    _canopyDuskPage,
    ..._canopyFromPlan,
    // Closer, what the Canopy scheme offers
    familyOffersPage({
      sectionNum: 12, sectionLabel: "Canopy",
      kickerLine: "What the scheme offers",
      title: "What the Canopy scheme offers.",
      label: "What the Canopy scheme offers",
      leadPres: "Five things the Canopy scheme gives the site, the building, and the city.",
      leadReport: <p>Before we leave the Canopy scheme, the architectural argument. <em>What it gives back; what it asks for in return.</em> Five things it offers that the alternative does not.</p>,
      offerings: canopyOfferings,
    }),
  ]
);

// ── §15 Signal Box (study) ──────────────────────────────────────────────
// Build the base 16-page study then splice in "The building speaks twice"
// just before the area schedule, then append the offerings closer.
const _signalBoxStudyBase = studyDesignPages({
  sectionNum: 13,
  sectionLabel: "Signal Box (study)",
  slug: "signal-box-study",
  displayName: "Signal Box",
  conceptNote: {
    headline: "Tall and slender. G+8/9. A lightweight lookout marks the crossing.",
    body: <>
      <p>The Signal Box direction activates the wider public realm by marking the crossing from above. The 1820 room sits at the top, the building's reason for being and the place from which "the crossing" is read into the skyline.</p>
      <p>The building is simply supported. No cantilevers, no transfer structure. Lighter on the ground, more discipline at the plan.</p>
      <p><strong>G+8/9, new planning application required.</strong> Longer programme.</p>
    </>,
  },
  scheduleData: SIGNAL_BOX_G8_SCHEDULE,
  axoStages: [
    "The Site",
    "The Activity",
    "The Constraints",
    "The Office",
    "The Elegant Facade",
    "The Signal Box",
  ],
});
const _signalBoxStudySchedulePage = _signalBoxStudyBase[_signalBoxStudyBase.length - 1];
const _signalBoxStudyPagesExcludingSchedule = _signalBoxStudyBase.slice(0, -1);
// Split points: insert custom pages between the studyDesignPages output.
//   0–8  : hero, model, concept sketch, six axos
//   9    : townscape (day)
//   10   : plan
//   11   : schedule (lives at the end via _signalBoxStudySchedulePage)
const _signalBoxAfterAxos = _signalBoxStudyBase.slice(0, 9);
const _signalBoxTownscape = _signalBoxStudyBase.slice(9, 10);
const _signalBoxPlan      = _signalBoxStudyBase.slice(10, 11);

// "Signal Box on the site model" page — the 3D-printed massing study sat
// into the King's Cross context. Slot: `signal-box-on-site.jpg`.
const _signalBoxOnSitePage = (() => {
  const render = () => (
    <PresImage
      filename="signal-box-on-site.jpg"
      caption="Signal Box, building model placed into the King's Cross 3D-printed site context model (top-down photograph)."
      variant="model"
      capIdx="Site model"
      capTitle="Signal Box, on the site."
      capMeta="The building seen in its King's Cross context."
      aspect="4/3"
    />
  );
  return {
    label: "Signal Box · On the site model",
    presentation: render,
    report: render,
  };
})();

// "Signal Box, in townscape at dusk" page — companion to the day-time
// townscape. Slot: `signal-box-study-townscape-02-dusk.jpg`. Shows the
// lookout lit, the 1820 room glowing, the crossing marked at night.
const _signalBoxDuskPage = (() => {
  const render = () => (
    <PresImage
      filename="signal-box-study-townscape-02-dusk.jpg"
      caption="Signal Box in townscape at dusk; the lookout at the top lit from within, the canal in the foreground, King's Cross silhouettes behind. CGI."
      variant="photo"
      capIdx="Townscape · dusk"
      capTitle="Signal Box, in townscape at dusk."
      capMeta="The lookout lit. The 1820 room. The crossing marked, after dark."
    />
  );
  return {
    label: "Signal Box · Townscape at dusk",
    presentation: render,
    report: render,
  };
})();

// "Signal Box, view from King's Cross Platform" page — the building seen
// from inside the station, framed by a departing LNER service. Same
// placeholder size as the other townscape pages (no aspect override,
// variant="photo" default).
const _signalBoxPlatformPage = (() => {
  const render = () => (
    <PresImage
      filename="signal-box-study-townscape-03-platform.jpg"
      caption="Signal Box seen from a King's Cross station platform, train in the foreground, the lookout at the skyline framed by the platform canopies and bridges. CGI."
      variant="photo"
      capIdx="Townscape · platform"
      capTitle="View from King's Cross Platform."
      capMeta="The crossing read from inside the station; the lookout above the platform canopy."
    />
  );
  return {
    label: "Signal Box · View from King's Cross Platform",
    presentation: render,
    report: render,
  };
})();

const SSignalBoxStudy = sectionPages(
  { sectionId: "signal-box-study", sectionNum: 13, sectionTitle: "Signal Box", sectionLabel: "Signal Box (study)" },
  [
    ..._signalBoxAfterAxos,
    _signalBoxOnSitePage,
    ..._signalBoxTownscape,
    _signalBoxDuskPage,
    _signalBoxPlatformPage,
    ..._signalBoxPlan,
    // ── The building speaks twice ────────────────────────────────────
    //   Two pieces of signage, worked into the materials themselves.
    //   The Crossing at the brick. The Crossing at the skyline.
    {
      label: "The building speaks twice",
      presentation: () => (
        <div className="signage">
          <div className="signage__head">
            <Eyebrow>§13 · Signal Box (study) · Signage</Eyebrow>
            <h2 className="h-title">The building speaks twice.</h2>
          </div>
          <div className="signage__cols">
            <div className="signage__col">
              <div className="signage__media">
                <Placeholder filename="signage-01-brick-1820-recessed.jpg" caption="1820 recessed and carved into the engineering brick at ground level. Victorian canal vocabulary, read at arm's reach" variant="material" number="01" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At ground level · in the brick</span>
                <div className="signage__big">The Crossing.</div>
                <div className="signage__sub">Recessed, carved into the masonry at canal level.<br/><em>Where you are.</em></div>
              </div>
            </div>
            <div className="signage__col">
              <div className="signage__media">
                <Placeholder filename="signage-02-aluminium-1820-perforated.jpg" caption="The Crossing, perforated through the lightweight skin of the 1820 belvedere; a lantern at night" variant="material" number="02" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At the skyline · perforated through aluminium</span>
                <div className="signage__big">The Crossing.</div>
                <div className="signage__sub">By day, shadow and depth. By night, a lantern over the canal.<br/><em>Why the building is here.</em></div>
              </div>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="signage">
          <div className="signage__head">
            <Eyebrow>§13 · Signal Box (study) · Signage, the building speaks twice</Eyebrow>
            <h2 className="h-sub">The building speaks twice.</h2>
            <div className="prose tight" style={{maxWidth: '78ch', marginTop: 4}}>
              <p>Two pieces of signage, both worked into the material itself rather than applied to it. At the entrance, the building says <strong>where you are</strong>. At the skyline, <strong>why the building is here</strong>. The crossing is the silent context.</p>
            </div>
          </div>
          <div className="signage__cols">
            <div className="signage__col">
              <div className="signage__media">
                <Placeholder filename="signage-01-brick-1820-recessed.jpg" caption="The Crossing, recessed and carved into the brick at ground level" variant="material" number="01" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At ground level · embossed brick</span>
                <div className="signage__big">The Crossing.</div>
                <div className="signage__sub">Carved and recessed into the engineering brick at the canal threshold. Deep reveals, Victorian canal vocabulary. Read at arm's reach as you arrive on foot.</div>
              </div>
            </div>
            <div className="signage__col">
              <div className="signage__media">
                <Placeholder filename="signage-02-aluminium-1820-perforated.jpg" caption="The Crossing, perforated through the lightweight aluminium of the 1820 belvedere" variant="material" number="02" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At the skyline · perforated aluminium</span>
                <div className="signage__big">The Crossing.</div>
                <div className="signage__sub">Cut through the lightweight skin by perforation. By day, shadow and depth against bright metal. By night, the room glows from within, a soft lantern above the canal, legible from the bridges, St Pancras, Camley Street.</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // Area schedule (was the last page of the base study)
    _signalBoxStudySchedulePage,
    // Closer, what the Signal Box scheme offers
    familyOffersPage({
      sectionNum: 13, sectionLabel: "Signal Box (study)",
      kickerLine: "What the scheme offers",
      title: "What the Signal Box scheme offers.",
      label: "What the Signal Box scheme offers",
      leadPres: "Five things the Signal Box scheme gives the site, the building, and the city.",
      leadReport: <p>Before we leave the Signal Box scheme, the architectural argument. <em>What it gives back; what it asks for in return.</em> Five things it offers that the alternative does not.</p>,
      offerings: signalBoxStudyOfferings,
    }),
  ]
);

// ════════════════════════════════════════════════════════════════════════
// PART IV — Quality and clarity of vision (THE BUILD)
// ════════════════════════════════════════════════════════════════════════
//
// Structure (in order):
//   1.  S_IV_Contents      Part IV contents page (1)
//   2.  S_IV_Buildup       Buildup, 6 watercolour axos + 1 model reveal (7)
//   3.  S_IV_Public        For the public, 8 full bleeds (8)
//   4.  S_IV_TenantWalk    For the tenant, 8 full bleeds (8)
//   5.  S_IV_Materials     Glazing, Flexi Brick, 2 details (4)
//   6.  S_IV_Videos        Construction sequence + walk-through (2)
//   7.  S_IV_Plans         Ground / Mezz / Typical / Top / Section (5)
//   8.  S_IV_AreaSchedule  Area schedule (1)
//   9.  S_IV_FinalSummary  "This is the building." four sentences (1)
//
// Sentinel sectionNums >= 100 so the rail renders these un-numbered.
// All image slots are placeholders. Video slots use a click-to-play
// component with poster image. Final summary contains the four locked
// sentences answering the brief's four evaluation criteria.

// Small helpers used across Part IV ───────────────────────────────────

// VideoSlide. Click-to-play full-bleed video with a poster image
// underneath. No autoplay. Pauses cleanly when the slide is left
// (handled by `pagehide` on the page wrapper, which fires on
// navigation). Native controls hidden, replaced with a single
// affordance ("▶ Play") centred over the poster. While playing, a
// small pause/restart cluster sits bottom-right.
// Load Vimeo's official Player.js library once, on first render of any
// VimeoSlide. Returns a promise that resolves when window.Vimeo.Player is
// available. Multiple slides share the same single script load.
let _vimeoLoaderPromise = null;
function loadVimeoPlayer() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Vimeo && window.Vimeo.Player) return Promise.resolve(window.Vimeo.Player);
  if (_vimeoLoaderPromise) return _vimeoLoaderPromise;
  _vimeoLoaderPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://player.vimeo.com/api/player.js';
    s.async = true;
    s.onload = () => resolve(window.Vimeo && window.Vimeo.Player);
    s.onerror = () => reject(new Error('Failed to load Vimeo Player.js'));
    document.head.appendChild(s);
  });
  return _vimeoLoaderPromise;
}

function VimeoSlide({ vimeoId, label }) {
  // Full-bleed Vimeo embed using the official Vimeo Player.js library.
  // dnt=1 = do-not-track; title/byline/portrait off keeps the chrome clean.
  // quality=1080p forces HD if the source is 1080p and the viewer's Vimeo
  // account/plan supports it. Falls back to auto if not available.
  // On 'ended' we pause + seek to 0 immediately, so the recommendations
  // overlay never has a chance to appear and the viewer sees the poster
  // frame again with the play button on it.
  const iframeRef = React.useRef(null);
  const src = `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0&dnt=1&quality=1080p`;

  React.useEffect(() => {
    let player;
    let cancelled = false;
    loadVimeoPlayer().then((Player) => {
      if (cancelled || !Player || !iframeRef.current) return;
      player = new Player(iframeRef.current);
      // The order matters: pause first, then seek to 0. Doing setCurrentTime
      // alone can leave the player visually finished, which is what triggers
      // the end-screen overlay.
      player.on('ended', () => {
        try {
          player.pause().then(() => player.setCurrentTime(0)).catch(() => {});
        } catch { /* ignore */ }
      });
    }).catch(() => { /* silently ignore — player just won't auto-rewind */ });
    return () => {
      cancelled = true;
      if (player) {
        try { player.destroy(); } catch { /* ignore */ }
      }
    };
  }, [vimeoId]);

  return (
    <div className="pc-cover" style={{position: 'absolute', inset: 0, background: '#000'}}>
      <iframe
        ref={iframeRef}
        src={src}
        title={`Vimeo ${vimeoId}`}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
        allowFullScreen
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
      />
      {label ? (
        <div className="mono" style={{position: 'absolute', bottom: 24, right: 24, color: 'var(--accent)', fontSize: 11, letterSpacing: 0.18, textTransform: 'uppercase', background: 'rgba(0,0,0,0.45)', padding: '4px 10px', pointerEvents: 'none', zIndex: 2}}>{label}</div>
      ) : null}
    </div>
  );
}

function VideoSlide({ filename, poster, caption, label, big = false }) {
  const ref = React.useRef(null);
  const wrapRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const pause = () => { if (ref.current) { ref.current.pause(); setPlaying(false); } };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (!e.isIntersecting) pause(); });
    }, { threshold: 0.4 });
    obs.observe(wrap);
    return () => obs.disconnect();
  }, []);

  const handleToggle = () => {
    const v = ref.current; if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); setStarted(true); }
    else          { v.pause(); setPlaying(false); }
  };
  const handleRestart = (e) => {
    e.stopPropagation();
    const v = ref.current; if (!v) return;
    v.currentTime = 0; v.play().catch(() => {}); setPlaying(true); setStarted(true);
  };

  return (
    <div ref={wrapRef} className="pc-cover" style={{position: 'absolute', inset: 0, background: '#000', cursor: 'pointer'}} onClick={handleToggle}>
      <video
        ref={ref}
        src={`/videos/${filename}`}
        poster={poster ? `/images/${poster}` : undefined}
        preload="metadata"
        playsInline
        controls={false}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}}
        onEnded={() => setPlaying(false)}
        aria-label={caption}
      />
      {!started || !playing ? (
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'}}>
          <div className="mono" style={{padding: '14px 22px', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 14, letterSpacing: 0.2, textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.3)'}}>
            ▶ {started ? 'Resume' : 'Play'}
          </div>
        </div>
      ) : null}
      {started ? (
        <div style={{position: 'absolute', bottom: 20, left: 20, display: 'flex', gap: 8, pointerEvents: 'auto'}} onClick={(e) => e.stopPropagation()}>
          <button onClick={handleToggle} className="mono" style={{padding: '6px 12px', fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase', background: 'rgba(0,0,0,0.55)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer'}}>{playing ? 'Pause' : 'Resume'}</button>
          <button onClick={handleRestart} className="mono" style={{padding: '6px 12px', fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase', background: 'rgba(0,0,0,0.55)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer'}}>Restart</button>
        </div>
      ) : null}
      {label ? (
        <div className="mono" style={{position: 'absolute', bottom: 24, right: 24, color: 'var(--accent)', fontSize: 11, letterSpacing: 0.18, textTransform: 'uppercase', background: 'rgba(0,0,0,0.45)', padding: '4px 10px'}}>{label}</div>
      ) : null}
    </div>
  );
}

// Full-bleed image slide with a small corner label and optional title.
// Used for the buildup, public, tenant, plan, and detail series.
function FullBleedSlide({ filename, caption, label, title, alignRight }) {
  return (
    <PresCover
      filename={filename}
      caption={caption}
      overlayMode="mini"
      align={alignRight ? "right" : undefined}
      overlay={(
        <>
          {label ? <span className="mono" style={{color: 'var(--accent)', fontWeight: 500}}>{label}</span> : null}
          {title ? <h1 className="h-display" style={{fontSize: 28, lineHeight: 1.02, margin: 0}}>{title}</h1> : null}
        </>
      )}
    />
  );
}

// 1. PART IV CONTENTS PAGE ────────────────────────────────────────────

const S_IV_Contents = sectionPages(
  { sectionId: "iv-contents", sectionNum: 130, sectionTitle: "Part IV contents", sectionLabel: "Contents" },
  [
    {
      label: "Part IV contents",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Part IV · Quality and clarity of vision</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>What follows.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 22}}>
            The building, told as the public and the tenant will meet it.
          </div>
          <ol className="numlist">
            {[
              { t: "The buildup.",            s: "Watercolour axos from the canal up to the signal box, resolving into the model." },
              { t: "For the public.",          s: "Views, canal threshold, the gift to King's Cross, and the mark on the crossing." },
              { t: "For the tenant.",          s: "Front door, lobby, lift, floor plate, top floor." },
              { t: "Materials.",               s: "Glazing, Flexi Brick, and the construction details where they meet." },
              { t: "Two videos.",              s: "Construction sequence, then a walk combining the public and tenant journeys." },
              { t: "Plans, section, schedule.", s: "The technical record, ending on a one-page summary." },
            ].map((b, i) => (
              <li className="numlist__item" key={i}>
                <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
                <div>
                  <div className="numlist__title">{b.t}</div>
                  <div style={{fontSize: 13, color: 'var(--fg-soft)', lineHeight: 1.4, marginTop: 2}}>{b.s}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Part IV · Quality and clarity of vision</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 10}}>What follows.</h2>
          <div className="prose tight" style={{maxWidth: '78ch'}}>
            <p>Part IV is the building. It is told in the order it is met: first as a buildup of form, watercolour axos that resolve into the model. Then as a public threshold, the views, the canal, and the gift to King's Cross. Then as a tenant journey, from front door to top floor. Then the materials, glazing and Flexi Brick, and the details where they meet. Two short videos follow, a construction sequence and a combined walk, before the technical backmatter, plans, section, and area schedule, and a final one-page summary stating in four sentences what the deck is for.</p>
          </div>
        </div>
      ),
    },
  ]
);

// 2. BUILDUP — 6 watercolour axos + 1 model reveal ────────────────────

const S_IV_Buildup = sectionPages(
  { sectionId: "iv-buildup", sectionNum: 131, sectionTitle: "The buildup", sectionLabel: "The buildup" },
  [
    { label: "Buildup 01", presentation: () => <FullBleedSlide filename="buildup-01.jpg" caption="Watercolour axo 01, the canal level brick body" label="The buildup · 01" />, report: () => <FullBleedSlide filename="buildup-01.jpg" caption="Watercolour axo 01, the canal level brick body" label="The buildup · 01" /> },
    { label: "Buildup 02", presentation: () => <FullBleedSlide filename="buildup-02.jpg" caption="Watercolour axo 02, the brick body rising" label="The buildup · 02" />, report: () => <FullBleedSlide filename="buildup-02.jpg" caption="Watercolour axo 02, the brick body rising" label="The buildup · 02" /> },
    { label: "Buildup 03", presentation: () => <FullBleedSlide filename="buildup-03.jpg" caption="Watercolour axo 03, the body to the canopy" label="The buildup · 03" />, report: () => <FullBleedSlide filename="buildup-03.jpg" caption="Watercolour axo 03, the body to the canopy" label="The buildup · 03" /> },
    { label: "Buildup 04", presentation: () => <FullBleedSlide filename="buildup-04.jpg" caption="Watercolour axo 04, the floor plates emerging" label="The buildup · 04" />, report: () => <FullBleedSlide filename="buildup-04.jpg" caption="Watercolour axo 04, the floor plates emerging" label="The buildup · 04" /> },
    { label: "Buildup 05", presentation: () => <FullBleedSlide filename="buildup-05.jpg" caption="Watercolour axo 05, the body to the transfer and signal box" label="The buildup · 05" />, report: () => <FullBleedSlide filename="buildup-05.jpg" caption="Watercolour axo 05, the body to the transfer and signal box" label="The buildup · 05" /> },
    { label: "Buildup 06", presentation: () => <FullBleedSlide filename="buildup-06.jpg" caption="Watercolour axo 06, the Signal Box at the top" label="The buildup · 06" />, report: () => <FullBleedSlide filename="buildup-06.jpg" caption="Watercolour axo 06, the Signal Box at the top" label="The buildup · 06" /> },
    { label: "Buildup 07", presentation: () => <FullBleedSlide filename="buildup-07.jpg" caption="Watercolour axo 07" label="The buildup · 07" />, report: () => <FullBleedSlide filename="buildup-07.jpg" caption="Watercolour axo 07" label="The buildup · 07" /> },
    { label: "4 Primary Elements", presentation: () => <FullBleedSlide filename="primary-elements.jpg" caption="The four primary elements of the scheme" label="4 Primary Elements" />, report: () => <FullBleedSlide filename="primary-elements.jpg" caption="The four primary elements of the scheme" label="4 Primary Elements" /> },
    { label: "Model", presentation: () => <FullBleedSlide filename="buildup-model-02.jpg" caption="Full-bleed model photograph of the scheme" label="Model" />, report: () => <FullBleedSlide filename="buildup-model-02.jpg" caption="Full-bleed model photograph of the scheme" label="Model" /> },
  ]
);

// 3. FOR THE PUBLIC — 8 full bleeds ───────────────────────────────────

// Each slide carries its own descriptive corner label `l`, drawn from
// the dictation about where in the city each view is taken. The longer
// `c` (caption) is the full descriptive text used for image alt.
// Order and filenames preserved from the original sequence.
// Filenames are the descriptive names of each render. Master copies live
// in OneDrive at "The Crossing/CGIs/City Walk/"; the deck reads working
// copies from public/images/. Re-numbering the prefix matches the order
// the audience sees in the deck.
const PUBLIC_SLIDES = [
  { f: "01-from-the-wildlife-centre.jpg",            l: "From the Wildlife Centre",            c: "View from the Wildlife Centre, looking towards The Crossing", curated: true },
  { f: "02-from-the-east-along-the-canal.jpg",       l: "From the east, along the canal",      c: "Walking towards King's Cross from the east, along the canal" },
  { f: "03-from-camley-street-near-st-pancras.jpg",  l: "From Camley Street, near St Pancras", c: "Looking up from Camley Street, near St Pancras station, towards The Crossing" },
  { f: "04-from-york-way-looking-north.jpg",         l: "From York Way, looking north",        c: "The Crossing seen from York Way, looking north", curated: true },
  { f: "05-from-the-kings-cross-platforms.jpg",      l: "From the King's Cross platforms",     c: "From the King's Cross station platforms, looking out at The Crossing" },
  { f: "06-from-granary-square.jpg",                 l: "From Granary Square",                 c: "From Granary Square, The Crossing on the skyline" },
  { f: "07-across-the-canal-a-summers-day.jpg",      l: "Across the canal, a summer's day",    c: "Across the canal on a summer's day, The Crossing reflected in the water", curated: true },
  { f: "08-from-the-towpath.jpg",                    l: "From the towpath",                    c: "From the towpath on the canal, the brick body and the Signal Box above" },
  { f: "09-the-gap-to-the-google-building.jpg",      l: "The gap to the Google building",      c: "The gap between The Crossing and the Google building at King's Cross station" },
  { f: "10-across-the-canal-word-on-the-water.jpg",  l: "Across the canal, Word on the Water", c: "Across the canal, the character of the canal with Word on the Water bookshop boat in the foreground" },
  { f: "11-1852-public-space.jpg",                   l: "1852 public space",                   c: "The 1852 public space at the foot of The Crossing", curated: true },
  { f: "12-1852-cafe.jpg",                           l: "1852 café",                           c: "The 1852 café at the canal threshold" },
  { f: "15-inside-the-1852-cafe.jpg",                l: "Inside the 1852 café",                c: "Inside the 1852 café", curated: true },
  { f: "16-1852-cafe-and-canal.jpg",                 l: "1852 café and canal",                 c: "The 1852 café, looking out to the canal" },
  { f: "17-1852-cafe-detail.jpg",                    l: "1852 café detail",                    c: "1852 café, interior detail" },
];

// Thin horizontal rule sitting in the gap above the canal-family grid.
function CanalFamilyRule() {
  return (
    <div style={{
      borderTop: '1px solid var(--rule, rgba(0,0,0,0.18))',
      marginTop: 14, marginBottom: 6,
    }} />
  );
}

// Boxed "Thank you" sign-off positioned in the empty top-right space of the
// closing microcosm slide. Sits above the rule that divides the heading
// section from the canal-family grid. The shadow gives it a slight lift.
function ThankYouBox() {
  return (
    <div style={{
      // top aligns with the H1 "A historic, commercially and culturally
      // contextual building." baseline on the left side of the page.
      position: 'absolute', top: 152, right: 56, zIndex: 3, pointerEvents: 'none',
      background: '#FFFFFF',
      padding: '22px 32px 26px 32px',
      border: '1px solid rgba(0,0,0,0.12)',
      boxShadow: '0 14px 28px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.10)',
      minWidth: 280, textAlign: 'right',
    }}>
      <span className="h-display" style={{
        fontFamily: 'var(--ff-display)',
        fontStyle: 'italic',
        fontSize: 56, lineHeight: 1.0, color: 'var(--fg, #111)',
        display: 'inline-block',
      }}>Thank you.</span>
    </div>
  );
}

const S_IV_Public = sectionPages(
  { sectionId: "iv-public", sectionNum: 132, sectionTitle: "City Walk", sectionLabel: "City Walk" },
  PUBLIC_SLIDES.map((p) => ({
    label: p.l,
    presentation: () => <FullBleedSlide filename={p.f} caption={p.c} label={p.l} />,
    report:       () => <FullBleedSlide filename={p.f} caption={p.c} label={p.l} />,
    // Curation default flipped to FALSE — only slides with an explicit
    // `curated: true` flag appear in the curated set. (Phil dictates the
    // keepers slide by slide; see PUBLIC_SLIDES / TENANT_SLIDES above.)
    inCurated: p.curated === true,
  }))
);

// 4. FOR THE TENANT — 8 full bleeds, ends on top floor ────────────────

// Same descriptive-naming pattern as PUBLIC_SLIDES above. Master copies
// live in OneDrive at "The Crossing/CGIs/Tenant Walk/".
const TENANT_SLIDES = [
  { f: "01-view-looking-south-on-york-way.jpg",                                       l: "View looking south on York Way",                                       c: "View looking south on York Way" },
  { f: "02-the-corner-of-the-crossing-with-the-entrance-to-the-offices.jpg",          l: "The corner of The Crossing, with the entrance to the offices",         c: "Looking at the corner of The Crossing with the entrance of the offices", curated: true },
  { f: "03-the-entrance.jpg",                                                         l: "The entrance",                                                          c: "The entrance", curated: true },
  { f: "04-the-soft-lobby.jpg",                                                       l: "The soft lobby",                                                        c: "The soft lobby", curated: true },
  { f: "05-reception-desk-detail.jpg",                                                l: "Reception desk detail",                                                 c: "Reception desk, detail" },
  { f: "06-lift-lobby-and-connection-to-cafe.jpg",                                    l: "Lift lobby and connection to café",                                     c: "Lift lobby and the connection to the café" },
  { f: "07-view-into-the-bike-store.jpg",                                             l: "View into the bike store",                                              c: "View into the bike store" },
  { f: "08-lift-detail.jpg",                                                          l: "Lift detail",                                                           c: "Lift, detail" },
  { f: "09-brick-lift-lobby.jpg",                                                     l: "Brick lift lobby",                                                      c: "Brick lift lobby" },
  { f: "office-floor-reception.jpg",                                                  l: "Office floor reception",                                                c: "Office floor reception", curated: true },
  { f: "10-typical-office-floor-plate.jpg",                                           l: "Typical office floor plate",                                            c: "Typical office floor plate" },
  { f: "11-brick-filigree-with-kings-cross-view.jpg",                                 l: "Brick filigree with King's Cross view",                                 c: "Brick filigree with a King's Cross view beyond", curated: true },
  { f: "12-meeting-room.jpg",                                                         l: "Meeting room",                                                          c: "Meeting room" },
  { f: "13-balcony-view.jpg",                                                         l: "Balcony view",                                                          c: "Balcony view" },
  { f: "14-super-loo.jpg",                                                            l: "Super loo",                                                             c: "Super loo" },
  { f: "15-natural-light-to-the-lift-lobby.jpg",                                      l: "Natural light to the lift lobby",                                       c: "Natural light into the lift lobby" },
  { f: "16-co-working-space-the-1820-room.jpg",                                       l: "Co-working space, the 1820 room",                                       c: "Co-working space in the 1820 room", curated: true },
  { f: "17-detail-of-structural-truss.jpg",                                           l: "Detail of structural truss",                                            c: "Detail of the structural truss" },
  { f: "18-more-natural-co-working-space-the-1820-room.jpg",                          l: "More natural co-working space, the 1820 room",                          c: "A second co-working moment in the 1820 room, more natural light" },
  { f: "19-wisteria-hanging-from-brick-slip-detail.jpg",                              l: "Wisteria hanging from brick slip, detail",                              c: "Detail of wisteria hanging from a brick slip" },
  { f: "20-event-space-the-1820-room-yoga.jpg",                                       l: "Event space, the 1820 room — yoga",                                     c: "Event space in the 1820 room, set up for a yoga class" },
  { f: "21-brick-floor-the-multipurpose-1820-room.jpg",                               l: "Brick floor, the multipurpose 1820 room",                               c: "Brick floor detail, supporting the multipurpose use of the 1820 room" },
  { f: "22-the-1820-room-the-permanent-wine-bar-and-restaurant.jpg",                  l: "The 1820 room — the permanent wine bar and restaurant",                 c: "The 1820 room as the permanent wine bar and restaurant", curated: true },
  { f: "24-view-across-granary-square-and-kings-cross-from-the-1820-room.jpg",        l: "View across Granary Square and King's Cross from the 1820 room",        c: "View across Granary Square and King's Cross station, from the 1820 room" },
  { f: "25-new-years-eve-the-1820-room.jpg",                                          l: "New Year's Eve, the 1820 room",                                         c: "New Year's Eve in the 1820 room" },
  { f: "26-sunset-the-1820-room.jpg",                                                 l: "Sunset, the 1820 room",                                                 c: "Sunset in the 1820 room", curated: true },
  { f: "27-the-1820-room-the-crossing.jpg",                                           l: "The 1820 room — The Crossing",                                          c: "The 1820 room, The Crossing" },
];

const S_IV_TenantWalk = sectionPages(
  { sectionId: "iv-tenant-walk", sectionNum: 133, sectionTitle: "Tenant Walk", sectionLabel: "Tenant Walk" },
  TENANT_SLIDES.map((p) => ({
    label: p.l,
    presentation: () => <FullBleedSlide filename={p.f} caption={p.c} label={p.l} alignRight={p.r} />,
    report:       () => <FullBleedSlide filename={p.f} caption={p.c} label={p.l} alignRight={p.r} />,
    // Curation default flipped to FALSE — see PUBLIC_SLIDES note above.
    inCurated: p.curated === true,
  }))
);

// 5a. MATERIALS BREAKER + SAMPLES BOARD ───────────────────────────────
//     Bridges the tenant walk to the materials section. Two pages: a
//     full-bleed breaker ("What is The Crossing made of?") followed by a
//     samples board page (image on the left, live-text key on the right).
//     The key entries are kept in sync with the numbered circles drawn
//     onto the samples-board image.

const SAMPLES_KEY = [
  { n: "01", title: "Brick slip",                       sub: "Real brick, fired and slipped, hung on a lightweight backing as the building's body." },
  { n: "02", title: "Dark aluminium plate",             sub: "A second body, same size as the brick slip, swapped where weight matters." },
  { n: "03", title: "Stainless-steel wire",             sub: "The flexible substrate. The textile that holds the brick and the plate." },
  { n: "04", title: "Glazing",                          sub: "Clear, low-iron. One profile family across the body, the Canopy and the Signal Box." },
  { n: "05", title: "Bronze aluminium",                 sub: "For interiors. Lift doors, reveals, signage, tenant-side hardware." },
  { n: "06", title: "Curtain",                          sub: "Soft, tenant-side. Acoustic, light-modulating, warm." },
  { n: "07", title: "Leather",                          sub: "Reception desk, handrails, joinery touch points. The hand of the building." },
  { n: "08", title: "Neon light",                       sub: "A small, deliberate sign. The mark on the crossing, lit." },
];

const S_IV_MaterialsBreaker = sectionPages(
  { sectionId: "iv-materials-breaker", sectionNum: 139, sectionTitle: "What is The Crossing made of?", sectionLabel: "Made of" },
  [
    // Breaker page ─────────────────────────────────────────────────
    {
      label: "What is The Crossing made of?",
      presentation: () => (
        <div className="pc-stmt pc-stmt--centre" style={{maxWidth: '64ch', width: '100%', justifyContent: 'center'}}>
          <Eyebrow>Part IV · Materials</Eyebrow>
          <h1 className="h-display" style={{fontSize: 64, lineHeight: 1.02, margin: 0, textAlign: 'center'}}>What is The Crossing made of?</h1>
        </div>
      ),
      report: () => (
        <div className="pc-stmt pc-stmt--centre" style={{maxWidth: '64ch', width: '100%', justifyContent: 'center'}}>
          <Eyebrow>Part IV · Materials</Eyebrow>
          <h1 className="h-display" style={{fontSize: 64, lineHeight: 1.02, margin: 0, textAlign: 'center'}}>What is The Crossing made of?</h1>
        </div>
      ),
    },
    // Samples board page ───────────────────────────────────────────
    {
      label: "Samples board",
      presentation: () => (
        <div style={{display: 'grid', gridTemplateColumns: '1.55fr 1fr', columnGap: 28, height: '100%', minHeight: 0, alignItems: 'stretch'}}>
          {/* LEFT — full-bleed samples board image */}
          <div style={{position: 'relative', overflow: 'hidden', background: '#f4ede4', border: '1px solid var(--rule-soft)'}}>
            <Placeholder filename="samples-board.jpg" variant="material" fill fitMode="contain" caption="Samples board, the materials of The Crossing arranged as a flat lay with numbered circles 01-08" />
          </div>
          {/* RIGHT — live-text key */}
          <div style={{display: 'flex', flexDirection: 'column', minWidth: 0, paddingTop: 2}}>
            <Eyebrow>The samples board</Eyebrow>
            <h2 className="h-title" style={{marginTop: 14, marginBottom: 4, fontSize: 26, lineHeight: 1.05}}>The Crossing, in eight pieces.</h2>
            <div style={{fontSize: 13, color: 'var(--fg-soft)', lineHeight: 1.45, marginBottom: 16}}>
              Numbered to match the board.
            </div>
            <ol style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11}}>
              {SAMPLES_KEY.map((k) => (
                <li key={k.n} style={{display: 'grid', gridTemplateColumns: '28px 1fr', columnGap: 10, alignItems: 'start'}}>
                  <span aria-hidden style={{width: 24, height: 24, borderRadius: '50%', background: '#000', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: 0.04, fontWeight: 500}}>{k.n}</span>
                  <div>
                    <div style={{fontFamily: 'var(--ff-display)', fontSize: 13, lineHeight: 1.25, color: 'var(--fg)', fontWeight: 500}}>{k.title}</div>
                    <div style={{fontSize: 11, color: 'var(--fg-soft)', lineHeight: 1.35, marginTop: 2}}>{k.sub}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ),
      report: () => (
        <div style={{display: 'grid', gridTemplateColumns: '1.55fr 1fr', columnGap: 28, height: '100%', minHeight: 0, alignItems: 'stretch'}}>
          <div style={{position: 'relative', overflow: 'hidden', background: '#f4ede4', border: '1px solid var(--rule-soft)'}}>
            <Placeholder filename="samples-board.jpg" variant="material" fill fitMode="contain" caption="Samples board, the materials of The Crossing arranged as a flat lay with numbered circles 01-08" />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', minWidth: 0, paddingTop: 2}}>
            <Eyebrow>The samples board</Eyebrow>
            <h2 className="h-title" style={{marginTop: 14, marginBottom: 4, fontSize: 26, lineHeight: 1.05}}>The Crossing, in eight pieces.</h2>
            <div style={{fontSize: 13, color: 'var(--fg-soft)', lineHeight: 1.45, marginBottom: 16}}>
              Numbered to match the board.
            </div>
            <ol style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11}}>
              {SAMPLES_KEY.map((k) => (
                <li key={k.n} style={{display: 'grid', gridTemplateColumns: '28px 1fr', columnGap: 10, alignItems: 'start'}}>
                  <span aria-hidden style={{width: 24, height: 24, borderRadius: '50%', background: '#000', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: 0.04, fontWeight: 500}}>{k.n}</span>
                  <div>
                    <div style={{fontFamily: 'var(--ff-display)', fontSize: 13, lineHeight: 1.25, color: 'var(--fg)', fontWeight: 500}}>{k.title}</div>
                    <div style={{fontSize: 11, color: 'var(--fg-soft)', lineHeight: 1.35, marginTop: 2}}>{k.sub}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ),
    },
  ]
);

// 5. MATERIALS — Glazing, Flexi Brick, 2 details ──────────────────────

// Flexibrick case-study image inventory. Files live in
// `public/images/flexibrick/`. Grouped by theme (what aspect of the
// MATERIAL each row demonstrates — light, cost, landscape, scale,
// detail). The italic `sub` placeholder is where the project names
// + short material-property sentence will go; Phil dictates these
// after the page lands.
// Light theme removed — page 1 was too crowded. Order across the 2 pages
// now reads: Scale → Detail (page 1), Landscape → Cost (page 2).
// `project` renders as a small caption underneath each row's image grid.
const FLEXIBRICK_THEMES = [
  { key: "scale",     label: "Scale",     project: "Mileone 22@, Barcelona",       sub: "The system run at full building scale across the façade of a tech-district block.", imgs: ["flexibrick/scale-01.jpg",     "flexibrick/scale-02.jpg",     "flexibrick/scale-03.jpg"] },
  { key: "detail",    label: "Detail",    project: "Fabra & Coats Art Factory, Barcelona", sub: "Manuel Ruisánchez & Francesc Bacardit. Dry modular brick mesh over glazed façades; visual lightness and passive solar protection.", imgs: ["flexibrick/detail-01.jpg",    "flexibrick/detail-02.jpg",    "flexibrick/detail-03.jpg"] },
  { key: "landscape", label: "Landscape", project: "Niel Barracks, Antwerp",       sub: "Michèle & Miquel. Parade ground (220 × 90 m) reborn as a public park; the brick mesh laid as a ground-plane fabric.", imgs: ["flexibrick/landscape-01.jpg", "flexibrick/landscape-02.jpg", "flexibrick/landscape-03.jpg"] },
  { key: "cost",      label: "Cost",      project: "Embassy Gardens, for Ballymore", sub: "Glenn Howells. Custom red ceramic lattice; fireproof, dry-installed in weeks, removed the need for mechanical ventilation.",  imgs: ["flexibrick/cost-01.jpg",      "flexibrick/cost-02.jpg",      "flexibrick/cost-03.jpg"] },
];

function FlexibrickThemeRow({ theme }) {
  return (
    <div style={{display: 'grid', gridTemplateColumns: '180px minmax(0, 1fr)', columnGap: 18, alignItems: 'stretch'}}>
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 4}}>
        <div className="h-display" style={{fontSize: 22, lineHeight: 1.0, marginBottom: 4}}>{theme.label}.</div>
        <div className="prose" style={{fontStyle: 'italic', fontSize: 11, lineHeight: 1.25, color: 'var(--fg-soft)', maxWidth: '20ch'}}>{theme.sub}</div>
      </div>
      <div>
        <div style={{display: 'grid', gridTemplateColumns: `repeat(${theme.imgs.length}, minmax(0, 1fr))`, gap: 10}}>
          {theme.imgs.map((f, i) => (
            <div key={i} style={{aspectRatio: '4 / 3', overflow: 'hidden', background: '#000'}}>
              <Placeholder filename={f} variant="case" aspect="4/3" caption={`Flexbrick ${theme.label} case study ${i+1}`} />
            </div>
          ))}
        </div>
        {theme.project ? (
          <div className="mono" style={{marginTop: 6, fontSize: 11, letterSpacing: 0.18, textTransform: 'uppercase', color: 'var(--fg-soft)'}}>{theme.project}</div>
        ) : null}
      </div>
    </div>
  );
}

function FlexibrickCaseStudiesPage({ page }) {
  // Page 1 → Scale (4 imgs), Detail (4 imgs) — the heavier rows.
  // Page 2 → Landscape (3 imgs), Cost (3 imgs).
  const themesByPage = {
    1: FLEXIBRICK_THEMES.filter(t => ["scale","detail"].includes(t.key)),
    2: FLEXIBRICK_THEMES.filter(t => ["landscape","cost"].includes(t.key)),
  };
  const themes = themesByPage[page] || [];
  return (
    <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
      <Eyebrow>Materials · Flexibrick</Eyebrow>
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14}}>
        <h2 className="h-title" style={{margin: 0}}>Flexibrick · Case Studies.</h2>
        <span className="mono" style={{fontSize: 11, color: 'var(--fg-soft)', letterSpacing: 0.18, textTransform: 'uppercase'}}>{page} / 2</span>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
        {themes.map(t => <FlexibrickThemeRow key={t.key} theme={t} />)}
      </div>
    </div>
  );
}

const S_IV_Materials = sectionPages(
  { sectionId: "iv-materials", sectionNum: 134, sectionTitle: "Materials", sectionLabel: "Materials" },
  [
    // Glazing page removed — the glazing argument now sits inside the
    // samples-board key (item 04) and the construction details that
    // follow do the work of showing how the glazing meets the brick.
    // Flexi Brick + alternatives ────────────────────────────────────
    {
      label: "Materials · Flexi Brick",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Materials · Flexi Brick</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>Flexi Brick.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 22}}>
            A skin fabric of brick slips. One simple device that makes the Canopy at the ground and the Signal Box at the top.
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 480px', gap: 36, alignItems: 'start'}}>
            <ol className="numlist">
              {[
                "Brick slips threaded onto a flexible stainless-steel mesh. A textile of brick, prefabricated in Barcelona.",
                "Hung on site as a lightweight rainscreen. Fast install, low dead load, low embodied carbon against a loadbearing wall.",
                "Pixel density, pattern, colour and shape vary across the same skin, so we can open the courses where we want light through, around and into every floor plate.",
                "One device does both big moves. It shapes the Canopy at the foot of the building, and it shapes the Signal Box at the top.",
                "The system also takes ceramic, aluminium and other pieces in place of brick slips, with the same mesh and install method. For The Crossing we have chosen brick slips, the canal-brick body the site asks for.",
              ].map((t, i) => (
                <li className="numlist__item" key={i}>
                  <span className="numlist__num">{String(i+1).padStart(2,"0")}</span>
                  <div><div className="numlist__title">{t}</div></div>
                </li>
              ))}
            </ol>
            <div style={{width: 480}}>
              <div style={{width: 480, height: 480}}>
                <Placeholder filename="materials-flexi-brick.jpg" variant="material" aspect="1/1" caption="Flexi Brick panel detail, perforated section showing light passage" />
              </div>
              <div className="mono" style={{marginTop: 6, fontSize: 11, letterSpacing: 0.18, textTransform: 'uppercase', color: 'var(--fg-soft)'}}>TR House, Barcelona</div>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Materials · Flexi Brick</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 10}}>Flexi Brick.</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 36, alignItems: 'start'}}>
            <div className="prose tight" style={{maxWidth: '64ch'}}>
              <p>The body of the building is <strong>Flexbrick</strong>, a Barcelona system best understood as a <em>skin fabric of brick slips</em>. Pieces are threaded onto a flexible stainless-steel cable mesh in the factory, and the resulting panels or rolls are hung on site as a lightweight, prefabricated rainscreen. For The Crossing we have chosen brick slips, the canal-brick body the site asks for, but the system equally accepts ceramic, aluminium and other pieces, with the same mesh and install method unchanged. Either way it gives us the body without the dead load, the wet trade, or the embodied carbon of a fully loadbearing brick envelope. The transfer at the top and the slimness of the floor plate both depend on it.</p>
              <p><strong>One device does both big moves.</strong> The same Flexbrick that makes the body shapes the <strong>Canopy</strong> at the foot of the building, where the system curves into the public room at the ground, and shapes the <strong>Signal Box</strong> at the top, where it opens into the lookout. The building reads as a single material proposition: brick, end to end, top to bottom, public to tenant. Where the body meets a floor plate we open the coursing, so daylight passes around and into the office space behind. The plates read inside as brick reveals with light through them; the body reads outside as a continuous canal brick.</p>
              <p><strong>The alternatives in the same system are ceramic, aluminium, and other pieces.</strong> The Flexbrick mesh is material-agnostic and will accept any of these in place of brick slips, with the geometry, prefabrication, and install method unchanged. We have stayed with brick because it is the canal-brick body the site asks for, but the trade-offs are kept live on the Calculator: a recycled-content aluminium grade is lighter still at similar embodied carbon, and the supplier's commitments on embodied carbon and on appearance can be compared directly within the same system.</p>
            </div>
            <div style={{width: 420}}>
              <div style={{width: 420, height: 420}}>
                <Placeholder filename="materials-flexi-brick.jpg" variant="material" aspect="1/1" caption="Flexi Brick panel detail, perforated section showing light passage" />
              </div>
              <div className="mono" style={{marginTop: 6, fontSize: 11, letterSpacing: 0.18, textTransform: 'uppercase', color: 'var(--fg-soft)'}}>TR House, Barcelona</div>
            </div>
          </div>
        </div>
      ),
    },
    // Flexibrick · Case Studies — page 1 of 2 ──────────────────────
    // 3 theme rows (Light, Cost, Landscape), 3 images per row. Each
    // theme has a placeholder italic sub-line ready for project names
    // + a short descriptive sentence about the MATERIAL property.
    {
      label: "Flexibrick · Case Studies (1/2)",
      presentation: () => <FlexibrickCaseStudiesPage page={1} />,
      report:       () => <FlexibrickCaseStudiesPage page={1} />,
    },
    // Flexibrick · Case Studies — page 2 of 2 ──────────────────────
    // 2 theme rows (Scale, Detail), 4 images per row.
    {
      label: "Flexibrick · Case Studies (2/2)",
      presentation: () => <FlexibrickCaseStudiesPage page={2} />,
      report:       () => <FlexibrickCaseStudiesPage page={2} />,
    },
    // Construction detail 01 — solid base, Flexi Brick upper ─────────
    {
      label: "Solid base, Flexi Brick upper",
      presentation: () => <FullBleedSlide filename="detail-glazing-brick-01.jpg" caption="Construction detail, solid base with Flexi Brick upper" label="Detail · 01" title="Solid base, Flexi Brick upper." />,
      report:       () => <FullBleedSlide filename="detail-glazing-brick-01.jpg" caption="Construction detail, solid base with Flexi Brick upper" label="Detail · 01" title="Solid base, Flexi Brick upper." />,
    },
    // Construction detail 02 — Flexi Brick support, spandrel panel, glazing
    {
      label: "Flexi Brick support, spandrel panel, and glazing detail",
      presentation: () => <FullBleedSlide filename="detail-glazing-brick-02.jpg" caption="Construction detail, Flexi Brick support, spandrel panel and glazing" label="Detail · 02" title="Flexi Brick support, spandrel panel, and glazing." />,
      report:       () => <FullBleedSlide filename="detail-glazing-brick-02.jpg" caption="Construction detail, Flexi Brick support, spandrel panel and glazing" label="Detail · 02" title="Flexi Brick support, spandrel panel, and glazing." />,
    },
    // Construction detail 03 — spandrel panel close-up. Phil will drop the
    // image into public/images/detail-spandrel-panel.jpg.
    {
      label: "Spandrel panel detail",
      presentation: () => <FullBleedSlide filename="detail-spandrel-panel.jpg" caption="Construction detail, spandrel panel close-up" label="Detail · 03" title="Spandrel panel detail." />,
      report:       () => <FullBleedSlide filename="detail-spandrel-panel.jpg" caption="Construction detail, spandrel panel close-up" label="Detail · 03" title="Spandrel panel detail." />,
    },
    // Elevation models ─ three full bleeds, "Model" in the corner ─
    {
      label: "Elevation model 01",
      presentation: () => <FullBleedSlide filename="elevation-model-01.jpg" caption="Large elevation model 01, the brick body and Flexi Brick coursing, full bleed" label="Model" />,
      report:       () => <FullBleedSlide filename="elevation-model-01.jpg" caption="Large elevation model 01, the brick body and Flexi Brick coursing, full bleed" label="Model" />,
    },
    {
      label: "Elevation model 02",
      presentation: () => <FullBleedSlide filename="elevation-model-02.jpg" caption="Large elevation model 02, glazing meeting brick at the floor plate, full bleed" label="Model" />,
      report:       () => <FullBleedSlide filename="elevation-model-02.jpg" caption="Large elevation model 02, glazing meeting brick at the floor plate, full bleed" label="Model" />,
    },
    {
      label: "Elevation model 03",
      presentation: () => <FullBleedSlide filename="elevation-model-03.jpg" caption="Large elevation model 03, body to Signal Box, transfer level, full bleed" label="Model" />,
      report:       () => <FullBleedSlide filename="elevation-model-03.jpg" caption="Large elevation model 03, body to Signal Box, transfer level, full bleed" label="Model" />,
    },
  ]
);

// 6. VIDEOS — Construction sequence + Walk-through ────────────────────

// Construction video — its own section, sitting between Buildup and the City Walk.
const S_IV_Video = sectionPages(
  { sectionId: "iv-video", sectionNum: 141, sectionTitle: "Video", sectionLabel: "Video" },
  [
    {
      label: "Construction sequence (video)",
      presentation: () => <VimeoSlide vimeoId="1199265255" label="Construction · click to play" />,
      report:       () => <VimeoSlide vimeoId="1199265255" label="Construction · click to play" />,
    },
  ]
);

// Final full-bleed image at the very end of the deck. Placeholder for now.
// "thank you" badge sits in the bottom-LEFT corner.
function CloseSlide() {
  // Full-bleed closing image. Uses PresCover (same component every other
  // full-bleed slide uses) so the image fills the page-frame entirely.
  // "Thank you" badge is overlaid in the bottom-left corner.
  return (
    <>
      <PresCover
        filename="closing.jpg"
        caption="Final full-bleed image of the deck. Placeholder, to be replaced."
        overlayMode="mini"
        overlay={null}
      />
      <div style={{
        position: 'absolute', bottom: 36, left: 36, zIndex: 3, pointerEvents: 'none',
        background: '#FFFFFF',
        padding: '18px 26px 22px 26px',
        border: '1px solid rgba(0,0,0,0.12)',
        boxShadow: '0 14px 28px rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.12)',
      }}>
        <span className="h-display" style={{
          fontFamily: 'var(--ff-display)',
          fontStyle: 'italic',
          fontSize: 48, lineHeight: 1.0, color: 'var(--fg, #111)',
        }}>Thank you.</span>
      </div>
    </>
  );
}

const S_Close = sectionPages(
  { sectionId: "iv-close", sectionNum: 142, sectionTitle: "Close", sectionLabel: "Close" },
  [
    {
      label: "Close",
      presentation: () => <CloseSlide />,
      report:       () => <CloseSlide />,
    },
  ]
);

const S_IV_Videos = sectionPages(
  { sectionId: "iv-videos", sectionNum: 135, sectionTitle: "Walk-through", sectionLabel: "Walk-through" },
  [
    {
      label: "The walk (video)",
      presentation: () => <VideoSlide filename="walkthrough.mp4" poster="walkthrough-poster.jpg" caption="Walk-through video, the public walk and the tenant walk combined" label="The walk · click to play" />,
      report:       () => <VideoSlide filename="walkthrough.mp4" poster="walkthrough-poster.jpg" caption="Walk-through video, the public walk and the tenant walk combined" label="The walk · click to play" />,
    },
  ]
);

// 7. PLANS — Ground / Mezz / Typical / Top / Section ──────────────────

// PlansGrid: 2×2 of (Mezzanine, Typical, Top, Section), each filling its
// quadrant with a small mono label in the upper-left corner. Used to
// condense what was four separate full-bleed plan pages into one.
function PlansGrid() {
  const tiles = [
    { fn: "plan-ground.jpg",    label: "Ground",        caption: "Ground floor plan" },
    { fn: "plan-mezzanine.jpg", label: "Mezzanine",     caption: "Mezzanine plan" },
    { fn: "plan-typical.jpg",   label: "Typical",       caption: "Typical floor plan, 500 m² plate" },
    { fn: "plan-top.jpg",       label: "Top floor",     caption: "Top floor plan, the Signal Box" },
  ];
  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 6, height: '100%', minHeight: 0}}>
      {tiles.map((t, i) => (
        <div key={i} style={{position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid var(--rule-soft)'}}>
          <Placeholder filename={t.fn} caption={t.caption} variant="diagram" fill fitMode="contain" />
          <div className="mono" style={{position: 'absolute', top: 10, left: 12, color: 'var(--accent)', fontSize: 10, letterSpacing: 0.18, textTransform: 'uppercase', background: 'rgba(255,255,255,0.85)', padding: '3px 7px'}}>{t.label}</div>
        </div>
      ))}
    </div>
  );
}

const S_IV_Plans = sectionPages(
  { sectionId: "iv-plans", sectionNum: 136, sectionTitle: "Plans", sectionLabel: "Plans" },
  [
    // Single 2x2 grid: Ground (TL), Mezzanine (TR), Typical (BL), Top (BR).
    // The standalone Ground full-bleed page (was 185) and the standalone
    // Section page (was the 4th tile of the previous grid) are both
    // removed; if a separate Section is needed later it can come back.
    { label: "Plans grid · Ground, Mezzanine, Typical, Top", presentation: () => <PlansGrid />, report: () => <PlansGrid /> },
  ]
);

// 8. AREA SCHEDULE ────────────────────────────────────────────────────

const S_IV_AreaSchedule = sectionPages(
  { sectionId: "iv-area-schedule", sectionNum: 137, sectionTitle: "Area schedule", sectionLabel: "Area schedule" },
  [
    {
      label: "Area schedule",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Part IV · The numbers</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>Area schedule.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 22}}>
            500 m² × 11 floors. 5,500 m² total.
          </div>
          <div style={{border: '1px solid var(--rule-soft)', padding: 28, background: 'rgba(0,0,0,0.02)'}}>
            <div className="mono" style={{fontSize: 11, letterSpacing: 0.16, color: 'var(--fg-dim)', textTransform: 'uppercase', marginBottom: 12}}>Headline schedule</div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28, marginBottom: 20}}>
              <div>
                <div className="mono" style={{fontSize: 10, letterSpacing: 0.16, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4}}>GEA</div>
                <div className="mono" style={{fontSize: 30, color: 'var(--fg)', fontWeight: 500}}>xxx m²</div>
              </div>
              <div>
                <div className="mono" style={{fontSize: 10, letterSpacing: 0.16, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4}}>GIA</div>
                <div className="mono" style={{fontSize: 30, color: 'var(--fg)', fontWeight: 500}}>xxx m²</div>
              </div>
              <div>
                <div className="mono" style={{fontSize: 10, letterSpacing: 0.16, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4}}>NIA</div>
                <div className="mono" style={{fontSize: 30, color: 'var(--accent)', fontWeight: 500}}>5,500 m²</div>
              </div>
            </div>
            <div className="mono" style={{fontSize: 10, letterSpacing: 0.16, color: 'var(--fg-dim)', textTransform: 'uppercase', marginBottom: 6}}>Per floor</div>
            <div style={{fontSize: 13, color: 'var(--fg-soft)', lineHeight: 1.5}}>11 × 500 m². Whole-floor lettings. Three-sided daylight on every plate.</div>
          </div>
          <div className="mono" style={{fontSize: 11, color: 'var(--fg-dim)', letterSpacing: 0.04, marginTop: 16}}>
            Full floor-by-floor schedule, GEA / GIA / NIA / efficiency / sensitivity, on the <strong style={{color: 'var(--accent)'}}>500/600 · Who is the tenant?</strong> tab (top toolbar).
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>Part IV · The numbers</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 10}}>Area schedule.</h2>
          <div className="prose tight" style={{maxWidth: '78ch'}}>
            <p>The headline schedule for the scheme is <strong>11 × 500 m² = 5,500 m² NIA</strong>, with eccentric core, two stairs, and three-sided daylight on every plate. The transfer at the top, placed mid-scheme rather than over the live tunnels, takes the building to G+11 without a basement.</p>
            <p>GEA, GIA, NIA, efficiency, and ±10% RIBA Stage 2 sensitivity are kept live on the <strong>500/600 · Who is the tenant?</strong> tab. The numbers compare directly against the previously consented scheme, the original G+6 Canopy, and the original G+8 Signal Box, on the same metrics.</p>
          </div>
        </div>
      ),
    },
  ]
);

// 9. FINAL SUMMARY — "This is the building." four sentences ──────────

const S_IV_FinalSummary = sectionPages(
  { sectionId: "iv-final-summary", sectionNum: 138, sectionTitle: "This is the building", sectionLabel: "This is the building" },
  [
    {
      label: "This is the building. Four sentences.",
      presentation: () => (
        <div className="pc-stmt pc-stmt--centre" style={{maxWidth: '88ch', width: '100%', justifyContent: 'center'}}>
          <Eyebrow>The Crossing · A response to the brief</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 36, textAlign: 'center'}}>This is the building.</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: 28, textAlign: 'left'}}>
            {[
              { p: "Part I · Site",                 s: "The Crossing is the last mark on a site made by canal and railway, and the building is told in their forms and in their materials, not imposed on them." },
              { p: "Part II · Planning & delivery", s: "A pure extrusion with the transfer placed where it can be built (mid-scheme, not over the tunnels), taking us to G+11 with no basement, where any rival scheme would need a harder transfer just to reach G+8." },
              { p: "Part III · Commercial",         s: "11 × 500 m² beats 8 × 600 m² by 700 m² and three more whole-floor tenants for the boutique segment that pays the premium for a building that's a place." },
              { p: "Part IV · Quality",             s: "A Flexbrick body that brings light around and into every floor plate, becoming the Canopy at the ground and the Signal Box at the top, given to the tenant on every floor and to the public at the canal and the lookout." },
            ].map((b, i) => (
              <div key={i}>
                <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6}}>{b.p}</div>
                <div style={{fontSize: 18, lineHeight: 1.5, color: 'var(--fg)'}}>{b.s}</div>
              </div>
            ))}
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt pc-stmt--centre" style={{maxWidth: '88ch', width: '100%', justifyContent: 'center'}}>
          <Eyebrow>The Crossing · A response to the brief</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 36, textAlign: 'center'}}>This is the building.</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: 28, textAlign: 'left'}}>
            {[
              { p: "Part I · Site",                 s: "The Crossing is the last mark on a site made by canal and railway, and the building is told in their forms and in their materials, not imposed on them." },
              { p: "Part II · Planning & delivery", s: "A pure extrusion with the transfer placed where it can be built (mid-scheme, not over the tunnels), taking us to G+11 with no basement, where any rival scheme would need a harder transfer just to reach G+8." },
              { p: "Part III · Commercial",         s: "11 × 500 m² beats 8 × 600 m² by 700 m² and three more whole-floor tenants for the boutique segment that pays the premium for a building that's a place." },
              { p: "Part IV · Quality",             s: "A Flexbrick body that brings light around and into every floor plate, becoming the Canopy at the ground and the Signal Box at the top, given to the tenant on every floor and to the public at the canal and the lookout." },
            ].map((b, i) => (
              <div key={i}>
                <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6}}>{b.p}</div>
                <div style={{fontSize: 18, lineHeight: 1.5, color: 'var(--fg)'}}>{b.s}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ]
);

// ════════════════════════════════════════════════════════════════════════
// END PART IV BUILD
// ════════════════════════════════════════════════════════════════════════

// ── Closing · Thank-you page that echoes page 93's canal-family grid,
//    but with the 10th tile now showing The Crossing rather than the
//    discreet italic question mark. The deck argued in Part I that the
//    building should join the canal-and-railway family; the closing
//    page shows it joining.
const CANAL_FAMILY_REVEALED = CANAL_FAMILY.map((it) =>
  it.mystery ? { fn: "canal-family-10.png", label: "The Crossing", note: "King's Cross", proposed: true } : it
);

const SClosing = sectionPages(
  { sectionId: "closing-new", sectionNum: 16, sectionTitle: "Closing", sectionLabel: "Closing" },
  [
    // Closing argument: canal family with The Crossing in tile 10.
    {
      label: "A microcosm of the King's Cross story",
      presentation: () => (
        <>
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>The Crossing · joining the family</Eyebrow>
          <h1 className="h-display" style={{fontSize: 38, lineHeight: 1.06, margin: '6px 0 4px 0', maxWidth: '22ch'}}>A historic, commercially and culturally contextual building.</h1>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)'}}>
            A microcosm of the King's Cross story.
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'auto auto', columnGap: 16, rowGap: 14, marginTop: 4}}>
            {CANAL_FAMILY_REVEALED.map((it, i) => <CanalFamilyTile key={i} it={it} imgHeight={216} showSub={false} />)}
          </div>
        </div>
        </>
      ),
      report: () => (
        <>
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>The Crossing · joining the family</Eyebrow>
          <h1 className="h-display" style={{fontSize: 38, lineHeight: 1.06, margin: '6px 0 4px 0', maxWidth: '22ch'}}>A historic, commercially and culturally contextual building.</h1>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)'}}>
            A microcosm of the King's Cross story.
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'auto auto', columnGap: 16, rowGap: 14, marginTop: 4}}>
            {CANAL_FAMILY_REVEALED.map((it, i) => <CanalFamilyTile key={i} it={it} imgHeight={216} showSub={false} />)}
          </div>
        </div>
        </>
      ),
    },
    // The dedicated final Thank You slide was removed — the microcosm page
    // above carries a "THANK YOU" badge in the top right and serves as the
    // closing slide.
  ]
);

// ── §16 Our Direction ───────────────────────────────────────────────────
const SOurDirection = sectionPages(
  { sectionNum: 14, sectionTitle: "Our Direction", sectionLabel: "Our Direction" },
  [
    {
      label: "Our Direction. Canopy tall and slender",
      presentation: () => (
        <div className="lookout-pair">
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="our-direction-model.jpg" caption="Our direction, landscape model photo of the preferred move" variant="model" aspect="4/3" />
            </div>
            <div className="lookout-pair__cap">
              <span className="idx mono">Our direction</span>
              <span className="title">Canopy, tall and slender.</span>
            </div>
          </div>
          <div className="lookout-pair__col" style={{justifyContent: 'center'}}>
            <div className="lookout-pair__text" style={{padding: '0 8px'}}>
              <Eyebrow>§14 · Our direction</Eyebrow>
              <h2 className="h-sub" style={{marginBottom: 10}}>Perhaps we go tall and slender. And activate the canal.</h2>
              <div className="prose tight">
                <p>An alternative structural approach holds the small footprint and bridges the Piccadilly line below. The eccentric core lets us go higher. Both directions can reach G+10.</p>
                <p><strong>Two G+10 options.</strong> Both at ~72 m AOD. Both under the Kenwood House view line at 73.2 m. Both mark the crossing. Both activate the canal with public space, and both give the ground back.</p>
                <p><em>The Signal Box, more expressive at height. The Canopy, more expressive at ground.</em></p>
              </div>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="lookout-pair lookout-pair--report">
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="our-direction-model.jpg" caption="Our direction, landscape model photo of the preferred move" variant="model" aspect="4/3" />
            </div>
            <div className="lookout-pair__caption mono"><b>Our direction</b>Canopy, tall and slender.</div>
          </div>
          <div className="lookout-pair__col" style={{justifyContent: 'center'}}>
            <div className="lookout-pair__text" style={{padding: '0 8px'}}>
              <Eyebrow>§14 · Our direction</Eyebrow>
              <h2 className="h-sub" style={{marginBottom: 10}}>Perhaps we go tall and slender, and activate the canal.</h2>
              <div className="prose">
                <p>The two studies on the previous sections are both defensible, both architecturally honest. The next move, common to both, is an alternative structural approach that unlocks more height for either direction. The structure bridges over the Piccadilly line below the site, transferring load away from the tube tunnels to ground that can take it. The eccentric core, already part of both schemes, becomes the spine of the move: it stabilises the slender plate, and lets either direction rise higher than the earlier studies suggested.</p>
                <p><strong>Two G+10 options, at roughly 72 m AOD, both sitting just under the Kenwood House view line at 73.2 m.</strong> The Signal Box at G+10 lands at 71.98 m AOD (49.00 m from ground); the Canopy at G+10 at 71.33 m AOD (48.35 m from ground). Both gain more area on the lettable plates and more presence on the King's Cross silhouette, without breaching the protected strategic view that runs south from Kenwood across the city.</p>
                <p>Both options activate the canal with public space. Both mark the crossing. They differ in where the expressive move sits. <strong>The Signal Box is more expressive at height</strong>, a lightweight marker at the skyline, the lookout that reads the crossing in one view. <strong>The Canopy is more expressive at ground</strong>, a sheltered civic room at the foot, the threshold that brings the canal into the building.</p>
                <p><em>Either way, tall and slender. Either way, the ground given back. Either way, the crossing marked.</em></p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // ───────────────────────────────────────────────────────────────────
    //  Page 2 of §14 — both G+10 options shown side by side.
    //  Max height, ground given back, crossing marked. Either as a
    //  shed (canopy, industrial past) or a signal box (railway,
    //  public roof). Full circle.
    // ───────────────────────────────────────────────────────────────────
    {
      label: "Our Direction. Either way at maximum height",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§14 · Our direction · At maximum height</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 14}}>Either way, at maximum height.</h2>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0}}>
              {/* Fixed aspect-ratio wrapper so both images always render at the
                  same size regardless of how much caption text sits below. */}
              <div style={{aspectRatio: '3/2', display: 'flex', minWidth: 0}}>
                <Placeholder filename="our-direction-signal-box-g10.jpg" caption="G+10 Signal Box option, 73.2 m AOD, lookout marking the crossing in the silhouette (landscape)" variant="photo" aspect="3/2" />
              </div>
              <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase'}}>G+10 · Signal Box · 71.98 m AOD</div>
              <div style={{fontSize: 14, lineHeight: 1.4}}><strong>A signal box.</strong> A marker. The railway that crossed the canal, lifted into the silhouette. <em>Public on the roof.</em></div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0}}>
              <div style={{aspectRatio: '3/2', display: 'flex', minWidth: 0}}>
                <Placeholder filename="our-direction-canopy-g10.jpg" caption="G+10 Canopy option, 73.2 m AOD, shed-form crowning the building (landscape)" variant="photo" aspect="3/2" />
              </div>
              <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase'}}>G+10 · Canopy · 71.33 m AOD</div>
              <div style={{fontSize: 14, lineHeight: 1.4}}><strong>A canopy.</strong> A shed. The industrial past, retold for the city now. <em>The ground given back.</em></div>
            </div>
          </div>
          <div className="prose tight" style={{maxWidth: '76ch', fontSize: 14, lineHeight: 1.5}}>
            <p>Both options give the ground back to the crossing. Both mark the skyline with meaning. Both sit just under the <strong>Kenwood House view line at 73.2 m AOD</strong>, the protected sightline that runs south across the city. If the signal box is public, going high becomes an argument for everyone, a public room on the roof, the final gesture to King's Cross.</p>
            <p><em>A fine legacy of placemaking and meaning. Full circle.</em></p>
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§14 · Our direction · At maximum height</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 12}}>Either way, at maximum height.</h2>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 18}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              <div style={{display: 'flex'}}>
                <Placeholder filename="our-direction-signal-box-g10.jpg" caption="G+10 Signal Box option, 73.2 m AOD, lookout marking the crossing in the silhouette" variant="photo" aspect="3/2" />
              </div>
              <div className="mono" style={{fontSize: 10.5, letterSpacing: 0.16, color: 'var(--accent)', textTransform: 'uppercase'}}>G+10 · Signal Box · 71.98 m AOD</div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              <div style={{display: 'flex'}}>
                <Placeholder filename="our-direction-canopy-g10.jpg" caption="G+10 Canopy option, 73.2 m AOD, shed-form crowning the building" variant="photo" aspect="3/2" />
              </div>
              <div className="mono" style={{fontSize: 10.5, letterSpacing: 0.16, color: 'var(--accent)', textTransform: 'uppercase'}}>G+10 · Canopy · 71.33 m AOD</div>
            </div>
          </div>
          <div className="prose tight" style={{maxWidth: '76ch'}}>
            <p>Both directions take the building to G+10 at roughly 72 m AOD, sitting just under the Kenwood House protected view line at 73.2 m. The Signal Box option apex of roof at 71.98 m AOD (49.00 m from ground); the Canopy hybrid apex of parapet at 71.33 m AOD (48.35 m from ground). Both give the ground back to the city, a sheltered public threshold at the foot, marking the crossing where Goods Way meets the towpath.</p>
            <p>The two options carry different meanings at the top. <strong>The Canopy</strong> reads as a shed, the architectural vocabulary of the industrial past, retold for the city now, and made civic. <strong>The Signal Box</strong> reads as a marker, the language of the railway that crossed the canal in 1852, lifted into the silhouette.</p>
            <p>If the Signal Box is opened to the public, the height argument becomes simpler. Going high is no longer a commercial demand on the city, it is a civic gift in return. A public room on the roof, an outlook from the highest point on the crossing, the final gesture in the last plot of the masterplan.</p>
            <p><em>A fine legacy of placemaking and meaning. Full circle.</em></p>
          </div>
        </div>
      ),
    },
    // ───────────────────────────────────────────────────────────────────
    //  Streetview comparison. ONE page showing the same vantage point
    //  with both G+10 options side by side (Signal Box left, Canopy
    //  right). Drop the matching pair of renders into the two slots.
    // ───────────────────────────────────────────────────────────────────
    (() => {
      const renderPage = () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§14 · Our direction · Streetview</Eyebrow>
          <h2 className="h-sub" style={{marginBottom: 4}}>In townscape.</h2>
          <div className="prose" style={{maxWidth: '78ch', fontSize: 13, color: 'var(--fg-soft)', marginBottom: 10}}>
            The same vantage point, the two G+10 options side by side.
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, flex: 1, minHeight: 0}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, minWidth: 0}}>
              <div style={{flex: 1, display: 'flex', minHeight: 0, minWidth: 0}}>
                <Placeholder filename="our-direction-streetview-signal-box.jpg" caption="Streetview, Signal Box G+10 (landscape CGI)" variant="photo" aspect="3/2" />
              </div>
              <div className="mono" style={{fontSize: 10.5, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase'}}>Signal Box · G+10</div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, minWidth: 0}}>
              <div style={{flex: 1, display: 'flex', minHeight: 0, minWidth: 0}}>
                <Placeholder filename="our-direction-streetview-canopy.jpg" caption="Streetview, Canopy G+10 (landscape CGI)" variant="photo" aspect="3/2" />
              </div>
              <div className="mono" style={{fontSize: 10.5, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase'}}>Canopy · G+10</div>
            </div>
          </div>
        </div>
      );
      return {
        label: "Our Direction. Streetview",
        presentation: renderPage,
        report: renderPage,
      };
    })(),
    // ───────────────────────────────────────────────────────────────────
    //  Final page of §14 — both G+10 area schedules side by side, the
    //  numeric payoff to page 143. Both options give similar area
    //  (~8,000 m² GIA, ~6,000 m² NIA); the choice is design-led.
    // ───────────────────────────────────────────────────────────────────
    {
      label: "Our Direction. G+10 area schedules",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§14 · Our direction · Area schedules</Eyebrow>
          <h2 className="h-sub" style={{marginBottom: 4}}>Two options. The same area.</h2>
          <div className="prose" style={{maxWidth: '78ch', fontSize: 13, color: 'var(--fg-soft)', marginBottom: 10}}>
            Both G+10 schemes deliver ~8,000 m² GIA and ~6,000 m² NIA. The choice is design-led, not market-led.
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, flex: 1, minHeight: 0, alignItems: 'start'}}>
            <div className="schedule" style={{margin: 0, gap: 6}}>
              <div className="mono" style={{fontSize: 10, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase'}}>G+10 · Signal Box · 71.98 m AOD</div>
              <AreaSchedule data={SIGNAL_BOX_G10_SCHEDULE} compact />
            </div>
            <div className="schedule" style={{margin: 0, gap: 6}}>
              <div className="mono" style={{fontSize: 10, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase'}}>G+10 · Canopy · 71.33 m AOD</div>
              <AreaSchedule data={CANOPY_G10_SCHEDULE} compact />
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§14 · Our direction · Area schedules</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 10}}>Two options. The same area.</h2>
          <div className="prose tight" style={{maxWidth: '76ch', marginBottom: 14}}>
            <p>Both G+10 options deliver almost exactly the same lettable area, around 8,000 m² GIA and 6,000 m² NIA. The Signal Box version sits 36 m² above the Canopy hybrid at GIA; the Canopy hybrid sits 32 m² below at NIA. Within Stage 2 sensitivity, they are equivalent. The choice between them is therefore not driven by area gain; it is driven by what each says, at the canal, at the skyline, and to the city.</p>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
            <div className="schedule" style={{margin: 0}}>
              <div className="schedule__head">
                <span className="mono" style={{fontSize: 10.5, letterSpacing: 0.16, color: 'var(--accent)', textTransform: 'uppercase'}}>G+10 · Signal Box · 71.98 m AOD</span>
              </div>
              <AreaSchedule data={SIGNAL_BOX_G10_SCHEDULE} compact />
            </div>
            <div className="schedule" style={{margin: 0}}>
              <div className="schedule__head">
                <span className="mono" style={{fontSize: 10.5, letterSpacing: 0.16, color: 'var(--accent)', textTransform: 'uppercase'}}>G+10 · Canopy · 71.33 m AOD</span>
              </div>
              <AreaSchedule data={CANOPY_G10_SCHEDULE} compact />
            </div>
          </div>
        </div>
      ),
    },
  ]
);

// §17 Appendices section removed — the previously consented scheme is
// now shown as one row of the §16 "By the numbers" comparison page, so
// the standalone appendix is no longer needed.

// ─── Authored source order ───────────────────────────────────────────────
// This is the canonical order written into the file. The runtime order
// PAGES is built from this plus public/deck-order.json (which the
// thumbnail strip writes to). If the JSON is empty, we fall back to this.
const SOURCE_PAGES = [].concat(
  S01,        // Cover (+ microcosm + "a conversation" + TOC roadmap)
  // SRecap removed (was the "Since the interim" placeholder)

  // ── PART I · Responsiveness to site, context and constraints ──────────
  PART_I,
  SLegacy,    // The Legacy (opening narrative)
  S02,        // The Crossing
  S03,        // The Site
  S07,        // Constraints
  SInter,     // Site Walk (act break + 58 photos)
  SSummaryI,  // Summary, Part I (4 pages: title + Two walks + Of the canal + Don't fight)

  // ── PART II · Planning and delivery realism ───────────────────────────
  PART_II,
  SChallenge,      // The Challenge
  SFiveFamilies,   // Five Families (now incl. precedents/summaries/merger + Mass and buildability)
  SSummaryII,      // Summary, Part II (4 pages: title + 3 conclusions + current direction)
  // SBuildingTooLong, STwoChosen, SCanopy, SSignalBoxStudy removed —
  // the Canopy + Signal Box detail studies are now distilled into the
  // Five Families summary pages (104, 105, 106) and Summary, Part II;
  // §10 Too long? is folded into Summary, Part I as "Mark the crossing."
  // SViabilityQs moved to start of Part III (the commercial argument)

  // ── PART III · Alignment with client objectives and commercial drivers ─
  // (Was Part IV; swapped with the design Part so the commercial answer
  // lands before the design reveal. The KXG brief's main worries are
  // commercial, so the deck addresses them next.)
  PART_III,
  SViabilityQs,    // §09 Questions on delivering the best office
  STenant,         // The tenant (2 pages: who+500/600 merged, floor plate in use)
  SExtrusion,      // The form, a pure extrusion (1 page)
  SSustainability, // Sustainability, cost, and the Calculator
  SPlace,          // Place at the top and bottom (was inside STenant; now at the end of the arc)
  SSummaryIII,     // Summary, Part III (1 page: Five things — Place pays last)
  // SCost — old placeholder, to be rebuilt.
  // S13 §21 The Crossing (old area schedule) — superseded by STenant.
  // S12 §17 Sustainability (old carbon pages) — replaced by SSustainability above.

  // ── PART IV · Quality and clarity of vision ───────────────────────────
  // (Was Part III; the design reveal. Lands as the visual answer to the
  // commercial argument above.)
  PART_IV,
  // S_IV_Contents removed — straight into the buildup, no overture.
  S_IV_Buildup,        // Buildup, 6 watercolour axos + 1 model reveal (7)
  S_IV_Public,         // For the public, 8 full bleeds (8)
  S_IV_TenantWalk,     // For the tenant, 8 full bleeds (8)
  S_IV_MaterialsBreaker, // "What is The Crossing made of?" + samples board (2)
  S_IV_Materials,      // Glazing, Flexi Brick, 2 details (4)
  S_IV_Plans,          // Plans grid (Ground, Mezzanine, Typical, Top)
  S_IV_AreaSchedule,   // Area schedule (1)
  S_IV_FinalSummary,   // "This is the building." four sentences (1)
  SClosing,            // Microcosm closing slide (1) — now sits before the video, after the four-sentences page
  S_IV_Video,          // Construction sequence video (1)
  S_Close,             // Final full-bleed image with "thank you" badge in bottom-left (1)
  // ── Legacy sections removed ──────────────────────────────────────────
  // S07_new, STerraced, S05, S10_new, S09, S13 are no longer in the deck.
  // Their const definitions remain in this file for now (dead code) so
  // they can be re-added easily if needed; nothing renders them.
  // S14 (Working with us), removed
  // S15 (Closing/The Crossing), folded into §13
  // S16, S17, folded into S15
  // S18 (§20 Parking), removed
);

// Runtime PAGES, just the authored SOURCE_PAGES (with the same section
// context sectionPages() already baked in). The earlier JSON-driven
// reorder/hide pipeline + thumbnail strip has been removed.
const PAGES = SOURCE_PAGES;

// Section index → range. Works against any page list (full or curated).
function buildSectionIndex(pages) {
  const list = pages || PAGES;
  const sections = []; // { num, label, title, pageStart, pageCount }
  for (let i = 0; i < list.length; ) {
    const num = list[i].sectionNum;
    let count = 0;
    while (i + count < list.length && list[i + count].sectionNum === num) count++;
    sections.push({
      num,
      label: list[i].sectionLabel,
      title: list[i].sectionTitle,
      pageStart: i,
      pageCount: count,
    });
    i += count;
  }
  return sections;
}
const SECTION_INDEX = buildSectionIndex(PAGES);

export { PAGES, SECTION_INDEX, buildSectionIndex };
