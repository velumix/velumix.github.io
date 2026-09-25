import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { launchBrowser, startSite } from "./browser-utils.mjs";

const site = await startSite();
const browser = await launchBrowser();
await mkdir(".preview", { recursive: true });
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    // All portfolio content, fonts, artwork and galleries must work without third-party requests.
    await page.route("**/*", (route) =>
      route.request().url().startsWith(site.url)
        ? route.continue()
        : route.abort(),
    );
    await page.goto(site.url, { waitUntil: "networkidle" });
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.locator(".project-card").count(), 5);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    assert.ok(
      dimensions.document <= dimensions.viewport,
      `Horizontal overflow at ${width}: ${JSON.stringify(dimensions)}`,
    );

    await page
      .getByRole("button", { name: "Feature Samurai DUELS", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Samurai DUELS", exact: true, level: 2 })
      .waitFor();
    await page
      .getByRole("button", {
        name: "Feature Aquatica Observatory",
        exact: true,
      })
      .click();

    for (const [name, count] of [
      ["Gameplay", 4],
      ["Simulation", 2],
      ["LiveOps", 1],
      ["All work", 5],
    ]) {
      await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
      assert.equal(
        await page.locator(".project-card").count(),
        count,
        `${name} filter at ${width}`,
      );
    }

    const trigger = page.getByRole("button", {
      name: "View Aquatica Observatory project",
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    assert.equal(
      await dialog
        .getByRole("heading", { name: "Aquatica Observatory", exact: true })
        .count(),
      1,
    );
    assert.equal(await dialog.locator(".contribution-list li").count(), 3);
    assert.equal(
      await page.evaluate(() => document.body.style.overflow),
      "hidden",
    );
    for (let index = 0; index < 7; index++) {
      await page.keyboard.press("Tab");
      assert.ok(
        await page.evaluate(() =>
          document.querySelector("dialog").contains(document.activeElement),
        ),
        "Focus escaped the dialog",
      );
    }
    if (width === 1440) {
      const dialogAudit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        dialogAudit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
        "Dialog accessibility",
      );
    }
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
    assert.ok(
      await trigger.evaluate((element) => element === document.activeElement),
      "Focus did not return to the project trigger",
    );

    await trigger.click();
    await page
      .getByRole("button", { name: "Next project: Samurai DUELS", exact: true })
      .click();
    await dialog
      .getByRole("heading", { name: "Samurai DUELS", exact: true })
      .waitFor();
    await page
      .getByRole("button", {
        name: "Previous project: Aquatica Observatory",
        exact: true,
      })
      .click();
    await dialog
      .getByRole("heading", { name: "Aquatica Observatory", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Close project", exact: true })
      .click();
    assert.ok(
      await trigger.evaluate((element) => element === document.activeElement),
      "Project navigation lost the original focus target",
    );

    await page
      .getByRole("button", {
        name: "View Paint And SEEK! project",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Show image 2", exact: true })
      .click();
    assert.ok(
      (await page.locator(".dialog-image img").getAttribute("src")).endsWith(
        "paint-1.png",
      ),
    );
    await page.getByRole("button", { name: "Next image", exact: true }).click();
    assert.ok(
      (await page.locator(".dialog-image img").getAttribute("src")).endsWith(
        "paint-2.png",
      ),
    );
    await page
      .getByRole("button", { name: "Close project", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "detached" });

    if (width < 700) {
      await page
        .getByRole("button", { name: "Open menu", exact: true })
        .click();
      assert.ok(
        await page.locator("main").evaluate((element) => element.inert),
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await page
          .getByRole("button", { name: "Open menu", exact: true })
          .getAttribute("aria-expanded"),
        "false",
      );
      await page
        .getByRole("button", { name: "Open menu", exact: true })
        .click();
      await page
        .getByRole("navigation", { name: "Mobile navigation", exact: true })
        .getByRole("link", { name: "About", exact: true })
        .click();
      assert.ok(page.url().endsWith("#about"));
      assert.equal(
        await page.locator("main").evaluate((element) => element.inert),
        false,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Open menu", exact: true })
          .getAttribute("aria-expanded"),
        "false",
      );
    }

    await page
      .getByRole("button", {
        name: "Copy Discord username velumix",
        exact: true,
      })
      .click();
    await page.getByText("Username copied!", { exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      "velumix",
    );
    await page.evaluate(() => {
      navigator.clipboard.writeText = async () => {
        throw new Error("Clipboard blocked for test");
      };
    });
    await page
      .getByRole("button", {
        name: "Copy Discord username velumix",
        exact: true,
      })
      .click();
    await page
      .getByText(
        "Couldn’t copy automatically. My Discord username is velumix.",
        { exact: true },
      )
      .waitFor();
    await page.evaluate(() => scrollTo(0, 0));

    if (width === 390 || width === 1440) {
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        audit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
        `Accessibility at ${width}`,
      );
      const name = width === 390 ? "mobile" : "desktop";
      await page.screenshot({ path: `.preview/${name}.png`, fullPage: true });
      await page.screenshot({ path: `.preview/${name}-hero.png` });
    }
    // Force lazy artwork to load, then ensure every local image resolved.
    for (const img of await page.locator("main img").all())
      await img.scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      [...document.querySelectorAll("main img")].every(
        (img) => img.complete && img.naturalWidth > 0,
      ),
    );
    assert.deepEqual(errors, [], `Browser errors at ${width}`);
    console.log(
      `PASS ${width}px: layout, spotlight, filters, dialog focus, gallery, navigation, clipboard${width === 390 || width === 1440 ? ", accessibility" : ""}`,
    );
    await context.close();
  }
} finally {
  await browser.close();
  await site.close();
}
