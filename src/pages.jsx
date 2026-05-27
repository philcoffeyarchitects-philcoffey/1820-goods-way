// pages.jsx
// All pages of "The Water Came First". Each page has a fixed 1280×905
// frame and carries TWO renderers — `presentation` (image-led, sparse) and
// `report` (text-led, descriptive). Navigation moves between pages; the
// P/R toggle swaps which renderer fills the body of the current page.

import React from "react";
import { Placeholder, Eyebrow, Cap, Logo, DEFAULT_ASPECTS } from "./placeholder.jsx";

// ─── small layout helpers ──────────────────────────────────────────────

function PresCover({ filename, caption, overlay, src }) {
  return (
    <div className="pc-cover">
      <Placeholder filename={filename} caption={caption} variant="photo" fill src={src} />
      <div className="pc-cover__overlay">{overlay}</div>
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
  // Section id — explicit override > slugified label > slugified title
  const baseSectionId = slugify(meta.sectionId || meta.sectionLabel || meta.sectionTitle || `section-${meta.sectionNum}`);
  const sectionId = uniqId(baseSectionId, _sectionIdCount);
  ALL_SECTIONS_BY_ID[sectionId] = {
    id: sectionId,
    originalNum: meta.sectionNum,
    label: meta.sectionLabel,
    title: meta.sectionTitle,
  };

  return pages.map((p, i) => {
    // Page id — explicit override > sectionId + slug(label) > sectionId + index
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
    };
    ALL_PAGES_BY_ID[id] = obj;
    return obj;
  });
}

// ── Divider + TOC components — act breaks, chrome hidden ─────────────────
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
  ["§02",       "The Legacy"],
  ["§§ 03–05",  "Site & origin"],
  ["§06",       "Site Walk"],
  ["§§ 07–09",  "Challenge · Families · Viability Qs"],
  ["§§ 10–11",  "Crossing tension · Two Directions"],
  ["§§ 12–13",  "Canopy · Signal Box"],
  ["§14",       "Our Direction"],
  ["§15",       "Materials · Sustainability · Cost"],
  ["§16",       "Closing"],
];

function TOCPage() {
  return (
    <div className="toc">
      <div className="toc__head">
        <span className="mono">A roadmap</span>
        <h1 className="toc__title">What's in this conversation.</h1>
      </div>
      <ol className="toc__list">
        {TOC_ROWS.map(([num, name]) => (
          <li key={num}>
            <span className="toc__num mono">{num}</span>
            <span className="toc__name">{name}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

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
          caption="Bagley Walk retaining wall — full bleed, low overcast light, documentary"
          overlay={
            <>
              <Logo size="md" />
              <span className="mono">King's Cross · London N1C</span>
              <h1 className="h-display" style={{fontSize: 48, lineHeight: 1.05, margin: 0}}>1820 Goods Way.<br/>The water came first.</h1>
              <span className="mono">A proposition · May 2026</span>
            </>
          }
        />
      ),
      report: () => (
        <div className="report-cover">
          <div className="report-cover__media">
            <Placeholder
              filename="cover.jpg"
              caption="Bagley Walk retaining wall — front cover of bound document"
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
              <h1 className="report-cover__title">1820 Goods Way.<br/>The water came first.</h1>
              <div className="report-cover__sub">
                A proposition for King's Cross.
              </div>
            </div>
            <div className="report-cover__meta">
              <div className="report-cover__meta-row">
                <span className="mono report-cover__meta-lbl">Site</span>
                <span className="report-cover__meta-val">1820 Goods Way · King's Cross · London N1C</span>
              </div>
              <div className="report-cover__meta-row">
                <span className="mono report-cover__meta-lbl">Prepared by</span>
                <span className="report-cover__meta-val">Coffey Architects</span>
              </div>
              <div className="report-cover__meta-row">
                <span className="mono report-cover__meta-lbl">Document</span>
                <span className="report-cover__meta-val">Design proposition — Report</span>
              </div>
              <div className="report-cover__meta-row">
                <span className="mono report-cover__meta-lbl">Date</span>
                <span className="report-cover__meta-val">May 2026</span>
              </div>
            </div>
            <div className="report-cover__foot">
              <span className="mono">Coffey Architects · 70 Cowcross Street · London EC1M 6EJ</span>
              <span className="mono">— C/A · 2026 —</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "A conversation, not a conclusion",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§01 · Cover · The sentiment</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>A conversation, not a conclusion.</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 18}}>
            This deck is the start of a longer conversation.
          </div>
          <ul className="numlist" style={{listStyle: 'none'}}>
            {[
              "We are here to learn more about the site, the ambition, the brief.",
              "We bring our own thinking on context, history, response, sustainability, viability.",
              "These ideas are not yet fully formed.",
              "The deck is set up to enable decisions, made together.",
              "The start of the conversation — through planning, through viability, ultimately built.",
              "To mark two legacies: the last site at King's Cross, and the first crossing.",
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
          <Eyebrow>§01 · Cover · The sentiment of this deck</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 8}}>A conversation, not a conclusion.</h2>
          <div className="prose tight" style={{maxWidth: '78ch'}}>
            <p>This presentation does not arrive at a conclusion. It is the start of a longer conversation — set up to put the right decisions on the table at the right time, and to invite you into making them with us.</p>
            <p>We bring our own thinking, openly. On context, history, response, sustainability, and viability. <em>Each is sketched here; none is finished.</em> The pages that follow are sequenced as questions, options, and trade-offs, not as recommendations. Where we have an instinct, we name it; where we are still listening, we say so.</p>
            <p>The site is the last plot of the Argent King's Cross masterplan, and a working crossing marked since 1820 by the canal that gave the building its name. <strong>The ambition is to make a building that earns its place as the last layer of the masterplan, and the latest layer of a working crossing the water made.</strong> We would rather have the conversation properly than arrive with answers that haven't been earned.</p>
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
// §02 THE LEGACY (14 pages) — opening narrative: the history of the crossing
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
              <Placeholder filename="legacy-battle-bridge.jpg" caption="Battle Bridge — historical map, sketched over. Portrait." variant="archive" aspect="3/4" />
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
              <Placeholder filename="legacy-battle-bridge.jpg" caption="Battle Bridge — historical map" variant="archive" aspect="3/4" />
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
              <Placeholder filename="legacy-clubs-bagleys.jpg" caption="Bagley's interior at peak — crowd, lasers, warehouse scale. Source: Curious London / Naki / Time Out (licence required)." variant="photo" aspect="4/3" />
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
          caption="Argent / Allies and Morrison masterplan diagram — 67-acre site, retained historic structures, new plot pattern. Plan view, full-bleed landscape. Source: Allies and Morrison / Argent press."
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
      label: "The last building",
      presentation: () => (
        <PresImage
          filename="legacy-scheme-reveal.jpg"
          caption="Coffey's scheme — first reveal. Source: Coffey Architects design team."
          variant="CGI"
          capIdx="The scheme"
          capTitle="A moment not to be missed."
          capMeta="The final crossing, in a long history of crossings"
        />
      ),
      report: () => (
        <ReportImageText
          filename="legacy-scheme-reveal.jpg"
          caption="The proposed scheme — first reveal"
          variant="CGI"
          capIdx="The scheme"
          capTitle="A moment not to be missed."
          kicker="§02 · The last building"
          title="The final moment in a history of crossings."
          body={<>
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
  { sectionNum: 3, sectionTitle: "The Water Came First", sectionLabel: "The Water Came First" },
  [
    {
      label: "Site & origin (act break)",
      isDivider: true,
      presentation: () => <Divider range="§§ 03–05" title="Site & origin." sub="The canal, the railway, and the brick context this building answers to." />,
      report: () => <Divider range="§§ 03–05" title="Site & origin." sub="The canal, the railway, and the brick context this building answers to." />,
    },
    {
      label: "Premise",
      presentation: () => (
        <PresStatement
          kicker="§03 · Premise"
          title="The water came first."
          body={<>
            <p>Before the railways. Before the warehouses.<br/>Before King's Cross was King's Cross.</p>
            <p>The Regent's Canal opened in 1820.<br/>Everything around this site is a response to it.</p>
            <p><em>So is our proposal.</em></p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§03 · Premise"
          title="The water came first."
          body={<>
            <p>The Regent's Canal opened in 1820, connecting the Grand Junction Canal at Paddington to the Thames at Limehouse. It predates the railway lands by twenty years. It predates the Granary by thirty. It predates everything that now defines King's Cross.</p>
            <p>The site we are proposing to build on sits hard against the canal. It is a sliver of infrastructure land, defined entirely by the water it adjoins. <strong>The canal is not a feature of the site. The canal is the reason the site exists.</strong></p>
            <p>This is not metaphor. It is a literal architectural strategy. The materials, the massing, the structural decisions, and the detail language all follow from a single premise: the water came first, and the building grows from it.</p>
          </>}
        />
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
    {
      label: "The crossing",
      presentation: () => (
        <PresStatement
          kicker="§03 · The crossing"
          title="An incredible crossing."
          body={<>
            <p>The Regent's Canal of 1820.<br/>The railway of 1852.</p>
            <p>Two centuries ago. Two systems of moving the city. Both still in use.</p>
            <p>And here — at exactly this point — they cross.</p>
            <p><em>Our building sits on the canal. Beside the railway. It cannot ignore the crossing.<br/>The crossing is its subject.</em></p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§03 · The crossing"
          title="The canal and the railway meet here."
          body={<>
            <p>The Regent's Canal opened in 1820, connecting Paddington to Limehouse. The Great Northern Railway opened in 1852, throwing iron between London and the north. They are the two great pieces of Victorian infrastructure that made King's Cross — and they meet, almost orthogonally, at this single point.</p>
            <p>The site sits in that meeting. It is bordered on one side by the canal towpath and the Bagley Walk retaining wall; on another by the safeguarded tube and Thameslink lines beneath. The crossing of water and rail is not a feature of the site — <strong>it is the site's defining geometric fact.</strong></p>
            <p>Any building here must answer to both: to the water that came first and to the railway that came second. <em>Our proposal takes the crossing as its subject.</em></p>
          </>}
        />
      ),
    },
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
          capMeta="1820 Goods Way sits exactly here"
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
            <p><em>Possibly something low</em> — a public space at canal level, where the city can meet the water.</p>
            <p><em>Possibly something high</em> — visible from across the basin, naming the place that has been overlooked for too long.</p>
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
            <p>The crossing is the most important piece of city at this end of King's Cross. It deserves to be marked — but not blocked. A building that fights the crossing with mass, with cantilevered floor plates, fills the air the crossing needs to be seen; the geometry of the meeting is lost behind the geometry of the building. We don't think that is right.</p>
            <p>So the question of how to mark the crossing — without fighting it — becomes the architectural subject of the proposal. <strong>Possibly something low</strong>, where the building meets the canal and the water-going public. <strong>Possibly something high</strong>, visible at distance, naming the place. <strong>And between them, the building stays calm</strong> — slender enough that the air around the crossing stays clear, the meeting still legible from the bridges.</p>
            <p>The pages that follow are the working-out of these questions: how the building grows from the canal, what typology marks the crossing best, and where on the spectrum between heavy and slender, public and private, the building finally lands. <em>This conviction — to mark the crossing without fighting it — is the conviction that the four design questions later in the document all follow from.</em></p>
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
// §09 SKETCHES — STAGE TWO (6 pages)
// ════════════════════════════════════════════════════════════════════════
const stage2 = [
  { t: "The signal box as type",
    pres: "Small, elevated, pitched roof, generous glazing — the working architecture of infrastructure.",
    body: <p>The Victorian and early twentieth-century signal box is a defined architectural type — a small elevated structure, typically with a pitched or hipped roof, clad in metal or timber, with generous glazing for the operator's visibility. <strong>One of the most legible pieces of working infrastructure in the British railway and canal tradition.</strong></p> },
  { t: "The lookout",
    pres: "The upper floors are the lookout.",
    body: <p>The typological function is to look out. From a signal box, the operator surveys the network. As an architectural metaphor for the upper levels of a contemporary canal-side building, this is unusually apt — the upper floors are the lookout, the place from which the city and canal are observed.</p> },
  { t: "The inversion — offset, not centred",
    pres: "Not a crown on top of the brick mass — a contemporary addition stuck to the side.",
    body: <p>Rather than placing a small signal house centred on top of the brick mass — a classical composition, a heritage gesture — we propose offsetting it to one flank. <strong>The signal house becomes a contemporary addition stuck to the side of the infrastructure, not a crown sitting on top of it.</strong></p> },
  { t: "The pitched roof as archetype",
    pres: "The archetypal silhouette of working infrastructure architecture.",
    body: <p>The pitched roof is retained. It is the archetypal silhouette of working infrastructure architecture, and it differentiates the signal house unmistakably from a contemporary penthouse. A flat-roofed upper volume would read as a different building type entirely.</p> },
  { t: "Bright metal in contrast to dark brick",
    pres: "The brick is the brick. The aluminium box is the aluminium box.",
    body: <p>Bright perforated aluminium against dark brick. <strong>The two parts do not reconcile.</strong> The brick is the brick. The aluminium box is the aluminium box. Their architectural intelligence is in the precision of their contrast.</p> },
];

// ════════════════════════════════════════════════════════════════════════
// Shared helper — a family section of 14 pages, same structure for both
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

// Two-up lookout-pair page — used for page 1 of either family.
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

// Site context pages 10-14 — single full-bleed photographic placeholder per page.
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

// Placeholder area-schedule page — appended at the end of each family
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
            <td className="dim">—</td>
            <td className="dim">—</td>
            <td className="dim">—</td>
            <td className="dim">TBD</td>
          </tr>
        ))}
        <tr className="schedule__total">
          <th>Total</th>
          <td className="dim">—</td>
          <td className="dim">—</td>
          <td className="dim">—</td>
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
            Placeholder — to follow once geometry is finalised in the calculator.
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
            <p>An indicative area schedule for the {sectionLabel.toLowerCase()} family — GIA, NIA, efficiency and brief notes per level. To follow, once the geometry of this family variant is settled and plugged into the design-side carbon + cost calculator.</p>
          </div>
        </div>
        {table}
      </div>
    ),
  };
}

// ════════════════════════════════════════════════════════════════════════
// §09 TERRACED — 14 pages
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
    // 0 — title page (section opener / act break)
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
    // 1 — sketch + landscape image
    familyPage1({
      sectionNum: 17, sectionLabel: "Terraced", slug: "terraced",
      leftFilename: "terraced-concept-01.jpg",
      leftIdx: "Concept · 1",
      leftTitle: "The building as terraced garden.",
      leftCaption: "Concept sketch — the roof read as continuous landscape.",
      leftVariant: "sketch",
      rightFilename: "terraced-precedent-01.jpg",
      rightIdx: "Precedent",
      rightTitle: "Planted roofscapes as precedent.",
      rightCaption: "Photographic precedent — a planted, terraced building as reference.",
      rightVariant: "photo",
      reportTitle: "Terraced — the building as garden.",
      reportBody: <>
        <p>The terraced family treats the building as an extension of the landscape rather than a frame for it. The roof is not a flat cap nor a sculpted gesture; it is a stepped, planted surface that continues the public realm of King's Cross up and over the building.</p>
        <p>The opening pages of this section pair our concept sketch with a photographic precedent, before the axonometric pages develop the build-up of the section in six stages.</p>
      </>,
    }),
    // 2 — further concept drawing
    familyImagePage({
      sectionNum: 17, sectionLabel: "Terraced", idx: 2, of: 14,
      filename: "terraced-concept-02.jpg",
      variant: "sketch",
      capIdx: "Concept · 2",
      capTitle: "The terraced section.",
      caption: "Further concept drawing — the section taken through the terraced roof.",
      reportTitle: "The section that lets the garden up.",
      reportBody: <p>A section study through the building. The horizontal terraces are read as receivers of soil and planting; the stepped geometry is set by the building's contextual edges, not by an arbitrary gesture.</p>,
    }),
    // 3-8 — axonometric build-up
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
    // 9 — what this family offers
    familyOffersPage({
      sectionNum: 17, sectionLabel: "Terraced", kickerLine: "What this family offers",
      leadPres: "What planting up and over the building gives the architecture and the city.",
      leadReport: <p>Before we leave the terraced family, the architectural argument: <em>why planting carries the building, what the gesture buys, where it lands lightly.</em></p>,
      offerings: terracedOfferings,
    }),
    // 10-14 — site context images
    ...[1,2,3,4,5].map((n) => familySitePage({
      sectionNum: 17, sectionLabel: "Terraced", idx: n, slug: "terraced",
    })),
    // 15 — placeholder area schedule
    familySchedulePage({ sectionNum: 17, sectionLabel: "Terraced" }),
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §10 SIGNAL BOX — 14 pages
//   (Existing typology bodies from `stage2` are reused inline as the body
//    text for the relevant axonometric stages; the §11 "Why Signal House"
//    page is folded in here as page 9.)
// ════════════════════════════════════════════════════════════════════════
const signalBoxOfferings = [
  ["Two voices, not one",
   "A heavy brick body that belongs to the canal, and a lightweight 1820 above. The contrast carries the contextual reading; neither part dilutes the other."],
  ["A legible top",
   "Every King's Cross neighbour has a distinctive crown — the Gasholders, the Granary, Coal Drops Yard. This one says signal box. Read from the bridges and across the basin."],
  ["The lookout",
   "Typologically, a signal box is a place to look out from. The upper room becomes a belvedere — naming the crossing it surveys."],
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
  { capTitle: "Offset signal-box volume",         body: stage2[2].body /* inversion — offset, not centred */ },
  { capTitle: "Pitched roof",                     body: stage2[3].body /* pitched roof as archetype */ },
  { capTitle: "Bright aluminium cladding",        body: stage2[4].body /* bright metal in contrast to dark brick */ },
  { capTitle: "Assembled",                        body: <p>The completed assembly. Heavy brick body, offset signal-box volume, pitched roof, bright perforated aluminium cladding. The two parts read as two distinct architectural voices, held in deliberate contrast.</p> },
];

const S05 = sectionPages(
  { sectionNum: 18, sectionTitle: "Signal Box", sectionLabel: "Signal Box" },
  [
    // 0 — title page (section opener / act break)
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
    // 1 — sketch + landscape image (REUSE: our lookout sketch + Varini precedent)
    familyPage1({
      sectionNum: 18, sectionLabel: "Signal Box", slug: "signal-box",
      leftFilename: "sketch-07.jpg",
      leftIdx: "Sketch · 7",
      leftTitle: "Our sketch — the upper floors as lookout.",
      leftCaption: "The upper floors are the lookout.",
      leftVariant: "sketch",
      rightFilename: "varini-across-the-buildings.jpg",
      rightIdx: "Precedent · Varini, 2007",
      rightTitle: "\"Across the Buildings\" — a lookout was here before.",
      rightCaption: "Across the Buildings · Felice Varini, 2007 · King's Cross — anamorphic painting resolving from a single viewing platform",
      rightVariant: "photo",
      reportTitle: "The upper floors as lookout.",
      reportBody: <>
        {stage2[1].body /* the lookout — typological function is to look out */}
        <p>King's Cross has done this before. <strong>"Across the Buildings"</strong> by the Swiss artist <strong>Felice Varini</strong> was an anamorphic installation commissioned by Argent in 2007 as part of the RELAY public art programme — silver and yellow geometric lines painted across multiple King's Cross facades, fragmented from most angles and resolving into a single coherent shape only from <em>one specific viewing point</em>. A platform was built to host that view.</p>
        <p>The architectural conversation at King's Cross has form for distinctive, site-specific, infrastructure-engaging artworks. Our signal box continues that lineage. <strong>It is the legible viewing point the masterplan once had on loan.</strong></p>
      </>,
    }),
    // 2 — further concept drawing (REUSE: the signal box as type)
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
    // 3-8 — axonometric build-up
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
    // 9 — what this family offers (FOLDED IN from former §11)
    familyOffersPage({
      sectionNum: 18, sectionLabel: "Signal Box", kickerLine: "What this family offers",
      leadPres: "Before we narrow to a variant, the architectural argument for the family.",
      leadReport: <p>Before we look at variants within the family, the architectural argument: <em>why this family of buildings, on this site, before any of the other three wider options.</em> Five things the signal box typology gives us that none of the alternatives can.</p>,
      offerings: signalBoxOfferings,
    }),
    // 10 — The building speaks twice (RELOCATED from §13 Materials —
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
                <Placeholder filename="signage-01-brick-1820-recessed.jpg" caption="1820 recessed and carved into the engineering brick at ground level — Victorian canal vocabulary, read at arm's reach" variant="material" number="01" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At ground level · in the brick</span>
                <div className="signage__big">1820 Goods Way.</div>
                <div className="signage__sub">Recessed, carved into the masonry at canal level.<br/><em>Where you are.</em></div>
              </div>
            </div>
            <div className="signage__col">
              <div className="signage__media">
                <Placeholder filename="signage-02-aluminium-1820-perforated.jpg" caption="The water came first — perforated through the lightweight skin of the 1820 belvedere; a lantern at night" variant="material" number="02" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At the skyline · perforated through aluminium</span>
                <div className="signage__big">The water came first.</div>
                <div className="signage__sub">By day, shadow and depth. By night, a lantern over the canal.<br/><em>Why the building is here.</em></div>
              </div>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="signage">
          <div className="signage__head">
            <Eyebrow>§18 · Signage — the building speaks twice</Eyebrow>
            <h2 className="h-sub">The building speaks twice.</h2>
            <div className="prose tight" style={{maxWidth: '78ch', marginTop: 4}}>
              <p>Two pieces of signage, both worked into the material itself rather than applied to it. At the entrance, the building says <strong>where you are</strong>. At the skyline, <strong>why the building is here</strong>. The crossing is the silent context.</p>
            </div>
          </div>
          <div className="signage__cols">
            <div className="signage__col">
              <div className="signage__media">
                <Placeholder filename="signage-01-brick-1820-recessed.jpg" caption="1820 Goods Way — recessed and carved into the brick at ground level" variant="material" number="01" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At ground level · embossed brick</span>
                <div className="signage__big">1820 Goods Way.</div>
                <div className="signage__sub">Carved and recessed into the engineering brick at the canal threshold. Deep reveals, Victorian canal vocabulary. Read at arm's reach as you arrive on foot.</div>
              </div>
            </div>
            <div className="signage__col">
              <div className="signage__media">
                <Placeholder filename="signage-02-aluminium-1820-perforated.jpg" caption="The water came first — perforated through the lightweight aluminium of the 1820 belvedere" variant="material" number="02" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At the skyline · perforated aluminium</span>
                <div className="signage__big">The water came first.</div>
                <div className="signage__sub">Cut through the lightweight skin by perforation. By day, shadow and depth against bright metal. By night, the room glows from within — a soft lantern above the canal, legible from the bridges, St Pancras, Camley Street.</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // 11-15 — site context images
    ...[1,2,3,4,5].map((n) => familySitePage({
      sectionNum: 18, sectionLabel: "Signal Box", idx: n, slug: "signal-box",
    })),
    // 16 — placeholder area schedule
    familySchedulePage({ sectionNum: 18, sectionLabel: "Signal Box" }),
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §07 VISION — SIX MOVES (3 pages)
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
      presentation: () => <Divider range="§§ 07–11" title="Narrowing the concept." sub="How the building meets the crossing at its western end — and the moves that balance value, cost, and sustainability." />,
      report: () => <Divider range="§§ 07–11" title="Narrowing the concept." sub="How the building meets the crossing at its western end — and the moves that balance value, cost, and sustainability." />,
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
            <p>1 — Be unmistakably contextual.<br/>2 — Be generous.</p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§07 · Vision"
          title="Two principles."
          body={<>
            <p>The site is the eastern threshold of the King's Cross masterplan — the last building before the canal opens to Camley Street and the wider city beyond. Anything built here is the closing statement of one of the most significant pieces of urban regeneration in modern London.</p>
            <p><strong>First, the building should be unmistakably contextual.</strong> The Bagley Walk wall, immediately adjacent, is the purest expression of the vocabulary. The building must answer to this context directly — as a continuation of canal infrastructure made habitable.</p>
            <p><strong>Second, the building should be generous.</strong> The architectural moves at ground level — how the building meets the canal, what it gives back to the city — define whether the building is a tolerated commercial object or a genuine contributor to the place.</p>
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
          capTitle="Structural section — lightweight frame strategy."
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
   "Every King's Cross neighbour has a distinctive crown — the Gasholders, the Granary, Coal Drops Yard. This one says signal box. Read from the bridges and across the basin."],
  ["The lookout",
   "Typologically, a signal box is a place to look out from. The upper room becomes a belvedere — naming the crossing it surveys."],
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
    pres: "Classical composition — symmetric signal box centred on top of the brick mass",
    body: <p>The classical composition. A symmetrical centred signal house reads as a heritage gesture, a quiet completion — a crown. But the gesture asks little of the building; the signal house becomes ornament rather than architecture.</p>,
  },
  {
    slug: "offset",
    t: "Offset signal house",
    pres: "Contemporary inversion — signal house attached to one flank of the brick mass",
    body: <p><strong>Our preferred variant.</strong> A contemporary inversion of the classical composition. The signal house becomes a contemporary <em>addition</em> stuck to one flank of the brick infrastructure, not a crown sitting on top of it. The two parts do not reconcile. <strong>The architectural intelligence is in the precision of their unrelatedness.</strong></p>,
    preferred: true,
  },
  {
    slug: "stepped",
    t: "Stepped signal house",
    pres: "Multi-volume — a cluster of stepped signal-house elements along the roofline",
    body: <p>A more articulated answer. Multiple signal-house volumes step along the roofline, suggesting a small village of working elements. Reads as more domestic and busy than the single offset gesture — less disciplined, less legible at distance.</p>,
  },
];

const S10_new = sectionPages(
  { sectionNum: 19, sectionTitle: "The 1820 — the marker", sectionLabel: "The 1820" },
  [
    {
      label: "The 1820 — what sits at the top",
      presentation: () => (
        <PresCover
          filename="the-1820-room.jpg"
          caption="The 1820 — the cantilevered room at the top, lit at night, seen from the canal, the station and the parks"
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
          caption="The 1820 — the cantilevered room at the top"
          variant="CGI"
          number="1820"
          capIdx="Fig. 10.1"
          capTitle="The 1820 — the marker."
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
            <p><em>Maybe</em> a small museum — telling the history of the canal, the railway, the place.</p>
            <p><em>Maybe</em> a terrace, open to the air. We sense it wants to be outside, not internal.</p>
            <p><em>Maybe</em> the last generous move the building makes to the city.</p>
            <p>If public — incredible.<br/>If private — wonderful for tenants. A draw. A place.</p>
            <p><em>But this is open. A wonderful opportunity to discuss.</em></p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§19 · The marker, before the questions"
          title="What could the 1820 be?"
          body={<>
            <p>The 1820 is the building's marker. What it <em>is</em> is fixed — a cantilevered room at the top, lit at night, visible from the canal, the station, Camley Street, and Coal Drops Yard. From it, you see King's Cross. <strong>What it does</strong> — its programme, its public-ness, its content — is open.</p>
            <p>It could be a small museum of the canal and the railway, telling the story of the place that made King's Cross — a generous gesture from the building to the public realm that surrounds it. It could be a terrace, simply, open to the air; we sense it wants to be outside rather than internal, the air around the crossing rather than a glazed room. It could carry an inscription cut into its lightweight skin — text legible by day through shadow and depth, glowing as a soft lantern at night.</p>
            <p>If public, it is incredible — a free roof for the city, the only one of its kind at King's Cross. If private, it is wonderful for the building's tenants — a draw at the top, a place, a piece of identity money cannot easily buy. <em>The decision between these is one of the four questions that follow — but the 1820 itself, as the building's marker, is not in question.</em></p>
            <p>Before the four questions, then: a clear statement that <strong>the 1820 is the poetic engine of the building, but the building below is also an office, and it has to work.</strong> The four questions that follow are where the office part gets resolved — without compromising the marker.</p>
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
        <div className="q-opt-page__sub mono">{opt.tag} — {opt.cap}</div>
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
    intro: <p>Both options carry the offset 1820 belvedere at the top. The question is whether the floor plates <em>below</em> also cantilever outward — recovering area at the cost of structure and carbon — or sit cleanly on the easy ground and add storeys instead.</p>,
    pickIdx: "B",
    optA: {
      tag: "Option A · G+7",
      title: "Cantilevered plates.",
      fn: "scheme-a-cantilever.jpg",
      cap: "G+7 with full-floor cantilever toward the canal — wider, shorter",
      num: "A",
      points: [
        <>~6,000 sqft per floor — every plate reaches over the hard piece</>,
        <><b>Significant</b> structural transfer at ground level</>,
        <>Heavier embodied carbon — transfer is the carbon villain</>,
        <>Building presses outward; reads heavier on a tight site</>,
        <>Costlier per sqm of NIA</>,
      ],
    },
    optB: {
      tag: "Option B · G+8 / G+9",
      title: "Simple extrusion.",
      fn: "scheme-b-extrusion.jpg",
      cap: "G+8/9 clean stack — only The 1820 cantilevers",
      num: "B",
      points: [
        <>~5,000 sqft per floor — clean stacked structure</>,
        <>No transfer structure — honest, regular grid</>,
        <>Lower embodied carbon, lighter on ground</>,
        <>Building presses upward, reads slender</>,
        <>Only <b>one</b> cantilever in the building — The 1820</>,
        <>Cheaper per sqm but more façade per sqm of NIA</>,
      ],
    },
    instinct: <>Option <b>B</b>. The 1820 is the only cantilever the building needs — repeating the gesture nine times below dilutes it.</>,
  },
  {
    topic: "Core",
    variant: "diagram",
    question: "Perimeter space, or one large coherent space?",
    intro: <p>A plan-level question about the <em>shape</em> of the lettable space, not whether it can be split — <strong>both options can be split</strong>. The core's position determines whether tenants occupy a doughnut of perimeter space around services in the middle, or a single coherent room with services pushed to one flank.</p>,
    pickIdx: "B",
    optA: {
      tag: "Option A · Central core",
      title: "Perimeter space.",
      fn: "scheme-a-central-core.jpg",
      cap: "Central core — a doughnut of perimeter space around services in the middle; splittable into 2–3 tenancies",
      num: "A",
      points: [
        <>Lettable space wraps the core — <b>perimeter daylight</b> on all four sides</>,
        <>Splittable: 1, 2 or 3 tenants per floor</>,
        <>Services break the perimeter — visible from outside</>,
        <>Hits the splittable sub-2,500 sqft segment as well as whole-floor</>,
        <>The conventional plan logic</>,
      ],
    },
    optB: {
      tag: "Option B · Eccentric core",
      title: "One large coherent space.",
      fn: "scheme-b-eccentric-core.jpg",
      cap: "Eccentric core to one flank — single coherent room with daylight on three sides; equally splittable",
      num: "B",
      points: [
        <>A single coherent open volume — <b>three-sided daylight</b></>,
        <>Equally splittable — we can still take 2–3 tenants per floor</>,
        <>Cleaner facade — services contained to one flank</>,
        <>Hits the boutique whole-floor 5,000 sqft segment <em>and</em> the splittable market</>,
        <>The distinctive plan logic</>,
      ],
    },
    instinct: <>Option <b>B</b>. We can split both — so the question is really which <em>shape</em> of space the building should offer. A single coherent room with three-sided daylight is more architecturally generous, more flexible for occupiers, and produces a cleaner elevation. <em>The eccentric core gives up nothing on splittability.</em></>,
  },
  {
    topic: "Substructure",
    variant: "diagram",
    question: "Basement, or 6 m ground floor?",
    intro: <p>Where does the plant live? The basement keeps it hidden but costs in capex, carbon and programme. Lifting plant to a mezzanine frees the ground floor to be 6 m tall — a different kind of building at street level.</p>,
    pickIdx: "B",
    optA: {
      tag: "Option A · With basement",
      title: "Plant below ground.",
      fn: "scheme-a-basement.jpg",
      cap: "Basement plant, standard 3.5–4 m ground floor",
      num: "A",
      points: [
        <>Plant below ground — hidden from the public realm</>,
        <>Standard 3.5–4 m ground floor height</>,
        <>Higher capex — excavation, waterproofing, tube-line interface</>,
        <>More embodied carbon — concrete-heavy substructure</>,
        <>Longer programme — substructure on critical path</>,
      ],
    },
    optB: {
      tag: "Option B · No basement",
      title: "6 m generous ground floor.",
      fn: "scheme-b-no-basement.jpg",
      cap: "Mezzanine plant, double-height 6 m ground floor — café, lobby, deeper daylight",
      num: "B",
      points: [
        <>Plant on mezzanine — expressed, honest</>,
        <><b>6 m double-height ground</b> — café, lobby, daylight reaches deeper</>,
        <>Lower capex, faster programme</>,
        <>Materially lower embodied carbon — possibly decisive on LETI 2030</>,
        <>Building reads taller and more present at street level</>,
      ],
    },
    instinct: <>Option <b>B</b>. The 6 m ground floor is a better building — cheaper, lower-carbon, faster, more generous at the canal threshold. The most consequential single lever in the sub-structure decision tree.</>,
  },
  {
    topic: "The 1820",
    variant: "CGI",
    question: "Tenant-only, or public?",
    intro: <p>The 1820 belvedere is fixed — it is the building's reason for being. The question is who gets to stand on it. A private tenant amenity, or King's Cross's first free public roof.</p>,
    pickIdx: "B",
    optA: {
      tag: "Option A · Tenant-only",
      title: "Private amenity.",
      fn: "scheme-a-private-roof.jpg",
      cap: "The 1820 as private tenant terrace at the top",
      num: "A",
      points: [
        <>Full NIA preserved — no public lift, no public entrance</>,
        <>~£0 incremental capex / opex</>,
        <>Simple operation — no visitor management, no covenant</>,
        <>Building reads private — strong tenant amenity</>,
        <>Conventional planning case</>,
      ],
    },
    optB: {
      tag: "Option B · Public",
      title: "King's Cross's first free public roof.",
      fn: "scheme-b-public-roof.jpg",
      cap: "The 1820 with public lift and entrance — civic belvedere",
      num: "B",
      points: [
        <>~5–8% NIA loss for public lift and entrance</>,
        <>~£1.1m incremental capex / ~£165k p.a. opex</>,
        <><b>£150–300k p.a. event income</b> — opex pays for itself</>,
        <><b>Place premium £5–15/sqft</b> = £225–675k p.a. additional rent</>,
        <>Planning hook under London Plan D9(D) + Camden draft KQ1</>,
        <>Building is civic — visible from inside <em>and</em> outside</>,
      ],
    },
    instinct: <>Option <b>B</b>. The 1820 is wasted if it is only seen by tenants. The whole point of marking the crossing is that the city can stand on it — and the economics work: opex pays for itself in event income, the rental premium funds the capex back inside ten years.</>,
  },
];

// ── Q5 Materials data — mirrors the calculator's HEAVY / LIGHT lists ─────
// Used by QMaterialPage. The "chosen" entry is the proposed material; the
// rest are alternatives presented for the sustainability + cost discussion.
const heavyMaterials = [
  { slug: "brick",          label: "Engineering brick",           carbon: 140, cost:  900, note: "Full bricks. Kiln-fired at ~1,100°C. Same family of brick that built King's Cross.", chosen: true },
  { slug: "brick-slip",     label: "Brick slip on rail",          carbon:  95, cost:  650, note: "20mm slips on a mechanically-fixed carrier. Lower carbon, less honest at close range." },
  { slug: "stone-portland", label: "Portland limestone (UK)",     carbon:  85, cost: 1300, note: "UK-quarried sedimentary. Low energy, but a different vocabulary from the canal." },
  { slug: "stone-granite",  label: "Granite (imported)",          carbon: 280, cost: 1550, note: "Imported, high-energy cutting and shipping. Highest carbon, highest cost." },
  { slug: "precast",        label: "Pre-cast concrete",           carbon: 240, cost:  750, note: "Reconstituted-stone PCC panels. Faster to install, lower cost." },
  { slug: "precast-ggbs",   label: "Pre-cast + GGBS",             carbon: 145, cost:  800, note: "70% GGBS cement replacement. Comparable carbon to brick at lower cost." },
];

const lightMaterials = [
  { slug: "al-recycled",    label: "Aluminium — recycled (CIRCAL 75R)", carbon:  75, cost:  720, note: "75% recycled content. Embodied carbon 75–85% lower than primary aluminium.", chosen: true },
  { slug: "al-primary",     label: "Aluminium — primary",         carbon: 310, cost:  650, note: "Standard cassette; ~12 kgCO₂e/kg. Cheaper, but four times the carbon." },
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
          <div className="q-mat__alts-hd mono">Alternatives — for sustainability + cost discussion</div>
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
    ["01 · Massing",      "B — Simple extrusion",   "Only The 1820 cantilevers."],
    ["02 · Core",         "B — Eccentric",          "Boutique whole-floor lettings; daylight three sides."],
    ["03 · Substructure", "B — No basement",        "6 m generous ground floor; the lowest-carbon path."],
    ["04 · The 1820",     "B — Public",             "King's Cross's first free public roof; sound economics."],
    ["— · Floor plate",   "5,000 sqft",             "The plate that lets every other choice stay simple."],
  ];
  return (
    <div className="q-recap">
      <div className="q-recap__head">
        <Eyebrow>§20 · The scheme we believe in</Eyebrow>
        <h2 className="h-title">Where our instinct lands.</h2>
        {view === "report" ? (
          <div className="prose" style={{maxWidth:'78ch', marginTop: 4}}>
            <p>Each choice individually is defensible at either end. Taken together, our instinct lands consistently on B — a slender, simple, generous, civic building. But this is an interim conversation, not a verdict.</p>
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
        We are presenting these openly because we want your <b>steer</b> on which axis matters most to you — and where the red lines are before the final interview.
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
      presentation: () => <Divider range="§20" title="The five questions." sub="From the poetic to the prosaic. This is also an office building — and it has to work." />,
      report: () => <Divider range="§20" title="The five questions." sub="From the poetic to the prosaic. This is also an office building — and it has to work." />,
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
    // ── Q5 · Materials — title + heavy + light ──────────────────────────
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
          imageCaption="Staffordshire blue-brown engineering brick — the brick of Victorian canal and railway infrastructure"
          lead={<p>The brick body is heavy by intent — it belongs to the canal. The proposed material is full engineering brick; the alternatives below are the heavy options we could discuss for sustainability and cost.</p>}
          materials={heavyMaterials}
          view="presentation"
        />
      ),
      report: () => (
        <QMaterialPage
          slot="heavy"
          image="material-01-brick-sample.jpg"
          imageCaption="Staffordshire blue-brown engineering brick — the brick of Victorian canal and railway infrastructure"
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
          imageCaption="Bright perforated recycled aluminium — Hydro CIRCAL 75R, lantern-like at dusk"
          lead={<p>The signal-box volume is light by intent — bright, lantern-like, in contrast to the brick body. The proposed material is recycled aluminium (CIRCAL 75R); the alternatives below are the light options we could discuss.</p>}
          materials={lightMaterials}
          view="presentation"
        />
      ),
      report: () => (
        <QMaterialPage
          slot="light"
          image="material-04-aluminium-detail.jpg"
          imageCaption="Bright perforated recycled aluminium — Hydro CIRCAL 75R, lantern-like at dusk"
          lead={<p>The signal-box volume is light by intent. Bright, lantern-like, in deliberate contrast to the brick body. The proposed material is Hydro CIRCAL 75R — 75% recycled aluminium with embodied carbon 75–85% lower than primary aluminium. The table below sets out the light alternatives, with embodied carbon and indicative cost. <em>Numbers are indicative and align with the design-side carbon calculator.</em></p>}
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
          title="One honest caveat — what believing in Path B asks of you."
          body={<>
            <p>The G+8/9 scheme we recommend (Path B) sits <strong>outside the existing outline consent</strong>, which envelopes a G+7 building. Both Path A and Path B will require a new planning application — refurbishment is not on the table, and any new office building on this site needs a fresh determination. But the two paths are not equally easy to consent: Path A sits within the established envelope and is, in planning terms, a refinement of what is already known; Path B is a different and more ambitious building, and it asks the planning authority to accept a height greater than the original masterplan anticipated for this plot.</p>
                <p>The argument for Path B at planning is urbanistic: a smaller ground footprint, more public realm at the canal threshold, lower embodied carbon, and full alignment with the King's Cross masterplan's established grain of tall slim buildings on a fine-grained public realm (the Granary Building, R7, R8, the Gasholders apartments). The case is strong, and we believe it will be won — but it is a real piece of work that introduces programme risk.</p>
                <p>Indicatively, that risk costs <strong>9–15 months</strong> of additional design and consenting time at the front of the programme, compared with a Path A application that would move more directly through the King's Cross DRP route. The construction time saving and the cost / carbon savings of Path B compound during build — but the planning time has to be paid up front.</p>
                <p><em>This is not a hidden issue. It is the trade-off the four questions implicitly resolve. We recommend Path B, openly, knowing the cost — because the architectural and sustainability gain is, in our view, materially better than the alternative.</em> The decision is the panel's.</p>
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
    body: <p>The public reading of the building. The dark engineering brick mass rises from the towpath as a continuation of the Bagley Walk wall. The signal house in bright perforated aluminium is visible to one flank — the contemporary contrast, the distinctive silhouette on the King's Cross skyline.</p> },
  { fn: "cgi-02-approach.jpg", t: "Arrival from Goods Way",
    pres: "Gable end revealing the relationship between brick mass and offset signal house",
    body: <p>From the pedestrian approach, the building announces itself as a piece of engineered brick infrastructure. The gable end reveals the relationship between the brick mass and the offset signal house. The stippling and carved brick signage at the base register at close range.</p> },
  { fn: "cgi-03-context.jpg", t: "Within the King's Cross context",
    pres: "Gasholders, Coal Drops Yard, the Granary completing the architectural company",
    body: <p>The wider view places the building among its neighbours. The Gasholders apartments to the north-west, with their perforated metal screens, are the closest contemporary cousins to our signal house. Coal Drops Yard and the Granary beyond complete the architectural company.</p> },
  { fn: "cgi-04-interior.jpg", t: "Interior — eccentric core",
    pres: "Single coherent open volume with daylight from three sides",
    body: <p>The view from inside the lettable space demonstrates the architectural consequence of the eccentric core arrangement. The plate reads as a single coherent open volume. Daylight reaches across the floor from three sides. The canal is visible across the full canal-facing elevation.</p> },
];

const S10 = sectionPages(
  { sectionNum: 13, sectionTitle: "The Recommended Scheme", sectionLabel: "Recommended Scheme" },
  [
    {
      label: "What the building is (act break)",
      isDivider: true,
      presentation: () => <Divider range="§§ 13–14" title="What the building is." sub="The recommended scheme — visualised, materialised." />,
      report: () => <Divider range="§§ 13–14" title="What the building is." sub="The recommended scheme — visualised, materialised." />,
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
                <Placeholder filename={c.fn.replace(".jpg", "-A.jpg")} caption={`${c.pres} — Scheme A (G+7 cantilevered)`} variant="CGI" number="A" />
              </div>
              <div className="cgi-compare__lbl mono">
                <span className="cgi-compare__tag">Scheme A</span>
                <span>G+7 cantilevered · 6,000 sqft plates</span>
              </div>
            </div>
            <div className="cgi-compare__col cgi-compare__col--pick">
              <div className="cgi-compare__media">
                <Placeholder filename={c.fn} caption={`${c.pres} — Scheme B (G+8/9 simple extrusion)`} variant="CGI" number="B" />
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
                <Placeholder filename={c.fn.replace(".jpg", "-A.jpg")} caption={`${c.pres} — Scheme A (G+7 cantilevered)`} variant="CGI" number="A" />
              </div>
              <div className="cgi-compare__lbl mono">
                <span className="cgi-compare__tag">Scheme A</span>
                <span>G+7 cantilevered · 6,000 sqft plates</span>
              </div>
            </div>
            <div className="cgi-compare__col cgi-compare__col--pick">
              <div className="cgi-compare__media">
                <Placeholder filename={c.fn} caption={`${c.pres} — Scheme B (G+8/9 simple extrusion)`} variant="CGI" number="B" />
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
      label: "Our preferred — at scale",
      presentation: () => (
        <PresCover
          filename="cgi-hero-preferred.jpg"
          caption="The preferred scheme — G+8/9 simple extrusion with offset signal house — final hero view"
          overlay={
            <>
              <span className="mono" style={{color: 'var(--accent)', letterSpacing: '0.22em', fontWeight: 500}}>Our preferred</span>
              <h2 className="h-sub" style={{fontSize: 24, maxWidth: '20ch', margin: 0, lineHeight: 1.2}}>G+8/9. Simple extrusion. Offset signal house.</h2>
              <span className="mono" style={{fontSize: 11, color: 'var(--fg-soft)'}}>The crossing · 1820 Goods Way</span>
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
          capTitle="The preferred scheme — at scale."
          kicker="§21 · Preferred scheme"
          title="G+8/9 simple extrusion with offset signal house."
          body={<>
            <p>The hero view of the preferred scheme. The dark engineering brick mass rises from the towpath as a continuation of Bagley Walk; the lightweight aluminium signal house sits offset to one flank, marking the crossing. The four questions on the previous pages tune the variant; the building shown here is what BBBB looks like.</p>
            <p><strong>This is the building we believe in — but openly, awaiting your steer on the four questions.</strong></p>
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
        { lbl: "Path B — recommended", val: 435, range: "380–490", accent: true },
        { lbl: "Path A — cantilevered", val: 650, range: "580–720" },
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
  { sectionNum: 15, sectionTitle: "Sustainability", sectionLabel: "Sustainability" },
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
            <p>Engineering brick — 100–150+ years.<br/>Steel and CLT — 100+ years.<br/>Recycled aluminium — 80+ years, infinitely recyclable.</p>
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
// §15 VIABILITY & THE OFFER (13 pages — area first, then opportunity, then images)
// No numbers / costings here; the calculator (topbar button) handles those
// quantitatively. This section is qualitative — what the area question
// produces architecturally.
// ════════════════════════════════════════════════════════════════════════

const planComparisons = [
  {
    type: "Ground floor",
    planA: {
      fn: "plan-gf-A.jpg",
      cap: "G+7 ground — larger footprint, central core, basement plant below",
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
      cap: "G+8/9 ground — smaller footprint, eccentric core, generous 6 m clear height",
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
      cap: "G+7 typical — larger plate via cantilever, central core",
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
      cap: "G+8/9 typical — smaller plate, eccentric core, three-sided daylight",
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
      cap: "G+7 roof — private 1820 amenity, tenant-only",
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
      cap: "G+8/9 roof — public 1820 belvedere, civic gift",
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
  scheme: "Scheme A — G+7 cantilevered · central core",
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
    { level: "Mezz plant",     gia: 180, nia:   0, note: "Mech + MEP — no basement" },
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
          Indicative — to be plugged into the calculator once finalised.
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
            const eff = r.nia && r.gia ? Math.round((r.nia / r.gia) * 100) + "%" : "—";
            return (
              <tr key={i}>
                <th>{r.level}</th>
                <td>{r.gia.toLocaleString()}</td>
                <td>{r.nia ? r.nia.toLocaleString() : "—"}</td>
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
   "Cafe opens to the towpath. Lobby reads as civic, not commercial. Double-height — daylight reaches deep into the plate. The most consequential single decision in the substructure tree."],
  ["A canal-side public threshold",
   "The building gives back to the city as much as it takes. A café, a route from Goods Way to the towpath, a place to dwell on the water. Not a tolerated commercial object — a contributor."],
  ["The 1820 — a public roof",
   "King's Cross's first free public roof. A belvedere, a function room, a small civic gift. The whole point of marking the crossing is that the city can stand on it."],
];

// closingImages (4 offer pages — café / lobby / floor plate / 1820 belvedere)
// removed; the offer is summarised by the area schedule and the §15 Closing
// section. The image set lived here for §14 page-end.

const S13 = sectionPages(
  { sectionId: "viability", sectionNum: 21, sectionTitle: "1820 Goods Way", sectionLabel: "1820 Goods Way" },
  [
    {
      label: "1820 Goods Way (act break)",
      isDivider: true,
      presentation: () => <Divider range="§21" title={<>1820 Goods Way.<br/>The water came first.</>} sub="The first mark on this site was the canal, 1820. The last mark is this building." />,
      report: () => <Divider range="§21" title={<>1820 Goods Way.<br/>The water came first.</>} sub="The first mark on this site was the canal, 1820. The last mark is this building." />,
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
            <p>The site is tight, and tightly priced — both on the way in (cost per m² is roughly fixed) and on the way out (rent per m² is roughly fixed). Inefficiency compounds against you both ways. The first viability question, before cost, carbon, or programme, is therefore <strong>area</strong>: how much usable area does the scheme produce, and how efficiently is it produced.</p>
                <p>The pages that follow are the area story for both schemes — ground, typical, and roof plans side-by-side, with indicative areas annotated; then a per-scheme area schedule. The cost and carbon implications of these areas are quantified in the calculator (top-right of the toolbar), which can be re-run with these areas once finalised.</p>
          </>}
        />
      ),
    },
    {
      label: "The plan — hugging the boundary",
      presentation: () => (
        <PresImage
          filename="viability-plan-sketch.jpg"
          caption="Plan sketch — the building hugs the site boundary, no chamfers, no setbacks"
          variant="sketch"
          capIdx="The plan"
          capTitle="The plan hugs the site boundary."
          capMeta="No chamfers, no setbacks — area maximised by geometry alone."
        />
      ),
      report: () => (
        <ReportImageText
          filename="viability-plan-sketch.jpg"
          caption="Plan sketch — the building hugs the site boundary, no chamfers, no setbacks"
          variant="sketch"
          capIdx="Fig. 13.0"
          capTitle="The plan hugs the site boundary."
          kicker="§21 · The plan"
          title="The plan maximises area by simply hugging the boundary."
          body={<>
            <p>The plan does the simplest possible thing the site allows. <strong>It follows the site boundary edge-for-edge</strong> — no chamfers, no setbacks, no formal gestures that subtract usable floor area. The geometry alone earns the area; no architectural performance is asked of the plan itself.</p>
            <p>Discipline at the plan level lets every other choice in the building (the section, the structure, the signal house above) stay simple and legible. The boundary <em>is</em> the figure.</p>
          </>}
        />
      ),
    },
    {
      label: "The section — simple office, lightweight crown",
      presentation: () => (
        <PresImage
          filename="viability-section-sketch.jpg"
          caption="Section sketch — a simple office building below; a lightweight expression on the roof"
          variant="sketch"
          capIdx="The section"
          capTitle="A simple office. A lightweight crown."
          capMeta="The roof speaks to the city and to the crossing."
        />
      ),
      report: () => (
        <ReportImageText
          filename="viability-section-sketch.jpg"
          caption="Section sketch — a simple office building below; a lightweight expression on the roof"
          variant="sketch"
          capIdx="Fig. 13.1"
          capTitle="A simple office below, a lightweight crown above."
          kicker="§21 · The section"
          title="A simple office building, with a lightweight roof speaking to the city."
          body={<>
            <p>In section, the building is disciplined to two things. Below: <strong>a simple office building</strong> — clean stacked plates, regular grid, no transfer structure. Above: <strong>a lightweight expression on the roof</strong> — the signal-box volume that speaks to the city and to the crossing the building is named for.</p>
            <p>The poetry lives at the top. The plates below quietly earn their area. The two work because they are not asked to do each other's job.</p>
          </>}
        />
      ),
    },
    ...planComparisons.map((comp, i) => ({
      label: `${comp.type} — A vs B`,
      presentation: () => <PlanComparePage idx={i+1} total={planComparisons.length} comp={comp} />,
      report: () => <PlanComparePage idx={i+1} total={planComparisons.length} comp={comp} />,
    })),
    // Scheme A area schedule removed; only the Signal Box scheme is shown.
    {
      label: "Signal Box Scheme · area schedule",
      presentation: () => <SchedulePage schedule={scheduleB} pickAccent={true} />,
      report: () => <SchedulePage schedule={scheduleB} pickAccent={true} />,
    },
    // "The opportunity at 1820" page removed — content folded into the Urban
    // page below (tenant / building / city) to avoid duplication.
    // The four "offer" pages (café / lobby / floor plate / 1820 belvedere) removed.
    // ─────────────────────────────────────────────────────────────────────
    //  THE FINALE — sustainable / efficient / urban / poetic, then the
    //  image crescendo. The first mark on this site was the canal, 1820;
    //  the final mark is the 1820 lookout standing over the crossing.
    // ─────────────────────────────────────────────────────────────────────
    {
      label: "Sustainable",
      presentation: () => (
        <PresStatement
          kicker="§21 · Sustainable"
          title="1820 Goods Way is sustainable by design."
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
          kicker="§21 · Sustainable · 1820 Goods Way"
          title="1820 Goods Way is sustainable because of its discipline, not in spite of it."
          body={<>
            <p>The building does not add sustainability to itself. It is sustainable because the design moves it makes are the right ones for <em>this site</em>. The slender extrusion avoids the transfer structure a cantilever would require above the Northern, Piccadilly, Victoria and Thameslink lines below. The absence of a basement removes the carbon-heaviest single line of the build, and respects the loading caps and the proximity of the canal wall. The brick is the same family that built King's Cross, with a design life over a hundred years. The signal house above is recycled aluminium — Hydro CIRCAL 75R, 75% recycled, embodied carbon a fraction of primary aluminium.</p>
            <p>The numbers: ~<strong>380–490 kgCO₂e/m² GIA</strong> against a conventional baseline of 720–950 — LETI 2030 territory and comfortably within RIBA 2030. Every primary material has a defined recovery route. Brick recoverable through lime mortar. Aluminium infinitely recyclable. CLT reusable or biomass-recoverable. Steel at over 90% recycled-content recovery.</p>
            <p>The first mark on this site was the canal, dug in 1820 for the working life of a city. The last mark is a building designed not to need replacing in our lifetime. <em>1820 Goods Way is sustainable because of the way it sits on this site, not because we added sustainability to it.</em></p>
          </>}
        />
      ),
    },
    {
      label: "Efficient",
      presentation: () => (
        <PresStatement
          kicker="§21 · Efficient"
          title="1820 Goods Way is efficient because of its plan."
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
          kicker="§21 · Efficient · 1820 Goods Way"
          title="1820 Goods Way earns its area through discipline, not architectural performance."
          body={<>
            <p>On a tight site, every square metre has to work twice. Once on the way in: each square metre costs roughly the same to build. Once on the way out: each square metre that does not let earns nothing for the life of the building. The plan is the first thing to get right, and on this scheme the plan does the simplest possible thing — it follows the site boundary edge for edge, no chamfers, no formal gestures that subtract usable area. The boundary <em>is</em> the figure.</p>
            <p>Above the plan, the section is a simple stacked extrusion. No transfer structure, no cantilever below the signal house. The eccentric core produces a single coherent floor plate without service breaks on the perimeter — daylight from three sides, the canal visible across the full canal elevation. The no-basement substructure removes the carbon-heaviest single line of the build and the longest item on the programme. The interactive calculator at the top of the toolbar quantifies the consequence of each of these moves, with a ±10% sensitivity band reflecting RIBA Stage 2 typical uncertainty.</p>
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
          <h2 className="h-title" style={{marginBottom: 4}}>1820 Goods Way gives back to the city.</h2>
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
                <div className="numlist__desc">A café opens to the towpath. A 6 m ground floor reads as civic, not commercial. A route from Goods Way to the water. And above it all, King's Cross's first free public roof — a lookout from which the crossing of the canal of 1820 and the railway of 1852 can be read in one view.</div>
              </div>
            </li>
          </ol>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§21 · Urban · 1820 Goods Way</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 8}}>1820 Goods Way gives back to the city it stands in.</h2>
          <div className="prose" style={{maxWidth: '78ch', marginBottom: 8}}>
            <p>A building on this site can either occupy King's Cross or contribute to it. 1820 Goods Way is built around the second. The case is made in three ascending layers — what the building gives the tenant, what it gives itself, and what it gives the city — and the three layers reinforce each other rather than compete. <em>Not a tolerated commercial object. A contributor.</em></p>
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
                <div className="numlist__desc">The 1820 belvedere is the building's moniker. The date the canal opened, written into the address itself. Address quality, rental tone, and planning hook all earned by a single small object at the top. Place premium £5–15/sqft = £225–675k p.a. of additional rent — capex recovered inside ten years, on London Plan D9(D) precedents.</div>
              </div>
            </li>
            <li className="numlist__item">
              <span className="numlist__num">03</span>
              <div>
                <div className="numlist__title">To the city</div>
                <div className="numlist__desc">At canal level, a café opens to the towpath and a 6 m double-height ground floor reads as civic, not commercial — a public threshold rather than a corporate lobby. A direct route from Goods Way to the water passes through the building. Above, the 1820 belvedere is King's Cross's first free public roof — the lookout the masterplan once had on loan from Felice Varini's "Across the Buildings" (RELAY, 2007), now made permanent. A marker from which the crossing of the canal of 1820 and the railway of 1852 can be read in a single view. The small civic gift that turns a regeneration into a place.</div>
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
          title="1820 Goods Way comes full circle."
          body={<>
            <p>The first mark on this site was the canal. 1820.</p>
            <p>The building is named for it.</p>
            <p>The brick at canal level says <strong>where you are</strong>: 1820 Goods Way.<br/>The aluminium at the skyline says <strong>why the building is here</strong>: the water came first.</p>
            <p><em>The last mark on the crossing the water made.</em></p>
          </>}
        />
      ),
      report: () => (
        <ReportProse
          kicker="§21 · Poetic · 1820 Goods Way"
          title="The last mark on the crossing the water made."
          body={<>
            <p>Every layer of this site has been a mark on a crossing. Battle Bridge over the River Fleet was the first. The canal, cut in 1820, gave the place its shape, its industry, and its name. The railway came in 1852 and crossed the canal in turn. The goods yard followed, then the lights going out, then the clubs and the long quiet, then Argent's masterplan and the slow re-knitting of the place. 1820 Goods Way is the last move on the last plot of that masterplan. The last mark.</p>
            <p>The building is named for the first mark. The brick at canal level carries <em>1820 Goods Way</em>, recessed and carved into the engineering brick, read at arm's reach as you arrive on foot — the address as Victorian canal vocabulary. The aluminium at the skyline carries <em>the water came first</em>, perforated through the lightweight skin of the lookout — by day shadow and depth against bright metal, by night a soft lantern above the canal, legible from the bridges, the station, and Camley Street.</p>
            <p>Two voices. One says where you are. The other says why the building is here. They do not reconcile and they are not meant to. The building speaks twice because the site has spoken to it twice — first as the crossing the water made, then as the city that grew around the water. 1820 Goods Way carries both into one quiet object.</p>
            <p><em>A simple, contextual office building, with a public offering of space. The last mark on the crossing the water made.</em></p>
          </>}
        />
      ),
    },
    // ── IMAGE CRESCENDO — five views, building toward the climax ────────
    //    01 distant · 02 wider · 03 approach · 04 lantern · 05 from the 1820
    // Night CGI page removed — its overlay ("water came first / building
    // came last") restated the Poetic page on the previous slide, and the
    // atmospheric night view is now carried by the "At dusk, the lookout
    // lit" placeholder below.
    ...[
      { slug: "01", view: "From the opposite towpath.",                       sub: "The building seen from the canal that named it." },
      { slug: "02", view: "Within the King's Cross context.",                 sub: "Among the Gasholders, the Granary, Coal Drops Yard." },
      { slug: "03", view: "Arrival from Goods Way.",                          sub: "Brick at ground. 1820 Goods Way, carved into the wall." },
      { slug: "04", view: "At dusk, the lookout lit.",                        sub: "The water came first, perforated through the aluminium." },
      { slug: "05", view: "From the 1820 — the crossing, in every direction.", sub: "Standing on the building. The city, in eyeshot." },
    ].map((s, i) => ({
      label: `1820 Goods Way · ${s.view}`,
      presentation: () => (
        <PresCover
          filename={`signal-box-final-${s.slug}.jpg`}
          caption={`1820 Goods Way · ${s.view}`}
          overlay={
            <>
              <span className="mono" style={{color: 'var(--accent)', letterSpacing: '0.22em', fontWeight: 500}}>1820 Goods Way</span>
              <span className="mono" style={{fontSize: 13, color: 'var(--fg)', letterSpacing: '0.02em', fontWeight: 500}}>{s.view}</span>
              <span className="mono" style={{fontSize: 11, color: 'var(--fg-soft)', letterSpacing: '0.04em'}}>{s.sub}</span>
            </>
          }
        />
      ),
      report: () => (
        <ReportImageText
          filename={`signal-box-final-${s.slug}.jpg`}
          caption={`1820 Goods Way · ${s.view}`}
          variant="CGI"
          number={s.slug}
          capIdx={`Final · ${i+1} of 5`}
          capTitle={s.view}
          kicker={`§21 · 1820 Goods Way · final view ${i+1} of 5`}
          title={s.view}
          body={<p>{s.sub} Placeholder — drop a final CGI / hero render onto the slot to populate.</p>}
        />
      ),
    })),
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §16 WORKING WITH US (consolidated — open questions, next steps, practice)
// 2 pages: one outlines what's next + what's open; one is the practice CV.
// Positioned BEFORE the closing arc so the presentation doesn't fade out.
// ════════════════════════════════════════════════════════════════════════
const workingOpenList = (
  <ol className="numlist">
    {[
      ["Land cost & acquisition", "The commercial framework that determines what the site is worth."],
      ["Finance, rent, yield, tax", "The appraisal that converts the design proposition into a viable development."],
      ["Detailed planning strategy", "Formal Camden and King's Cross DRP route — not yet pursued."],
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
    <li>British Homes Awards 2025 — four trophies, dual Architect of the Year</li>
    <li>RIBA House of the Year — shortlisted three times</li>
    <li>Stephen Lawrence Prize — shortlisted three times</li>
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
              <p>We approach every project from the position that the site comes first. On this project, that means <strong>the water came first.</strong></p>
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
              <p>The practice has a portfolio of canal-side, infrastructure-adjacent and contextually sensitive projects across London — Holland Park Gate, 22 Handyside Street, The Tannery Bermondsey and Rich Estate among them.</p>
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

// S15 (Closing/1820 Goods Way) removed — content folded into S13 above.


// ════════════════════════════════════════════════════════════════════════
// §20 PARKING LOT (3 pages — pulled out earlier sections, kept for reference)
// ════════════════════════════════════════════════════════════════════════
const S18 = sectionPages(
  { sectionNum: 20, sectionTitle: "Parking lot", sectionLabel: "Parking" },
  [
    {
      label: "Six-moves diagram (parked)",
      presentation: () => (
        <PresImage
          filename="six-moves-diagram.jpg"
          caption="The single most important image of the pitch — to be hand-drawn"
          variant="diagram"
          capIdx="Fig. 6.0"
          capTitle="Six architectural moves — diagrammatic section."
          capMeta="Parked · originally §07"
        />
      ),
      report: () => (
        <ReportImageText
          filename="six-moves-diagram.jpg"
          caption="Six architectural moves diagram"
          variant="diagram"
          capIdx="Fig. 6.0"
          capTitle="Six architectural moves — diagrammatic section."
          kicker="§19 · Parked from §07 · Diagrammatic section"
          title="Six moves, located on the section."
          body={<>
            <p>Each move is the architectural consequence of the two principles. Together they make the building a contributor to King's Cross, not just an occupant of it.</p>
            <p>The diagram on the left locates each move within the section of the building — from the public colonnade at canal level to the shared signal house lookout at the top.</p>
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
            <p>— Tube lines below. Loading caps apply.</p>
            <p>— Canal wall cannot carry load.</p>
            <p>— Core concentrated on the eastern edge.</p>
            <p><em>The architecture follows the engineering.</em></p>
          </div>
        </div>
      ),
      report: () => (
        <ReportProse
          kicker="§19 · Parked from §05 · Lightweight frame"
          title="Steel and CLT — the only realistic strategy."
          body={<>
            <ul>
              <li><strong>Weight</strong> — 40–50% lighter than reinforced concrete, within achievable loading envelope above tube structures.</li>
              <li><strong>Speed</strong> — 1.5–2 storeys/week, vs 1 storey/week for concrete; 12–16 week programme saving.</li>
              <li><strong>Embodied carbon</strong> — 280–350 kgCO2e/m² GIA structure, vs 500–650 for RC; CLT provides biogenic sequestration.</li>
              <li><strong>Acoustic + fire</strong> — modern CLT specifications meet all commercial office requirements with appropriate topping, sprinkler protection, and non-combustible cladding.</li>
            </ul>
            <p>This produces the <strong>eccentric core</strong> arrangement that defines the architectural plan — the lettable plate to the west is freed as a single coherent open volume.</p>
          </>}
        />
      ),
    },
  ]
);

// ════════════════════════════════════════════════════════════════════════
// §06 A CONSIDERED INTERVENTION (60 pages) — site photographs, sketched over
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

// §06 — Site Walk (was "A Considered Intervention" + standalone Site Walk;
// merged into a single section: title page + 58 site-walk photographs +
// the "What we learnt" closer). The Vision section (was §07) is gone.
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
    // Closer — "What we learnt from the site walk" (was the §08 Site Walk
    // section's second page; folded in here at the end of the sequence).
    {
      label: "What we learnt from the site walk",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§06 · Site Walk</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>What we learnt from the site walk.</h2>
          <ol className="numlist" style={{marginTop: 18}}>
            {[
              "The building sits alone. It is distinct.",
              "We see the building firstly as an artifact of the canal, not of the street.",
              "The canal life and boats can bring real activity to the ground plane.",
              "The building can act as a hinge — improving the canal to the east and the undercroft of the bridge.",
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
          <Eyebrow>§06 · Site Walk · What we learnt</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 8}}>What we learnt from the site walk.</h2>
          <div className="prose tight" style={{maxWidth: '78ch', marginBottom: 8}}>
            <p>Five observations from walking the site. Each shaped the brief we set ourselves; each shows up in the design moves on the pages that follow.</p>
          </div>
          <ol className="numlist">
            {[
              "The building sits alone. It is distinct.",
              "We see the building firstly as an artifact of the canal, not of the street.",
              "The canal life and boats can bring real activity to the ground plane.",
              "The building can act as a hinge — improving the canal to the east and the undercroft of the bridge.",
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

// ═══════════════════════════════════════════════════════════════════════
// NEW SEQUENCE (§08–§16) — inserted between §07 Vision and the existing
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
              "The building can act as a hinge — improving the canal to the east and the undercroft of the bridge.",
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
              "The building can act as a hinge — improving the canal to the east and the undercroft of the bridge.",
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
      label: "The Challenge — statement",
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
            <p>Every word in that sentence carries weight. <em>Boutique</em> — the segment the building is built for, where every square metre has to earn itself. <em>Simple</em> — discipline at the plan, no architectural gymnastics. <em>Viable</em> — the numbers have to work. <em>Meaning</em> — the building has to be more than a frame for rent. <em>Joy</em> — for the tenant inside, and the city outside. <em>Honour</em> — to a site that has been a working crossing since 1820, and a part of London's history far longer than that.</p>
          </>}
        />
      ),
    },
    // ── Who is the tenant? ─────────────────────────────────────────────
    //    Sits between the brief and the design work. Stays open: the
    //    boutique 500–600 m² segment is the answer either way (Canopy
    //    600 m², Signal Box 500 m²). Full workings on the 500/600 tab.
    {
      label: "Who is the tenant?",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§07 · Who is the tenant?</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 18}}>Whole floor. 500–600 m².</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 14}}>
            {[
              { v: "~50%",       l: "of central London supply is sub-5,000 sqft", s: "Savills, Q4 2025 — the boutique segment is structurally short." },
              { v: "£200–296",   l: "per sqft on fully-managed boutique floors",   s: "170 Piccadilly, 141 Wardour, GPE H2 2025 deals." },
              { v: "450k sqft",  l: "AI lettings in London — May 2026 alone",      s: ">10× the 2025 monthly average. King's Cross is the cluster." },
            ].map((s, i) => (
              <div key={i} style={{border: '1px solid var(--rule-soft)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4}}>
                <div className="mono" style={{fontSize: 22, color: 'var(--accent)', fontWeight: 500, letterSpacing: 0.02}}>{s.v}</div>
                <div style={{fontSize: 12, color: 'var(--fg)', lineHeight: 1.3}}>{s.l}</div>
                <div className="mono" style={{fontSize: 10, color: 'var(--fg-dim)', letterSpacing: 0.04, marginTop: 4}}>{s.s}</div>
              </div>
            ))}
          </div>
          <div className="prose" style={{maxWidth: '78ch', fontSize: 13, color: 'var(--fg-soft)', marginBottom: 10}}>
            <strong style={{color: 'var(--fg)'}}>Who's in the segment.</strong> Creative + design agencies · Series B–C tech scale-ups · AI scale-ups below the top tier · Specialist finance and wealth · Architecture, engineering, consulting · International UK headquarters.
          </div>
          <div className="mono" style={{fontSize: 11, color: 'var(--fg-dim)', letterSpacing: 0.04, marginTop: 'auto'}}>
            Full workings — comparables, supply, tenant profiles, building-to-tenant match — on the <strong style={{color: 'var(--accent)'}}>500/600 · Who is the tenant?</strong> tab (top toolbar).
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§07 · The Challenge · Who is the tenant?</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 8}}>Whole floor. 500–600 m².</h2>
          <div className="prose tight" style={{maxWidth: '78ch'}}>
            <p>The tenant case sits behind every floor-plate decision the building makes. Both directions on the pages that follow — Canopy at ~600 m², Signal Box at ~500 m² — land in the same lettable segment. <em>The choice between them is design-led, not market-led.</em></p>
            <p><strong>The segment is structurally short.</strong> Sub-5,000 sqft accounts for roughly half of central London's office supply (Savills Q4 2025) — and whole-floor boutique is the part of that share that's hardest to find. Best-in-class fully-managed deals in the boutique band are clearing at £200–£296 / sqft (170 Piccadilly, 141 Wardour, GPE H2 2025) — premium per-sqft tolerance from tenants who value a floor of their own.</p>
            <p><strong>King's Cross is the cluster.</strong> AI lettings in London reached 450,000 sqft in May 2026 alone — more than ten times the 2025 monthly average — and OpenAI's first permanent UK office (88,500 sqft) opened here in April. The boutique floors sit underneath the very-large lettings: the Series B–C tech, the AI scale-ups below the top tier, the creative practices that brand the building as theirs. Plus the older boutique tenants — specialist finance, architecture, design, international UK HQs — who want the character without the floor count.</p>
            <p>Both 500 m² and 600 m² satisfy the same fundamentals: whole-floor letting, three-sided daylight, a coherent open plate, a building that reads as a place. The 600 m² Canopy version trades structural complexity for area; the 500 m² Signal Box version trades area for slenderness and a simpler section. <em>The market answer is the same in both — the architectural answer is what we are here to discuss.</em></p>
            <p className="mono" style={{fontSize: 11, color: 'var(--fg-dim)', letterSpacing: 0.04, marginTop: 12}}>
              Full workings — comparables, supply data, tenant profiles, building-to-tenant matching — on the <strong style={{color: 'var(--accent)'}}>500/600 · Who is the tenant?</strong> tab in the top toolbar.
            </p>
          </div>
        </div>
      ),
    },
  ]
);

// ── §10 Five Families ───────────────────────────────────────────────────
//    Five conceptual families, each presented as: a concept page +
//    a page of three landscape model photos.
const fiveFamilies = [
  { slug: "canopy",     title: "Canopy.",     sub: "A low canopy that gives back to the canal." },
  { slug: "terrace",    title: "Terrace.",    sub: "Greenery stepping up and over the building." },
  { slug: "signal-box", title: "Signal Box.", sub: "A heavy body with a lightweight lookout above." },
  { slug: "carve",      title: "Carve.",      sub: "A distinctive cut into the elevation." },
  { slug: "roofline",   title: "Roofline.",   sub: "Contextual pitched and gabled forms." },
];

const SFiveFamilies = sectionPages(
  { sectionNum: 8, sectionTitle: "Five Families", sectionLabel: "Five Families" },
  [
    {
      label: "Five Families (title)",
      isDivider: true,
      presentation: () => <Divider range="§08" title="Five Families." sub="Five conceptual directions, each tested in physical model." />,
      report:       () => <Divider range="§08" title="Five Families." sub="Five conceptual directions, each tested in physical model." />,
    },
    ...fiveFamilies.flatMap((f, i) => {
      // Concept page — single landscape image, EXCEPT Signal Box which
      // keeps the photo + sketch pair side-by-side.
      const isPair = f.slug === "signal-box";
      const conceptPage = {
        label: `${f.title.replace('.', '')} · Concept`,
        presentation: () => (
          <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
            <Eyebrow>§08 · Five Families · {i+1} of 5</Eyebrow>
            <h2 className="h-title" style={{marginBottom: 6}}>{f.title}</h2>
            <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 18}}>
              {f.sub}
            </div>
            {isPair ? (
              <div style={{flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
                <div style={{display: 'flex', minHeight: 0, minWidth: 0}}>
                  <Placeholder filename={`family-${f.slug}-concept-photo.jpg`} caption={`${f.title.replace('.', '')} — photograph (landscape, left of pair)`} variant="photo" aspect="3/2" />
                </div>
                <div style={{display: 'flex', minHeight: 0, minWidth: 0}}>
                  <Placeholder filename={`family-${f.slug}-concept-sketch.jpg`} caption={`${f.title.replace('.', '')} — concept sketch (landscape, right of pair)`} variant="sketch" aspect="3/2" />
                </div>
              </div>
            ) : (
              <div style={{flex: 1, minHeight: 0, display: 'flex'}}>
                <Placeholder filename={`family-${f.slug}-concept.jpg`} caption={`${f.title.replace('.', '')} — concept image (landscape)`} variant="photo" aspect="3/2" />
              </div>
            )}
          </div>
        ),
        report: () => (
          <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
            <Eyebrow>§08 · Five Families · {i+1} of 5 · Concept</Eyebrow>
            <h2 className="h-title" style={{marginBottom: 8}}>{f.title}</h2>
            <div className="prose tight" style={{maxWidth: '78ch', marginBottom: 12}}>
              <p>{f.sub}</p>
            </div>
            {isPair ? (
              <div style={{flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
                <div style={{display: 'flex', minHeight: 0, minWidth: 0}}>
                  <Placeholder filename={`family-${f.slug}-concept-photo.jpg`} caption={`${f.title.replace('.', '')} — photograph (landscape, left of pair)`} variant="photo" aspect="3/2" />
                </div>
                <div style={{display: 'flex', minHeight: 0, minWidth: 0}}>
                  <Placeholder filename={`family-${f.slug}-concept-sketch.jpg`} caption={`${f.title.replace('.', '')} — concept sketch (landscape, right of pair)`} variant="sketch" aspect="3/2" />
                </div>
              </div>
            ) : (
              <div style={{flex: 1, minHeight: 0, display: 'flex'}}>
                <Placeholder filename={`family-${f.slug}-concept.jpg`} caption={`${f.title.replace('.', '')} — concept image (landscape)`} variant="photo" aspect="3/2" />
              </div>
            )}
          </div>
        ),
      };
      return [conceptPage,
      // Three model photos page
      {
        label: `${f.title.replace('.', '')} · Models`,
        presentation: () => (
          <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
            <Eyebrow>§08 · Five Families · {i+1} of 5 · Models</Eyebrow>
            <h2 className="h-sub" style={{marginBottom: 14}}>{f.title} <span style={{color: 'var(--fg-dim)', fontWeight: 400}}>— in model.</span></h2>
            <div style={{flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14}}>
              {[1,2,3].map((n) => (
                <div key={n} style={{display: 'flex', minHeight: 0, minWidth: 0}}>
                  <Placeholder filename={`family-${f.slug}-model-0${n}.jpg`} caption={`${f.title.replace('.', '')} model ${n} of 3 — landscape photo`} variant="model" number={String(n)} aspect="3/2" />
                </div>
              ))}
            </div>
          </div>
        ),
        report: () => (
          <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
            <Eyebrow>§08 · Five Families · {i+1} of 5 · Models</Eyebrow>
            <h2 className="h-sub" style={{marginBottom: 12}}>{f.title} <span style={{color: 'var(--fg-dim)', fontWeight: 400}}>— in model.</span></h2>
            <div style={{flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14}}>
              {[1,2,3].map((n) => (
                <div key={n} style={{display: 'flex', minHeight: 0, minWidth: 0}}>
                  <Placeholder filename={`family-${f.slug}-model-0${n}.jpg`} caption={`${f.title.replace('.', '')} model ${n} of 3 — landscape photo`} variant="model" number={String(n)} aspect="3/2" />
                </div>
              ))}
            </div>
          </div>
        ),
      }];
    }),
  ]
);

// ── §11 Five Viability Questions ────────────────────────────────────────
const viabilityQs = [
  { title: "Eccentric core.",                         sub: "One coherent plate, daylight from three sides." },
  { title: "Extended floor plate — support or hang?", sub: "Cantilever from below, or suspend from above." },
  { title: "Basement.",                               sub: "Plant below, or lift it to a mezzanine and free the ground." },
  { title: "Build to the canal wall.",                sub: "How far do we go? What does it mean for the towpath?" },
  { title: "Two staircases — height versus efficiency.", sub: "Code-driven, but every metre of core costs lettable area." },
];

const SViabilityQs = sectionPages(
  { sectionNum: 9, sectionTitle: "Five Viability Questions", sectionLabel: "Viability Qs" },
  [
    {
      label: "Five Viability Questions (title)",
      isDivider: true,
      presentation: () => <Divider range="§09" title="Five Viability Questions." sub="The technical questions every scheme has to answer." />,
      report:       () => <Divider range="§09" title="Five Viability Questions." sub="The technical questions every scheme has to answer." />,
    },
    ...viabilityQs.map((q, i) => ({
      label: `Q${i+1} · ${q.title}`,
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§09 · Question {i+1} of 5</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 6}}>{q.title}</h2>
          <div className="prose" style={{maxWidth: '64ch', fontSize: 18, color: 'var(--fg-soft)', marginBottom: 14}}>
            {q.sub}
          </div>
          <div style={{flex: 1, minHeight: 0, display: 'flex'}}>
            <Placeholder filename={`viability-q${i+1}-${slugify(q.title)}.jpg`} caption={`Question ${i+1} — ${q.title.replace('.', '')} — diagram or study image`} variant="diagram" aspect="16/9" />
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§09 · Question {i+1} of 5</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 8}}>{q.title}</h2>
          <div className="prose tight" style={{maxWidth: '78ch', marginBottom: 12}}>
            <p>{q.sub}</p>
          </div>
          <div style={{flex: 1, minHeight: 0, display: 'flex'}}>
            <Placeholder filename={`viability-q${i+1}-${slugify(q.title)}.jpg`} caption={`Question ${i+1} — ${q.title.replace('.', '')} — diagram or study image`} variant="diagram" aspect="16/9" />
          </div>
        </div>
      ),
    })),
    // "What we learnt" closer page removed.
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
    {
      label: "Marking the crossing without obstructing it",
      presentation: () => (
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr', gap: 36, height: '100%', minHeight: 0, alignItems: 'stretch'}}>
          <div style={{display: 'flex', minHeight: 0, minWidth: 0}}>
            <Placeholder filename="too-long-square.jpg" caption="The Building is too long? — square image (sketch, model, diagram or photo of the crossing)" variant="sketch" aspect="1/1" />
          </div>
          <div className="pc-stmt" style={{maxWidth: 'none', width: '100%', justifyContent: 'center'}}>
            <Eyebrow>§10 · The tension</Eyebrow>
            <h2 className="h-title" style={{marginBottom: 12}}>Mark the crossing. Don't obstruct it.</h2>
            <div className="prose" style={{maxWidth: '46ch', fontSize: 16, color: 'var(--fg)', display: 'flex', flexDirection: 'column', gap: 10}}>
              <p>The site sits where the canal and railway cross. The building's job is to mark that crossing, not block it.</p>
              <p><em>How much do we fill the undercroft, and how much do we leave open?</em></p>
              <p>The 1820 room and the public café — up high as a marker, or low at the ground as a threshold?</p>
              <p>A public space at the building's foot — or under it.</p>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr', gap: 36, height: '100%', minHeight: 0, alignItems: 'stretch'}}>
          <div style={{display: 'flex', minHeight: 0, minWidth: 0}}>
            <Placeholder filename="too-long-square.jpg" caption="The Building is too long? — square image (sketch, model, diagram or photo of the crossing)" variant="sketch" aspect="1/1" />
          </div>
          <div className="pc-stmt" style={{maxWidth: 'none', width: '100%', justifyContent: 'center'}}>
            <Eyebrow>§10 · The tension — marking without obstructing</Eyebrow>
            <h2 className="h-title" style={{marginBottom: 10}}>The building has to mark the crossing without obstructing it.</h2>
            <div className="prose tight" style={{maxWidth: '52ch'}}>
              <p>The client raised it directly; the planners echo the concern. The building sits at the point where the canal and the railway cross, and a long volume sitting on the full plot risks obstructing that crossing rather than marking it. The question, in design terms, is one of balance.</p>
              <p>Three sub-questions follow. <strong>The undercroft</strong>: fill it, or leave it open as a public passage between Goods Way and the towpath? <strong>The 1820 room and the café</strong>: up high as a marker visible from the city, or low at the ground as a public threshold? <strong>The public space</strong>: at the building's foot, around it, or carved underneath it as a sheltered civic room?</p>
              <p>The two directions on the pages that follow — Canopy and Signal Box — answer this question differently. Both mark the crossing. They differ in how they treat the space below.</p>
            </div>
          </div>
        </div>
      ),
    },
  ]
);

// ── §13 Two Chosen Directions ───────────────────────────────────────────
const STwoChosen = sectionPages(
  { sectionNum: 11, sectionTitle: "Two Chosen Directions", sectionLabel: "Two Directions" },
  [
    {
      label: "Two Chosen Directions (title)",
      isDivider: true,
      presentation: () => <Divider range="§11" title="Two Chosen Directions." sub="Canopy and Signal Box. One brief. Two answers." />,
      report:       () => <Divider range="§11" title="Two Chosen Directions." sub="Canopy and Signal Box. One brief. Two answers." />,
    },
    {
      label: "Two Directions — Canopy and Signal Box",
      presentation: () => (
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr', gap: 36, height: '100%', minHeight: 0, alignItems: 'stretch'}}>
          <div style={{display: 'flex', minHeight: 0, minWidth: 0}}>
            <Placeholder filename="two-directions-sketch.jpg" caption="Two directions — landscape sketch (Canopy reaching to the canal; Signal Box marking the crossing from above)" variant="sketch" aspect="4/3" />
          </div>
          <div className="pc-stmt" style={{maxWidth: 'none', width: '100%', justifyContent: 'center'}}>
            <Eyebrow>§11 · Two Directions</Eyebrow>
            <h2 className="h-title" style={{marginBottom: 14}}>Two ways to mark the crossing.</h2>
            <div className="prose" style={{maxWidth: '48ch', fontSize: 15, color: 'var(--fg)', display: 'flex', flexDirection: 'column', gap: 12}}>
              <div>
                <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4}}>Canopy</div>
                <p>The building looks at the base. A canopy at canal level brings the building into relationship with canal life — boats, the towpath, the under-the-bridge crossing made navigable.</p>
              </div>
              <div>
                <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4}}>Signal Box</div>
                <p>The building looks up. A marker at the crossing — of the canal of 1820 and the railway of 1852 — but the public destination is high: the lookout above.</p>
              </div>
              <p className="mono" style={{fontSize: 11, color: 'var(--fg-dim)', letterSpacing: 0.04}}>
                Beneath both: the same office. Eccentric core, two stairs, 80–83% efficient, 5,300–6,000 sqft plates, three-sided daylight.
              </p>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr', gap: 36, height: '100%', minHeight: 0, alignItems: 'stretch'}}>
          <div style={{display: 'flex', minHeight: 0, minWidth: 0}}>
            <Placeholder filename="two-directions-sketch.jpg" caption="Two directions — landscape sketch (Canopy reaching to the canal; Signal Box marking the crossing from above)" variant="sketch" aspect="4/3" />
          </div>
          <div className="pc-stmt" style={{maxWidth: 'none', width: '100%', justifyContent: 'center'}}>
            <Eyebrow>§11 · Two Directions</Eyebrow>
            <h2 className="h-title" style={{marginBottom: 10}}>Two ways to mark the crossing.</h2>
            <div className="prose tight" style={{maxWidth: '52ch'}}>
              <p>Beneath both directions is the same optimised office: eccentric core, two stairs, 80–83% efficient, 5,300–6,000 sqft plates, three-sided daylight. The office building is settled. <em>What changes is how the building activates the crossing it sits on.</em></p>
              <p><strong>Canopy</strong> looks at the base. A canopy at canal level brings the building into relationship with canal life — the boats, the towpath, the under-the-bridge crossing made navigable. The destination is the ground.</p>
              <p><strong>Signal Box</strong> looks up. A marker at the crossing of the canal of 1820 and the railway of 1852 — but the public destination is high: the lookout above, from which the whole crossing can be read in one view.</p>
              <p>The next two sections develop each in turn, on the same set of pages.</p>
            </div>
          </div>
        </div>
      ),
    },
  ]
);

// ── Helper for §14 Canopy and §15 Signal Box (16-page study structures) ─
function studyDesignPages({ sectionNum, sectionLabel, slug, displayName, conceptNote }) {
  const sectStr = String(sectionNum).padStart(2, '0');
  return [
    // 1 — full-bleed image with title overlay
    {
      label: `${displayName} · Hero`,
      presentation: () => (
        <PresCover
          filename={`${slug}-hero.jpg`}
          caption={`${displayName} — full-bleed hero image`}
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
          caption={`${displayName} — full-bleed hero image`}
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
    // 2 — concept sketch
    {
      label: `${displayName} · Concept sketch`,
      presentation: () => (
        <PresImage
          filename={`${slug}-concept-sketch.jpg`}
          caption={`${displayName} — concept sketch (landscape)`}
          variant="sketch"
          capIdx="Concept"
          capTitle={`${displayName} — the idea, in a sketch.`}
          capMeta={conceptNote.headline}
        />
      ),
      report: () => (
        <ReportImageText
          filename={`${slug}-concept-sketch.jpg`}
          caption={`${displayName} — concept sketch (landscape)`}
          variant="sketch"
          capIdx="Concept"
          capTitle={`${displayName} — the idea, in a sketch.`}
          kicker={`§${sectStr} · ${sectionLabel} · Concept`}
          title={`${displayName} — the idea.`}
          body={<>
            <p>{conceptNote.headline}</p>
            {conceptNote.body}
          </>}
        />
      ),
    },
    // 3–7 — axonometric build-up (5 stages)
    ...[1, 2, 3, 4, 5].map((n) => ({
      label: `${displayName} · Axo · stage ${n}`,
      presentation: () => (
        <PresImage
          filename={`${slug}-axo-${String(n).padStart(2,'0')}.jpg`}
          caption={`${displayName} — axonometric build-up · stage ${n} of 5`}
          variant="diagram"
          number={String(n)}
          capIdx={`Axo · ${n} of 5`}
          capTitle={`Stage ${n}.`}
          capMeta={`${displayName} — axonometric, stage ${n} of 5.`}
        />
      ),
      report: () => (
        <ReportImageText
          filename={`${slug}-axo-${String(n).padStart(2,'0')}.jpg`}
          caption={`${displayName} — axonometric build-up · stage ${n} of 5`}
          variant="diagram"
          number={String(n)}
          capIdx={`Axo · ${n} of 5`}
          capTitle={`Stage ${n}.`}
          kicker={`§${sectStr} · ${sectionLabel} · Axonometric · stage ${n} of 5`}
          title={`Axonometric — stage ${n}.`}
          body={<p>Placeholder for axonometric stage {n} of 5. Drop a render or diagram onto the slot to populate.</p>}
        />
      ),
    })),
    // 8 — plan (single 16:9 plan image at full body width; labels in a
    //     JetBrains Mono box directly beneath the plans, full body width)
    (() => {
      const renderPlanPage = () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§{sectStr} · {sectionLabel} · Plan</Eyebrow>
          <h2 className="h-sub" style={{marginBottom: 14}}>{displayName} — plan.</h2>
          {/* Image area — fills the remaining vertical space, keeps 16:9 */}
          <div style={{flex: 1, minHeight: 0, display: 'flex'}}>
            <Placeholder filename={`${slug}-plan.jpg`} caption={`${displayName} — plan drawing (composite: Ground Floor · Typical Plan · Roof Plan, side-by-side)`} variant="diagram" aspect="16/9" />
          </div>
          {/* Label strip — directly beneath the plans, JetBrains Mono */}
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
    // 12–15 — townscape images (4 pages)
    ...[1, 2, 3, 4].map((n) => ({
      label: `${displayName} · Townscape ${n}`,
      presentation: () => (
        <PresImage
          filename={`${slug}-townscape-${String(n).padStart(2,'0')}.jpg`}
          caption={`${displayName} — townscape ${n} of 4`}
          variant="photo"
          number={String(n)}
          capIdx={`Townscape · ${n} of 4`}
          capTitle={`Townscape ${n}.`}
          capMeta={`${displayName} — townscape placeholder.`}
        />
      ),
      report: () => (
        <ReportImageText
          filename={`${slug}-townscape-${String(n).padStart(2,'0')}.jpg`}
          caption={`${displayName} — townscape ${n} of 4`}
          variant="photo"
          number={String(n)}
          capIdx={`Townscape · ${n} of 4`}
          capTitle={`Townscape ${n}.`}
          kicker={`§${sectStr} · ${sectionLabel} · Townscape · ${n} of 4`}
          title={`Townscape ${n}.`}
          body={<p>Placeholder — drop the townscape image onto the slot.</p>}
        />
      ),
    })),
    // 16 — area schedule (placeholder)
    {
      label: `${displayName} · Area schedule`,
      presentation: () => {
        const rows = ["1820 room", "L9", "L8", "L7", "L6", "L5", "L4", "L3", "L2", "L1", "Ground", "Plant"];
        return (
          <div className="schedule">
            <div className="schedule__head">
              <Eyebrow>§{sectStr} · {sectionLabel} · Area schedule</Eyebrow>
              <h2 className="h-sub">{displayName} — indicative area schedule.</h2>
              <div className="prose tight" style={{maxWidth: '78ch', marginTop: 2}}>
                Placeholder — numbers to follow.
              </div>
            </div>
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
                    <td className="dim">—</td>
                    <td className="dim">—</td>
                    <td className="dim">—</td>
                    <td className="dim">TBD</td>
                  </tr>
                ))}
                <tr className="schedule__total">
                  <th>Total</th>
                  <td className="dim">—</td>
                  <td className="dim">—</td>
                  <td className="dim">—</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      },
      report: () => {
        const rows = ["1820 room", "L9", "L8", "L7", "L6", "L5", "L4", "L3", "L2", "L1", "Ground", "Plant"];
        return (
          <div className="schedule">
            <div className="schedule__head">
              <Eyebrow>§{sectStr} · {sectionLabel} · Area schedule</Eyebrow>
              <h2 className="h-sub">{displayName} — indicative area schedule.</h2>
              <div className="prose tight" style={{maxWidth: '78ch', marginTop: 2}}>
                <p>An indicative area schedule for the {displayName} direction — GIA, NIA, efficiency, brief notes per level. Numbers to follow.</p>
              </div>
            </div>
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
                    <td className="dim">—</td>
                    <td className="dim">—</td>
                    <td className="dim">—</td>
                    <td className="dim">TBD</td>
                  </tr>
                ))}
                <tr className="schedule__total">
                  <th>Total</th>
                  <td className="dim">—</td>
                  <td className="dim">—</td>
                  <td className="dim">—</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      },
    },
  ];
}

// ── Offerings — used by Canopy and Signal Box study closers ─────────────
const canopyOfferings = [
  ["Activates the canal",
   "A sheltered civic room at the building's foot — a public passage between Goods Way and the towpath, not a wall to walk past."],
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
   "A lightweight signal-box silhouette visible from far away. \"The water came first,\" perforated through the aluminium at the skyline."],
  ["Simply supported",
   "No transfer structure, no cantilever. Lighter on ground, lower embodied carbon, no carbon villain in the section."],
  ["Three-sided daylight",
   "The slender plate gives the canal a full elevation; daylight reaches across, the canal visible from inside."],
  ["Honesty in section",
   "Heavy brick body that belongs to the canal; lightweight lookout that belongs to the sky. The two are not asked to reconcile."],
];

// ── §12 Materials ───────────────────────────────────────────────────────
//   Heavy and light. Both schemes share the same material logic — brick body
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
      label: "Heavy — brick + alternatives",
      presentation: () => (
        <QMaterialPage
          slot="heavy"
          kicker="§15 · Materials · Heavy"
          title="Heavy — the brick body."
          image="material-01-brick-sample.jpg"
          imageCaption="Staffordshire blue-brown engineering brick — the brick of Victorian canal and railway infrastructure"
          lead={<p>The brick body is heavy by intent: it belongs to the canal. The same in either scheme — Canopy or Signal Box — brick to the waterline. The alternatives below sit in the calculator; sustainability and cost are quantified, not assumed.</p>}
          materials={heavyMaterials}
          view="presentation"
        />
      ),
      report: () => (
        <QMaterialPage
          slot="heavy"
          kicker="§15 · Materials · Heavy"
          title="Heavy — the brick body."
          image="material-01-brick-sample.jpg"
          imageCaption="Staffordshire blue-brown engineering brick — the brick of Victorian canal and railway infrastructure"
          lead={<p>The brick body is heavy by intent. Brick to the waterline; the building belongs to the canal before it does anything else. Both directions — Canopy and Signal Box — share this body. The table below sets out the heavy alternatives the calculator quantifies, with embodied carbon and indicative cost per square metre of facade. <em>Numbers align with the design-side carbon + cost calculator (top toolbar).</em></p>}
          materials={heavyMaterials}
          view="report"
        />
      ),
    },
    {
      label: "Light — aluminium + alternatives",
      presentation: () => (
        <QMaterialPage
          slot="light"
          kicker="§15 · Materials · Light"
          title="Light — the lantern."
          image="material-04-aluminium-detail.jpg"
          imageCaption="Bright perforated recycled aluminium — Hydro CIRCAL 75R, lantern-like at dusk"
          lead={<p>The lightweight expression contrasts the brick. In the Signal Box it sits at the top as a lookout; in the Canopy it sits below as a sheltered public room. Either way, bright, perforated, lantern-like — the building's second voice.</p>}
          materials={lightMaterials}
          view="presentation"
        />
      ),
      report: () => (
        <QMaterialPage
          slot="light"
          kicker="§15 · Materials · Light"
          title="Light — the lantern."
          image="material-04-aluminium-detail.jpg"
          imageCaption="Bright perforated recycled aluminium — Hydro CIRCAL 75R, lantern-like at dusk"
          lead={<p>The lightweight expression contrasts the brick. <strong>Where it sits depends on the scheme</strong> — at the top in the Signal Box (the 1820 lookout), at the canopy below in the Canopy (the sheltered public room). The material logic is the same in both: bright, perforated, lantern-like, the building's second voice. The table below sets out the light alternatives the calculator quantifies. <em>Numbers align with the design-side carbon + cost calculator (top toolbar).</em></p>}
          materials={lightMaterials}
          view="report"
        />
      ),
    },
  ]
);

// ── §13 Canopy ──────────────────────────────────────────────────────────
const SCanopy = sectionPages(
  { sectionId: "canopy-study", sectionNum: 12, sectionTitle: "Canopy", sectionLabel: "Canopy" },
  [
    ...studyDesignPages({
      sectionNum: 12,
      sectionLabel: "Canopy",
      slug: "canopy",
      displayName: "Canopy",
      conceptNote: {
        headline: "Low and wide. G+6. The building reaches out to the canal.",
        body: <>
          <p>The Canopy direction activates the canal. It creates a sheltered point at the building's foot connecting the upper path and the lower canal towpath — a small civic room beneath the building's mass.</p>
          <p>Cantilevers earn the area; heavy structure is required for them. Hanging the floors gives roughly 80 m² extra per floor. The challenge: is that area worth it, and is the urbanistic outcome arguably worse for it?</p>
          <p><strong>Only NMA planning required.</strong> Quicker programme.</p>
        </>,
      },
    }),
    // Closer — what the Canopy scheme offers
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
      <p>The Signal Box direction activates the wider public realm by marking the crossing from above. The 1820 room sits at the top — the building's reason for being and the place from which "the water came first" is read into the skyline.</p>
      <p>The building is simply supported. No cantilevers, no transfer structure. Lighter on the ground, more discipline at the plan.</p>
      <p><strong>G+8/9 — new planning application required.</strong> Longer programme.</p>
    </>,
  },
});
const _signalBoxStudySchedulePage = _signalBoxStudyBase[_signalBoxStudyBase.length - 1];
const _signalBoxStudyPagesExcludingSchedule = _signalBoxStudyBase.slice(0, -1);

const SSignalBoxStudy = sectionPages(
  { sectionId: "signal-box-study", sectionNum: 13, sectionTitle: "Signal Box", sectionLabel: "Signal Box (study)" },
  [
    ...(_signalBoxStudyPagesExcludingSchedule),
    // ── The building speaks twice ────────────────────────────────────
    //   Two pieces of signage, worked into the materials themselves.
    //   1820 Goods Way at the brick. The water came first at the skyline.
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
                <Placeholder filename="signage-01-brick-1820-recessed.jpg" caption="1820 recessed and carved into the engineering brick at ground level — Victorian canal vocabulary, read at arm's reach" variant="material" number="01" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At ground level · in the brick</span>
                <div className="signage__big">1820 Goods Way.</div>
                <div className="signage__sub">Recessed, carved into the masonry at canal level.<br/><em>Where you are.</em></div>
              </div>
            </div>
            <div className="signage__col">
              <div className="signage__media">
                <Placeholder filename="signage-02-aluminium-1820-perforated.jpg" caption="The water came first — perforated through the lightweight skin of the 1820 belvedere; a lantern at night" variant="material" number="02" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At the skyline · perforated through aluminium</span>
                <div className="signage__big">The water came first.</div>
                <div className="signage__sub">By day, shadow and depth. By night, a lantern over the canal.<br/><em>Why the building is here.</em></div>
              </div>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="signage">
          <div className="signage__head">
            <Eyebrow>§13 · Signal Box (study) · Signage — the building speaks twice</Eyebrow>
            <h2 className="h-sub">The building speaks twice.</h2>
            <div className="prose tight" style={{maxWidth: '78ch', marginTop: 4}}>
              <p>Two pieces of signage, both worked into the material itself rather than applied to it. At the entrance, the building says <strong>where you are</strong>. At the skyline, <strong>why the building is here</strong>. The crossing is the silent context.</p>
            </div>
          </div>
          <div className="signage__cols">
            <div className="signage__col">
              <div className="signage__media">
                <Placeholder filename="signage-01-brick-1820-recessed.jpg" caption="1820 Goods Way — recessed and carved into the brick at ground level" variant="material" number="01" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At ground level · embossed brick</span>
                <div className="signage__big">1820 Goods Way.</div>
                <div className="signage__sub">Carved and recessed into the engineering brick at the canal threshold. Deep reveals, Victorian canal vocabulary. Read at arm's reach as you arrive on foot.</div>
              </div>
            </div>
            <div className="signage__col">
              <div className="signage__media">
                <Placeholder filename="signage-02-aluminium-1820-perforated.jpg" caption="The water came first — perforated through the lightweight aluminium of the 1820 belvedere" variant="material" number="02" />
              </div>
              <div className="signage__caption">
                <span className="signage__tag mono">At the skyline · perforated aluminium</span>
                <div className="signage__big">The water came first.</div>
                <div className="signage__sub">Cut through the lightweight skin by perforation. By day, shadow and depth against bright metal. By night, the room glows from within — a soft lantern above the canal, legible from the bridges, St Pancras, Camley Street.</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // Area schedule (was the last page of the base study)
    _signalBoxStudySchedulePage,
    // Closer — what the Signal Box scheme offers
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

// ── §17 Closing — four scheme-agnostic prose pages ─────────────────────
//    Sustainable · Efficient · Urban · Poetic.
//    Each page argues the scheme as a whole — works for Canopy or Signal Box.
const SClosing = sectionPages(
  { sectionId: "closing-new", sectionNum: 16, sectionTitle: "Closing", sectionLabel: "Closing" },
  [
    {
      label: "Closing (title)",
      isDivider: true,
      presentation: () => <Divider range="§16" title="Closing." sub="What this scheme is — whether Canopy or Signal Box." />,
      report:       () => <Divider range="§16" title="Closing." sub="What this scheme is — whether Canopy or Signal Box." />,
    },
    // ─────────────────────────────────────────────────────────────────────
    //  Two paired-claim pages. Page 1: Sustainable + Efficient (the
    //  rational case). Page 2: Urban + Poetic (the emotional close).
    //  Tight prose, paired headings, editorial pacing.
    // ─────────────────────────────────────────────────────────────────────
    {
      label: "Sustainable. Efficient.",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§16 · The argument</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 18}}>Sustainable. Efficient.</h2>
          <div style={{maxWidth: '78ch', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28}}>
            <div>
              <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10}}>Sustainable</div>
              <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, lineHeight: 1.4}}>
                {[
                  <>The form does the work — in either scheme.</>,
                  <>Brick to the canal. Recycled aluminium above.</>,
                  <>Steel + CLT structure. No basement.</>,
                  <><strong>~380–490 kgCO₂e/m² GIA</strong> · vs 720–950 baseline · LETI 2030.</>,
                  <><em>Sustainability is the form, not an addition to it.</em></>,
                ].map((t, i) => (
                  <li key={i} style={{paddingLeft: 16, position: 'relative'}}>
                    <span style={{position: 'absolute', left: 0, color: 'var(--accent)'}}>—</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10}}>Efficient</div>
              <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, lineHeight: 1.4}}>
                {[
                  <>The plan hugs the boundary — both schemes. No setbacks.</>,
                  <>Eccentric core. Two stairs.</>,
                  <><strong>80–83% efficient</strong>. 5,300–6,000 sqft plates.</>,
                  <>32–36k sqft total. Three-sided daylight.</>,
                  <><em>Discipline at the plan. The rest follows.</em></>,
                ].map((t, i) => (
                  <li key={i} style={{paddingLeft: 16, position: 'relative'}}>
                    <span style={{position: 'absolute', left: 0, color: 'var(--accent)'}}>—</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§16 · Closing · The argument</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 14}}>Sustainable. Efficient.</h2>
          <div className="prose tight" style={{maxWidth: '78ch', display: 'flex', flexDirection: 'column', gap: 14}}>
            <div>
              <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6}}>Sustainable</div>
              <p>Both schemes are sustainable for the same fundamental reason: the decisions that make either Canopy or Signal Box work are the decisions that make either sustainable. The Signal Box is simply supported — no transfer, no cantilever, light on the ground. The Canopy earns its wider area through hung floors but avoids a basement and lands the same material contrast at lower height. Both honest about what they ask of the structure. ~<strong>380–490 kgCO₂e/m² GIA</strong> against a conventional baseline of 720–950 — LETI 2030 territory in either direction. Every primary material has a defined recovery route. <em>Sustainability is the form, not an addition to it.</em></p>
            </div>
            <div>
              <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6}}>Efficient</div>
              <p>The plan does the same thing in both schemes. It follows the site boundary edge for edge, no setbacks, no chamfers, no formal gestures that subtract usable area. From there, the eccentric core and two stairs produce a coherent floor plate with daylight from three sides. The Signal Box is a slim G+8/9 extrusion at ~5,300 sqft per floor; the Canopy is wider and lower at G+6, ~6,000 sqft via hung floors. Both 32,000–36,000 sqft total, 80–83% efficient. Quantified in the calculator with ±10% RIBA Stage 2 sensitivity. <em>The efficiency is not a value-engineering compromise. It is the design.</em></p>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Urban. Poetic.",
      presentation: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§16 · The close</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 18}}>Urban. Poetic.</h2>
          <div style={{maxWidth: '78ch', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28}}>
            <div>
              <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10}}>Urban</div>
              <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, lineHeight: 1.4}}>
                {[
                  <>The building gives back to the city — either way.</>,
                  <><strong>Tenant.</strong> A boutique whole-floor plate.</>,
                  <><strong>Building.</strong> The 1820 belvedere — at the sky (Signal Box) or at the foot (Canopy).</>,
                  <><strong>City.</strong> A public room — King's Cross's first free public roof, or a sheltered civic threshold.</>,
                  <><em>Not a tolerated object. A contributor.</em></>,
                ].map((t, i) => (
                  <li key={i} style={{paddingLeft: 16, position: 'relative'}}>
                    <span style={{position: 'absolute', left: 0, color: 'var(--accent)'}}>—</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10}}>Poetic</div>
              <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, lineHeight: 1.4}}>
                {[
                  <>The first mark on this site was the canal. <strong>1820.</strong></>,
                  <>The building is named for it.</>,
                  <>Brick at canal level says <strong>where you are</strong>.</>,
                  <>Aluminium — at the sky or at the foot — says <strong>why the building is here</strong>: the water came first.</>,
                  <><em>The last mark on the crossing the water made.</em></>,
                ].map((t, i) => (
                  <li key={i} style={{paddingLeft: 16, position: 'relative'}}>
                    <span style={{position: 'absolute', left: 0, color: 'var(--accent)'}}>—</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="pc-stmt" style={{maxWidth: 'none', width: '100%'}}>
          <Eyebrow>§16 · Closing · The close</Eyebrow>
          <h2 className="h-title" style={{marginBottom: 14}}>Urban. Poetic.</h2>
          <div className="prose tight" style={{maxWidth: '78ch', display: 'flex', flexDirection: 'column', gap: 14}}>
            <div>
              <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6}}>Urban</div>
              <p>A building on this site can occupy King's Cross or contribute to it. Both schemes are built around the second; the civic gift is real in both, only its location changes. <strong>To the tenant</strong>, a 5,300–6,000 sqft whole-floor plate — the boutique segment King's Cross is structurally short of, three-sided daylight, the canal across the elevation. <strong>To the building</strong>, the 1820 belvedere — the date of the canal written into the address, at the sky in the Signal Box, at the foot in the Canopy. <strong>To the city</strong>, a public room — either King's Cross's first free public roof, or a sheltered civic threshold between Goods Way and the towpath, the crossing the planners worried about made navigable. <em>Not a tolerated commercial object. A contributor.</em></p>
            </div>
            <div>
              <div className="mono" style={{fontSize: 11, letterSpacing: 0.18, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6}}>Poetic</div>
              <p>Every layer of this site has been a mark on a crossing. Battle Bridge over the River Fleet was the first. The canal, cut in 1820, gave the place its shape, its industry, and its name. The railway came in 1852 and crossed the canal in turn. 1820 Goods Way is the last move on the last plot of Argent's masterplan — the last mark. The brick at canal level carries <em>1820 Goods Way</em>, recessed and carved into the engineering brick, the address as Victorian canal vocabulary. The lightweight aluminium — at the skyline in the Signal Box, at the canal threshold in the Canopy — carries <em>the water came first</em>, by day shadow and depth, by night a soft lantern. Two voices: one says where you are, the other says why the building is here. <em>A simple, contextual office building, with a public offering of space. The last mark on the crossing the water made.</em></p>
            </div>
          </div>
        </div>
      ),
    },
    // Final full-bleed image with "Thank you" overlay.
    {
      label: "Thank you",
      presentation: () => (
        <PresCover
          filename="thank-you.jpg"
          caption="Full-bleed closing image — landscape — King's Cross / 1820 Goods Way at twilight, or the canal, or a hero CGI"
          overlay={
            <>
              <span className="mono" style={{color: 'var(--accent)', letterSpacing: '0.22em', fontWeight: 500}}>1820 Goods Way · The water came first</span>
              <h1 className="h-display" style={{fontSize: 64, lineHeight: 1, margin: 0}}>Thank you.</h1>
              <span className="mono" style={{fontSize: 11, color: 'var(--fg-soft)', letterSpacing: '0.04em'}}>The conversation continues.</span>
            </>
          }
        />
      ),
      report: () => (
        <PresCover
          filename="thank-you.jpg"
          caption="Full-bleed closing image — landscape — King's Cross / 1820 Goods Way at twilight, or the canal, or a hero CGI"
          overlay={
            <>
              <span className="mono" style={{color: 'var(--accent)', letterSpacing: '0.22em', fontWeight: 500}}>1820 Goods Way · The water came first</span>
              <h1 className="h-display" style={{fontSize: 64, lineHeight: 1, margin: 0}}>Thank you.</h1>
              <span className="mono" style={{fontSize: 11, color: 'var(--fg-soft)', letterSpacing: '0.04em'}}>The conversation continues.</span>
            </>
          }
        />
      ),
    },
  ]
);

// ── §16 Our Direction ───────────────────────────────────────────────────
const SOurDirection = sectionPages(
  { sectionNum: 14, sectionTitle: "Our Direction", sectionLabel: "Our Direction" },
  [
    {
      label: "Our Direction — Canopy tall and slender",
      presentation: () => (
        <div className="lookout-pair">
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="our-direction-model.jpg" caption="Our direction — landscape model photo of the preferred move" variant="model" aspect="4/3" />
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
                <p>Mark the crossing with a canopied public space at the building's foot. Take the slender, simple office above. Pair them.</p>
                <p><strong>Canopy, tall and slender.</strong> Simple. Dynamic. Marks the space. Activates the canal. Simple and buildable.</p>
              </div>
            </div>
          </div>
        </div>
      ),
      report: () => (
        <div className="lookout-pair lookout-pair--report">
          <div className="lookout-pair__col">
            <div className="lookout-pair__media">
              <Placeholder filename="our-direction-model.jpg" caption="Our direction — landscape model photo of the preferred move" variant="model" aspect="4/3" />
            </div>
            <div className="lookout-pair__caption mono"><b>Our direction</b>Canopy, tall and slender.</div>
          </div>
          <div className="lookout-pair__col" style={{justifyContent: 'center'}}>
            <div className="lookout-pair__text" style={{padding: '0 8px'}}>
              <Eyebrow>§14 · Our direction</Eyebrow>
              <h2 className="h-sub" style={{marginBottom: 10}}>Perhaps we go tall and slender — and activate the canal.</h2>
              <div className="prose">
                <p>The two directions on the previous sections are both defensible, both architecturally honest. But there is a third move, a hybrid, that may serve the brief better than either taken alone: <strong>take the tall and slender office of the Signal Box study, and pair it with the canopied public space of the Canopy study at the building's foot.</strong></p>
                <p>The result marks the crossing in the city's silhouette (the slender form, the lightweight lookout at the top) and at the same time activates the canal beneath the building (the sheltered, generous public threshold connecting Goods Way to the towpath).</p>
                <p><em>Canopy, tall and slender.</em> Simple. Dynamic. Marks the space. Activates the canal. Simple and buildable.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]
);

// ─── Authored source order ───────────────────────────────────────────────
// This is the canonical order written into the file. The runtime order
// PAGES is built from this plus public/deck-order.json (which the
// thumbnail strip writes to). If the JSON is empty, we fall back to this.
const SOURCE_PAGES = [].concat(
  S01,        // §01 Cover
  SLegacy,    // §02 The Legacy (opening narrative)
  S02,        // §03 Water came first
  S03,        // §04 The Site (now includes the relocated sketches intro)
  S07,        // §05 Constraints
  SInter,          // §06 Site Walk (act break + 58 photos + "What we learnt")
  // S06 (§07 Vision) — removed
  // SSiteWalk (§08 Site Walk) — folded into §06 above
  SChallenge,      // §07 The Challenge
  SFiveFamilies,   // §08 Five Families
  SViabilityQs,    // §09 Five Viability Questions
  SBuildingTooLong,// §10 The Building is too long?
  STwoChosen,      // §11 Two Chosen Directions
  SCanopy,         // §12 Canopy
  SSignalBoxStudy, // §13 Signal Box (study)
  SOurDirection,   // §14 Our Direction
  SMaterials,      // §15 Materials — title + heavy + light, points at the calculator
  SClosing         // §16 Closing — scheme-agnostic prose closer (deck ends here)
  // ── Legacy sections removed ──────────────────────────────────────────
  // S07_new, STerraced, S05, S10_new, S09, S13 are no longer in the deck.
  // Their const definitions remain in this file for now (dead code) so
  // they can be re-added easily if needed; nothing renders them.
  // S14 (Working with us) — removed
  // S15 (Closing/1820 Goods Way) — folded into §13
  // S16, S17 — folded into S15
  // S18 (§20 Parking) — removed
);

// Runtime PAGES — just the authored SOURCE_PAGES (with the same section
// context sectionPages() already baked in). The earlier JSON-driven
// reorder/hide pipeline + thumbnail strip has been removed.
const PAGES = SOURCE_PAGES;

// Section index → range  (derived from PAGES)
function buildSectionIndex() {
  const sections = []; // { num, label, title, pageStart, pageCount }
  for (let i = 0; i < PAGES.length; ) {
    const num = PAGES[i].sectionNum;
    let count = 0;
    while (i + count < PAGES.length && PAGES[i + count].sectionNum === num) count++;
    sections.push({
      num,
      label: PAGES[i].sectionLabel,
      title: PAGES[i].sectionTitle,
      pageStart: i,
      pageCount: count,
    });
    i += count;
  }
  return sections;
}
const SECTION_INDEX = buildSectionIndex();

export { PAGES, SECTION_INDEX };
