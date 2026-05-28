import "./styles.css";
import { loadManifest } from "./imageStore.js";

// Load the committed image manifest first, then render the deck, so any
// committed images appear immediately with no placeholder flash.
loadManifest().finally(() => {
  import("./app.jsx");
});
