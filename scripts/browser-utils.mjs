import { existsSync, statSync, createReadStream } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";

export async function launchBrowser() {
  const candidates = [
    process.env.BROWSER_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  const executablePath = candidates.find(
    (candidate) => candidate && existsSync(candidate),
  );
  if (!executablePath)
    throw new Error(
      "No supported browser found. Set BROWSER_PATH to a Chrome, Edge, Brave, or Chromium executable.",
    );
  return chromium.launch({ executablePath, headless: true });
}

export async function startSite() {
  if (process.env.PORTFOLIO_URL)
    return {
      url: process.env.PORTFOLIO_URL.replace(/\/$/, ""),
      close: async () => {},
    };
  const root = path.resolve("dist");
  if (!existsSync(path.join(root, "index.html")))
    throw new Error("Run npm run build before browser checks.");
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".xml": "application/xml",
  };
  const server = createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      let file = path.resolve(root, pathname.replace(/^\/+/, ""));
      const relative = path.relative(root, file);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        response.writeHead(403).end();
        return;
      }
      if (existsSync(file) && statSync(file).isDirectory())
        file = path.join(file, "index.html");
      if (!existsSync(file) || !statSync(file).isFile()) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {
        "Content-Type":
          mimeTypes[path.extname(file)] ?? "application/octet-stream",
      });
      createReadStream(file).pipe(response);
    } catch {
      response.writeHead(400).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}
