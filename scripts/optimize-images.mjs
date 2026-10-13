// Generates web-optimized copies of the portfolio artwork and brand icons.
//
//   npm run optimize:images
//
// Uses the installed Chrome/Edge/Brave (via playwright-core, like the browser
// checks) to resample and encode images, so no native image dependency is
// required. Originals are left untouched; run this again after replacing any
// artwork in public/images/.
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { launchBrowser } from "./browser-utils.mjs";

const images = path.resolve("public/images");
const brand = path.join(images, "brand");
const logo = path.join(images, "velumix-logo.png");

// Game artwork: same dimensions, WebP at a quality that keeps the art crisp.
const artwork = (await readdir(images)).filter(
  (name) => name.endsWith(".png") && name !== "velumix-logo.png",
);

// The source logo's backdrop is a semi-transparent dark glow. It disappears
// on the avatar's navy circle but reads as a grey smudge elsewhere, so icons
// are composited onto that same navy. The crop frames the "V" more tightly so
// it stays legible at favicon sizes.
const navy = "#020410";
const crop = [77, 94, 1100];
// [output name, size, mime type, corner radius as a fraction of size]
const icons = [
  ["logo-128.webp", 128, "image/webp", 0.5],
  ["favicon-48.png", 48, "image/png", 0.24],
  // iOS and Android apply their own masks; these must be opaque squares.
  ["apple-touch-icon.png", 180, "image/png", 0],
  ["icon-192.png", 192, "image/png", 0],
  ["icon-512.png", 512, "image/png", 0],
];

const browser = await launchBrowser();
const page = await browser.newPage();
await page.setContent("<!doctype html><title>encode</title>");

async function encode(file, options) {
  const source = `data:image/png;base64,${(await readFile(file)).toString("base64")}`;
  const output = await page.evaluate(
    async ({ source, size, type, quality, crop, background, radius }) => {
      const image = new Image();
      image.src = source;
      await image.decode();
      const [sx, sy, side] = crop ?? [0, 0, image.naturalWidth];
      // Step down by halves for large reductions; a single resample from
      // 1254px to 48px would alias the logo's thin ribbon edges.
      let canvas = document.createElement("canvas");
      let width = crop ? side : image.naturalWidth;
      let height = crop ? side : image.naturalHeight;
      canvas.width = width;
      canvas.height = height;
      canvas
        .getContext("2d")
        .drawImage(image, sx, sy, width, height, 0, 0, width, height);
      const targetWidth = size ?? width;
      const targetHeight = size ?? height;
      while (width / 2 >= targetWidth) {
        width = Math.round(width / 2);
        height = Math.round(height / 2);
        const next = document.createElement("canvas");
        next.width = width;
        next.height = height;
        const context = next.getContext("2d");
        context.imageSmoothingQuality = "high";
        context.drawImage(canvas, 0, 0, width, height);
        canvas = next;
      }
      const result = document.createElement("canvas");
      result.width = targetWidth;
      result.height = targetHeight;
      const context = result.getContext("2d");
      if (background) {
        context.fillStyle = background;
        context.beginPath();
        context.roundRect(
          0,
          0,
          targetWidth,
          targetHeight,
          (radius ?? 0) * targetWidth,
        );
        context.fill();
        context.clip();
      }
      context.imageSmoothingQuality = "high";
      context.drawImage(canvas, 0, 0, targetWidth, targetHeight);
      return result.toDataURL(type, quality).split(",")[1];
    },
    { ...options, source },
  );
  return Buffer.from(output, "base64");
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
let before = 0;
let after = 0;

try {
  for (const name of artwork) {
    const input = path.join(images, name);
    const output = input.replace(/\.png$/, ".webp");
    const data = await encode(input, { type: "image/webp", quality: 0.82 });
    await writeFile(output, data);
    const original = (await stat(input)).size;
    before += original;
    after += data.length;
    console.log(`${name} → ${path.basename(output)}  ${kb(original)} → ${kb(data.length)}`);
  }

  await mkdir(brand, { recursive: true });
  for (const [name, size, type, radius] of icons) {
    const data = await encode(logo, {
      size,
      type,
      quality: 0.9,
      crop,
      background: navy,
      radius,
    });
    await writeFile(path.join(brand, name), data);
    console.log(`velumix-logo.png → brand/${name}  ${kb(data.length)}`);
  }
  console.log(`Artwork: ${kb(before)} → ${kb(after)}`);
} finally {
  await browser.close();
}
