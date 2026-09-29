import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { launchBrowser, startSite } from "./browser-utils.mjs";

const site = await startSite();
const browser = await launchBrowser();
await mkdir(".preview", { recursive: true });
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.route("**/*", (route) =>
      route.request().url().startsWith(site.url)
        ? route.continue()
        : route.abort(),
    );
    await page.goto(site.url + "/#lab", { waitUntil: "networkidle" });
    await page.locator(".lab-canvas canvas").waitFor();
    assert.equal(await page.locator(".lab-render-error").count(), 0);
    await page
      .getByRole("button", { name: "Play simulation", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Play simulation", exact: true })
      .click();
    await page.waitForFunction(
      () => document.querySelector(".lab-elapsed")?.textContent !== "00:00",
    );
    await page
      .getByRole("button", { name: "Pause simulation", exact: true })
      .click();
    const time = await page.locator(".lab-elapsed").textContent();
    await page.waitForTimeout(200);
    assert.equal(await page.locator(".lab-elapsed").textContent(), time);
    await page
      .getByRole("button", { name: "Step simulation", exact: true })
      .click();
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    assert.equal(await page.locator(".lab-elapsed").textContent(), "00:00");

    await page.getByRole("tab", { name: "Inspect", exact: true }).click();
    await page.getByLabel("Selected fish", { exact: true }).selectOption("14");
    await page.getByRole("button", { name: "Top", exact: true }).click();
    await page.getByRole("button", { name: "Side", exact: true }).click();
    await page.getByRole("button", { name: "Orbit", exact: true }).click();
    await page.getByRole("tab", { name: "World", exact: true }).click();
    await page.getByRole("checkbox", { name: /^Show swimming bounds/ }).check();
    await page
      .getByRole("checkbox", { name: /^Show obstacle clearance/ })
      .check();
    await page
      .getByRole("button", { name: "Startle selected fish", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Guide school", exact: true })
      .click();
    await page
      .locator(".lab-canvas canvas")
      .click({ position: { x: 130, y: 250 } });
    await page
      .getByRole("button", { name: "Release guide target", exact: true })
      .click();

    await page.getByRole("button", { name: /^Tight shoal/ }).click();
    await page.getByRole("tab", { name: "School", exact: true }).click();
    assert.equal(
      await page.getByLabel("Population", { exact: true }).inputValue(),
      "360",
    );
    await page.getByLabel("Alignment", { exact: true }).fill("2.3");
    await page.getByLabel("Preset name", { exact: true }).fill("My reef");
    await page
      .getByRole("button", { name: "Save preset", exact: true })
      .click();
    assert.match(
      await page.locator(".lab-notice").innerText(),
      /saved in this browser/,
    );
    await page.getByRole("button", { name: "Copy link", exact: true }).click();
    assert.match(await page.locator(".lab-notice").innerText(), /link copied/);
    const link = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(link.includes("#lab?config="));

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "JSON", exact: true }).click();
    const downloaded = await downloadPromise;
    const exported = JSON.parse(
      await readFile(await downloaded.path(), "utf8"),
    );
    assert.equal(exported.config.alignment, 2.3);
    assert.equal(exported.config.count, 360);
    await page.getByRole("button", { name: /^Open water/ }).click();
    await page
      .getByLabel("Import lab preset JSON", { exact: true })
      .setInputFiles({
        name: "preset.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(exported)),
      });
    await page.waitForFunction(
      () => document.querySelector("#lab-alignment")?.value === "2.3",
    );
    await page
      .getByLabel("Import lab preset JSON", { exact: true })
      .setInputFiles({
        name: "bad.json",
        mimeType: "application/json",
        buffer: Buffer.from('{"count":999999999}'),
      });
    await page.waitForFunction(() =>
      document
        .querySelector(".lab-notice")
        ?.textContent?.includes("Import failed"),
    );
    assert.equal(
      await page.getByLabel("Population", { exact: true }).inputValue(),
      "360",
    );
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(
      await page.getByLabel("Alignment", { exact: true }).inputValue(),
      "2.3",
    );
    await page.getByRole("button", { name: /^Reef school/ }).click();
    await page.goto(link, { waitUntil: "networkidle" });
    await page.waitForFunction(
      () => document.querySelector("#lab-alignment")?.value === "2.3",
    );
    assert.equal(
      await page.getByLabel("Population", { exact: true }).inputValue(),
      "360",
    );

    await page.getByRole("button", { name: /^Reef school/ }).click();
    await page
      .getByRole("button", { name: "Play simulation", exact: true })
      .click();
    await page.waitForTimeout(500);
    await page
      .getByRole("button", { name: "Pause simulation", exact: true })
      .click();
    await page.evaluate(() => window.scrollTo(0, 0));
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `${width}px overflow`,
    );
    await page.screenshot({
      path: `.preview/flocking-${width}.png`,
      fullPage: true,
    });
    for (const theme of ["dark", "light"]) {
      if (theme === "light")
        await page
          .getByRole("button", { name: "Switch to light mode" })
          .click();
      const axe = await new AxeBuilder({ page })
        .include(".flocking-lab")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        axe.violations.map((item) => ({
          id: item.id,
          nodes: item.nodes.map((node) => ({
            target: node.target,
            summary: node.failureSummary,
          })),
        })),
        [],
        `${width}px ${theme} accessibility`,
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      `PASS ${width}px: WebGL, playback, controls, presets, persistence, import/export, sharing, responsive layout, light/dark accessibility`,
    );
    await context.close();
  }
} finally {
  await browser.close();
  await site.close();
}
