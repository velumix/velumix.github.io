// Renders the 1200×630 social preview card (Open Graph / Twitter / Discord).
//
//   npm run render:og
//
// The card is plain HTML rendered by the installed browser, using the site's
// own fonts and artwork, so it can be restyled and regenerated like any page.
import { readFile } from "node:fs/promises";
import { launchBrowser } from "./browser-utils.mjs";

const dataUrl = async (file, type) =>
  `data:${type};base64,${(await readFile(file)).toString("base64")}`;

const font = await dataUrl(
  "node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2",
  "font/woff2",
);
const mono = await dataUrl(
  "node_modules/@fontsource/space-mono/files/space-mono-latin-400-normal.woff2",
  "font/woff2",
);
const logo = await dataUrl("public/images/brand/logo-128.webp", "image/webp");
const art = await dataUrl("public/images/aquatica.webp", "image/webp");
const samurai = await dataUrl("public/images/samurai.webp", "image/webp");

// A loose school of fish drifting across the card, echoing the hero.
const fish = Array.from({ length: 46 }, (_, index) => {
  const t = index / 46;
  const x = 40 + t * 1120 + Math.sin(index * 2.3) * 60;
  const y = 470 + Math.sin(t * Math.PI * 2.2) * 70 + Math.cos(index * 1.7) * 38;
  const angle = Math.cos(t * Math.PI * 2.2) * 18 - 6;
  const size = 0.7 + ((index * 37) % 10) / 22;
  const hue = index % 3 === 0 ? "#b28cff" : "#7fb2ff";
  return `<path d="M0 0 C 6 -4 14 -4 20 0 C 14 4 6 4 0 0 Z M -2 0 L -8 -4 L -7 0 L -8 4 Z"
    fill="${hue}" opacity="${(0.22 + ((index * 13) % 10) / 30).toFixed(2)}"
    transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${size.toFixed(2)})"/>`;
}).join("");

const html = `<!doctype html>
<html><head><style>
  @font-face { font-family: "DM Sans"; src: url(${font}) format("woff2"); font-weight: 100 1000; }
  @font-face { font-family: "Space Mono"; src: url(${mono}) format("woff2"); }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden; position: relative;
    font-family: "DM Sans", sans-serif; color: #eceef3;
    background:
      radial-gradient(600px 380px at 8% 0%, #2a4f9a55, transparent 70%),
      radial-gradient(520px 420px at 100% 100%, #6a3fd04a, transparent 70%),
      #15171c;
  }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(#ffffff08 1px, transparent 1px),
      linear-gradient(90deg, #ffffff08 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(900px 500px at 30% 40%, #000 30%, transparent 80%);
  }
  .school { position: absolute; inset: 0; }
  .copy { position: absolute; left: 72px; top: 70px; width: 640px; }
  .brand { display: flex; align-items: center; gap: 14px; font-size: 26px; font-weight: 650; letter-spacing: -0.6px; }
  .brand img { width: 52px; height: 52px; border-radius: 50%; }
  .brand span { color: #a5acb9; font-weight: 400; font-size: 20px; }
  .role { margin-top: 58px; font-family: "Space Mono", monospace; font-size: 17px; color: #a5acb9; letter-spacing: 0.5px; }
  h1 { margin-top: 16px; font-size: 68px; line-height: 1.06; font-weight: 560; letter-spacing: -2.8px; white-space: nowrap; }
  h1 span { color: #a4c6fc; }
  .chips { display: flex; gap: 10px; margin-top: 34px; }
  .chips span {
    font-family: "Space Mono", monospace; font-size: 16px; color: #c9cfda;
    border: 1px solid #3a3f49; background: #1f2228cc; border-radius: 7px; padding: 6px 12px;
  }
  .cards { position: absolute; right: 56px; top: 92px; width: 430px; height: 400px; }
  .card {
    position: absolute; border-radius: 16px; overflow: hidden;
    border: 1px solid #505867; background: #212328;
    box-shadow: 0 30px 80px #0009;
  }
  .card img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .back { width: 340px; height: 200px; right: -6px; top: 0; transform: rotate(6deg); opacity: 0.7; }
  .front { width: 420px; height: 248px; left: 0; top: 110px; transform: rotate(-2.5deg); }
  .front::after {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(transparent 45%, #071a2be8);
  }
  .caption { position: absolute; z-index: 1; left: 22px; bottom: 18px; }
  .caption small { display: block; font-size: 12px; letter-spacing: 1.6px; text-transform: uppercase; color: #d0e5f9; }
  .caption strong { font-size: 25px; font-weight: 560; letter-spacing: -0.6px; color: #fff; }
  .url {
    position: absolute; left: 72px; bottom: 50px; display: flex; align-items: center; gap: 10px;
    font-family: "Space Mono", monospace; font-size: 18px; color: #a4c6fc;
  }
  .url i { width: 9px; height: 9px; border-radius: 50%; background: #95d0ac; box-shadow: 0 0 12px #95d0ac; }
</style></head>
<body>
  <div class="grid"></div>
  <svg class="school" viewBox="0 0 1200 630">${fish}</svg>
  <div class="copy">
    <div class="brand"><img src="${logo}" alt="">velumix <span>/ portfolio</span></div>
    <p class="role">Software &amp; gameplay engineer</p>
    <h1>Tools for builders.<br><span>Worlds for players.</span></h1>
    <div class="chips"><span>Rust</span><span>C#</span><span>Go</span><span>React</span><span>Luau</span></div>
  </div>
  <div class="cards">
    <div class="card back"><img src="${samurai}" alt=""></div>
    <div class="card front"><img src="${art}" alt="">
      <div class="caption"><small>Gameplay · Simulation</small><strong>Aquatica Observatory</strong></div>
    </div>
  </div>
  <div class="url"><i></i>velumix.github.io</div>
</body></html>`;

const browser = await launchBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "public/images/og-card.jpg",
    type: "jpeg",
    quality: 88,
  });
  console.log("Wrote public/images/og-card.jpg");
} finally {
  await browser.close();
}
