# Velumix

Software engineering portfolio covering native apps, developer tools, web interfaces, open-source contributions, and games. Built with **Vite, React, and TypeScript**, with self-hosted fonts, local project artwork, and plain CSS.

## Development

Use Node.js 22.12+ (Node 24 recommended).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

```sh
npm run check          # TypeScript, production build, and Observatory link checks
npm run check:browser  # Desktop/mobile interaction and layout checks against dist
npm run check:observatory-browser
npm run preview        # Serve the production build locally
```

Browser checks use an installed Chrome, Edge, Brave, or Chromium. Set `BROWSER_PATH` to override automatic detection. Screenshots go to `.preview/` (ignored by Git). Set `PORTFOLIO_URL` to test an already-running server instead of the production build.

## Content

- `src/data/work.ts`: the complete portfolio catalog, filters, software projects, contributions, and experience areas.
- `docs/portfolio-sources.md`: public source evidence and attribution boundaries for that catalog.
- `src/data/projects.ts`: Roblox project ordering, descriptions, and snapshot metrics.
- `src/data/engineering.ts`: roles, contributions, and technical details.
- `src/data/roblox-media.json`: dated Roblox metadata snapshot bundled with the app. Run `npm run fetch:roblox` to refresh it before building; normal builds work without Roblox API access.
- `public/images/`: project artwork saved from the original portfolio’s Roblox media. Refresh artwork separately when a project’s visuals change.
- `src/App.tsx`: profile navigation, search, saved projects, and theme preferences.
- `src/components/profile/`: profile header, information sidebar, mixed project feed, and Experience/Open source panels.
- `src/styles.css`: design tokens, layouts, and responsive styles.

Project metrics describe the whole experience, not sole authorship. Each project panel explains the specific contribution. The Discord profile link and username-copy button are separate; clipboard errors are reported without claiming a successful copy.

The interface opens in dark mode. Profile tabs use URL fragments, so browser back/forward and direct links work. Search matches project names, contributions, and skills. Bookmarks and appearance preferences are stored locally on the current device; they do not require an account. Browser checks cover these interactions, responsive layouts, keyboard navigation, dialog focus, and accessibility.

## Deployment

`npm run build` produces **dist/**. `build:pages` is an alias for the same build. The GitHub Pages workflow refreshes metadata on its existing schedule, then builds, checks, and publishes `dist/`. If Roblox is unavailable, it builds with the checked-in snapshot.

The complete Observatory documentation stays in `public/observatory/` and ships unchanged at `/observatory/`, including nested documentation and API URLs. Root-relative links assume deployment at the domain root, as on `velumix.github.io`.

For the existing Coolify deployment, the Dockerfile builds the same static site and serves it with Nginx on port 3000. `compose.server.yml` keeps the existing routing and network configuration.

[velumix.github.io](https://velumix.github.io/)
