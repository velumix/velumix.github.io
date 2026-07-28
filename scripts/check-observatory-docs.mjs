import fs from "node:fs"
import path from "node:path"

const root = path.resolve("pages-dist")
const docsRoot = path.join(root, "observatory")

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(entryPath) : [entryPath]
  })
}

function resolves(publicPath) {
  const pathname = decodeURIComponent(publicPath.split(/[?#]/)[0])
  const relativePath = pathname.replace(/^\/+/, "")
  const candidate = path.join(root, relativePath)

  return [
    candidate,
    `${candidate}.html`,
    path.join(candidate, "index.html"),
  ].some((filePath) => fs.existsSync(filePath))
}

const requiredPages = [
  path.join(docsRoot, "index.html"),
  path.join(docsRoot, "docs", "intro", "index.html"),
  path.join(docsRoot, "docs", "networking", "index.html"),
  path.join(docsRoot, "api", "StoreService", "index.html"),
]

const missingRequired = requiredPages.filter((filePath) => !fs.existsSync(filePath))
const htmlFiles = walk(docsRoot).filter((filePath) => filePath.endsWith(".html"))
const broken = []

for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(htmlFile, "utf8")
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const reference = match[1]
    if (reference.startsWith("/observatory/") && !resolves(reference)) {
      broken.push({
        page: path.relative(root, htmlFile).replaceAll("\\", "/"),
        reference,
      })
    }
  }
}

if (missingRequired.length > 0 || broken.length > 0) {
  console.error("Observatory docs check failed.")
  for (const filePath of missingRequired) {
    console.error(`Missing: ${path.relative(root, filePath)}`)
  }
  for (const issue of broken.slice(0, 50)) {
    console.error(`${issue.page} -> ${issue.reference}`)
  }
  process.exit(1)
}

console.log(`Checked ${htmlFiles.length} Observatory pages. No broken local links or assets found.`)
