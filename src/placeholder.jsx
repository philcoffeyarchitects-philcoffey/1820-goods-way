// placeholder.jsx, striped image placeholders + helpers.
//
// CRITICAL: the same aspect ratio MUST render at the same shape in both
// presentation and report. The naive `aspect-ratio` + `max-width/height`
// pattern is unreliable in flex/grid because the parent's shape drives
// the result. Instead, every non-fill placeholder is wrapped in an
// AspectFit container that uses CSS container queries to fit the parent
// while preserving ratio.
//
// Each placeholder is also a drag-drop target (in dev): drop an image to
// place it, and toggle "Fit all" (contain) vs "Fill" (cover) per image. See
// imageStore.js, drops are saved into public/images/ + manifest.json and
// committed to git so they render anywhere.

import React from "react";
import { isDev, useImageEntry, saveImage, saveFit, removeImage, fileToDataUrl } from "./imageStore.js";

function parseAspect(ar) {
  if (!ar) return [3, 2];
  if (Array.isArray(ar)) return [ar[0], ar[1]];
  const parts = String(ar).split("/");
  const w = parseFloat(parts[0]);
  const h = parseFloat(parts[1] || "1");
  return [w || 3, h || 2];
}

// AspectFit, keeps an aspect-ratio'd child fit inside its parent.
// Uses container queries (cqw / cqh) for reliable sizing in any flex/grid.
function AspectFit({ ratio, align = "center", className = "", children }) {
  const [w, h] = parseAspect(ratio);
  const style = { "--ar-w": w, "--ar-h": h };
  return (
    <div className={`aspect-fit aspect-fit--${align} ${className}`} style={style}>
      <div className="aspect-fit__inner">{children}</div>
    </div>
  );
}

// Default aspect ratio per image variant, keeps both views in lock-step
// even when individual pages don't pass one.
const DEFAULT_ASPECTS = {
  sketch:   "4/3",
  photo:    "3/2",
  archive:  "3/2",
  CGI:      "16/9",
  diagram:  "16/9",
  model:    "4/3",
  material: "3/2",
  detail:   "3/2",
  practice: "3/2",
  default:  "3/2",
};

// DropZone, wraps a placeholder's content (dev only). Accepts an image drop,
// downscales + saves it to the slot, and offers per-image fit + remove controls.
function DropZone({ slot, hasImage, fit, children }) {
  const [over, setOver] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const { dataUrl, ext } = await fileToDataUrl(file);
      await saveImage(slot, { dataUrl, ext, fit: fit || "cover" });
    } catch (err) {
      console.error("Image save failed:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={"ph-dropzone" + (over ? " is-over" : "") + (busy ? " is-busy" : "")}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; if (!over) setOver(true); }}
      onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setOver(false); }}
      onDrop={onDrop}
    >
      {children}
      {hasImage ? (
        <div className="ph-controls">
          <button type="button" className={"ph-fitbtn" + (fit === "contain" ? " is-active" : "")}
            title="Fit the whole image inside the frame"
            onClick={(e) => { e.stopPropagation(); saveFit(slot, "contain"); }}>Fit all</button>
          <button type="button" className={"ph-fitbtn" + (fit !== "contain" ? " is-active" : "")}
            title="Fill the frame (crops overflow)"
            onClick={(e) => { e.stopPropagation(); saveFit(slot, "cover"); }}>Fill</button>
          <button type="button" className="ph-rmbtn" title="Remove this image"
            onClick={(e) => { e.stopPropagation(); removeImage(slot); }}>✕</button>
        </div>
      ) : null}
      <div className="ph-hint mono">
        {busy ? "Saving…" : over ? "Drop to place" : hasImage ? "" : "⤓ Drop image"}
      </div>
    </div>
  );
}

function Placeholder({
  filename,
  caption,
  variant = "default",
  number,
  aspect,            // override variant default
  fill = false,      // true → fills 100%×100% (cover/closing only)
  align = "center",  // alignment within parent: center | left
  style,
  src,               // legacy: explicit src (manifest takes precedence)
}) {
  const entry = useImageEntry(filename);
  const resolvedSrc = entry && entry.file ? `${entry.file}?v=${entry.v || 0}` : src;
  const fit = (entry && entry.fit) || "cover";

  // The visual content, always 100% × 100% of its (possibly aspect-locked) parent.
  // With a placed image we show it (object-fit per the chosen mode); otherwise
  // the striped placeholder.
  const content = resolvedSrc ? (
    <img className="placeholder__img" src={resolvedSrc} alt={caption || filename || ""}
      draggable="false" style={{ objectFit: fit }} />
  ) : (
    <div className="placeholder">
      <div className="placeholder__cross"></div>
      <span className="placeholder__corner mono">
        {variant.toUpperCase()}{number ? ` · ${number}` : ""}
        {aspect || (!fill && DEFAULT_ASPECTS[variant]) ? ` · ${aspect || DEFAULT_ASPECTS[variant]}` : ""}
      </span>
      <div className="placeholder__label">
        {filename ? <span className="fname">{filename}</span> : null}
        {caption ? <span>{caption}</span> : null}
      </div>
    </div>
  );

  // In dev, make every slot a drop target with fit controls. In the built
  // (view-only) site, render the content directly.
  const inner = isDev && filename ? (
    <DropZone slot={filename} hasImage={!!(entry && entry.file)} fit={fit}>{content}</DropZone>
  ) : content;

  // Fill mode: render directly inside parent (used for cover/closing full-bleed)
  if (fill) {
    return (
      <div className="placeholder-fill" style={style}>{inner}</div>
    );
  }

  // Aspect-locked: wrap in AspectFit so the placeholder fits parent maintaining ratio
  const ar = aspect || DEFAULT_ASPECTS[variant] || DEFAULT_ASPECTS.default;
  return (
    <AspectFit ratio={ar} align={align}>
      {inner}
    </AspectFit>
  );
}

function Eyebrow({ children }) {
  return <div className="h-eyebrow">{children}</div>;
}

// Coffey | Architects logo. PT Serif Caption with accent pipe
function Logo({ size = "md", onDark = false, className = "" }) {
  const cls = `logo logo--${size}${onDark ? " logo--on-dark" : ""} ${className}`;
  return (
    <span className={cls} aria-label="Coffey Architects">
      <span className="logo__name">Coffey</span>
      <span className="logo__pipe">|</span>
      <span className="logo__name">Architects</span>
    </span>
  );
}

function Cap({ idx, children }) {
  return (
    <div className="cap">
      {idx ? <b>{idx}</b> : null}
      <span>{children}</span>
    </div>
  );
}

export { Placeholder, AspectFit, Eyebrow, Cap, Logo, DEFAULT_ASPECTS };
