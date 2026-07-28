import { chromium } from "playwright-core"
import fs from "node:fs"
import http from "node:http"
import path from "node:path"

let server
let siteUrl = process.env.PORTFOLIO_URL?.replace(/\/$/, "")

if (!siteUrl) {
  const root = path.resolve("pages-dist")
  const contentTypes = {
    ".css": "text/css",
    ".html": "text/html",
    ".js": "text/javascript",
    ".json": "application/json",
    ".xml": "application/xml",
  }

  server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname)
    let filePath = path.resolve(root, pathname.replace(/^\/+/, ""))

    if (!filePath.startsWith(root)) {
      response.writeHead(403).end()
      return
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html")
    }
    if (!fs.existsSync(filePath)) {
      response.writeHead(404).end()
      return
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] ?? "application/octet-stream",
    })
    fs.createReadStream(filePath).pipe(response)
  })

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  siteUrl = `http://127.0.0.1:${address.port}`
}

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
})

const checks = [
  {
    path: "/observatory/docs/intro/",
    heading: "Aquatica Observatory",
  },
  {
    path: "/observatory/api/StoreService/",
    heading: "StoreService",
  },
]

let failed = false

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 1000 },
]) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  })

  for (const check of checks) {
    const page = await context.newPage()
    const consoleErrors = []
    const failedResponses = []
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text())
      }
    })
    page.on("response", (response) => {
      if (response.status() >= 400) {
        failedResponses.push(`${response.status()} ${response.url()}`)
      }
    })

    const response = await page.goto(`${siteUrl}${check.path}`, { waitUntil: "networkidle" })
    const report = await page.evaluate((expectedHeading) => {
      const heading = document.querySelector("h1")
      return {
        heading: heading?.textContent?.trim() ?? "",
        headingMatches: heading?.textContent?.includes(expectedHeading) ?? false,
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      }
    }, check.heading)

    const passed =
      response?.status() === 200 &&
      report.headingMatches &&
      report.documentWidth <= report.viewportWidth &&
      failedResponses.length === 0

    console.log(
      `${viewport.name} ${check.path}`,
      JSON.stringify({
        status: response?.status(),
        ...report,
        consoleErrors,
        failedResponses,
      }),
    )

    if (!passed) {
      failed = true
    }
    await page.close()
  }

  await context.close()
}

await browser.close()
if (server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
}

if (failed) {
  process.exit(1)
}
