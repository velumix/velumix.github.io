import assert from "node:assert/strict";
import { launchBrowser, startSite } from "./browser-utils.mjs";

const site = await startSite();
const browser = await launchBrowser();
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const failures = [];
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400)
        failures.push(`${response.status()} ${response.url()}`);
    });
    for (const [pathname, heading] of [
      ["/observatory/docs/intro/", "Aquatica Observatory"],
      ["/observatory/api/StoreService/", "StoreService"],
    ]) {
      const response = await page.goto(`${site.url}${pathname}`, {
        waitUntil: "networkidle",
      });
      assert.equal(response.status(), 200);
      assert.ok((await page.locator("h1").textContent()).includes(heading));
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Overflow on ${pathname}`,
      );
      assert.deepEqual(failures, []);
      console.log(`PASS ${width}px: ${pathname}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  await site.close();
}
