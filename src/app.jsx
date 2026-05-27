// app.jsx — top-level.
// Navigation: a flat array of pages. Arrow / rail nav advance pages.
// The P/R toggle switches which view (presentation or report) renders
// inside the CURRENT page. Both views share the same page chrome and
// page count. Print emits all pages in the current view.

import React from "react";
import ReactDOM from "react-dom/client";
import { Logo } from "./placeholder.jsx";
import { useTweaks, TweaksPanel, TweakSection, TweakRadio } from "./tweaks-panel.jsx";
import { LockScreen, isUnlocked } from "./lock.jsx";
import { PAGES, SECTION_INDEX } from "./pages.jsx";
import { Calculator } from "./calculator.jsx";
import { Footprint500_600 } from "./footprint.jsx";

const TOTAL = PAGES.length;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "type": "editorial",
  "palette": "slate",
  "surround": "dark"
}/*EDITMODE-END*/;

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function pad2(n) { return String(n).padStart(2, "0"); }

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [unlocked, setUnlocked] = React.useState(() => isUnlocked());

  const [view, setView] = React.useState(() => {
    try { return localStorage.getItem("twcf-view") || "presentation"; }
    catch { return "presentation"; }
  });
  const [idx, setIdx] = React.useState(() => {
    try {
      const v = parseInt(localStorage.getItem("twcf-idx") || "0", 10);
      return Number.isFinite(v) ? clamp(v, 0, TOTAL - 1) : 0;
    } catch { return 0; }
  });
  const [fullscreen, setFullscreen] = React.useState(false);
  const [calcOpen, setCalcOpen] = React.useState(false);
  const [footOpen, setFootOpen] = React.useState(false);

  React.useEffect(() => {
    try { localStorage.setItem("twcf-view", view); } catch {}
  }, [view]);
  React.useEffect(() => {
    try { localStorage.setItem("twcf-idx", String(idx)); } catch {}
  }, [idx]);

  // Apply tweaks
  React.useEffect(() => {
    document.documentElement.dataset.type = t.type;
    document.documentElement.dataset.palette = t.palette;
    document.documentElement.dataset.surround = t.surround || "dark";
  }, [t.type, t.palette, t.surround]);

  // Compute & apply page scale based on viewport size and fullscreen state.
  // Both modes "contain" — the whole page (top and bottom) stays visible, no
  // cropping. Windowed reserves room for the topbar + rail; fullscreen reserves
  // a top/bottom margin so the page clears the progress rail at the bottom.
  React.useEffect(() => {
    function recompute() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const PAGE_W = 1280, PAGE_H = 905;
      // Reserve room for chrome.
      const reserveW = fullscreen ? 0 : 150;
      const reserveH = fullscreen ? 132 : 110;
      const fitW = (w - reserveW) / PAGE_W;
      const fitH = (h - reserveH) / PAGE_H;
      const scale = Math.min(fitW, fitH); // contain — fit the whole page on screen
      document.documentElement.style.setProperty("--scale", String(scale));
    }
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [fullscreen]);

  // Sync fullscreen attr
  React.useEffect(() => {
    document.documentElement.dataset.fullscreen = fullscreen ? "true" : "false";
  }, [fullscreen]);

  // Track browser fullscreen changes (Esc, F11, etc.) so our state stays in sync.
  React.useEffect(() => {
    function onChange() {
      const inFs = !!document.fullscreenElement;
      // We keep our soft-fullscreen if user toggled CSS-only; otherwise sync.
      if (!inFs) setFullscreen(false);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    const willEnter = !fullscreen;
    setFullscreen(willEnter);
    try {
      if (willEnter) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => { /* fall back to soft fs */ });
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (e) { /* ignore */ }
  }

  // Keyboard
  React.useEffect(() => {
    function onKey(e) {
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "p" || e.key === "P") {
        setView("presentation");
      } else if (e.key === "r" || e.key === "R") {
        setView("report");
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "t" || e.key === "T") {
        // Open the Tweaks panel. In the design host this was triggered by the
        // host toolbar; standalone we provide a keyboard shortcut.
        window.postMessage({ type: "__activate_edit_mode" }, "*");
      } else if (e.key === "Escape" && fullscreen && !document.fullscreenElement) {
        // Exit soft-fullscreen on Esc when the browser API isn't engaged
        setFullscreen(false);
      } else if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setIdx((i) => clamp(i + 1, 0, TOTAL - 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setIdx((i) => clamp(i - 1, 0, TOTAL - 1));
      } else if (e.key === "Home") {
        setIdx(0);
      } else if (e.key === "End") {
        setIdx(TOTAL - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const cur = PAGES[clamp(idx, 0, TOTAL - 1)];
  const curSection = SECTION_INDEX.find((s) => s.num === cur.sectionNum);

  function jumpToSection(num) {
    const s = SECTION_INDEX.find((x) => x.num === num);
    if (s) setIdx(s.pageStart);
  }
  function jumpToPage(targetIdx) {
    setIdx(clamp(targetIdx, 0, TOTAL - 1));
  }

  // Print uses the current view. Each page in the current view becomes a
  // print page. (See CSS @media print rules.)
  function doPrint() { window.print(); }

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div>
      <div className="stage">
        {PAGES.map((page, i) => (
          <div className="page-scaler" data-active={i === idx ? "true" : "false"} key={page.id}>
            <PageFrame page={page} view={view} pageIdx={i} total={TOTAL} />
          </div>
        ))}
      </div>

      <header className="topbar">
        <div className="topbar__logo">
          <Logo size="sm" onDark />
          <span className="topbar__doc">1820 Goods Way · 2026</span>
        </div>
        <div className="topbar__right">
          <div className="modetoggle" role="tablist" aria-label="View">
            <button aria-pressed={view === "presentation"} onClick={() => setView("presentation")}
              title="Presentation view (P)">P · Presentation</button>
            <button aria-pressed={view === "report"} onClick={() => setView("report")}
              title="Report view (R)">R · Report</button>
          </div>
          <button className="print-btn" onClick={toggleFullscreen}
            title="Fullscreen (F) — Esc to exit">⛶ Fullscreen</button>
          <button className="print-btn" onClick={doPrint}
            title="Print / save PDF — A4 landscape">⎙ PDF</button>
          <button className="print-btn print-btn--accent" onClick={() => setCalcOpen(true)}
            title="Open the design-side viability calculator">∑ Calculator</button>
          <button className="print-btn print-btn--accent" onClick={() => setFootOpen(true)}
            title="500/600 — the lettability research behind the floor plate">500/600 · Who is the tenant?</button>
        </div>
      </header>

      {fullscreen ? (
        <div className="fs-hint">F or Esc · exit fullscreen</div>
      ) : null}

      <button className="nav-arrow nav-arrow--prev"
        aria-label="Previous page"
        disabled={idx === 0}
        onClick={() => setIdx((i) => clamp(i - 1, 0, TOTAL - 1))}>‹</button>
      <button className="nav-arrow nav-arrow--next"
        aria-label="Next page"
        disabled={idx === TOTAL - 1}
        onClick={() => setIdx((i) => clamp(i + 1, 0, TOTAL - 1))}>›</button>

      <nav className="rail" aria-label="Pages">
        <div className="rail__ticks">
          {SECTION_INDEX.map((s) => (
            <button
              key={s.num}
              className="rail__tick"
              style={{ flex: s.pageCount }}
              onClick={() => jumpToSection(s.num)}
              title={`§${pad2(s.num)} · ${s.label}`}
            >
              <div className="rail__bars">
                {Array.from({ length: s.pageCount }).map((_, j) => {
                  const globalIdx = s.pageStart + j;
                  let state = "future";
                  if (globalIdx < idx) state = "visited";
                  else if (globalIdx === idx) state = "current";
                  // Bars are visual progress indicators only — clicks bubble up
                  // to the parent button (jumpToSection), so any click anywhere
                  // on the tick routes to the section's first slide.
                  return (
                    <span
                      key={j}
                      data-state={state}
                    />
                  );
                })}
              </div>
              <span className="rail__tick__label">
                §{pad2(s.num)} · {s.label}
              </span>
            </button>
          ))}
        </div>
        <span className="rail__counter">
          §{pad2(cur.sectionNum)} ·{" "}
          <b>{pad2(cur.pageInSection)}</b>/{pad2(cur.totalInSection)}{" "}
          · pg <b>{pad2(idx + 1)}</b>/{pad2(TOTAL)}
        </span>
      </nav>

      {calcOpen ? (
        <Calculator onClose={() => setCalcOpen(false)} />
      ) : null}

      {footOpen ? (
        <Footprint500_600 onClose={() => setFootOpen(false)} />
      ) : null}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Typography" />
        <TweakRadio
          label="Type pairing"
          value={t.type}
          options={[
            { value: "editorial", label: "Editorial serif" },
            { value: "grotesk",   label: "Swiss grotesk" },
            { value: "book",      label: "English book" },
            { value: "mixed",     label: "Serif + sans" },
          ]}
          onChange={(v) => setTweak("type", v)}
        />
        <TweakSection label="Palette" />
        <TweakRadio
          label="Brand accent"
          value={t.palette}
          options={[
            { value: "slate",  label: "Slate" },
            { value: "brick",  label: "Brick" },
            { value: "forest", label: "Forest" },
            { value: "ink",    label: "Ink" },
          ]}
          onChange={(v) => setTweak("palette", v)}
        />
        <TweakRadio
          label="Surround"
          value={t.surround || "dark"}
          options={[
            { value: "dark",  label: "Dark" },
            { value: "light", label: "Light" },
            { value: "white", label: "White" },
          ]}
          onChange={(v) => setTweak("surround", v)}
        />
        <TweakSection label="Shortcuts" />
        <div style={{fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--fg-dim)', lineHeight: 1.7, letterSpacing: 0.02}}>
          P · presentation view<br/>
          R · report view<br/>
          ← → · prev / next page<br/>
          Home / End · first / last<br/>
          F · fullscreen (Esc to exit)<br/>
          T · this tweaks panel<br/>
          ⎙ PDF · print to A4 landscape
        </div>
      </TweaksPanel>
    </div>
  );
}

function PageFrame({ page, view, pageIdx, total }) {
  // The first page in report view is the printed-cover layout — chrome hidden.
  const isReportCover = view === "report" && pageIdx === 0;
  const hideChrome = isReportCover || page.isDivider;
  return (
    <div
      className={"page-frame" + (isReportCover ? " page-frame--cover" : "") + (page.isDivider ? " page-frame--divider" : "")}
      data-page={page.id}
      data-screen-label={`Page ${pageIdx+1} · ${page.sectionLabel} — ${page.label}`}
    >
      {!hideChrome ? (
        <div className="page-frame__top">
          <div className="pf-left">
            <Logo size="sm" />
          </div>
          <div className="pf-right">
            <span>§{pad2(page.sectionNum)} / {pad2(SECTION_INDEX.length)}</span>
            <span><b>{page.sectionTitle}</b></span>
          </div>
        </div>
      ) : null}

      <div className="page-frame__body">
        {view === "presentation" ? page.presentation() : page.report()}
      </div>

      {!hideChrome ? (
        <div className="page-frame__bottom">
          <div className="pf-left">
            <span className="view-tag">{view === "presentation" ? "Presentation" : "Report"}</span>
            <span>The crossing · 1820 Goods Way</span>
          </div>
          <div className="pf-right">
            <span>{page.label}</span>
            <span>·</span>
            <span>Page {pad2(pageIdx + 1)} / {pad2(total)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Reuse a single root across Vite HMR updates so we don't call createRoot
// twice on the same container (which warns in dev).
const container = document.getElementById("root");
const root = (window.__twcfRoot ||= ReactDOM.createRoot(container));
root.render(<App />);
