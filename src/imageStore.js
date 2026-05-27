// imageStore.js — holds the slot → image manifest and talks to the dev
// image-saver endpoint.
//
// A "slot" is keyed by the Placeholder's `filename` prop (e.g. "cover.jpg",
// "sketch-01.jpg"). The manifest maps each slot to a committed file + fit mode:
//   { "cover.jpg": { "file": "images/cover.jpg", "fit": "cover", "v": 1715… } }
//
// Images and the manifest live under public/images/, so once committed to git
// they render anywhere. Drag-drop saving only works while `npm run dev` is
// running (it posts to a dev-only endpoint); the built site is view-only.

import React from "react";

export const isDev = import.meta.env.DEV;

const store = { map: {}, listeners: new Set() };

function emit() {
  store.listeners.forEach((l) => l());
}
function subscribe(cb) {
  store.listeners.add(cb);
  return () => store.listeners.delete(cb);
}

// Load the committed manifest once at startup. Returns a promise so the app
// can wait for it before first render (avoids a placeholder→image flash).
export function loadManifest() {
  return fetch("images/manifest.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : {}))
    .then((m) => { store.map = m && typeof m === "object" ? m : {}; emit(); })
    .catch(() => { store.map = {}; emit(); });
}

// Subscribe a component to one slot's entry (or undefined).
export function useImageEntry(slot) {
  const get = React.useCallback(() => store.map[slot], [slot]);
  return React.useSyncExternalStore(subscribe, get, get);
}

// Downscale a dropped image on the client (no server-side image deps).
// SVGs are passed through untouched. Returns { dataUrl, ext }.
export function fileToDataUrl(file, maxW = 2400) {
  return new Promise((resolve, reject) => {
    if (file.type === "image/svg+xml") {
      const r = new FileReader();
      r.onload = () => resolve({ dataUrl: r.result, ext: "svg" });
      r.onerror = reject;
      r.readAsDataURL(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / img.naturalWidth || 1);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const isPng = file.type === "image/png";
      const ext = isPng ? "png" : "jpg";
      const mime = isPng ? "image/png" : "image/jpeg";
      resolve({ dataUrl: canvas.toDataURL(mime, isPng ? undefined : 0.92), ext });
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

async function post(path, payload) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("save failed: " + res.status);
  return res.json();
}

// Save a dropped image to a slot. Keeps the slot's current fit unless given.
export async function saveImage(slot, { dataUrl, ext, fit }) {
  const json = await post("/__save-image", { slot, dataUrl, ext, fit });
  if (json && json.ok) { store.map = { ...store.map, [slot]: json.entry }; emit(); }
  return json;
}

// Change just the fit mode for a slot (no re-upload).
export async function saveFit(slot, fit) {
  const json = await post("/__save-image", { slot, fit });
  if (json && json.ok) { store.map = { ...store.map, [slot]: json.entry }; emit(); }
  return json;
}

// Clear a slot (deletes the file + manifest entry).
export async function removeImage(slot) {
  await post("/__remove-image", { slot });
  const next = { ...store.map };
  delete next[slot];
  store.map = next;
  emit();
}
