import { existsSync, readFileSync } from "node:fs";

// Exported reports must keep their logo when opened offline. Source deployments
// carry public/, while the production Docker image carries the built dist/.
let embeddedLogo;
export function reportBrand() {
  if (!embeddedLogo) {
    const source = [
      new URL("../public/brand/24coinatlas-logo.png", import.meta.url),
      new URL("../dist/brand/24coinatlas-logo.png", import.meta.url),
    ].find((path) => existsSync(path));
    if (!source) throw new Error("The approved brand asset is missing");
    embeddedLogo = readFileSync(source).toString("base64");
  }
  return `<header style="padding:0 0 18px;margin:0 0 24px;border-bottom:1px solid #dfe3e4"><img alt="24CoinAtlas" width="250" height="83" style="width:250px;height:auto;max-width:100%;max-height:none;display:block" src="data:image/png;base64,${embeddedLogo}"></header>`;
}
