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
      viewport: { width, height: 1000 },
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
    await page.route("**/*", (route) =>
      route.request().url().startsWith(site.url)
        ? route.continue()
        : route.abort(),
    );
    await page.goto(site.url, { waitUntil: "networkidle" });
    assert.equal(
      await page.locator("html").getAttribute("data-theme"),
      "dark",
      "Dark theme must be the default",
    );
    assert.equal(await page.locator("h1").innerText(), "Velumix");
    assert.equal(await page.locator(".project-card").count(), 14);
    assert.equal(await page.locator(".software-card").count(), 9);
    assert.equal(await page.locator(".featured-work .game-card").count(), 1);
    assert.equal(
      await page.locator(".featured-work .software-card").count(),
      1,
    );
    await page
      .locator(".featured-work")
      .getByRole("heading", { name: "ProjectVite", exact: true })
      .waitFor();
    assert.equal(
      await page
        .locator(".featured-work")
        .getByRole("heading", { name: /Abraxius/ })
        .count(),
      0,
      "Past work must not take a featured position",
    );
    assert.equal(
      await page.locator(".game-collection-grid .game-card").count(),
      4,
    );
    await page
      .locator(".past-work")
      .getByRole("heading", { name: "Abraxius", exact: true })
      .waitFor();
    const gameFeature = await page
      .locator(".featured-work .game-card")
      .boundingBox();
    const softwareFeature = await page
      .locator(".featured-work .software-card")
      .boundingBox();
    if (width > 700) {
      assert.ok(
        Math.abs(gameFeature.y - softwareFeature.y) < 2,
        "Roblox and software must have equal placement on desktop",
      );
      assert.ok(
        gameFeature.x + gameFeature.width <= softwareFeature.x,
        "Featured columns must not overlap",
      );
    } else {
      assert.ok(
        gameFeature.y + gameFeature.height <= softwareFeature.y,
        "Mobile features must not overlap",
      );
      const moreGames = await page
        .locator(".game-collection-grid")
        .boundingBox();
      assert.ok(
        softwareFeature.y < moreGames.y,
        "Both disciplines appear before the rest of either collection",
      );
    }
    assert.equal(await page.title(), "Velumix — Software Engineer & Developer");
    assert.ok(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
      `Overflow at ${width}px`,
    );

    for (const [name, count] of [
      ["Apps & tools", 5],
      ["Web & UI", 1],
      ["Contributions", 3],
      ["Roblox", 5],
      ["All work", 14],
    ]) {
      await page.getByRole("button", { name, exact: true }).click();
      assert.equal(
        await page.locator(".project-card").count(),
        count,
        `${name} filter`,
      );
    }
    const search = page.getByRole("searchbox", { name: "Search projects" });
    await page.getByRole("button", { name: "Roblox", exact: true }).click();
    await search.fill("SQLite");
    assert.equal(await page.locator(".project-card").count(), 1);
    await page
      .getByRole("heading", { name: "Abraxius Lattice", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "All work", exact: true })
        .getAttribute("aria-pressed"),
      "true",
      "Global search clears category restrictions",
    );
    await search.fill("floating-point");
    await page
      .getByRole("heading", { name: "Stride engine", exact: true })
      .waitFor();
    await page.getByText("Merged contribution", { exact: true }).waitFor();
    await page.locator(".work-details summary").click();
    assert.ok(await page.locator(".work-details").evaluate((el) => el.open));
    assert.equal(
      await page
        .getByRole("link", { name: "Bounds fix #3401" })
        .getAttribute("href"),
      "https://github.com/stride3d/stride/pull/3401",
    );
    await search.fill("camouflage");
    assert.equal(await page.locator(".project-card").count(), 1);
    await page
      .getByRole("heading", { name: "Paint And SEEK!", exact: true })
      .waitFor();
    await search.fill("no-such-project");
    await page.getByRole("heading", { name: "No matching projects" }).waitFor();
    await page.getByRole("button", { name: "Clear search & filters" }).click();
    assert.equal(await search.inputValue(), "");
    assert.equal(await page.locator(".project-card").count(), 14);
    await page.getByRole("button", { name: "Grid view", exact: true }).click();
    assert.equal(await page.locator(".feed-grid .project-card").count(), 14);
    assert.ok(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
      `Grid overflow at ${width}px`,
    );
    await page.getByRole("button", { name: "Feed view", exact: true }).click();

    await page
      .getByRole("button", { name: "View all Roblox projects", exact: true })
      .click();
    assert.equal(await page.locator(".game-card").count(), 5);
    assert.equal(await page.locator(".software-card").count(), 0);
    await page.getByRole("button", { name: "All work", exact: true }).click();
    await page
      .getByRole("link", { name: "Browse software projects", exact: true })
      .click();
    assert.ok(page.url().endsWith("#software-projects"));
    await page
      .getByRole("heading", { name: "More software & tools", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Web & UI", exact: true }).click();
    assert.equal(await page.locator(".project-card").count(), 1);
    await page
      .getByRole("heading", { name: "ProjectVite", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "All work", exact: true }).click();

    await page
      .getByRole("button", { name: "Save Abraxius Workspace", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Save Aquatica Observatory", exact: true })
      .click();
    await page.getByRole("tab", { name: /^Saved/ }).click();
    assert.equal(await page.locator(".project-card").count(), 2);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(
      await page.locator(".project-card").count(),
      2,
      "Software and game saves must survive reload",
    );
    await page
      .getByRole("button", { name: "Unsave Abraxius Workspace", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Unsave Aquatica Observatory", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Keep a project for later" })
      .waitFor();
    await page.getByRole("tab", { name: /^Projects/ }).click();

    const trigger = page.getByRole("button", {
      name: "View Aquatica Observatory project",
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    assert.equal(await dialog.locator(".contribution-list li").count(), 3);
    assert.equal(
      await page.evaluate(() => document.body.style.overflow),
      "hidden",
    );
    for (let index = 0; index < 8; index++) {
      await page.keyboard.press("Tab");
      assert.ok(
        await page.evaluate(() =>
          document.querySelector("dialog").contains(document.activeElement),
        ),
        "Dialog focus escaped",
      );
    }
    if (width === 1440) {
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        audit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
        "Dialog accessibility",
      );
      await page.screenshot({ path: ".preview/profile-dialog.png" });
    }
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.ok(
      await trigger.evaluate((el) => el === document.activeElement),
      "Close must restore focus",
    );
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
    await trigger.click();
    await page
      .getByRole("button", { name: "Next project: Samurai DUELS", exact: true })
      .click();
    await dialog
      .getByRole("heading", { name: "Samurai DUELS", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Close project", exact: true })
      .click();

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
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });

    await page.getByRole("tab", { name: "Experience", exact: true }).click();
    await page
      .getByRole("heading", { name: "Experience", exact: true })
      .waitFor();
    assert.equal(await page.locator(".skills-list article").count(), 5);
    await page.keyboard.press("ArrowRight");
    await page.getByRole("heading", { name: "Nerve", exact: true }).waitFor();
    assert.equal(await page.locator(".software-card").count(), 9);
    await page.getByText("Fork development", { exact: true }).waitFor();
    assert.equal(
      await page.getByText("Merged contribution", { exact: true }).count(),
      2,
    );
    await page.getByRole("button", { name: "Save Gojo", exact: true }).click();
    assert.ok(page.url().endsWith("#source"));
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Nerve", exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Unsave Gojo", exact: true })
      .waitFor();
    await page.getByRole("tab", { name: /^Saved/ }).click();
    assert.equal(
      await page.locator(".project-card").count(),
      1,
      "A source-panel save appears in Saved",
    );
    await page.getByRole("heading", { name: "Gojo", exact: true }).waitFor();
    await page.getByRole("tab", { name: "Open source", exact: true }).click();
    await page.getByRole("tab", { name: /^Projects/ }).click();
    await page.goBack({ waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Nerve", exact: true }).waitFor();
    if (width < 700) {
      await page
        .getByRole("navigation", { name: "Mobile navigation" })
        .getByRole("button", { name: "Experience", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Experience", exact: true })
        .waitFor();
    }
    await page.getByRole("tab", { name: /^Projects/ }).click();

    await page
      .getByRole("button", { name: "Copy Discord username velumix" })
      .click();
    await page.getByText("Username copied!", { exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      "velumix",
    );
    await page.evaluate(() => {
      navigator.clipboard.writeText = async () => {
        throw new Error("Test clipboard failure");
      };
    });
    await page
      .getByRole("button", { name: "Copy Discord username velumix" })
      .click();
    await page
      .getByText(
        "Couldn’t copy automatically. My Discord username is velumix.",
        { exact: true },
      )
      .waitFor();

    if ([390, 1024, 1440].includes(width)) {
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        audit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
        `Accessibility at ${width}px`,
      );
    }
    if (width === 1440) {
      await page.getByRole("button", { name: "Switch to light mode" }).click();
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(
        await page.locator("html").getAttribute("data-theme"),
        "light",
      );
      await page.getByRole("button", { name: "Switch to dark mode" }).click();
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(
        await page.locator("html").getAttribute("data-theme"),
        "dark",
      );
    }
    for (const img of await page.locator("main img").all())
      await img.scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      [...document.querySelectorAll("main img")].every(
        (img) => img.complete && img.naturalWidth > 0,
      ),
    );
    assert.deepEqual(errors, [], `Browser errors at ${width}px`);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    if (width === 390 || width === 1440) {
      const name = width === 390 ? "mobile" : "desktop";
      await page.screenshot({
        path: `.preview/profile-${name}.png`,
        fullPage: true,
      });
      await page.screenshot({ path: `.preview/profile-${name}-screen.png` });
    }
    console.log(
      `PASS ${width}px: dark default, search, filters, layouts, saved persistence, tabs, history, modal, gallery, clipboard, loaded artwork${[390, 1024, 1440].includes(width) ? ", accessibility" : ""}`,
    );
    await context.close();
  }
} finally {
  await browser.close();
  await site.close();
}
