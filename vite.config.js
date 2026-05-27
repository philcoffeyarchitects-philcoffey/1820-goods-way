import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dev-only plugin: lets the running deck save images dropped onto a placeholder
// into public/images/, recording slot -> file + fit in public/images/manifest.json.
// Both the images and the manifest are real files, so committing them to git
// makes the images appear anywhere. (No effect in the built/static site.)
function imageSaver() {
  const publicDir = path.resolve(__dirname, "public");
  const imagesDir = path.join(publicDir, "images");
  const manifestPath = path.join(imagesDir, "manifest.json");
  const ALLOWED = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg"]);

  const readManifest = () => {
    try { return JSON.parse(fs.readFileSync(manifestPath, "utf8")); }
    catch { return {}; }
  };
  const writeManifest = (m) => {
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2) + "\n");
  };
  // slot looks like a filename ("cover.jpg"); derive a safe base name.
  const safeBase = (slot) => {
    const noExt = String(slot).replace(/\.[a-z0-9]+$/i, "");
    return noExt.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^[._]+/, "") || "image";
  };
  const readBody = (req) => new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 80e6) { reject(new Error("too large")); req.destroy(); } });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
  const json = (res, code, obj) => {
    res.statusCode = code;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(obj));
  };

  return {
    name: "twcf-image-saver",
    configureServer(server) {
      server.middlewares.use("/__save-image", async (req, res, next) => {
        if (req.method !== "POST") return next();
        try {
          const { slot, fit, dataUrl, ext } = JSON.parse(await readBody(req));
          if (!slot) return json(res, 400, { error: "missing slot" });
          const manifest = readManifest();
          const entry = { ...(manifest[slot] || {}) };
          if (dataUrl) {
            const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
            if (!m) return json(res, 400, { error: "bad dataUrl" });
            let e = String(ext || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            if (e === "jpeg") e = "jpg";
            if (!ALLOWED.has(e)) e = "jpg";
            const fname = `${safeBase(slot)}.${e}`;
            fs.mkdirSync(imagesDir, { recursive: true });
            fs.writeFileSync(path.join(imagesDir, fname), Buffer.from(m[2], "base64"));
            entry.file = `images/${fname}`;
            entry.v = Date.now();
          }
          if (fit) entry.fit = fit === "contain" ? "contain" : "cover";
          if (!entry.fit) entry.fit = "cover";
          manifest[slot] = entry;
          writeManifest(manifest);
          return json(res, 200, { ok: true, slot, entry });
        } catch (err) {
          return json(res, 500, { error: String(err && err.message || err) });
        }
      });

      server.middlewares.use("/__remove-image", async (req, res, next) => {
        if (req.method !== "POST") return next();
        try {
          const { slot } = JSON.parse(await readBody(req));
          const manifest = readManifest();
          if (manifest[slot]) {
            const f = manifest[slot].file;
            if (f) { try { fs.unlinkSync(path.resolve(publicDir, f)); } catch {} }
            delete manifest[slot];
            writeManifest(manifest);
          }
          return json(res, 200, { ok: true });
        } catch (err) {
          return json(res, 500, { error: String(err && err.message || err) });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), imageSaver()],
  // Relative base path so the built site works whether served from
  // GitHub Pages' default sub-path (https://<user>.github.io/<repo>/)
  // or from a custom domain at root (https://yourdomain.com/).
  base: "./",
  server: { port: 4321, open: false },
});
