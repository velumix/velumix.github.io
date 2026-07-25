import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});

const page = await browser.newPage({
  viewport: { width: 390, height: 1000 },
  deviceScaleFactor: 1,
});

await page.goto("http://127.0.0.1:3005", { waitUntil: "networkidle" });

const report = await page.evaluate(() => {
  const overflowing = [...document.querySelectorAll("*")]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.right > window.innerWidth + 1 || rect.left < -1;
    })
    .slice(0, 20)
    .map((element) => ({
      tag: element.tagName,
      className: element.className,
      left: Math.round(element.getBoundingClientRect().left),
      right: Math.round(element.getBoundingClientRect().right),
    }));

  return {
    innerWidth: window.innerWidth,
    bodyScrollWidth: document.body.scrollWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    overflowing,
  };
});

await page.screenshot({ path: "mobile-playwright.png", fullPage: true });
console.log(JSON.stringify(report, null, 2));
await browser.close();
