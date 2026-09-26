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
npm run check          # Profile API tests, TypeScript, build, and documentation links
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
- `src/components/profile/`: profile header, Roblox showcase, project collections, and Experience/Open source panels.
- `src/styles.css`: design tokens, layouts, and responsive styles.

Project metrics describe the whole experience, not sole authorship. Each project panel explains the specific contribution. The Discord profile link and username-copy button are separate; clipboard errors are reported without claiming a successful copy.

The default overview leads with Roblox, followed by software, contributions, and past projects. Abraxius and ProjectVite are marked as past work. The ProjectVite image is a screenshot of its actual public browser preview, not a mockup.

The interface opens in dark mode. Profile tabs use URL fragments, so browser back/forward and direct links work. Search matches project names, contributions, and skills. Bookmarks and appearance preferences are stored locally on the current device; they do not require an account. Browser checks cover these interactions, responsive layouts, keyboard navigation, dialog focus, and accessibility.

## GitHub and Discord profiles

Account identities are configured in `src/data/social-accounts.json`. Run `npm run fetch:profiles` to retrieve public profile information and download the actual avatars into `public/images/profiles/`. The resulting `public/data/social-profiles.json` records each source and successful fetch time. GitHub cards show the API's display name, username, bio, public repository count, and follower count. Discord cards show the returned display name, username, avatar, and banner when available. The custom Velumix logo remains the site's branding.

GitHub's public user endpoint works without authentication locally. The Pages workflow uses its existing `GITHUB_TOKEN`. Discord requires one of these configurations:

- **Official Discord API:** add a bot token as the `DISCORD_BOT_TOKEN` [repository Actions secret](https://github.com/velumix/velumix.github.io/settings/secrets/actions). The build calls Discord's Get User endpoint for the configured user ID. Never use a personal account token or expose a bot token through a `VITE_` variable.
- **Lanyard:** join [the Lanyard server](https://discord.gg/lanyard) with the configured Discord account. This opts the account into Lanyard's public profile and presence API. The portfolio consumes only identity and avatar information, not activity or presence. Lanyard is used when no bot token is configured.

The Pages workflow refreshes profiles on each deployment and on its scheduled runs. Browsers check the published snapshot every five minutes and when returning to the tab; this is scheduled API data, not a real-time presence feed. A failed provider refresh preserves its existing local snapshot and original timestamp. Fresh CI checkouts fall back to the checked-in snapshot. Without a verified Discord snapshot, the site shows a platform icon and profile link, and hides the username-copy action. No username, avatar, or online status is invented.

## Deployment

`npm run build` produces **dist/**. `build:pages` is an alias for the same build. The GitHub Pages workflow refreshes metadata on its existing schedule, then builds, checks, and publishes `dist/`. If Roblox is unavailable, it builds with the checked-in snapshot.

The complete Observatory documentation stays in `public/observatory/` and ships unchanged at `/observatory/`, including nested documentation and API URLs. Root-relative links assume deployment at the domain root, as on `velumix.github.io`.

For the existing Coolify deployment, the Dockerfile builds the same static site and serves it with Nginx on port 3000. `compose.server.yml` keeps the existing routing and network configuration.

[velumix.github.io](https://velumix.github.io/)
