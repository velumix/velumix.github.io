import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});

for (const viewport of [
  { name: "mobile", width: 390, height: 1000 },
  { name: "laptop", width: 1536, height: 790 },
  { name: "desktop", width: 1440, height: 1000 },
]) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  await context.addInitScript(() => sessionStorage.clear());
  const page = await context.newPage();

  await page.goto("http://localhost:3005", { waitUntil: "networkidle" });
  const introPresent = await page.locator(".site-intro").isVisible().catch(() => false);
  if (viewport.name === "desktop" && introPresent) {
    await page.screenshot({ path: "intro-playwright.png" });
  }
  await page.locator(".site-intro").waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  const popupPromise = context.waitForEvent("page", { timeout: 5000 }).catch(() => null);
  await page.locator(".nav-cta").click();
  const discordPage = await popupPromise;
  const discordToastWorks = await page.locator(".discord-toast.visible").isVisible().catch(() => false);
  if (discordPage) await discordPage.close();
  const heroButtons = page.locator(".hero-selector button");
  await heroButtons.nth(2).click();
  const heroSwitchWorks = (await page.locator(".hero-game-caption h2").textContent())?.includes("Samurai") ?? false;
  await heroButtons.first().click();
  await page.locator(".roblox-media-card").first().scrollIntoViewIfNeeded();
  await page.locator(".roblox-media-card").first().getByRole("tab", { name: "My engineering" }).click();
  const engineeringPanelVisible = await page.locator(".roblox-media-card").first().locator(".code-snapshot").isVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  if (viewport.name !== "mobile") {
    await page.screenshot({ path: `hero-${viewport.name}-playwright.png` });
  }

  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < pageHeight; y += Math.max(500, Math.floor(viewport.height * .7))) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(45);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(180);

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
      viewport: window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      overflowing,
    };
  });
  report.introPresent = introPresent;
  report.discordToastWorks = discordToastWorks;
  report.heroSwitchWorks = heroSwitchWorks;
  report.engineeringPanelVisible = engineeringPanelVisible;

  await page.screenshot({ path: `${viewport.name}-playwright.png`, fullPage: true });
  console.log(viewport.name, JSON.stringify(report));
  await context.close();
}
await browser.close();
