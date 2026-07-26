# Velumix

Portfolio for a Roblox gameplay engineer and software engineer. The public site
is deployed at [velumix.github.io](https://velumix.github.io/).

## Local development

```bash
npm install
npm run dev
```

Build the static GitHub Pages version with fresh Roblox experience data:

```bash
npm run build:pages
```

The Pages workflow refreshes Roblox media and statistics on GitHub's five-minute
schedule, then deploys the generated `pages-dist` artifact. Scheduled runs can
occasionally be delayed by GitHub Actions load.
